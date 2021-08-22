const fs = require('fs');
const pt = require('path');
const isClass = require('is-class');
const isFile = (path) => {return fs.existsSync(path) && fs.statSync(path).isFile();}
const isDir = (path) => {return fs.existsSync(path) && fs.statSync(path).isDirectory();}

const dirs = {};

function loader(dir='./', ...args) {
    const _maps = new Map();
    const _root = {};
    _maps.set(_root, {
        path: pt.isAbsolute(dir) ? pt.join(dir, './') : pt.join(pt.dirname(module.parent.filename), dir, './'),
        is_class: false
    });
    return creatLoader(_root);

    function creatLoader(obj) {
        return new Proxy(obj, {
            get: (target, prop) => {
                if(prop in target || typeof prop == 'symbol' || prop == 'inspect'){
                    return target[prop];
                }
                const map = _maps.get(target);
                if(map.is_class){
                    if(!map.instance){
                        map.instance = new target(...args);
                    }
                    return map.instance[prop] ? map.instance[prop] : (prop == '$map' ? map : map.instance[prop]);
                }
                if(prop == '$map'){
                    return map;
                }
                let child = {};
                const child_path = map.path + prop + '/';
                const child_file = map.path + prop + '.js';
                if(!dirs[child_path]){
                    if(isFile(child_file)){
                        dirs[child_path] = 'file';
                    }else if(isDir(child_path)){
                        dirs[child_path] = 'dir';
                    }else{
                        dirs[child_path] = 'none';
                    }
                }
                if(dirs[child_path] == 'file'){
                    child = require(child_file);
                }else if(dirs[child_path] != 'dir'){
                    return undefined;
                }
                _maps.set(child, {
                    path: child_path,
                    is_class: isClass(child)
                });
                target[prop] = creatLoader(child);
                return target[prop];
            },
            set: (target, prop, value) => {
                if(prop in target){
                    target[prop] = value;
                    return true;
                }
                const map = _maps.get(target);
                if(map.is_class){
                    if(!map.instance){
                        map.instance = new target(...args);
                    }
                    map.instance[prop] = value;
                    return true;
                }
                target[prop] = value;
                return true;
            }
        });
    }
}

module.exports = loader;
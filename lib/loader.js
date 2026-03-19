const pt = require('path');
const isClass = require('is-class');
const {isFileSync, isDirSync} = require('./utils/fs');

const typeStore = {};

function loader(dir='./', ...args) {
    // @ts-ignore
    dir = pt.isAbsolute(dir) ? dir : pt.join(pt.dirname(module.parent.filename), dir);
    const dirPath = pt.join(dir, './');
    let dirType = isFileSync(dir + '.js') ? 'file' : isFileSync(dir + '.json') ? 'json' : 'dir';
    const node = dirType == 'dir' ? {} : require(dir);
    // @ts-ignore
    if(dirType == 'file' && isClass(node)) {
        dirType = 'class';
    }
    const infoStore = new Map();
    infoStore.set(node, {
        path: dirPath,
        type: dirType
    });
    return creatLoader(node);

    function creatLoader(node) {
        return new Proxy(node, {
            get: (node, prop, receiver) => {
                if(prop in node || typeof prop == 'symbol' || prop == 'inspect') {
                    return Reflect.get(node, prop, receiver);
                }
                const nodeInfo = infoStore.get(node);
                if(nodeInfo.type == 'class') {
                    if(!nodeInfo.instance) {
                        nodeInfo.instance = new node(...args);
                    }
                    return prop in nodeInfo.instance ? nodeInfo.instance[prop] : (prop == '__node' ? nodeInfo : nodeInfo.instance[prop]);
                } else if(prop == '__node') {
                    return nodeInfo;
                }

                let _node = {};
                const _nodePath = nodeInfo.path + prop + '/';
                const _nodeFile = nodeInfo.path + prop + '.js';
                const _nodeJson = nodeInfo.path + prop + '.json';
                let _nodeType = typeStore[_nodePath];
                if(!typeStore[_nodePath]) {
                    _nodeType = isFileSync(_nodeFile) ? 'file' : isFileSync(_nodeJson) ? 'json' : isDirSync(_nodePath) ? 'dir'
                    : ''; // 为空时不缓存
                    // @ts-ignore
                    if(_nodeType == 'file' && isClass(require(_nodeFile))) {
                        _nodeType = 'class';
                    }
                    typeStore[_nodePath] = _nodeType;
                }
                if(_nodeType == 'file' || _nodeType == 'class') {
                    _node = require(_nodeFile);
                } else if(_nodeType == 'json') {
                    _node = require(_nodeJson);
                } else if(_nodeType != 'dir') {
                    node[prop] = undefined;
                    return node[prop];
                }
                infoStore.set(_node, {
                    path: _nodePath,
                    type: _nodeType
                });
                node[prop] = creatLoader(_node);
                return node[prop];
            },
            set: (_node, prop, value) => {
                if(prop in node) {
                    node[prop] = value;
                    return true;
                }
                const nodeInfo = infoStore.get(_node);
                if(nodeInfo.type == 'class') {
                    if(!nodeInfo.instance) {
                        nodeInfo.instance = new node(...args);
                    }
                    nodeInfo.instance[prop] = value;
                    return true;
                }
                node[prop] = value;
                return true;
            }
        });
    }
}

module.exports = loader;
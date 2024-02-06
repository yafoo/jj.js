const pt = require('path');
const isClass = require('is-class');
const {isFileSync, isDirSync} = require('./utils/fs');

const nodeType = {};

function loader(dir='./', ...args) {
    // @ts-ignore
    dir = pt.isAbsolute(dir) ? dir : pt.join(pt.dirname(module.parent.filename), dir);
    const dirPath = pt.join(dir, './');
    const dirType = isFileSync(dir + '.js') ? 'file' : 'dir';
    const node = dirType == 'file' ? require(dir) : {};
    const info = new Map();
    info.set(node, {
        path: dirPath,
        nodeType: dirType,
        // @ts-ignore
        isClass: isClass(node)
    });
    return creatLoader(node);

    function creatLoader(node) {
        return new Proxy(node, {
            get: (node, prop, receiver) => {
                if(prop in node || typeof prop == 'symbol' || prop == 'inspect') {
                    return Reflect.get(node, prop, receiver);
                }
                const nodeInfo = info.get(node);
                if(nodeInfo.isClass) {
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
                if(!nodeType[_nodePath]) {
                    if(isFileSync(_nodeFile)) {
                        nodeType[_nodePath] = 'file';
                    } else if(isDirSync(_nodePath)) {
                        nodeType[_nodePath] = 'dir';
                    } else{
                        nodeType[_nodePath] = 'none';
                    }
                }
                if(nodeType[_nodePath] == 'file') {
                    _node = require(_nodeFile);
                } else if(nodeType[_nodePath] != 'dir') {
                    node[prop] = undefined;
                    return node[prop];
                }
                info.set(_node, {
                    path: _nodePath,
                    nodeType: nodeType[_nodePath],
                    // @ts-ignore
                    isClass: isClass(_node)
                });
                node[prop] = creatLoader(_node);
                return node[prop];
            },
            set: (_node, prop, value) => {
                if(prop in node) {
                    node[prop] = value;
                    return true;
                }
                const nodeInfo = info.get(_node);
                if(nodeInfo.isClass) {
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
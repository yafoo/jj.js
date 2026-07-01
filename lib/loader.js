const pt = require('path');
/** @type {function} */
// @ts-ignore
const isClass = require('is-class');
const {isFileSync, isDirSync} = require('./utils/fs');

/**
 * @typedef {import('../types').NodeType} NodeType
 * @typedef {import('../types').NodeInfo} NodeInfo
 * @typedef {import('../types').ClassNode} ClassNode
 * @typedef {import('../types').ObjectNode} ObjectNode
 * @typedef {import('../types').Node} Node
 */

/**
 * @type {Map<string, NodeType>}
 */
const typeStore = new Map();

/**
 * nodejs模块（‌CommonJS）自动加载器
 * @param {string} path 根目录，需为绝对路径，最后不带斜杠
 * @param {...any} args class自动实例化时的构造参数
 * @return {Node}
 */
function loader(path, ...args) {
    const dir = pt.normalize(path).replace(/[\/\\]+$/, '');
    const dirPath = pt.join(dir, './');
    /** @type {NodeType} */
    let dirType = isFileSync(dir + '.js') ? 'file' : isFileSync(dir + '.json') ? 'json' : 'dir';
    const node = dirType == 'dir' ? {} : require(dir);
    
    if(dirType == 'file' && isClass(node)) {
        dirType = 'class';
    }
    /** @type {Map<object, NodeInfo>} */
    const infoStore = new Map();
    infoStore.set(node, {
        path: dirPath,
        type: dirType
    });
    return creatLoader(node);

    /**
     * 创建代理对象
     * @param {ClassNode & ObjectNode} node - 类型仅为防报错
     * @return {Node} - 节点
     */
    function creatLoader(node) {
        // @ts-ignore
        return new Proxy(node, {
            get: (node, prop, receiver) => {
                if(prop in node || typeof prop == 'symbol' || prop == 'inspect') {
                    return Reflect.get(node, prop, receiver);
                }

                /** @type {NodeInfo} */
                // @ts-ignore
                const nodeInfo = infoStore.get(node);
                if(nodeInfo.type == 'class') {
                    if(!nodeInfo.instance) {
                        nodeInfo.instance = new node(...args);
                    }
                    // @ts-ignore
                    return prop in nodeInfo.instance ? nodeInfo.instance[prop] : prop == '__NODE__' ? nodeInfo : prop == '__ISCLASS__' ? true : nodeInfo.instance[prop];
                } else if(prop == '__NODE__') {
                    return nodeInfo;
                } else if(prop == '__ISCLASS__') {
                    return false;
                }

                const _nodePath = nodeInfo.path + prop + pt.sep;
                const _nodeFile = nodeInfo.path + prop + '.js';
                const _nodeJson = nodeInfo.path + prop + '.json';
                let _nodeType = typeStore.get(_nodePath);
                if(_nodeType === undefined) {
                    _nodeType = isFileSync(_nodeFile) ? 'file' : isFileSync(_nodeJson) ? 'json' : isDirSync(_nodePath) ? 'dir' : '';
                    if(_nodeType == 'file' && isClass(require(_nodeFile))) {
                        _nodeType = 'class';
                    }
                    typeStore.set(_nodePath, _nodeType);
                }
                let _node = {};
                if(_nodeType == '') {
                    return undefined; // 直接返回
                } else if(_nodeType == 'file' || _nodeType == 'class') {
                    _node = require(_nodeFile);
                } else if(_nodeType == 'json') {
                    _node = require(_nodeJson);
                }
                infoStore.set(_node, {
                    path: _nodePath,
                    type: _nodeType
                });
                // @ts-ignore
                return node[prop] = creatLoader(_node); // 代理，并缓存
            },
            set: (node, prop, value, receiver) => {
                if(prop in node || typeof prop == 'symbol' || prop == 'inspect') {
                    return Reflect.set(node, prop, value, receiver);
                }

                /** @type {NodeInfo} */
                // @ts-ignore
                const nodeInfo = infoStore.get(node);
                if(nodeInfo.type == 'class') {
                    if(!nodeInfo.instance) {
                        nodeInfo.instance = new node(...args);
                    }
                    // @ts-ignore
                    return Reflect.set(nodeInfo.instance, prop, value, nodeInfo.instance);
                }

                return Reflect.set(node, prop, value, receiver);
            },
            has: (node, prop) => {
                if(prop in node || typeof prop == 'symbol' || prop == 'inspect') {
                    return prop in node;
                }

                /** @type {NodeInfo} */
                // @ts-ignore
                const nodeInfo = infoStore.get(node);
                if(nodeInfo.type == 'class') {
                    if(!nodeInfo.instance) {
                        nodeInfo.instance = new node(...args);
                    }
                    return prop in nodeInfo.instance;
                } else if(nodeInfo.type == 'dir') {
                    return node[prop] !== undefined;
                }

                return prop in node;
            },
        });
    }
}

module.exports = loader;
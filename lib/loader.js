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
 * 节点类型缓存
 * @type {Map<string, NodeType>}
 */
const typeStore = new Map();

/**
 * 获取节点类型
 * @param {string} path - 节点路径，最后不带斜杠
 * @returns {NodeType}
 */
const getNodeType = path => {
    const _nodePath = path + pt.sep;
    const _nodeFile = path + '.js';
    const _nodeJson = path + '.json';
    let _nodeType = typeStore.get(_nodePath);
    if(_nodeType === undefined) {
        _nodeType = isFileSync(_nodeFile) ? 'file' : isFileSync(_nodeJson) ? 'json' : isDirSync(_nodePath) ? 'dir' : '';
        if(_nodeType == 'file' && isClass(require(_nodeFile))) {
            _nodeType = 'class';
        }
        typeStore.set(_nodePath, _nodeType);
    }
    return _nodeType;
}

/**
 * 
 * @param {NodeType} type - 节点类型
 * @param {string} path - 节点路径，最后不带斜杠
 * @returns {object} - 节点
 */
const getNode = (type, path) => {
    if(!type) return undefined;
    return type == 'file' || type == 'class' ? require(path + '.js') : type == 'json' ? require(path + '.json') : {};
}

/**
 * nodejs模块（‌CommonJS）自动加载器
 * @param {string} path 根目录，需为绝对路径，最后不带斜杠
 * @param {...any} args class自动实例化时的构造参数
 * @return {Node}
 */
function loader(path, ...args) {
    const dirPath = pt.normalize(path).replace(/[\/\\]+$/, '');
    const dirType = getNodeType(dirPath);
    if(dirType == '') return undefined;
    const node = getNode(dirType, dirPath);

    /** @type {Map<object, NodeInfo>} */
    const infoStore = new Map();
    infoStore.set(node, {
        path: dirPath + pt.sep,
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

                const _childPath = nodeInfo.path + prop;
                const _childType = getNodeType(_childPath);
                if(_childType == '') return undefined; // 直接返回
                const _node = getNode(_childType, _childPath);
                infoStore.set(_node, {
                    path: _childPath + pt.sep,
                    type: _childType
                });
                // @ts-ignore
                return node[prop] = creatLoader(_node); // 代理，并缓存
            },
            set: (node, prop, value, receiver) => {
                if(prop in node || typeof prop == 'symbol' || prop == 'inspect') {
                    return Reflect.set(node, prop, value, receiver);
                }

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

                const nodeInfo = infoStore.get(node);
                if(nodeInfo.type == 'class') {
                    if(!nodeInfo.instance) {
                        nodeInfo.instance = new node(...args);
                    }
                    return prop in nodeInfo.instance;
                } else if(nodeInfo.type == 'dir') {
                    const _childPath = nodeInfo.path + prop;
                    const _childType = getNodeType(_childPath);
                    return _childType !== '';
                }

                return prop in node;
            },
        });
    }
}

module.exports = loader;
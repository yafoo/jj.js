// @ts-nocheck
const storage = require('./storage');

/**
 * 开发jj.js库本身时，可以设置为import('../types')
 * @type {typeof import('../../../types')}
 */
const Ctx = new Proxy(class {}, {
        construct() {
            return new Proxy({__proto__: arguments[2].prototype}, {
                get: (target, $prop, receiver) => {
                    if($prop in target || typeof $prop == 'symbol' || $prop == 'inspect') {
                        return Reflect.get(target, $prop, receiver);
                    }

                    const store = storage.getStore();
                    const $ = store.$;
                    const _ = store._;
                    if($prop == '$' || $prop == '_') {
                        return store[$prop];
                    }
                    if($prop.slice(0, 1) != '$') {
                        return undefined;
                    }

                    const prop = $prop.slice(1);
                    const APP = store.APP;
                    const COMMON = store.COMMON;

                    // 缓存
                    if(_[APP][$prop] === undefined) {
                        if(_[APP][prop] && _[COMMON] && _[COMMON][prop]) {
                            _[APP][$prop] = new Proxy({}, {
                                get: (...args) => {
                                    return _[APP][prop][args[1]] || _[COMMON][prop][args[1]];
                                }
                            });
                        } else if(_[APP][prop]) {
                            _[APP][$prop] = _[APP][prop];
                        } else if(_[COMMON] && _[COMMON][prop]) {
                            _[APP][$prop] = _[COMMON][prop];
                        } else {
                            _[APP][$prop] = null;
                        }
                        // lib调用，防止覆盖
                        if(['logger', 'pagination', 'response', 'url', 'view'].includes(prop) && _[APP][$prop] && _[APP][$prop].__node && !_[APP][$prop].__node.isClass && $[prop]) {
                            _[APP][$prop] = $[prop];
                        }
                    }

                    // 屏蔽部分lib
                    return _[APP][$prop] || _[prop] || (!['app', 'loader', 'router', 'run', 'storage', 'types'].includes(prop) && $[prop]) || undefined;
                }
            });
        }
});

module.exports = Ctx;
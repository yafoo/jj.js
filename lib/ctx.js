// @ts-nocheck
const storage = require('./storage');
// 允许$访问的系统类库
const libs = ['ctx', 'context', 'cache', 'cookie', 'db', 'logger', 'middleware', 'model', 'pagination', 'request', 'response', 'upload', 'url', 'view', 'utils', 'config'];

/**
 * 开发jj.js库本身时，需改为import('../types')
 * @type {typeof import('../types')}
 * type {typeof import('../../../types')}
 */
const Ctx = new Proxy(class Ctx {}, {
        construct() {
            return new Proxy({__proto__: arguments[2].prototype}, {
                get: (target, $prop, receiver) => {
                    if($prop in target || typeof $prop == 'symbol' || $prop == 'inspect' || $prop == 'ctx' || $prop == '$next') {
                        return Reflect.get(target, $prop, receiver);
                    }

                    const store = storage.getStore();
                    if($prop == '$' || $prop == '_') {
                        return store[$prop];
                    }
                    if($prop.slice(0, 1) != '$') {
                        return undefined;
                    }

                    const {$, _, APP, COMMON} = store;
                    const prop = $prop.slice(1);
                    if(prop == 'config') {
                        return _[prop];
                    }

                    if(!_[APP]) {
                        return libs.includes(prop) ? $[prop] : undefined;
                    }

                    if(!_[APP][prop] && !(_[COMMON] && _[COMMON][prop]) && !libs.includes(prop)) {
                        return undefined;
                    }

                    return _[APP][$prop] = new Proxy(function() {}, {
                        construct(target, args, newTarget) {
                            const node = _[APP][prop] && _[APP][prop].__ISCLASS__ && _[APP][prop]
                            || _[COMMON] && _[COMMON][prop].__ISCLASS__ && _[COMMON][prop]
                            || libs.includes(prop) && $[prop].__ISCLASS__ && $[prop]
                            || undefined;
                            return node ? Reflect.construct(node, args, newTarget) : undefined;
                        },
                        get: (...args) => {
                            return res = _[APP][prop] && _[APP][prop][args[1]]
                            || _[COMMON] && _[COMMON][prop][args[1]]
                            || libs.includes(prop) && $[prop][args[1]]
                            || undefined;
                        }
                    });
                }
            });
        }
});

module.exports = Ctx;
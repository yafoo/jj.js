// @ts-nocheck
const storage = require('./storage');
// 允许$访问的系统类库
const libs = ['ctx', 'context', 'cache', 'cookie', 'db', 'logger', 'middleware', 'model', 'pagination', 'request', 'response', 'upload', 'url', 'view', 'utils', 'config'];

/**
 * 开发jj.js库本身时，需改为import('../types')
 * type {typeof import('../types')}
 * @type {typeof import('../../../types')}
 */
const Ctx = new Proxy(class Ctx {
    _setDeep(mod) {
        this.DEEP = mod.path;
    }
}, {
    construct() {
        return new Proxy({__proto__: arguments[2].prototype}, {
            get: (target, $prop, receiver) => {
                if($prop in target || typeof $prop == 'symbol' || $prop == 'inspect' || $prop == 'ctx' || $prop == '$next' || $prop == 'DEEP') {
                    return Reflect.get(target, $prop, receiver);
                }

                const store = storage.getStore();
                if($prop == '$' || $prop == '$$') {
                    return store[$prop];
                }
                if($prop.slice(0, 1) != '$') {
                    return undefined;
                }

                const {$, $$, DEEP} = store;
                const prop = $prop.slice(1);

                const DEEPS = (target.DEEP !== undefined ? target.DEEP : DEEP).split('/').filter(Boolean);
                const $nodes = [];

                if($$[prop]) $nodes.push($$[prop]);

                DEEPS.reduce((node, deep) => {
                    if(!node) return;
                    if(node[deep] && node[deep][prop]) $nodes.push(node[deep][prop]);
                    return node[deep];
                }, $$);

                if(!libs.includes(prop) && !$nodes.length) return undefined;

                return target[$prop] = new Proxy(function() {}, {
                    construct(target, args, newTarget) {
                        const node = $nodes.reverse().find(node => node.__ISCLASS__)
                        || libs.includes(prop) && $[prop].__ISCLASS__ && $[prop]
                        || undefined;
                        return node ? Reflect.construct(node, args, newTarget) : undefined;
                    },
                    get: (...args) => {
                        const node = $nodes.find(node => node[args[1]]);
                        return node ? node[args[1]]
                        : (libs.includes(prop) && $[prop][args[1]]
                        || undefined);
                    }
                });
            }
        });
    }
});

module.exports = Ctx;
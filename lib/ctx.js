// @ts-nocheck
const storage = require('./storage');
const path = require('path');
const {app: cfg_app} = require('./config');
const libs = require('./utils/libs').filter(lib => lib != 'config'); //排除config
const {pathToDeep} = require('./utils/internal');

/**
 * 开发jj.js库本身时，需改为import('../types')
 * type {typeof import('../types')}
 * @type {typeof import('../../../types')}
 */
const Ctx = new Proxy(class Ctx {
    _setDeep(mod) {
        this.DEEP = pathToDeep(path.dirname(mod.path), cfg_app.base_dir);
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

                const {$, $$, $config, DEEP} = store;
                const prop = $prop.slice(1);

                const DEEPS = (target.DEEP !== undefined ? target.DEEP : DEEP).split('/').filter(Boolean);
                const $nodes = [];

                DEEPS.reduce((node, deep) => {
                    if(!node) return;
                    if(node[deep] && node[deep][prop]) $nodes.unshift(node[deep][prop]);
                    return node[deep];
                }, $$);

                if(prop == 'config' && $config) $nodes.push($config);
                if($$ && $$[prop]) $nodes.push($$[prop]);

                if(!libs.includes(prop) && !$nodes.length) return undefined;
                if(libs.includes(prop) && !$nodes.length) return $[prop];
                if(!libs.includes(prop) && $nodes.length == 1) return $nodes[0];

                target[$prop] = new Proxy(function() {}, {
                    construct(_, args, newTarget) {
                        const node = $nodes.find(node => node.__ISCLASS__)
                        || libs.includes(prop) && $[prop].__ISCLASS__ && $[prop]
                        || undefined;
                        return node ? Reflect.construct(node, args, newTarget) : undefined;
                    },
                    get: (...args) => {
                        const node = $nodes.find(node => args[1] in node) || libs.includes(prop) && args[1] in $[prop] && $[prop] || {};
                        return Reflect.get(node, args[1], args[2]);
                    },
                    set: (...args) => {
                        const node = $nodes.find(node => args[1] in node);
                        if(node) {
                            node[args[1]] = args[2];
                        } else if(libs.includes(prop)) {
                            $[prop][args[1]] = args[2];
                        } else {
                            return false;
                        }
                        return true;
                    },
                });
                return Reflect.get(target, $prop, receiver);
            }
        });
    }
});

module.exports = Ctx;
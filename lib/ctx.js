const loader = require('./loader');

const Ctx = new Proxy(class {}, {
        construct() {
            return new Proxy({__proto__: arguments[2].prototype}, {
                get: (target, prop) => {
                    if(prop in target || typeof prop == 'symbol' || prop == 'inspect') {
                        return target[prop];
                    }
                    if(prop == '$' || prop == '_') {
                        return target.ctx && target.ctx[prop]
                            || prop == '$' && (target.$ || (target.$ = loader('../'))) && target.$
                            || undefined;
                    }
                    const pp = prop.slice(1);
                    if(target.ctx && target.ctx._) {
                        const _ = target.ctx._;
                        const ctx_app = target.ctx.APP;
                        const common_app = _.config.app.common_app;
                        const $ = target.ctx.$;
                        if(_[ctx_app][prop] === undefined) {
                            if(_[ctx_app][pp] && _[common_app] && _[common_app][pp]) {
                                _[ctx_app][prop] = new Proxy({}, {
                                    get: (...args) => {
                                        return _[ctx_app][pp][args[1]] || _[common_app][pp][args[1]];
                                    }
                                });
                            } else if(_[ctx_app][pp]) {
                                _[ctx_app][prop] = _[ctx_app][pp];
                            } else if(_[common_app] && _[common_app][pp]) {
                                _[ctx_app][prop] = _[common_app][pp];
                            } else {
                                _[ctx_app][prop] = null;
                            }
                        }
                        return _[ctx_app][prop] || _[pp] || $[pp] || undefined;
                    } else {
                        return (target.$ || (target.$ = loader('../'))) && target.$[pp];
                    }
                }
            });
        }
});

module.exports = Ctx;
const loader = require('./loader');

const Ctx = new Proxy(class {}, {
        construct() {
            return new Proxy({__proto__: arguments[2].prototype}, {
                get: (target, prop, receiver) => {
                    if(prop in target || typeof prop == 'symbol' || prop == 'inspect') {
                        return Reflect.get(target, prop, receiver);
                    }
                    if(prop == '$' || prop == '_') {
                        return target.ctx && target.ctx[prop]
                            || prop == '$' && (target.$ || (target.$ = loader('../'))) && target.$
                            || undefined;
                    }
                    if(prop.slice(0, 1) != '$') {
                        return undefined;
                    }
                    const pp = prop.slice(1);
                    const ctx = target.ctx;
                    if(ctx && ctx._) {
                        const _ = ctx._;
                        const APP = ctx.APP;
                        const COMMON = _.config.app.common_app;
                        if(_[APP][prop] === undefined) {
                            if(_[APP][pp] && _[COMMON] && _[COMMON][pp]) {
                                _[APP][prop] = new Proxy({}, {
                                    get: (...args) => {
                                        return _[APP][pp][args[1]] || _[COMMON][pp][args[1]];
                                    }
                                });
                            } else if(_[APP][pp]) {
                                _[APP][prop] = _[APP][pp];
                            } else if(_[COMMON] && _[COMMON][pp]) {
                                _[APP][prop] = _[COMMON][pp];
                            } else {
                                _[APP][prop] = null;
                            }
                            if(~['view', 'response'].indexOf(pp) && _[APP][prop] && _[APP][prop].__node && !_[APP][prop].__node.isClass && ctx.$ && ctx.$[pp]) {
                                _[APP][prop] = ctx.$[pp];
                            }
                        }
                        return _[APP][prop] || _[pp] || (ctx.$ && ctx.$[pp]) || undefined;
                    } else {
                        return (target.$ || (target.$ = loader('../'))) && target.$[pp];
                    }
                }
            });
        }
});

module.exports = Ctx;
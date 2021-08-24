const loader = require('./loader');

const Ctx = new Proxy(class {}, {
        construct() {
            return new Proxy({__proto__: arguments[2].prototype}, {
                get: (target, prop) => {
                    if(prop in target || typeof prop == 'symbol' || prop == 'inspect'){
                        return target[prop];
                    }
                    if(prop == '$' || prop == '_') {
                        return target.ctx && target.ctx[prop]
                            || prop == '$' && (target.$ || (target.$ = loader('../'))) && target.$
                            || undefined;
                    }
                    prop = prop.slice(1);
                    if(target.ctx && target.ctx._) {
                        const _ = target.ctx._;
                        const ctx_app = target.ctx.APP;
                        const common_app = _.config.app.common_app;
                        const $ = target.ctx.$;
                        return _[ctx_app] && _[ctx_app][prop]
                            || _[common_app] && _[common_app][prop]
                            || _[prop]
                            || $[prop]
                            || undefined;
                    } else {
                        return (target.$ || (target.$ = loader('../'))) && target.$[prop];
                    }
                }
            });
        }
});

module.exports = Ctx;
const loader = require('./loader');

const Ctx = new Proxy(class {}, {
        construct() {
            return new Proxy({__proto__: arguments[2].prototype}, {
                get: (target, prop) => {
                    if(prop in target || typeof prop == 'symbol' || prop == 'inspect'){
                        return target[prop];
                    }
                    if(prop.slice(0, 2) == '$$') {
                        prop = prop.slice(2);
                        return target.ctx ? target.ctx.$$ && (prop ? target.ctx.$$[prop] : target.ctx.$$)
                            : (target.$$ || (target.$$ = loader('../'))) && (prop ? target.$$[prop] : target.$$); 
                    } else if(prop.slice(0, 1) == '$' && target.ctx && target.ctx.$) {
                        prop = prop.slice(1);
                        const $ = target.ctx.$;
                        const app = target.ctx.APP;
                        const common = $.config.app.common_app;
                        return prop == '' && $
                            || $[app][prop]
                            || common != app && $[common] && $[common][prop]
                            || $[prop]
                            || undefined;
                    } else {
                        return undefined;
                    }
                }
            });
        }
});

module.exports = Ctx;
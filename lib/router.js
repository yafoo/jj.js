const router = require('@koa/router')();
const {app: cfg_app, routes: cfg_routes} = require('./config');
const Logger = require('./logger');
const run = require('./run');

// 注册用户路由
if (cfg_routes) {
    const methods = ['get', 'put', 'post', 'patch', 'delete', 'del'];
    for(let item of cfg_routes){
        if(!item.method || !~methods.indexOf(item.method)) item.method = 'all';
        if(typeof item.path === 'function'){
            router[item.method](item.url, item.path);
            continue;
        }
        const route_path = item.path.replace(/^\/|\/$/g, '');
        let paths = route_path.split('/').reverse();
        router[item.method](item.url, async (ctx, next) => {
            if(~route_path.indexOf('$')) {
                paths = route_path.replace(/\$\{(\w+)\}/g, (...args) => {
                    return ctx.params[args[1]];
                }).split('/').reverse();
            }
            ctx.APP = paths[2] || cfg_app.default_app;
            ctx.CONTROLLER = paths[1] || cfg_app.default_controller;
            ctx.ACTION = paths[0] || cfg_app.default_action;
            Logger.debug(`Router: {APP: ${ctx.APP}, CONTROLLER: ${ctx.CONTROLLER}, ACTION: ${ctx.ACTION}}`);
            await run(ctx, next, item.type);
        });
    }
}

// 注册系统路由
router.all(cfg_app.app_multi ? '/:__app?/:__controller?/:__action?' : '/:__controller?/:__action?', async (ctx, next) => {console.log(ctx.params);
    ctx.APP = ctx.params.__app || cfg_app.default_app;
    ctx.CONTROLLER = ctx.params.__controller || cfg_app.default_controller;
    ctx.ACTION = ctx.params.__action || cfg_app.default_action;
    delete ctx.params.__app;
    delete ctx.params.__controller;
    delete ctx.params.__action;
    Logger.debug(`Router: {APP: ${ctx.APP}, CONTROLLER: ${ctx.CONTROLLER}, ACTION: ${ctx.ACTION}}`);
    await run(ctx, next);
});

module.exports = router;
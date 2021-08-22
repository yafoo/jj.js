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
router.all(cfg_app.app_multi ? '/:jj_app?/:jj_controller?/:jj_action?' : '/:jj_controller?/:jj_action?', async (ctx, next) => {
    ctx.APP = ctx.params.jj_app || cfg_app.default_app;
    ctx.CONTROLLER = ctx.params.jj_controller || cfg_app.default_controller;
    ctx.ACTION = ctx.params.jj_action || cfg_app.default_action;
    delete ctx.params.jj_app;
    delete ctx.params.jj_controller;
    delete ctx.params.jj_action;
    Logger.debug(`Router: {APP: ${ctx.APP}, CONTROLLER: ${ctx.CONTROLLER}, ACTION: ${ctx.ACTION}}`);
    await run(ctx, next);
});

module.exports = router;
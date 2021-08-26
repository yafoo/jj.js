const router = require('@koa/router')();
const {app: cfg_app, routes: cfg_routes} = require('./config');
const {toLine} = require('./utils/str');
const Logger = require('./logger');
const run = require('./run');

// 注册用户路由
if (cfg_routes) {
    const methods = ['all', 'get', 'put', 'post', 'patch', 'delete', 'del'];
    for(let item of cfg_routes){
        item.method || (item.method = 'all');
        if(!~methods.indexOf(item.method)) {
            throw new Error(`未知路由方法：${item.method}`);
        }
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
                }).split('/').reverse().map(u => toLine(u));
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
router.all(cfg_app.app_multi ? '/:app?/:controller?/:action?' : '/:controller?/:action?', async (ctx, next) => {
    ctx.APP = ctx.params.app || cfg_app.default_app;
    ctx.CONTROLLER = ctx.params.controller || cfg_app.default_controller;
    ctx.ACTION = ctx.params.action || cfg_app.default_action;
    delete ctx.params.app;
    delete ctx.params.controller;
    delete ctx.params.action;
    Logger.debug(`Router: {APP: ${ctx.APP}, CONTROLLER: ${ctx.CONTROLLER}, ACTION: ${ctx.ACTION}}`);
    await run(ctx, next);
});

module.exports = router;
const router = new (require('@koa/router'));
const {app: cfg_app, routes: cfg_routes} = require('./config');
const {toLine} = require('./utils/str');
const run = require('./run');

// 注册用户路由
if (cfg_routes) {
    const methods = ['all', 'get', 'put', 'post', 'patch', 'delete', 'del'];
    for(let item of cfg_routes){
        item.method || (item.method = 'all');
        if(!~methods.indexOf(item.method)) {
            throw new Error(`RouteError: 未知路由方法：${item.method}`);
        }
        if(typeof item.path === 'function') {
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
            await run(ctx, next, item.type);
        });
    }
}

// 注册系统路由
router.all(cfg_app.app_multi ? '/:APP?/:CONTROLLER?/:ACTION?' : '/:CONTROLLER?/:ACTION?', async (ctx, next) => {
    ctx.APP = ctx.params.APP || cfg_app.default_app;
    ctx.CONTROLLER = ctx.params.CONTROLLER || cfg_app.default_controller;
    ctx.ACTION = ctx.params.ACTION || cfg_app.default_action;
    delete ctx.params.APP;
    delete ctx.params.CONTROLLER;
    delete ctx.params.ACTION;
    ctx.APP != 'favicon.ico' && ctx.CONTROLLER != 'favicon.ico' && await run(ctx, next);
});

module.exports = router;
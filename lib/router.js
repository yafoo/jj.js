const router = new (require('@koa/router'));
const {app: cfg_app, routes: cfg_routes} = require('./config');
const {pathToRouteInfo} = require('./utils/internal');
const storage = require('./storage');

/**
 * @function - 解析路由并赋值到 ctx
 * @param {string} routePath 
 * @param {any} ctx 
 * @param {string} controllerFolder 
 */
function resolveRoute(routePath, ctx, controllerFolder) {
    const store = storage.getStore();
    const routeInfo = pathToRouteInfo(routePath, cfg_app.default_deep, cfg_app.default_controller, cfg_app.default_action);
    store.DEEP = ctx.DEEP = routeInfo.DEEP;
    ctx.CONTROLLER_FOLDER = controllerFolder;
    store.CONTROLLER = ctx.CONTROLLER = routeInfo.CONTROLLER;
    store.ACTION = ctx.ACTION = routeInfo.ACTION;
}

// 注册用户路由
if (cfg_routes) {
    const methods = ['all', 'get', 'put', 'post', 'patch', 'delete', 'del'];
    for(const item of cfg_routes) {
        item.method || (item.method = 'all');
        if(!~methods.indexOf(item.method)) {
            throw new Error(`RouteError: 未知路由方法：${item.method}`);
        }
        if(typeof item.path === 'function') {
            router[item.method](item.url, item.path);
            continue;
        }
        const route_path = item.path.replace(/^\/|\/$/g, '');
        router[item.method](item.url, async (ctx, next) => {
            if(ctx._routeMatched) return await next();
            if(item.type != cfg_app.middleware_folder) ctx._routeMatched = true;

            const path = ~route_path.indexOf('$') ? route_path.replace(/\$\{(\w+)\}/g, (...args) => {
                return ctx.params[args[1]];
            }) : route_path;
            try {
                resolveRoute(path, ctx, item.type || cfg_app.controller_folder);
            } catch (error) {
                if(cfg_app.app_debug) throw error;
                return;
            }
            await next();
        });
    }
}

// 注册系统路由
router.all('/(.*)', async (ctx, next) => {
    if(ctx._routeMatched) return await next();

    let param = ctx.params[0] ?? '';
    const dotIndex = param.indexOf('.');
    if(~dotIndex) param = param.slice(0, dotIndex);
    try {
        resolveRoute(param, ctx, cfg_app.controller_folder);
        delete ctx.params[0];
    } catch (error) {
        if(cfg_app.app_debug) throw error;
        return;
    }
    await next();
});

module.exports = router;
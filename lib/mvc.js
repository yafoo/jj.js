const path = require('path');
const {readFile} = require('fs').promises;
const {toCamelCase, pathToMiddlewareInfo} = require('./utils/internal');
const config = require('./config');
const {app: cfg_app, view: cfg_view} = config;
const compose = require('koa-compose');
const Logger = require('./logger');
const storage = require('./storage');

/**
 * MVC中间件
 * @param {import('../types').KoaCtx} ctx 
 * @param {import('../types').KoaMiddleware} next 
 * @returns {Promise<void>}
 */
async function mvc(ctx, next) {
    const controller_folder = ctx.CONTROLLER_FOLDER || cfg_app.controller_folder;

    if(cfg_app.app_debug) {
        Logger.http({Router: controller_folder, DEEP: ctx.DEEP, CONTROLLER: ctx.CONTROLLER, ACTION: ctx.ACTION});
        Object.keys(ctx.params).length && Logger.http('Params:', ctx.params);
        Object.keys(ctx.query).length && Logger.http('Get:', ctx.query);
        Object.keys(ctx.request.body || {}).length && Logger.http('Post:', ctx.request.body);
    }
    
    // 设置store
    const store = storage.getStore();
    store.DEEP = ctx.DEEP;
    store.CONTROLLER = ctx.CONTROLLER;
    store.ACTION = ctx.ACTION;

    const controllerPaths = [...ctx.DEEP.split('/').filter(Boolean), controller_folder];
    const $node = controllerPaths.reduce((node, deep) => {
        if(!node[deep]) {
            throw new Error(`RunError: 目录:/app/${controllerPaths.join('/')}不存在！`);
        }
        return node[deep];
    }, store.$$);

    // 模版文件内容直接输出
    if(controller_folder == cfg_view.view_folder) {
        const content = await readFile(path.join(cfg_app.base_dir, 'app', controllerPaths.join('/'), ctx.CONTROLLER + cfg_view.view_depr + ctx.ACTION + cfg_view.view_ext));
        if(!content) {
            throw new Error(`RunError: 模板文件:${controllerPaths.join('/')}/${ctx.CONTROLLER + cfg_view.view_depr + ctx.ACTION + cfg_view.view_ext}不存在！`);
        }
        ctx.body = content;
        return;
    }

    // 控制器
    const Controller = $node[ctx.CONTROLLER] || $node['_empty'];

    if(!Controller || typeof Controller != 'function') {
        if(cfg_app.app_debug) {
            throw new Error(`RunError: 控制器文件:${controllerPaths.join('/')}/${ctx.CONTROLLER}不存在！`);
        } else {
            return;
        }
    }

    // 控制器实例
    const $controller = new Controller(ctx, next);
    const camelCaseAction = toCamelCase(ctx.ACTION);
    const action = typeof $controller[camelCaseAction] == 'function' && !$controller[camelCaseAction].__ISCLASS__ ? camelCaseAction : '_empty';

    if(!$controller[action] || typeof $controller[action] != 'function') {
        if(cfg_app.app_debug) {
            throw new Error(`RunError: 控制器方法:${controllerPaths.join('/')}/${camelCaseAction}不存在！`);
        } else {
            return;
        }
    }

    // 控制器中间件
    const middlewares = Array.isArray($controller['middleware'])
        && $controller['middleware'].length > 0
        && $controller['middleware'].reduce((stack, middle) => {
                typeof middle == 'string' && (middle = {middleware: middle});
                if(Array.isArray(middle.except) ? ~middle.except.indexOf(action) : ~[middle.except].indexOf(action)) {
                    return stack;
                }
                if(middle.accept && (Array.isArray(middle.accept) ? !~middle.accept.indexOf(action) : !~[middle.accept].indexOf(action))) {
                    return stack;
                }
                // @ts-ignore
                return stack.concat(async (ctx, next) => {
                    const {DEEPS, MIDDLEWARE, ACTION} = pathToMiddlewareInfo(middle.middleware, ctx.DEEP, ctx.CONTROLLER, action);
                    const middlewarePaths = [...DEEPS, cfg_app.middleware_folder];
                    const $node = middlewarePaths.reduce((node, deep) => {
                        if(!node[deep]) {
                            throw new Error(`RunError: 中间件目录:/app/${middlewarePaths.join('/')}不存在！`);
                        }
                        return node[deep];
                    }, store.$$);
                    const Middleware = $node[MIDDLEWARE];
                    if(!Middleware || typeof Middleware != 'function') {
                        throw new Error(`RunError: 中间件文件:/app/${middlewarePaths.join('/')}/${MIDDLEWARE}不存在！`);
                    }
                    const $middleware = new Middleware(ctx, next);
                    if(!$middleware[ACTION] || typeof $middleware[ACTION] != 'function') {
                        throw new Error(`RunError: 中间件方法:${middlewarePaths.join('/')}/${ACTION}不存在！`);
                    }

                    // 执行中间件方法
                    await $middleware[ACTION]();
                });
            }, [])
        || [];

    // 执行控制器方法
    await compose(middlewares)(ctx, async () => {
        let result;
        typeof $controller['_init'] == 'function' && (result = await $controller['_init']());
        result !== false && (result = await $controller[action]());
        result !== false && typeof $controller['_end'] == 'function' && await $controller['_end']();
    });
}

module.exports = mvc;
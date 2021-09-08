const path = require('path');
const loader = require('./loader');
const {readFile} = require('./utils/fs');
const {toHump} = require('./utils/str');
const {app: cfg_app, view: cfg_view, db, page, log, cache, cookie, tpl} = require('./config');
const compose = require('koa-compose');

async function run(ctx, next, control_type=cfg_app.controller_folder) {
    // 设置根加载器
    ctx.$ = loader('./', ctx);
    ctx._ = loader(cfg_app.base_dir, ctx);
    ctx._.config === undefined && (ctx._.config = {});
    ctx._.config.app = cfg_app;
    ctx._.config.view = cfg_view;
    ctx._.config.db = db;
    ctx._.config.page = page;
    ctx._.config.log = log;
    ctx._.config.cache = cache;
    ctx._.config.cookie = cookie;
    ctx._.config.tpl = tpl;

    // 应用、控制器、方法名字验证
    if (~ctx.APP.indexOf('.') || ~ctx.CONTROLLER.indexOf('.') || ~ctx.ACTION.indexOf('.')) {
        throw new Error(`应用、控制器或方法名字不合法！`);
    }

    if (ctx.APP[0] == '_' || ctx.APP[0] == '$' || !ctx._[ctx.APP]) {
        if(cfg_app.app_debug) {
            throw new Error(`应用:${ctx.APP}不存在！`);
        } else {
            return false;
        }
    }

    if (!ctx._[ctx.APP][control_type]) {
        if(cfg_app.app_debug) {
            throw new Error(`目录:${ctx.APP}/${control_type}不存在！`);
        } else {
            return false;
        }
    }

    // 模版文件内容直接输出
    if(control_type == cfg_view.view_folder) {
        const content = await readFile(path.join(ctx._[ctx.APP][control_type].__node.path, ctx.CONTROLLER + cfg_view.view_depr + ctx.ACTION + cfg_view.view_ext));
        if(!content) {
            throw new Error(`模板文件:${ctx.APP}/${control_type}/${ctx.CONTROLLER + cfg_view.view_depr + ctx.ACTION + cfg_view.view_ext}不存在！`);
        }
        ctx.body = content;
        return;
    }

    // 控制器
    const Controller = ctx._[ctx.APP][control_type][ctx.CONTROLLER] || ctx._[ctx.APP][control_type]['empty'];

    if (ctx.CONTROLLER[0] == '_' || ctx.CONTROLLER[0] == '$' || typeof Controller != 'function') {
        if(cfg_app.app_debug) {
            throw new Error(`class文件:${ctx.APP}/${control_type}/${ctx.CONTROLLER}不存在！`);
        } else {
            return false;
        }
    }

    // 控制器实例
    $controller = new Controller(ctx, next);
    const humpAction = toHump(ctx.ACTION);
    const action = typeof $controller[humpAction] == 'function' ? humpAction : 'empty';

    if (ctx.ACTION[0] == '_' || ctx.ACTION[0] == '$' || typeof $controller[action] != 'function') {
        if(cfg_app.app_debug) {
            throw new Error(`class方法:${ctx.APP}/${control_type}/${ctx.CONTROLLER}/${humpAction}不存在！`);
        } else {
            return false;
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
                return stack.concat(async (ctx, next) => {
                    const [METHOD = action, MIDDLEWARE = ctx.CONTROLLER, APP = ctx.APP] = middle.middleware.split('/').reverse();
                    if(!ctx._[APP]) {
                        throw new Error(`中间件应用:${APP}不存在！`);
                    }
                    if(!ctx._[APP]['middleware']) {
                        throw new Error(`中间件目录:${APP}/middleware不存在！`);
                    }
                    const Middleware = ctx._[APP]['middleware'][MIDDLEWARE];
                    if(!Middleware || typeof Middleware != 'function') {
                        throw new Errorw(`中间件文件:${APP}/middleware/${MIDDLEWARE}不存在！`);
                    }
                    const $middleware = new Middleware(ctx, next);
                    if(!$middleware[METHOD] || typeof $middleware[METHOD] != 'function') {
                        throw new Error(`中间件方法:${APP}/middleware/${MIDDLEWARE}/${METHOD}不存在！`);
                    }

                    // 执行中间件方法
                    await $middleware[METHOD]();
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

module.exports = run;
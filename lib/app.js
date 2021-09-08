const path = require('path');
const Koa = require('koa');
const app = new Koa();
const {app: cfg_app} = require('./config');
const Logger = require('./logger');
const Response = require('./response');
const router = require('./router');
const pjson = require('../package.json');

app.run = (...args) => {
    // exception
    app.use(async (ctx, next) => {
        ctx.APP_TIME = new Date();
        ctx.APP_VERSION = pjson.version;

        try {
            await next();
        } catch (err) {
            Logger.error(...err.stack.split("\n"));
            if(cfg_app.app_debug) {
                new Response(ctx).exception(err);
            } else {
                ctx.response.status = err.statusCode || err.status || 500;
                ctx.body = 'Internal Server Error';
            }
        }

        const ms = new Date() - ctx.APP_TIME;
        Logger.http(`${ctx.method} ${ctx.status} ${ctx.url} - ${ms}ms`);
    });

    // static
    cfg_app.static_dir && app.use(require('koa-static')(path.join(cfg_app.base_dir, cfg_app.static_dir)));

    // koa-body
    cfg_app.koa_body && app.use(require('koa-body')(cfg_app.koa_body));

    // router
    app.use(router.routes()).use(router.allowedMethods());

    // server
    app.listen(...args);

    // run once
    delete app.run;
}

module.exports = app;
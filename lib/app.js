const path = require('path');
const Koa = require('koa');
const {app: cfg_app, cookie: cfg_cookie} = require('./config');
const loader = require('./loader');
const Logger = require('./logger');
const Response = require('./response');
const router = require('./router');
const storage = require('./storage');
const pjson = require('../package.json');

/**
 * @typedef {import('../types').AppOptions} AppOptions
 */

/**
 * @extends Koa
 */
class App extends Koa
{
    /**
     * @param {AppOptions|Function|Function[]} [options] Application options
     */
    constructor(options) {
        if(typeof options == 'function') {
            options = {
                middleware: [options]
            };
        } else if(Array.isArray(options)) {
            options = {
                middleware: options
            };
        } else if(options && !Array.isArray(options.middleware)) {
            options.middleware = [options.middleware]
        }
        super(options);
        this._init(options);
    }

    _init(options) {
        // storage
        this.use(async (ctx, next) => {
            ctx.APP_TIME = Date.now();
            ctx.APP_VERSION = pjson.version;
            await storage.run({
                $: loader('./', ctx),
                _: loader(cfg_app.base_dir, ctx)
            }, async() => {
                await next();
            });
        });

        // options.middleware
        options && options.middleware && options.middleware.forEach(middleware => {
            this.use(middleware);
        });

        // exception
        this.use(async (ctx, next) => {
            try {
                await next();
            } catch (err) {
                // Logger.error(...err.stack.split("\n"));
                (err && err.stack || err).split("\n").forEach(line => {
                    Logger.error(line);
                });
                if(cfg_app.app_debug) {
                    new Response(ctx).exception(err);
                } else {
                    ctx.response.status = err.statusCode || err.status || 500;
                    ctx.body = 'Internal Server Error';
                }
            }

            const ms = Date.now() - ctx.APP_TIME;
            Logger.http(`${ctx.method} ${ctx.status} ${ctx.url} - ${ms}ms`);
        });

        // static
        cfg_app.static_dir && this.use(require('koa-static')(path.join(cfg_app.base_dir, cfg_app.static_dir)));

        // koa-body
        cfg_app.koa_body && this.use(require('koa-body').koaBody(cfg_app.koa_body));

        // router
        this.use(router.routes()).use(router.allowedMethods());

        // cookie
        cfg_cookie.keys && (this.keys = cfg_app.app_debug ? ['jj.js'] : cfg_cookie.keys);

        // create types
        if(cfg_app.app_debug) {
            const {isFileSync} = require('./utils/fs');
            const jsconfigFile = path.join(cfg_app.base_dir, 'jsconfig.json');
            isFileSync(jsconfigFile) && require('./types')();
        }
    }
}

module.exports = App;
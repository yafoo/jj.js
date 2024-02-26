const path = require('path');
const Koa = require('koa');
const {app: cfg_app} = require('./config');
const Logger = require('./logger');
const Response = require('./response');
const router = require('./router');
const storage = require('./storage');
const pjson = require('../package.json');

/**
 * @extends Koa
 */
class App extends Koa
{
    /**
     * @override
     * @param {...any} args - listen(port, ip, callback(err){})
     */
    listen(...args) {
        // storage
        this.use(async (ctx, next) => {
            await storage.run({}, async() => {
                await next();
            });
        });

        // exception
        this.use(async (ctx, next) => {
            ctx.APP_TIME = Date.now();
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

            const ms = Date.now() - ctx.APP_TIME;
            Logger.http(`${ctx.method} ${ctx.status} ${ctx.url} - ${ms}ms`);
        });

        // static
        cfg_app.static_dir && this.use(require('koa-static')(path.join(cfg_app.base_dir, cfg_app.static_dir)));

        // koa-body
        cfg_app.koa_body && this.use(require('koa-body')(cfg_app.koa_body));

        // router
        this.use(router.routes()).use(router.allowedMethods());

        // types
        if(cfg_app.app_debug) {
            const {isFileSync} = require('./utils/fs');
            const jsconfigFile = path.join(cfg_app.base_dir, 'jsconfig.json');
            isFileSync(jsconfigFile) && require('./types')();
        }

        // server
        return super.listen(...args);
    }
}

module.exports = App;
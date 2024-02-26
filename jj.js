/**
 * jj.js核心库<br/>
 * {App, Cache, Context, Controller, Cookie, Ctx, Db, Logger, Middleware, Model, Pagination, Response, Upload, Url, View, utils, config}
 * @module core
 * @type {import('./types').Core}
 */
module.exports = new Proxy({}, {
    get: (target, prop) => {
        if(prop in target || typeof prop == 'symbol' || ['inspect', 'router', 'run', 'types'].includes(prop)) {
            return target[prop];
        }
        prop = prop.toLowerCase();
        return require(`./lib/${prop == 'utils' ? 'utils/' : ''}${prop}`);
    }
});
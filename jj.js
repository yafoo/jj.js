/**
 * jj.js核心库<br/>
 * {App, Controller, Db, Model, Pagination, View, Logger, Cookie, Response, Upload, Url, Middleware, Cache, Context, View, utils}
 * @module core
 * @type {import('./lib/types').Core}
 */
module.exports = new Proxy({}, {
    get: (target, prop) => {
        if(prop in target || typeof prop == 'symbol' || prop == 'inspect'){
            return target[prop];
        }
        prop = prop.toLowerCase();
        return require(`./lib/${prop == 'utils' ? 'utils/' : ''}${prop}`);
    }
});
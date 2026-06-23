const {cookie: cfg_cookie} = require('./config');
const Context = require('./context');

/**
 * @extends Context
 */
class Cookie extends Context
{
    /**
     * 设置cookie
     * @public
     * @param {string} key
     * @param {(string|null)} [value]
     * @param {import('cookies').SetOption} [options]
     * @returns {this}
     */
    set(key, value, options) {
        this.ctx.cookies.set(key, value, {...cfg_cookie, ...options});
        return this;
    }

    /**
     * 获取cookie
     * @public
     * @param {string} key - cookie键名
     * @param {import('cookies').GetOption} [options]
     * @returns {any}
     */
    get(key, options) {
        return this.ctx.cookies.get(key, {signed: cfg_cookie.signed ? true : false, ...options});
    }

    /**
     * 删除cookie
     * @public
     * @param {string} key - cookie键名
     * @param {import('cookies').GetOption} [options]
     * @returns {this}
     */
    delete(key, options) {
        this.ctx.cookies.set(key, null, {...cfg_cookie, ...options, maxAge: 0});
        return this;
    }

    /**
     * 获取所有cookie
     * @public
     * @returns {Object.<string, string>}
     */
    all() {
        /**
         * @type {Object.<string, string>}
         */
        const cookies = {};
        this.keys().forEach(key => cookies[key] = this.get(key));
        return cookies;
    }

    /**
     * 清理所有cookie
     * @public
     * @returns {this}
     */
    clear() {
        this.keys().forEach(key => this.delete(key));
        return this;
    }

    /**
     * 获取所有cookie key
     * @public
     * @returns {Array.<string>}
     */
    keys() {
        const cookie_header = this.ctx.request.headers.cookie || '';
        return cookie_header ? cookie_header.split(';').map(value => value.split('=')[0].trim()) : [];
    }
}

module.exports = Cookie;
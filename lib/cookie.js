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
     * @param {string} [key] - 为空，则获取所有cookie
     * @param {import('cookies').GetOption} [options]
     * @returns {string}
     */
    get(key, options) {
        if(key === undefined) {
            return this.all();
        }
        return this.ctx.cookies.get(key, options);
    }

    /**
     * 删除或清理cookie
     * @public
     * @param {*} [key] - 为空则清理所有cookie
     * @returns {this}
     */
    delete(key) {
        if(key === undefined) {
            this.clear();
        } else {
            this.ctx.cookies.set(key, '', {maxAge: 0});
        }
        return this;
    }

    /**
     * 获取所有cookie
     * @public
     * @returns {object}
     */
    all() {
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
     * @returns {array}
     */
    keys() {
        const cookie_header = this.ctx.request.headers.cookie || '';
        return cookie_header ? cookie_header.split(';').map(value => value.split('=')[0].trim()) : [];
    }
}

module.exports = Cookie;
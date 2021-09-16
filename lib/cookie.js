const {cookie: cfg_cookie} = require('./config');
const Context = require('./context');

class Cookie extends Context
{
    set(key, value, options) {
        this.ctx.cookies.set(key, value, {...cfg_cookie, ...options});
    }

    get(key) {
        if(key === undefined) {
            return this.all();
        }
        return this.ctx.cookies.get(key);
    }

    delete(key) {
        if(key === undefined) {
            return this.clear();
        } else {
            this.ctx.cookies.set(key, '', {maxAge: 0});
        }
    }

    all() {
        const cookies = {};
        this.keys().forEach(key => cookies[key] = this.get(key));
        return cookies;
    }

    clear() {
        this.keys().forEach(key => this.delete(key));
    }

    keys() {
        const cookie_header = this.ctx.request.headers.cookie || '';
        return cookie_header ? cookie_header.split(';').map(value => value.split('=')[0].trim()) : [];
    }
}

module.exports = Cookie;
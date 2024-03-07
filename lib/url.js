const {app: cfg_app, routes: cfg_routes} = require('./config');
const routes = (cfg_routes || []).reverse().reduce((routes, route) => {
    if(route.name){
        routes[route.name] = route;
    }
    return routes;
}, {});
const querystring = require("querystring");
const Context = require('./context');
const {toLine} = require('./utils/str');

/**
 * @extends Context
 */
class Url extends Context
{
    /**
     * 编译生成url
     * @public
     * @param {string} [url] - 网址，支持智能解析
     * @param {object|string|boolean} [vars] - 网址参数
     * @param {string|boolean} [ext] - 网址后缀
     * @param {string|boolean} [domain] - 网址域名
     * @returns {string}
     * @example - build(url, vars, ext, domain|true)
     * @example - build(url, ext, domain|true)
     * @example - build(url, domain|true)
     */
    build(url='', vars={}, ext='', domain='') {
        if(typeof vars != 'object') {
            [vars, ext, domain] = [{}, vars, ext];
        }
        if(ext === true || ext.slice(0, 4) == 'http') {
            [ext, domain] = ['', ext];
        }
        if(domain === true) {
            domain = this.ctx.protocol + '://' + this.ctx.host;
        }
        const query = {...vars};
        let urls;
        if(url.slice(0, 1) == ':') {
            url = this.ruleUrl(url.slice(0, 1), query);
        } else if(url.slice(0, 1) != '/' && url.slice(0, 4) != 'http') {
            urls = url.split('/').reverse().map(u => toLine(u));
            if(urls.length < 3) {
                url = ((cfg_app.app_multi && '/' + this.ctx.APP) || '') + '/' + (urls[1] || this.ctx.CONTROLLER) + '/' + (urls[0] || this.ctx.ACTION);
            } else {
                url = '/' + urls.reverse().join('/');
            }
        }

        urls = url.split('#');
        if(~urls[0].indexOf('?')) {
            const urlss = urls[0].split('?');
            urlss[0] += ext;
            urlss[1] = urlss[1] || '';
            if(Object.keys(query).length > 0) {
                urlss[1] = querystring.stringify({...querystring.parse(urlss[1]), ...query});
            }
            urls[0] = urlss.join('?');
        } else {
            urls[0] = urls[0] + ext;
            if(Object.keys(query).length > 0) {
                urls[0] = urls[0] + '?' + querystring.stringify(query);
            }
        }

        return domain + urls.join('#');
    }

    /**
     * 由命名路由反向生成url
     * @public
     * @param {*} url - 路由名字
     * @param {*} query - 网址参数
     * @returns {string}
     */
    ruleUrl(url, query = {}) {
        if(!routes[url]) {
            return url;
        }

        url = routes[url].url;

        if(~url.indexOf(':')) {
            url = url.replace(/\:([^/]+\(.*\)|[^/]+)/g, (match, key) => {
                key = key.split(/[(.]/);
                const k = key[0];
                if(k in query) {
                    const value = query[k];
                    delete query[k];
                    return querystring.escape(value) + (!key[1] || ~key[1].indexOf(')') ? '' : '.' + key[1]);
                } else if(this.ctx.params && k in this.ctx.params) {
                    return querystring.escape(this.ctx.params[k]);
                }
                return match;
            });
        }

        return url;
    }
}

module.exports = Url;
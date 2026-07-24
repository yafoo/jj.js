const {routes: cfg_routes} = require('./config');
/**
 * @typedef {import('../types').RouteConfigItem} RouteConfigItem
 * @type {Object.<string, RouteConfigItem>}
 */
const routes = (cfg_routes || []).reduce((routes, route) => {
    if(route.name) {
        // @ts-ignore
        if(routes[route.name]) throw new Error(`RouteError: 重复的路由名字：${route.name}`);
        // @ts-ignore
        routes[route.name] = route;
    }
    return routes;
}, {});
const querystring = require("querystring");
const {URL} = require('url');
const Context = require('./context');
const {getUrlPath} = require('./utils/internal');

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
        if(typeof ext == 'boolean' || ext.slice(0, 4) == 'http') {
            [ext, domain] = ['', ext];
        }
        if(domain === true) {
            domain = this.ctx.protocol + '://' + this.ctx.host;
        }
        const query = {...vars};
        if(url.slice(0, 1) == ':') {
            url = this.ruleUrl(url.slice(1), query);
        } else if(url.slice(0, 1) != '/' && url.slice(0, 4) != 'http') {
            url = '/' + getUrlPath(url, this.ctx.DEEP, this.ctx.CONTROLLER, this.ctx.ACTION);
        }

        // 校验ext：仅允许以.开头且仅含字母数字的合法后缀
        if(ext && !/^\.[a-zA-Z0-9]+$/.test(ext)) ext = '';

        // 使用URL API安全解析，避免split在query/hash含特殊字符时出错
        const isFullUrl = url.slice(0, 4) == 'http';
        const base = isFullUrl ? undefined : 'http://_';
        const parsed = new URL(url, base);

        // 添加后缀到pathname
        if(ext) parsed.pathname += ext;

        // 合并query参数（URL中已有的 + 新传入的，新参数优先）
        if(Object.keys(query).length > 0) {
            const existing = querystring.parse(parsed.search.slice(1));
            const merged = {...existing, ...query};
            parsed.search = querystring.stringify(merged);
        }

        if(isFullUrl || domain) {
            return (domain || '') + parsed.href;
        }
        // 返回相对路径部分（去掉dummy base）
        return parsed.pathname + parsed.search + parsed.hash;
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

        if(url.includes(':')) {
            // @ts-ignore
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
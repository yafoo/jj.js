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

class Url extends Context
{
    build(url='', vars, ext='', domain='') {
        if(vars && typeof vars != 'object') {
            [vars, ext, domain] = [{}, vars, ext];
        }
        const query = {...vars};
        let urls;
        if(url.slice(0, 1) == ':') {
            url = this.ruleUrl(url.substr(1), query);
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

    ruleUrl(url, query = {}) {
        if(!routes[url]) {
            return url;
        }

        url = routes[url].url;

        if(~url.indexOf(':')) {
            url = url.replace(/\:([^./]+)/g, (match, key) => {
                if(key in query) {
                    const value = query[key];
                    delete query[key];
                    return querystring.escape(value);
                } else if(this.ctx.params && key in this.ctx.params) {
                    return querystring.escape(this.ctx.params[key]);
                }
                return match;
            });
        }

        return url;
    }
}

module.exports = Url;
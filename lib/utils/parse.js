const Cache = require('../cache.js');
const path = require('path');

/**
 * @function - 转为小驼峰
 * @param {string} name
 * @returns {string}
 */
function toCamelCase(name) {
    return name.replace(/\_(\w)/g, function(all, letter){
        return letter.toUpperCase();
    });
}

/**
 * @function - 转为下划线
 * @param {string} name
 * @returns {string}
 */
function toUnderScore(name) {
    return name.replace(/(?!^)([A-Z])/g, "_$1").toLowerCase();
}

/**
 * Validate path name
 * @param {string} name
 * @returns {boolean}
 */
function validatePath(name = '') {
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
        return false;
    }
    if(name[0] === '_' || name[0] === '$') {
        return false;
    }
    return true;
}

/**
 * @function - 解析路由路径，返回路由信息
 * @param {string} path - 路由路径
 * @param {string} default_deep - 默认级别
 * @param {string} default_controller - 默认控制器
 * @param {string} default_action - 默认方法
 * @returns {{DEEP: string, CONTROLLER: string, ACTION: string}} - 路由信息
 */
function pathToRouteInfo(path, default_deep, default_controller, default_action) {
    const cacheKey = `pathToRouteInfo:${path}:${default_deep}:${default_controller}:${default_action}`;
    const cached = Cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const paths = path.replace(/^\/|\/$/g, '').split('/').filter(Boolean).map(toUnderScore).reverse();
    paths.forEach(p => {
        if(!validatePath(p)) throw new Error(`RouteError: 路径不合法：${path}`);
    });

    const DEEPS = paths.slice(2);
    const [CONTROLLER = default_controller, ACTION = default_action] = paths.slice(0, 2).reverse();

    const routeInfo = { DEEP: DEEPS.length ? DEEPS.reverse().join('/') : paths.length ? '' : default_deep, CONTROLLER, ACTION };
    Cache.set(cacheKey, routeInfo);
    return routeInfo;
}

/**
 * @function - 构建路径数组（内部辅助）
 * @param {string} extra - 额外路径片段
 * @param {string} deep 
 * @param {string} controller 
 * @param {string} action 
 * @returns {string[]} - 返回倒序路径数组，顺序为 [action, controller, ...deeps]
 */
function buildPathArray(extra, deep, controller, action) {
    const bases = [action, controller, ...deep.split('/')].filter(Boolean);
    const extras = extra.replace(/^\/|\/$/g, '').split('/').filter(Boolean).reverse().map(toUnderScore);
    return bases.map((val, i) => extras[i] !== undefined ? extras[i] : val);
}

/**
 * @function - 获取视图路径
 * @param {string} template 
 * @param {string} deep 
 * @param {string} controller 
 * @param {string} action 
 * @param {string} view_folder 
 * @param {string} view_depr 
 * @param {string} view_ext 
 * @returns {string} - 包含后缀的相对路径
 */
function getViewPath(template = '', deep, controller, action, view_folder, view_depr, view_ext) {
    if(!template.startsWith('/')) {
        let deeps = [];
        [action, controller, ...deeps] = buildPathArray(template, deep, controller, action);
        template = [...deeps.reverse(), view_folder, controller + view_depr + action].filter(Boolean).join('/');
    }

    path.extname(template) || (template += view_ext);
    return template;
}

/**
 * @function - 获取完整的url路径
 * @param {string} url 
 * @param {string} deep 
 * @param {string} controller 
 * @param {string} action 
 * @returns {string} - 不含后缀及参数的url路径
 */
function getUrlPath(url = '', deep, controller, action) {
    return buildPathArray(url, deep, controller, action).filter(Boolean).reverse().join('/');
}

/**
 * @function - 将路径转换为中间件信息
 * @param {string} path 
 * @param {string} deep 
 * @param {string} controller 
 * @param {string} action 
 * @returns {{DEEPS: string[], MIDDLEWARE: string, ACTION: string}} - 返回包含中间件信息的对象
 */
function pathToMiddlewareInfo(path, deep, controller, action) {
    const [ACTION, MIDDLEWARE, ...DEEPS] = buildPathArray(path, deep, controller, action);
    return {
        DEEPS: DEEPS.filter(Boolean).reverse(),
        MIDDLEWARE: MIDDLEWARE,
        ACTION: ACTION
    };
}

module.exports = {toCamelCase, toUnderScore, pathToRouteInfo, getViewPath, getUrlPath, pathToMiddlewareInfo};
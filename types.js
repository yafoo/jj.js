//------------------系统核心库------------------
/**
 * @typedef {Object} AppOptions
 * @property {string} [env] - Environment，默认为 'development'
 * @property {string[]} [keys] - Signed cookie keys
 * @property {boolean} [proxy] - Trust proxy headers
 * @property {number} [subdomainOffset] - Subdomain offset
 * @property {string} [proxyIpHeader] - Proxy IP header，默认为 'X-Forwarded-For'
 * @property {number} [maxIpsCount] - Max IPs read from proxy IP header，默认为 0（表示无限）
 * @property {function} [compose] - Function to handle middleware composition
 * @property {boolean} [asyncLocalStorage] - Enable AsyncLocalStorage，默认为 false
 * @property {function|function[]} [middleware] - Middleware，will be used before other app.use()
 */

/**
 * @typedef {typeof import('./lib/app')} App
 * @typedef {typeof import('./lib/storage')} Storage
 * @typedef {typeof import('./lib/cache')} Cache
 * @typedef {typeof import('./lib/logger')} Logger
 * @typedef {typeof import('./lib/context')} Context
 * @typedef {typeof import('./lib/controller')} Controller
 * @typedef {typeof import('./lib/cookie')} Cookie
 * @typedef {typeof import('./lib/db')} Db
 * @typedef {typeof import('./lib/middleware')} Middleware
 * @typedef {typeof import('./lib/model')} Model
 * @typedef {typeof import('./lib/pagination')} Pagination
 * @typedef {typeof import('./lib/request')} Request
 * @typedef {typeof import('./lib/response')} Response
 * @typedef {typeof import('./lib/upload')} Upload
 * @typedef {typeof import('./lib/url')} Url
 * @typedef {typeof import('./lib/view')} View
 */

/**
 * @typedef {typeof Ctx.prototype} CtxInstance
 * @typedef {typeof import('./lib/context').prototype} ContextInstance
 * @typedef {typeof import('./lib/controller').prototype} ControllerInstance
 * @typedef {typeof import('./lib/cookie').prototype} CookieInstance
 * @typedef {typeof import('./lib/db').prototype} DbInstance
 * @typedef {typeof import('./lib/middleware').prototype} MiddlewareInstance
 * @typedef {typeof import('./lib/model').prototype} ModelInstance
 * @typedef {typeof import('./lib/pagination').prototype} PaginationInstance
 * @typedef {typeof import('./lib/request').prototype} RequestInstance
 * @typedef {typeof import('./lib/response').prototype} ResponseInstance
 * @typedef {typeof import('./lib/upload').prototype} UploadInstance
 * @typedef {typeof import('./lib/url').prototype} UrlInstance
 * @typedef {typeof import('./lib/view').prototype} ViewInstance
 */

/**
 * @typedef {Object} Core
 * @property {App} App
 * @property {Cache} Cache
 * @property {Context} Context
 * @property {Controller} Controller
 * @property {Cookie} Cookie
 * @property {Ctx} Ctx
 * @property {Db} Db
 * @property {Logger} Logger
 * @property {Middleware} Middleware
 * @property {Model} Model
 * @property {Pagination} Pagination
 * @property {Request} Request
 * @property {Response} Response
 * @property {Upload} Upload
 * @property {Url} Url
 * @property {View} View
 * @property {Utils} utils
 * @property {Config} config
 * @property {Storage} storage
 */

/**
 * @typedef {Object} $
 * @property {Cache} cache
 * @property {Config} config
 * @property {ContextInstance} context
 * @property {ControllerInstance} controller
 * @property {CookieInstance} cookie
 * @property {CtxInstance} ctx
 * @property {DbInstance} db
 * @property {Logger} logger
 * @property {MiddlewareInstance} middleware
 * @property {ModelInstance} model
 * @property {PaginationInstance} pagination
 * @property {RequestInstance} request
 * @property {ResponseInstance} response
 * @property {UploadInstance} upload
 * @property {UrlInstance} url
 * @property {ViewInstance} view
 * @property {Utils} utils
 */


//------------------系统App配置---------------------
/**
 * @typedef {Object} AppConfig - 系统配置
 * @property {boolean} [app_debug] - 调试模式，默认为 false
 * @property {boolean} [app_multi] - 是否开启多应用，默认为 false
 * @property {string} [default_app] - 默认应用，默认为 'app'
 * @property {string} [default_controller] - 默认控制器，默认为 'index'
 * @property {string} [default_action] - 默认方法，默认为 'index'
 * @property {string} [common_app] - 公共应用，存放公共模型及逻辑，默认为 'common'
 * @property {string} [controller_folder] - 控制器目录名，默认为 'controller'
 * @property {string} [static_dir] - 静态文件目录，相对于应用根目录，为空时，关闭静态访问，默认为 ''
 * @property {import('koa-body').KoaBodyMiddlewareOptions} [koa_body] - koa-body配置参数，为null或空时，关闭koa-body，默认为 null
 * @property {string} [base_dir] - 应用根目录（会自动计算）
 */

/**
 * @typedef {Object} ViewConfig - 模板配置
 * @property {string} [view_folder] - 模板目录名，默认为 'view'
 * @property {string} [view_depr] - 模版文件名分割符，'/'代表二级目录，默认为 '/'
 * @property {string} [view_ext] - 模版文件后缀，默认为 '.htm'
 * @property {string} [view_engine] - 默认模版引擎，字符串或引擎类，默认为 'art-template'
 * @property {Object} [view_filter] - 模版函数，系统已内置url函数，默认为 {}
 */

/**
 * @typedef {Object} DbConfigItem - 数据库参数
 * @property {string} [type] - 数据库类型，默认为 'mysql'
 * @property {string} [host] - 服务器地址，默认为 '127.0.0.1'
 * @property {string} [database] - 数据库名，默认为 'jj'
 * @property {string} [user] - 数据库用户名，默认为 'root'
 * @property {string} [password] - 数据库密码，默认为 ''
 * @property {string} [port] - 数据库连接端口，默认为 ''
 * @property {string} [charset] - 数据库编码，默认为 'utf8'
 * @property {string} [prefix] - 数据库表前缀，默认为 'jj_'
 * @property {function} [connect] - 自定义连接器
 */

/**
 * @typedef {Object.<string, Object>} DbConfig - 数据库配置
 * @property {DbConfigItem} default - 数据库参数
 */

/**
 * @callback LogHandle - 日志驱动
 * @param {string} level - 日志级别
 * @param {...any} args - 日志数据，支持多个，支持对象
 */

/**
 * @typedef {Object} LogConfig - 日志配置
 * @property {Array<string>} [log_level] - 允许输出的日志级别
 * @property {LogHandle} [log_handle] - 日志驱动
 */

/**
 * @typedef {Object} CacheConfig - 缓存配置
 * @property {number} [cache_time] - 缓存时间，默认1天（60 * 60 * 24秒），为空或false则为10年
 * @property {number} [clear_time] - 缓存自动清理周期，undefined: 清理一次, 0: 关闭自动清理, >0: 为周期时间（单位秒）
 */

/**
 * @typedef {Object} PageConfig - 分页配置
 * @property {string} [page_key] - 分页标识，默认为 'page'
 * @property {string} [key_origin] - page_key来源，默认为 'query'
 * @property {number} [page_size] - 分页大小，默认为 10
 * @property {number} [page_length] - 分页长度，默认为 5
 * @property {string} [url_page] - 分页URL模板，可为路由名字，可用参数：页码${page}，样例1：':name'，样例2：'/list_${page}.html'，默认为 空
 * @property {string} [url_index] - 首页URL模板，可为路由名字，可用参数：页码${page}，样例1：':name'，样例2：'/list_${page}.html'，默认为 空
 * @property {string} [index_tpl] - 首页模板，默认为 '<li class="index"><a href="${url}">首页</a></li>'
 * @property {string} [end_tpl] - 末页模板，默认为 '<li class="end"><a href="${url}">末页</a></li>'
 * @property {string} [prev_tpl] - 上一页模板，默认为 '<li class="prev"><a href="${url}">上一页</a></li>'
 * @property {string} [next_tpl] - 下一页模板，默认为 '<li class="next"><a href="${url}">下一页</a></li>'
 * @property {string} [list_tpl] - 数字页模板，默认为 '<li><a href="${url}">${page}</a></li>'
 * @property {string} [active_tpl] - 当前页模板，默认为 '<li class="active"><a href="${url}">${page}</a></li>'
 * @property {string} [info_tpl] - 分页信息模板，默认为 '<span class="info">共${total_page}页，${total}条记录</span>'
 * @property {string} [template] - 渲染模板，默认为 '<div class="pagination"><ul class="page">${index}${prev}${list}${next}${end}</ul>${info}</div>'
 */

/**
 * @typedef {('all' | 'get' | 'put' | 'post' | 'patch' | 'delete' | 'del')} RouteMethod - 请求方法
 * @typedef {Object} RouteConfigItem - 路由配置
 * @property {RouteMethod} [method] - 请求方法，支持['all', 'get', 'put', 'post', 'patch', 'delete', 'del']，默认为 'all'
 * @property {string} url - 请求url，支持变量正则，详细参考@koa/router
 * @property {(string|Middleware)} path - 响应地址(支持智能解析)或中间件函数，如果为中间件函数，则不会再执行后续代码
 * @property {string} [type='AppConfig.controller_folder'] - 响应类型，即path对应的类型，支持controller、middleware、view(ViewConfig.view_folder)
 * @property {string} [name] - 路由命名，命一个名字后，可以使用Url类反向编译路由url
 */

/**
 * @typedef {RouteConfigItem[]} RouteConfig - 路由配置
 */

/**
 * @typedef {import('cookies').SetOption} CookieConfig - Cookie配置，一般不用设置
 * @typedef {typeof import('koa').prototype.keys} Keygrip
 */

/**
 * @typedef {Object} TplConfig - 跳转、调试模板配置
 * @property {string} [jump] - 跳转模板，默认require('./tpl/jump')
 * @property {string} [exception] - 调试异常输出模板，默认require('./tpl/exception')
 */

/**
 * @typedef {Object} Config - 系统配置
 * @property {AppConfig} app
 * @property {ViewConfig} view
 * @property {DbConfig} db
 * @property {LogConfig} log
 * @property {CacheConfig} cache
 * @property {PageConfig} page
 * @property {RouteConfig} routes
 * @property {CookieConfig & {keys?: String[] | Keygrip | undefined}} cookie
 * @property {TplConfig} tpl
 */


//------------------数据库类--------------------
/**
 * @typedef {import('mysql').Pool} Pool - 连接池
 * @typedef {import('mysql').PoolConfig} PoolConfig - 连接池配置
 * @typedef {import('mysql').PoolConnection} PoolConnection - 连接池连接
 * @typedef {import('mysql').QueryOptions} QueryOptions - 查询参数
 * @typedef {import('mysql').OkPacket} OkPacket - 数据库查询结果
 * @typedef {Object.<string, any>} RowData - 单条数据
 * @typedef {Array<RowData>} ListData - 多条数据
 * @typedef {('and' | 'or' | undefined)} Link - where连接条件
 * @typedef {('=' | '<>' | '!=' | '>' | '>=' | '<' | '<=' | 'like' | 'not like' | 'in' | 'not in' | 'between' | 'not between' | 'is' | 'is not' | 'exp')} Operator - where字段操作符
 * @typedef {Object.<string, (string | number | [Operator, any])>} Where - where条件数据
 * @typedef {Object.<string, any>} DbData - Db数据
 */

/**
 * @typedef {Object} FieldInfo - 字段信息
 * @property {string} Field
 * @property {string} Type
 * @property {string} Null
 * @property {string} Key
 * @property {string} Default
 * @property {string} Extra
 */

/**
 * @typedef {Object} _DbOptions - 数据库查询选项
 * @property {string} distinct - DISTINCT关键字
 * @property {string[]} field - 查询字段列表
 * @property {Object.<string, {on: string, type: string}>} join - 表连接配置
 * @property {Array.<[Where, Link?]>} where - 查询条件数组
 * @property {string} group - GROUP BY子句
 * @property {string} having - HAVING子句
 * @property {Object.<string, string>} order - 排序配置
 * @property {string} limit - LIMIT子句
 * @property {Object.<string, number>} page - 分页配置
 * @property {boolean} getSql - 是否返回SQL语句
 * @property {Object.<string, any>} data - 数据对象
 * @property {boolean|string|string[]} allowField - 允许的字段
 * @property {string} prefix - 表前缀
 * @property {number} [cache_time] - 缓存时间
 */

/**
 * @typedef {import('./lib/db/sql')} Sql - Sql类
 * @typedef {import('./lib/db/sql').prototype} SqlInstance - Sql实例
 */


//------------------上传类--------------------
/**
 * @typedef {Object} UploadData
 * @property {string} [filename]
 * @property {string} [extname]
 * @property {string} [savename]
 * @property {string} [filepath]
 * @property {string} [name]
 * @property {number} [size]
 * @property {string} [mimetype]
 * @property {string} [hash]
 * /
 * 
/**
 * @typedef {Object} ValidateRule
 * @property {number} [size] - 文件大小
 * @property {string} [ext] - 文件名后缀，多个用','隔开
 * @property {string} [type] - 文件mimetype，多个用','隔开
 */


//------------------系统工具--------------------
/**
 * @typedef {Object} Utils
 * @property {typeof import('./lib/utils/date')} date
 * @property {typeof import('./lib/utils/error')} error
 * @property {typeof import('./lib/utils/fs')} fs
 * @property {typeof import('./lib/utils/md5')} md5
 * @property {typeof import('./lib/utils/str')} str
 */


//------------------Koa Context--------------------
/**
 * @typedef {import('koa').Context} KoaCtx - Koa ctx
 * @callback AsyncNext - 中间件函数
 */


//------------------Ctx系统基类--------------------
/**
 * @class Ctx
 */
class Ctx {
    /** @type {$} */
    $;

    /** @type {Utils} */
    $utils;

    /** @type {Config} */
    $config;

    /** @type {Cache} */
    $cache;

    /** @type {Logger} */
    $logger;

    /** @type {Context & ContextInstance} */
    $context;

    /** @type {Controller & ControllerInstance} */
    $controller;

    /** @type {Cookie & CookieInstance} */
    $cookie;

    /** @type {Db & DbInstance} */
    $db;

    /** @type {Middleware & MiddlewareInstance} */
    $middleware;

    /** @type {Model & ModelInstance} */
    $model;

    /** @type {Pagination & PaginationInstance} */
    $pagination;

    /** @type {Request & RequestInstance} */
    $request;

    /** @type {Response & ResponseInstance} */
    $response;

    /** @type {Upload & UploadInstance} */
    $upload;

    /** @type {Url & UrlInstance} */
    $url;

    /** @type {View & ViewInstance} */
    $view;
}

/**
 * @module Types
 */
module.exports = Ctx;
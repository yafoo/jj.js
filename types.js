//------------------系统核心库------------------
/**
 * @typedef {Object} Core
 * @property {typeof import('./lib/app')} App
 * @property {typeof import('./lib/cache')} Cache
 * @property {typeof import('./lib/context')} Context
 * @property {typeof import('./lib/controller')} Controller
 * @property {typeof import('./lib/cookie')} Cookie
 * @property {typeof import('./lib/db')} Db
 * @property {typeof import('./lib/logger')} Logger
 * @property {typeof import('./lib/middleware')} Middleware
 * @property {typeof import('./lib/model')} Model
 * @property {typeof import('./lib/pagination')} Pagination
 * @property {typeof import('./lib/response')} Response
 * @property {typeof import('./lib/upload')} Upload
 * @property {typeof import('./lib/url')} Url
 * @property {typeof import('./lib/view')} View
 * @property {Utils} utils
 */


//------------------系统App配置---------------------
/**
 * @typedef {Object} AppConfig - 系统配置
 * @property {boolean} [app_debug=true] - 调试模式
 * @property {boolean} [app_multi=false] - 是否开启多应用
 * @property {string} [default_app=app] - 默认应用
 * @property {string} [default_controller=index] - 默认控制器
 * @property {string} [default_action=index] - 默认方法
 * @property {string} [common_app=common] - 公共应用，存放公共模型及逻辑
 * @property {string} [controller_folder=controller] - 控制器目录名
 * @property {(string|boolean)} [static_dir=''] - 静态文件目录，相对于应用根目录，为空或false时，关闭静态访问
 * @property {(string|boolean|null|object)} [koa_body=null] - koa-body配置参数，为''、null、false时，关闭koa-body
 * @property {string} [base_dir] - 应用根目录（会自动计算）
 */

/**
 * @typedef {Object} ViewConfig - 模板配置
 * @property {string} [view_folder=view] - 模板目录名
 * @property {string} [view_depr='/'] - 模版文件名分割符，'/'代表二级目录
 * @property {string} [view_ext='.htm'] - 模版文件后缀
 * @property {string} [view_engine=art-template] - 默认模版引擎，字符串或引擎类
 * @property {object} [view_filte={}] - 模版函数
 */

/**
 * @typedef {Object} DbConfigItem - 数据库参数
 * @property {string} [type=mysql] - 数据库类型
 * @property {string} [host='127.0.0.1'] - 服务器地址
 * @property {string} [database=jj] - 数据库名
 * @property {string} [user=root] - 数据库用户名
 * @property {string} [password=''] - 数据库密码
 * @property {string} [port=''] - 数据库连接端口
 * @property {string} [charset=utf8] - 数据库编码默认采用utf8
 * @property {string} [prefix=jj_] - 数据库表前缀
 */

/**
 * @typedef {object} DbConfig - 数据库配置
 * @property {DbConfigItem} default - 数据库参数
 */

/**
 * @callback LogHandle - 日志驱动
 * @param {string} level - 日志级别
 * @param {array} args - 日志数据，支持多个，支持对象
 */

/**
 * @typedef {object} LogConfig - 日志配置
 * @property {array} [log_level] - 允许输出的日志级别
 * @property {LogHandle} [log_handle] - 日志驱动
 */

/**
 * @typedef {Object} CacheConfig - 缓存配置
 * @property {number} [cache_time='60 * 60 * 24'] - 缓存时间，默认1天，为空或false则为10年
 * @property {number} [clear_time=undefined] - 缓存自动清理周期，undefined: 清理一次, 0: 关闭自动清理, >0: 为周期时间，单位秒
 */

/**
 * @typedef {Object} PageConfig - 分页配置
 * @property {string} [page_key=page] - 分页标识
 * @property {string} [key_origin=query] - page_key来源
 * @property {number} [page_size=10] - page_key来源
 * @property {number} [page_length=5] - page_key来源
 * @property {string} [url_page] - page_key来源
 * @property {string} [url_index] - page_key来源
 * @property {string} [index_tpl] - 首页模板
 * @property {string} [end_tpl] - 末页模板
 * @property {string} [prev_tpl] - 上一页模板
 * @property {string} [next_tpl] - 下一页模板
 * @property {string} [list_tpl] - 数字页模板
 * @property {string} [active_tpl] - 当前页模板
 * @property {string} [info_tpl] - 分页信息模板
 * @property {string} [template] - 渲染模板
 */

/**
 * @typedef {Object} RouteConfigItem - 路由配置
 * @property {string} [method=all] - 请求方法，支持['all', 'get', 'put', 'post', 'patch', 'delete', 'del']
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
 */

/**
 * @typedef {Object} TplConfig - 跳转、调试模板配置
 * @property {string} [jump] - 跳转模板，默认require('./tpl/jump')
 * @property {string} [exception] - 调试异常输出模板，默认require('./tpl/exception')
 */

/**
 * @typedef {Object} Config - 系统配置
 * @property {AppConfig} [app]
 * @property {ViewConfig} [view]
 * @property {DbConfig} [db]
 * @property {LogConfig} [log]
 * @property {CacheConfig} [cache]
 * @property {PageConfig} [page]
 * @property {RouteConfig} [routes]
 * @property {CookieConfig} [cookie]
 * @property {TplConfig} [tpl]
 */


//------------------分页类--------------------
/**
 * @typedef {typeof import('./lib/pagination')} Pagination - 分页类
 * @typedef {typeof import('./lib/pagination').prototype} PaginationInstance - 分页类实例
 */


//------------------数据库类--------------------
/**
 * @typedef {import('mysql').Pool} Pool - 连接池
 * @typedef {import('mysql').PoolConfig} PoolConfig - 连接池配置
 * @typedef {import('mysql').PoolConnection} PoolConnection - 连接池连接
 * @typedef {import('mysql').QueryOptions} QueryOptions - 查询参数
 * @typedef {import('mysql').OkPacket} OkPacket - 数据库查询结果
 * @typedef {Object} RowData - 单条数据
 * @typedef {Array<RowData>} ListData - 多条数据
 * @typedef {Object} FieldInfo - 字段信息
 * @property {string} Field
 * @property {string} Type
 * @property {string} Null
 * @property {string} Key
 * @property {string} Default
 * @property {string} Extra
 * @typedef {Map<Pool>} PoolMap
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


//------------------系统Context--------------------
/**
 * @typedef {import('koa').Context} Context
 * @typedef {import('koa').Middleware} Middleware
 */


//------------------Ctx系统基类--------------------
/**
 * @class Ctx
 */
class Ctx {
    /**
     * @desc 系统缓存类
     * @type {typeof import('./lib/cache')}
     */
    $cache;

    /**
     * @type {typeof import('./lib/context').prototype}
     */
    $context;

    /**
     * @type {typeof import('./lib/controller').prototype}
     */
    $controller;

    /**
     * @type {typeof import('./lib/cookie').prototype}
     */
    $cookie;

    /**
     * @type {typeof import('./lib/db').prototype}
     */
    $db;

    /**
     * @type {typeof import('./lib/logger')}
     */
    $logger;

    /**
     * @type {typeof import('./lib/middleware').prototype}
     */
    $middleware;

    /**
     * @type {typeof import('./lib/model').prototype}
     */
    $model;

    /**
     * @type {typeof import('./lib/pagination').prototype}
     */
    $pagination;

    /**
     * @type {typeof import('./lib/response').prototype}
     */
    $response;

    /**
     * @type {typeof import('./lib/upload').prototype}
     */
    $upload;

    /**
     * @type {typeof import('./lib/url').prototype}
     */
    $url;

    /**
     * @type {typeof import('./lib/view').prototype}
     */
    $view;

    /**
     * @type {Utils}
     */
    $utils;

    /**
     * @type {Config}
     */
    $config;
}

/**
 * @module Types
 */
module.exports = Ctx;
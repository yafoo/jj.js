const path = require('path');
const loader = require('./loader');
const {format} = require('./utils/date');

const app = {
    app_debug: true, // 调试模式
    app_multi: false, // 是否开启多应用

    default_app: 'app', // 默认应用
    default_controller: 'index', //默认控制器
    default_action: 'index', // 默认方法

    common_app: 'common', // 公共应用，存放公共模型及逻辑
    controller_folder: 'controller', //控制器目录名

    static_dir: '', // 静态文件目录，相对于应用根目录，为空或false时，关闭静态访问

    koa_body: null // koa-body配置参数，为''、null、false时，关闭koa-body
}

const view = {
    view_folder: 'view', // 模板目录名
    view_depr: '/', // 模版文件名分割符，'/'代表二级目录
    view_ext: '.htm', // 模版后缀
    view_engine: 'art-template', // 默认模版引擎，字符串或引擎类
    view_filter: {}, // 模版函数
}

const db = {
    default: {
        type      : 'mysql', // 数据库类型
        host      : '127.0.0.1', // 服务器地址
        database  : 'jj', // 数据库名
        user      : 'root', // 数据库用户名
        password  : '', // 数据库密码
        port      : '', // 数据库连接端口
        charset   : 'utf8', // 数据库编码默认采用utf8
        prefix    : 'jj_' // 数据库表前缀
    }
}

const log = {
    log_level: [], // [error, warning, info, debug, http, sql]
    log_handle: function(msg, level) {console.log(`[${format('YY-mm-dd HH:ii:ss')}] [${level}] ${typeof msg == 'String' ? msg : JSON.stringify(msg)}`);} //function(msg, level) {}
}

const cache = {
    cache_time: 60 * 60 * 24, // 默认缓存时间（1天），为空或false则为10年
    clear_time: undefined // (undefined: 清理一次, 0: 关闭自动清理, >0: 为自动清理周期)
}

const page = {
    page_key    : 'page', // 默认分页标识
    key_origin    : 'query', // query 或 params
    page_size   : 10, // 默认分页大小
    page_length : 5, // 默认分页长度，数字页码链接数量

    //网址规则，可为空，可为路由名字，可用参数：页码${page}
    //样例：':name'
    //样例：'/list_${page}.html'
    url_page    : '',
    url_index   : '',

    //模块样式 可用参数：网址${url}，页码${page}，总数${total_page}，总页数${total_page}
    index_tpl   : '<li class="index"><a href="${url}">首页</a></li>',
    end_tpl     : '<li class="end"><a href="${url}">末页</a></li>',
    prev_tpl    : '<li class="prev"><a href="${url}">上一页</a></li>',
    next_tpl    : '<li class="next"><a href="${url}">下一页</a></li>',
    list_tpl    : '<li><a href="${url}">${page}</a></li>',
    active_tpl  : '<li class="active"><a href="${url}">${page}</a></li>',
    info_tpl    : '<span class="info">共${total_page}页，${total}条记录</span>',

    //渲染模版
    template   : '<div class="pagination"><ul class="page">${index}${prev}${list}${next}${end}</ul>${info}</div>'
}

const tpl = {
    jump: require('./tpl/jump'),
    exception: require('./tpl/exception')
}

const base_dir = path.dirname(module.parent.parent.parent.filename);
const config = loader(path.join(base_dir, './config'));

module.exports = {
    app: {...app, ...config.app, base_dir},
    view: {...view, ...config.view},
    db: {...db, ...config.db},
    log: {...log, ...config.log},
    cache: {...cache, ...config.cache},
    page: {...page, ...config.page},
    routes: config.routes,
    cookie: config.cookie,
    tpl: {...tpl, ...config.tpl}
};
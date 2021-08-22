const app = {
    app_debug: true, //调试模式
    app_multi: false, //是否开启多应用

    default_app: 'app', //默认应用
    default_controller: 'index', //默认控制器
    default_action: 'index', //默认方法

    common_app: 'common', //公共应用，存放公共模型及逻辑
    controller_folder: 'controller', //控制器目录名
    view_folder: 'view', //模板目录名
    
    view_engine: 'art', //默认模版引擎，内置（ejs, art）
    view_depr: '_', //模版文件名分割符，'/'代表二级目录
    view_ext: '.htm', //模版后缀
    view_filter: {}, //模版函数

    static_dir: './public', //静态文件目录，相对于应用根目录，为空或false时，关闭静态访问

    koa_body: null //koa-body配置参数，为''、null、false时，关闭koa-body
}

module.exports = app;
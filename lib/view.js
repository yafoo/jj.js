const path = require('path');
const {readFile, isFileSync} = require('./utils/fs');
const {app: cfg_app, view: cfg_view} = require('./config');
const {toLine} = require('./utils/str');
const Context = require('./context');

class View extends Context
{
    constructor(ctx) {
        super(ctx);
        this._data = {};
        this.setEngine(cfg_view.view_engine);
    }
    
    // 加载文件
    async load(template) {
        const file_name = this.parsePath(template);
        if(!isFileSync(file_name)) {
            throw new Error(`文件不存在(${file_name})`);
        }
        return await readFile(file_name);
    }

    // 渲染内容
    async render(content) {
        return this._engine.render(content, this._data);
    }

    // 渲染文件
    async fetch(template) {
        const file_name = this.parsePath(template);
        if(!isFileSync(file_name)) {
            throw new Error(`文件不存在(${file_name})`);
        }
        return await this._engine(file_name, this._data || {});
    }

    //赋值模版数据
    assign(name, value) {
        if(typeof name == 'string') {
            this._data[name] = value;
        } else {
            this._data = name;
        }
        return this;
    }

    //获取模版数据
    data(name) {
        if(name) return this._data[name];
        else return this._data;
    }

    //解析模板地址
    parsePath(template=this.ctx.ACTION) {
        let view_file = template;
        if(view_file.indexOf('/') !== 0) {
            const temp = view_file.replace(/^\/|\/$/g, '').split('/').reverse().map(u => toLine(u));
            if(temp.length <= 3) {
                view_file = `${temp[2] || this.ctx.APP}/${cfg_view.view_folder}/${temp[1] || this.ctx.CONTROLLER}${cfg_view.view_depr}${temp[0]}`;
            }
        }
        path.extname(view_file) || (view_file += cfg_view.view_ext);
        return path.join(this.$config.app.base_dir, view_file);
    }

    // 设置模版引擎
    setEngine(engine) {
        this._engine = typeof engine == 'string' ? require(engine) : engine;
        this._engine.defaults.debug = cfg_app.app_debug;
        this.setFilter('url', (...args) => {
            return this.$url.build(...args);
        });
        this.setFilter(cfg_view.view_filter);
        return this;
    }

    //设置模版函数
    setFilter(fun_obj, fun) {
        if(typeof fun_obj === 'string') {
            fun_obj = {[fun_obj]: fun};
        }

        for(let fun_name in fun_obj) {
            this._engine.defaults.imports[fun_name] = fun_obj[fun_name];
        }
        return this;
    }
}

module.exports = View;
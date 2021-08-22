const path = require('path');
const {readFile} = require('./utils/fs');
const {app: cfg_app} = require('./config');
const engine = {};
const Context = require('./context');
let url;

class View extends Context {
    constructor(ctx) {
        super(ctx);
        this._engine = cfg_app.view_engine;
        this._data = {};
    }

    //直接内容输出
    async show(content){
        this.ctx.body = content;
    }

    //直接文件输出
    async load(template, html=false){
        const temp_file = this.parsePath(template);
        const content = await readFile(temp_file);
        if(html) return content;
        else this.ctx.body = content;
    }

    //渲染内容输出
    async render(content, html=false){
        content = this[this._engine]['render'](content, this._data);
        if(html) return content;
        else this.ctx.body = content;
    }

    //渲染文件输出
    async fetch(template, html=false){
        const temp_file = this.parsePath(template);
        const content = await this[this._engine]['renderFile'](temp_file, this._data, {filename: temp_file, cache: cfg_app.app_debug});
        if(html) return content;
        else this.ctx.body = content;
    }

    //赋值模版数据
    assign(name, value){
        this._data[name] = value;
    }

    //获取模版数据
    data(name){
        if(name) return this._data[name];
        else return this._data;
    }

    //设置模版引擎
    engine(value){
        this._engine = value;
    }

    //解析模板地址
    parsePath(template=this.ctx.ACTION){
        let view_file = template;
        if(view_file.indexOf('/') !== 0) {
            const temp = view_file.replace(/^\/|\/$/g, '').split('/').reverse();
            if(temp.length <= 3) {
                view_file = `${temp[2] || this.ctx.APP}/${cfg_app.view_folder}/${temp[1] || this.ctx.CONTROLLER}${cfg_app.view_depr}${temp[0]}`;
            }
        }
        path.extname(view_file) || (view_file += cfg_app.view_ext);
        view_file = path.join(this.ctx.$.$map.path, './', view_file);
        return view_file;
    }

    //ejs引擎
    get ejs(){
        if(!engine.ejs) {
            engine.ejs = require('ejs');
            this.filterUrl();
            this.filter(cfg_app.view_filter);
        }
        url.ctx = this.ctx;
        return engine.ejs;
    }

    //art引擎
    get art(){
        if(!engine.art) {
            engine.art = require('art-template');
            engine.art.renderFile = engine.art;
            this.filterUrl();
            this.filter(cfg_app.view_filter);
        }
        url.ctx = this.ctx;
        return engine.art;
    }

    //设置模版函数
    filter(fun_obj, fun) {
        typeof fun_obj === 'string' && (fun_obj = {[fun_obj]: fun});
        for(let i in fun_obj) {
            switch(this._engine) {
                case 'ejs':
                    this[this._engine]['filters'][i] = fun_obj[i];
                    break;
                case 'art':
                    this[this._engine]['defaults']['imports'][i] = fun_obj[i];
                    break;
            }
        }
    }

    //设置模版url函数
    filterUrl() {
        url || (url = new (require('./url'))());
        this.filter('url', (...args) => {
            return url.build(...args);
        });
    }
}

module.exports = View;
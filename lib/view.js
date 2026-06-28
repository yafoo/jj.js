const path = require('path');
const {isFileSync} = require('./utils/fs');
const {readFile} = require('fs').promises;
const {app: cfg_app, view: cfg_view} = require('./config');
const {getViewPath} = require('./utils/parse');
const Context = require('./context');

/**
 * @typedef {import('../types').KoaCtx} KoaCtx
 * @typedef {import('../types').ViewEngine} ViewEngine
 * @typedef {import('../types').ViewFilter} ViewFilter
 * @typedef {import('../types').UrlInstance} UrlInstance
 */

/**
 * @extends Context
 */
class View extends Context
{
    /**
     * @type {Object.<string, any>}
     */
    _data = {};

    /**
     * @type {ViewEngine}
     */
    // @ts-ignore
    _engine = null;

    /**
     * Initialize a new `View`
     * @public
     * @param {KoaCtx} ctx
     */
    constructor(ctx) {
        super(ctx);
        this.setEngine(cfg_view.view_engine);
    }
    
    /**
     * 获取文件内容
     * @public
     * @param {string} [template]
     * @returns {Promise<string>}
     */
    async load(template) {
        const file_name = this.parseTplName(template);
        return (await readFile(file_name)).toString();
    }

    /**
     * 渲染(解析数据)内容
     * @public
     * @param {string} content
     * @returns {Promise<string>}
     */
    async render(content) {
        return this._engine.render(content, this._data);
    }

    /**
     * 渲染(解析数据)文件
     * @public
     * @param {string} [template]
     * @returns {Promise<string>}
     */
    async fetch(template) {
        const file_name = this.parseTplName(template);
        return await this._engine(file_name, this._data || {});
    }

    /**
     * 模版数据赋值
     * @public
     * @param {(string|object)} name
     * @param {*} [value]
     * @returns {this}
     */
    assign(name, value) {

        if(typeof name == 'string') {console.log('assign', this, Object.keys(this));
            this._data[name] = value;
        } else {
            this._data = name;
        }
        return this;
    }

    /**
     * 获取模版数据
     * @public
     * @param {string} [name]
     * @returns {object}
     */
    data(name) {
        if(name) return this._data[name];
        else return this._data;
    }

    /**
     * 解析模板地址
     * @public
     * @param {string} [template] - 默认当前请求方法名，支持智能解析
     * @param {string} [view_folder] - 模板文件夹名字
     * @param {string} [view_depr] - 模板文件分隔符
     * @returns {string}
     */
    parsePath(template = '', view_folder, view_depr) {
        const view_file = getViewPath(
            template || '',
            this.ctx.DEEP,
            this.ctx.CONTROLLER,
            this.ctx.ACTION,
            view_folder || cfg_view.view_folder,
            view_depr || cfg_view.view_depr,
            cfg_view.view_ext
        );
        return path.join(cfg_app.base_dir, 'app', view_file);
    }

    /**
     * 解析模板名字
     * @public
     * @param {string} [template] - 默认当前请求方法名，支持智能解析
     * @returns {string}
     */
    parseTplName(template = '') {
        let file_name = this.parsePath(template, this._folder, this._depr);
        let is_file = isFileSync(file_name);
        if(!is_file && (this._folder || this._depr)) {
            file_name = this.parsePath(template);
            is_file = isFileSync(file_name);
        }
        if(!is_file) {
            file_name = this.parsePath(template, this._folder, this._depr);
            throw new Error(`ViewError: 文件不存在(${file_name})`);
        }
        return file_name;
    }

    /**
     * 设置模版引擎
     * @public
     * @param {(string|object)} engine 
     * @returns {this}
     */
    setEngine(engine) {
        this._engine = typeof engine == 'string' ? require(engine) : engine;
        this._engine.defaults.debug = cfg_app.app_debug;
        // @ts-ignore
        this.setFilter('url', (...args) => {
            return this._$url.build(...args);
        });
        this.setFilter(cfg_view.view_filter);
        return this;
    }

    /**
     * 设置模版函数
     * @public
     * @param {(string|ViewFilter)} fun_obj - 函数名字或者包含多个函数的对象
     * @param {*} [fun] - 函数
     * @returns {this}
     */
    setFilter(fun_obj, fun) {
        if(typeof fun_obj === 'string') {
            fun_obj = {[fun_obj]: fun};
        }

        for(let fun_name in fun_obj) {
            this._engine.defaults.imports[fun_name] = fun_obj[fun_name];
        }
        return this;
    }

    /**
     * 设置模板目录
     * @public
     * @param {string} view_folder - 文件夹名字
     * @returns {this}
     */
    setFolder(view_folder) {
        this._folder = view_folder;
        return this;
    }

    /**
     * 设置文件分割符
     * @public
     * @param {string} view_depr - 文件分隔符（默认'/'，不分二级目录，可以设置为'_'或其他）
     * @returns {this}
     */
    setDepr(view_depr) {
        this._depr = view_depr;
        return this;
    }

    /**
     * @type {UrlInstance} Url实例
     * @private
     */
    // @ts-ignore
    __url = null;

    /**
     * @type {UrlInstance} Url实例
     */
    get _$url() {
        if(this.__url === null) {
            if(this.$url && this.$url.__ISCLASS__) {
                this.__url = this.$url;
            } else if(this.$ && this.$.url) {
                this.__url = this.$.url;
            } else {
                this.__url = new (require('./url'))(this.ctx);
            }
        }
        return this.__url;
    }

    set _$url(url) {
        this.__url = url;
    }
}

module.exports = View;
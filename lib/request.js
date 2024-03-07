const Context = require('./context');

class Request extends Context
{
    /**
     * Initialize a new `Request`
     * @public
     * @param {import('../types').KoaCtx} ctx
     */
    constructor(ctx) {
        super(ctx);
        /**
         * @type {import('querystring').ParsedUrlQuery}
         * @private
         */
        this._get = {...this.ctx.query};
        /**
         * @private
         */
        this._post = {...this.ctx.request.body};
        /**
         * @private
         */
        this._param = {...this.ctx.params};
    }

    /**
     * 智能获取请求数据
     * @param {string} key
     * @param {*} [default_value='']
     * @returns {*}
     */
    query(key, default_value='') {
        return this.post(key) || this.get(key) || this.param(key) || default_value;
    }

    /**
     * 获取param请求数据
     * @param {string} key
     * @param {*} default_value
     * @returns {*}
     */
    param(key, default_value='') {
        return this._param[key] || default_value;
    }

    /**
     * 获取get请求数据
     * @param {string} key
     * @param {*} default_value
     * @returns {*}
     */
    get(key, default_value='') {
        return Array.isArray(this._get[key]) ? this._get[key][0] : this._get[key] || default_value;
    }

    /**
     * 获取post请求数据
     * @param {string} key
     * @param {*} default_value
     * @returns {*}
     */
    post(key, default_value='') {
        return this._post[key] || default_value;
    }


    /**
     * 获取所有请求数据
     * @returns {Object}
     */
    queryAll() {
        return {...this._param, ...this._get, ...this._post};
    }

    /**
     * 获取所有param数据
     * @returns {Object}
     */
    paramAll() {
        return this._param;
    }

    /**
     * 获取所有get数据
     * @returns {Object}
     */
    getAll() {
        return this._get;
    }

    /**
     * 获取所有post数据
     * @returns {Object}
     */
    postAll() {
        return this._post;
    }

    /**
     * 获取上传file数据
     * @param {string} key
     * @returns {import('formidable').File | import('formidable').File[]}
     */
    file(key) {
        return this.ctx.request.files[key];
    }

    /**
     * 获取上传file数据
     * @returns {import('formidable').Files}
     */
    fileAll() {
        return this.ctx.request.files;
    }

    /**
     * 获取请求应用名
     * @returns {string}
     */
    app() {
        return this.ctx.APP;
    }

    /**
     * 获取请求控制器名
     * @returns {string}
     */
    controller() {
        return this.ctx.CONTROLLER;
    }

    /**
     * 获取请求方法名
     * @returns {string}
     */
    action() {
        return this.ctx.ACTION;
    }

    /**
     * 获取请求url
     * @returns {string}
     */
    url() {
        return this.ctx.url;
    }

    /**
     * 获取请求方式
     * @returns {string}
     */
    method() {
        return this.ctx.method.toLowerCase();
    }

    /**
     * 判断是否get请求
     * @returns {boolean}
     */
    isGet() {
        return this.method() == 'get';
    }

    /**
     * 判断是否post请求
     * @returns {boolean}
     */
    isPost() {
        return this.method() == 'post';
    }

    /**
     * 判断是否ajax请求
     * @public
     * @returns {boolean}
     */
    isAjax() {
        return this.ctx.headers['x-requested-with'] && String(this.ctx.headers['x-requested-with']).toLowerCase() == 'xmlhttprequest'
            || this.ctx.request.type.toLowerCase() == 'application/json'
            || this.query('is_ajax')
            ? true : false;
    }

    /**
     * 获取header请求数据
     * @param {string} key
     * @param {*} default_value
     * @returns {*}
     */
    header(key, default_value='') {
        return this.ctx.headers[key] || default_value;
    }

    /**
     * 获取所有header请求数据
     * @returns {Object}
     */
    headerAll() {
        return this.ctx.headers;
    }
}

module.exports = Request;
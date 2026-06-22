const {tpl: cfg_tpl} = require('./config');
const {parseError} = require('./utils/error');
const Context = require('./context');

/**
 * @typedef {import('../types').KoaCtx} KoaCtx
 * @typedef {import('../types').RequestInstance} RequestInstance
 * @typedef {import('../types').UrlInstance} UrlInstance
 */

/**
 * @extends Context
 */
class Response extends Context
{
    /**
     * Initialize a new `Response`
     * @public
     * @param {KoaCtx} ctx
     */
    constructor(ctx) {
        super(ctx);
        this._tpl_jump = cfg_tpl.jump;
        this._wait = 3;
        this._tpl_exception = cfg_tpl.exception;
    }

    /**
     * 直接输出内容
     * @public
     * @param {*} data
     */
    show(data) {
        this.ctx.body = data;
    }

    /**
     * 跳转重定向
     * @public
     * @param {*} url
     * @param {number} status
     */
    redirect(url, status=302) {
        this.ctx.status = status;
        this.ctx.redirect(this._$url.build(url));
    }

    /**
     * 输出成功提示（html|json）
     * @public
     * @param {(string|object)} [msg]
     * @param {(string|object)} [url]
     */
    success(msg='操作成功！', url) {
        typeof msg == 'object' && ([msg, url] = ['操作成功！', msg]);
        url = typeof url == 'string' ? this._$url.build(url) : (url || this.ctx.header.referer);
        this.jump(msg, url, 1);
    }

    /**
     * 输出错误提示（html|json）
     * @public
     * @param {(string|object)} [msg]
     * @param {(string|object)} [url]
     */
    error(msg='操作失败！', url) {
        typeof msg == 'object' && ([msg, url] = ['操作失败！', msg]);
        url = typeof url == 'string' ? this._$url.build(url) : (url || 'javascript:history.back(-1);');
        this.jump(msg, url, 0);
    }

    /**
     * jump
     * @api protected
     * @param {(string|object)} msg
     * @param {(string|object)} url
     * @param {number} state 
     */
    jump(msg, url, state=1) {
        const tplData = {state, msg, url, wait: this._wait};
        this.ctx.body = this._$request.isAjax() ? {state, msg, data: url} : this._tpl_jump.replace(/\{\$(\w+)\}/g, (...args) => {
            return tplData[args[1]];
        });
    }

    /**
     * 设置跳转等待时间
     * @public
     * @param {number} time - 单位秒
     * @returns {this}
     */
    wait(time) {
        this._wait = time;
        return this;
    }

    /**
     * 输出异常信息（html|json）
     * @public
     * @param {Error} err
     */
    exception(err) {
        const escapeHtml = require('escape-html');
        const tplData = parseError(err);
        tplData.msg = escapeHtml(tplData.msg);
        tplData.code = '<span class="line">' + tplData.code.map(str => escapeHtml(str)).join('</span><span class="line">') + '</span>';
        tplData.stack = tplData.stack.map(str => escapeHtml(str)).join('<br>');
        this.ctx.body = this._$request.isAjax() ? {state: 0, msg: tplData.msg, stack: tplData.stack} : this._tpl_exception.replace(/\{\$(\w+)\}/g, (...args) => {
            return tplData[args[1]];
        });
    }

    /**
     * @type {RequestInstance} Request实例
     * @private
     */
    // @ts-ignore
    __request = null;

    /**
     * @type {RequestInstance} Request实例
     */
    get _$request() {
        if(this.__request === null) {
            if(this.$request && this.$request.__ISCLASS__) {
                this.__request = this.$request;
            } else if(this.$ && this.$.request) {
                this.__request = this.$.request;
            } else {
                this.__request = new (require('./request'))(this.ctx);
            }
        }
        return this.__request;
    }

    set _$request(request) {
        this.__request = request;
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

module.exports = Response;
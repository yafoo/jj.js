const {tpl: cfg_tpl} = require('./config');
const {parseError} = require('./utils/error');
const Context = require('./context');

/**
 * @typedef {import('../types').KoaCtx} KoaCtx
 * @typedef {import('../types').RequestInstance} RequestInstance
 * @typedef {import('../types').UrlInstance} UrlInstance
 * @typedef {'__EXIT__'} EXIT
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
     * @returns {EXIT}
     */
    show(data) {
        this.ctx.body = data;
        return this.exit();
    }

    /**
     * 跳转重定向
     * @public
     * @param {*} url
     * @param {number} status
     * @returns {EXIT}
     */
    redirect(url, status=302) {
        this.ctx.status = status;
        this.ctx.redirect(this._$url.build(url));
        return this.exit();
    }

    /**
     * 输出成功提示（html|{state, msg, data}）
     * @public
     * @param {(string|object)} [msg]
     * @param {(string|object)} [url] - 跳转url地址，或ajax请求时返回的data数据
     * @param {number} [state] - 状态码，默认1，表示成功
     * @returns {EXIT}
     */
    success(msg='操作成功！', url, state=1) {
        typeof msg == 'object' && ([msg, url] = ['操作成功！', msg]);
        url = typeof url == 'string' ? this._$url.build(url) : (url || this.ctx.header.referer || '');
        return this.jump(msg, url, state);
    }

    /**
     * 输出错误提示（html|{state, msg, data}）
     * @public
     * @param {(string|object)} [msg]
     * @param {(string|object)} [url] - 跳转url地址，或ajax请求时返回的data数据
     * @param {number} [state] - 状态码，默认0，表示失败
     * @returns {EXIT}
     */
    error(msg='操作失败！', url, state=0) {
        typeof msg == 'object' && ([msg, url] = ['操作失败！', msg]);
        url = typeof url == 'string' ? this._$url.build(url) : (url || 'javascript:history.back(-1);');
        return this.jump(msg, url, state);
    }

    /**
     * jump
     * @api protected
     * @param {(string|object)} msg
     * @param {(string|object)} url
     * @param {number} state 
     * @returns {EXIT}
     */
    jump(msg, url, state=1) {
        const tplData = {state, msg, url, wait: this._wait};
        this.ctx.body = this._$request.isAjax() ? {state, msg, data: url} : this._tpl_jump.replace(/\{\$(\w+)\}/g, (...args) => {
            // @ts-ignore
            return tplData[args[1]];
        });
        return this.exit();
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
     * 输出异常信息（html|{state, msg, data: {code, stack}}）
     * @public
     * @param {Error} err
     * @returns {EXIT}
     */
    exception(err) {
        const tplData = parseError(err);
        if(this._$request.isAjax()) {
            return this.error(tplData.msg, {code: tplData.code, stack: tplData.stack});
        }
        const escapeHtml = require('./utils/escape-html');
        tplData.msg = escapeHtml(tplData.msg);
        // @ts-ignore
        tplData.code = '<span class="line">' + tplData.code.map(str => escapeHtml(str)).join('</span><span class="line">') + '</span>';
        // @ts-ignore
        tplData.stack = tplData.stack.map(str => escapeHtml(str)).join('<br>');
        this.ctx.body = this._tpl_exception.replace(/\{\$(\w+)\}/g, (...args) => tplData[args[1]]);
        return this.exit();
    }

    /**
     * 返回'__EXIT__'
     * @public
     * @returns {EXIT}
     */
    exit() {
        return '__EXIT__';
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
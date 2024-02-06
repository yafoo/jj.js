const {tpl: cfg_tpl} = require('./config');
const {parseError} = require('./utils/error');
const Context = require('./context');

/**
 * @extends Context
 */
class Response extends Context
{
    /**
     * Initialize a new `Response`
     * @public
     * @param {import('./types').Context} ctx
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
        this.ctx.redirect(this.$url.build(url));
    }

    /**
     * 输出成功提示（html|json）
     * @public
     * @param {(string|object)} [msg]
     * @param {(string|object)} [url]
     */
    success(msg='操作成功！', url) {
        typeof msg == 'object' && ([msg, url] = ['操作成功！', msg]);
        url = typeof url == 'string' ? this.$url.build(url) : (url || this.ctx.header.referer);
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
        url = typeof url == 'string' ? this.$url.build(url) : (url || 'javascript:history.back(-1);');
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
        this.ctx.body = this.isAjax() ? {state, msg, data: url} : this._tpl_jump.replace(/\{\$(\w+)\}/g, (...args) => {
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
        this.ctx.body = this.isAjax() ? {state: 0, msg: tplData.msg} : this._tpl_exception.replace(/\{\$(\w+)\}/g, (...args) => {
            return tplData[args[1]];
        });
    }

    /**
     * 判断是否ajax请求
     * @public
     * @returns {boolean}
     */
    isAjax() {
        return this.ctx.headers['x-requested-with'] && String(this.ctx.headers['x-requested-with']).toLowerCase() == 'xmlhttprequest'
            || this.ctx.request.type.toLowerCase() == 'application/json'
            || this.ctx.query.is_ajax
            || this.ctx.request.body && this.ctx.request.body.is_ajax
            ? true : false;
    }
}

module.exports = Response;
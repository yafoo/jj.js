const {tpl: cfg_tpl} = require('./config');
const {parseError} = require('./utils/error');
const Context = require('./context');

class Response extends Context
{
    constructor(ctx) {
        super(ctx);
        this.tpl_jump = cfg_tpl.jump;
        this.wait = 3;
        this.tpl_exception = cfg_tpl.exception;
    }

    show(data) {
        this.ctx.body = data;
    }

    redirect(url, status=302) {
        this.ctx.status = status;
        this.ctx.redirect(this.$url.build(url));
    }

    success(msg='操作成功！', url) {
        typeof msg == 'object' && ([msg, url] = ['操作成功！', msg]);
        url = typeof url == 'string' ? this.$url.build(url) : (url || this.ctx.header.referer);
        this.jump(msg, url, 1);
    }

    error(msg='操作失败！', url) {
        typeof msg == 'object' && ([msg, url] = ['操作失败！', msg]);
        url = typeof url == 'string' ? this.$url.build(url) : (url || 'javascript:history.back(-1);');
        this.jump(msg, url, 0);
    }

    jump(msg, url, state=1) {
        const tplData = {state, msg, url, wait: this.wait};
        this.ctx.body = this.isAjax() ? {state, msg, data: url} : this.tpl_jump.replace(/\{\$(\w+)\}/g, (...args) => {
            return tplData[args[1]];
        });
    }

    wait(time) {
        this.wait = time;
        return this;
    }

    exception(err) {
        const escapeHtml = require('escape-html');
        const tplData = parseError(err);
        tplData.msg = escapeHtml(tplData.msg);
        tplData.code = '<span class="line">' + tplData.code.map(str => escapeHtml(str)).join('</span><span class="line">') + '</span>';
        tplData.stack = tplData.stack.map(str => escapeHtml(str)).join('<br>');
        this.ctx.body = this.isAjax() ? {state: 0, msg: tplData.msg} : this.tpl_exception.replace(/\{\$(\w+)\}/g, (...args) => {
            return tplData[args[1]];
        });
    }

    isAjax() {
        return this.ctx.headers['x-requested-with'] && this.ctx.headers['x-requested-with'].toLowerCase() == 'xmlhttprequest'
            || this.ctx.query.is_ajax
            || this.ctx.request.body && this.ctx.request.body.is_ajax
            ? true : false;
    }
}

module.exports = Response;
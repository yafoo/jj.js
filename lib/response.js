const {tpl: cfg_tpl} = require('./config');
const Context = require('./context');

class Response extends Context {
    constructor(ctx) {
        super(ctx);
        this.tpl_jump = cfg_tpl.jump;
        this.wait = 3;
        this.tpl_exception = cfg_tpl.exception;
    }

    redirect(url, status=302) {
        this.ctx.redirect(this.$$url.build(url), status);
    }

    success(msg='操作成功！', url) {
        typeof msg == 'object' && ([msg, url] = ['操作成功！', msg]);
        url = typeof url == 'string' ? this.$$url.build(url) : (url || this.ctx.header.referer);
        this.jump(msg, url, 1);
    }

    error(msg='操作失败！', url) {
        typeof msg == 'object' && ([msg, url] = ['操作失败！', msg]);
        url = typeof url == 'string' ? this.$$url.build(url) : (url || 'javascript:history.back(-1);');
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
        let stack = err.stack;
        stack = stack.replace(/(\r\n)|(\n)/g, '<br>');
        stack = stack.split('<br>');
        let msg = stack.shift();
        let file_info = stack[0].split(' ').slice(-1)[0].replace(/(\()|(\))/g, '').split(':');
        const column = parseInt(file_info.pop());
        const row = parseInt(file_info.pop());
        const file_path = file_info.join(':');
        let begin = row - 10;
        let end = row + 10;
        if(begin < 0) {
            end -= begin;
            begin = 0;
        }
        let code = require('fs').readFileSync(file_path);
        code = code.toString().split("\n");
        if(begin < 0) {
            end -= begin;
            begin = 0;
        }
        if(end > code.length) {
            begin -= end - code.length;
            end = code.length;
        }
        if(begin < 0) {
            begin = 0;
        }
        code = code.slice(begin, end);
        
        const tplData = {
            msg,
            code: '<span class="line">' + code.join('</span><span class="line">') + '</span>',
            stack: stack.join('<br>'),
            begin,
            row,
            end,
            column,
            nth: row - begin
        };
        this.ctx.body = this.isAjax() ? {state: 0, msg} : this.tpl_exception.replace(/\{\$(\w+)\}/g, (...args) => {
            return tplData[args[1]];
        });
    }

    isAjax() {
        return this.ctx.headers['x-requested-with'] == 'XMLHttpRequest';
    }
}

module.exports = Response;
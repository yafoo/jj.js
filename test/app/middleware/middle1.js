const {Logger} = require('../../../jj.js');

module.exports = class {
    constructor(ctx, next) {
        this.ctx = ctx;
        this.$next = next;
    }

    async test() {
        Logger.info('middle1 test start');
        this.ctx.body = `<!doctype html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
            <title>jj.js</title>
            <link rel="stylesheet" href="/static/lit.css">
            <style>.c{max-width:48em;}</style>
        </head>
        <body style="margin:0;">
            <div class="c">
                <h1>jj.js</h1>
                <hr>
                <div>路由到中间件，中间件输出内容，实际应用中不建议这种操作。</div>
                <hr>
                <div>
                    <a class="btn" href="javascript:history.go(-1);" style="display: inline-block;">返回</a>
                </div>
            </div>
        </body>
        </html>`;

        // 执行$next，将继续向下匹配路由
        //await this.$next();
    }

    async end() {
        Logger.info('middle1 end');
        await this.$next();
        Logger.info('middle1 end await');
    }
}
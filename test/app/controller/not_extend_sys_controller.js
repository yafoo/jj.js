class NotExtendSysController
{
    constructor(ctx) {
        this.ctx = ctx;
    }

    async index() {
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
                <div>不继承系统控制器。</div>
                <hr>
                <div>
                    <a class="btn" href="javascript:history.go(-1);" style="display: inline-block;">返回</a>
                </div>
            </div>
        </body>
        </html>`;
    }
}

module.exports = NotExtendSysController;
routes = [
    {url: '/hello/', path: 'index/hello', method: 'get', type: 'middleware'},
    {url: '/show', path: async (ctx, next) => {ctx.body = `<!doctype html>
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
            <div>路由直接输出内容。</div>
            <hr>
            <div>
                <a class="btn" href="javascript:history.go(-1);" style="display: inline-block;">返回</a>
            </div>
        </div>
    </body>
    </html>`;}, method: 'get', name: 'show'},
    {url: '/index/template', path: '/index/template', type: 'view'},
    {url: '/index/middleware', path: 'middle1/test', type: 'middleware'},
    {url: '/diy', path: 'diy_controller/index', type: 'diy', name: 'diy'},
    {url: '/pagination', path: 'index/pagination', method: 'get'},
    {url: '/pagination/list_:page.html(.*)', path: 'index/pagination', method: 'get'},
    {url: '/file', path: 'index/index', method: 'get', type: 'view'},
    {url: '/test/:var1/:var2/:var3', path: 'index/index', method: 'get', name: 'test'},
];

module.exports = routes;
//const {Controller} = require('jj.js');
const {Controller, Db, Cache, Pagination, Logger, Url, Cookie} = require('../../../jj.js');

class Index extends Controller
{
    constructor(...args) {
        super(...args);
        this.middleware = ['middle', {middleware: 'auth', accept: 'middleTest'}];
    }

    async index() {
        const link_list = [
            {title: '输出字符串内容', url: this.$url.build('show_str')},
            {title: '加载文件显示', url: this.$url.build('load_file')},
            {title: '中间件测试', url: this.$url.build('middle_test')},
            {title: '数据库测试，需要先配置数据库文件', url: this.$url.build('mysql')},
            {title: '缓存测试', url: this.$url.build('cache')},
            {title: '日志测试', url: this.$url.build('log')},
            {title: '路由直接输出', url: this.$url.build(':show')},
            {title: '路由到模板文件直接输出', url: this.$url.build('template')},
            {title: '路由到中间件（不建议这种用法）', url: this.$url.build('middleware')},
            {title: '路由到自定义控制器层', url: this.$url.build(':diy')},
            {title: '不继承系统控制器', url: this.$url.build('not_extend_sys_controller/index')},
            {title: '分页测试', url: this.$url.build('/pagination')},
            {title: 'url生成测试', url: this.$url.build('url')},
            {title: 'Cookie测试', url: this.$url.build('cookie')},
            {title: 'Context测试', url: this.$url.build('context')},
            {title: 'Exception测试', url: this.$url.build('exception')},
            {title: '成功提示', url: this.$url.build('success')},
            {title: '错误提示', url: this.$url.build('error')},
            {title: '302跳转', url: this.$url.build('redirect')},
            {title: 'show object', url: this.$url.build('show')},
        ];

        this.$assign('title', 'jj.js - 一个简单轻量级Node.js MVC框架');
        this.$assign('link_list', link_list);
        await this.$fetch();
    }

    async showStr() {
        this.$show(`<!doctype html>
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
                    <div>控制器输出字符串。</div>
                    <hr>
                    <div>
                        <a class="btn" href="javascript:history.go(-1);" style="display: inline-block;">返回</a>
                    </div>
                </div>
            </body>
            </html>`);
    }

    async loadFile() {
        let readme = await this.$view.load('/../README.md');
        readme = readme.replace('</p>', '</p><hr>');
        this.$assign('content', readme);
        await this.$fetch('view');
    }

    async middleTest() {
        this.$assign('content', '请查看控制台输出！');
        await this.$fetch('view');
    }

    async cache() {
        const cache = this.$cache;
        Logger.info(Cache === cache, Cache.get === cache.get, Cache.get() === cache.get());
        Logger.info('---------------------------');
        Logger.info(JSON.stringify(Cache.get()), JSON.stringify(cache.get()));
        const key1_value = Cache.get('key1');
        Cache.set('key1', key1_value ? key1_value+1 : 1, 10000);
        cache.set('key2', key1_value ? key1_value+100 : 100, 10000);
        Logger.info('---------------------------');
        Logger.info(JSON.stringify(Cache.get()), JSON.stringify(cache.get()));

        this.$assign('content', '请查看控制台输出！');
        await this.$fetch('view');
    }

    async log() {
        this.$logger.info('logger.info');
        Logger.error('logger.error');
        Logger.warning('logger.warning');
        Logger.debug('logger.debug');
        Logger.sql('logger.sql');
        Logger.http('logger.http');
        Logger.log('logger.log');
        Logger.log('logger.diy', 'diy');
        Logger.info(1, 2, 3);

        // 自定义handle
        Logger.setHandle(function(msg, level) {
            console.log(`[${level}] [${msg}]`)
        });
        Logger.info('自定义handle');

        //重置系统handle
        Logger.setHandle();
        Logger.info('重置系统handle');

        this.$assign('content', '请查看控制台输出！');
        await this.$fetch('view');
    }

    async pagination() {
        let html = new Pagination(this.ctx).init({key_origin: 'params', url_index: '/pagination', url_page: '/pagination/list_${page}.html'}).total(200).render();

        const css = `<style>
            .page{display:flex;}
            .page li{list-style:none;margin:5px;}
            .page li a{display:block;padding:5px 10px;border:1px solid blue;text-decoration:none;color:inherit;}
            .page li.active a,.page li:hover a{background-color:blue;color:#fff;}
        </style>`;
        html += css;

        const page2 = this.$pagination.my_pagination.render(200);
        html += page2;

        this.$assign('content', html);
        await this.$fetch('view');
    }

    async url() {
        const url =  new Url(this.ctx);
        const arr = [];
        arr.push(url.build());
        arr.push(url.build('cate', '/'));
        arr.push(url.build('index/cate', '.html'));
        arr.push(url.build('index/index/cate', '.html'));
        arr.push(url.build('app/index/index/cate', '.html'));
        arr.push(url.build('/app/index/index/cate', '.html'));
        arr.push(url.build('test', {var: 'test', var2: 'test2'}, '.html'));
        arr.push(url.build('test?var3=vvv', {var: 'test', var2: 'test2'}, '.html'));
        arr.push(url.build('test?var=vvv', {var: 'test', var2: 'test2'}, '.html'));
        arr.push(url.build('index/cate#'));
        arr.push(url.build('index/cate#', {var: 'test', var2: 'test2'}, '.html'));
        arr.push(url.build('test?var=vvv#bbb', {var: 'test', var2: 'test2'}, '.html'));
        arr.push(url.build(':test', {var1: 'test', var2: 'test2', var3: 'test3'}, '.html'));
        arr.push(url.build(':diy'));
        arr.push(url.build(':show'));
        arr.push(url.build('showStr'));
        arr.push(url.build('index/loadFile'));

        this.$assign('content', arr.join('<br>'));
        await this.$fetch('view');
    }

    async cookie() {
        const cookie = new Cookie(this.ctx);
        let value = cookie.get('cookie_test');
        if(!value) {
            value = 1;
        } else {
            value = parseInt(value) + 1;
        }
        cookie.set('cookie_test', value);
        cookie.set('cookie_test2', 'value2', {maxAge: 1000 * 3600});
        cookie.set('cookie_test3', 'value3', {expires: new Date('2020-07-06')});

        this.$assign('content', `cookie_value: ${value}`);
        await this.$fetch('view');
    }

    async context() {
        this.$logger.info(JSON.stringify(this.$controller.__node)); // 自动定位到当前应用controller目录
        this.$logger.info(JSON.stringify(this.$diy.__node)); // 自动定位到当前应用diy目录
        this.$logger.info(JSON.stringify(this.$logic.__node)); // 自动定位到公共应用logic目录
        this.$logger.info(JSON.stringify(this.$app.__node)); // 自动定位到当前应用根目录
        this.$logger.info(JSON.stringify(this.$url.__node)); // 自动定位到系统类库url文件
        this.$logger.info(JSON.stringify(this.$utils.__node)); // 自动定位到系统类库utils目录
        this.$logger.info(JSON.stringify(this.$.__node)); // 强制定位到系统类库目录
        this.$logger.info(JSON.stringify(this._.__node)); // 强制定位到项目根目录
        this.$assign('content', '请查看控制台输出！');
        await this.$fetch('view');
    }

    async exception() {
        // throw new Error('异常测试');
        this.$response.exception(new Error('异常测试'));
    }

    async success() {
        this.$success();
    }

    async error() {
        this.$error();
    }

    async redirect() {
        this.$redirect('/');
    }

    async show() {
        this.$show({data: 'object'});
    }

    async mysql() {
        const db = new Db(this.ctx);

        await db.startTrans();
        await db.startTrans();
        await db.startTrans();
        await db.commit();
        await db.commit();
        await db.commit();

        await this.$db.startTrans();
        await this.$db.startTrans();
        await this.$db.startTrans();
        await this.$db.commit();
        await this.$db.commit();
        await this.$db.commit();

        this.$assign('content', '请查看控制台输出！');
        await this.$fetch('view');

        // const list = await db.table('article a').field('a.title, a.id, a.click, c.c_name').join('cate c', 'c.id=a.cate_id').where({'a.click': ['in', '102,201'], source: ['=', 'me', 'or']}).where({add_time: 2, update_time: 0}, 'or').where({add_time: ['>=', 0], update_time: 0}).group('add_time').having('add_time>1').order('a.id', 'desc').limit(0, 10).select();

        // const Arc = require('../model/article');
        // const model_article = new Arc(this.ctx);
        // const [list2, list3, list4] = await Promise.all([
        //     model_article.db.find(),
        //     this.$model.article.db.find(),
        //     this.$model.article.db.page(2, 3).select()
        // ]);
        //const list2 = model_article.db.find();
        //const list3 = this.ctx.$app.model.article.db.find();
        //const list4 = this.ctx.$app.model.article.db.page(2, 3).select();
        //const data = {"cate_id":2,"user_id":0,"title":"测试文章","writer":"雨思","source":"me","source_link":"","click":200,"keywords":"测试,文章","description":"这是一篇测试文章","content":"测试文章测试'文章测试文章内容"};
        //const data2 = {"cate_id":2,"user_id":0,"title":"rtrtrt","writer":"雨思","source":"me","source_link":"","click":200,"keywords":"测试,文章","description":"这是一篇测试文章","content":"test'cccccc"};
        //Logger.info(await model_article.db.table('article').getSql().insert(data));
        

        //this.ctx.body = {list, list2, list3, list4};
    }
}

module.exports = Index;
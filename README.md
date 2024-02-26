# jj.js

![jj.js](https://me.i-i.me/static/images/jjjs.png "jj.js")

A super simple lightweight NodeJS MVC framework（一个超级简单轻量的NodeJS MVC框架）

## 项目介绍

本框架依赖koa2、@koa/router、art-template、mysql，基于proxy实现了代码自动加载及懒加载技术，最低运行依赖仅仅为koa和koa-router，非常轻量。

### 项目特性

1. 系统架构模仿Thinkphp5，很容易上手
2. 系统类库、用户类库都支持自动加载、懒加载、自动生成单实例
3. 支持应用级、路由级、控制器级三级中间件，方便插件及二次开发
4. 支持单应用和多应用两种运行模式
5. 基于jsdoc，提供完整的代码提示。支持自动生成应用端jsdoc文件

### 项目地址

项目地址：[https://github.com/yafoo/jj.js](https://github.com/yafoo/jj.js "https://github.com/yafoo/jj.js")

码云镜像：[https://gitee.com/yafu/jj.js](https://gitee.com/yafu/jj.js "https://gitee.com/yafu/jj.js")

官网地址：[https://me.i-i.me/special/jj.html](https://me.i-i.me/special/jj.html "https://me.i-i.me/special/jj.html")
	

## 安装

```bash
npm i jj.js
```

> 运行环境要求：node.js >= v12.7.0

## Hello world !

1、创建控制器文件 `./app/controller/index.js`

```javascript
const {Controller} = require('jj.js');

class Index extends Controller
{
    async index() {
        this.$show('Hello jj.js, hello world !');
    }
}

module.exports = Index;
```

2、创建应用入口文件 `./server.js`

```javascript
const {App, Logger} = require('jj.js');
const app = new App();

app.run(3000, '0.0.0.0', function(err){
    !err && Logger.log('app', 'http server is ready on 3000');
});
```

3、运行命令

```bash
node server.js
```

4、浏览器访问 `http://127.0.0.1:3000`，页面输出 `Hello jj.js, hello world !`

5、在Stackblitz中打开 [Hello world !](https://stackblitz.com/edit/node-frhrfi?embed=1&file=app/controller/index.js)

## 开发手册

### 应用目录结构

```
├── app             //应用目录 （非必需，可改名）
│  ├── controller   //控制器目录 （非必需，可改名）
│  │  └── index.js  //控制器
│  ├── view         //模板目录 （非必需，可改名）
│  │  └── index     //index控制器模板目录 （非必需，可改名）
│  │     └── index.htm //模板
│  ├── middleware //中间件目录 （非必需，不可改名）
│  ├── model        //模型目录 （非必需，可改名）
│  ├── pagination   //分页目录 （非必需，可改名）
│  ├── logic        //逻辑目录 （非必需，可改名）
│  └── ****         //其他目录 （非必需，可改名）
├── app2            //应用2目录 （非必需，可改名）
├── common          //公共应用目录 （非必需，可改名）
├── config          //配置目录 （非必需，不可改名）
│  ├── app.js       //APP配置 （非必需，不可改名）
│  ├── db.js        //数据库配置 （非必需，不可改名）
│  ├── routes.js     //路由配置 （非必需，不可改名）
│  ├── view.js     //模版配置 （非必需，不可改名）
│  ├── cache.js     //缓存配置 （非必需，不可改名）
│  └── ****         //其他配置 （非必需，可改名）
├── public          //静态访问目录 （非必需，可改名）
│  └── static       //css image文件目录 （非必需，可改名）
├── node_modules    //nodejs模块目录
├── server.js       //应用入口文件 （必需，可改名）
└── package.json    //npm package.json
```
#### 应用目录介绍：
- **config**: 应用配置目录，系统的所有配置参数都放这里，也可以简化为一个config
.js文件，所有配置参数会覆盖框架默认参数。其中config这个名字不允许修改。
- **app、app2、common**： 为应用目录，common为公共应用目录，可以存放公共的model、logic或其他的文件，app为默认访问的应用。jj.js框架支持单应用和多应用运行模式，在`./config/app.js`中把`app_multi`设置为`true`即为多应用模式，此时可以创建app2、app3更多应用。框架默认为单应用模式。
- **public**：静态资源目录，主要存放css文件、js文件、图片等静态资源。在`./config/app.js`中通过`static_dir`参数可以设置或更改静态目录名字，为空时，则关闭静态访问（系统不会加载静态资源访问的逻辑，最大节省内容，也即所谓的轻量）
- **server.js**：应用入口文件，名字可以任意改。

### 系统类库

```javascript
const {App, Controller, Db, Model, Pagination, View, Logger, Cookie, Response, Upload, Url, Middleware, Cache, Context, View} = require('jj.js');
```

![jj.js类库继承关系图](https://me.i-i.me/static/images/jj_class.png "jj.js类库继承关系图")

系统类库都是`Class`类型，其中`Logger`和`Cache`是静态类；开发时建议继承系统类库，这样可以在类内使用`$`开头的属性，实现自动加载功能，链式调用类方法时会自动实例化一个单例。例如，在控制器内使用 `this.$logger` 会返回系统Logger类，使用 `this.$logger.info()`，会自动生成一个`logger`单例，并调用`info`方法，其他系统类库及类库内可以以这种方法调用。

### 类库自动加载

> 类库自动加载、懒加载是整个框架的核心，这里以hello world！示例程序先简单做个介绍。

1、假如想在`./app/controller/index.js`控制器的`user`方法中读取`user`数据表中`id`为1的用户，我们直接上代码：

```javascript
const {Controller} = require('jj.js');

class Index extends Controller
{
    async index() {
        this.$show('Hello jj.js, hello world !');
    }

    async user() {
        const user_info = await this.$db.table('user').find({id: 1});
        this.$show(user_info);
    }
}

module.exports = Index;
```

- 访问url：`http://127.0.0.1:3000/index/user`，即可看到打印的json用户信息。

- 其中`async user() {}`为异步方法，在控制器中，对外可以以url访问的方法必须设置为异步函数。使用`this.$db`调用框架db类，这里控制器必须继承框架`Controller`类，否则会调用失败。

- 在控制器中，前缀为`$`字符的属性为特殊属性，框架首先会检测本类中即`this`实例中是否有`$db`属性，有的话，会直接调用。如果没有，会检测本类文件所在应用目录即`./app/`目录下，是否用`db`目录或文件，如果有，则`$db`即代表那个目录或文件，`this.$db.table`会继续在db目录下寻找table目录或文件。如果`db`目录或文件不存在，框架会在应用根目录`./`下找，是否有`db`目录或文件，如果有，和上面一样。如果还不存在，框架会在jj.js框架`lib`目录下找`db`文件或目录，而框架`lib`中有`db.js`文件，至此，`this.$db`成功访问到框架`db`类。

- 如果将`this.$db`赋值为给一个变量，`const db = this.$db;`，得到的将是一个`db` Class类，可以进行new操作，`const db = this.$db; const db1 = new db(this.ctx, options); const db2 = new this.$db(this.ctx, options);`创建多个实例。

- 但上面演示代码并没有new一个实例，而是直接调用`db`类的`table()`方法，这正是框架的智能之处。当调用`this.$db.table('user')`时，框架首先会检测db类是否有`table`静态属性，有的话会直接调用。没有，则会自动new一个`db`实例，而且这个实例是个单例，然后调用此`db`实例的`table`方法，`table('user')`设置数据表名后返回实例本身，然后紧接着调用`find()`方法，读取用户ID为1的数据。

> 注意：虽然系统加载很复杂， 但是基于node的常驻内存特性，上面的文件路径判断，处理一次就会被缓存下来，在下个生命周期不用重复判断，节省性能。

> 关于单例：通过`this.$xxx`调用的类实例，在单个生命周期内是单例，即不管调用几次，都是用的同一个实例，这样非常节省内存开销。如果有多个db实例需求，可以用上面的方法，自己`new`创建，自己创建时注意第一个参数需传入ctx，否则部分类库使用会出现异常。

> 生命周期：应用生命周期以url访问为单位，一次url访问到访问结束，是一个独立的生命周期，在这个周期内自动生成的单实例都是共用的。

2、假如自己创建了数据表模型`./app/model/user.js`，然后想在控制器中使用，模型文件代码如下：

```javascript
const {Model} = require('jj.js');

class User extends Model
{
    async getUserInfo(condition) {
        const user_info = await this.db.find(condition);
        return user_info;
    }
}

module.exports = User;
```

这时在控制器的user方法中读取user数据表中id为1的用户，我们直接上代码：

```javascript
const {Controller} = require('jj.js');

class Index extends Controller
{
    async index() {
        this.$show('Hello jj.js, hello world !');
    }

    async user() {
        const user_info = await this.$model.user.getUserInfo({id: 1});
        this.$show(user_info);
    }
}

module.exports = Index;
```

- 访问url：`http://127.0.0.1:3000/index/user`，同样看到打印的json用户信息。

- 根据示例1的加载检测机制，`this.$model`会自动定位到`./app/model/`目录，`this.$model.user`会自动加载`./app/model/user.js`类文件，调用方法`getUserInfo`，会自动生成一个`user`模型的单实例，并调此单实例的`getUserInfo`方法。

- 可以看到，不管是系统类库，还是自定义类库，都可以实现自动加载、懒加载、自动生成单实例。

> 注意：在`user`模型内调用的是`this.db`，`db`没有`$`前缀，这个`db`是专属于`user`模型的独立实例，与示例1生成的`db`实例不是同一个。当然也可以使用带`$`前缀的`db`，但这样，在一个生命周期同时调用多个不同的模型的话，容易造成混淆。

3、除了框架db类、自定义模型类，整个应用和框架的所有自定义类库、配置文件，都支持同过`this.$xxxx`调用。

### config配置

应用的配置可以为`./config/`目录+`./config/xxx.js`文件的形式，也可以直接写到一个`./config.js`文件里。

应用配置不用每项都设置，只设置自己需要改的，默认会继承框架的默认配置，在控制器、中间件、模板类、模型类里都可以通过`this.$config.xxx`使用。

- app配置`./config/app.js`：
```javascript
const app = {
    app_debug: true, // 调试模式
    app_multi: false, // 是否开启多应用

    default_app: 'app', // 默认应用
    default_controller: 'index', //默认控制器
    default_action: 'index', // 默认方法

    common_app: 'common', // 公共应用，存放公共模型及逻辑
    controller_folder: 'controller', //控制器目录名

    static_dir: '', // 静态文件目录，相对于应用根目录，为空或false时，关闭静态访问

    koa_body: null // koa-body配置参数，为''、null、false时，关闭koa-body，此时upload类将不可用，并且系统接收不到post参数。启用的话，建议配置：{multipart: true, formidable: {keepExtensions: true, maxFieldsSize: 10 * 1024 * 1024}}
}
module.exports = app;
```
- 模板配置`./config/view.js`：
```javascript
const view = {
    view_folder: 'view', // 模板目录名
    view_depr: '/', // 模版文件名分割符，'/'代表二级目录
    view_ext: '.htm', // 模版文件后缀
    view_engine: 'art-template', // 默认模版引擎，字符串或引擎类，咱不支持更换
    view_filter: {}, // 模版函数，配置注入模板的函数，默认会自动注入url函数
}
module.exports = view;
```
- 数据库配置`./config/db.js`：可以配置多个，方便程序里切换使用。
```javascript
const db = {
    default: {
        type      : 'mysql', // 数据库类型
        host      : '127.0.0.1', // 服务器地址
        database  : 'jj', // 数据库名
        user      : 'root', // 数据库用户名
        password  : '', // 数据库密码
        port      : '', // 数据库连接端口
        charset   : 'utf8', // 数据库编码默认采用utf8
        prefix    : 'jj_' // 数据库表前缀
    }
}
module.exports = db;
```
- 日志配置`./config/log.js`：log_handle可以自定义日志handle
```javascript
const log = {
    log_level: [], // [error, warning, info, debug, http, sql]
    log_handle: function(msg, level) {console.log(`[${format('YY-mm-dd HH:ii:ss')}] [${level}] ${typeof msg == 'String' ? msg : JSON.stringify(msg)}`);} //function(msg, level) {}
}
module.exports = log;
```
- 缓存配置`./config/cache.js`：
```javascript
const cache = {
    cache_time: 60 * 60 * 24, // 默认缓存时间（1天），为空或false则为10年
    clear_time: undefined // (undefined: 一天清理一次, 0: 关闭自动清理, >0: 为自动清理周期)
}
module.exports = cache;
```
- 分页配置`./config/page.js`：
```javascript
const page = {
    page_key    : 'page', // 默认分页标识
    key_origin    : 'query', // query 或 params
    page_size   : 10, // 默认分页大小
    page_length : 5, // 默认分页长度，数字页码链接数量

    //网址规则，可为空，可为路由名字，可用参数：页码${page}
    //样例：':name'
    //样例：'/list_${page}.html'
    url_page    : '',
    url_index   : '',

    //模块样式 可用参数：网址${url}，页码${page}，总数${total_page}，总页数${total_page}
    index_tpl   : '<li class="index"><a href="${url}">首页</a></li>',
    end_tpl     : '<li class="end"><a href="${url}">末页</a></li>',
    prev_tpl    : '<li class="prev"><a href="${url}">上一页</a></li>',
    next_tpl    : '<li class="next"><a href="${url}">下一页</a></li>',
    list_tpl    : '<li><a href="${url}">${page}</a></li>',
    active_tpl  : '<li class="active"><a href="${url}">${page}</a></li>',
    info_tpl    : '<span class="info">共${total_page}页，${total}条记录</span>',

    //渲染模版
    template   : '<div class="pagination"><ul class="page">${index}${prev}${list}${next}${end}</ul>${info}</div>'
}
module.exports = page;
```
- 跳转模板配置`./config/tpl.js`：模板可以配置为自定义的
```javascript
const tpl = {
    jump: require('./tpl/jump'), // 跳转模板
    exception: require('./tpl/exception') //  异常页面模板
}
module.exports = tpl;
```
- 自定义配置`./config/self.js`：自定义配置同样可以直接通过`this.$config.self`使用。
```javascript
const self = {
    option1: ''
    option2: ''
    ...
}
module.exports = self;
```
- 路由配置`./config/routes.js`：
路由功能基于`@koa/router`开发，关于url匹配规则可以参考官方文档：[文档地址](https://www.npmjs.com/package/@koa/router)

> 本框架默认内置 `应用/控制器/方法` 的全局路由，即如果不需要定制url，可以直接访问，无需配置路由。

> 路由配置为一个数组，每一项为一条规则，项属性包含url规则，path访问路径，name规则名字，type路由类型。url一旦匹配，即会停止，如果需要继续向下匹配，需在程序内调用 `await this.$next();`，路由配置参考示例：
```javascript
routes = [
    {url: '/', path: 'app/index/index2'}, // 访问'/'，会定位到app应用的index控制的index2方法
    {url: '/article/:id.html', path: 'app/article/article', name: 'article'}, // 访问'/article/123.html'，会定位到app应用的article控制的article方法；通过this.ctx.params.id可以获取到参数id；通过article可以反编译网址，执行this.$url.build(':article', {id: 123}); 生成'/article/123.html'
    {url: '/admin', path: 'app/admin/check', type: 'middleware'}, // 访问'/admin'，会定位到app应用的admin中间件的check方法
    {url: '/about', path: 'app/about/index', type: 'view'}, // 访问'/about'，会定位到app应用的view模板目录about目录下的index.htm文件，并直接输出文件内容
    {url: '/:cate/list_:page.html', path: 'cate/cate', name: 'cate_page'}, // 多参数分页示例
    {url: '/hello', path: async (ctx, next) => {ctx.body = 'hello world, hello jj.js!';}} // 直接路由到函数
];

module.exports = routes;
```
> 注意：本路由配置示例前两条规则为常规用法，后面的非常规用法，不建议使用。如果是单应用模式，可以去掉path参数里的app。

### 编码命名规范

类名使用大驼峰，方法名使用小驼峰，私有方法使用下划线前缀。
控制器文件名使用小写下划线。

## 总结

通过以上文档，可以看到：
1. jj.js是一个轻量的mvc框架，几乎所有文件不使用就不会调用。
2. 同时也是个功能强大的框架，支持应用级、路由级、控制器级三级中间件。
3. 类库自动加载，只要是继承自`Ctx`的类库，都可以在方法内使用包含`$`前缀的属性自动加载其他资源。

## 应用案例

- [基于jj.js的轻量博客系统：Melog](https://me.i-i.me/special/melog.html)

### Nginx代理

```
location / {
    proxy_pass       http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

### License

[MIT](LICENSE)
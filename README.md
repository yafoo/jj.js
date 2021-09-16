# jj.js

![jj.js](https://me.i-i.me/static/images/jjjs.png "jj.js")

A simple and lightweight MVC framework built on nodejs+koa2（一个基于nodejs+koa2构建的简单轻量级MVC框架）

## 项目介绍

> 框架依赖koa2、koa-router、art-template、mysql，基于proxy实现了代码自动加载及懒加载技术，最低依赖仅仅为koa和koa-router，非常轻量。系统架构类似Thinkphp5，很容易上手。支持类库自动加载、手工引入两种开发模式。支持应用、路由、控制器三级中间件，方便插件及二次开发。支持单应用和多应用两种运行模式。


项目地址：[https://github.com/yafoo/jj.js](https://github.com/yafoo/jj.js "https://github.com/yafoo/jj.js")

码云镜像：[https://gitee.com/yafu/jj.js](https://gitee.com/yafu/jj.js "https://gitee.com/yafu/jj.js")

官网地址：[https://me.i-i.me/jjjs/](https://me.i-i.me/jjjs/ "https://me.i-i.me/jjjs/")
	

## 安装

```bash
npm i jj.js
```

## Hello world !

1、创建文件 `./app/controller/index.js`

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

2、创建文件 `./server.js`

```javascript
const {app, Logger} = require('jj.js');

app.run(3000, '127.0.0.1', function(err){
    !err && Logger.info('http server is ready on 3000');
});
```

3、运行命令

```bash
node server.js
```

4、浏览器访问 `http://127.0.0.1:3000`，页面输出 `Hello jj.js, hello world !`

5、或者执行命令 `npm test`，快速打开测试程序。

## 应用结构

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

## 系统类库

```javascript
const {app, Controller, Db, Model, Pagination, View, Logger, Cookie, Response, Upload, Url, Middleware, Context} = require('jj.js');
```

## 开发手册（待继续完善）

> 系统类库除了app，其他都是Class类型，开发时建议继承系统类库，这样可以在类内使用$开头的属性，可以自动加载系统类，链式调用类方法时会自动实例化一个单例。例如，在控制器内使用 `this.$logger` 会返回系统Logger类，使用 `this.$logger.info()`，会自动生成一个logger单例，并调用info方法，其他系统类库及类库内可以以这种方法调用。

### Controller控制器

系统控制器类继承自系统中间件类Middleware，包含所有Middleware方法。

> 属性：**middleware**

数组，定义控制器中间件，一个元素为一个中间件，元素为字符串或对象。

案例1： `this.middleware = ['index']`，则控制器内所有方法访问之前都会调用当前应用目录（app）下中间件目录（middleware ）下的控制器同名中间件的index方法。

案例2： `this.middleware = ['index', {middleware: 'auth/test', accept: 'middleTest'}]`，则控制器内所有方法访问之前都会先调用当前应用目录（app）下中间件目录（middleware ）下的控制器同名中间件的index方法。仅当访问控制器middleTest方法之前，还会再调用当前应用下中间件目录下的auth中间件的test方法（需index中间件内调用`this.$next()`方法，否则后续程序不会执行）。

> 方法：**$assign(name, value)**

同步方法，赋值模版变量。

案例1：`this.$assign('title', 'Hello jj.js !')`，在模版内使用变量 `{{title}}`

如果name为一个对象，则清除之前赋值的模板变量，并将name设置为模板变量对象。

案例2：`this.$assign({'title': 'jj.js', 'content': 'Hello jj.js !'})`，在模版内可使用变量 `{{title}}`、`{{content}}`

> 方法：**$data(name)**

同步方法，获取已赋模版变量。
如果name为空，则获取全部变量。

> 方法：**$show(content)**

同步方法，继承自Middleware类，输出content，如果content为对象，则输出json字符串。

> 方法：**$fetch(template)**

异步方法，渲染模板文件，并输出。

其中template会自动自动定位模板文件，如果name为空，则定位到当前应用下view目录下的控制器同名目录下的方法同名htm文件。

案例1：`this.$fetch()`，在index控制器类的index方法调用，则模板定位到`/app/view/index/index.htm`

案例2：`this.$fetch('list/show')`，则模板定位到`/app/view/list/show.htm`

> 方法：**$load(template)**

异步方法，直接加载模板，并输出。模板定位规则同$fetch方法。

> 方法：**$render(data)**

异步方法，渲染字符串模板，并输出。data为字符串模版内容。

案例1：`this.$render('<div>{{title}}</div>')`，会输出`<div>jj.js</div>`

> 方法：**$redirect(name, status = 302)**

同步方法，继承自Middleware类，网页跳转，name解析同$fetch方法。

案例1：`this.$fetch('test')`，在index控制器类的index方法调用，则跳转到到`/app/index/test`地址

案例2：`this.$fetch('/show')`，name包含'/'前缀，则跳转到地址`/show`

> 方法：**$success(msg, name)**

同步方法，继承自Middleware类，返回成功提示，name解析同$redirect方法，如果是ajax请求，则返回json数据。

案例1：`this.$success('操作成功！', 'test')`，返回成功提示，并跳转到`/app/index/test`地址

案例2：`this.$success({ajax: 'data'})`，ajax返回json `{state: 1, msg: '操作成功！', data: {ajax: 'data'}}`

> 方法：**$error(msg, name)**

同步方法，继承自Middleware类，返回成功提示，name解析同$success方法，name为空，则跳转来源网址。

### Middleware中间件类

> 方法：**$show(content)** 参照控制器类

> 方法：**$redirect(url, status)** 参照控制器类

> 方法：**$success(msg, url)** 参照控制器类

> 方法：**$error(msg, url)** 参照控制器类

### Db数据库类

> 方法：**async startTrans(fun)** 开启事务

> 方法：**async commit()** 提交事务

> 方法：**async rollback()** 事务回滚

> 方法：**prefix(prefix)** 设置数据表前缀

> 方法：**table(table)** 设置数据表

> 方法：**field(field)** 设置查询字段

> 方法：**where(where, logic)** 设置查询条件

> 方法：**distinct()** 数据去重

> 方法：**group(field)** 数据分组

> 方法：**having(condition)** 数据筛选

> 方法：**order(field, order='asc')** 查询排序

> 方法：**limit(offset, rows)** 查询数据限制

> 方法：**page(page, pageSize)** 分页查询

> 方法：**cache(time)** 设置缓存时间

> 方法：**getSql(fetch = true)** 设置返回sql语句

> 方法：**join(table, on, type='left')** 设置表连接

> 方法：**async select(condition)** 查询多条数据

> 方法：**async find(condition)** 查询单条数据

> 方法：**async value(field)** 查询单个值

> 方法：**async count(field='*')** 查询记录数

> 方法：**async max(field)** 查询最大值

> 方法：**async min(field)** 查询最小值

> 方法：**async avg(field)** 查询平均值

> 方法：**async sum(field)** 对列求和

> 方法：**async column(field, key)** 获取一列数据，如果设置key则获取一列键值对

> 方法：**async pagination(page, page_size, pagination)** 分页查询并返回分页实例

> 方法：**data(data)** 设置写入数据

> 方法：**allowField(field = true)** 设置过滤非数据表字段

> 方法：**async insert(data)** 插入一条数据

> 方法：**async update(data, condition)** 更新数据

> 方法：**async inc(field, step)** 数据表字段自增

> 方法：**async dec(field, step)** 数据表字段自减

> 方法：**async exp(field, step)** 数据表字段执行自定义方法

> 方法：**async delete(condition)** 删除数据

> 方法：**async execute(sql, params, reset=true)** 解析并执行sql语句

> 方法：**async tableInfo(table)** 获取表信息

> 方法：**async tableField(table)** 获取表字段信息

> 方法：**format(sql, params)** 解析sql语句

> 方法：**deleteCache()** 清空数据库查询缓存

### Model模型类

> 属性：**db** 模型的db实例

> 方法：**async add(data)** 同Db类insert方法

> 方法：**async save(data, condition = {})** 智能调用Db类insert或update方法

> 方法：**async del(condition)** 同Db类delete方法

> 方法：**async get(condition)** 同Db类find方法

> 方法：**async all(condition)** 同Db类select方法

### Pagination分页类

### View模板引擎类

### Logger日志类

### Cookie类

### Response跳转相应类

### Upload上传类

### Url网址解析类

### Context自动加载基类

### config配置


## 应用案例

- [基于jj.js的轻量博客系统：Melog](https://me.i-i.me/melog/)

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
# jj.js

![jj.js](https://me.i-i.me/static/images/jjjs.png "jj.js")

A simple and lightweight MVC framework built on nodejs+koa2（一个基于nodejs+koa2构建的简单轻量级MVC框架）

## 项目介绍

本框架依赖koa2、koa-router、art-template、mysql，基于proxy实现了代码自动加载及懒加载技术，最低运行依赖仅仅为koa和koa-router，非常轻量。

### 项目特性

1. 系统架构模仿Thinkphp5，很容易上手
2. 系统类库、用户类库都支持自动加载、懒加载、自动生成单实例
3. 支持应用级、路由级、控制器级三级中间件，方便插件及二次开发
4. 支持单应用和多应用两种运行模式

### 项目地址

项目地址：[https://github.com/yafoo/jj.js](https://github.com/yafoo/jj.js "https://github.com/yafoo/jj.js")

码云镜像：[https://gitee.com/yafu/jj.js](https://gitee.com/yafu/jj.js "https://gitee.com/yafu/jj.js")

官网地址：[https://me.i-i.me/jjjs/](https://me.i-i.me/jjjs/ "https://me.i-i.me/jjjs/")
	

## 安装

```bash
npm i jj.js
```

> 运行环境要求：node.js >= v12

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

## 开发手册（待继续完善）

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

> 
### 系统类库

```javascript
const {app, Controller, Db, Model, Pagination, View, Logger, Cookie, Response, Upload, Url, Middleware, Cache, Context, View} = require('jj.js');
```

系统类库除了`app`，其他都是`Class`类型，其中`Logger`和`Cache`是静态类，开发时建议继承系统类库，这样可以在类内使用`$`开头的属性，实现自动加载功能，链式调用类方法时会自动实例化一个单例。例如，在控制器内使用 `this.$logger` 会返回系统Logger类，使用 `this.$logger.info()`，会自动生成一个`logger`单例，并调用`info`方法，其他系统类库及类库内可以以这种方法调用。

### 类库自动加载初相识

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

- 如果将`this.$db`赋值为给一个变量，`const db = this.$db;`，得到的将是一个`db` Class类，可以进行new操作，`const db = this.$db; const db1 = new this.$db(); const db2 = new this.$db();`创建多个实例。

- 但上面演示代码并没有new一个实例，而是直接调用`db`类的`table()`方法，这正是框架的智能之处。当调用`this.$db.table('user')`时，框架首先会检测db类是否有`table`静态属性，有的话会直接调用。没有，则会自动new一个`db`实例，而且这个实例是个单例，然后调用此`db`实例的`table`方法，`table('user')`设置数据表名后返回实例本身，然后紧接着调用`find()`方法，读取用户ID为1的数据。

> 注意：虽然系统加载很复杂， 但是基于node的常驻内存特性，上面的文件路径判断，处理一次就会被缓存下来，在下个生命周期不用重复判断，节省性能。

> 关于单例：通过`this.$xxx`调用的类实例，在单个生命周期内是单例，即不管调用几次，都是用的同一个实例，这样非常节省内存开销。如果有多个db实例需求，可以用上面的方法，自己`new`创建。

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
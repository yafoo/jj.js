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

官网地址：[https://me.i-i.me/special/jj.html](https://me.i-i.me/special/jj.html "https://me.i-i.me/special/jj.html")
	

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

> 
### 系统类库

```javascript
const {app, Controller, Db, Model, Pagination, View, Logger, Cookie, Response, Upload, Url, Middleware, Cache, Context, View} = require('jj.js');
```

![jj.js类库继承关系图](https://me.i-i.me/static/images/jj_class.png "jj.js类库继承关系图")

系统类库除了`app`，其他都是`Class`类型，其中`Logger`和`Cache`是静态类，开发时建议继承系统类库，这样可以在类内使用`$`开头的属性，实现自动加载功能，链式调用类方法时会自动实例化一个单例。例如，在控制器内使用 `this.$logger` 会返回系统Logger类，使用 `this.$logger.info()`，会自动生成一个`logger`单例，并调用`info`方法，其他系统类库及类库内可以以这种方法调用。

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

> 属性：**middleware** 定义控制器中间件

数组，定义控制器中间件，一个元素为一个中间件，元素为字符串或对象。

示例1： `this.middleware = ['index']`，则控制器内所有方法访问之前都会调用当前应用目录（app）下中间件目录（middleware ）下的控制器同名中间件的index方法。

示例2： `this.middleware = ['index', {middleware: 'auth/test', accept: 'middleTest'}]`，则控制器内所有方法访问之前都会先调用当前应用目录（app）下中间件目录（middleware ）下的控制器同名中间件的index方法。仅当访问控制器middleTest方法之前，还会再调用当前应用下中间件目录下的auth中间件的test方法（需index中间件内调用`this.$next()`方法，否则后续程序不会执行）。

> 方法：**$assign(name, value)** 赋值模版变量

示例1：`this.$assign('title', 'Hello jj.js !')`，在模版内使用变量 `{{title}}`

如果name为一个对象，则清除之前赋值的模板变量，并将name设置为模板变量对象。

示例2：`this.$assign({'title': 'jj.js', 'content': 'Hello jj.js !'})`，在模版内可使用变量 `{{title}}`、`{{content}}`

> 方法：**$data(name)** 获取已赋模版变量

如果name为空，则获取全部变量。

> 方法：**async $fetch(template)** 渲染模板文件并输出

异步方法，来自`View`类，渲染模板文件，并输出内容。

其中template会自动自动定位模板文件，如果name为空，则定位到当前应用下view目录下的控制器同名目录下的方法同名htm文件。

示例1：`this.$fetch()`，在index控制器类的index方法调用，则模板定位到`/app/view/index/index.htm`

示例2：`this.$fetch('list/show')`，则模板定位到`/app/view/list/show.htm`

> 方法：**async $load(template)** 加载并输出模板文件

异步方法，来自`View`类，直接加载模板文件，并输出文件内容。模板定位规则同$fetch方法。

> 方法：**async $render(data)** 渲染字符串模板

来自`View`类，渲染字符串模板，并输出。data为字符串模版内容。

示例1：`this.$render('<div>{{title}}</div>')`，会输出`<div>jj.js</div>`

> 方法：**$show(content)** 输出字符串内容或转换后的json字符串

继承自`Middleware`类，输出content内容，如果content为对象或数组，则输出json字符串。

> 方法：**$redirect(name, status = 302)** 302或其他跳转

继承自`Middleware`类，网页跳转，name解析同$fetch方法。

示例1：`this.$redirect('test')`，在index控制器类的index方法调用，则跳转到到`/app/index/test`地址

示例2：`this.$redirect('/show')`，name包含'/'前缀，则跳转到地址`/show`

> 方法：**$success(msg, name)** 成功跳转或输出

继承自`Middleware`类，返回成功提示，name解析同$redirect方法，如果是ajax请求，则返回json数据。

示例1：`this.$success('操作成功！', 'test')`，返回成功提示，并跳转到`/app/index/test`地址

示例2：`this.$success({ajax: 'data'})`，如果是ajax请求，则返回json `{state: 1, msg: '操作成功！', data: {ajax: 'data'}}`

> 方法：**$error(msg, name)** 错误跳转或输出

继承自`Middleware`类，返回失败提示，name解析同$success方法，name为空，则跳转来源网址。

> 方法：**async $next()** 执行下一个路由匹配

异步方法，继承自`Middleware`类，调用后，会等待执行全局路由配置里后面能匹配的路由。

> 注意：所有的输出和跳转并不会阻止后续代码执行，所以要终止代码执行，需在前面加上`return`。

### Middleware中间件类

> 方法：**$show(content)** 参照控制器类介绍

> 方法：**$redirect(url, status)** 参照控制器类介绍

> 方法：**$success(msg, url)** 参照控制器类介绍

> 方法：**$error(msg, url)** 参照控制器类介绍

> 方法：**async $next()** 执行下一个中间件

### Db数据库类

> 方法：**async startTrans(async fun)** 开启事务

异步方法，如果fun不为空，并且是函数，则开启事务后，会自动执行此函数，并提交事务，不用再手工提交或回滚事务。

> 方法：**async commit()** 提交事务

> 方法：**async rollback()** 事务回滚

> 方法：**prefix(prefix)** 设置数据表前缀

> 方法：**table(table)** 设置数据表

table参数：数据表名字，不带前缀

> 方法：**field(field)** 设置查询字段

支持字符串或数组，支持多次调用

示例1：`this.field('id,name');`

示例2：`this.field(['id', 'name']).field('mobile');`

> 方法：**where(where, logic)** 设置查询条件

支持多次调用，`logic`设置多次调用之间的连接条件，默认为`and`，where参数为对象

示例1：设置查询id为1的条件

`this.where({id: 1});` // where id = 1

示例2：设置查询name为'aaa'，并且sex为1的条件

`this.where({name: 'aaa', sex: 1});` // where name = 'aaa' and sex = 1

示例3：多次调用`where`，设置查询name为'aaa'，并且sex为1的条件，并且age大于18的条件

`this.where({name: 'aaa', sex: 1}).where({age: ['>', 18]}); // where (name = 'aaa' and sex = 1) and (age > 18)`

可以看到，当字段值不是等于（=）时，字段值使用数组来标识，其中数组第一项为表达式（>），数组第二项为表达式要对比的值。数组的第三项为一个where内的连接逻辑，不设置的话默认为`and`，或连接的话，设置为`or`。

示例4：设置查询name为'aaa'，或着sex为1的条件

`this.where({name: 'aaa', sex: ['=', 1, 'or']});` // where name = 'aaa' or sex = 1

> 说明：where支持所有表达式（'=', '<>', '!=', '>', '>=', '<', '<=', 'like', 'not like', 'in', 'not in', 'between', 'not between', 'is', 'is not', 'exp'）

> 方法：**distinct()** 数据去重

> 方法：**group(field)** 数据分组

> 方法：**having(condition)** 数据筛选

> 方法：**order(field, order='asc')** 查询排序

order方法支持多次调用。

示例：`this.order('id', 'desc').order('sort');` // order by id desc, sort asc

> 方法：**limit(offset, rows)** 查询数据限制

示例1：`this.limit(1, 10);` // limit 1, 10

示例2：`this.limit(10);` // limit 10

> 方法：**page(page, pageSize)** 分页查询

当要进行分页查询时，用这个方法会更方便。

示例1：`this.page(1, 10);` // limit 0, 10

示例2：`this.page(2, 10);` // limit 10, 10

> 方法：**cache(time)** 设置缓存时间

`time`单位为秒，设置缓存的话，在这个时间内再次执行相同条件的查询，将直接返回缓存的数据。

示例：`this.cache(600);` // 设置缓存时间为10分钟

> 方法：**join(table, on, type='left')** 设置表连接

假如设置文章表和用户表以用户id为条件连接：

示例：`this.table('article').join('user', 'article.user_id=user.id', 'left');` // from article article left join user user on article=user.id

> 方法：**getSql(fetch = true)** 设置是否返回sql语句

设置后，调用查询方法不会再进行真正的查询，而是直接返回编译后的sql语句字符串。

示例：`this.table('user').getSql().select();` // 返回:'select * from user'

> 方法：**async select(condition)** 查询多条数据

如果`condition`不为空，则会清空前面使用`where`方法设置的查询条件，然后以`condition`为参数调用一次`where`方法。

示例：`this.where({name: 'aaa', sex: 1}).where({id: 1}).select({id: 2});` // 等效于：this.where({id: 2}).select();

> 方法：**async find(condition)** 查询单条数据

使用方法同`select()`

> 方法：**async value(field)** 查询单个值

返回单条数据里某个字段的值，假如查询user表id为1的用户的年龄值：

示例：`this.table('user').where({id: 1}).value('age');` // 返回age值

> 方法：**async count(field='*')** 查询记录数

以某个字段查询记录总数，假如查询user表age为18的用户数：

示例：`this.table('user').where({age: 18}).count();` // 返回记录总数

> 方法：**async max(field)** 查询最大值

> 方法：**async min(field)** 查询最小值

> 方法：**async avg(field)** 查询平均值

> 方法：**async sum(field)** 对列求和

> 方法：**async column(field, key)** 获取一列数据

如果设置key则获取一列键值对

示例1：`this.column('age');` // [16, 18, 20] 数字为年龄

示例2：`this.column('age'，'id');` // {1: 16, 2: 18, 3: 20} 数字为年龄,1 2 3为id值

> 方法：**async pagination({page, page_size, pagination})** 分页查询并返回分页实例

相当于`page()+Pagination`类分页，如果传入`pagination`实例，则以这个实例渲染分页，否则会自动创建一个分页实例。如果没有传page、page_size，会使用`pagination`实例的`page()`方法`pageSize()`自动生成。

示例：`this.pagination();` // 返回[data_list, pagination]

> 方法：**data(data)** 设置写入数据

此方法用于更新或写入数据，提前设置需要的数据，支持多次调用

示例：`this.data({age: 18}).data({sex: 1}).insert();` // 返回[data_list, pagination]

> 方法：**allowField(field = true)** 设置过滤非数据表字段

更新或写入数据时，会过滤掉非数据表里的字段

> 方法：**async insert(data)** 插入一条数据

如果data参数不为空，会清除前面使用`data()`方法设置的数据，并以此处传入数据为准

> 方法：**async update(data, condition)** 更新数据

如果`data`参数不为空，会清除前面使用`data()`方法设置的数据，并以此处传入数据为准。如果`condition`参数不为空，会清除前面设置`where()`设置的条件

> 方法：**async inc(field, step)** 数据表字段自增

设置字段field自增，step默认为1

> 方法：**async dec(field, step)** 数据表字段自减

设置字段field自减，step默认为1

> 方法：**async exp(field, step)** 数据表字段执行自定义方法

> 方法：**async delete(condition)** 删除数据

如果`condition`参数不为空，会清除前面设置`where()`设置的条件，并以此处传入条件为准。

> 方法：**async execute(sql, params, reset=true)** 解析并执行sql语句

执行sql语句查询

> 方法：**format(sql, params)** 解析sql语句

> 方法：**async tableInfo(table)** 获取表信息

> 方法：**async tableField(table)** 获取表字段信息

> 方法：**deleteCache()** 清空数据库查询缓存

### Model模型类

> 属性：**db** 模型的db实例

每个模型文件，会懒自动创建一个独有的db实例

> 属性：**table** 数据表名字，默认为模型文件名

> 属性：**pk** 数据表主键字段，默认为`id`

> 方法：**async add(data)** 同Db类insert方法

> 方法：**async save(data, condition = {})** 智能调用Db类insert或update方法

当data含有主键字段或condition不为空，则执行db实例`update()`方法，否则执行`insert()`方法

> 方法：**async del(condition)** 同Db类delete方法

> 方法：**async get(condition)** 同Db类find方法

> 方法：**async all(condition)** 同Db类select方法

### Pagination分页类

> 方法：**init(options)** 初始化

options参数默认继承自`./config/page.js`或框架`config.page`参数，框架page参数如下：

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
```
- key_origin：设置分页参数获取位置，url或params
- page_key：设置分页标识，即设置或获取当前分页的字段
- url_page、url_index：设置生成的分页url模板或规则，网址规则可以为路由名字，可用参数为`${page}`

> 方法：**page(page)** 设置或获取当前页

> 方法：**pageSize(page_size)** 设置或获取分页大小

> 方法：**total(total)** 设置或获取总数

> 方法：**render(total, page, page_size)** 生成分页html代码

传参，可以快速设置page、page_size、total

### View模板引擎类

> 方法：**assign(name, value)** 赋值模版变量，用法参考Controller类

> 方法：**data(name)** 获取已赋模版变量，用法参考Controller类

> 方法：**async fetch(template)** 渲染模板文件并输出，用法参考Controller类

> 方法：**async load(template)** 加载并输出模板文件，用法参考Controller类

> 方法：**async render(data)** 渲染字符串模板，用法参考Controller类

> 方法：**setFilter(fun_obj, fun)** 动态设置模版函数

设置一个或多个模板函数：

示例1：`this.setFilter('sum', (a, b) => {return a + b;});` // 设置一个函数sum

示例2：`this.setFilter({'sum': (a, b) => {return a + b;}, 'fun2': () => {}});` // 同时设置sum、fun2两个函数，设置后可以在模板中使用

> 提示：View类初始化时，默认会设置一个`url`的模板函数，即在模板文件里可以直接使用`url`函数生成网址，示例：

```javascript
// 首页模板代码
{{url('user')}}

// 生成网址(单应用模式)
'/index/user'
```
`url`函数具体用法，请参考Url类的`build`方法

> 方法：**setFolder(view_folder)** 动态设置模版函数

> 方法：**setDepr(view_depr)** 动态设置文件分割符

> 本框架默认使用的模板引擎为`art-template`，关于模板语法，可以参考[art-template文档](http://aui.github.io/art-template/zh-cn/docs/ "art-template文档")

### Logger日志类

> 说明：日志类是一个静态类，方法都为静态方法，但同时也支持new创建一个新的静态实例。

> 提示：目前日志类输出没有具体的代码实现，只是数据格式化后，用node自带log打印。

> 方法：**static log(msg, level='info')** 输出日志

> 方法：**static error(...args)** 输出错误日志

> 方法：**static warning(...args)** 输出错误日志

> 方法：**static info(...args)** 输出错误日志

> 方法：**static debug(...args)** 输出错误日志

> 方法：**static sql(...args)** 输出错误日志

> 方法：**static http(...args)** 输出错误日志

> 方法：**static setHandle(...args)** 输出错误日志

### Cookie类

> 方法：**set(key, value, options)** 设置cookie

options默认继承`config.cookie`参数

> 方法：**get(key)** 获取cookie

> 方法：**delete(key)** 删除一个cookie

> 方法：**all()** 获取所有cookie

> 方法：**clear()** 清除所有cookie

> 方法：**keys()** 获取所有cookie的key

### Response跳转响应类

> 方法：**show(data)** 渲染模板文件并输出，用法参考Controller类

> 方法：**redirect(url, status = 302)** 302或其他跳转，用法参考Controller类

> 方法：**success(msg='操作成功！', name)** 成功跳转或输出，用法参考Controller类

> 方法：**error(msg='操作失败！', name)** 错误跳转或输出，用法参考Controller类

> 方法：**jump(msg, url, state=1)** 跳转或输出

> 方法：**exception(err)** 输出异常页面

> 方法：**wait(time)** 设置页面跳转时等待时间

### Upload上传类

> 注意：文件上传，需要先开启`config.app.koa_body`参数，具体设置可参考[koa-body文档](https://github.com/koajs/koa-body#readme)

> 方法：**file(file)** 设置file文件

当参数`file`为字符串时，会调用`getFile(name)`方法获取上传文件并配置，如果为文件，则直接赋值。

> 方法：**getFile(name)** 获取一个上传文件

> 方法：**validate(rule={})** 设置文件验证规则参数

- rule.size，文件大小限制
- rule.ext，文件后缀
- rule.type，文件MIME类型
- rule.size，文件大小限制
- 默认会对图片后缀的文件做图片MIME验证

> 方法：**rule(name)** 设置文件保存名字或规则

参数name为字符串或函数，不传的话按内部规则。

> 方法：**checkExt(ext)** 验证文件后缀

> 方法：**checkType(type)** 验证文件MIME

> 方法：**checkImg()** 验证图片文件

> 方法：**check()** 对设置的规则执行验证

> 方法：**getError()** 获取验证错误或上传文件失败信息

> 方法：**async save(dir)** 保存上传文件

参数dir为文件保存目录，相对应用的根目录。内部会自动执行`check()`方法。

示例1：`await this.file('img').save('upload');` // 会将上传的图片保存到upload目录下

示例2：`await this.file('img').validate({size: 1024, ext: 'png', type: 'png'}).save('upload');` // 设置只能上传小于1M的png图片

上传成功返回参数：

```javascript
return {
    filename, // 保存后的文件名
    extname, // 文件后缀名
    savename, // 除去上传目录的完成名字
    filepath, // 文件保存目录
    name, // 文件原始名字
    size, // 文件大小
    mimetype, // mimetype
    hash // hash
};
```

### Url网址解析类

> 方法：**build(url='', vars, ext='', domain='')** 生成url网址

Url类build方法，会根据当前访问url参数，智能生成需要的网址，假如单应用模式访问`127.0.0.1/user/info`

示例1：`this.build()` // '/user/list'

示例2：`this.build('list')` // '/user/list'

示例3：`this.build('article/list')` // '/article/list'

示例4：`this.build('list', {type: 'hot', order: 'click'})` // '/user/list?type=host&order=click'

示例5：`this.build('list', '.html')` // '/user/list.html'

示例6：`this.build('list', '.html', 'localhost')` // 'localhost/user/list.html'

如果`url`参数包含`/`前缀，则直接做为网址使用

示例7：`this.build('/list', {type: 'hot'})` // '/list?type=host'

如果自定义的有路由地址，通过路由名字可以反向编译地址，假如有路由定义`./config/routes.js`

```javascript
route = [
    {url: '/article/:id.html', path: 'article/article', name: 'article'},
];

module.exports = route;
```
这是一个自定义文章页路由地址，当访问`127.0.0.1/article/123.html`时会匹配到这个地址，并且这条路由的名字`name`为`article`，在url反向编译路由时，通过带`:`号的名字来定义：

示例8：`this.build(':article', {id: 456})` // '/article/456.html'

### Context配置上下文类

> 属性：**ctx** 整个框架的上下文，具体参数，可以参考[Koa上下文(Context)ctx文档](https://www.itying.com/koa/)

### config配置

应用的配置可以为`.config/`目录+`.config/xxx.js`文件的形式，也可以直接写到一个`.config.js`文件里。

应用配置不用每项都设置，只设置自己需要改的，默认会继承框架的默认配置，在控制器、中间件、模板类、模型类里都可以通过`this.$config.xxx`使用。

app配置`.config/app.js`：
```javascript
{
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
```
模板配置`.config/view.js`：
```javascript
{
    view_folder: 'view', // 模板目录名
    view_depr: '/', // 模版文件名分割符，'/'代表二级目录
    view_ext: '.htm', // 模版文件后缀
    view_engine: 'art-template', // 默认模版引擎，字符串或引擎类，咱不支持更换
    view_filter: {}, // 模版函数，配置注入模板的函数，默认会自动注入url函数
}
```
数据库配置`.config/db.js`：可以配置多个，方便程序里切换使用。
```javascript
{
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
```
日志配置`.config/log.js`：log_handle可以自定义日志handle
```javascript
{
    log_level: [], // [error, warning, info, debug, http, sql]
    log_handle: function(msg, level) {console.log(`[${format('YY-mm-dd HH:ii:ss')}] [${level}] ${typeof msg == 'String' ? msg : JSON.stringify(msg)}`);} //function(msg, level) {}
}
```
缓存配置`.config/cache.js`：
```javascript
{
    cache_time: 60 * 60 * 24, // 默认缓存时间（1天），为空或false则为10年
    clear_time: undefined // (undefined: 一天清理一次, 0: 关闭自动清理, >0: 为自动清理周期)
}
```
分页配置`.config/page.js`：
```javascript
{
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
```
跳转模板配置`.config/tpl.js`：模板可以配置为自定义的
```javascript
{
    jump: require('./tpl/jump'), // 跳转模板
    exception: require('./tpl/exception') //  异常页面模板
}
```
自定义配置`.config/self.js`：自定义配置同样可以直接通过`this.$config.self`使用。
```javascript
{
    option1: ''
    option2: ''
    ...
}
```

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
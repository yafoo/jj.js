# jj.js 使用文档

> jj.js 是一个简单轻量的 Node.js MVC 框架，借鉴 ThinkPHP 5 设计，基于 Koa 构建。

---

## 目录

- [一、概述](#一概述)
- [二、安装与环境](#二安装与环境)
- [三、快速开始](#三快速开始)
- [四、目录结构](#四目录结构)
- [五、配置](#五配置)
- [六、路由](#六路由)
- [七、控制器](#七控制器)
- [八、模型](#八模型)
- [九、数据库操作](#九数据库操作)
- [十、视图与模板](#十视图与模板)
- [十一、请求与输入](#十一请求与输入)
- [十二、响应与输出](#十二响应与输出)
- [十三、中间件](#十三中间件)
- [十四、Cookie](#十四cookie)
- [十五、缓存](#十五缓存)
- [十六、日志](#十六日志)
- [十七、文件上传](#十七文件上传)
- [十八、分页](#十八分页)
- [十九、URL 生成](#十九url-生成)
- [二十、CLI 工具](#二十cli-工具)
- [二十一、工具函数](#二十一工具函数)

---

## 一、概述

### 1.1 简介

jj.js 是一个基于 Koa 的轻量级 Node.js MVC 框架，借鉴了 ThinkPHP 5 的设计理念，提供了开箱即用的 MVC 开发体验。框架核心特性：

- **轻量简洁**：核心代码精简，API 设计直观
- **MVC 架构**：完整的 Model-View-Controller 分层设计
- **多数据库支持**：SQLite（默认）、MySQL、MongoDB、sql.js
- **自动加载**：基于 Proxy 的模块自动加载与懒加载机制
- **模板引擎**：内置 art-template 模板引擎
- **丰富的功能**：路由、中间件、缓存、分页、日志、文件上传等

### 1.2 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Koa | ^3.2.1 | 底层 Web 框架 |
| @koa/router | ^15.7.0 | 路由管理 |
| art-template | ^5.1.0 | 模板引擎 |
| koa-body | ^8.0.0 | 请求体解析 |
| koa-static | ^5.0.0 | 静态文件服务 |

### 1.3 环境要求

- Node.js >= 20.19.0

---

## 二、安装与环境

### 2.1 使用 CLI 创建项目

```bash
# 使用 npx 初始化项目（交互式选择模板）
npx jj.js init myapp

# 进入项目目录
cd myapp

# 安装依赖
npm install

# 启动项目
npm start
```

### 2.2 可用模板

| 模板名 | 说明 |
|--------|------|
| hello | Hello World 入门示例 |
| todo | Todo List 完整示例（含数据库操作） |

### 2.3 手动安装

```bash
npm install jj.js
```

### 2.4 可选数据库驱动

jj.js 的数据库驱动作为 `peerDependencies`，按需安装：

```bash
# SQLite（原生驱动，默认数据库）
npm install sqlite3

# sql.js（纯 JS 实现的 SQLite，无需编译）
npm install sql.js

# MySQL
npm install mysql

# MongoDB
npm install mongodb
```

---

## 三、快速开始

### 3.1 Hello World

创建入口文件 `server.js`：

```javascript
const { App, Logger } = require('jj.js');

const port = 3000;
const app = new App();

app.listen(port, () => {
    Logger.system(`应用已启动: http://localhost:${port}`);
});
```

创建控制器 `app/controller/index.js`：

```javascript
const { Controller } = require('jj.js');

class IndexController extends Controller {
    index() {
        this.$show('Hello World!');
    }
}

module.exports = IndexController;
```

启动应用：

```bash
node server.js
```

访问 `http://localhost:3000/` 即可看到输出。

### 3.2 应用入口

`App` 继承自 Koa，因此拥有 Koa 的所有能力：

```javascript
const { App } = require('jj.js');

const app = new App();

// 传入中间件
const app2 = new App(async (ctx, next) => {
    console.log('自定义中间件');
    await next();
});

// 传入多个中间件
const app3 = new App([middleware1, middleware2]);

// 传入配置对象
const app4 = new App({
    middleware: [middleware1, middleware2]
});

app.listen(3000);
```

---

## 四、目录结构

### 4.1 标准目录结构

```
myapp/
├── app/
│   ├── controller/          # 控制器目录
│   │   ├── index.js         # 默认控制器
│   │   └── todo.js          # 业务控制器
│   ├── view/                # 视图模板目录
│   │   └── todo/
│   │       ├── index.htm    # 列表模板
│   │       └── form.htm     # 表单模板
│   ├── model/               # 模型目录（可选）
│   └── middleware/           # 中间件目录（可选）
├── config/
│   ├── app.js               # 应用配置
│   ├── db.js                # 数据库配置
│   ├── routes.js            # 路由配置（可选）
│   └── ...                  # 其他配置
├── static/                  # 静态资源目录（可选，需在 config/app.js 中配置 static_dir）
├── server.js                # 入口文件
├── package.json
└── jsconfig.json
```

### 4.2 多级模式（子应用）

jj.js 支持多级目录模式，实现模块化管理：

```
app/
├── controller/              # 根应用控制器
│   └── index.js
├── home/                    # home 子模块
│   ├── controller/
│   │   └── index.js
│   └── config/
│       └── set.js
├── api/                     # api 子模块
│   └── controller/
│       └── index.js
└── view/                    # 根应用视图
```

URL 访问规则：
- `/` → `app/controller/index.js` 的 `index` 方法
- `/home/index/index` → `app/home/controller/index.js` 的 `index` 方法
- `/api/index/index` → `app/api/controller/index.js` 的 `index` 方法

### 4.3 自动加载机制

jj.js 内置了强大的模块自动加载器（`loader`），基于目录结构自动识别并加载模块：

- **目录**：映射为命名空间
- **JS 文件**：映射为模块（`require`）
- **Class 文件**：自动实例化（单例模式）
- **JSON 文件**：自动解析

在控制器中通过 `$` 前缀访问自动加载的模块：

```javascript
class IndexController extends Controller {
    async index() {
        // this.$db → 自动加载 db 模块
        // this.$cache → 自动加载 cache 模块
        // this.$config → 获取配置
        // this.$request → 请求对象
    }
}
```

---

## 五、配置

配置文件位于 `config/` 目录下，框架会自动加载并合并到默认配置中。

### 5.1 应用配置 (`config/app.js`)

```javascript
/**
 * @type {import('jj.js').AppConfig}
 */
module.exports = {
    app_debug: true,              // 调试模式（生产环境务必设为 false）

    default_deep: '',             // 默认应用深度（为空表示 app 根目录）
    default_controller: 'index',  // 默认控制器名
    default_action: 'index',      // 默认方法名

    controller_folder: 'controller',  // 控制器目录名
    middleware_folder: 'middleware',   // 中间件目录名

    static_dir: 'static',         // 静态文件目录（相对于应用根目录，为空则关闭）
    koa_body: {}                  // koa-body 配置（为 null 则关闭 POST 解析）
};
```

### 5.2 数据库配置 (`config/db.js`)

```javascript
const path = require('path');

module.exports = {
    // 默认数据库连接
    default: {
        type: 'sqlite',           // 数据库类型：sqlite | mysql | mongodb | sqljs
        database: ':memory:',     // 数据库文件绝对路径
        prefix: 'jj_'             // 数据表前缀
    },

    // SQLite 配置
    sqlite: {
        type: 'sqlite',
        database: path.join(__dirname, '../data/app.db'),
        prefix: 'jj_'
    },

    // MySQL 配置
    mysql: {
        type: 'mysql',
        host: '127.0.0.1',
        database: 'myapp',
        user: 'root',
        password: '',
        port: 3306,
        charset: 'utf8mb4',
        prefix: 'jj_'
    },

    // MongoDB 配置
    mongodb: {
        type: 'mongodb',
        host: '127.0.0.1',
        database: 'myapp',
        user: 'root',
        password: 'root',
        port: 27017,
        prefix: 'jj_'
    },

    // sql.js 配置（纯 JS SQLite 驱动）
    sqljs: {
        type: 'sqljs',
        database: ':memory:',
        prefix: 'jj_'
    }
};
```

### 5.3 视图配置 (`config/view.js`)

```javascript
module.exports = {
    view_folder: 'view',            // 模板目录名
    view_depr: '/',                 // 模板文件名分隔符
    view_ext: '.htm',               // 模板文件后缀
    view_engine: '@yafoo/art-template', // 模板引擎
    view_filter: {}                 // 模板函数
};
```

### 5.4 日志配置 (`config/log.js`)

```javascript
module.exports = {
    log_level: ['system', 'error'],  // 日志级别：system, error, warning, info, debug, http, sql
    log_handle: function(level, ...args) {
        // 自定义日志处理函数
        console.log(`[${level}]`, ...args);
    }
};
```

### 5.5 缓存配置 (`config/cache.js`)

```javascript
module.exports = {
    cache_time: 60 * 60 * 24,     // 默认缓存时间（秒），默认 1 天
    clear_time: undefined          // 自动清理周期（undefined: 清理一次, 0: 关闭, >0: 周期秒数）
};
```

### 5.6 Cookie 配置 (`config/cookie.js`)

```javascript
module.exports = {
    keys: ['your-secret-key'],  // Cookie 签名密钥
    signed: true                // 默认开启签名
};
```

### 5.7 分页配置 (`config/page.js`)

```javascript
module.exports = {
    page_key: 'page',         // 分页参数名
    key_origin: 'query',      // 参数来源：query 或 params
    page_size: 10,            // 默认每页条数
    page_length: 5,           // 页码显示数量
    url_page: '',             // 分页 URL 规则
    url_index: '',            // 首页 URL 规则
    // 分页模板（支持变量：${url}, ${page}, ${total_page}, ${total}）
    index_tpl: '<li class="index"><a href="${url}">首页</a></li>',
    end_tpl: '<li class="end"><a href="${url}">末页</a></li>',
    prev_tpl: '<li class="prev"><a href="${url}">上一页</a></li>',
    next_tpl: '<li class="next"><a href="${url}">下一页</a></li>',
    list_tpl: '<li><a href="${url}">${page}</a></li>',
    active_tpl: '<li class="active"><a href="${url}">${page}</a></li>',
    info_tpl: '<span class="info">共${total_page}页，${total}条记录</span>',
    template: '<div class="pagination"><ul class="page">${index}${prev}${list}${next}${end}</ul>${info}</div>'
};
```

---

## 六、路由

### 6.1 默认路由

jj.js 采用「URL 映射控制器方法」的默认路由规则：

```
URL 路径                          → 控制器方法
/                                 → app/controller/index.js → index()
/todo                             → app/controller/todo.js → index()
/todo/add                         → app/controller/todo.js → add()
/todo/edit                        → app/controller/todo.js → edit()
/home/user/profile                → app/home/controller/user.js → profile()
```

**URL 解析规则**：`/[模块/.../]控制器/方法`

- 最后一段为方法名（action），默认为 `index`
- 倒数第二段为控制器名（controller），默认为 `index`
- 前面的部分为模块深度（deep）

### 6.2 自定义路由

在 `config/routes.js` 中定义自定义路由：

```javascript
module.exports = [
    // 基础路由
    {
        url: '/api/users',
        path: 'api/user/list',      // 映射到控制器路径
        method: 'get'               // 请求方法：all|get|post|put|patch|delete
    },

    // 带参数路由
    {
        url: '/article/:id',
        path: 'article/detail',
        method: 'get'
    },

    // 使用路由参数替换路径
    {
        url: '/user/:id',
        path: 'user/profile/${id}',  // ${id} 会被替换为路由参数
        method: 'get'
    },

    // 命名路由（可用于 URL 反向生成）
    {
        url: '/article/:id(\\d+)',
        path: 'article/detail',
        method: 'get',
        name: 'article_detail'       // 路由名字
    },

    // 指定控制器目录类型
    {
        url: '/view/:page',
        path: 'page/${page}',
        type: 'view',                // 使用 view 目录而非 controller
        method: 'get'
    },

    // 直接使用函数处理
    {
        url: '/health',
        path: async (ctx) => {
            ctx.body = 'OK';
        },
        method: 'get'
    }
];
```

### 6.3 路由参数

路由支持动态参数，参数会自动注入到 `ctx.params`：

```javascript
// config/routes.js
module.exports = [
    { url: '/user/:id', path: 'user/detail', method: 'get' }
];

// app/controller/user.js
class UserController extends Controller {
    async detail() {
        const id = this.ctx.params.id;  // 获取路由参数
        this.$show(`用户 ID: ${id}`);
    }
}
```

---

## 七、控制器

### 7.1 创建控制器

控制器文件放在 `app/controller/` 目录下，每个文件导出一个继承 `Controller` 的类：

```javascript
const { Controller } = require('jj.js');

class UserController extends Controller {
    // 默认方法（访问 /user 时调用）
    async index() {
        this.$show('用户列表');
    }

    // 查看用户（访问 /user/view 时调用）
    async view() {
        const id = this.$request.get('id');
        this.$show(`查看用户: ${id}`);
    }
}

module.exports = UserController;
```

### 7.2 生命周期方法

控制器提供两个生命周期方法：

```javascript
class IndexController extends Controller {
    // 初始化方法：在控制器方法执行前自动执行
    async _init() {
        // 可用于权限检查、数据初始化等
        // 返回 '__EXIT__' 将终止后续执行
    }

    // 结束方法：在控制器方法执行后自动执行
    async _end() {
        // 可用于清理工作
        // 如果控制器方法返回 '__EXIT__'，则不会执行此方法
    }

    async index() {
        this.$show('Hello');
    }
}
```

### 7.3 控制器方法

#### `$show(data)` - 直接输出

```javascript
// 输出文本
this.$show('Hello World');

// 输出 JSON
this.$show({ code: 0, msg: 'success' });

// 输出 HTML
this.$show('<h1>Hello</h1>');
```

#### `$assign(name, value)` - 模板赋值

```javascript
this.$assign('title', '页面标题');
this.$assign('list', [{ id: 1, name: 'Tom' }]);
```

#### `$data(name)` - 获取模板数据

```javascript
this.$assign('title', 'Hello');
const title = this.$data('title'); // 'Hello'
```

#### `$fetch(template)` - 渲染模板文件并输出

```javascript
// 渲染默认模板（当前控制器/方法对应的模板）
await this.$fetch();

// 渲染指定模板
await this.$fetch('todo/index');

// 渲染其他目录模板
await this.$fetch('form');
```

#### `$render(content)` - 渲染内容字符串并输出

```javascript
const tpl = '<h1>{{title}}</h1>';
this.$assign('title', 'Hello');
await this.$render(tpl);
```

#### `$load(template)` - 加载模板文件内容并输出

```javascript
// 加载模板文件原始内容（不解析变量）并输出
await this.$load('todo/index');
```

#### `$redirect(url, status)` - 重定向

```javascript
// 默认 302 重定向
this.$redirect('/user/list');

// 指定状态码
this.$redirect('/login', 301);
```

#### `$success(msg, url)` - 成功提示

```javascript
// 简单成功提示
this.$success('操作成功！');

// 指定跳转地址
this.$success('操作成功！', '/user/list');

// 使用相对路径
this.$success('添加成功', 'index');
```

#### `$error(msg, url)` - 错误提示

```javascript
this.$error('操作失败！');
this.$error('参数错误', '/user/list');
```

#### `$exit()` - 终止执行

```javascript
async _init() {
    if (!this.$request.get('token')) {
        return this.$exit(); // 终止后续方法执行
    }
}
```

### 7.4 控制器属性

在控制器中，可以通过 `this.$xxx` 访问框架内置模块：

```javascript
class IndexController extends Controller {
    async index() {
        this.ctx          // Koa 上下文对象
        this.$request     // Request 实例
        this.$response    // Response 实例
        this.$db          // Db 类（数据库）
        this.$model       // Model 基类
        this.$view        // View 类
        this.$cache       // Cache 类
        this.$logger      // Logger 类
        this.$upload      // Upload 类
        this.$config      // 配置对象
        this.$utils       // 工具函数
        this.$cookie      // Cookie 类
        this.$pagination  // Pagination 类
        this.$url         // Url 类

        this.ctx.DEEP         // 当前应用深度
        this.ctx.CONTROLLER   // 当前控制器名
        this.ctx.ACTION       // 当前方法名
    }
}
```

### 7.5 控制器中间件

控制器支持声明式中间件，在控制器类上定义 `middleware` 属性：

```javascript
const { Controller } = require('jj.js');

class UserController extends Controller {
    // 定义中间件
    middleware = [
        'auth',                          // 简单写法：中间件方法
        {
            middleware: 'check_login/handle',     // 中间件方法
            except: ['login', 'register'] // 排除的方法
        },
        {
            middleware: 'log',            // 中间件方法
            accept: 'index,detail'        // 仅适用于指定方法
        }
    ];

    async index() { /* ... */ }
    async login() { /* ... */ }
    async register() { /* ... */ }
}
```

中间件文件放在 `app/middleware/` 目录下：

```javascript
// app/middleware/check_login.js
const { Middleware } = require('jj.js');

class CheckLoginMiddleware extends Middleware {
    async handle() {
        // 中间件逻辑
        if (!this.$request.get('token')) {
            return this.$error('请先登录', '/login');
        }
        // 不调用 $exit/$show 等，则继续执行后续中间件和控制器方法
    }
}

module.exports = CheckLoginMiddleware;
```

### 7.6 空操作

当请求的控制器或方法不存在时，框架会查找 `_empty` 控制器或方法：

```javascript
class _emptyController extends Controller {
    async _empty() {
        this.$show('404 - 页面不存在');
    }
}
module.exports = _emptyController;
```

---

## 八、模型

### 8.1 创建模型

模型文件放在 `app/model/` 目录下：

```javascript
const { Model } = require('jj.js');

class UserModel extends Model {
    // 数据表名（不含前缀），默认按类名转下划线
    table = 'user';

    // 主键字段名，默认 'id'
    pk = 'id';

    // 数据库连接配置（可选，默认使用 default 连接）
    // connection = 'mysql';
    // 或者直接传入配置对象
    // connection = { type: 'mysql', host: '...', ... };
}

module.exports = UserModel;
```

### 8.2 模型 CRUD

#### 新增数据 `add(data)`

```javascript
const user = new UserModel(this.ctx);
const result = await user.add({
    name: 'Tom',
    email: 'tom@example.com',
    age: 25
});
console.log(result.insertId); // 新插入记录的 ID
```

#### 保存数据 `save(data, condition)`

`save` 方法会智能判断：如果数据包含主键或传入了条件，则执行更新；否则执行新增。

```javascript
// 新增（无主键）
await user.save({ name: 'Tom', email: 'tom@example.com' });

// 更新（包含主键）
await user.save({ id: 1, name: 'Tom Updated' });

// 更新（传入条件）
await user.save({ name: 'Tom Updated' }, { id: 1 });
```

#### 查询单条 `get(condition)`

```javascript
// 按条件查询
const row = await user.get({ id: 1 });

// 无条件（获取第一条）
const row = await user.get();
```

#### 查询多条 `all(condition)`

```javascript
// 查询所有
const list = await user.all();

// 按条件查询
const list = await user.all({ status: 1 });
```

#### 更新数据

通过模型的 `db` 属性访问完整的数据库查询构造器：

```javascript
await user.db.where({ id: 1 }).update({ name: 'New Name' });
```

#### 删除数据 `del(condition)`

```javascript
await user.del({ id: 1 });
```

### 8.3 使用数据库查询构造器

模型提供了 `db` 属性，可以直接使用完整的数据库查询构造器：

```javascript
class UserModel extends Model {
    async getActiveUsers() {
        return await this.db
            .where({ status: 1 })
            .order('created_at', 'desc')
            .limit(0, 10)
            .select();
    }

    async getUserCount() {
        return await this.db.count();
    }
}
```

---

## 九、数据库操作

### 9.1 基本用法

在控制器中通过 `this.$db` 获取数据库实例：

```javascript
class IndexController extends Controller {
    async index() {
        const db = this.$db;

        // 指定表名（不含前缀）
        db.table('article');

        // 查询所有记录
        const list = await db.table('article').select();

        // 查询单条
        const row = await db.table('article').where({ id: 1 }).find();
    }
}
```

### 9.2 查询构造器

#### 基本查询

```javascript
// 查询多条
const list = await db.table('article').select();

// 查询单条
const row = await db.table('article').find();

// 查询字段值
const title = await db.table('article').where({ id: 1 }).value('title');

// 获取列数据
const titles = await db.table('article').column('title');

// 获取键值对列数据
const map = await db.table('article').column('title', 'id');
// 返回 { 1: '标题1', 2: '标题2', ... }
```

#### 查询条件 `where(where, logic)`

```javascript
// 等值查询
await db.table('article').where({ id: 1 }).find();

// 多条件（AND）
await db.table('article').where({ status: 1, type: 'news' }).select();

// 多次调用 where（默认 AND 连接）
await db.table('article')
    .where({ status: 1 })
    .where({ type: 'news' })
    .select();

// OR 连接
await db.table('article')
    .where({ status: 1 })
    .where({ type: 'recommend' }, 'or')
    .select();

// 比较运算符
await db.table('article').where({ id: ['>', 5] }).select();
await db.table('article').where({ id: ['>=', 5] }).select();
await db.table('article').where({ id: ['<', 10] }).select();
await db.table('article').where({ id: ['<>', 1] }).select();

// LIKE 查询
await db.table('article').where({ title: ['like', '%Node%'] }).select();

// IN 查询
await db.table('article').where({ id: ['in', [1, 2, 3]] }).select();

// NOT IN 查询
await db.table('article').where({ id: ['not in', [1, 2, 3]] }).select();

// BETWEEN 查询
await db.table('article').where({ add_time: ['between', [1000, 2000]] }).select();

// NOT BETWEEN
await db.table('article').where({ add_time: ['not between', '1000,2000'] }).select();

// IS NULL / IS NOT NULL
await db.table('article').where({ deleted_at: ['is', null] }).select();
await db.table('article').where({ deleted_at: ['is not', null] }).select();

// 自定义表达式
await db.table('article').where({
    '': ['exp', 'add_time > ?', [1000]]
}).select();
```

#### 指定字段 `field(field)`

```javascript
// 查询指定字段
await db.table('article').field('id, title').select();

// 字段别名
await db.table('article').field('id, title as name').select();

// 多次调用
await db.table('article').field('id').field('title').select();
```

#### 排序 `order(field, order)`

```javascript
// 升序
await db.table('article').order('id', 'asc').select();

// 降序
await db.table('article').order('id', 'desc').select();

// 多字段排序
await db.table('article').order('sort', 'asc').order('id', 'desc').select();
```

#### 限制数量 `limit(offset, rows)`

```javascript
// 限制条数
await db.table('article').limit(10).select();

// 偏移量 + 条数
await db.table('article').limit(0, 10).select();
```

#### 分页查询 `page(page, pageSize)`

```javascript
// 第 1 页，每页 10 条
await db.table('article').page(1, 10).select();
```

#### 表连接 `join(table, on, type)`

```javascript
// LEFT JOIN
await db.table('article')
    .join('user', 'article.user_id = user.id', 'left')
    .select();

// INNER JOIN
await db.table('article')
    .join('user', 'article.user_id = user.id', 'inner')
    .select();

// 多表连接
await db.table('article')
    .join('user', 'article.user_id = user.id')
    .join('category', 'article.cat_id = category.id')
    .select();
```

#### 分组查询 `group(field)` 和 `having(having)`

```javascript
// GROUP BY
await db.table('article').group('user_id').select();

// GROUP BY + HAVING
await db.table('article')
    .group('user_id')
    .having('count(*) > 1')
    .select();
```

#### 去重 `distinct()`

```javascript
await db.table('article').distinct().field('user_id').select();
```

### 9.3 聚合查询

```javascript
// 总数
const count = await db.table('article').count();

// 带条件计数
const count = await db.table('article').where({ status: 1 }).count();

// 最大值
const max = await db.table('article').max('add_time');

// 最小值
const min = await db.table('article').min('add_time');

// 平均值
const avg = await db.table('article').avg('price');

// 求和
const sum = await db.table('article').sum('amount');
```

### 9.4 新增数据

```javascript
// 方式一：直接传入数据
await db.table('article').insert({
    title: '新文章',
    content: '文章内容',
    add_time: Date.now()
});

// 方式二：使用 data 方法
await db.table('article')
    .data({ title: '新文章' })
    .data({ content: '文章内容' })
    .insert();

// 返回结果包含 insertId（新记录 ID）和 affectedRows
```

### 9.5 更新数据

```javascript
// 基本更新
await db.table('article')
    .where({ id: 1 })
    .update({ title: '更新后的标题' });

// 使用 data 方法
await db.table('article')
    .data({ title: '新标题', content: '新内容' })
    .where({ id: 1 })
    .update();
```

#### 字段增减操作

```javascript
// 字段自增（默认 +1）
await db.table('article').where({ id: 1 }).inc('view_count');

// 字段自增指定值
await db.table('article').where({ id: 1 }).inc('view_count', 5);

// 字段自减
await db.table('article').where({ id: 1 }).dec('stock', 1);

// 自定义表达式
await db.table('article')
    .data({ title: ['exp', 'UPPER(title)'] })
    .where({ id: 1 })
    .update();
```

### 9.6 删除数据

```javascript
// 按条件删除
await db.table('article').where({ id: 1 }).delete();

// 注意：delete 必须提供 where 条件，否则抛出错误
```

### 9.7 原生 SQL 查询

```javascript
// 执行查询 SQL
const list = await db.query('SELECT * FROM jj_article WHERE id = ?', [1]);

// 执行写操作 SQL
const result = await db.execute(
    'INSERT INTO jj_article (title, content) VALUES (?, ?)',
    ['标题', '内容']
);

// 创建表
await db.execute(`
    CREATE TABLE IF NOT EXISTS jj_article (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        add_time INT NOT NULL DEFAULT 0
    )
`);
```

### 9.8 事务操作

```javascript
// 自动事务（推荐）
await db.startTrans(async () => {
    await db.table('article').insert({ title: '文章1', content: '内容1' });
    await db.table('article').insert({ title: '文章2', content: '内容2' });
    // 如果抛出异常，自动回滚
});

// 手动事务
try {
    await db.startTrans();
    await db.table('article').insert({ title: '文章1', content: '内容1' });
    await db.table('article').insert({ title: '文章2', content: '内容2' });
    await db.commit();    // 提交
} catch (e) {
    await db.rollback();  // 回滚
}
```

### 9.9 查询缓存

```javascript
// 缓存查询结果 60 秒
const list = await db.table('article')
    .withCache(60)
    .select();
```

### 9.10 获取 SQL 语句

```javascript
// 获取将要执行的 SQL（不实际执行）
await db.table('article')
    .where({ status: 1 })
    .getSql()
    .select();

console.log(db.sql); // 输出: select * from `jj_article` where `status` = 1
```

### 9.11 字段过滤

```javascript
// 仅允许指定字段写入
await db.table('article')
    .allowField('title, content')
    .insert({ title: '标题', content: '内容', extra: '被过滤' });

// 按数据表字段自动过滤
await db.table('article')
    .allowField(true)
    .insert(reqData);

// 关闭字段过滤
await db.table('article')
    .allowField(false)
    .insert(reqData);
```

### 9.12 分页查询

```javascript
// 分页查询，返回 [数据列表, 分页实例]
const [list, pagination] = await db.table('article')
    .order('id', 'desc')
    .paginate({ page_size: 10 });

// 渲染分页 HTML
const pageHtml = pagination.render();

// 在模板中使用
this.$assign('list', list);
this.$assign('page', pageHtml);
await this.$fetch();
```

### 9.13 数据表信息

```javascript
// 获取表字段信息
const fields = await db.tableField('article');
// 返回: ['id', 'title', 'content', 'add_time']

// 获取表结构详情
const info = await db.tableInfo('article');
// 返回包含 Field, Type 等信息的数组
```

### 9.14 多数据库连接

```javascript
// 使用指定数据库连接
const mysqlDb = new this.$db(this.ctx, 'mysql');
const list = await mysqlDb.table('user').select();

// 使用自定义配置
const customDb = new this.$db(this.ctx, {
    type: 'mysql',
    host: '192.168.1.100',
    database: 'other_db',
    user: 'root',
    password: '123456',
    port: 3306,
    prefix: 'app_'
});
```

---

## 十、视图与模板

### 10.1 模板引擎

jj.js 默认使用 [art-template](https://goofychris.github.io/art-template/zh-cn/docs/syntax.html) 模板引擎，支持简洁的模板语法。

模板文件放在 `app/view/` 目录下，默认后缀为 `.htm`。

### 10.2 模板语法

```html
<!-- 变量输出 -->
<h1>{{title}}</h1>

<!-- 循环 -->
<ul>
    {{each list item}}
    <li>{{item.id}} - {{item.name}}</li>
    {{/each}}
</ul>

<!-- 条件判断 -->
{{if user}}
    <p>欢迎, {{user.name}}</p>
{{else}}
    <p>请登录</p>
{{/if}}

<!-- 原始 HTML 输出（不转义） -->
{{@htmlContent}}

<!-- 使用模板函数 -->
<a href="{{url('detail', {id: item.id})}}">详情</a>
```

### 10.3 模板路径规则

模板文件路径遵循以下规则：

```
app/view/{控制器名}/{方法名}.htm
```

例如：
- 控制器 `todo`，方法 `index` → `app/view/todo/index.htm`
- 控制器 `todo`，方法 `form` → `app/view/todo/form.htm`

当 `view_depr` 配置为 `'/'` 时，支持二级目录：

```
app/view/todo/index.htm    → todo/index
app/view/todo/form.htm     → todo/form
```

### 10.4 在控制器中使用视图

```javascript
class TodoController extends Controller {
    async index() {
        // 赋值模板变量
        this.$assign('title', 'Todo List');
        this.$assign('list', await this.$db.table('todo').select());

        // 渲染默认模板并输出
        await this.$fetch();
    }

    async detail() {
        this.$assign('item', await this.$db.table('todo').where({ id: 1 }).find());

        // 渲染指定模板
        await this.$fetch('todo/detail');
    }

    async renderString() {
        this.$assign('name', 'World');
        // 渲染模板字符串
        await this.$render('Hello {{name}}');
    }
}
```

### 10.5 自定义模板函数

在配置中注册模板函数：

```javascript
// config/view.js
module.exports = {
    view_filter: {
        // 日期格式化函数
        dateFormat: function(timestamp) {
            return new Date(timestamp * 1000).toLocaleDateString();
        },
        // 截断函数
        truncate: function(str, len) {
            return str.length > len ? str.slice(0, len) + '...' : str;
        }
    }
};
```

在模板中使用：

```html
<!-- 直接函数调用 -->
<p>{{dateFormat(item.add_time)}}</p>
<p>{{truncate(item.title, 20)}}</p>

<!-- 管道过滤器方式 -->
<p>{{item.add_time | dateFormat}}</p>
<p>{{item.title | truncate 20}}</p>
```

### 10.6 URL 模板函数

框架内置了 `url` 模板函数，用于在模板中生成 URL：

```html
<!-- 生成当前控制器下的方法 URL -->
<a href="{{url('add')}}">新增</a>

<!-- 带参数 -->
<a href="{{url('edit', {id: item.id})}}">编辑</a>

<!-- 指定控制器 -->
<a href="{{url('user/profile', {id: 1})}}">用户详情</a>
```

### 10.7 模板继承

模板继承允许你构建一个包含站点共同元素的基本模板"骨架"，子模板可以覆盖骨架中的指定区块。

**布局模板** `app/view/layout.htm`：

```html
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{block 'title'}}我的站点{{/block}}</title>
    {{block 'head'}}
    <link rel="stylesheet" href="/static/css/main.css">
    {{/block}}
</head>
<body>
    {{block 'content'}}{{/block}}
</body>
</html>
```

**子模板** `app/view/index/index.htm`：

```html
{{extend './layout'}}

{{block 'title'}}首页 - 我的站点{{/block}}

{{block 'head'}}
<link rel="stylesheet" href="/static/css/index.css">
{{/block}}

{{block 'content'}}
<h1>欢迎来到首页</h1>
{{/block}}
```

渲染子模板后，将自动应用布局骨架，`block` 中定义的内容会替换布局中对应的区块。

### 10.8 子模板（include）

使用 `include` 可以在模板中引入其他模板文件：

```html
<!-- 引入头部模板 -->
{{include './header'}}

<!-- 引入侧边栏，并传递数据 -->
{{include './sidebar' sidebarData}}

<!-- 引入底部模板 -->
{{include './footer'}}
```

子模板文件示例 `app/view/common/header.htm`：

```html
<header>
    <nav>
        <a href="/">首页</a>
        <a href="/about">关于</a>
    </nav>
</header>
```

> **提示**：`include` 的第二个参数默认为当前模板数据 `$data`，可以传入自定义数据对象。

---

## 十一、请求与输入

### 11.1 获取请求参数

通过 `this.$request` 访问请求数据：

```javascript
class IndexController extends Controller {
    async index() {
        const req = this.$request;

        // 智能获取参数（优先级：post > get > param）
        const keyword = req.query('keyword');

        // 获取 GET 参数
        const page = req.get('page', 1);       // 带默认值
        const allGet = req.getAll();            // 获取所有 GET 参数

        // 获取 POST 参数（需开启 koa_body）
        const title = req.post('title');
        const allPost = req.postAll();          // 获取所有 POST 参数

        // 获取路由参数
        const id = req.param('id');
        const allParams = req.paramAll();       // 获取所有路由参数

        // 获取所有参数（合并 param + get + post）
        const all = req.queryAll();
    }
}
```

### 11.2 请求信息

```javascript
// 请求方式
req.method();         // 'get', 'post', 'put', 'delete' 等
req.isGet();          // true/false
req.isPost();         // true/false
req.isAjax();         // true/false（检测 XMLHttpRequest）

// 请求 URL
req.url();            // 完整请求 URL

// 客户端 IP
req.ip();             // 客户端 IP 地址

// 请求控制器和方法名
req.controller();     // 当前控制器名
req.action();         // 当前方法名

// Header 信息
req.header('Content-Type');
req.headerAll();      // 所有 Header
```

### 11.3 文件上传

```javascript
// 获取上传文件
const file = req.file('avatar');     // 获取单个文件
const files = req.fileAll();          // 获取所有文件
```

---

## 十二、响应与输出

### 12.1 响应方法

通过 `this.$response` 或直接使用控制器快捷方法：

```javascript
class IndexController extends Controller {
    async index() {
        // 直接输出内容
        this.$show('Hello');
        this.$show({ code: 0, data: {} });

        // 重定向
        this.$redirect('/login');
        this.$redirect('/login', 301);

        // 成功提示（自动判断 AJAX/普通请求）
        this.$success('操作成功');
        this.$success('操作成功', '/user/list');

        // 错误提示
        this.$error('操作失败');
        this.$error('参数错误', '/user/list');
    }
}
```

### 12.2 AJAX 响应

框架会自动判断请求类型：
- **AJAX 请求**：`$success` 和 `$error` 返回 JSON 格式 `{ state: 1, msg: '...', data: '...' }`
- **普通请求**：返回 HTML 跳转页面

### 12.3 设置等待时间

```javascript
// 设置跳转等待时间（秒）
this.$response.wait(5).success('操作成功，5秒后跳转');
```

---

## 十三、中间件

### 13.1 Koa 中间件

jj.js 完全兼容 Koa 中间件，在创建 App 时传入：

```javascript
const { App } = require('jj.js');

// 单个中间件
const app = new App(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
});

// 多个中间件
const app = new App([
    async (ctx, next) => { /* ... */ await next(); },
    async (ctx, next) => { /* ... */ await next(); }
]);
```

### 13.2 控制器中间件

控制器中间件在控制器类中声明，执行顺序在控制器方法之前：

```javascript
const { Controller } = require('jj.js');

class ArticleController extends Controller {
    // 声明中间件
    middleware = [
        'auth',                          // 所有方法都执行
        {
            middleware: 'logVisit',
            except: ['delete']           // 排除 delete 方法
        },
        {
            middleware: 'checkPermission',
            accept: 'add,edit'           // 仅 add 和 edit 方法执行
        }
    ];

    async index() { /* ... */ }
    async add() { /* ... */ }
    async edit() { /* ... */ }
    async delete() { /* ... */ }
}
```

### 13.3 编写中间件

中间件文件放在 `app/middleware/` 目录下，继承 `Middleware` 类：

```javascript
// app/middleware/auth.js
const { Middleware } = require('jj.js');

class AuthMiddleware extends Middleware {
    async handle() {
        const token = this.$request.header('Authorization');
        if (!token) {
            return this.$error('未授权访问', '/login');
        }
        // 验证 token...
        // 调用 $next()继续执行
        this.$next();
    }
}

module.exports = AuthMiddleware;
```

中间件方法名默认为 `handle`，也可以在路由配置中指定方法名。

---

## 十四、Cookie

### 14.1 基本操作

通过 `this.$cookie` 操作 Cookie：

```javascript
class IndexController extends Controller {
    async index() {
        const cookie = this.$cookie;

        // 设置 Cookie
        cookie.set('username', 'Tom');

        // 设置带选项的 Cookie
        cookie.set('token', 'abc123', {
            maxAge: 60 * 60 * 24 * 7,  // 7 天（毫秒）
            path: '/',
            httpOnly: true
        });

        // 获取 Cookie
        const username = cookie.get('username');

        // 删除 Cookie
        cookie.delete('username');

        // 获取所有 Cookie
        const all = cookie.all();

        // 获取所有 Cookie 键名
        const keys = cookie.keys();

        // 清空所有 Cookie
        cookie.clear();
    }
}
```

---

## 十五、缓存

### 15.1 基本操作

`Cache` 是一个静态类，提供简单的内存缓存功能：

```javascript
const { Cache } = require('jj.js');

// 设置缓存（key, value, 过期时间秒）
Cache.set('user_1', { name: 'Tom' }, 3600);

// 获取缓存
const user = Cache.get('user_1');

// 检查缓存是否存在
const exists = Cache.has('user_1');

// 删除缓存
Cache.delete('user_1');

// 清空所有缓存
Cache.delete();

// 获取有效缓存数量
const count = Cache.size();

// 获取所有有效缓存键
const keys = Cache.keys();
```

### 15.2 在控制器中使用

```javascript
class IndexController extends Controller {
    async index() {
        // 通过 this.$cache 访问
        this.$cache.set('key', 'value', 600);
        const val = this.$cache.get('key');
    }
}
```

### 15.3 数据库查询缓存

```javascript
// 查询结果缓存 60 秒
const list = await this.$db.table('article')
    .withCache(60)
    .select();
```

---

## 十六、日志

### 16.1 日志级别

框架支持以下日志级别（优先级从高到低）：

| 级别 | 说明 |
|------|------|
| system | 系统级日志 |
| error | 错误日志 |
| warning | 警告日志 |
| info | 信息日志 |
| debug | 调试日志 |
| http | HTTP 请求日志 |
| sql | SQL 查询日志 |

### 16.2 使用日志

```javascript
const { Logger } = require('jj.js');

// 各级别日志
Logger.system('系统启动完成');
Logger.error('发生错误', errorObject);
Logger.warning('警告信息');
Logger.info('一般信息');
Logger.debug('调试信息');
Logger.http('HTTP 请求日志');
Logger.sql('SQL 查询日志');

// 自定义级别
Logger.log('custom_level', '自定义日志内容');
```

### 16.3 在控制器中使用

```javascript
class IndexController extends Controller {
    async index() {
        this.$logger.info('处理请求');
        this.$logger.error('错误信息', err);
    }
}
```

### 16.4 自定义日志处理

```javascript
// config/log.js
module.exports = {
    log_level: ['system', 'error', 'warning', 'info', 'debug', 'http', 'sql'],
    log_handle: function(level, ...args) {
        // 自定义日志处理逻辑
        // 例如写入文件、发送到日志服务等
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}] ${msg}`);
    }
};
```

### 16.5 创建独立日志实例

```javascript
const { Logger } = require('jj.js');

// 创建独立的日志实例
const MyLogger = new Logger(function(level, ...args) {
    // 自定义处理
    fs.appendFileSync('app.log', `[${level}] ${args.join(' ')}\n`);
});

MyLogger.info('独立日志');
```

---

## 十七、文件上传

### 17.1 基本用法

文件上传需要先开启 `koa_body` 配置：

```javascript
// config/app.js
module.exports = {
    koa_body: {
        multipart: true    // 开启文件上传支持
    }
};
```

在控制器中处理上传：

```javascript
class UploadController extends Controller {
    async upload() {
        const upload = this.$upload;

        // 设置上传文件
        upload.file('avatar');  // 表单字段名

        // 设置验证规则
        upload.validate({
            size: 2 * 1024 * 1024,     // 最大 2MB
            ext: 'jpg,png,gif',         // 允许的后缀
            type: 'image/jpeg,image/png,image/gif'  // 允许的 MIME 类型
        });

        // 保存文件
        const result = await upload.save('uploads/');

        if (result) {
            console.log('文件名:', result.filename);
            console.log('保存路径:', result.filepath);
            console.log('文件大小:', result.size);
            console.log('MIME类型:', result.mimetype);
            this.$success('上传成功');
        } else {
            this.$error(upload.getError());
        }
    }
}
```

### 17.2 自定义保存文件名

```javascript
// 使用固定文件名
upload.rule('my-avatar');

// 使用函数动态生成
upload.rule(() => {
    return 'avatar_' + Date.now();
});
```

### 17.3 验证方法

```javascript
const upload = this.$upload;
upload.file('file');

// 检查文件后缀
upload.checkExt('jpg,png');

// 检查 MIME 类型
upload.checkType('image/jpeg');

// 检查图片合法性
upload.checkImg();

// 综合验证
upload.check(); // 返回 true/false

// 获取错误信息
upload.getError();
```

### 17.4 获取上传文件信息

```javascript
// 获取单个文件
const file = this.$request.file('avatar');
// file 对象包含: filepath, originalFilename, mimetype, size 等

// 获取所有文件
const files = this.$request.fileAll();
```

---

## 十八、分页

### 18.1 基本用法

```javascript
class ArticleController extends Controller {
    async index() {
        // 使用数据库 paginate 方法
        const [list, pagination] = await this.$db
            .table('article')
            .order('id', 'desc')
            .paginate({ page_size: 10 });

        this.$assign('list', list);
        this.$assign('page', pagination.render());
        await this.$fetch();
    }
}
```

### 18.2 分页配置

```javascript
const pagination = this.$pagination;

// 设置总数
pagination.total(100);

// 设置/获取当前页
pagination.page(2);
const currentPage = pagination.page();

// 设置/获取每页条数
pagination.pageSize(20);
const size = pagination.pageSize();

// 渲染分页 HTML
const html = pagination.render(100, 1, 10); // total, page, page_size
```

### 18.3 自定义分页样式

在 `config/page.js` 中自定义分页模板：

```javascript
module.exports = {
    page_size: 15,
    page_length: 7,
    // 自定义模板变量：${url}, ${page}, ${total_page}, ${total}
    prev_tpl: '<a class="prev" href="${url}">&laquo;</a>',
    next_tpl: '<a class="next" href="${url}">&raquo;</a>',
    active_tpl: '<span class="current">${page}</span>',
    template: '<nav class="page">${prev}${list}${next}${info}</nav>'
};
```

---

## 十九、URL 生成

### 19.1 基本用法

通过 `this.$url` 生成 URL：

```javascript
class IndexController extends Controller {
    async index() {
        const url = this.$url;

        // 智能生成 URL（相对于当前控制器）
        url.build('edit');              // /current_controller/edit
        url.build('edit', { id: 1 });   // /current_controller/edit?id=1

        // 指定完整路径
        url.build('/user/profile');     // /user/profile

        // 带参数
        url.build('/user/profile', { id: 1, name: 'tom' });
        // → /user/profile?id=1&name=tom

        // 添加 URL 后缀
        url.build('/user/profile', { id: 1 }, '.html');
        // → /user/profile.html?id=1

        // 生成完整 URL（含域名）
        url.build('/user/profile', {}, '', true);
        // → http://localhost:3000/user/profile
    }
}
```

### 19.2 命名路由反向生成

```javascript
// config/routes.js
module.exports = [
    {
        url: '/article/:id',
        path: 'article/detail',
        name: 'article_detail'
    }
];

// 在控制器或模板中
url.build(':article_detail', { id: 1 });
// → /article/1

// 在模板中
<a href="{{url(':article_detail', {id: item.id})}}">详情</a>
```

---

## 二十、CLI 工具

### 20.1 创建项目

```bash
# 交互式创建（选择模板）
npx jj.js init myapp

# 查看帮助
npx jj.js --help
```

### 20.2 项目模板

| 模板 | 说明 |
|------|------|
| hello | Hello World 入门示例，包含基础控制器和配置 |
| todo | Todo List 完整示例，包含数据库 CRUD、视图模板等 |

---

## 二十一、工具函数

框架内置了 `utils` 工具集，通过 `this.$utils` 或直接引用访问。

### 21.1 日期工具 `utils.date`

```javascript
const { utils } = require('jj.js');
const { date } = utils;

// 格式化时间
date.format('YY-mm-dd HH:ii:ss');            // 当前时间
date.format('YY-mm-dd', 1700000000);         // 指定时间戳
date.format('YY/mm/dd', new Date());          // Date 实例
// 占位符：Y/y-年, m-月, d-日, H-时(24h), h-时(12h), i-分, s-秒

// 获取多长时间前
date.before(1700000000);  // "5分钟前" "3小时前" "2天前"
```

### 21.2 文件工具 `utils.fs`

```javascript
const { fs } = require('jj.js').utils;

await fs.exists('/path/to/file');     // 路径是否存在
await fs.isFile('/path/to/file');     // 是否文件
fs.isFileSync('/path/to/file');       // 同步版本
await fs.isDir('/path/to/dir');       // 是否目录
fs.isDirSync('/path/to/dir');         // 同步版本
await fs.mkdirs('/a/b/c');            // 创建多级目录
```

### 21.3 MD5 工具

```javascript
const md5 = require('jj.js').utils.md5;
const hash = md5('hello world');
// "5eb63bbbe01eeed093cb22bb8f5acdc3"
```

### 21.4 在控制器中使用

```javascript
class IndexController extends Controller {
    async index() {
        const time = this.$utils.date.format('YY-mm-dd HH:ii:ss');
        const hash = this.$utils.md5('test');
        this.$show({ time, hash });
    }
}
```

---

## 附录

### A. 类继承关系

```
Koa
 └── App                    # 应用主类

Proxy Class (Ctx)
 └── Context                # 上下文基类（持有 ctx 引用）
      ├── Middleware         # 中间件基类
      │    └── Controller   # 控制器基类
      ├── Model             # 模型基类
      ├── View              # 视图类
      ├── Request           # 请求类
      ├── Response          # 响应类
      ├── Db                # 数据库类
      ├── Upload            # 上传类
      ├── Cookie            # Cookie 类
      ├── Pagination        # 分页类
      └── Url               # URL 生成类

Cache                      # 缓存类（静态类）
Logger                     # 日志类（静态类）
loader                     # 自动加载器
```

### B. 框架导出模块

通过 `require('jj.js')` 可获取以下模块：

```javascript
const {
    App,          // 应用主类
    Controller,   // 控制器基类
    Model,        // 模型基类
    Middleware,    // 中间件基类
    View,         // 视图类
    Db,           // 数据库类
    Request,      // 请求类
    Response,     // 响应类
    Cache,        // 缓存类
    Cookie,       // Cookie 类
    Logger,       // 日志类
    Pagination,   // 分页类
    Upload,       // 上传类
    Url,          // URL 生成类
    Context,      // 上下文基类
    Ctx,          // 代理上下文类
    config,       // 配置对象
    loader,       // 自动加载器
    utils         // 工具函数
} = require('jj.js');
```

### C. 完整示例：Todo 应用

以下是一个完整的 Todo 应用示例：

**server.js**
```javascript
const { App, Logger } = require('jj.js');
const port = 3000;
const app = new App();
app.listen(port, () => {
    Logger.system(`Todo 应用已启动: http://localhost:${port}`);
});
```

**config/app.js**
```javascript
module.exports = {
    app_debug: true,
    static_dir: 'static',
    koa_body: {}
};
```

**config/db.js**
```javascript
const path = require('path');
module.exports = {
    default: {
        type: 'sqlite',
        database: path.join(__dirname, '../data/todo.db'),
        prefix: 'todo_'
    }
};
```

**app/controller/todo.js**
```javascript
const { Controller } = require('jj.js');

class TodoController extends Controller {
    async index() {
        const db = this.$db;
        await db.execute(`
            CREATE TABLE IF NOT EXISTS todo_todo (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT '',
                completed INTEGER NOT NULL DEFAULT 0,
                add_time INTEGER NOT NULL DEFAULT 0
            )
        `);
        const todos = await db.table('todo').order('id', 'desc').select();
        this.$assign('todos', todos);
        await this.$fetch('todo/index');
    }

    async add() {
        const title = this.$request.post('title');
        if (title) {
            await this.$db.table('todo').insert({
                title, completed: 0, add_time: Date.now()
            });
        }
        this.$redirect('/todo');
    }

    async toggle() {
        const id = this.$request.query('id');
        const completed = this.$request.query('completed', 0);
        await this.$db.table('todo')
            .where({ id })
            .update({ completed: completed ? 0 : 1 });
        this.$redirect('/todo');
    }

    async delete() {
        const id = this.$request.query('id');
        await this.$db.table('todo').where({ id }).delete();
        this.$redirect('/todo');
    }
}

module.exports = TodoController;
```

**app/view/todo/index.htm**
```html
<!DOCTYPE html>
<html>
<head><title>Todo List</title></head>
<body>
    <h3>Todo List</h3>
    <form action="/todo/add" method="post">
        <input type="text" name="title" placeholder="新增待办..." />
        <button type="submit">添加</button>
    </form>
    <ul>
        {{each todos item}}
        <li>
            <a href="/todo/toggle?id={{item.id}}&completed={{item.completed}}">
                {{if item.completed}}✅{{else}}⬜{{/if}}
            </a>
            {{item.title}}
            <a href="/todo/delete?id={{item.id}}">删除</a>
        </li>
        {{/each}}
    </ul>
</body>
</html>
```

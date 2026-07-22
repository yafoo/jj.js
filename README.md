# jj.js

![jj.js](./logo.png "jj.js")

> 一个超级简单轻量的 Node.js MVC 框架

## 📖 项目介绍

jj.js 是一个模仿 ThinkPHP5 设计的轻量级 Node.js MVC 框架。基于 Proxy 实现了**类库自动加载**、**懒加载**和 **Class 自动实例化及单例化**技术，所有类库想用就能直接调用，系统会自动导入，无需手动 require/import。

框架采用**单应用无限子级**架构，在 `app/` 目录下可自由创建任意层级的子模块（如 `app/admin/`、`app/api/`），每个子级拥有独立的 controller、model、middleware 等，子级自动向上继承父级类库。

### ✨ 核心特性

| 特性 | 说明 |
|------|------|
| 🏗️ **经典 MVC** | 模仿 ThinkPHP5，PHP 开发者友好，快速上手 |
| 🔄 **自动加载** | 系统类库、用户类库都支持自动加载、懒加载 |
| 🎯 **智能实例化** | Class 自动生成单实例，节省内存开销 |
| 🧩 **三级中间件** | 应用级、路由级、控制器级，方便插件及二次开发 |
| 🌳 **单应用多级模式** | 单应用架构，支持无限子级分层，模块化更清晰 |
| 📝 **完整类型提示** | 基于 JSDoc，自动生成应用端 types 类型文件 |

### 📍 项目地址

- **GitHub**：[https://github.com/yafoo/jj.js](https://github.com/yafoo/jj.js)
- **码云镜像**：[https://gitee.com/yafu/jj.js](https://gitee.com/yafu/jj.js)
- **官网**：[https://me.i-i.me/special/jj.html](https://me.i-i.me/special/jj.html)

---

## 🚀 快速开始

### 安装

```bash
npm i jj.js
```

> **运行环境要求**：Node.js >= 18

### Hello World

**1. 创建控制器** `./app/controller/index.js`

```javascript
const {Controller} = require('jj.js');

class Index extends Controller {
    async index() {
        this.$show('Hello jj.js, hello world!');
    }
}

module.exports = Index;
```

**2. 创建应用入口** `./server.js`

```javascript
const {App, Logger} = require('jj.js');
const app = new App();

app.listen(3000, '0.0.0.0', () => {
    Logger.info('HTTP server is ready on port 3000');
});
```

**3. 启动服务**

```bash
node server.js
```

**4. 访问测试**

浏览器打开 `http://127.0.0.1:3000`，页面输出：`Hello jj.js, hello world!`

> 💡 在线体验：[Stackblitz Hello World](https://stackblitz.com/edit/node-frhrfi?embed=1&file=app/controller/index.js)

---

## 📚 开发手册

### 应用目录结构

```
project/
├── app/                    # 应用目录（根级，不可改名）
│   ├── controller/         # 控制器目录（可改名）
│   │   └── index.js        # 首页控制器
│   ├── view/               # 模板目录（可改名）
│   │   └── index/          # index 控制器模板
│   │       └── index.htm   # 模板文件
│   ├── middleware/         # 中间件目录（可改名）
│   ├── model/              # 模型目录（可改名）
│   ├── pagination/         # 分页目录（可改名）
│   ├── logic/              # 逻辑目录（可改名）
│   ├── admin/              # 子级模块（示例）
│   │   ├── controller/     # 子级控制器
│   │   ├── model/          # 子级模型
│   │   ├── middleware/     # 子级中间件
│   │   └── view/           # 子级模板
│   ├── api/
│   │   └── controller/     # API 子级控制器
│   └── ...                 # 其他自定义目录或子级
├── config/                 # 配置目录（不可改名）
│   ├── app.js              # 应用配置
│   ├── db.js               # 数据库配置
│   ├── routes.js           # 路由配置
│   ├── view.js             # 模板配置
│   ├── cache.js            # 缓存配置
│   └── ...                 # 其他配置
├── public/                 # 静态资源目录（可改名）
│   └── static/             # CSS/JS/图片等
├── node_modules/           # Node.js 依赖
├── server.js               # 应用入口文件（必需，可改名）
├── types.js                # JSDOC类型文件（开发模式自动生成）
├── jsconfig.json           # 代码提示配置（没有，则编辑器不会提示）
└── package.json            # NPM 配置
```

#### 📁 目录说明

| 目录 | 必需 | 说明 |
|------|------|------|
| `config/` | ❌ | 应用配置目录，所有配置参数放在这里，可简化为 `config.js` |
| `app/` | ✅ | 应用根目录，支持无限子级分层（如 `app/admin/`、`app/api/`） |
| `public/` | ❌ | 静态资源目录，在 `config/app.js` 中通过 `static_dir` 配置 |
| `server.js` | ✅ | 应用入口文件，名字可任意修改 |

---

### 🏛️ 系统类库

```javascript
const {
    App,           // 应用类（继承 Koa）
    Controller,    // 控制器基类
    Db,            // 数据库类
    Model,         // 模型基类
    Pagination,    // 分页类
    View,          // 视图/模板类
    Logger,        // 日志类（静态类）
    Cookie,        // Cookie 操作类
    Response,      // 响应类
    Upload,        // 文件上传类
    Url,           // URL 生成类
    Middleware,    // 中间件基类
    Cache,         // 缓存类（静态类）
    Context,       // 上下文基类
    Request        // 请求类
} = require('jj.js');
```

#### 🌳 类库继承关系图

```
Ctx (Proxy 基类 - 核心自动加载机制)
│
└── Context (基础上下文类)
    │
    ├── Middleware (中间件基类)
    │   │
    │   └── Controller (控制器类)
    │       └── 用户自定义控制器
    │
    ├── Model (模型类)
    │   └── 用户自定义模型
    │
    ├── Db (数据库类)
    │   ├── Mysql (lib/db/mysql.js)
    │   ├── Sqlite (lib/db/sqlite.js)
    │   └── Mongodb (lib/db/mongodb.js)
    │
    ├── View (视图/模板类)
    ├── Response (响应类)
    ├── Request (请求类)
    ├── Url (URL 生成类)
    ├── Cookie (Cookie 操作类)
    ├── Upload (文件上传类)
    └── Pagination (分页类)

静态类（不需要继承）：
├── Logger (日志类)
└── Cache (缓存类)
```

> 💡 **开发建议**：继承系统类库后，可在类内使用 `$` 前缀属性实现自动加载功能。链式调用类方法时会自动实例化单例。

---

### 🔄 类库自动加载

> 类库自动加载、懒加载是整个框架的核心。

#### 示例 1：直接使用系统类库

**控制器** `./app/controller/index.js`：

```javascript
const {Controller} = require('jj.js');

class Index extends Controller {
    async index() {
        this.$show('Hello jj.js, hello world!');
    }

    async user() {
        // 直接使用 $db，框架自动加载并实例化
        const user_info = await this.$db.table('user').find({id: 1});
        this.$show(user_info);
    }
}

module.exports = Index;
```

**访问**：`http://127.0.0.1:3000/index/user`

#### 加载流程

```
this.$db
  ↓
1. 检查当前层级目录 ./app/[deep]/db.js 或 ./app/[deep]/db/
  ↓ (没有，向上遍历父级)
2. 检查父级目录 ./app/db.js 或 ./app/db/
  ↓ (没有)
3. 检查框架 lib/db.js ✅ 找到！
  ↓
自动实例化（单例）并返回 Db 实例
```

> **向上继承**：子级模块可以访问父级定义的同名类库，自动向上查找最近的定义。系统类库（如 `$db`、`$model` 等）在应用目录找不到时，自动回退到框架内置类库。

> **智能实例化**：调用 `this.$db.table('user')` 时，框架先检测是否有 `table` 静态方法，没有则自动 new 实例，然后调用实例方法。

#### 示例 2：子级模块

在 `app/` 下创建子级目录即可实现模块化分层，每个子级拥有独立的 controller、model、middleware 等：

```
app/
├── controller/index.js      # 根级控制器 → /index/index
├── model/user.js            # 根级模型
├── admin/
│   ├── controller/index.js  # 子级控制器 → /admin/index/index
│   └── model/admin.js       # 子级模型（可覆盖根级同名模型）
└── api/
    └── controller/index.js  # API 控制器 → /api/index/index
```

> **URL 规则**：URL 路径自动映射到子级，如 `/admin/index/index` 对应 `app/admin/controller/index.js` 的 `index` 方法。

#### 示例 3：使用自定义模型

**模型** `./app/model/user.js`：

```javascript
const {Model} = require('jj.js');

class User extends Model {
    async getUserInfo(condition) {
        return await this.db.find(condition);
    }
}

module.exports = User;
```

**控制器调用**：

```javascript
async user() {
    // 自动加载 ./app/model/user.js 并调用 getUserInfo 方法
    const user_info = await this.$model.user.getUserInfo({id: 1});
    this.$show(user_info);
}
```

> **注意**：模型内使用 `this.db`（无 `$` 前缀）是专属该模型的独立实例，避免多模型调用时混淆。

---

### ⚙️ Config 配置

应用配置可以是 `./config/` 目录，也可以简化为一个 `./config.js` 文件。只需设置需要修改的项，未设置的会继承框架默认配置。

#### App 配置 `./config/app.js`

```javascript
module.exports = {
    app_debug: false,              // 调试模式
    default_deep: '',              // 默认应用深度（子级路径），为空表示 app 根目录
    default_controller: 'index',   // 默认控制器
    default_action: 'index',       // 默认方法
    controller_folder: 'controller', // 控制器目录名
    middleware_folder: 'middleware', // 中间件目录名
    static_dir: '',                // 静态文件目录（为空关闭静态访问）
    koa_body: null                 // koa-body 配置（null 关闭）
};
```

#### 数据库配置 `./config/db.js`

```javascript
module.exports = {
    default: {
        type: 'sqlite',
        database: ':memory:',   // 数据库文件绝对路径，支持 :memory: 内存数据库
        prefix: 'jj_'
    },
    mysql: {
        type: 'mysql',
        host: '127.0.0.1',
        database: 'jj',
        user: 'root',
        password: '',
        port: '',
        charset: 'utf8mb4',
        prefix: 'jj_'
    },
    mongodb: {
        type: 'mongodb',
        host: '127.0.0.1',
        database: 'jj',
        port: 27017,
        prefix: 'jj_'
    }
};
```

#### 路由配置 `./config/routes.js`

基于 `@koa/router` 开发，支持 URL 匹配、路由命名、反向编译等功能。

```javascript
module.exports = [
    // 基本路由
    {url: '/', path: 'app/index/index2'},
    
    // 动态参数 + 路由命名
    {url: '/article/:id.html', path: 'app/article/article', name: 'article'},
    
    // 中间件类型
    {url: '/admin', path: 'app/admin/check', type: 'middleware'},
    
    // 模板直接输出
    {url: '/about', path: 'app/about/index', type: 'view'},
    
    // 直接路由到函数
    {url: '/hello', path: async (ctx, next) => {
        ctx.body = 'hello world!';
    }}
];
```

> **反向编译**：配置 `name` 后，可使用 `this.$url.build(':article', {id: 123})` 生成 `/article/123.html`

---

### 📝 编码命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 类名 | 大驼峰 | `UserController` |
| 方法名 | 小驼峰 | `getUserInfo()` |
| 私有方法 | 下划线前缀 | `_validateData()` |
| 控制器文件名 | 小写下划线 | `user_controller.js` |

---

## 🌟 应用案例

- **[Melog](https://me.i-i.me/special/melog.html)** - 基于 jj.js 的轻量博客系统

---

## 🔧 Nginx 代理配置

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

---

## 📄 License

[MIT](LICENSE)
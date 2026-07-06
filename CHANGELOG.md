# v*
1. 删除app配置app_multi
1. 删除app配置common_app
1. 变更app配置default_app为default_level
1. 新增app配置middleware_folder默认中间件目录
1. 内置函数toHump改为toCamelCase
1. 内置函数toLine改为toUnderScore
1. ctx.APP改为ctx.DEEP
1. ctx.FOLDER改为ctx.CONTROLLER_FOLDER
1. 应用根加载器名字由_改为$$
1. 更换默认数据库为：sqlite
1. 基类Ctx增加DEEP属性
1. 单、多应用改为单应用支持无限分级
1. loader函数空路径也会缓存
1. loader函数新增clearPathCache()方法
1. Request类新增ip()方法

# v0.20.0 / 2026-06-24

## 破坏性变更（Breaking Changes）

### Loader 类
1. **节点属性变更**：
   - `__node` 重命名为 `__NODE__`（大写）
   - 新增 `__ISCLASS__` 属性，用于判断节点是否为 Class 类型
   - 移除 `__node.isClass` 属性，改用 `__NODE__.type` 判断类型
   - `__node.nodeType` 重命名为 `__NODE__.type`
   - `type` 值由 `file`、`dir` 扩展为 `file`、`dir`、`json`、`class` 四种

2. **新增 JSON 文件加载支持**：
   - loader 现在支持自动加载 `.json` 文件
   - JSON 文件会被识别为 `json` 类型节点

3. **loader 函数参数变更**：
   - `dir` 参数改名为 `path`
   - 现在要求必须传入绝对路径
   - 不再自动计算相对路径

### App 类
4. **构造函数参数调整**：
   - 移除 `beforeUse` 参数
   - 新增 `options.middleware` 参数，支持传入中间件函数或中间件数组
   - 使用方式：`new App({ middleware: [middleware1, middleware2] })` 或 `new App(middleware)`

### Db 类
5. **SQL 语句获取方式变更**：
   - 查询方法（`select`/`find`/`value`/`count` 等）不再返回 SQL 字符串
   - 统一通过 `db.sql` 属性获取最后执行的 SQL 语句
   - 移除查询方法返回数据中的 string 类型

6. **缓存方法移除**：
   - 移除 `getCache()` 方法
   - 移除 `setCache()` 方法
   - 移除 `deleteCache()` 方法
   - 移除缓存自动清理功能（`Db.cache.setIntervalTime`）
   - 新增Db类实例属性`_$cache`给内部使用

7. **内部方法及属性变更**：
   - `_tableField` 由普通对象改为 `Map` 类型
   - 新增 `_$logger` 懒加载属性
   - 新增 `_$pagination` 懒加载属性
   - 新增 `setLogger()` 方法
   - 设置缓存时间由`cache(time)`改为`withCache(time)`
   - 分页查询方法由`pagination()`改为`paginate()`

### Router 模块
8. **路由执行方式变更**：
   - 移除 `run.js` 模块的直接引用
   - 路由不再直接调用 `run()` 函数
   - 新增 `ctx.FOLDER` 属性，用于指定控制器目录类型
   - 路由执行改为通过 `mvc` 中间件统一处理

### 文件结构变更
9. **run.js 重命名为 mvc.js**：
   - `lib/run.js` → `lib/mvc.js`
   - 函数名由 `run()` 改为 `mvc()`
   - 现在作为 Koa 中间件使用

## 功能优化

### 异常处理
10. **优化 Exception 日志输出**：
    - 异常堆栈信息分行输出，便于查看
    - 调试模式下显示完整错误信息
    - 非 Error 对象也会被正确转换为 Error 实例

### Ctx 类
11. **优化模块智能加载逻辑**：
    - 新增 `libs` 数组明确定义允许 `$` 访问的系统类库
    - 优化属性查找逻辑，使用 `__ISCLASS__` 标记判断 Class 类型
    - 新增 `ctx` 和 `$next` 属性的直接访问支持
    - 改进 Proxy 构造逻辑，支持 Class 实例化和属性访问

### Controller 类
12. **新增懒加载实例化机制**：
    - 新增 `_$view` 懒加载属性（View 实例）
    - 新增 `_$response` 懒加载属性（Response 实例）
    - 支持自定义注入（通过 setter 覆盖）

### Middleware 类
13. **新增懒加载实例化机制**：
    - 新增 `_$response` 懒加载属性（Response 实例）
    - `$show`/`$redirect`/`$success`/`$error` 方法改为调用 `_$response`

### Response 类
14. **新增懒加载实例化机制**：
    - 新增 `_$request` 懒加载属性（Request 实例）
    - 新增 `_$url` 懒加载属性（Url 实例）

### View 类
15. **优化模板路径解析**：
    - 新增 `toLine` 转换，确保路径使用下划线命名
    - 改进模板路径智能解析逻辑

### Logger 类
16. **优化日志处理**：
    - 新增 `static handle` 属性，默认使用配置的日志处理器
    - 优化 `setHandle()` 方法，增加类型检查
    - 移除初始化时的 `Logger.setHandle()` 调用

### Cache 类
17. **优化缓存逻辑**：
    - 默认全局共用缓存实例
    - 优化缓存自动清理机制

### Pagination 类
18. **优化分页逻辑**：
    - 新增 `options` 属性类型提示
    - 优化 URL 规则解析，增加空值判断
    - 改为使用 `_$url` 懒加载属性

### Model 类
19. **优化模型方法**：
    - `del()` 方法增加空条件检查，防止误删
    - `save()` 方法增加条件空值判断
    - 完善类型提示

### Cookie 类
20. **完善 Cookie 操作**：
    - 新增 `all()` 方法，获取所有 cookie
    - 新增 `clear()` 方法，清理所有 cookie
    - 新增 `keys()` 方法，获取所有 cookie key
    - 新增 `delete()` 方法，删除指定 cookie

### Types 生成器
21. **重构类型文件生成逻辑**：
    - 移除 `watch` 依赖，改用 Node.js 原生 `fs.watch`
    - 新增防抖机制（300ms）
    - 重构为 `TypesGenerator` 类
    - 优化文件扫描逻辑
    - 新增初始扫描功能

### 配置系统
22. **优化配置加载**：
    - 调试模式默认关闭（`app_debug: false`）
    - 新增 `jsconfig.json` 不存在时的警告提示
    - 类型文件生成改为监听模式（`watch()`）

### 其他优化
23. **新增路径安全验证**：
    - 新增 `lib/utils/validate.js` 工具
    - 验证应用、控制器、方法名字的合法性

24. **新增 MongoDB 支持**：
    - 新增 `lib/db/mongodb.js` 驱动，未测试

25. **测试代码路径调整**：
    - `test/` 目录重命名为 `tests/`
    - 新增多个测试文件

---

# v0.19.0 / 2025-12-11
1. 修改app.listen监听逻辑
2. 新增支持sqlite数据库
3. 新增test代码

# v0.18.0 / 2025-03-20
1. 升级依赖koa版本到v2.16.0
2. 修复模板路径解析bug

# v0.17.0 / 2024-09-19
1. 升级依赖，修复bug

# v0.16.0 / 2024-09-14
1. 修复v0.15.0升级依赖后bug

# v0.15.0 / 2024-09-14
1. 升级依赖
2. 优化日志输出
3. 优化路由请求

# v0.14.0 / 2024-03-07
1. 优化类型文件生成
2. 修复优化url生成
3. 自动加载功能，不缓存空文件
4. 修复优化Resquest类请求方法判断
5. 默认开启cookie签名机制

# v0.13.0 / 2024-02-27
1. 新增request系统类库
2. response类isAjax方法迁移到request类
3. 优化应用端types类型文件生成逻辑，启动服务时生成一次

# v0.12.0 / 2024-02-26
1. 添加依赖`watch`

# v0.11.0 / 2024-02-26
1. 基于`AsyncLocalStorage`重构核心类
2. 空控制器和空方法名改为`_empty`

# v0.10.0 / 2024-02-26
1. 类型文件位置调整及优化
2. 自动生成应用端类型文件（开启app_debug，并且根目录下存在jsconfig.json文件）
3. utils工具fs库方法优化，保留部分，其他方法建议使用fs.promises库
4. 系统级别调整，app类改为system，默认输出['system', 'error']级别的日志

# v0.9.0 / 2024-02-06
1. 支持jsdoc，完善vscode代码提示
2. 系统核心库app由对象改为class，使用const app = new App() 
3. 修复Logger类输出格式化bug，log函数参数调换
4. 系统日志配置，默认输出['app', 'error']级别的日志
5. 系统级屏蔽favicon.ico请求
6. 系统loader支持并优先加载文件
7. 依赖升级@koa/router v10.1.1 -> v12.0.1
8. 依赖升级koa v2.13.4 -> v2.15.0
9. node版本要求 >= v12.7.0

# v0.8.8 / 2022-09-07
1. 第一个tag
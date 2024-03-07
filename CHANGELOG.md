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
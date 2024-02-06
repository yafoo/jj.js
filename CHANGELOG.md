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
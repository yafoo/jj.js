const path = require('path');

module.exports = {
    default: {
        type      : 'mysql', // 数据库类型
        host      : '127.0.0.1', // 服务器地址
        database  : 'test', // 数据库名
        user      : 'root', // 数据库用户名
        password  : 'root', // 数据库密码
        port      : '3306', // 数据库连接端口
        charset   : 'utf8mb4', // 数据库编码默认采用utf8
        prefix    : 'jj_' // 数据库表前缀
    },
    sqlite: {
        type      : 'sqlite', // 数据库类型
        database  : path.join(__dirname, '../test.db'), // 数据库名
        charset   : 'utf8mb4', // 数据库编码默认采用utf8
        prefix    : 'jj_' // 数据库表前缀
    }
};
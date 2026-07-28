const path = require('path');
const fs = require('fs');


const dataDir = path.join(__dirname, '../data');
if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

module.exports = {
    default: {
        type      : 'sqlite', // 数据库类型
        database  : ':memory:', // 数据库名
        charset   : 'utf8mb4', // 数据库编码默认采用utf8
        prefix    : 'jj_' // 数据库表前缀
    },
    sqlite: {
        type      : 'sqlite', // 数据库类型
        database  : path.join(dataDir, 'todo.db'), // 数据库名
        charset   : 'utf8mb4', // 数据库编码默认采用utf8
        prefix    : 'jj_' // 数据库表前缀
    }
};
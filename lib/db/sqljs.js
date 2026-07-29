const path = require('path');
const fs = require('fs');
const Sql = require('./sql');

/**
 * @typedef {import('../../types').DbConfigItem} DbConfigItem
 * @typedef {import('../../types').FieldInfo} FieldInfo
 */

//数据库连接
/**
 * @type {Map<any, import('sql.js').Database>}
 */
const connections = new Map();
//数据库文件路径（非内存数据库）
/**
 * @type {Map<any, string>}
 */
const dbPaths = new Map();
//事务连接
const trans = new Map();
//事务嵌套
const nest = new Map();
//SQL.js初始化缓存（避免重复加载WASM）
let _SQL = null;

/**
 * 保存所有数据库连接到文件（进程退出时调用）
 */
function saveAll() {
    for(const [config, dbPath] of dbPaths) {
        const conn = connections.get(config);
        if(!conn) continue;
        try {
            const data = conn.export();
            fs.writeFileSync(dbPath, data);
        } catch(e) {
            // 进程退出时静默失败
        }
    }
}

// 进程退出时保存所有数据库
process.on('exit', saveAll);
process.on('SIGINT', () => { saveAll(); process.exit(); });
process.on('uncaughtException', (err) => { saveAll(); throw err; });

/**
 * @extends Sql
 */
class Sqljs extends Sql
{
    /**
     * 初始化SQL.js引擎（加载WASM）
     * @private
     * @returns {Promise<import('sql.js').SqlJsStatic>}
     */
    async _initSqlJs() {
        if(_SQL) return _SQL;
        const initSqlJs = require('sql.js');
        const wasmPath = path.join(
            path.dirname(require.resolve('sql.js/dist/sql-wasm.js')),
            'sql-wasm.wasm'
        );
        const wasmBinary = new Uint8Array(fs.readFileSync(wasmPath));
        // @ts-ignore
        _SQL = await initSqlJs({ wasmBinary });
        return _SQL;
    }

    /**
     * 将数据库导出保存到文件（仅非内存数据库）
     * @private
     * @returns {void}
     */
    _save() {
        const dbPath = dbPaths.get(this._config);
        if(!dbPath) return;
        const conn = connections.get(this._config);
        if(!conn) return;
        try {
            const data = conn.export();
            fs.writeFileSync(dbPath, data);
        } catch(e) {
            const message = 'SQLJS数据库保存失败：' + e.message;
            this.logger.sql(message);
            this.logger.error(message);
        }
    }

    /**
     * 连接数据库
     * @public
     * @param {DbConfigItem} config - 数据库配置标识或连接参数
     * @returns {Promise<this>}
     */
    async connect(config) {
        this._config = config;

        let connection = connections.get(this._config);
        if(!connection) {
            const SQL = await this._initSqlJs();

            const database = config.database || ':memory:';
            if(database === ':memory:') {
                connection = new SQL.Database();
            } else {
                // 确保数据库文件所在目录存在
                const dbDir = path.dirname(database);
                if(!fs.existsSync(dbDir)) {
                    fs.mkdirSync(dbDir, {recursive: true});
                }
                // 尝试从文件系统加载已有数据库
                try {
                    if(fs.existsSync(database)) {
                        const buffer = fs.readFileSync(database);
                        connection = new SQL.Database(buffer);
                    } else {
                        connection = new SQL.Database();
                    }
                    dbPaths.set(this._config, database);
                } catch(e) {
                    // 加载失败，创建内存数据库
                    connection = new SQL.Database();
                }
            }

            // 性能优化：启用WAL模式（sql.js 中可能不支持，忽略错误）
            try { connection.run('PRAGMA journal_mode = WAL;'); } catch(e) {}

            // 性能优化：配合WAL模式，减少不必要的磁盘同步
            try { connection.run('PRAGMA synchronous = NORMAL;'); } catch(e) {}

            // 性能优化：设置锁等待超时时间
            try { connection.run('PRAGMA busy_timeout = 5000;'); } catch(e) {}

            connections.set(this._config, connection);
            this.logger.sql(`SQLJS数据库连接创建成功：{all: ${connections.size}}`);
        }

        return this;
    }

    /**
     * 关闭数据库连接
     * @public
     * @returns {Promise<this>}
     */
    async close() {
        if(connections.has(this._config)) {
            const connection = connections.get(this._config);
            try {
                // 关闭前保存数据库到文件
                this._save();
                connection.close();
            } catch(e) {
                const message = 'SQLJS数据库连接关闭失败：' + e.message;
                this.logger.sql(message);
                this.logger.error(message);
            }
            connections.delete(this._config);
            dbPaths.delete(this._config);
            this.logger.sql(`SQLJS数据库连接关闭成功：{connectionTotal: ${connections.size}}`);
        }
        return this;
    }

    /**
     * 获取数据库连接
     * @private
     * @returns {import('sql.js').Database}
     */
    _getConnect() {
        return trans.get(this.ctx) || connections.get(this._config);
    }

    /**
     * 开启事务
     * @public
     * @param {function} fun
     * @returns {Promise<string>}
     */
    async startTrans(fun) {
        const conn = this._getConnect();
        trans.set(this.ctx, conn);
        let trans_nest = nest.get(conn) || 0;
        nest.set(conn, ++trans_nest);
        if(trans_nest > 1) {
            const message = `开启事务成功：{nest:${trans_nest}}`;
            this.logger.sql(message);
            if(typeof fun === 'function') {
                try {
                    await fun();
                    await this.commit();
                } catch(e) {
                    await this.rollback();
                    throw e;
                }
            }
            return message;
        }

        try {
            conn.run('BEGIN TRANSACTION;');
            const message = '开启事务成功！';
            this.logger.sql(message);
            if(typeof fun === 'function') {
                try {
                    await fun();
                    await this.commit();
                    return '事务执行成功！';
                } catch(e) {
                    await this.rollback();
                    throw e;
                }
            }
            return message;
        } catch(err) {
            const message = '开启事务失败：' + err.message;
            this.logger.sql(message);
            this.logger.error(message);
            throw new Error('DbError: ' + message);
        }
    }

    /**
     * 事务回滚
     * @public
     * @returns {Promise<string>}
     */
    async rollback() {
        const conn = this._getConnect();
        const trans_nest = nest.get(conn) || 0;
        if(trans_nest > 1) {
            nest.set(conn, trans_nest - 1);
            const message = `事务回滚成功：{nest:${trans_nest}}`;
            this.logger.sql(message);
            return message;
        } else {
            nest.delete(conn);
        }

        try {
            conn.run('ROLLBACK;');
            trans.delete(this.ctx);
            const message = '事务回滚成功！';
            this.logger.sql(message);
            return message;
        } catch(err) {
            throw new Error('DbError: ' + err.message);
        }
    }

    /**
     * 提交事务
     * @public
     * @returns {Promise<string>}
     */
    async commit() {
        const conn = this._getConnect();
        const trans_nest = nest.get(conn) || 0;
        if(trans_nest > 1) {
            nest.set(conn, trans_nest - 1);
            const message = `事务提交成功：{nest:${trans_nest}}`;
            this.logger.sql(message);
            return message;
        } else {
            nest.delete(conn);
        }

        try {
            conn.run('COMMIT;');
            trans.delete(this.ctx);
            const message = '事务提交成功！';
            this.logger.sql(message);
            return message;
        } catch(err) {
            const message = '事务提交失败：' + err.message;
            this.logger.sql(message);
            this.logger.error(message);
            this.rollback();
            throw new Error('DbError: ' + message);
        }
    }

    /**
     * 执行sql查询
     * @public
     * @param {string} sql - sql语句或参数
     * @param {*} [params] - sql参数
     * @returns {Promise<*>}
     */
    async query(sql, params) {
        params || (params = []);
        const conn = this._getConnect();

        try {
            const isSelect = /^\s*select /i.test(sql);
            const isTableInfo = /^\s*PRAGMA table_info/i.test(sql);

            if(isSelect || isTableInfo) {
                const stmt = conn.prepare(sql);
                stmt.bind(params);
                const rows = [];
                while(stmt.step()) {
                    rows.push(stmt.getAsObject());
                }
                stmt.free();
                this.logger.sql('数据操作成功，SQL：' + this.format(sql, params));
                return rows;
            } else {
                conn.run(sql, params);
                const changes = conn.getRowsModified();
                // 获取最后插入ID
                let insertId = 0;
                try {
                    const stmt = conn.prepare('SELECT last_insert_rowid() as id');
                    if(stmt.step()) {
                        insertId = /** @type {number} */ (stmt.getAsObject().id);
                    }
                    stmt.free();
                } catch(e) {}

                this.logger.sql('数据操作成功，SQL：' + this.format(sql, params));
                return {
                    affectedRows: changes,
                    insertId: insertId
                };
            }
        } catch(err) {
            const message = '数据操作失败，' + err.message + "\nSQL：" + this.format(sql, params);
            this.logger.sql(message);
            this.logger.error(message);
            throw new Error('DbError: ' + message);
        }
    }

    /**
     * 序列化sql语句
     * @public
     * @param {string} sql - sql语句或参数
     * @param {*} params - sql参数
     * @returns {string}
     */
    format(sql, params) {
        params || (params = []);

        let formatted = sql;
        for(let i = 0; i < params.length; i++) {
            let value = params[i];
            if (typeof value === 'string') {
                value = "'" + value.replace(/'/g, "''") + "'";
            } else if (value === null) {
                value = 'NULL';
            }
            formatted = formatted.replace(/\?/, value);
        }
        return formatted;
    }

    /**
     * 获取数据表信息
     * @public
     * @param {string} tableName - 表名字
     * @returns {Promise<FieldInfo[]>}
     */
    async tableInfo(tableName) {
        const columns = await this.query(`PRAGMA table_info(${tableName})`);
        // @ts-ignore
        return columns.map(col => {
            return {
                Field: col.name,
                Type: col.type,
                Null: col.notnull === 1 ? 'NO' : 'YES',
                Key: col.pk === 1 ? 'PRI' : '',
                Default: col.dflt_value,
                Extra: col.pk === 1 ? 'auto_increment' : '',
            };
        });
    }
}

module.exports = Sqljs;

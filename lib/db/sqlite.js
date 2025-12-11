const {app: cfg_app} = require('../config');
const Sql = require('./sql');

/**
 * @typedef {import('sqlite3').Database} Database
 * @typedef {import('../../types').FieldInfo} FieldInfo
 * @typedef {Map<any, Database>} ConnectionMap
 */

//数据库连接
/**
 * @type {ConnectionMap}
 */
const connections = new Map();
//事务连接
const trans = new Map();
//事务嵌套
const nest = new Map();

/**
 * @extends Sql
 */
class Sqlite extends Sql
{
    /**
     * 连接数据库
     * @public
     * @param {object} config - 数据库配置标识或连接参数
     * @returns {Promise<this>}
     */
    async connect(config={}) {
        this._config = config;

        let connection = connections.get(this._config);
        if(!connection) {
            const sqlite3 = cfg_app.app_debug ? require('sqlite3').verbose() : require('sqlite3');
            connection = new sqlite3.Database(this._config.database);
            connections.set(this._config, connection);
            this.$logger.sql(`SQLITE数据库连接创建成功：{all: ${connections.size}}`);
        }
        
        return this;
    }

    /**
     * 关闭数据库连接
     * @public
     * @returns {Promise}
     */
    async close() {
        return new Promise((resolve, reject) => {
            if(connections.has(this._config)) {
                const connection = connections.get(this._config);
                connection.close(err => {
                    if(err) {
                        const message = 'SQLITE数据库连接关闭失败：' + err.message;
                        this.$logger.sql(message);
                        this.$logger.error(message);
                        reject(new Error('DbError: ' + message));
                    } else {
                        connections.delete(this._config);
                        this.$logger.sql(`SQLITE数据库连接关闭成功：{connectionTotal: ${connections.size}}`);
                        resolve(this);
                    }
                });
            } else {
                resolve(this);
            }
        });
    }

    /**
     * 获取数据库连接
     * @private
     * @returns {Promise<Database>}
     */
    async _getConnect() {
        return trans.get(this.ctx) || connections.get(this._config);
    }

    /**
     * 开启事务
     * @public
     * @param {function} fun
     * @returns {Promise<string>}
     */
    async startTrans(fun) {
        const conn = await this._getConnect();
        trans.set(this.ctx, conn);
        let trans_nest = nest.get(conn) || 0;
        nest.set(conn, ++trans_nest);
        if(trans_nest > 1) {
            const message = `开启事务成功：{nest:${trans_nest}}`;
            this.$logger.sql(message);
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

        return new Promise((resolve, reject) => {
            conn.run('BEGIN TRANSACTION;', async err => {
                if(err) {
                    const message = '开启事务失败：' + err.message;
                    this.$logger.sql(message);
                    this.$logger.error(message);
                    reject(new Error('DbError: ' + message));
                } else {
                    const message = '开启事务成功！';
                    this.$logger.sql(message);
                    if(typeof fun === 'function') {
                        try {
                            await fun();
                            await this.commit();
                            resolve('事务执行成功！');
                        } catch(e) {
                            await this.rollback();
                            reject(e);
                        }
                    }
                    resolve(message);
                }
            });
        });
    }

    /**
     * 事务回滚
     * @public
     * @returns {Promise<string>}
     */
    async rollback() {
        const conn = await this._getConnect();
        const trans_nest = nest.get(conn) || 0;
        if(trans_nest > 1) {
            nest.set(conn, trans_nest - 1);
            const message = `事务回滚成功：{nest:${trans_nest}}`;
            this.$logger.sql(message);
            return message;
        } else {
            nest.delete(conn);
        }

        return new Promise((resolve, reject) => {
            conn.run('ROLLBACK;', err => {
                if(err) {
                    reject(new Error('DbError: ' + err.message));
                } else {
                    trans.delete(this.ctx);
                    const message = '事务回滚成功！';
                    this.$logger.sql(message);
                    resolve(message);
                }
            });
        });
    }

    /**
     * 提交事务
     * @public
     * @returns {Promise<string>}
     */
    async commit() {
        const conn = await this._getConnect();
        const trans_nest = nest.get(conn) || 0;
        if(trans_nest > 1) {
            nest.set(conn, trans_nest - 1);
            const message = `事务提交成功：{nest:${trans_nest}}`;
            this.$logger.sql(message);
            return message;
        } else {
            nest.delete(conn);
        }

        return new Promise((resolve, reject) => {
            conn.run('COMMIT;', err => {
                if(err) {
                    const message = '事务提交失败：' + err.message;
                    this.$logger.sql(message);
                    this.$logger.error(message);
                    this.rollback();
                    reject(new Error('DbError: ' + message));
                } else {
                    trans.delete(this.ctx);
                    const message = '事务提交成功！';
                    this.$logger.sql(message);
                    resolve(message);
                }
            });
        });
    }

    /**
     * 执行sql查询
     * @public
     * @param {string} sql - sql语句或参数
     * @param {*} params - sql参数
     * @returns {Promise}
     */
    async query(sql, params) {
        params || (params = []);
        const conn = await this._getConnect();

        return new Promise((resolve, reject) => {
            // 判断是SELECT查询还是其他操作
            const isSelect = /^\s*select /i.test(sql);
            const isTableInfo = /^\s*PRAGMA table_info/i.test(sql);

            const that = this;
            conn[isSelect || isTableInfo ? 'all' : 'run'](sql, params, function(err, rows) {
                if(err) {
                    const message = '数据操作失败，' + err.message + "\nSQL：" + that.format(sql, params);
                    that.$logger.sql(message);
                    that.$logger.error(message);
                    reject(new Error('DbError: ' + message));
                } else {
                    that.$logger.sql('数据操作成功，SQL：' + that.format(sql, params));
                    if(isSelect || isTableInfo) {
                        resolve(rows);
                    } else {
                        resolve({
                            affectedRows: this.changes,
                            insertId: this.lastID
                        });
                    }
                }
                if(!trans.has(that.ctx)) {
                    // SQLite不需要显式释放连接
                }
            });
        });
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

module.exports = Sqlite;
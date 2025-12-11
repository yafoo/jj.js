const Sql = require('./sql');

/**
 * @typedef {import('../../types').Pool} Pool
 * @typedef {import('../../types').PoolConfig} PoolConfig
 * @typedef {import('../../types').PoolConnection} PoolConnection
 * @typedef {import('../../types').FieldInfo} FieldInfo
 * @typedef {Map<any, Pool>} PoolMap
 */

//连接池
/**
 * @type {PoolMap}
 */
const pool = new Map();
//事务连接
const trans = new Map();
//事务嵌套
const nest = new Map();

/**
 * @extends Sql
 */
class Mysql extends Sql
{
    /**
     * 连接数据库连接池
     * @public
     * @param {PoolConfig} config - 数据库配置标识或连接参数
     * @returns {Promise<this>}
}
     */
    async connect(config={}) {
        this._config = config;

        if(!pool.has(this._config)) {
            const cur_pool = require('mysql').createPool(this._config);
            pool.set(this._config, cur_pool);
            this.$logger.sql(`MYSQL连接池创建成功：{all: ${pool.size}}`);
        }
        
        return this;
    }

    /**
     * 关闭数据库连接池
     * @public
     * @returns {Promise}
     */
    async close() {
        return new Promise((resolve, reject) => {
            if(pool.has(this._config)) {
                pool.get(this._config).end(err => {
                    if(err) {
                        const message = 'MYSQL连接池销毁失败：' + err.message;
                        this.$logger.sql(message);
                        this.$logger.error(message);
                        reject(new Error('DbError: ' + message));
                    } else {
                        pool.delete(this._config);
                        this.$logger.sql(`MYSQL连接池销毁成功：{poolTotal: ${pool.size}}`);
                        resolve(this);
                    }
                });
            } else {
                resolve(this);
            }
        });
    }

    /**
     * 释放数据库连接
     * @public
     * @param {PoolConnection} conn - 数据库连接
     */
    release(conn) {
        try {
            conn.release();
            this.$logger.sql('释放数据库连接！');
        } catch(e) {
            const message = '释放数据库出错：' + e.message;
            this.$logger.sql(message);
            this.$logger.error(message);
        }
    }

    /**
     * 获取数据库连接
     * @private
     * @param {Pool} p 
     * @returns {Promise<PoolConnection>}
     */
    async _creatConnect(p) {
        return new Promise((resolve, reject) => {
            p.getConnection((err, connection) => {
                if(err) {
                    const message = '获取数据库连接失败：' + err.message;
                    this.$logger.sql(message);
                    this.$logger.error(message);
                    reject(new Error('DbError: ' + message));
                } else {
                    this.$logger.sql(`获取数据库连接：{limit: ${p.config.connectionLimit}, all: ${p._allConnections.length}, acquiring: ${p._acquiringConnections.length}, free: ${p._freeConnections.length}, queue: ${p._connectionQueue.length}}`);
                    resolve(connection);
                }
            });
        });
    }

    /**
     * 获取数据库连接
     * @private
     * @returns {Promise<PoolConnection>}
     */
    async _getConnect() {
        return trans.get(this.ctx) || await this._creatConnect(pool.get(this._config));
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
            conn.beginTransaction(async err => {
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
            conn.rollback(err => {
                if(err) {
                    reject(new Error('DbError: ' + err.message));
                } else {
                    trans.delete(this.ctx);
                    const message = '事务回滚成功！';
                    this.$logger.sql(message);
                    this.release(conn);
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
            conn.commit(err => {
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
                    this.release(conn);
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
            conn.query(sql, params, (err, data) => {
                if(err) {
                    const message = '数据操作失败，' + err.message + "\nSQL：" + this.format(sql, params);
                    this.$logger.sql(message);
                    this.$logger.error(message);
                    reject(new Error('DbError: ' + message));
                } else {
                    this.$logger.sql('数据操作成功，SQL：' + this.format(sql, params));
                    resolve(data);
                }
                if(!trans.has(this.ctx)) {
                    this.release(conn);
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
        return require('mysql').format(sql, params);
    }

    /**
     * 获取数据表信息
     * @public
     * @param {string} tableName - 表名字
     * @returns {Promise<FieldInfo[]>}
     */
    async tableInfo(tableName) {
        return await this.query(`show columns from ?`, [tableName]);
    }
}

module.exports = Mysql;
//连接池
const pool = new Map();
//事务连接
const trans = new Map();
//事务嵌套
const nest = new Map();

class Sqlite
{
    constructor(ctx, options) {
        this._ctx = ctx || {};
        this._config = options;
        this._SQL = null;
    }

    connect(options) {
        if(options) {
            this._config = options
        }
        let cur_pool = pool.get(this._config);
        if(!cur_pool) {
            if(!this._SQL) {
                this._SQL = require('sqlite3');
            }
            cur_pool = new this._SQL.Database(this._config.datafile);
            pool.set(this._config, cur_pool);
            this.$logger.sql(`打开数据库成功：{total: ${pool.size}}`);
        }
        
        return this;
    }

    async close() {
        return new Promise((resolve, reject) => {
            pool.has(this._config) && pool.get(this._config).close(err => {
                if(err) {
                    const message = '关闭数据库失败：' + err.message;
                    this.$logger.sql(message);
                    this.$logger.error(message);
                    reject(new Error('DbError: ' + message));
                } else {
                    pool.delete(this._config);
                    this.$logger.sql(`关闭数据库成功：{total: ${pool.size}}`);
                    resolve(this);
                }
            });
        });
    }

    async _getConnect() {
        return trans.get(this._ctx) || pool.get(this._config);
    }

    async startTrans(fun) {
        const conn = await this._getConnect();
        trans.set(this._ctx, conn);
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
            conn.beginTransaction(async (err) => {
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

        return new Promise((resolve) => {
            conn.rollback(() => {
                trans.delete(this._ctx);
                const message = '事务回滚成功！';
                this.$logger.sql(message);
                this.release(conn);
                resolve(message);
            });
        });
    }

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
            conn.commit((err) => {
                if(err) {
                    const message = '事务提交失败：' + err.message;
                    this.$logger.sql(message);
                    this.$logger.error(message);
                    this.rollback();
                    reject(new Error('DbError: ' + message));
                } else {
                    trans.delete(this._ctx);
                    const message = '事务提交成功！';
                    this.$logger.sql(message);
                    this.release(conn);
                    resolve(message);
                }
            });
        });
    }

    async query(sql, params, reset=true) {
        params !== false && reset !== false && this.reset();
        params || (params = []);
        
        const conn = await this._getConnect();

        return new Promise((resolve, reject) => {
            conn.run(sql, params, (err, data) => {
                if(err) {
                    const message = '数据操作失败，' + err.message + "\r\nSQL：" + this.format(sql, params);
                    this.$logger.sql(message);
                    this.$logger.error(message);
                    reject(new Error('DbError: ' + message));
                } else {
                    this.$logger.sql('数据操作成功，SQL：' + this.format(sql, params));
                    resolve(data);
                }
                if(!trans.has(this._ctx)) {
                    this.release(conn);
                }
            });
        });
    }

    format(sql, params) {
        params || (params = []);
        return this._SQL.prepare(sql, params);
    }

}

module.exports = Sqlite;
/**
 * @typedef {import('../../types').Logger} Logger
 * @typedef {import('../../types').FieldInfo} FieldInfo
 */

class Sql
{
    /**
     * @public
     * @param {object} ctx
     * @param {Logger} logger
     */
    constructor(ctx, logger) {
        this.ctx = ctx;
        this.$logger = logger;
    }

    /**
     * 连接数据库
     * @public
     * @param {object} config - 数据库连接参数
     * @returns {Promise<this>}
     */
    async connect(config={}) {
        return this;
    }

    /**
     * 关闭数据库
     * @public
     * @returns {Promise<this>}
     */
    async close() {
        return this;
    }

    /**
     * 释放数据库连接
     * @public
     * @param {object} conn - 数据库连接
     */
    release(conn) {
    }

    /**
     * 开启事务
     * @public
     * @param {function} [fun] 
     * @returns {Promise<string>}
     */
    async startTrans(fun) {
        return '开启事务成功';
    }

    /**
     * 事务回滚
     * @public
     * @returns {Promise<string>}
     */
    async rollback() {
        return '事务回滚成功';
    }

    /**
     * 提交事务
     * @public
     * @returns {Promise<string>}
     */
    async commit() {
        return '事务提交成功';
    }

    /**
     * 执行sql查询
     * @public
     * @param {string} sql - sql语句或参数
     * @param {*} params - sql参数
     * @returns {Promise}
     */
    async query(sql, params) {
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
        return `${sql} ${params.map(item => item.join('=')).join(', ')}`;
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

module.exports = Sql;
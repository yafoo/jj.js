const Sql = require('./sql');

/**
 * @typedef {import('mongodb').MongoClient} MongoClient
 * @typedef {import('mongodb').Db} Db
 * @typedef {import('mongodb').Collection} Collection
 * @typedef {import('mongodb').ObjectId} ObjectId
 * @typedef {import('../../types').FieldInfo} FieldInfo
 * @typedef {Map<any, MongoClient>} ClientMap
 */

//数据库连接
/**
 * @type {ClientMap}
 */
const clients = new Map();
//事务连接
const trans = new Map();
//事务嵌套
const nest = new Map();

/**
 * @extends Sql
 */
class Mongodb extends Sql
{
    /**
     * 连接数据库
     * @public
     * @param {object} config - 数据库配置标识或连接参数
     * @returns {Promise<this>}
     */
    async connect(config={}) {
        this._config = config;

        let client = clients.get(this._config);
        if(!client) {
            const { MongoClient } = require('mongodb');
            const url = `mongodb://${config.user}:${config.password}@${config.host}:${config.port || 27017}`;
            client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
            await client.connect();
            clients.set(this._config, client);
            this.$logger.sql(`MONGODB数据库连接创建成功：{all: ${clients.size}}`);
        }
        
        this._db = client.db(config.database);
        return this;
    }

    /**
     * 关闭数据库连接
     * @public
     * @returns {Promise}
     */
    async close() {
        return new Promise((resolve, reject) => {
            if(clients.has(this._config)) {
                const client = clients.get(this._config);
                client.close().then(() => {
                    clients.delete(this._config);
                    this.$logger.sql(`MONGODB数据库连接关闭成功：{connectionTotal: ${clients.size}}`);
                    resolve(this);
                }).catch(err => {
                    const message = 'MONGODB数据库连接关闭失败：' + err.message;
                    this.$logger.sql(message);
                    this.$logger.error(message);
                    reject(new Error('DbError: ' + message));
                });
            } else {
                resolve(this);
            }
        });
    }

    /**
     * 获取数据库连接
     * @private
     * @returns {Promise<Db>}
     */
    async _getConnect() {
        return trans.get(this.ctx) || this._db;
    }

    /**
     * 获取集合
     * @private
     * @param {string} collectionName - 集合名称
     * @returns {Promise<Collection>}
     */
    async _getCollection(collectionName) {
        const db = await this._getConnect();
        return db.collection(collectionName);
    }

    /**
     * 开启事务
     * @public
     * @param {function} fun
     * @returns {Promise<string>}
     */
    async startTrans(fun) {
        const db = await this._getConnect();
        trans.set(this.ctx, db);
        let trans_nest = nest.get(db) || 0;
        nest.set(db, ++trans_nest);
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
            db.startSession().then(session => {
                session.startTransaction();
                trans.set(this.ctx, db);
                this._session = session;
                const message = '开启事务成功！';
                this.$logger.sql(message);
                if(typeof fun === 'function') {
                    try {
                        fun().then(async () => {
                            await this.commit();
                            resolve('事务执行成功！');
                        }).catch(async (e) => {
                            await this.rollback();
                            reject(e);
                        });
                    } catch(e) {
                        this.rollback();
                        reject(e);
                    }
                } else {
                    resolve(message);
                }
            }).catch(err => {
                const message = '开启事务失败：' + err.message;
                this.$logger.sql(message);
                this.$logger.error(message);
                reject(new Error('DbError: ' + message));
            });
        });
    }

    /**
     * 事务回滚
     * @public
     * @returns {Promise<string>}
     */
    async rollback() {
        const db = await this._getConnect();
        const trans_nest = nest.get(db) || 0;
        if(trans_nest > 1) {
            nest.set(db, trans_nest - 1);
            const message = `事务回滚成功：{nest:${trans_nest}}`;
            this.$logger.sql(message);
            return message;
        } else {
            nest.delete(db);
        }

        return new Promise((resolve, reject) => {
            if(this._session) {
                this._session.abortTransaction().then(() => {
                    this._session.endSession();
                    trans.delete(this.ctx);
                    this._session = null;
                    const message = '事务回滚成功！';
                    this.$logger.sql(message);
                    resolve(message);
                }).catch(err => {
                    reject(new Error('DbError: ' + err.message));
                });
            } else {
                trans.delete(this.ctx);
                const message = '事务回滚成功！';
                this.$logger.sql(message);
                resolve(message);
            }
        });
    }

    /**
     * 提交事务
     * @public
     * @returns {Promise<string>}
     */
    async commit() {
        const db = await this._getConnect();
        const trans_nest = nest.get(db) || 0;
        if(trans_nest > 1) {
            nest.set(db, trans_nest - 1);
            const message = `事务提交成功：{nest:${trans_nest}}`;
            this.$logger.sql(message);
            return message;
        } else {
            nest.delete(db);
        }

        return new Promise((resolve, reject) => {
            if(this._session) {
                this._session.commitTransaction().then(() => {
                    this._session.endSession();
                    trans.delete(this.ctx);
                    this._session = null;
                    const message = '事务提交成功！';
                    this.$logger.sql(message);
                    resolve(message);
                }).catch(err => {
                    const message = '事务提交失败：' + err.message;
                    this.$logger.sql(message);
                    this.$logger.error(message);
                    this.rollback();
                    reject(new Error('DbError: ' + message));
                });
            } else {
                trans.delete(this.ctx);
                const message = '事务提交成功！';
                this.$logger.sql(message);
                resolve(message);
            }
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
        
        // MongoDB不支持SQL语句，这里需要解析SQL语句并转换为MongoDB操作
        // 由于SQL语句的复杂性，这里只实现基本的SELECT、INSERT、UPDATE、DELETE操作
        const sqlLower = sql.toLowerCase();
        
        // 解析表名
        let collectionName = '';
        const tableMatch = sql.match(/from\s+([\w_]+)/i);
        if(tableMatch) {
            collectionName = tableMatch[1];
        } else {
            const insertMatch = sql.match(/insert\s+into\s+([\w_]+)/i);
            if(insertMatch) {
                collectionName = insertMatch[1];
            } else {
                const updateMatch = sql.match(/update\s+([\w_]+)/i);
                if(updateMatch) {
                    collectionName = updateMatch[1];
                } else {
                    const deleteMatch = sql.match(/delete\s+from\s+([\w_]+)/i);
                    if(deleteMatch) {
                        collectionName = deleteMatch[1];
                    }
                }
            }
        }
        
        // 移除表前缀
        if(this._config.prefix) {
            collectionName = collectionName.replace(this._config.prefix, '');
        }
        
        const collection = await this._getCollection(collectionName);
        
        // 处理SELECT查询
        if(sqlLower.startsWith('select')) {
            return await this._handleSelect(sql, params, collection);
        }
        // 处理INSERT操作
        else if(sqlLower.startsWith('insert')) {
            return await this._handleInsert(sql, params, collection);
        }
        // 处理UPDATE操作
        else if(sqlLower.startsWith('update')) {
            return await this._handleUpdate(sql, params, collection);
        }
        // 处理DELETE操作
        else if(sqlLower.startsWith('delete')) {
            return await this._handleDelete(sql, params, collection);
        }
        // 处理其他操作
        else {
            const message = 'MongoDB不支持的SQL操作：' + sql;
            this.$logger.sql(message);
            this.$logger.error(message);
            throw new Error('DbError: ' + message);
        }
    }

    /**
     * 处理SELECT查询
     * @private
     * @param {string} sql - sql语句
     * @param {*} params - sql参数
     * @param {Collection} collection - 集合
     * @returns {Promise<Array>}
     */
    async _handleSelect(sql, params, collection) {
        // 解析查询字段
        const fieldMatch = sql.match(/select\s+([\s\S]+?)\s+from/i);
        let fields = {};
        if(fieldMatch) {
            const fieldStr = fieldMatch[1];
            if(fieldStr !== '*') {
                fieldStr.split(',').forEach(field => {
                    field = field.trim();
                    if(field) {
                        fields[field] = 1;
                    }
                });
            }
        }
        
        // 解析查询条件
        const whereMatch = sql.match(/where\s+([\s\S]+?)(?:\s+(group|order|limit))?/i);
        let filter = {};
        if(whereMatch) {
            // 这里简化处理，实际项目中需要更复杂的解析
            filter = this._parseWhere(whereMatch[1], params);
        }
        
        // 解析排序
        const orderMatch = sql.match(/order\s+by\s+([\s\S]+?)(?:\s+limit)?/i);
        let sort = {};
        if(orderMatch) {
            const orderStr = orderMatch[1];
            orderStr.split(',').forEach(item => {
                item = item.trim();
                if(item) {
                    const [field, direction] = item.split(/\s+/);
                    sort[field] = direction && direction.toLowerCase() === 'desc' ? -1 : 1;
                }
            });
        }
        
        // 解析限制
        const limitMatch = sql.match(/limit\s+(\d+)(?:\s*,\s*(\d+))?/i);
        let skip = 0;
        let limit = 0;
        if(limitMatch) {
            skip = parseInt(limitMatch[1]) || 0;
            limit = parseInt(limitMatch[2]) || 0;
        }
        
        // 执行查询
        let query = collection.find(filter, { projection: fields });
        
        // 应用排序
        if(Object.keys(sort).length > 0) {
            query = query.sort(sort);
        }
        
        // 应用限制
        if(skip > 0) {
            query = query.skip(skip);
        }
        if(limit > 0) {
            query = query.limit(limit);
        }
        
        // 执行查询并返回结果
        const result = await query.toArray();
        
        // 转换ObjectId为字符串
        return result.map(item => {
            if(item._id) {
                item._id = item._id.toString();
            }
            return item;
        });
    }

    /**
     * 处理INSERT操作
     * @private
     * @param {string} sql - sql语句
     * @param {*} params - sql参数
     * @param {Collection} collection - 集合
     * @returns {Promise<Object>}
     */
    async _handleInsert(sql, params, collection) {
        // 解析插入数据
        const valuesMatch = sql.match(/values\s*\(([^)]+)\)/i);
        if(valuesMatch) {
            // 构建插入数据
            const data = {};
            const fieldsMatch = sql.match(/\(([^)]+)\)\s*values/i);
            if(fieldsMatch) {
                const fields = fieldsMatch[1].split(',').map(field => field.trim());
                fields.forEach((field, index) => {
                    data[field] = params[index];
                });
            }
            
            // 执行插入
            const result = await collection.insertOne(data);
            
            return {
                affectedRows: 1,
                insertId: result.insertedId.toString()
            };
        }
        
        throw new Error('DbError: 无法解析INSERT语句');
    }

    /**
     * 处理UPDATE操作
     * @private
     * @param {string} sql - sql语句
     * @param {*} params - sql参数
     * @param {Collection} collection - 集合
     * @returns {Promise<Object>}
     */
    async _handleUpdate(sql, params, collection) {
        // 解析更新条件
        const whereMatch = sql.match(/where\s+([\s\S]+)/i);
        let filter = {};
        if(whereMatch) {
            filter = this._parseWhere(whereMatch[1], params.slice(-1));
        }
        
        // 解析更新数据
        const setMatch = sql.match(/set\s+([\s\S]+?)\s+where/i);
        if(setMatch) {
            const setStr = setMatch[1];
            const update = {};
            const setFields = setStr.split(',').map(field => field.trim());
            setFields.forEach((field, index) => {
                const [key, value] = field.split('=');
                update[key.trim()] = params[index];
            });
            
            // 执行更新
            const result = await collection.updateMany(filter, { $set: update });
            
            return {
                affectedRows: result.modifiedCount
            };
        }
        
        throw new Error('DbError: 无法解析UPDATE语句');
    }

    /**
     * 处理DELETE操作
     * @private
     * @param {string} sql - sql语句
     * @param {*} params - sql参数
     * @param {Collection} collection - 集合
     * @returns {Promise<Object>}
     */
    async _handleDelete(sql, params, collection) {
        // 解析删除条件
        const whereMatch = sql.match(/where\s+([\s\S]+)/i);
        let filter = {};
        if(whereMatch) {
            filter = this._parseWhere(whereMatch[1], params);
        }
        
        // 执行删除
        const result = await collection.deleteMany(filter);
        
        return {
            affectedRows: result.deletedCount
        };
    }

    /**
     * 解析WHERE条件
     * @private
     * @param {string} whereStr - WHERE条件字符串
     * @param {*} params - sql参数
     * @returns {Object}
     */
    _parseWhere(whereStr, params) {
        const filter = {};
        
        // 这里简化处理，实际项目中需要更复杂的解析
        // 只处理基本的等于条件
        const conditions = whereStr.split('and').map(condition => condition.trim());
        conditions.forEach((condition, index) => {
            const [field, value] = condition.split('=');
            if(field && value) {
                const fieldName = field.trim();
                // 处理参数占位符
                if(value.trim() === '?') {
                    filter[fieldName] = params[index];
                } else {
                    // 处理字符串字面量
                    if(value.trim().startsWith("'")) {
                        filter[fieldName] = value.trim().replace(/'/g, '');
                    }
                    // 处理数字字面量
                    else if(!isNaN(value.trim())) {
                        filter[fieldName] = parseInt(value.trim());
                    }
                }
            }
        });
        
        return filter;
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
        // MongoDB没有固定的表结构，这里返回一个空数组
        // 实际项目中可以根据集合的文档结构动态生成
        return [];
    }
}

module.exports = Mongodb;
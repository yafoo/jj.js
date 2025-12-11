const {db: cfg_db} = require('./config');
const md5 = require('./utils/md5');
const Context = require('./context');

/**
 * @typedef {import('../types').KoaCtx} KoaCtx
 * @typedef {import('../types').Pagination} Pagination
 * @typedef {import('../types').PaginationInstance} PaginationInstance
 * @typedef {import('../types').OkPacket} OkPacket
 * @typedef {import('../types').RowData} RowData
 * @typedef {import('../types').ListData} ListData
 * @typedef {import('../types').FieldInfo} FieldInfo
 * @typedef {import('../types').SqlInstance} SqlInstance
 */

/**
 * @extends Context
 */
class Db extends Context
{
    /**
     * Initialize a new `Db`
     * @public
     * @param {(object|KoaCtx)} [ctx]
     * @param {(string|object)} [options] - 数据库配置标识或连接参数
     */
    constructor(ctx, options) {
        ctx = ctx || {};
        super(ctx);
        this._config = null;
        this._table = '';
        this._options = {};
        /**
         * @type {string}
         */
        this._queryStr = '';
        this._tableField = {};
        /**
         * @type {SqlInstance}
         */
        this._sql = null;
        this.connect(options);
    }

    /**
     * 重置参数
     * @public
     * @returns {this}
     */
    reset() {
        this._options = {
            distinct: '',
            field: [],
            join: {},
            where: [],
            group: '',
            having: '',
            order: {},
            limit: '',
            page: {},
            getSql: false,
            data: {},
            allowField: false,
            prefix: this._config.prefix || ''
        };
        return this;
    }

    /**
     * 连接数据库连接池
     * @public
     * @param {(string|object)} config - 数据库配置标识或连接参数
     * @returns {this}
     */
    connect(config='default') {
        this._config = typeof config === 'string' ? cfg_db[config] : config;
        this.reset();

        if(this._config.connect) {
            this._sql = this._config.connect(this._config);
        } else {
            const sqltype = this._config.type;
            const Sql = require(`./db/${sqltype}.js`);
            this._sql = new Sql(this.ctx, this.$logger);
            this._sql.connect(this._config);
        }
        
        return this;
    }

    /**
     * 关闭数据库连接池
     * @public
     * @returns {Promise}
     */
    async close() {
        return await this._sql.close();
    }

    /**
     * 开启事务
     * @public
     * @param {function} [fun] 
     * @returns {Promise<string>}
     */
    async startTrans(fun) {
        return await this._sql.startTrans(fun);
    }

    /**
     * 事务回滚
     * @public
     * @returns {Promise<string>}
     */
    async rollback() {
        return await this._sql.rollback();
    }

    /**
     * 提交事务
     * @public
     * @returns {Promise<string>}
     */
    async commit() {
        return await this._sql.commit();
    }

    /**
     * 执行sql查询
     * @public
     * @param {string} sql - sql语句或参数
     * @param {*} params - sql参数
     * @param {*} [reset=true] - 是否重置参数
     * @returns {Promise}
     */
    async query(sql, params, reset=true) {
        params !== false && reset !== false && this.reset();
        params || (params = []);
        
        return await this._sql.query(sql, params);
    }

    /**
     * 设置数据表名
     * @public
     * @param {string} [table] - 表名字，不带前缀
     * @returns {this}
     */
    table(table) {
        if(table) {
            this._table = table.trim().replace(/ +/g, ' ');
        }
        return this;
    }

    /**
     * 设置数据表名前缀
     * @public
     * @param {string} prefix - 表名前缀
     * @returns {this}
     */
    prefix(prefix) {
        if(typeof prefix !== 'undefined') {
            this._options.prefix = prefix.trim();
        }
        return this;
    }

    /**
     * 设置distinct查询
     * @returns {this}
     */
    distinct() {
        this._options.distinct = 'distinct';
        return this;
    }

    /**
     * 设置查询字段，支持多次调用
     * @public
     * @param {(string|array)} field - 表名前缀
     * @returns {this}
     */
    field(field) {
        if(field) {
            if(typeof field === 'string') {
                field = field.split(',').map(value=>value.trim().replace(/ +/g, ' ').replace(/ as /g, ' '));
            }
            this._options.field = [...this._options.field, ...field];
        }
        return this;
    }

    /**
     * 设置表连接，支持多次调用
     * @public
     * @param {string} table - 要连接的表名
     * @param {string} on - 连接条件
     * @param {string} [type=left] - 连接方式
     * @returns {this}
     */
    join(table, on, type='left') {
        if(table) {
            this._options.join[table.trim().replace(/ +/g, ' ')] = {on, type};
        }
        return this;
    }

    /**
     * 设置查询条件，支持多次调用
     * @public
     * @param {object} where - 查询条件
     * @param {object} [logic] - 多次调用之间的连接逻辑，默认and
     * @returns {this}
     */
    where(where, logic) {
        if(where) {
            this._options.where.push([where, logic]);
        }
        return this;
    }

    /**
     * 设置分组查询
     * @public
     * @param {string} field - 分组字段
     * @returns {this}
     */
    group(field) {
        if(field) {
            this._options.group = 'group by `' + field.trim().replace(/\./g, '`.`') + '`';
        }
        return this;
    }

    /**
     * 设置having筛选
     * @public
     * @param {string} having - 筛选条件
     * @returns {this}
     */
    having(having) {
        if(having) {
            this._options.having = 'having ' + having;
        }
        return this;
    }

    /**
     * 设置排序方式，支持多次调用
     * @public
     * @param {string} field - 排序字段
     * @param {string} [order] - 排序方式，默认asc
     * @returns {this}
     */
    order(field, order='asc') {
        if(field) {
            this._options.order[field.trim()] = order === 'asc' ? 'asc' : 'desc';
        }
        return this;
    }

    /**
     * 设置查询数量
     * @public
     * @param {number} offset - 开始位置
     * @param {number} [rows] - 行数，不传，则按offset
     * @returns {this}
     */
    limit(offset, rows) {
        if(typeof offset === 'undefined') return this;
        offset = offset ? offset : 0;
        rows = rows ? rows : null;
        this._options.limit = 'limit ' + offset + (rows ? ',' + rows : '');
        return this;
    }

    /**
     * 按分页设置查询数量
     * @public
     * @param {number} page - 页码
     * @param {number} pageSize - 每页行数
     * @returns {this}
     */
    page(page, pageSize) {
        if(typeof page === 'undefined') return this;
        page = page ? page : 1;
        pageSize = pageSize ? pageSize : 10;
        this.limit((page - 1) * pageSize, pageSize);
        this._options.page = {page, pageSize};
        return this;
    }

    /**
     * 设置查询结果缓存
     * @public
     * @param {number} time - 为0则不缓存
     * @returns {this}
     */
    cache(time) {
        this._options.cache_time = time;
        return this;
    }

    /**
     * 设置返回sql语句（最终会返回序列化后的sql，不会真实查询数据库）
     * @public
     * @param {boolean} [fetch] - 是否返回sql
     * @returns {this}
     */
    getSql(fetch = true) {
        this._options.getSql = fetch;
        return this;
    }

    /**
     * 设置字段过滤（插入或更新数据时）
     * @public
     * @param {(boolean|string|string[])} [field] - 允许保存字段，为true，则按数据表字段
     * @returns {this}
     */
    allowField(field = true) {
        if(!field) {
            field = false;
        } else if(typeof field == 'string') {
            field = field.split(',').map(value => value.trim());
        }
        this._options.allowField = field;
        return this;
    }

    /**
     * 设置要插入或更新的数据
     * @public
     * @param {object} data - 要插入或更新的数据
     * @returns {this}
     */
    data(data) {
        if(data) {
            this._options.data = {...this._options.data, ...data};
        }
        return this;
    }

    /**
     * 获取多条数据
     * @public
     * @param {object} condition - 查询条件
     * @returns {Promise<string|ListData>}
     */
    async select(condition) {
        condition && (this._options.where = [], this._options.where.push([condition]));

        let params = [];
        const table = this._parseTable();
        const distinct = this._options.distinct;
        const field = this._parseField();
        const join = this._parseJoin();

        const where = this._parseWhere();
        params = params.concat(where[1]);

        const order = this._parseOrder();

        const group = this._options.group;
        const having = this._options.having;
        const limit = this._options.limit;

        this._queryStr = `select ${distinct} ${field} from ${table} ${join} ${where[0]} ${group} ${having} ${order} ${limit}`;

        if(this._options.getSql) {
            this._options.getSql = false;
            return this._sql.format(this._queryStr, params);
        }
        
        if(this._options.cache_time) {
            const cache_time = this._options.cache_time;
            const cache_key = md5(this._sql.format(this._queryStr, params));
            if(this.getCache(cache_key)) {
                this.reset();
                return this.getCache(cache_key);
            }
            const result = await this.query(this._queryStr, params);
            this.setCache(cache_key, result, cache_time);
            return result;
        }

        return await this.query(this._queryStr, params) || [];
    }

    /**
     * 获取一条数据
     * @public
     * @param {object} condition - 查询条件
     * @returns {Promise<?RowData>}
     */
    async find(condition) {
        condition && (this._options.where = [], this._options.where.push([condition])); 
        this.limit(1);

        if(this._options.getSql) {
            return await this.select();
        }

        const rows = await this.select();
        return rows.length ? rows[0] : null;
    }

    /**
     * 获取一个字段值
     * @public
     * @param {string} field - 字段
     * @returns {Promise<*>}
     */
    async value(field) {
        this._options.field = [];
        this.field(field);
        
        if(this._options.getSql) {
            return await this.find();
        }

        const row = await this.find();
        return row && row[field];
    }

    /**
     * 获取总数
     * @public
     * @param {string} [field] - 字段
     * @returns {Promise<number>}
     */
    async count(field='*') {
        return await this.value(`count(${field})`) || 0;
    }

    /**
     * 获取字段最大值
     * @public
     * @param {string} field - 字段
     * @returns {Promise<number>}
     */
    async max(field) {
        return await this.value(`max(${field})`);
    }

    /**
     * 获取字段最小值
     * @public
     * @param {string} field - 字段
     * @returns {Promise<number>}
     */
    async min(field) {
        return await this.value(`min(${field})`);
    }

    /**
     * 获取字段平均值
     * @public
     * @param {string} field - 字段
     * @returns {Promise<number>}
     */
    async avg(field) {
        return await this.value(`avg(${field})`);
    }

    /**
     * 获取字段总和
     * @public
     * @param {string} field - 字段
     * @returns {Promise<number>}
     */
    async sum(field) {
        return await this.value(`sum(${field})`);
    }

    /**
     * 获取字段列数据
     * @public
     * @param {string} field - 数据字段
     * @param {string} [key] - key字段，不设置返回数据数组，设置则返回{key: field}对象数组
     * @returns {Promise<(ListData|object)>}
     */
    async column(field, key) {
        this._options.field = [];
        this.field(field);
        key && this.field(key);
        
        if(this._options.getSql) {
            return await this.select();
        }

        /**
         * @type {ListData}
         */
        const rows = await this.select();
        const result = key ? {} : [];
        rows.forEach(row => {
            if(key) {
                result[row[key]] = row[field];
            } else {
                result.push(row[field]);
            }
        });
        return result;
    }

    /**
     * 获取多条数据（按分页）
     * @public
     * @param {object} [param0] - 分页参数
     * @param {number} [param0.page] - 页码
     * @param {number} [param0.page_size] - 每页行数
     * @param {PaginationInstance} [param0.pagination] - 分页类实例
     * @returns {Promise<array>} - [ListData, PaginationInstance]
     */
    async pagination({page, page_size, pagination} = {}) {
        !page && (page = this._options.page.page);
        !page_size && (page_size = this._options.page.pageSize);
        !pagination && (pagination = this.$pagination);

        const options = {...this._options}; // 暂存options
        const total = await this.count();
        pagination.total(total);

        // @ts-ignore
        page ? pagination.page(page) : (page = pagination.page());
        // @ts-ignore
        page_size ? pagination.pageSize(page_size) : (page_size = pagination.pageSize());
        
        if(total) {
            this._options = options; // 恢复options
            const result = await this.page(page, page_size).select();
            return [result, pagination];
        } else {
            return [[], pagination];
        }
    }

    /**
     * 插入一条数据
     * @public
     * @param {object} data - 待插入数据
     * @returns {Promise<string|OkPacket>}
     */
    async insert(data) {
        data && (this._options.data = data);

        const table = this._parseTable();
        await this._filterData();
        const [sql, params] = this._parseInsertData();

        this._queryStr = `insert into ${table} ${sql}`;
        if(this._options.getSql) {
            this._options.getSql = false;
            return this._sql.format(this._queryStr, params);
        }
        return await this.query(this._queryStr, params);
    }

    /**
     * 更新数据
     * @public
     * @param {object} data - 更新数据
     * @param {object} condition - 更新条件
     * @returns {Promise<string|OkPacket>}
     */
    async update(data, condition) {
        data && (this._options.data = data);
        condition && (this._options.where = [], this._options.where.push([condition]));

        const table = this._parseTable();
        await this._filterData();
        const [sql, dataParams] = this._parseUpdateData();

        const [where, whereParams] = this._parseWhere();
        if(!where[0]) {
            const message = 'update方法必须传入where参数';
            this.$logger.sql(message);
            throw new Error('DbError: ' + message);
        }
        const params = [...dataParams, ...whereParams];

        this._queryStr = `update ${table} set ${sql} ${where}`;
        if(this._options.getSql) {
            this._options.getSql = false;
            return this._sql.format(this._queryStr, params);
        }
        return await this.query(this._queryStr, params);
    }

    /**
     * 字段值增加
     * @public
     * @param {string} field - 字段
     * @param {number} [step=1] - 增加值，默认1
     * @returns {Promise<string|OkPacket>}
     */
    async inc(field, step) {
        return await this.update({[field]: ['inc', step]});
    }

    /**
     * 字段值减少
     * @public
     * @param {string} field - 字段
     * @param {number} [step=1] - 减少值，默认1
     * @returns {Promise<string|OkPacket>}
     */
    async dec(field, step) {
        return await this.update({[field]: ['dec', step]});
    }

    /**
     * 字段值执行自定义表达式
     * @public
     * @param {string} field - 字段
     * @param {string} value - 自定义表达式
     * @returns {Promise<string|OkPacket>}
     */
    async exp(field, value) {
        return await this.update({[field]: ['exp', value]});
    }

    /**
     * 删除数据
     * @public
     * @param {object} condition - 删除条件
     * @returns {Promise<string|OkPacket>}
     */
    async delete(condition) {
        condition && (this._options.where = [], this._options.where.push([condition]));

        let params = [];
        const table = this._parseTable();
        const where = this._parseWhere();
        if(!where[0]) {
            const message = 'delete方法必须传入where参数';
            this.$logger.sql(message);
            throw new Error('DbError: ' + message);
        }
        params = params.concat(where[1]);

        this._queryStr = `delete from ${table} ${where[0]}`;
        if(this._options.getSql) {
            this._options.getSql = false;
            return this._sql.format(this._queryStr, params);
        }
        return await this.query(this._queryStr, params);
    }

    /**
     * 执行sql查询
     * @public
     * @param {string} sql - sql语句或参数
     * @param {*} params - sql参数
     * @param {*} [reset=true] - 是否重置参数
     * @returns {Promise<string|OkPacket|ListData|RowData>}
     */
    async execute(sql, params, reset=true) {
        this._queryStr = sql;
        if(this._options.getSql) {
            this._options.getSql = false;
            return this._sql.format(this._queryStr, params);
        }

        if(this._options.cache_time) {
            const cache_time = this._options.cache_time;
            const cache_key = md5(this._sql.format(this._queryStr, params));
            if(this.getCache(cache_key)) {
                return this.getCache(cache_key);
            }
            const result = await this.query(this._queryStr, params);
            this.setCache(cache_key, result, cache_time);
            return result;
        }
        return await this.query(this._queryStr, params, reset);
    }

    /**
     * 获取数据表信息
     * @public
     * @param {string} table - 表名字
     * @returns {Promise<FieldInfo[]>}
     */
    async tableInfo(table) {
        const get_sql = this._options.getSql;
        this._options.getSql = false;
        const table_info = await this.table(table)._sql.tableInfo(this._parseTable());
        this._options.getSql = get_sql;
        return table_info;
    }

    /**
     * 获取数据表字段
     * @public
     * @param {string} [table] - 表名字
     * @returns {Promise<string[]>}
     */
    async tableField(table) {
        const table_info = await this.tableInfo(table);
        return table_info.map(item => item.Field);
    }

    _parseTable() {
        const table = this._table.replace(' ', '` `');
        return `\`${this._options.prefix}${table}\``;
    }

    _parseJoin() {
        let join = '';
        Object.keys(this._options.join).forEach(key => {
            const table = '`' + this._options.prefix + key.replace(' ', '` `') + '`';
            const value = this._options.join[key];
            join += (join ? ' ' : '') + value.type + ' join ' + table + ' on ' + value.on;
        });
        return join;
    }

    _parseField() {
        let fields = [];
        this._options.field.forEach(value => {
            let field = value.split(' ');
            let alias = '';
            const length = field.length;
            if(length > 1 && !~field[length - 1].indexOf(')')) {
                alias = ' `' + field[length - 1] + '`';
                field.pop();
            }
            field = field.join(' ');
            if(!~field.indexOf(')')) {
                field = '`' + field.replace(/\./g, '`.`') + '`';
            }
            field = field.replace('`*`', '*');
            fields.push(field + alias);
        });
        return fields.join(',') || '*';
    }

    _parseWhere() {
        const logic = ['=', '<>', '!=', '>', '>=', '<', '<=', 'like', 'not like', 'in', 'not in', 'between', 'not between', 'is', 'is not', 'exp'];
        const where = [];
        const params = [];
        this._options.where.forEach(item => {
            const whereList = item[0];
            const whereLink = (item[1] && item[1].toLowerCase()) === 'or' ? 'or' : 'and';
            let whereChild = '';
            Object.keys(whereList).forEach(field => {
                const value = whereList[field];
                if(!~field.indexOf(')')) {
                    field = '`' + field.replace(/\./g, '`.`') + '`';
                }
                let fieldLogic = '=';
                let fieldValue = null;
                let fieldLink = 'and';
                if(value instanceof Array) {
                    value[0] = value[0].toLowerCase();
                    fieldLogic =  ~logic.indexOf(value[0]) ? value[0] : '=';
                    fieldValue = value[1];
                    fieldLink = (value[2] && value[2].toLowerCase()) === 'or' ? 'or' : 'and';
                } else {
                    fieldValue = value;
                }
                if(fieldLogic === 'exp') {
                    whereChild += (whereChild ? ` ${fieldLink} ` : '') + `${fieldValue}`;
                } else {
                    whereChild += (whereChild ? ` ${fieldLink} ` : '') + `${field} ${fieldLogic} `;
                    if(~['in', 'not in'].indexOf(fieldLogic)) {
                        whereChild += `(?)`;
                        params.push(fieldValue);
                    } else if(~['between', 'not between'].indexOf(fieldLogic)) {
                        whereChild += `? and ?`;
                        typeof fieldValue === 'string' && (fieldValue = fieldValue.split(','));
                        params.push(fieldValue[0]);
                        params.push(fieldValue[1]);
                    } else {
                        whereChild += `?`;
                        params.push(fieldValue);
                    }
                }
            });
            if(whereChild) {
                if(where.length) {
                    where.push(whereLink);
                    where.push(`(${whereChild})`);
                } else {
                    where.push(whereChild);
                } 
            }
        });
        where.length > 1 && (where[0] = `(${where[0]})`);
        return [where.length ? 'where ' + where.join(' ') : '', params];
    }

    _parseOrder() {
        let order = '';
        Object.keys(this._options.order).forEach(key => {
            const field = '`' + key.replace('.', '`.`') + '`';
            const value = this._options.order[key];
            order += (order ? ',' : 'order by ') + field + (value ? ' ' + value : '');
        });
        return order;
    }

    _parseInsertData() {
        const fields = [];
        const values = [];
        const params = [];
        Object.keys(this._options.data).forEach(key => {
            const field = '`' + key.replace('.', '`.`') + '`';
            fields.push(field);
            values.push('?');
            const value = this._options.data[key];
            params.push(value);
        });
        return [`(${fields.join(', ')}) values (${values.join(', ')})`, params];
    }

    _parseUpdateData() {
        let data = '';
        const params = [];
        Object.keys(this._options.data).forEach(key => {
            const field = '`' + key.replace('.', '`.`') + '`';
            const value = this._options.data[key];
            data += (data ? ',' : '') + field + '=';
            if(value instanceof Array) {
                value[0] = value[0].toLowerCase();
                switch(value[0]) {
                    case 'inc':
                        data += `${field}+?`;
                        params.push(value[1] || 1);
                        break;
                    case 'dec':
                        data += `${field}-?`;
                        params.push(value[1] || 1);
                        break;
                    case 'exp':
                        data += `${value[1]}`;
                        break;
                }
            } else {
                data += `?`;
                params.push(value);
            }
        });
        return [data, params];
    }

    async _filterData() {
        if(!this._options.allowField) {
            return this._options.data;
        }

        let allowField = this._options.allowField;
        if(allowField === true) {
            const table_name = this._options.prefix + this._table;
            if(!this._tableField[table_name]) {
                this._tableField[table_name] = await this.tableField();
            }
            allowField = this._tableField[table_name];
        }

        Object.keys(this._options.data).forEach(key => {
            if(!~allowField.indexOf(key)) {
                delete this._options.data[key];
            }
        });
        return this._options.data;
    }

    /**
     * 获取sql缓存
     * @param {string} [key]
     * @returns {*}
     */
    getCache(key) {
        return Db.cache.get(key);
    }

    /**
     * 设置sql缓存
     * @param {string} key
     */
    setCache(key, data, cache_time) {
        Db.cache.set(key, data, cache_time);
    }

    /**
     * 删除sql缓存
     * @param {string} [key]
     */
    deleteCache(key) {
        Db.cache.delete(key);
    }
}

/**
 * 设置数据库缓存实例
 * @type {import('../types').Cache}
 */
// @ts-ignore
Db.cache = new (require('./cache'))();
/**
 * 开启缓存自动清理
 */
Db.cache.setIntervalTime(20 * 60 * 60);

module.exports = Db;
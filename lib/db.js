const {db: cfg_db} = require('./config');
const md5 = require('./utils/md5');
const Context = require('./context');

/**
 * @typedef {import('../types').KoaCtx} KoaCtx
 * @typedef {import('../types').DbConfigItem} DbConfigItem
 * @typedef {import('../types').Pagination} Pagination
 * @typedef {import('../types').PaginationInstance} PaginationInstance
 * @typedef {import('../types').OkPacket} OkPacket
 * @typedef {import('../types').RowData} RowData
 * @typedef {import('../types').ListData} ListData
 * @typedef {import('../types').FieldInfo} FieldInfo
 * @typedef {import('../types').Link} Link
 * @typedef {import('../types').Operator} Operator
 * @typedef {import('../types').Where} Where
 * @typedef {import('../types').Sql} Sql
 * @typedef {import('../types').SqlInstance} SqlInstance
 * @typedef {import('../types').Logger} Logger
 * @typedef {import('../types')._DbOptions} _DbOptions
 * @typedef {import('../types').Cache} Cache
 */

/**
 * @extends Context
 */
class Db extends Context
{
    /**
     * Initialize a new `Db`
     * @public
     * @param {object|KoaCtx} [ctx]
     * @param {string|object} [options] - 数据库配置标识或连接参数
     */
    constructor(ctx, options) {
        ctx = ctx || {};
        super(ctx);
        /**
         * @type {DbConfigItem}
         */
        // @ts-ignore
        this._config = null;
        this._table = '';
        /**
         * @type {_DbOptions}
         */
        // @ts-ignore
        this._options = {};
        /**
         * @type {string}
         */
        this._queryStr = '';
        /**
         * @type {Map<string, string[]>}
         */
        this._tableField = new Map();
        /**
         * @type {SqlInstance} sql实例
         */
        // @ts-ignore
        this._sql = null;
        /**
         * @type {String} sql语句
         */
        this.sql = '';

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
        this.sql = '';
        return this;
    }

    /**
     * 连接数据库连接池
     * @public
     * @param {string|DbConfigItem} config - 数据库配置标识或连接参数
     * @returns {this}
     */
    connect(config='default') {
        this._config = typeof config === 'string' ? cfg_db[config] : config;
        this.reset();

        if(this._config.connect) {
            this._sql = this._config.connect(this._config);
        } else {
            const sqltype = this._config.type;
            /** @class {Sql} */
            const Sql = require(`./db/${sqltype}.js`);
            this._sql = new Sql(this.ctx, this.logger);
            this._sql.connect(this._config);
        }
        
        return this;
    }

    /**
     * 关闭数据库连接池
     * @public
     * @returns {Promise<this>}
     */
    async close() {
        await this._sql.close();
        return this;
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
     * @returns {Promise<*>}
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
     * @param {string|string[]} field - 表字段
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
     * @param {string} table - 要连接的表名，不带前缀
     * @param {string} on - 连接条件
     * @param {string} [type=left] - 连接方式，left|right|inner|outer，默认left
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
     * @param {Where} where - 查询条件
     * @param {Link} [logic] - 多次调用之间的连接逻辑，and|or，默认and
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
     * @param {string} [order] - 排序方式，asc|desc，默认asc
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
     * @param {number|string} offset - 开始位置
     * @param {number} [rows] - 行数，不传，则按offset
     * @returns {this}
     */
    limit(offset, rows) {
        if(typeof offset === 'undefined') return this;
        // @ts-ignore
        offset = offset ? parseInt(offset) : 0;
        // @ts-ignore
        rows = rows ? parseInt(rows) : null;
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
     * @param {number} time - 单位秒，为0则不缓存
     * @returns {this}
     */
    withCache(time) {
        this._options.cache_time = time;
        return this;
    }

    /**
     * 设置返回sql语句（最终会返回序列化后的sql，不会真实查询数据库）
     * @public
     * @param {boolean} [fetch] - 是否返回sql，默认true
     * @returns {this}
     */
    getSql(fetch = true) {
        this._options.getSql = fetch;
        return this;
    }

    /**
     * 设置字段过滤（新增或更新数据时）
     * @public
     * @param {boolean|string|string[]} [field] - 允许字段，为true，则按数据表字段
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
     * 设置要新增或更新的数据
     * @public
     * @param {Object.<string, any>} data - 要新增或更新的数据
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
     * @param {Where} [condition] - 查询条件，设置后将会替换where方法设置的条件
     * @returns {Promise<ListData>}
     */
    async select(condition) {
        condition && (this._options.where = [], this._options.where.push([condition]));

        const table = this._parseTable();
        const distinct = this._options.distinct;
        const field = this._parseField();
        const join = this._parseJoin();

        const where = this._parseWhere();
        const params = where[1];

        const order = this._parseOrder();

        const group = this._options.group;
        const having = this._options.having;
        const limit = this._options.limit;

        this._queryStr = `select ${distinct} ${field} from ${table} ${join} ${where[0]} ${group} ${having} ${order} ${limit}`;

        if(this._options.getSql) {
            this._options.getSql = false;
            this.sql = this._sql.format(this._queryStr, params);
            return;
        }
        
        if(this._options.cache_time) {
            const cache_time = this._options.cache_time;
            const cache_key = md5(this._sql.format(this._queryStr, params));
            if(this.cache.get(cache_key)) {
                this.reset();
                return this.cache.get(cache_key);
            }
            const result = await this.query(this._queryStr, params);
            this.cache.set(cache_key, result, cache_time);
            return result;
        }

        return await this.query(this._queryStr, params) || [];
    }

    /**
     * 获取一条数据
     * @public
     * @param {Where} [condition] - 查询条件
     * @returns {Promise<(RowData|null)>}
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
     * @param {string} field - 要查询的字段
     * @returns {Promise<(any|null)>}
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
     * @returns {Promise<(any[]|Object.<string, any>)>}
     */
    async column(field, key) {
        this._options.field = [];
        this.field(field);
        key && this.field(key);
        
        if(this._options.getSql) {
            return await this.select();
        }

        const rows = await this.select();
        if(key) {
            return rows.reduce((result, row) => {
                result[row[key]] = row[field];
                return result;
            }, {});
        } else {
            return rows.map(row => row[field]);
        }
    }

    /**
     * 获取多条数据（按分页）
     * @public
     * @param {object} [param0] - 分页参数
     * @param {number} [param0.page] - 页码，可通过page方法配置，默认从默认分页类获取
     * @param {number} [param0.page_size] - 每页行数，可通过page方法配置，默认从config配置获取
     * @param {PaginationInstance} [param0.pagination] - 分页类实例，为空时使用默认分页类
     * @returns {Promise<[ListData, PaginationInstance]>} - [ListData, PaginationInstance]
     */
    async selectWithPagination({page, page_size, pagination} = {}) {
        !page && (page = this._options.page.page);
        !page_size && (page_size = this._options.page.pageSize);
        !pagination && (pagination = this.pagination);

        const options = {...this._options}; // 暂存options
        const total = await this.count();
        pagination.total(total);

        // @ts-ignore
        page ? pagination.page(page) : (page = pagination.page());
        // @ts-ignore
        page_size ? pagination.pageSize(page_size) : (page_size = pagination.pageSize());
        
        if(total) {
            this._options = options; // 恢复options
            // @ts-ignore
            const result = await this.page(page, page_size).select();
            return [result, pagination];
        } else {
            return [[], pagination];
        }
    }

    /**
     * 新增一条数据
     * @public
     * @param {object} [data] - 待新增数据，会替换通过data方法传入的数据
     * @returns {Promise<OkPacket>}
     */
    async insert(data) {
        data && (this._options.data = data);

        const table = this._parseTable();
        await this._filterData();
        const [sql, params] = this._parseInsertData();

        this._queryStr = `insert into ${table} ${sql}`;
        if(this._options.getSql) {
            this._options.getSql = false;
            this.sql = this._sql.format(this._queryStr, params);
            return;
        }
        return await this.query(this._queryStr, params);
    }

    /**
     * 更新数据
     * @public
     * @param {object} [data] - 更新数据，会替换通过data方法传入的数据
     * @param {Where} [condition] - 更新条件，会替换通过where方法传入的条件
     * @returns {Promise<OkPacket>}
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
            this.logger.sql(message);
            throw new Error('DbError: ' + message);
        }
        const params = [...dataParams, ...whereParams];

        this._queryStr = `update ${table} set ${sql} ${where}`;
        if(this._options.getSql) {
            this._options.getSql = false;
            this.sql = this._sql.format(this._queryStr, params);
            return;
        }
        return await this.query(this._queryStr, params);
    }

    /**
     * 字段值增加
     * @public
     * @param {string} field - 字段
     * @param {number} [step] - 增加值，默认1
     * @returns {Promise<OkPacket>}
     */
    async inc(field, step = 1) {
        return await this.update({[field]: ['inc', step]});
    }

    /**
     * 字段值减少
     * @public
     * @param {string} field - 字段
     * @param {number} [step] - 减少值，默认1
     * @returns {Promise<OkPacket>}
     */
    async dec(field, step = 1) {
        return await this.update({[field]: ['dec', step]});
    }

    /**
     * 字段值执行自定义表达式
     * @public
     * @param {string} field - 字段
     * @param {string} value - 自定义表达式
     * @returns {Promise<OkPacket>}
     */
    async exp(field, value) {
        return await this.update({[field]: ['exp', value]});
    }

    /**
     * 删除数据
     * @public
     * @param {Where} [condition] - 删除条件，会替换通过where方法传入的条件
     * @returns {Promise<OkPacket>}
     */
    async delete(condition) {
        condition && (this._options.where = [], this._options.where.push([condition]));

        const table = this._parseTable();
        const where = this._parseWhere();
        if(!where[0]) {
            const message = 'delete方法必须传入where参数';
            this.logger.sql(message);
            throw new Error('DbError: ' + message);
        }
        const params = where[1];

        this._queryStr = `delete from ${table} ${where[0]}`;
        if(this._options.getSql) {
            this._options.getSql = false;
            this.sql = this._sql.format(this._queryStr, params);
            return;
        }
        return await this.query(this._queryStr, params);
    }

    /**
     * 执行sql查询
     * @public
     * @param {string} sql - sql语句或参数
     * @param {*} params - sql参数
     * @param {*} [reset=true] - 是否重置参数
     * @returns {Promise<OkPacket|ListData|RowData>}
     */
    async execute(sql, params, reset=true) {
        this._queryStr = sql;
        if(this._options.getSql) {
            this._options.getSql = false;
            this.sql = this._sql.format(this._queryStr, params);
            return;
        }

        if(this._options.cache_time) {
            const cache_time = this._options.cache_time;
            const cache_key = md5(this._sql.format(this._queryStr, params));
            if(this.cache.get(cache_key)) {
                return this.cache.get(cache_key);
            }
            const result = await this.query(this._queryStr, params);
            this.cache.set(cache_key, result, cache_time);
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

    /**
     * 解析数据表名字
     * @public
     * @returns {string} 包含``号的表名字
     */
    _parseTable() {
        const table = this._table.replace(' ', '` `');
        return `\`${this._options.prefix}${table}\``;
    }

    /**
     * 解析join
     * @public
     * @returns {string} join字符串
     */
    _parseJoin() {
        let join = '';
        Object.keys(this._options.join).forEach(key => {
            const table = '`' + this._options.prefix + key.replace(' ', '` `') + '`';
            const value = this._options.join[key];
            join += (join ? ' ' : '') + value.type + ' join ' + table + ' on ' + value.on;
        });
        return join;
    }

    /**
     * 解析字段
     * @public
     * @returns {string} 字段字符串
     */
    _parseField() {
        /** @type {string[]} */
        let fields = [];
        this._options.field.forEach(value => {
            let field = value.split(' ');
            let alias = '';
            const length = field.length;
            if(length > 1 && !~field[length - 1].indexOf(')')) {
                alias = ' `' + field[length - 1] + '`';
                field.pop();
            }
            let field_str = field.join(' ');
            if(!~field.indexOf(')')) {
                field_str = '`' + field_str.replace(/\./g, '`.`') + '`';
            }
            field_str = field_str.replace('`*`', '*');
            fields.push(field + alias);
        });
        return fields.join(',') || '*';
    }

    /**
     * 解析where参数
     * @private
     * @returns {[string, any[]]}
     */
    _parseWhere() {
        /** @type {Operator[]} */
        const logic = ['=', '<>', '!=', '>', '>=', '<', '<=', 'like', 'not like', 'in', 'not in', 'between', 'not between', 'is', 'is not', 'exp'];
        /** @type {string[]} */
        const where = [];
        /** @type {any[]} */
        const params = [];
        this._options.where.forEach(item => {
            /** @type {Object.<string, any>} */
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

    /**
     * 解析order参数
     * @private
     * @returns {string} 返回排序，类似order by id desc
     */
    _parseOrder() {
        let order = '';
        Object.keys(this._options.order).forEach(key => {
            const field = '`' + key.replace('.', '`.`') + '`';
            const value = this._options.order[key];
            order += (order ? ',' : 'order by ') + field + (value ? ' ' + value : '');
        });
        return order;
    }

    /**
     * 解析insert数据
     * @private
     * @returns {[string, any[]]}
     */
    _parseInsertData() {
        /** @type {string[]} */
        const fields = [];
        /** @type {string[]} */
        const values = [];
        /** @type {any[]} */
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

    /**
     * 解析update数据
     * @private
     * @returns {[string, any[]]}
     */
    _parseUpdateData() {
        let data = '';
        /** @type {any[]} */
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

    /**
     * 过滤数据
     * @private
     * @returns {Promise<Object.<string, any>>} 返回过滤后的数据
     */
    async _filterData() {
        if(!this._options.allowField) {
            return this._options.data;
        }

        let allowField = this._options.allowField;
        if(allowField === true) {
            const table_name = this._options.prefix + this._table;
            if(!this._tableField.get(table_name)) {
                this._tableField.set(table_name, await this.tableField());
            }
            allowField = this._tableField.get(table_name) || [];
        }

        Object.keys(this._options.data).forEach(key => {
            if(!~allowField.indexOf(key)) {
                delete this._options.data[key];
            }
        });
        return this._options.data;
    }

    /**
     * @type {Logger} Logger静态类
     */
    // @ts-ignore
    #_logger = null;

    /**
     * @type {Logger} Logger静态类
     */
    get logger() {
        if(this.#_logger === null) {
            if(this.$logger && this.$logger.__node__ && this.$logger.__node__.type == 'class') {
                this.#_logger = this.$logger;
            } else {
                this.#_logger = require('./logger');
            }
        }
        return this.#_logger;
    }

    set logger(logger) {
        this.setLogger(logger);
    }

    /**
     * 设置日志器
     * @param {Logger} logger
     * @returns {this}
     */
    setLogger(logger) {
        this.#_logger = logger;
        this._sql && this._sql.setLogger(logger);
        return this;
    }

    /**
     * 获取分页器实例
     * @returns {Pagination & PaginationInstance}
     */
    get pagination() {
        return this.$pagination;
    }

    /**
     * 设置数据库缓存实例
     * @type {Cache}
     */
    // @ts-ignore
    static _cache = new (require('./cache'))(new Map());

    /**
     * 数据库拥有一个独立的数据库缓存实例
     * @returns {Cache}
     */
    get cache() {
        return Db._cache;
    }
}

module.exports = Db;
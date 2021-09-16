const {db: cfg_db} = require('./config');
const md5 = require('./utils/md5');
const Context = require('./context');

//连接池
const pool = new Map();
//事务连接
const trans = new Map();
//事务嵌套
const nest = new Map();

class Db extends Context
{
    constructor(ctx) {
        ctx = ctx || {};
        super(ctx);
        this._config = null;
        this._table = '';
        this._prefix = '';
        this._options = {};
        this._queryStr = '';
        this._tableField = {};
        this.connect();
    }

    connect(options='default') {
        this._config = typeof options === 'string' ? cfg_db[options] : options;
        this._prefix = this._config.prefix || '';
        this.reset();

        let cur_pool = pool.get(this._config);
        if(!cur_pool) {
            switch(this._config.type) {
                case 'mysql':
                    cur_pool = require('mysql').createPool(this._config);
                    break;
                default:
                    //other database, please provide database driver and implement the connection method
                    cur_pool = this._config.connect(this._config);
            }
            pool.set(this._config, cur_pool);
            this.$logger.sql(`连接池创建成功：{all: ${pool.size}}`);
        }
        
        return this;
    }

    close() {
        if(pool.has(this._config)) {
            pool.get(this._config).end(err => {
                if(err) {
                    const message = '连接池销毁失败：' + err['message'];
                    this.$logger.sql(message);
                    this.$logger.error(message);
                    throw new Error(message);
                } else {
                    pool.delete(this._config);
                    this.$logger.sql(`连接池销毁成功：{poolTotal: ${pool.size}}`);
                }
            });
            
        }
        return this;
    }

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

    async _creatConnect(p) {
        return new Promise((resolve, reject) => {
            p.getConnection((err, connection) => {
                if(err) {
                    const message = '获取数据库连接失败：' + err['message'];
                    this.$logger.sql(message);
                    this.$logger.error(message);
                    reject(new Error(message));
                } else {
                    this.$logger.sql(`获取数据库连接：{limit: ${p.config.connectionLimit}, all: ${p._allConnections.length}, acquiring: ${p._acquiringConnections.length}, free: ${p._freeConnections.length}, queue: ${p._connectionQueue.length}}`);
                    resolve(connection);
                }
            });
        });
    }

    async _getConnect() {
        return trans.get(this.ctx) || await this._creatConnect(pool.get(this._config));
    }

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
                    resolve('事务执行成功！');
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
                    const message = '开启事务失败：' + err['message'];
                    this.$logger.sql(message);
                    this.$logger.error(message);
                    reject(new Error(message));
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
                trans.delete(this.ctx);
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
                    const message = '事务提交失败：' + err['message'];
                    this.$logger.sql(message);
                    this.$logger.error(message);
                    this.rollback();
                    reject(new Error(message));
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

    async query(sql, params, reset=true) {
        params !== false && reset !== false && this.reset();
        params || (params = []);
        
        const conn = await this._getConnect();

        return new Promise((resolve, reject) => {
            conn.query(sql, params, (err, data) => {
                if(err) {
                    const message = '数据操作失败，SQL：' + this.format(sql, params) + '（' + err['message'] + '）';
                    this.$logger.sql(message);
                    this.$logger.error(message);
                    reject(new Error(message));
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
            page: null,
            getSql: false,
            data: {},
            allowField: false
        };
        return this;
    }

    table(table) {
        if(table) {
            this._table = table.trim().replace(/ +/g, ' ');
        }
        return this;
    }

    prefix(prefix) {
        if(typeof prefix !== 'undefined') {
            this._prefix = prefix.trim();
        }
        return this;
    }

    distinct() {
        this._options.distinct = 'distinct';
        return this;
    }

    field(field) {
        if(field) {
            if(typeof field === 'string') {
                field = field.split(',').map(value=>value.trim().replace(/ +/g, ' ').replace(/ as /g, ' '));
            }
            this._options.field = [...this._options.field, ...field];
        }
        return this;
    }

    join(table, on, type='left') {
        if(table) {
            this._options.join[table.trim().replace(/ +/g, ' ')] = {on, type};
        }
        return this;
    }

    where(where, logic) {
        if(where) {
            this._options.where.push([where, logic]);
        }
        return this;
    }

    group(field) {
        if(field) {
            this._options.group = 'group by `' + field.trim().replace(/\./g, '`.`') + '`';
        }
        return this;
    }

    having(condition) {
        if(condition) {
            this._options.having = 'having ' + condition;
        }
        return this;
    }

    order(field, order='asc') {
        if(field) {
            this._options.order[field.trim()] = order === 'asc' ? 'asc' : 'desc';
        }
        return this;
    }

    limit(offset, rows) {
        if(typeof offset === 'undefined') return this;
        offset = offset ? parseInt(offset) : 0;
        rows = rows ? parseInt(rows) : null;
        this._options.limit = 'limit ' + offset + (rows ? ',' + rows : '');
        return this;
    }

    page(page, pageSize) {
        if(typeof page === 'undefined') return this;
        page = page ? parseInt(page) : 1;
        pageSize = pageSize ? parseInt(pageSize) : 10;
        this.limit((page - 1) * pageSize, pageSize);
        this._options.page = {page, pageSize};
        return this;
    }

    cache(time) {
        this._options.cache_time = time;
        return this;
    }

    getSql(fetch = true) {
        this._options.getSql = fetch;
        return this;
    }

    allowField(field = true) {
        if(!field) {
            field = false;
        } else if(typeof field == 'string') {
            field = field.split(',').map(value => value.trim());
        }
        this._options.allowField = field;
        return this;
    }

    data(data) {
        if(data) {
            this._options.data = {...this._options.data, ...data};
        }
        return this;
    }

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
            return this.format(this._queryStr, params);
        }
        
        if(this._options.cache_time) {
            const cache_time = this._options.cache_time;
            const cache_key = md5(this.format(this._queryStr, params));
            if(this.getCache(cache_key)) {
                this.reset();
                return this.getCache(cache_key);
            }
            const result = await this.query(this._queryStr, params);
            this.setCache(cache_key, result, cache_time);
            return result;
        }

        return await this.query(this._queryStr, params);
    }

    async find(condition) {
        condition && (this._options.where = [], this._options.where.push([condition])); 
        this.limit(1);

        if(this._options.getSql) {
            return await this.select();
        }

        const rows = await this.select();
        return rows.length ? rows[0] : null;
    }

    async value(field) {
        this._options.field = [];
        this.field(field);
        
        if(this._options.getSql) {
            return await this.find();
        }

        const row = await this.find();
        return row && row[field];
    }

    async count(field='*') {
        return await this.value(`count(${field})`);
    }

    async max(field) {
        return await this.value(`max(${field})`);
    }

    async min(field) {
        return await this.value(`min(${field})`);
    }

    async avg(field) {
        return await this.value(`avg(${field})`);
    }

    async sum(field) {
        return await this.value(`sum(${field})`);
    }

    async column(field, key) {
        this._options.field = [];
        this.field(field);
        key && this.field(key);
        
        if(this._options.getSql) {
            return await this.select();
        }

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

    async pagination(page, page_size, pagination) {
        if(typeof page == 'object' || typeof page == 'function') {
            [page, pagination] = [pagination, page];
        }
        if(!pagination) {
            pagination = this.$pagination.__node.isClass ? this.$pagination : this.$.pagination;
        }

        const options = {...this._options};
        const total = await this.count();
        pagination.total(total);

        page ? pagination.page(page) : (page = pagination.page());
        page_size ? pagination.pageSize(page_size) : (page_size = pagination.pageSize());
        
        if(total) {
            this._options = options;
            const result = await this.page(page, page_size).select();
            return [result, pagination];
        } else {
            return [[], pagination];
        }
    }

    async insert(data) {
        data && (this._options.data = data);

        let params = [];
        const table = this._parseTable();

        await this._filterData();

        data = this._parseData();
        params = params.concat(data[1]);

        this._queryStr = `insert into ${table} set ${data[0]}`;
        if(this._options.getSql) {
            this._options.getSql = false;
            return this.format(this._queryStr, params);
        }
        return await this.query(this._queryStr, params);
    }

    async update(data, condition) {
        data && (this._options.data = data);
        condition && (this._options.where = [], this._options.where.push([condition]));

        let params = [];
        const table = this._parseTable();

        await this._filterData();

        data = this._parseData();
        params = params.concat(data[1]);

        const where = this._parseWhere();
        if(!where[0]) {
            const message = 'update方法必须传入where参数';
            this.$logger.sql(message);
            throw new Error(message);
        }
        params = params.concat(where[1]);

        this._queryStr = `update ${table} set ${data[0]} ${where[0]}`;
        if(this._options.getSql) {
            this._options.getSql = false;
            return this.format(this._queryStr, params);
        }
        return await this.query(this._queryStr, params);
    }

    async inc(field, step) {
        return await this.update({[field]: ['inc', step]});
    }

    async dec(field, step) {
        return await this.update({[field]: ['dec', step]});
    }

    async exp(field, value) {
        return await this.update({[field]: ['exp', value]});
    }

    async delete(condition) {
        condition && (this._options.where = [], this._options.where.push([condition]));

        let params = [];
        const table = this._parseTable();
        const where = this._parseWhere();
        if(!where[0]) {
            const message = 'delete方法必须传入where参数';
            this.$logger.sql(message);
            throw new Error(message);
        }
        params = params.concat(where[1]);

        this._queryStr = `delete from ${table} ${where[0]}`;
        if(this._options.getSql) {
            this._options.getSql = false;
            return this.format(this._queryStr, params);
        }
        return await this.query(this._queryStr, params);
    }

    async execute(sql, params, reset=true) {
        this._queryStr = sql;
        if(this._options.getSql) {
            this._options.getSql = false;
            return this.format(this._queryStr, params);
        }
        return await this.query(this._queryStr, params, reset);
    }

    async tableInfo(table) {
        const get_sql = this._options.getSql;
        this._options.getSql = false;
        const table_info = await this.table(table).execute(`show columns from ${this._parseTable()}`, false);
        this._options.getSql = get_sql;
        return table_info;
    }

    async tableField(table) {
        const table_info = await this.tableInfo(table);
        return table_info.map(item => item.Field);
    }

    format(sql, params) {
        params || (params = []);
        return require('mysql').format(sql, params);
    }

    _parseTable() {
        const table = this._table.replace(' ', '` `');
        return `\`${this._prefix}${table}\``;
    }

    _parseJoin() {
        let join = '';
        Object.keys(this._options.join).forEach(key => {
            const table = '`' + this._prefix + key.replace(' ', '` `') + '`';
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

    _parseData() {
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
            const table_name = this._prefix + this._table;
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

    getCache(key) {
        return Db.cache.get(key);
    }

    setCache(key, data, cache_time) {
        Db.cache.set(key, data, cache_time);
    }

    deleteCache(key) {console.log('deleteCache', key);
        Db.cache.delete(key);
    }
}

Db.cache = new (require('./cache'))();
Db.cache.setIntervalTime(20 * 60 * 60);

module.exports = Db;
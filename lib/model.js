const Context = require('./context');
const {toLine} = require('./utils/str');

/**
 * @typedef {import('../types').OkPacket} OkPacket
 * @typedef {import('../types').RowData} RowData
 * @typedef {import('../types').ListData} ListData
 */

/**
 * @extends Context
 */
class Model extends Context
{
    /**
     * Initialize a new `Model`
     * @public
     * @param {import('../types').Context} ctx
     */
    constructor(ctx) {
        super(ctx);
        this.connection = null;
        this.table = toLine(this.constructor.name);
        this.pk = 'id';
        this._db;
    }

    /**
     * 插入一条数据
     * @public
     * @param {object} data - 待插入数据
     * @returns {Promise<OkPacket>}
     */
    async add(data) {
        // @ts-ignore
        return await this.db.allowField().insert(data);
    }

    /**
     * 更新或插入一条数据
     * @public
     * @param {object} data - 更新或插入数据
     * @param {object} [condition] - 更新条件，不为空或data包含主键则更新数据，否则插入数据
     * @returns {Promise<OkPacket>}
     */
    async save(data, condition = {}) {
        if(data[this.pk] || Object.keys(condition).length) {
            if(data[this.pk]) {
                condition[this.pk] = data[this.pk];
                delete data[this.pk];
            }
            // @ts-ignore
            return await this.db.allowField().update(data, condition);
        }

        delete data[this.pk];
        return await this.add(data);
    }

    /**
     * 删除数据
     * @public
     * @param {object} condition - 删除条件
     * @returns {Promise<OkPacket>}
     */
    async del(condition) {
        // @ts-ignore
        return await this.db.delete(condition);
    }

    /**
     * 查询一条数据
     * @public
     * @param {object} condition - 查询条件
     * @returns {Promise<(RowData|null)>}
     */
    async get(condition) {
        return await this.db.find(condition);
    }

    /**
     * 查询多条数据
     * @public
     * @param {object} condition - 查询条件
     * @returns {Promise<(ListData)>}
     */
    async all(condition) {
        // @ts-ignore
        return await this.db.select(condition);
    }

    /**
     * 数据库实例
     * @type {typeof import('./db').prototype}
     */
    get db() {
        if(!this._db){
            this._db = new (require('./db'))(this.ctx);
            this.connection && this._db.connect(this.connection);
        }
        return this._db.table(this.table);
    }
    set db(db) {
        this._db = db;
    }
}

module.exports = Model;
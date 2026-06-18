const Context = require('./context');
const {toLine} = require('./utils/str');

/**
 * @typedef {import('../types').DbConfigItem} DbConfigItem
 * @typedef {import('../types').DbInstance} DbInstance
 * @typedef {import('../types').OkPacket} OkPacket
 * @typedef {import('../types').RowData} RowData
 * @typedef {import('../types').ListData} ListData
 * @typedef {import('../types').Where} Where
 * @typedef {import('../types').DbData} DbData
 * @typedef {import('../types').KoaCtx} KoaCtx
 */

/**
 * @extends Context
 */
class Model extends Context
{
    /**
     * Initialize a new `Model`
     * @public
     * @param {KoaCtx} ctx
     */
    constructor(ctx) {
        super(ctx);
        /**
         * @type {DbConfigItem}
         */
        // @ts-ignore
        this.connection = null;
        this.table = toLine(this.constructor.name);
        this.pk = 'id';
        this._db;
    }

    /**
     * 插入一条数据
     * @public
     * @param {DbData} data - 待插入数据
     * @returns {Promise<OkPacket>}
     */
    async add(data) {
        return await this.db.allowField().insert(data);
    }

    /**
     * 更新或插入一条数据
     * @public
     * @param {DbData} data - 更新或插入数据
     * @param {Where} [condition] - 更新条件，不为空或data包含主键则更新数据，否则插入数据
     * @returns {Promise<OkPacket>}
     */
    async save(data, condition = {}) {
        if(data[this.pk] || (condition && Object.keys(condition).length)) {
            if(data[this.pk]) {
                condition[this.pk] = data[this.pk];
                delete data[this.pk];
            }
            return await this.db.allowField().update(data, condition);
        }

        delete data[this.pk];
        return await this.add(data);
    }

    /**
     * 删除数据
     * @public
     * @param {Where} condition - 删除条件
     * @returns {Promise<OkPacket>}
     */
    async del(condition) {
        if(!condition || Object.keys(condition).length === 0) {
            throw new Error('condition is empty');
        }
        return await this.db.delete(condition);
    }

    /**
     * 查询一条数据
     * @public
     * @param {Where} [condition] - 查询条件
     * @returns {Promise<(RowData|null)>}
     */
    async get(condition) {
        return await this.db.find(condition);
    }

    /**
     * 查询多条数据
     * @public
     * @param {Where} [condition] - 查询条件
     * @returns {Promise<(ListData)>}
     */
    async all(condition) {
        return await this.db.select(condition);
    }

    /**
     * 数据库实例
     * @type {DbInstance}
     * @public
     * @returns {DbInstance}
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
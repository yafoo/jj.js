const Context = require('./context');
const {toLine} = require('./utils/str');

class Model extends Context
{
    constructor(ctx) {
        super(ctx);
        this.connection = null;
        this.table = toLine(this.constructor.name);
        this.pk = 'id';
    }

    async add(data) {
        return await this.db.allowField().insert(data);
    }

    async save(data, condition = {}) {
        if(data[this.pk] || Object.keys(condition).length) {
            if(data[this.pk] && !condition[this.pk]) {
                condition[this.pk] = data[this.pk];
            }
            return await this.db.allowField().update(data, condition);
        }

        delete data[this.pk];
        return await this.add(data);
    }

    async del(condition) {
        return await this.db.delete(condition);
    }

    async get(condition) {
        return await this.db.find(condition);
    }

    async all(condition) {
        return await this.db.select(condition);
    }

    //数据库实例
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
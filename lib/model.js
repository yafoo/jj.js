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

    //数据库实例
    get db() {
        if(!this._db){
            this._db = new (require('./db'))(this.ctx).table(this.table);
            this.connection && this._db.connect(this.connection);
        }
        return this._db;
    }

    set db(db) {
        this._db = db;
    }
}

module.exports = Model;
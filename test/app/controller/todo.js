const {Controller} = require('../../../jj.js');

class Todo extends Controller
{
    constructor(args) {
        super(args);
        this._db = new this.$db(this.ctx, 'sqlite');
        this._initArticleTable();
    }

    async _initArticleTable() {
        await this._db.execute(`
        CREATE TABLE IF NOT EXISTS jj_article (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL DEFAULT '',
            content TEXT NOT NULL DEFAULT '',
            add_time INT NOT NULL DEFAULT 0
        )`);
    }

    async index() {
        const list = await this._db.table('article').select();
        this.$assign('list', list);
        this.$fetch();
    }

    async add() {
        if(!this.$request.isPost()) {
            this.$assign('item', {});
            return this.$fetch('form');
        }

        const res = await this._db.table('article').insert({
            title: this.$request.post('title'),
            content: this.$request.post('content'),
            add_time: parseInt(Date.now() / 1000)
        });

        if(res) {
            this.$success('添加成功', 'index');
        } else {
            this.$error('添加失败');
        }
    }

    async edit() {
        if(!this.$request.isPost()) {
            const item = await this._db.table('article').where({id: this.$request.get('id')}).find();
            this.$assign('item', item);
            return this.$fetch('form');
        }

        const res = await this._db.table('article').where({id: this.$request.get('id')}).update({
            title: this.$request.post('title'),
            content: this.$request.post('content')
        });
        if(res) {
            this.$success('修改成功', 'index');
        } else {
            this.$error('修改失败');
        }
    }

    async del() {
        const res = await this._db.table('article').where({id: this.$request.get('id')}).delete();
        if(res) {
            this.$success('删除成功');
        } else {
            this.$error('删除失败');
        }
    }
}

module.exports = Todo;
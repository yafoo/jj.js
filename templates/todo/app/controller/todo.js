const { Controller } = require('jj.js');

class TodoController extends Controller {
    async index() {
        const db = this.$db;
        const todos = await db.table('todo').order('id desc').select();
        await this.$view.fetch('todo/index', { todos });
    }

    async add() {
        const title = this.$request.post('title');
        if (title) {
            const db = this.$db;
            await db.table('todo').insert({ title, completed: 0, add_time: Date.now() });
        }
        this.$redirect('/todo');
    }

    async toggle() {
        const id = this.$request.param('id');
        const completed = this.$request.param('completed');
        const db = this.$db;
        await db.table('todo').where({ id }).update({ completed: completed ? 0 : 1 });
        this.$redirect('/todo');
    }

    async delete() {
        const id = this.$request.param('id');
        const db = this.$db;
        await db.table('todo').where({ id }).delete();
        this.$redirect('/todo');
    }
}

module.exports = TodoController;

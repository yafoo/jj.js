const { Controller } = require('jj.js');

class TodoController extends Controller {
    async index() {
        const db = this.$db;
        // 确保表存在
        await db.execute(`
            CREATE TABLE IF NOT EXISTS todo_todo (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT '',
                completed INTEGER NOT NULL DEFAULT 0,
                add_time INTEGER NOT NULL DEFAULT 0
            )
        `);
        const todos = await db.table('todo').order('id', 'desc').select();
        this.$assign('todos', todos);
        await this.$fetch('todo/index');
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
        const id = this.$request.query('id');
        const completed = this.$request.query('completed', 0);
        const db = this.$db;
        await db.table('todo').where({ id }).update({ completed: completed ? 0 : 1 });
        this.$redirect('/todo');
    }

    async delete() {
        const id = this.$request.query('id');
        const db = this.$db;
        await db.table('todo').where({ id }).delete();
        this.$redirect('/todo');
    }
}

module.exports = TodoController;

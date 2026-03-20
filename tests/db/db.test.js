const { describe, it, after } = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const {App, Db} = require('../..')

describe('db', () => {
    it('db test', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            
            const db = new Db(ctx, 'sqlite')
            assert.strictEqual(db._config.type, 'sqlite', 'should has object _config')

            await db.execute(`
            CREATE TABLE IF NOT EXISTS jj_article (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT '',
                content TEXT NOT NULL DEFAULT '',
                add_time INT NOT NULL DEFAULT 0
            )`);
            assert.deepStrictEqual(await db.tableField('article'), ['id', 'title', 'content', ''], 'should has table field')
        })
        
        await request(app.callback()).get('/')
    })
    
    after(async () => {
        Db.cache.setIntervalTime(0)
    })
})
const { describe, it, after } = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const {App, Db} = require('../..')

describe('db', () => {
    it('should has basic properties', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            
            const db = new Db(ctx, 'sqlite')
            
            // 测试基础属性
            assert.strictEqual(db._table, '', 'should have empty _table initially')
            assert.strictEqual(typeof db._options, 'object', 'should have _options object')
            assert.strictEqual(db._queryStr, '', 'should have empty _queryStr initially')
            assert.strictEqual(typeof db._tableField, 'object', 'should have _tableField object')
            assert.strictEqual(typeof db._sql, 'object', 'should have _sql object')
            assert.strictEqual(db.sql, '', 'should have empty sql initially')
            assert.strictEqual(db._config.type, 'sqlite', 'should have _config object with correct type')
        })
        
        await request(app.callback()).get('/')
    })

    it('should have table field', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            
            const db = new Db(ctx, 'sqlite')

            await db.execute(`
            CREATE TABLE IF NOT EXISTS jj_article (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT '',
                content TEXT NOT NULL DEFAULT '',
                add_time INT NOT NULL DEFAULT 0
            )`);
            assert.deepStrictEqual(await db.tableField('article'), ['id', 'title', 'content', 'add_time'], 'should has table field')
        })
        
        await request(app.callback()).get('/')
    })

    it('should have basic methods', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            
            const db = new Db(ctx, 'sqlite')

            // 测试 table 方法
            assert.strictEqual(db.table('article')._table, 'article', 'should set table name')
            
            // 测试 prefix 方法
            assert.strictEqual(db.prefix('test_')._options.prefix, 'test_', 'should set table prefix')
            
            // 测试 distinct 方法
            assert.strictEqual(db.distinct()._options.distinct, 'distinct', 'should set distinct')
            
            // 测试 field 方法
            assert.strictEqual(db.field('id, title')._options.field.length, 2, 'should set field')
            
            // 测试 join 方法
            db.join('user', 'article.user_id = user.id', 'left')
            assert.strictEqual(Object.keys(db._options.join).length, 1, 'should set join')
            
            // 测试 where 方法
            assert.strictEqual(db.where({id: 1})._options.where.length, 1, 'should set where')
            
            // 测试 group 方法
            assert.strictEqual(db.group('add_time')._options.group, 'group by `add_time`', 'should set group')
            
            // 测试 having 方法
            assert.strictEqual(db.having('count(*) > 1')._options.having, 'having count(*) > 1', 'should set having')
            
            // 测试 order 方法
            assert.strictEqual(db.order('id', 'desc')._options.order.id, 'desc', 'should set order')
            
            // 测试 limit 方法
            assert.strictEqual(db.limit(0, 10)._options.limit, 'limit 0,10', 'should set limit')
            
            // 测试 page 方法
            db.page(1, 20)
            assert.strictEqual(db._options.limit, 'limit 0,20', 'should set limit by page')
            assert.strictEqual(db._options.page.page, 1, 'should set page')
            assert.strictEqual(db._options.page.pageSize, 20, 'should set page size')
            
            // 测试 reset 方法
            assert.strictEqual(db.reset()._table, 'article', 'should keep table name after reset')
            assert.strictEqual(db._options.field.length, 0, 'should reset field after reset')
        })
        
        await request(app.callback()).get('/')
    })

    it('should have query methods', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            
            const db = new Db(ctx, 'sqlite')

            // 先创建表并插入数据
            await db.execute(`
            CREATE TABLE IF NOT EXISTS jj_article (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT '',
                content TEXT NOT NULL DEFAULT '',
                add_time INT NOT NULL DEFAULT 0
            )`);

            // 插入测试数据
            await db.table('article').data({title: 'Test 1', content: 'Content 1', add_time: 1000}).insert()
            await db.table('article').data({title: 'Test 2', content: 'Content 2', add_time: 2000}).insert()
            await db.table('article').data({title: 'Test 3', content: 'Content 3', add_time: 3000}).insert()

            // 测试 select 方法
            const selectResult = await db.table('article').select()
            assert.strictEqual(selectResult.length, 3, 'should select all records')

            // 测试 find 方法
            const findResult = await db.table('article').where({id: 1}).find()
            assert.strictEqual(findResult.id, 1, 'should find record by id')

            // 测试 value 方法
            const valueResult = await db.table('article').where({id: 1}).value('title')
            assert.strictEqual(valueResult, 'Test 1', 'should get value by field')

            // 测试 count 方法
            const countResult = await db.table('article').count()
            assert.strictEqual(countResult, 3, 'should count all records')

            // 测试 max 方法
            const maxResult = await db.table('article').max('add_time')
            assert.strictEqual(maxResult, 3000, 'should get max value')

            // 测试 min 方法
            const minResult = await db.table('article').min('add_time')
            assert.strictEqual(minResult, 1000, 'should get min value')

            // 测试 avg 方法
            const avgResult = await db.table('article').avg('add_time')
            assert.strictEqual(avgResult, 2000, 'should get avg value')

            // 测试 sum 方法
            const sumResult = await db.table('article').sum('add_time')
            assert.strictEqual(sumResult, 6000, 'should get sum value')

            // 测试 column 方法
            const columnResult = await db.table('article').column('title')
            assert.deepStrictEqual(columnResult, ['Test 1', 'Test 2', 'Test 3'], 'should get column values')
        })
        
        await request(app.callback()).get('/')
    })

    it('should have modification methods', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            
            const db = new Db(ctx, 'sqlite')

            // 先创建表
            await db.execute(`
            CREATE TABLE IF NOT EXISTS jj_article (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT '',
                content TEXT NOT NULL DEFAULT '',
                add_time INT NOT NULL DEFAULT 0
            )`);

            // 清空表数据
            await db.execute('DELETE FROM jj_article')

            // 测试 insert 方法
            const insertResult = await db.table('article').data({title: 'Test Insert', content: 'Content Insert', add_time: 1000}).insert()
            assert.strictEqual(typeof insertResult.insertId, 'number', 'should insert record and return insertId')
            const insertedId = insertResult.insertId

            // 测试 update 方法
            const updateResult = await db.table('article').data({title: 'Test Update', content: 'Content Update'}).where({id: insertedId}).update()
            assert.strictEqual(updateResult.affectedRows, 1, 'should update record')

            // 测试 inc 方法
            const incResult = await db.table('article').where({id: insertedId}).inc('add_time', 500)
            assert.strictEqual(incResult.affectedRows, 1, 'should increment value')

            // 测试 dec 方法
            const decResult = await db.table('article').where({id: insertedId}).dec('add_time', 200)
            assert.strictEqual(decResult.affectedRows, 1, 'should decrement value')

            // 测试 exp 方法
            const expResult = await db.table('article').data({title: ['exp', 'UPPER(title)']}).where({id: insertedId}).update()
            assert.strictEqual(expResult.affectedRows, 1, 'should execute expression')

            // 测试 delete 方法
            const deleteResult = await db.table('article').where({id: insertedId}).delete()
            assert.strictEqual(deleteResult.affectedRows, 1, 'should delete record')

            // 验证删除结果
            const countResult = await db.table('article').count()
            assert.strictEqual(countResult, 0, 'should have no records after delete')
        })
        
        await request(app.callback()).get('/')
    })

    it('should have transaction methods', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            
            const db = new Db(ctx, 'sqlite')

            // 先创建表
            await db.execute(`
            CREATE TABLE IF NOT EXISTS jj_article (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT '',
                content TEXT NOT NULL DEFAULT '',
                add_time INT NOT NULL DEFAULT 0
            )`);

            // 清空表数据
            await db.execute('DELETE FROM jj_article')

            // 测试事务提交
            await db.startTrans(async () => {
                await db.table('article').data({title: 'Transaction Test 1', content: 'Content 1', add_time: 1000}).insert()
                await db.table('article').data({title: 'Transaction Test 2', content: 'Content 2', add_time: 2000}).insert()
            })

            // 验证事务提交结果
            let countResult = await db.table('article').count()
            assert.strictEqual(countResult, 2, 'should have 2 records after transaction commit')

            // 测试事务回滚
            try {
                await db.startTrans(async () => {
                    await db.table('article').data({title: 'Transaction Test 3', content: 'Content 3', add_time: 3000}).insert()
                    // 抛出错误，触发回滚
                    throw new Error('Test rollback')
                })
            } catch (error) {
                // 忽略测试错误
            }

            // 验证事务回滚结果
            countResult = await db.table('article').count()
            assert.strictEqual(countResult, 2, 'should still have 2 records after transaction rollback')
        })
        
        await request(app.callback()).get('/')
    })

    it('should have cache methods', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            
            const db = new Db(ctx, 'sqlite')

            // 测试 setCache 方法
            db.setCache('test_key', 'test_value', 60)
            
            // 测试 getCache 方法
            const cachedValue = db.getCache('test_key')
            assert.strictEqual(cachedValue, 'test_value', 'should get cached value')
            
            // 测试 deleteCache 方法
            db.deleteCache('test_key')
            const deletedValue = db.getCache('test_key')
            assert.strictEqual(deletedValue, undefined, 'should delete cached value')
            
            // 测试 cache 方法
            const cacheResult = db.cache(60)
            assert.strictEqual(cacheResult._options.cache_time, 60, 'should set cache time')
        })
        
        await request(app.callback()).get('/')
    })

    it('should have other methods', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            
            const db = new Db(ctx, 'sqlite')

            // 测试 getSql 方法
            const getSqlResult = db.getSql(true)
            assert.strictEqual(getSqlResult._options.getSql, true, 'should set getSql to true')
            
            // 测试 allowField 方法
            const allowFieldResult = db.allowField(['id', 'title'])
            assert.deepStrictEqual(allowFieldResult._options.allowField, ['id', 'title'], 'should set allowField')
            
            // 测试 data 方法
            const dataResult = db.data({title: 'Test', content: 'Content'})
            assert.deepStrictEqual(dataResult._options.data, {title: 'Test', content: 'Content'}, 'should set data')
            
            // 测试 pagination 方法
            await db.execute(`
            CREATE TABLE IF NOT EXISTS jj_article (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT '',
                content TEXT NOT NULL DEFAULT '',
                add_time INT NOT NULL DEFAULT 0
            )`);

            // 插入测试数据
            for (let i = 1; i <= 5; i++) {
                await db.table('article').data({title: `Test ${i}`, content: `Content ${i}`, add_time: i * 1000}).insert()
            }

            // 测试 pagination 方法
            const [paginationResult, pagination] = await db.table('article').page(1, 2).pagination()
            assert.strictEqual(paginationResult.length, 2, 'should get 2 records per page')
            assert.strictEqual(typeof pagination.total(), 'number', 'should return total as number')
            assert.strictEqual(pagination.total() >= 5, true, 'should have at least 5 records')
        })
        
        await request(app.callback()).get('/')
    })
    
    after(async () => {
        Db.cache.setIntervalTime(0)
    })
})
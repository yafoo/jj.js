const { describe, it, beforeEach, afterEach, after } = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const {App, Db, config} = require('../..')

describe('Db 类测试', () => {
    let appDebug
    beforeEach(() => {
        // 保存原始配置
        appDebug = config.app.app_debug
        // 关闭SQL日志输出
        config.app.app_debug = false
    })

    afterEach(() => {
        // 恢复原始配置
        config.app.app_debug = appDebug
    })

    // 所有测试结束后清理定时器
    after(() => {
        Db.cache.setIntervalTime(0)
    })

    it('应该具有基础属性', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            
            const db = new Db(ctx, 'sqlite')
            
            // 测试基础属性
            assert.strictEqual(db._table, '', '初始 _table 应该为空')
            assert.strictEqual(typeof db._options, 'object', '应该具有 _options 对象')
            assert.strictEqual(db._queryStr, '', '初始 _queryStr 应该为空')
            assert.strictEqual(typeof db._sql, 'object', '应该具有 _sql 对象')
            assert.strictEqual(db.sql, '', '初始 sql 应该为空')
            assert.strictEqual(db._config.type, 'sqlite', '应该具有正确的数据库类型')
        })
        
        await request(app.callback()).get('/')
    })

    it('应该能够获取表字段', async () => {
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
            assert.deepStrictEqual(await db.tableField('article'), ['id', 'title', 'content', 'add_time'], '应该能够获取表字段')
        })
        
        await request(app.callback()).get('/')
    })

    it('应该具有基础方法', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            
            const db = new Db(ctx, 'sqlite')

            // 测试 table 方法
            assert.strictEqual(db.table('article')._table, 'article', '应该设置表名')
            
            // 测试 prefix 方法
            assert.strictEqual(db.prefix('test_')._options.prefix, 'test_', '应该设置表前缀')
            
            // 测试 distinct 方法
            assert.strictEqual(db.distinct()._options.distinct, 'distinct', '应该设置 distinct')
            
            // 测试 field 方法
            assert.strictEqual(db.field('id, title')._options.field.length, 2, '应该设置查询字段')
            
            // 测试 join 方法
            db.join('user', 'article.user_id = user.id', 'left')
            assert.strictEqual(Object.keys(db._options.join).length, 1, '应该设置表连接')
            
            // 测试 where 方法
            assert.strictEqual(db.where({id: 1})._options.where.length, 1, '应该设置查询条件')
            
            // 测试 group 方法
            assert.strictEqual(db.group('add_time')._options.group, 'group by `add_time`', '应该设置分组')
            
            // 测试 having 方法
            assert.strictEqual(db.having('count(*) > 1')._options.having, 'having count(*) > 1', '应该设置 having')
            
            // 测试 order 方法
            assert.strictEqual(db.order('id', 'desc')._options.order.id, 'desc', '应该设置排序')
            
            // 测试 limit 方法
            assert.strictEqual(db.limit(0, 10)._options.limit, 'limit 0,10', '应该限制数量')
            
            // 测试 page 方法
            db.page(1, 20)
            assert.strictEqual(db._options.limit, 'limit 0,20', '应该按分页设置限制')
            assert.strictEqual(db._options.page.page, 1, '应该设置页码')
            assert.strictEqual(db._options.page.pageSize, 20, '应该设置每页数量')
            
            // 测试 reset 方法
            assert.strictEqual(db.reset()._table, 'article', 'reset 后应该保留表名')
            assert.strictEqual(db._options.field.length, 0, 'reset 后应该清空字段')
        })
        
        await request(app.callback()).get('/')
    })

    it('应该具有查询方法', async () => {
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
            assert.strictEqual(selectResult.length, 3, '应该查询所有记录')

            // 测试 find 方法
            const findResult = await db.table('article').where({id: 1}).find()
            assert.strictEqual(findResult.id, 1, '应该根据 id 查询记录')

            // 测试 value 方法
            const valueResult = await db.table('article').where({id: 1}).value('title')
            assert.strictEqual(valueResult, 'Test 1', '应该获取字段值')

            // 测试 count 方法
            const countResult = await db.table('article').count()
            assert.strictEqual(countResult, 3, '应该统计所有记录')

            // 测试 max 方法
            const maxResult = await db.table('article').max('add_time')
            assert.strictEqual(maxResult, 3000, '应该获取最大值')

            // 测试 min 方法
            const minResult = await db.table('article').min('add_time')
            assert.strictEqual(minResult, 1000, '应该获取最小值')

            // 测试 avg 方法
            const avgResult = await db.table('article').avg('add_time')
            assert.strictEqual(avgResult, 2000, '应该获取平均值')

            // 测试 sum 方法
            const sumResult = await db.table('article').sum('add_time')
            assert.strictEqual(sumResult, 6000, '应该获取总和')

            // 测试 column 方法
            const columnResult = await db.table('article').column('title')
            assert.deepStrictEqual(columnResult, ['Test 1', 'Test 2', 'Test 3'], '应该获取列数据')
        })
        
        await request(app.callback()).get('/')
    })

    it('应该具有数据修改方法', async () => {
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
            assert.strictEqual(typeof insertResult.insertId, 'number', '应该插入记录并返回 insertId')
            const insertedId = insertResult.insertId

            // 测试 update 方法
            const updateResult = await db.table('article').data({title: 'Test Update', content: 'Content Update'}).where({id: insertedId}).update()
            assert.strictEqual(updateResult.affectedRows, 1, '应该更新记录')

            // 测试 inc 方法
            const incResult = await db.table('article').where({id: insertedId}).inc('add_time', 500)
            assert.strictEqual(incResult.affectedRows, 1, '应该增加字段值')

            // 测试 dec 方法
            const decResult = await db.table('article').where({id: insertedId}).dec('add_time', 200)
            assert.strictEqual(decResult.affectedRows, 1, '应该减少字段值')

            // 测试 exp 方法
            const expResult = await db.table('article').data({title: ['exp', 'UPPER(title)']}).where({id: insertedId}).update()
            assert.strictEqual(expResult.affectedRows, 1, '应该执行表达式')

            // 测试 delete 方法
            const deleteResult = await db.table('article').where({id: insertedId}).delete()
            assert.strictEqual(deleteResult.affectedRows, 1, '应该删除记录')

            // 验证删除结果
            const countResult = await db.table('article').count()
            assert.strictEqual(countResult, 0, '删除后应该没有记录')
        })
        
        await request(app.callback()).get('/')
    })

    it('应该具有事务方法', async () => {
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
            assert.strictEqual(countResult, 2, '事务提交后应该有 2 条记录')

            // 测试事务回滚
            try {
                await db.startTrans(async () => {
                    await db.table('article').data({title: 'Transaction Test 3', content: 'Content 3', add_time: 3000}).insert()
                    // 抛出错误，触发回滚
                    throw new Error('测试回滚')
                })
            } catch (error) {
                // 忽略测试错误
            }

            // 验证事务回滚结果
            countResult = await db.table('article').count()
            assert.strictEqual(countResult, 2, '事务回滚后应该仍然只有 2 条记录')
        })
        
        await request(app.callback()).get('/')
    })

    it('应该具有缓存方法', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            
            const db = new Db(ctx, 'sqlite')

            // 测试 cache 方法（设置缓存时间）
            const cacheResult = db.withCache(60)
            assert.strictEqual(cacheResult._options.cache_time, 60, '应该设置缓存时间')
            
            // 测试 cache 实例属性
            assert.ok(db._$cache, '应该具有 _$cache 实例属性')
            assert.strictEqual(typeof db._$cache.set, 'function', 'cache 应该有 set 方法')
            assert.strictEqual(typeof db._$cache.get, 'function', 'cache 应该有 get 方法')
            assert.strictEqual(typeof db._$cache.delete, 'function', 'cache 应该有 delete 方法')
            
            // 测试缓存功能
            db._$cache.set('test_key', 'test_value', 60)
            const cachedValue = db._$cache.get('test_key')
            assert.strictEqual(cachedValue, 'test_value', '应该获取缓存值')
            
            db._$cache.delete('test_key')
            const deletedValue = db._$cache.get('test_key')
            assert.strictEqual(deletedValue, undefined, '应该删除缓存值')
        })
        
        await request(app.callback()).get('/')
    })

    it('应该具有其他方法', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            
            const db = new Db(ctx, 'sqlite')

            // 测试 getSql 方法
            const getSqlResult = db.getSql(true)
            assert.strictEqual(getSqlResult._options.getSql, true, '应该设置 getSql 为 true')
            
            // 测试 allowField 方法
            const allowFieldResult = db.allowField(['id', 'title'])
            assert.deepStrictEqual(allowFieldResult._options.allowField, ['id', 'title'], '应该设置字段过滤')
            
            // 测试 data 方法
            const dataResult = db.data({title: 'Test', content: 'Content'})
            assert.deepStrictEqual(dataResult._options.data, {title: 'Test', content: 'Content'}, '应该设置数据')
            
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
            const [paginationResult, pagination] = await db.table('article').page(1, 2).paginate()
            assert.strictEqual(paginationResult.length, 2, '每页应该获取 2 条记录')
            assert.strictEqual(typeof pagination.total(), 'number', '应该返回数字类型的总数')
            assert.strictEqual(pagination.total() >= 5, true, '应该至少有 5 条记录')
        })
        
        await request(app.callback()).get('/')
    })
})
const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const {App, Db, config} = require('../..')

describe('MongoDB 驱动测试', () => {
    let appDebug
    let db

    before(async () => {
        // 保存原始配置
        appDebug = config.app.app_debug
        // 关闭SQL日志输出
        config.app.app_debug = false
    })

    after(async () => {
        // 恢复原始配置
        config.app.app_debug = appDebug
        // 关闭数据库连接
        if (db) {
            await db.close()
        }
        Db.cache.setIntervalTime(0)
    })

    it('应该能够连接MongoDB', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            db = new Db(ctx, 'mongodb')
            // 等待连接完成
            await db._connectPromise
            assert.ok(db._sql, '应该创建sql实例')
            // @ts-ignore
            assert.ok(db._sql._db, '应该创建数据库连接')
        })
        
        await request(app.callback()).get('/')
    })

    it('应该能够插入数据', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            db = new Db(ctx, 'mongodb')
            
            // 插入测试数据
            const result = await db.table('article').data({
                title: 'MongoDB Test 1',
                content: 'Content 1',
                add_time: 1000
            }).insert()
            
            assert.ok(result.insertId, '应该返回insertId')
            assert.strictEqual(result.affectedRows, 1, '应该影响1行')
        })
        
        await request(app.callback()).get('/')
    })

    it('应该能够批量插入数据', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            db = new Db(ctx, 'mongodb')
            
            // 插入多条测试数据
            await db.table('article').data({
                title: 'MongoDB Test 2',
                content: 'Content 2',
                add_time: 2000
            }).insert()
            
            await db.table('article').data({
                title: 'MongoDB Test 3',
                content: 'Content 3',
                add_time: 3000
            }).insert()
            
            // 验证数据数量
            const count = await db.table('article').count()
            assert.ok(count >= 3, '应该至少有3条记录')
        })
        
        await request(app.callback()).get('/')
    })

    it('应该能够查询数据', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            db = new Db(ctx, 'mongodb')
            
            // 查询所有数据
            const list = await db.table('article').select()
            assert.ok(Array.isArray(list), '应该返回数组')
            assert.ok(list.length >= 3, '应该至少有3条记录')
            
            // 测试find方法
            const item = await db.table('article').where({title: 'MongoDB Test 1'}).find()
            assert.ok(item, '应该找到记录')
            assert.strictEqual(item.title, 'MongoDB Test 1', '标题应该匹配')
        })
        
        await request(app.callback()).get('/')
    })

    it('应该能够更新数据', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            db = new Db(ctx, 'mongodb')
            
            // 先查询一条记录
            const item = await db.table('article').where({title: 'MongoDB Test 1'}).find()
            assert.ok(item, '应该找到记录')
            
            // 更新数据
            const result = await db.table('article').data({
                title: 'MongoDB Test Updated'
            }).where({title: 'MongoDB Test 1'}).update()
            
            assert.strictEqual(result.affectedRows, 1, '应该更新1条记录')
            
            // 验证更新结果
            const updated = await db.table('article').where({title: 'MongoDB Test Updated'}).find()
            assert.ok(updated, '应该找到更新后的记录')
            assert.strictEqual(updated.title, 'MongoDB Test Updated', '标题应该已更新')
        })
        
        await request(app.callback()).get('/')
    })

    it('应该能够删除数据', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            db = new Db(ctx, 'mongodb')
            
            // 先查询记录数
            const countBefore = await db.table('article').count()
            
            // 删除一条记录
            const result = await db.table('article').where({title: 'MongoDB Test Updated'}).delete()
            assert.strictEqual(result.affectedRows, 1, '应该删除1条记录')
            
            // 验证删除结果
            const countAfter = await db.table('article').count()
            assert.strictEqual(countAfter, countBefore - 1, '记录数应该减少1')
        })
        
        await request(app.callback()).get('/')
    })

    it('应该能够使用排序和限制', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            db = new Db(ctx, 'mongodb')
            
            // 测试排序
            const listDesc = await db.table('article').order('add_time', 'desc').select()
            assert.ok(listDesc.length >= 2, '应该有多条记录')
            assert.ok(listDesc[0].add_time >= listDesc[1].add_time, '应该按add_time降序排列')
            
            // 测试limit
            const limited = await db.table('article').limit(0, 2).select()
            assert.strictEqual(limited.length, 2, '应该只返回2条记录')
        })
        
        await request(app.callback()).get('/')
    })

    it('应该能够清理测试数据', async () => {
        const app = new App(async (ctx, next) => {
            ctx.body = 'ok'
            db = new Db(ctx, 'mongodb')
            
            // 删除所有测试数据
            const result = await db.table('article').where({title: ['like', '%MongoDB Test%']}).delete()
            assert.ok(result.affectedRows >= 0, '应该执行删除操作')
        })
        
        await request(app.callback()).get('/')
    })
})

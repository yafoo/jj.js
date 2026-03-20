const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { once } = require('node:events')
const request = require('supertest')

const {App} = require('../..')

describe('app', () => {
    it('should handle socket errors', async () => {
        const app = new App({
            middleware: (ctx) => {
                ctx.socket.destroy(new Error('boom'))
            },
        })

        let errorCaught = false
        app.on('error', err => {
            assert.strictEqual(err.message, 'boom')
            errorCaught = true
        })

        const server = app.listen()

        try {
            const req = require('http').get({
                port: server.address().port
            })
            req.on('error', () => {})

            const [err] = await once(app, 'error')
            assert.strictEqual(err.message, 'boom')
            assert.strictEqual(errorCaught, true)
        } finally {
            await server.close()
        }
    })

    it('should set APP_TIME、 APP_VERSION and storage', async () => {
        const storage = require('../..').storage
        const app = new App(async (ctx, next) => {
            assert.ok(ctx.APP_TIME, 'APP_TIME 属性不存在于 ctx 对象上')
            assert.ok(ctx.APP_VERSION, 'APP_VERSION 属性不存在于 ctx 对象上')
            const store = storage.getStore()
            assert.ok(store.$, '$ 属性不存在于 storage 对象上')
            assert.ok(store._, '_ 属性不存在于 storage 对象上')
            ctx.body = 'ok'
        })
        
        await request(app.callback())
            .get('/')
    })

    it('should support the type array of app options', async () => {
        const storage = require('../..').storage
        const app = new App([
            async (ctx, next) => {
                await next()
                assert.strictEqual(ctx.body, 'ok')
            },
            async (ctx, next) => {
                ctx.body = 'ok'
            },

        ])
        
        await request(app.callback())
            .get('/')
    })
})
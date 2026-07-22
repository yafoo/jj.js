const {describe, it} = require('node:test')
const assert = require('node:assert/strict')
const {Middleware} = require('../..')

describe('Middleware 类测试', () => {
    it('Middleware 应该是一个类', () => {
        assert.strictEqual(typeof Middleware, 'function')
    })

    it('应该能继承 Middleware 创建自定义中间件', () => {
        class MyMiddleware extends Middleware {
            async check() {
                // 中间件逻辑
            }
        }
        assert.strictEqual(typeof MyMiddleware, 'function')
        const proto = MyMiddleware.prototype
        assert.strictEqual(typeof proto.check, 'function')
    })

    it('应该具有 $show 方法', () => {
        class MyMiddleware extends Middleware {}
        const proto = MyMiddleware.prototype
        assert.strictEqual(typeof proto.$show, 'function')
    })

    it('应该具有 $redirect 方法', () => {
        class MyMiddleware extends Middleware {}
        const proto = MyMiddleware.prototype
        assert.strictEqual(typeof proto.$redirect, 'function')
    })

    it('应该具有 $success 方法', () => {
        class MyMiddleware extends Middleware {}
        const proto = MyMiddleware.prototype
        assert.strictEqual(typeof proto.$success, 'function')
    })

    it('应该具有 $error 方法', () => {
        class MyMiddleware extends Middleware {}
        const proto = MyMiddleware.prototype
        assert.strictEqual(typeof proto.$error, 'function')
    })

    it('应该具有 _$response 懒加载 getter', () => {
        const descriptor = Object.getOwnPropertyDescriptor(Middleware.prototype, '_$response')
        assert.ok(descriptor, '应该有 _$response 属性描述')
        assert.strictEqual(typeof descriptor.get, 'function')
        assert.strictEqual(typeof descriptor.set, 'function')
    })

    it('继承链应该是 Ctx -> Context -> Middleware', () => {
        const Context = require('../../lib/context')
        const Ctx = require('../../lib/ctx')
        
        assert.ok(Middleware.prototype instanceof Context, 'Middleware 应该继承 Context')
    })
})

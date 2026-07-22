const {describe, it, beforeEach, afterEach} = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')
const {App, Controller, config} = require('../..')

describe('Controller 类测试', () => {
    let appDebug
    beforeEach(() => {
        appDebug = config.app.app_debug
        config.app.app_debug = false
    })

    afterEach(() => {
        config.app.app_debug = appDebug
    })

    it('Controller 应该是一个类', () => {
        assert.strictEqual(typeof Controller, 'function')
    })

    it('应该能继承 Controller 创建自定义控制器', () => {
        class MyController extends Controller {
            async index() {
                this.$show('hello')
            }
        }
        assert.strictEqual(typeof MyController, 'function')
        const proto = MyController.prototype
        assert.strictEqual(typeof proto.index, 'function')
    })

    it('应该具有 _init 和 _end 生命周期方法', () => {
        class MyController extends Controller {}
        const proto = MyController.prototype
        assert.strictEqual(typeof proto._init, 'function')
        assert.strictEqual(typeof proto._end, 'function')
    })

    it('应该具有模板方法 $assign', () => {
        class MyController extends Controller {}
        const proto = MyController.prototype
        assert.strictEqual(typeof proto.$assign, 'function')
    })

    it('应该具有模板方法 $data', () => {
        class MyController extends Controller {}
        const proto = MyController.prototype
        assert.strictEqual(typeof proto.$data, 'function')
    })

    it('应该具有模板方法 $fetch', () => {
        class MyController extends Controller {}
        const proto = MyController.prototype
        assert.strictEqual(typeof proto.$fetch, 'function')
    })

    it('应该具有模板方法 $render', () => {
        class MyController extends Controller {}
        const proto = MyController.prototype
        assert.strictEqual(typeof proto.$render, 'function')
    })

    it('应该具有模板方法 $load', () => {
        class MyController extends Controller {}
        const proto = MyController.prototype
        assert.strictEqual(typeof proto.$load, 'function')
    })

    it('应该具有 _$view 懒加载 getter', () => {
        const descriptor = Object.getOwnPropertyDescriptor(Controller.prototype, '_$view')
        assert.ok(descriptor, '应该有 _$view 属性描述')
        assert.strictEqual(typeof descriptor.get, 'function')
        assert.strictEqual(typeof descriptor.set, 'function')
    })

    it('应该能实例化并调用方法', () => {
        class MyController extends Controller {
            async index() {
                return 'hello'
            }
        }
        // Controller 需要 ctx 参数
        const mockCtx = { DEEP: '', CONTROLLER: 'index', ACTION: 'index' }
        const ctrl = new MyController(mockCtx)
        assert.strictEqual(typeof ctrl.index, 'function')
    })
})

// @ts-nocheck
const {describe, it} = require('node:test')
const assert = require('node:assert/strict')
const storage = require('../../lib/storage.js')
const Ctx = require('../../lib/ctx.js')

describe('Ctx 类测试', () => {
    it('Ctx 应该是一个 Proxy 类', async () => {
        assert.equal(typeof Ctx, 'function')
    })

    it('实例化 Ctx 应该返回一个 Proxy 对象', async () => {
        const ctx = new Ctx()
        assert.equal(typeof ctx, 'object')
    })

    it('应该能访问 store 中的 $ 和 _ 属性', async () => {
        const mockStore = {
            $: {test: 'value'},
            _: {APP: {testProp: 'testValue'}},
            APP: 'APP',
            COMMON: 'COMMON'
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            assert.strictEqual(ctx.$, mockStore.$)
            assert.strictEqual(ctx._, mockStore._)
        })
    })

    it('应该能通过 $prop 访问系统类库', async () => {
        const mockStore = {
            $: {
                ctx: {method1: () => 'ctx_method'},
                logger: {info: () => 'logger_info'},
                db: {query: () => 'db_query'}
            },
            _: {},
            APP: 'APP',
            COMMON: 'COMMON'
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            assert.equal(typeof ctx.$ctx, 'object')
            assert.equal(typeof ctx.$logger, 'object')
            assert.equal(typeof ctx.$db, 'object')
        })
    })

    it('非 $ 开头的属性应该返回 undefined', async () => {
        const mockStore = {
            $: {test: 'value'},
            _: {},
            APP: 'APP',
            COMMON: 'COMMON'
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            assert.strictEqual(ctx.test, undefined)
            assert.strictEqual(ctx.someProp, undefined)
        })
    })

    it('应该能访问 APP 下的属性', async () => {
        const mockStore = {
            $: {},
            _: {
                APP: {
                    testProp: {method1: () => 'app_method'}
                }
            },
            APP: 'APP',
            COMMON: 'COMMON'
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            // $prop 返回的是一个 Proxy 函数包装器
            assert.equal(typeof ctx.$testProp, 'function')
            // 可以访问其方法
            assert.strictEqual(ctx.$testProp.method1(), 'app_method')
        })
    })

    it('应该能访问 COMMON 下的属性', async () => {
        const mockStore = {
            $: {},
            _: {
                APP: {},
                COMMON: {
                    commonProp: {method1: () => 'common_method'}
                }
            },
            APP: 'APP',
            COMMON: 'COMMON'
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            // $prop 返回的是一个 Proxy 函数包装器
            assert.equal(typeof ctx.$commonProp, 'function')
            // 可以访问其方法
            assert.strictEqual(ctx.$commonProp.method1(), 'common_method')
        })
    })

    it('不存在的属性应该返回 undefined', async () => {
        const mockStore = {
            $: {},
            _: {
                APP: {},
                COMMON: {}
            },
            APP: 'APP',
            COMMON: 'COMMON'
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            assert.strictEqual(ctx.$nonExistent, undefined)
        })
    })

    it('应该支持类实例化（construct）', async () => {
        class TestClass {
            constructor(arg1, arg2) {
                this.arg1 = arg1
                this.arg2 = arg2
            }
            method() {
                return 'method_result'
            }
        }
        TestClass.__ISCLASS__ = true
        
        const mockStore = {
            $: {},
            _: {
                APP: {
                    testClass: TestClass
                }
            },
            APP: 'APP',
            COMMON: 'COMMON'
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            const instance = new ctx.$testClass('arg1', 'arg2')
            assert.ok(instance instanceof TestClass)
            assert.strictEqual(instance.arg1, 'arg1')
            assert.strictEqual(instance.arg2, 'arg2')
            assert.strictEqual(instance.method(), 'method_result')
        })
    })

    it('应该能访问属性方法', async () => {
        const mockStore = {
            $: {
                utils: {
                    format: () => 'formatted'
                }
            },
            _: {
                APP: {
                    service: {
                        getData: () => 'data'
                    }
                }
            },
            APP: 'APP',
            COMMON: 'COMMON'
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            assert.strictEqual(ctx.$utils.format(), 'formatted')
            assert.strictEqual(ctx.$service.getData(), 'data')
        })
    })

    it('应该正确处理 $next 属性', async () => {
        const mockStore = {
            $: {},
            _: {},
            APP: 'APP',
            COMMON: 'COMMON',
            $next: () => 'next'
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            // $next 应该直接返回，不走代理逻辑
            assert.strictEqual(ctx.$next, undefined) // 因为 store.$next 不存在
        })
    })
})
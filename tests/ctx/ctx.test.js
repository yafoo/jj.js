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

    it('应该能访问 store 中的 $ 和 $$ 属性', async () => {
        const mockStore = {
            $: {test: 'value'},
            $$: {testProp: {method1: () => 'testValue'}},
            $config: {app: {app_debug: true}},
            DEEP: ''
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            assert.strictEqual(ctx.$, mockStore.$)
            assert.strictEqual(ctx.$$, mockStore.$$)
        })
    })

    it('应该能通过 $prop 访问系统类库', async () => {
        const mockStore = {
            $: {
                ctx: {method1: () => 'ctx_method'},
                logger: {info: () => 'logger_info'},
                db: {query: () => 'db_query'}
            },
            $$: {},
            $config: null,
            DEEP: ''
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
            $$: {},
            $config: null,
            DEEP: ''
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            assert.strictEqual(ctx.test, undefined)
            assert.strictEqual(ctx.someProp, undefined)
        })
    })

    it('应该能访问 $$ 根级的属性', async () => {
        const mockStore = {
            $: {},
            $$: {
                testProp: {method1: () => 'root_method'}
            },
            $config: null,
            DEEP: ''
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            assert.equal(typeof ctx.$testProp, 'object')
            assert.strictEqual(ctx.$testProp.method1(), 'root_method')
        })
    })

    it('应该支持 DEEP 向上继承查找', async () => {
        const mockStore = {
            $: {},
            $$: {
                rootProp: {method1: () => 'root_method'},
                admin: {
                    adminProp: {method1: () => 'admin_method'}
                }
            },
            $config: null,
            DEEP: 'admin'
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            assert.equal(typeof ctx.$adminProp, 'object')
            assert.strictEqual(ctx.$adminProp.method1(), 'admin_method')
            assert.equal(typeof ctx.$rootProp, 'object')
            assert.strictEqual(ctx.$rootProp.method1(), 'root_method')
        })
    })

    it('深层 DEEP 应该正确向上遍历', async () => {
        const mockStore = {
            $: {},
            $$: {
                rootProp: {method1: () => 'root_method'},
                api: {
                    v1: {
                        v1Prop: {method1: () => 'v1_method'}
                    }
                }
            },
            $config: null,
            DEEP: 'api/v1'
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            assert.equal(typeof ctx.$v1Prop, 'object')
            assert.strictEqual(ctx.$v1Prop.method1(), 'v1_method')
            assert.equal(typeof ctx.$rootProp, 'object')
            assert.strictEqual(ctx.$rootProp.method1(), 'root_method')
        })
    })

    it('不存在的属性应该返回 undefined', async () => {
        const mockStore = {
            $: {},
            $$: {},
            $config: null,
            DEEP: ''
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
            $$: {
                testClass: TestClass
            },
            $config: null,
            DEEP: ''
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
            $$: {
                service: {
                    getData: () => 'data'
                }
            },
            $config: null,
            DEEP: ''
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            assert.strictEqual(ctx.$utils.format(), 'formatted')
            assert.strictEqual(ctx.$service.getData(), 'data')
        })
    })

    it('应该正确处理 DEEP 属性', async () => {
        const mockStore = {
            $: {},
            $$: {},
            $config: null,
            DEEP: 'admin'
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            assert.strictEqual(ctx.DEEP, undefined)
        })
    })

    it('应该正确处理 $next 属性', async () => {
        const mockStore = {
            $: {},
            $$: {},
            $config: null,
            DEEP: '',
            $next: () => 'next'
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            assert.strictEqual(ctx.$next, undefined)
        })
    })

    it('应该正确处理 ctx 属性', async () => {
        const mockStore = {
            $: {},
            $$: {},
            $config: null,
            DEEP: ''
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            assert.strictEqual(ctx.ctx, undefined)
        })
    })

    it('$config 应该能通过 $config 访问', async () => {
        const mockStore = {
            $: {},
            $$: {},
            $config: {app: {app_debug: true}},
            DEEP: ''
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            assert.equal(typeof ctx.$config, 'object')
        })
    })

    it('子级属性应该优先于根级属性', async () => {
        const mockStore = {
            $: {},
            $$: {
                myProp: {method1: () => 'root_method'},
                admin: {
                    myProp: {method1: () => 'admin_method'}
                }
            },
            $config: null,
            DEEP: 'admin'
        }
        
        storage.run(mockStore, () => {
            const ctx = new Ctx()
            assert.strictEqual(ctx.$myProp.method1(), 'admin_method')
        })
    })
})

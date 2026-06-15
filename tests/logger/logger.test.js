const { describe, it, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const Logger = require('../..').Logger

describe('Logger 类测试', () => {
    // 保存原始的 handle 和配置
    let originalAppDebug
    let originalHandle
    let originalLogLevel

    beforeEach(() => {
        // 保存原始配置
        originalAppDebug = Logger.appDebug
        originalHandle = Logger.handle
        originalLogLevel = Logger.cfgLog.log_level
    })

    afterEach(() => {
        // 恢复原始配置
        Logger.appDebug = originalAppDebug
        Logger.setHandle(originalHandle)
        Logger.cfgLog.log_level = originalLogLevel
    })

    describe('基础日志方法', () => {
        it('应该具有 system 方法', () => {
            assert.strictEqual(typeof Logger.system, 'function')
        })

        it('应该具有 error 方法', () => {
            assert.strictEqual(typeof Logger.error, 'function')
        })

        it('应该具有 warning 方法', () => {
            assert.strictEqual(typeof Logger.warning, 'function')
        })

        it('应该具有 info 方法', () => {
            assert.strictEqual(typeof Logger.info, 'function')
        })

        it('应该具有 debug 方法', () => {
            assert.strictEqual(typeof Logger.debug, 'function')
        })

        it('应该具有 sql 方法', () => {
            assert.strictEqual(typeof Logger.sql, 'function')
        })

        it('应该具有 http 方法', () => {
            assert.strictEqual(typeof Logger.http, 'function')
        })

        it('应该具有 log 方法', () => {
            assert.strictEqual(typeof Logger.log, 'function')
        })
    })

    describe('日志输出', () => {
        it('应该能够输出 system 日志', () => {
            let capturedLevel
            let capturedArgs

            Logger.setHandle((level, ...args) => {
                capturedLevel = level
                capturedArgs = args
            })

            Logger.system('系统启动', { port: 3000 })
            assert.strictEqual(capturedLevel, 'system')
            assert.deepStrictEqual(capturedArgs, ['系统启动', { port: 3000 }])
        })

        it('应该能够输出 error 日志', () => {
            let capturedLevel
            /** @type {any[]} */
            let capturedArgs

            Logger.setHandle((level, ...args) => {
                capturedLevel = level
                capturedArgs = args
            })

            Logger.error('错误信息', new Error('测试错误'))
            assert.strictEqual(capturedLevel, 'error')
            assert.strictEqual(capturedArgs[0], '错误信息')
            assert.ok(capturedArgs[1] instanceof Error)
        })

        it('应该能够输出 warning 日志', () => {
            let capturedLevel
            let capturedArgs

            Logger.setHandle((level, ...args) => {
                capturedLevel = level
                capturedArgs = args
            })

            Logger.warning('警告信息')
            assert.strictEqual(capturedLevel, 'warning')
            assert.deepStrictEqual(capturedArgs, ['警告信息'])
        })

        it('应该能够输出 info 日志', () => {
            let capturedLevel
            let capturedArgs

            Logger.setHandle((level, ...args) => {
                capturedLevel = level
                capturedArgs = args
            })

            Logger.info('普通信息', { userId: 123 })
            assert.strictEqual(capturedLevel, 'info')
            assert.deepStrictEqual(capturedArgs, ['普通信息', { userId: 123 }])
        })

        it('应该能够输出 debug 日志', () => {
            let capturedLevel
            let capturedArgs

            Logger.setHandle((level, ...args) => {
                capturedLevel = level
                capturedArgs = args
            })

            Logger.debug('调试信息', { data: [1, 2, 3] })
            assert.strictEqual(capturedLevel, 'debug')
            assert.deepStrictEqual(capturedArgs, ['调试信息', { data: [1, 2, 3] }])
        })

        it('应该能够输出 sql 日志', () => {
            let capturedLevel
            let capturedArgs

            Logger.setHandle((level, ...args) => {
                capturedLevel = level
                capturedArgs = args
            })

            Logger.sql('SELECT * FROM user WHERE id = 1')
            assert.strictEqual(capturedLevel, 'sql')
            assert.deepStrictEqual(capturedArgs, ['SELECT * FROM user WHERE id = 1'])
        })

        it('应该能够输出 http 日志', () => {
            let capturedLevel
            let capturedArgs

            Logger.setHandle((level, ...args) => {
                capturedLevel = level
                capturedArgs = args
            })

            Logger.http('GET /user/list - 200 - 50ms')
            assert.strictEqual(capturedLevel, 'http')
            assert.deepStrictEqual(capturedArgs, ['GET /user/list - 200 - 50ms'])
        })
    })

    describe('log 方法', () => {
        it('应该支持自定义级别', () => {
            let capturedLevel
            let capturedArgs

            Logger.setHandle((level, ...args) => {
                capturedLevel = level
                capturedArgs = args
            })

            Logger.log('custom', '自定义日志')
            assert.strictEqual(capturedLevel, 'custom')
            assert.deepStrictEqual(capturedArgs, ['自定义日志'])
        })

        it('默认级别应该是 info', () => {
            let capturedLevel

            Logger.setHandle((level, ...args) => {
                capturedLevel = level
            })

            Logger.log()
            assert.strictEqual(capturedLevel, 'info')
        })

        it('应该支持多个参数', () => {
            /** @type {any[]} */
            let capturedArgs

            Logger.setHandle((level, ...args) => {
                capturedArgs = args
            })

            Logger.log('info', '参数1', '参数2', { key: 'value' }, [1, 2, 3])
            assert.strictEqual(capturedArgs.length, 4)
            assert.deepStrictEqual(capturedArgs, ['参数1', '参数2', { key: 'value' }, [1, 2, 3]])
        })
    })

    describe('日志级别控制', () => {
        it('调试模式下应该输出所有日志', () => {
            let callCount = 0

            Logger.appDebug = true
            Logger.cfgLog.log_level = []
            Logger.setHandle(() => {
                callCount++
            })

            Logger.system('system')
            Logger.error('error')
            Logger.warning('warning')
            Logger.info('info')
            Logger.debug('debug')
            Logger.sql('sql')
            Logger.http('http')

            assert.strictEqual(callCount, 7)
        })

        it('非调试模式下应该只输出配置的日志级别', () => {
            let capturedLevels = []

            Logger.appDebug = false
            Logger.cfgLog.log_level = ['error', 'warning']
            Logger.setHandle((level) => {
                capturedLevels.push(level)
            })

            Logger.system('system')    // 不输出
            Logger.error('error')      // 输出
            Logger.warning('warning')  // 输出
            Logger.info('info')        // 不输出
            Logger.debug('debug')      // 不输出
            Logger.sql('sql')          // 不输出
            Logger.http('http')        // 不输出

            assert.deepStrictEqual(capturedLevels, ['error', 'warning'])
        })

        it('应该支持空日志级别配置', () => {
            let callCount = 0

            Logger.appDebug = false
            Logger.cfgLog.log_level = []
            Logger.setHandle(() => {
                callCount++
            })

            Logger.error('error')
            assert.strictEqual(callCount, 0)
        })
    })

    describe('setHandle 方法', () => {
        it('应该能够设置自定义 handle', () => {
            let customHandleCalled = false

            const customHandle = (level, ...args) => {
                customHandleCalled = true
            }

            Logger.setHandle(customHandle)
            Logger.info('测试')

            assert.strictEqual(customHandleCalled, true)
        })

        it('应该返回 Logger 类本身以支持链式调用', () => {
            const result = Logger.setHandle(() => {})
            assert.strictEqual(result, Logger)
        })

        it('传入非函数应该使用默认 handle', () => {
            let callCount = 0
            const originalHandle = Logger.cfgLog.log_handle

            // 临时替换默认 handle
            Logger.cfgLog.log_handle = () => {
                callCount++
            }

            // @ts-ignore
            Logger.setHandle('not a function')
            Logger.info('测试')

            assert.strictEqual(callCount, 1)

            // 恢复
            Logger.cfgLog.log_handle = originalHandle
        })
    })

    describe('子类隔离', () => {
        it('应该能够创建独立的 Logger 子类', () => {
            let childHandleCalled = false
            let parentHandleCalled = false

            const childHandle = () => {
                childHandleCalled = true
            }

            const parentHandle = () => {
                parentHandleCalled = true
            }

            // 创建子类
            /** @type {Logger} */
            // @ts-ignore
            const ChildLogger = new Logger(childHandle)
            
            // 设置父类 handle
            Logger.setHandle(parentHandle)

            // 子类应该使用自己的 handle
            ChildLogger.info('子类日志')
            assert.strictEqual(childHandleCalled, true)
            assert.strictEqual(parentHandleCalled, false)

            // 父类应该使用父类的 handle
            Logger.info('父类日志')
            assert.strictEqual(parentHandleCalled, true)
        })

        it('子类应该独立配置', () => {
            /** @type {string[]} */
            let capturedLevels = []

            /** @type {Logger} */
            // @ts-ignore
            const ChildLogger = new Logger((level, ...args) => {
                capturedLevels.push(level)
            })

            // 子类输出日志
            ChildLogger.appDebug = false
            ChildLogger.cfgLog.log_level = ['error']
            ChildLogger.error('error')
            ChildLogger.info('info')

            assert.deepStrictEqual(capturedLevels, ['error'])
        })

        it('应该支持创建多个独立的子类', () => {
            let child1Calls = 0
            let child2Calls = 0

            /** @type {Logger} */
            // @ts-ignore
            const ChildLogger1 = new Logger(() => {
                child1Calls++
            })

            /** @type {Logger} */
            // @ts-ignore
            const ChildLogger2 = new Logger(() => {
                child2Calls++
            })

            ChildLogger1.info('child1')
            ChildLogger1.info('child1')
            ChildLogger2.info('child2')

            assert.strictEqual(child1Calls, 2)
            assert.strictEqual(child2Calls, 1)
        })

        it('不传 handle 应该使用默认 handle', () => {
            /** @type {Logger} */
            // @ts-ignore
            const ChildLogger = new Logger()
            // 不应该报错
            assert.strictEqual(typeof ChildLogger.info, 'function')
        })
    })

    describe('复杂数据类型', () => {
        it('应该能够输出对象类型日志', () => {
            /** @type {any[]} */
            let capturedArgs

            Logger.setHandle((level, ...args) => {
                capturedArgs = args
            })

            const complexObj = {
                string: '字符串',
                number: 123,
                boolean: true,
                null: null,
                array: [1, 2, 3],
                nested: {
                    key: 'value'
                }
            }

            Logger.info('复杂对象', complexObj)
            assert.strictEqual(capturedArgs[0], '复杂对象')
            assert.deepStrictEqual(capturedArgs[1], complexObj)
        })

        it('应该能够输出函数类型日志', () => {
            /** @type {any[]} */
            let capturedArgs

            Logger.setHandle((level, ...args) => {
                capturedArgs = args
            })

            const fn = function test() { return 'test' }
            Logger.info('函数', fn)
            assert.strictEqual(capturedArgs[1], fn)
        })

        it('应该能够输出 Symbol 类型日志', () => {
            /** @type {any[]} */
            let capturedArgs

            Logger.setHandle((level, ...args) => {
                capturedArgs = args
            })

            const sym = Symbol('test')
            Logger.info('Symbol', sym)
            assert.strictEqual(capturedArgs[1], sym)
        })

        it('应该能够输出大数组日志', () => {
            /** @type {any[]} */
            let capturedArgs

            Logger.setHandle((level, ...args) => {
                capturedArgs = args
            })

            const largeArray = Array.from({ length: 1000 }, (_, i) => i)
            Logger.info('大数组', largeArray)
            assert.strictEqual(capturedArgs[1].length, 1000)
        })
    })

    describe('边界情况', () => {
        it('应该支持空参数', () => {
            /** @type {any[]} */
            let capturedArgs

            Logger.setHandle((level, ...args) => {
                capturedArgs = args
            })

            Logger.info()
            assert.deepStrictEqual(capturedArgs, [])
        })

        it('应该支持 undefined 和 null 参数', () => {
            /** @type {any[]} */
            let capturedArgs

            Logger.setHandle((level, ...args) => {
                capturedArgs = args
            })

            Logger.info(undefined, null)
            assert.strictEqual(capturedArgs[0], undefined)
            assert.strictEqual(capturedArgs[1], null)
        })

        it('应该支持特殊字符', () => {
            /** @type {any[]} */
            let capturedArgs
        
            Logger.setHandle((level, ...args) => {
                capturedArgs = args
            })
        
            Logger.info('包含特殊字符: !@#$%^&*()_+-=[]{}|;:\'\",.<>?/`~')
            assert.strictEqual(capturedArgs[0], '包含特殊字符: !@#$%^&*()_+-=[]{}|;:\'\",.<>?/`~')
        })

        it('应该支持 Unicode 字符', () => {
            /** @type {any[]} */
            let capturedArgs

            Logger.setHandle((level, ...args) => {
                capturedArgs = args
            })

            Logger.info('中文日志', '日本語', '한국어', '🎉🚀✨')
            assert.strictEqual(capturedArgs[0], '中文日志')
            assert.strictEqual(capturedArgs[1], '日本語')
            assert.strictEqual(capturedArgs[2], '한국어')
            assert.strictEqual(capturedArgs[3], '🎉🚀✨')
        })

        it('应该支持连续快速输出', () => {
            let callCount = 0

            Logger.setHandle(() => {
                callCount++
            })

            for(let i = 0; i < 100; i++) {
                Logger.info(`日志 ${i}`)
            }

            assert.strictEqual(callCount, 100)
        })
    })
})

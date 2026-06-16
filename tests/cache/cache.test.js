const { describe, it, beforeEach, afterEach, after } = require('node:test')
const assert = require('node:assert/strict')
const Cache = require('../..').Cache

describe('Cache 类测试', () => {
    // 每个测试前清理缓存
    beforeEach(() => {
        Cache.delete()
    })

    // 所有测试结束后清理定时器
    after(() => {
        Cache.setIntervalTime(0)
    })

    describe('基础功能', () => {
        it('应该能够设置和获取缓存', () => {
            Cache.set('key1', 'value1')
            assert.strictEqual(Cache.get('key1'), 'value1')
        })

        it('应该支持各种数据类型', () => {
            Cache.set('string', 'hello')
            Cache.set('number', 123)
            Cache.set('boolean', true)
            Cache.set('object', { name: 'test' })
            Cache.set('array', [1, 2, 3])
            Cache.set('null', null)
            Cache.set('undefined', undefined)

            assert.strictEqual(Cache.get('string'), 'hello')
            assert.strictEqual(Cache.get('number'), 123)
            assert.strictEqual(Cache.get('boolean'), true)
            assert.deepStrictEqual(Cache.get('object'), { name: 'test' })
            assert.deepStrictEqual(Cache.get('array'), [1, 2, 3])
            assert.strictEqual(Cache.get('null'), null)
            assert.strictEqual(Cache.get('undefined'), undefined)
        })

        it('应该能够更新已存在的缓存', () => {
            Cache.set('key', 'value1')
            assert.strictEqual(Cache.get('key'), 'value1')

            Cache.set('key', 'value2')
            assert.strictEqual(Cache.get('key'), 'value2')
        })
    })

    describe('缓存过期', () => {
        it('应该在过期后返回 undefined', (t, done) => {
            Cache.set('expire_key', 'value', 1) // 1秒过期

            assert.strictEqual(Cache.get('expire_key'), 'value')

            setTimeout(() => {
                assert.strictEqual(Cache.get('expire_key'), undefined)
                done()
            }, 1100)
        })

        it('has 方法应该正确处理过期缓存', (t, done) => {
            Cache.set('has_key', 'value', 1)

            assert.strictEqual(Cache.has('has_key'), true)

            setTimeout(() => {
                assert.strictEqual(Cache.has('has_key'), false)
                done()
            }, 1100)
        })

        it('应该支持长时间缓存', () => {
            Cache.set('long_key', 'value', 3600) // 1小时
            assert.strictEqual(Cache.get('long_key'), 'value')
            assert.strictEqual(Cache.has('long_key'), true)
        })

        it('应该使用默认过期时间', () => {
            Cache.set('default_key', 'value')
            // 默认时间很长，不会立即过期
            assert.strictEqual(Cache.get('default_key'), 'value')
        })
    })

    describe('删除功能', () => {
        it('应该能够删除指定的缓存', () => {
            Cache.set('key1', 'value1')
            Cache.set('key2', 'value2')

            Cache.delete('key1')

            assert.strictEqual(Cache.get('key1'), undefined)
            assert.strictEqual(Cache.get('key2'), 'value2')
        })

        it('删除不存在的缓存不应该报错', () => {
            assert.doesNotThrow(() => {
                Cache.delete('non_existent_key')
            })
        })

        it('应该能够清空所有缓存', () => {
            Cache.set('key1', 'value1')
            Cache.set('key2', 'value2')
            Cache.set('key3', 'value3')

            Cache.delete()

            assert.strictEqual(Cache.get('key1'), undefined)
            assert.strictEqual(Cache.get('key2'), undefined)
            assert.strictEqual(Cache.get('key3'), undefined)
        })
    })

    describe('has 方法', () => {
        it('应该对存在的缓存返回 true', () => {
            Cache.set('exists_key', 'value')
            assert.strictEqual(Cache.has('exists_key'), true)
        })

        it('应该对不存在的缓存返回 false', () => {
            assert.strictEqual(Cache.has('not_exists_key'), false)
        })

        it('应该对过期缓存返回 false', (t, done) => {
            Cache.set('expire_has', 'value', 1)
            assert.strictEqual(Cache.has('expire_has'), true)

            setTimeout(() => {
                assert.strictEqual(Cache.has('expire_has'), false)
                done()
            }, 1100)
        })
    })

    describe('size 方法', () => {
        it('应该返回有效缓存的数量', () => {
            Cache.set('key1', 'value1')
            Cache.set('key2', 'value2')
            Cache.set('key3', 'value3')

            assert.strictEqual(Cache.size(), 3)
        })

        it('应该过滤已过期的缓存', (t, done) => {
            Cache.set('key1', 'value1', 10)
            Cache.set('key2', 'value2', 1)
            Cache.set('key3', 'value3', 10)

            assert.strictEqual(Cache.size(), 3)

            setTimeout(() => {
                // key2 已过期，应该返回 2
                assert.strictEqual(Cache.size(), 2)
                done()
            }, 1100)
        })

        it('空缓存应该返回 0', () => {
            assert.strictEqual(Cache.size(), 0)
        })
    })

    describe('keys 方法', () => {
        it('应该返回所有有效缓存的键', () => {
            Cache.set('key1', 'value1')
            Cache.set('key2', 'value2')
            Cache.set('key3', 'value3')

            const keys = Cache.keys()
            assert.strictEqual(keys.length, 3)
            assert.ok(keys.includes('key1'))
            assert.ok(keys.includes('key2'))
            assert.ok(keys.includes('key3'))
        })

        it('应该过滤已过期的缓存', (t, done) => {
            Cache.set('key1', 'value1', 10)
            Cache.set('key2', 'value2', 1)
            Cache.set('key3', 'value3', 10)

            setTimeout(() => {
                const keys = Cache.keys()
                assert.strictEqual(keys.length, 2)
                assert.ok(keys.includes('key1'))
                assert.ok(keys.includes('key3'))
                assert.ok(!keys.includes('key2'))
                done()
            }, 1100)
        })

        it('空缓存应该返回空数组', () => {
            const keys = Cache.keys()
            assert.deepStrictEqual(keys, [])
        })
    })

    describe('获取所有缓存', () => {
        it('get 不传参数应该返回整个 Map', () => {
            Cache.set('key1', 'value1')
            Cache.set('key2', 'value2')

            const allCache = Cache.get()
            assert.ok(allCache instanceof Map)
            assert.strictEqual(allCache.size, 2)
        })
    })

    describe('子类隔离', () => {
        it('应该为每个子类创建独立的缓存', () => {
            /**
             * @type {typeof Cache}
             */
            // @ts-ignore
            const ChildCache1 = new Cache()
            /**
             * @type {typeof Cache}
             */
            // @ts-ignore
            const ChildCache2 = new Cache()

            // 子类应该有独立的 cache
            assert.ok(ChildCache1.cache !== Cache.cache)
            assert.ok(ChildCache2.cache !== Cache.cache)
            assert.ok(ChildCache1.cache !== ChildCache2.cache)
        })

        it('子类应该能够独立使用缓存', () => {
            /**
             * @type {typeof Cache}
             */
            // @ts-ignore
            const ChildCache = new Cache()

            ChildCache.set('child_key', 'child_value')

            assert.strictEqual(ChildCache.get('child_key'), 'child_value')
            // 父类的 cache 不受影响
            assert.strictEqual(Cache.get('child_key'), undefined)
        })

        it('子类应该独立过期', (t, done) => {
            /**
             * @type {typeof Cache}
             */
            // @ts-ignore
            const ChildCache = new Cache()

            ChildCache.set('expire_child', 'value', 1)
            assert.strictEqual(ChildCache.get('expire_child'), 'value')

            setTimeout(() => {
                assert.strictEqual(ChildCache.get('expire_child'), undefined)
                // 父类的缓存不受影响
                Cache.set('parent_key', 'parent_value', 10)
                assert.strictEqual(Cache.get('parent_key'), 'parent_value')
                done()
            }, 1100)
        })
    })

    describe('边界情况', () => {
        it('应该支持空字符串作为键', () => {
            Cache.set('', 'empty_key_value')
            assert.strictEqual(Cache.get(''), 'empty_key_value')
        })

        it('应该支持特殊字符作为键', () => {
            Cache.set('key-with-dash', 'value1')
            Cache.set('key_with_underscore', 'value2')
            Cache.set('key.with.dot', 'value3')
            Cache.set('key:with:colon', 'value4')

            assert.strictEqual(Cache.get('key-with-dash'), 'value1')
            assert.strictEqual(Cache.get('key_with_underscore'), 'value2')
            assert.strictEqual(Cache.get('key.with.dot'), 'value3')
            assert.strictEqual(Cache.get('key:with:colon'), 'value4')
        })

        it('过期时间为 0 应该使用默认时间', () => {
            Cache.set('zero_time', 'value', 0)
            // 0 会被替换为默认时间，不会立即过期
            assert.strictEqual(Cache.get('zero_time'), 'value')
        })

        it('应该能够连续设置和获取', () => {
            for(let i = 0; i < 100; i++) {
                Cache.set(`key_${i}`, `value_${i}`)
            }

            for(let i = 0; i < 100; i++) {
                assert.strictEqual(Cache.get(`key_${i}`), `value_${i}`)
            }

            assert.strictEqual(Cache.size(), 100)
        })
    })

    describe('自动清理', () => {
        it('get 方法应该自动清理过期缓存', (t, done) => {
            Cache.set('auto_clean', 'value', 1)

            setTimeout(() => {
                Cache.get('auto_clean') // 触发清理
                // 缓存已被删除
                assert.strictEqual(Cache.has('auto_clean'), false)
                done()
            }, 1100)
        })

        it('has 方法应该自动清理过期缓存', (t, done) => {
            Cache.set('has_clean', 'value', 1)

            setTimeout(() => {
                Cache.has('has_clean') // 触发清理
                // 缓存已被删除
                assert.strictEqual(Cache.cache.has('has_clean'), false)
                done()
            }, 1100)
        })

        it('size 方法应该自动清理过期缓存', (t, done) => {
            Cache.set('size_clean1', 'value1', 1)
            Cache.set('size_clean2', 'value2', 1)
            Cache.set('size_clean3', 'value3', 10)

            setTimeout(() => {
                Cache.size() // 触发清理
                // 已过期的应该被删除
                assert.strictEqual(Cache.cache.has('size_clean1'), false)
                assert.strictEqual(Cache.cache.has('size_clean2'), false)
                assert.strictEqual(Cache.cache.has('size_clean3'), true)
                done()
            }, 1100)
        })

        it('keys 方法应该自动清理过期缓存', (t, done) => {
            Cache.set('keys_clean1', 'value1', 1)
            Cache.set('keys_clean2', 'value2', 10)

            setTimeout(() => {
                Cache.keys() // 触发清理
                assert.strictEqual(Cache.cache.has('keys_clean1'), false)
                assert.strictEqual(Cache.cache.has('keys_clean2'), true)
                done()
            }, 1100)
        })
    })
})

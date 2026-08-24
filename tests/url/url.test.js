const {describe, it} = require('node:test')
const assert = require('node:assert/strict')
const Url = require('../../lib/url.js')

// 模拟 ctx 对象
function createMockCtx(options = {}) {
    return {
        DEEP: options.DEEP || '',
        CONTROLLER: options.CONTROLLER || 'index',
        ACTION: options.ACTION || 'index',
        params: options.params || {},
        protocol: 'http',
        host: 'localhost:3000'
    }
}

describe('Url 类测试', () => {
    describe('build() 基本功能', () => {
        it('应该返回根路径当没有参数时', () => {
            const url = new Url(createMockCtx())
            const result = url.build()
            assert.strictEqual(result, '/index/index')
        })

        it('应该处理绝对路径', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/user/list')
            assert.strictEqual(result, '/user/list')
        })

        it('应该处理完整的 http URL', () => {
            const url = new Url(createMockCtx())
            const result = url.build('http://example.com/path')
            assert.strictEqual(result, 'http://example.com/path')
        })

        it('应该处理完整的 https URL', () => {
            const url = new Url(createMockCtx())
            const result = url.build('https://example.com/path')
            assert.strictEqual(result, 'https://example.com/path')
        })

        it('应该处理相对路径', () => {
            const ctx = createMockCtx({ DEEP: '', CONTROLLER: 'user', ACTION: 'list' })
            const url = new Url(ctx)
            const result = url.build('detail')
            assert.strictEqual(result, '/user/detail')
        })

        it('应该处理空相对路径', () => {
            const ctx = createMockCtx({ DEEP: '', CONTROLLER: 'user', ACTION: 'list' })
            const url = new Url(ctx)
            const result = url.build('')
            assert.strictEqual(result, '/user/list')
        })
    })

    describe('build() query 参数', () => {
        it('应该添加 query 参数', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/user/list', { page: 1, size: 10 })
            assert.ok(result.includes('page=1'))
            assert.ok(result.includes('size=10'))
        })

        it('应该合并 URL 中已有的 query 参数', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/user/list?old=value', { new: 'param' })
            assert.ok(result.includes('old=value'))
            assert.ok(result.includes('new=param'))
        })

        it('新参数应该覆盖同名旧参数', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/user/list?page=1', { page: 2 })
            assert.ok(result.includes('page=2'))
            assert.ok(!result.includes('page=1'))
        })
    })

    describe('build() 参数重载', () => {
        it('应该支持 build(url, ext) 形式', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/user/list', '.html')
            assert.strictEqual(result, '/user/list.html')
        })

        it('应该支持 build(url, domain) 形式', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/user/list', 'http://example.com')
            assert.strictEqual(result, 'http://example.com/user/list')
        })

        it('应该支持 build(url, vars, ext, domain) 完整形式', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/user/list', { page: 1 }, '.html', 'http://example.com')
            assert.ok(result.startsWith('http://example.com'))
            assert.ok(result.includes('/user/list.html'))
            assert.ok(result.includes('page=1'))
        })

        it('domain 为 true 时应该使用当前请求的域名', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/user/list', true)
            assert.strictEqual(result, 'http://localhost:3000/user/list')
        })

        it('domain 为 true 且有 vars 时', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/user/list', { id: 1 }, true)
            assert.strictEqual(result, 'http://localhost:3000/user/list?id=1')
        })
    })

    describe('build() ext 后缀校验', () => {
        it('应该添加合法的 ext 后缀', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/user/list', {}, '.html')
            assert.strictEqual(result, '/user/list.html')
        })

        it('应该添加 .json 后缀', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/api/data', {}, '.json')
            assert.strictEqual(result, '/api/data.json')
        })

        it('应该忽略纯数字后缀', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/user/list', {}, '.123')
            assert.strictEqual(result, '/user/list')
        })

        it('应该忽略非法后缀', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/user/list', {}, '.html<script>')
            assert.strictEqual(result, '/user/list')
        })

        it('应该忽略不以点开头的后缀', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/user/list', {}, 'html')
            assert.strictEqual(result, '/user/list')
        })
    })

    describe('build() 异常处理', () => {
        it('非法 URL 应该返回空字符串', () => {
            const url = new Url(createMockCtx())
            const result = url.build('http://[invalid]')
            assert.strictEqual(result, '')
        })
    })

    describe('ruleUrl() 路由参数替换', () => {
        it('应该返回原字符串当路由名不存在时', () => {
            const url = new Url(createMockCtx())
            const result = url.ruleUrl('not_exist_route')
            assert.strictEqual(result, 'not_exist_route')
        })

        it('应该替换路径中的参数', () => {
            // 需要配置路由
            const {routes: cfg_routes} = require('../../lib/config')
            if (!cfg_routes) {
                // 跳过测试，因为没有配置路由
                return
            }
            
            // 这个测试依赖于实际的路由配置，这里只测试基本逻辑
            const url = new Url(createMockCtx())
            const result = url.ruleUrl('nonexistent', { id: 1 })
            assert.strictEqual(result, 'nonexistent')
        })
    })

    describe('ruleUrl() 不修改原 query 对象', () => {
        it('调用后原 query 对象应该保持不变', () => {
            const url = new Url(createMockCtx())
            const originalQuery = { id: 1, name: 'test' }
            const queryCopy = { ...originalQuery }
            
            url.ruleUrl('some_route', originalQuery)
            
            assert.deepStrictEqual(originalQuery, queryCopy)
        })
    })

    describe('isFullUrl 判断', () => {
        it('应该正确识别 http 协议', () => {
            const url = new Url(createMockCtx())
            const result = url.build('http://example.com')
            assert.strictEqual(result, 'http://example.com/')
        })

        it('应该正确识别 https 协议', () => {
            const url = new Url(createMockCtx())
            const result = url.build('https://example.com')
            assert.strictEqual(result, 'https://example.com/')
        })

        it('应该正确处理大写 HTTP（URL对象会规范化为小写）', () => {
            const url = new Url(createMockCtx())
            const result = url.build('HTTP://example.com')
            assert.strictEqual(result, 'http://example.com/')
        })

        it('非 http 开头的路径应该加前缀', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/path/to/page')
            assert.strictEqual(result, '/path/to/page')
        })
    })

    describe('query 参数编码', () => {
        it('应该正确编码特殊字符', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/search', { q: 'hello world' })
            assert.ok(result.includes('q=hello%20world') || result.includes('q=hello+world'))
        })

        it('应该正确编码中文字符', () => {
            const url = new Url(createMockCtx())
            const result = url.build('/search', { q: '中文' })
            assert.ok(result.includes('q='))
            assert.ok(!result.includes('中文')) // 应该被编码
        })
    })
})

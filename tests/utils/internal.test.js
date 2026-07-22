const {describe, it} = require('node:test')
const assert = require('node:assert/strict')
const {toCamelCase, toUnderScore, pathToRouteInfo, getViewPath, getUrlPath, pathToMiddlewareInfo, pathToDeep} = require('../../lib/utils/internal.js')

describe('internal 工具函数测试', () => {
    describe('toCamelCase 驼峰转换', () => {
        it('应该将下划线命名转为驼峰', () => {
            assert.strictEqual(toCamelCase('user_name'), 'userName')
            assert.strictEqual(toCamelCase('get_user_info'), 'getUserInfo')
        })

        it('应该处理单个下划线', () => {
            assert.strictEqual(toCamelCase('a_b'), 'aB')
        })

        it('没有下划线应该保持不变', () => {
            assert.strictEqual(toCamelCase('username'), 'username')
            assert.strictEqual(toCamelCase('index'), 'index')
        })

        it('空字符串应该返回空字符串', () => {
            assert.strictEqual(toCamelCase(''), '')
        })
    })

    describe('toUnderScore 下划线转换', () => {
        it('应该将驼峰命名转为下划线', () => {
            assert.strictEqual(toUnderScore('userName'), 'user_name')
            assert.strictEqual(toUnderScore('getUserInfo'), 'get_user_info')
        })

        it('应该处理单个大写字母', () => {
            assert.strictEqual(toUnderScore('aB'), 'a_b')
        })

        it('没有大写字母应该保持不变', () => {
            assert.strictEqual(toUnderScore('username'), 'username')
            assert.strictEqual(toUnderScore('index'), 'index')
        })

        it('空字符串应该返回空字符串', () => {
            assert.strictEqual(toUnderScore(''), '')
        })
    })

    describe('pathToRouteInfo 路由解析', () => {
        it('应该解析基本路径', () => {
            const result = pathToRouteInfo('user/list', '', 'index', 'index')
            assert.strictEqual(result.CONTROLLER, 'user')
            assert.strictEqual(result.ACTION, 'list')
            assert.strictEqual(result.DEEP, '')
        })

        it('应该解析带子级的路径', () => {
            const result = pathToRouteInfo('admin/user/list', '', 'index', 'index')
            assert.strictEqual(result.DEEP, 'admin')
            assert.strictEqual(result.CONTROLLER, 'user')
            assert.strictEqual(result.ACTION, 'list')
        })

        it('应该解析多层子级路径', () => {
            const result = pathToRouteInfo('api/v1/user/list', '', 'index', 'index')
            assert.strictEqual(result.DEEP, 'api/v1')
            assert.strictEqual(result.CONTROLLER, 'user')
            assert.strictEqual(result.ACTION, 'list')
        })

        it('空路径应该使用默认值', () => {
            const result = pathToRouteInfo('', 'admin', 'index', 'index')
            assert.strictEqual(result.DEEP, 'admin')
            assert.strictEqual(result.CONTROLLER, 'index')
            assert.strictEqual(result.ACTION, 'index')
        })

        it('只有控制器应该使用默认方法', () => {
            const result = pathToRouteInfo('user', '', 'index', 'index')
            assert.strictEqual(result.CONTROLLER, 'user')
            assert.strictEqual(result.ACTION, 'index')
        })

        it('应该将驼峰转为下划线', () => {
            const result = pathToRouteInfo('userList/detail', '', 'index', 'index')
            assert.strictEqual(result.CONTROLLER, 'user_list')
            assert.strictEqual(result.ACTION, 'detail')
        })
    })

    describe('pathToDeep 路径深度解析', () => {
        const baseDir = '/project'
        
        it('应该解析根级深度', () => {
            const result = pathToDeep('/project/app/controller', baseDir)
            assert.strictEqual(result, 'controller')
        })

        it('应该解析子级深度', () => {
            const result = pathToDeep('/project/app/admin/controller', baseDir)
            assert.strictEqual(result, 'admin/controller')
        })

        it('应该解析多层子级深度', () => {
            const result = pathToDeep('/project/app/api/v1/controller', baseDir)
            assert.strictEqual(result, 'api/v1/controller')
        })

        it('app 根目录应该返回空字符串', () => {
            const result = pathToDeep('/project/app', baseDir)
            assert.strictEqual(result, '')
        })
    })

    describe('getUrlPath URL 路径生成', () => {
        it('应该生成基本 URL 路径', () => {
            const result = getUrlPath('', '', 'index', 'index')
            assert.strictEqual(result, 'index/index')
        })

        it('应该生成带子级的 URL 路径', () => {
            const result = getUrlPath('', 'admin', 'user', 'list')
            assert.strictEqual(result, 'admin/user/list')
        })

        it('应该支持自定义路径', () => {
            const result = getUrlPath('detail', '', 'user', 'index')
            assert.strictEqual(result, 'user/detail')
        })
    })

    describe('pathToMiddlewareInfo 中间件路径解析', () => {
        it('应该解析基本中间件路径', () => {
            const result = pathToMiddlewareInfo('auth/check', '', 'index', 'index')
            assert.strictEqual(result.MIDDLEWARE, 'auth')
            assert.strictEqual(result.ACTION, 'check')
        })

        it('应该解析带子级的中间件路径', () => {
            const result = pathToMiddlewareInfo('admin/auth/check', 'admin', 'index', 'index')
            assert.strictEqual(result.DEEPS.length, 1)
            assert.strictEqual(result.MIDDLEWARE, 'auth')
            assert.strictEqual(result.ACTION, 'check')
        })
    })

    describe('getViewPath 模板路径生成', () => {
        it('应该生成基本模板路径', () => {
            const result = getViewPath('', '', 'index', 'index', 'view', '/', '.htm')
            assert.strictEqual(result, 'view/index/index.htm')
        })

        it('应该生成带子级的模板路径', () => {
            const result = getViewPath('', 'admin', 'user', 'list', 'view', '/', '.htm')
            assert.strictEqual(result, 'admin/view/user/list.htm')
        })

        it('应该支持自定义分隔符', () => {
            const result = getViewPath('', '', 'index', 'index', 'view', '_', '.htm')
            assert.strictEqual(result, 'view/index_index.htm')
        })
    })
})

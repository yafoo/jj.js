const {describe, it} = require('node:test')
const assert = require('node:assert/strict')

const loader = require('../../lib/loader.js')
const node = loader('./dir', 'value1', ['value2'], () => {return 'value3'})

describe('loader 函数测试', () => {
    it('node 应该是对象', async () => {
        assert.equal(typeof node, 'object')
    })

    it('应该具有 node.__NODE__ 属性', async () => {
        assert.equal(typeof node.__NODE__, 'object')
        assert.equal(node.__NODE__.path, require('path').join(__dirname, './dir/'))
        assert.equal(node.__NODE__.type, 'dir')
    })

    it('应该具有 node.child1.__NODE__ 属性', async () => {
        assert.equal(typeof node.child1, 'object')
        assert.equal(node.child1.__NODE__.path, node.__NODE__.path + 'child1/')
        assert.equal(node.child1.__NODE__.type, 'dir')
    })

    it('应该具有 node.child2 属性', async () => {
        assert.equal(typeof node.child2, 'object')
        assert.strictEqual(node.child2, node.child2)
    })

    it('node.child3 类型应该是 file', async () => {
        assert.equal(node.child3.__NODE__.type, 'file')
    })

    it('node.child3 应该支持读写', async () => {
        assert.strictEqual(node.child3, node.child3)
        assert.strictEqual(node.child3.data, 0)
        node.child3.data = 1
        assert.strictEqual(node.child3.data, 1)
        node.child3.data++
        assert.strictEqual(node.child3.data, 2)
        const newData = {data: 3}
        node.child3 = newData
        assert.strictEqual(node.child3, newData)
        assert.strictEqual(node.child3.__NODE__, undefined)
    })

    it('node.child4 不应该是 json 类型', async () => {
        assert.strictEqual(node.child4.__NODE__.type, 'file')
        assert.strictEqual(node.child4.data, 0)
    })

    it('node.child5 应该是 json 类型', async () => {
        assert.strictEqual(node.child5.__NODE__.type, 'json')
        assert.strictEqual(node.child5.data, 5)
    })

    it('node.child6.class 应该是 class 类型', async () => {
        assert.strictEqual(typeof node.child6.class, 'function')
        assert.strictEqual(node.child6.class.__NODE__.type, 'class')
        assert.strictEqual(node.child6.class, node.child6.class)
        assert.strictEqual(new node.child6.class().index(), 'index')
        assert.strictEqual(node.child6.class.empty, undefined)
    })

    it('node.child6.class 应该自动实例化', async () => {
        assert.strictEqual(typeof node.child6.class.index, 'function')
        assert.strictEqual(node.child6.class.index, node.child6.class.index)
        assert.strictEqual(node.child6.class.index, node.child6.class.__NODE__.instance.index)
        assert.strictEqual(node.child6.class.__NODE__.instance, node.child6.class.__NODE__.instance)
        assert.strictEqual(node.child6.class.arg1, 'value1')
        assert.strictEqual(node.child6.class.arg2[0], 'value2')
        assert.strictEqual(node.child6.class.arg3(), 'value3')

        node.child6.class.arg2[1] = 'valueNew'
        assert.strictEqual(node.child6.class.arg2[1], 'valueNew')
        node.child6.class.arg2 = 'valueNew'
        assert.strictEqual(node.child6.class.arg2, 'valueNew')
        assert.strictEqual(node.child6.class.getVar, undefined)
        node.child6.class.getVar = 'newGetVar'
        assert.strictEqual(node.child6.class.getVar, 'newGetVar')

        const newInstance = new node.child6.class('value6', 'value7', 'value8')
        assert.notStrictEqual(newInstance, node.child6.class)
        assert.notStrictEqual(newInstance, node.child6.class.__NODE__.instance)
        assert.strictEqual(newInstance.arg1, 'value6')
        assert.strictEqual(newInstance.arg2, 'value7')
        assert.strictEqual(newInstance.arg3, 'value8')
        assert.strictEqual(node.child6.class.arg1, 'value1')
    })
})
const {describe, it} = require('node:test')
const assert = require('node:assert/strict')

const loader = require('../../lib/loader.js')
const node = loader('./dir', 'value1', ['value2'], () => {return 'value3'})

describe('loader', () => {
    it('should node is object', async () => {
        assert.equal(typeof node, 'object')
    })

    it('should has node.__node property', async () => {
        assert.equal(typeof node.__node, 'object')
        assert.equal(node.__node.path, require('path').join(__dirname, './dir/'))
        assert.equal(node.__node.type, 'dir')
    })

    it('should has node.child1.__node property', async () => {
        assert.equal(typeof node.child1, 'object')
        assert.equal(node.child1.__node.path, node.__node.path + 'child1/')
        assert.equal(node.child1.__node.type, 'dir')
    })

    it('should has node.child2 property', async () => {
        assert.equal(typeof node.child2, 'object')
        assert.strictEqual(node.child2, node.child2)
    })

    it('should node.child3 type is file', async () => {
        assert.equal(node.child3.__node.type, 'file')
    })

    it('should node.child3 can read and write', async () => {
        assert.strictEqual(node.child3, node.child3)
        assert.strictEqual(node.child3.data, 0)
        node.child3.data = 1
        assert.strictEqual(node.child3.data, 1)
        node.child3.data++
        assert.strictEqual(node.child3.data, 2)
        const newData = {data: 3}
        node.child3 = newData
        assert.strictEqual(node.child3, newData)
        assert.strictEqual(node.child3.__node, undefined)
    })

    it('should node.child4 is not json', async () => {
        assert.strictEqual(node.child4.__node.type, 'file')
        assert.strictEqual(node.child4.data, 0)
    })

    it('should node.child5 is json', async () => {
        assert.strictEqual(node.child5.__node.type, 'json')
        assert.strictEqual(node.child5.data, 5)
    })

    it('should node.child5 is json', async () => {
        assert.strictEqual(node.child5.__node.type, 'json')
        assert.strictEqual(node.child5.data, 5)
    })

    it('should node.child6.class is class', async () => {
        assert.strictEqual(typeof node.child6.class, 'function')
        assert.strictEqual(node.child6.class.__node.type, 'class')
        assert.strictEqual(node.child6.class, node.child6.class)
        assert.strictEqual(new node.child6.class().index(), 'index')
        assert.strictEqual(node.child6.class.empty, undefined)
    })

    it('should node.child6.class auto instantiation', async () => {
        assert.strictEqual(typeof node.child6.class.index, 'function')
        assert.strictEqual(node.child6.class.index, node.child6.class.index)
        assert.strictEqual(node.child6.class.index, node.child6.class.__node.instance.index)
        assert.strictEqual(node.child6.class.__node.instance, node.child6.class.__node.instance)
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
        assert.notStrictEqual(newInstance, node.child6.class.__node.instance)
        assert.strictEqual(newInstance.arg1, 'value6')
        assert.strictEqual(newInstance.arg2, 'value7')
        assert.strictEqual(newInstance.arg3, 'value8')
        assert.strictEqual(node.child6.class.arg1, 'value1')
    })
})
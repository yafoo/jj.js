/**
 * 开发jj.js库本身时，可以设置为import('../types')
 * @type {typeof import('../../../types')}
 */
const Ctx = require('./ctx');

/**
 * @extends Ctx
 */
class Context extends Ctx
{
    /**
     * Initialize a new `Context`
     * @public
     * @param {import('../types').Context} ctx
     */
    constructor(ctx) {
        super();
        this.ctx = ctx;
    }
}

module.exports = Context;
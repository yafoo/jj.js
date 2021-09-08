const Ctx = require('./ctx');

class Context extends Ctx
{
    constructor(ctx) {
        super();
        this.ctx = ctx;
    }
}

module.exports = Context;
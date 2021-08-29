const {Logger} = require('../../../jj.js');

module.exports = class {
    constructor(ctx, next) {
        this.ctx = ctx;
        this.$next = next;
    }

    async start() {
        Logger.info('middle2 start');
        await this.$next();
        Logger.info('middle2 start await');
    }

    async end() {
        Logger.info('middle2 end');
    }
}
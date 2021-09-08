//const {Middleware} = require('jj.js');
const {Middleware, Logger} = require('../../../jj.js');

class Index extends Middleware
{
    async middle() {
        Logger.info('中间件：输出之前');
        await this.$next();
        Logger.info('中间件：输出之后');
    }

    async auth() {
        Logger.info('auth：在这里验证登录');
        await this.$next();
        Logger.info('auth：业务完成时调用');
    }
}

module.exports = Index;
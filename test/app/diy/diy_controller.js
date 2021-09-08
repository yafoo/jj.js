const {Controller, Logger} = require('../../../jj.js');

class DiyController extends Controller
{
    async _init() {
        Logger.info('_init');
    }

    async index() {
        this.$assign('url_str', ':diy');
        this.$assign('content', '自定义控制器层！');
        await this.$fetch('index/view');
    }
}

module.exports = DiyController;
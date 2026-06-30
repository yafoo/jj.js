const {Controller} = require('../../../../../jj.js');

class Index extends Controller
{
    async index() {
        this.$show('/api/index/index');
    }
}

module.exports = Index;
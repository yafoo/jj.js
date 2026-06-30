const {Controller} = require('../../../../../jj.js');

class Index extends Controller
{
    async index() {
        this.$show('/home/index/index');
    }
}

module.exports = Index;
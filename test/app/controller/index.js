const {Controller} = require('../../../jj.js');

class Index extends Controller
{
    async index() {
        this.$redirect('/todo');
    }
}

module.exports = Index;
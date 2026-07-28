const { Controller } = require('jj.js');

class IndexController extends Controller {
    index() {
        this.$redirect('/todo');
    }
}

module.exports = IndexController;

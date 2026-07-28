const { Controller } = require('jj.js');

class IndexController extends Controller {
    index() {
        this.$show('Hello World!');
    }
}

module.exports = IndexController;

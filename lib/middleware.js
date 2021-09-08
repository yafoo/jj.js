const Context = require('./context');

class Middleware extends Context
{
    constructor(ctx, next) {
        super(ctx);
        this.$next = next;
    }

    $show(content) {
        this.$response.show(content);
    }

    $redirect(url, status) {
        this.$response.redirect(url, status);
    }

    $success(msg, url) {
        this.$response.success(msg, url);
    }

    $error(msg, url) {
        this.$response.error(msg, url);
    }
}

module.exports = Middleware;
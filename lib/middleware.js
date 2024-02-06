const Context = require('./context');

/**
 * @extends Context
 */
class Middleware extends Context
{
    /**
     * Initialize a new `Middleware`
     * @public
     * @param {import('./types').Context} ctx
     * @param {import('./types').Middleware} [next]
     */
    constructor(ctx, next) {
        super(ctx);
        this.$next = next;
    }

    /**
     * 直接输出内容
     * @public
     * @param {*} data
     */
    $show(data) {
        this.$response.show(data);
    }
 
    /**
     * 跳转重定向
     * @public
     * @param {(string|object)} url
     * @param {number} [status]
     */
    $redirect(url, status) {
        this.$response.redirect(url, status);
    }

    /**
     * 输出成功提示（html|json）
     * @public
     * @param {(string|object)} [msg]
     * @param {(string|object)} [url]
     */
    $success(msg, url) {
        this.$response.success(msg, url);
    }

    /**
     * 输出错误提示（html|json）
     * @public
     * @param {(string|object)} [msg]
     * @param {(string|object)} [url]
     */
    $error(msg, url) {
        this.$response.error(msg, url);
    }
}

module.exports = Middleware;
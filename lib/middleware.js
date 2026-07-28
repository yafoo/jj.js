const Context = require('./context');

/**
 * @typedef {import('../types').KoaCtx} KoaCtx
 * @typedef {import('../types').AsyncNext} AsyncNext
 * @typedef {import('../types').ResponseInstance} ResponseInstance
 */

/**
 * @extends Context
 */
class Middleware extends Context
{
    /**
     * 控制器_init方法或action方法返回此值，表示不继续执行后续方法
     * @type {'__EXIT__'}
     */
    __EXIT__ = '__EXIT__';

    /**
     * Initialize a new `Middleware`
     * @public
     * @param {KoaCtx} ctx
     * @param {AsyncNext} [next]
     */
    constructor(ctx, next) {
        super(ctx);
        this.$next = next;
    }

    /**
     * 直接输出内容
     * @public
     * @param {*} data
     * @returns {'__EXIT__'}
     */
    $show(data) {
        return this._$response.show(data);
    }
 
    /**
     * 跳转重定向
     * @public
     * @param {(string|object)} url
     * @param {number} [status]
     * @returns {'__EXIT__'}
     */
    $redirect(url, status) {
        return this._$response.redirect(url, status);
    }

    /**
     * 输出成功提示（html|json）
     * @public
     * @param {(string|object)} [msg]
     * @param {(string|object)} [url]
     * @returns {'__EXIT__'}
     */
    $success(msg, url) {
        return this._$response.success(msg, url);
    }

    /**
     * 输出错误提示（html|json）
     * @public
     * @param {(string|object)} [msg]
     * @param {(string|object)} [url]
     * @returns {'__EXIT__'}
     */
    $error(msg, url) {
        return this._$response.error(msg, url);
    }

    /**
     * @type {ResponseInstance} Response实例
     * @private
     */
    // @ts-ignore
    __response = null;

    /**
     * @type {ResponseInstance} Response实例
     */
    get _$response() {
        if(this.__response === null) {
            if(this.$response && this.$response.__ISCLASS__) {
                this.__response = this.$response;
            } else if(this.$ && this.$.response) {
                this.__response = this.$.response;
            } else {
                this.__response = new (require('./response'))(this.ctx);
            }
        }
        return this.__response;
    }

    set _$response(response) {
        this.__response = response;
    }
}

module.exports = Middleware;
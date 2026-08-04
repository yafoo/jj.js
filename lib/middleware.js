const Context = require('./context');

/**
 * @typedef {import('../types').KoaCtx} KoaCtx
 * @typedef {import('../types').AsyncNext} AsyncNext
 * @typedef {import('../types').ResponseInstance} ResponseInstance
 * @typedef {'__EXIT__'} EXIT
 */

/**
 * @extends Context
 */
class Middleware extends Context
{
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
     * @returns {EXIT}
     */
    $show(data) {
        return this._$response.show(data);
    }
 
    /**
     * 跳转重定向
     * @public
     * @param {(string|object)} url
     * @param {number} [status]
     * @returns {EXIT}
     */
    $redirect(url, status) {
        return this._$response.redirect(url, status);
    }

    /**
     * 输出成功提示（html|{state, msg, data}）
     * @public
     * @param {(string|object)} [msg]
     * @param {(string|object)} [url] - 跳转url地址，或ajax请求时返回的data数据
     * @param {number} [state] - 状态码，默认1，表示成功
     * @returns {EXIT}
     */
    $success(msg, url, state=1) {
        return this._$response.success(msg, url, state);
    }

    /**
     * 输出错误提示（html|{state, msg, data}）
     * @public
     * @param {(string|object)} [msg]
     * @param {(string|object)} [url] - 跳转url地址，或ajax请求时返回的data数据
     * @param {number} [state] - 状态码，默认0，表示失败
     * @returns {EXIT}
     */
    $error(msg, url, state=0) {
        return this._$response.error(msg, url, state);
    }

    /**
     * 返回'__EXIT__'
     * @public
     * @returns {EXIT}
     */
    $exit() {
        return '__EXIT__';
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
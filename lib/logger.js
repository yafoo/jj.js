const {app: cfg_app, log: cfg_log} = require('./config');

/**
 * @typedef {import('./types').LogHandle} LogHandle
 */

class Logger
{
    /**
     * Creat a new `Logger` class
     * @public
     * @static
     * @param {LogHandle} [handle]
     */
    constructor(handle) {
        if(new.target) {
            // @ts-ignore
            class ClildLogger extends this.constructor {}
            // @ts-ignore
            ClildLogger.setHandle(handle);
            return ClildLogger;
        }
    }

    /**
     * 输出error日志
     * @public
     * @static
     * @param  {...any} args
     */
    static error(...args) {
        this.log('error', ...args);
    }

    /**
     * 输出warning日志
     * @public
     * @static
     * @param  {...any} args
     */
    static warning(...args) {
        this.log('warning', ...args);
    }

    /**
     * 输出info日志
     * @public
     * @static
     * @param  {...any} args
     */
    static info(...args) {
        this.log('info', ...args);
    }

    /**
     * 输出debug日志
     * @public
     * @static
     * @param  {...any} args
     */
    static debug(...args) {
        this.log('debug', ...args);
    }

    /**
     * 输出sql日志
     * @public
     * @static
     * @param  {...any} args
     */
    static sql(...args) {
        this.log('sql', ...args);
    }

    /**
     * 输出http日志
     * @public
     * @static
     * @param  {...any} args
     */
    static http(...args) {
        this.log('http', ...args);
    }

    /**
     * 输出error日志
     * @public
     * @static
     * @param  {string} level - 日志级别、标识
     * @param  {...any} args - 日志内容
     */
    static log(level='info', ...args) {
        (cfg_app.app_debug || ~cfg_log.log_level.indexOf(level)) && this.handle(level, ...args);
    }

    /**
     * 设置日志handle
     * @public
     * @static
     * @param {LogHandle} handle
     * @returns {Logger}
     */
    static setHandle(handle) {
        /**
         * @type {LogHandle}
         */
        this.handle = typeof handle == 'function' ? handle : cfg_log.log_handle;
        return this;
    }
}

/**
 * 设置日志handle
 */
Logger.setHandle(cfg_log.log_handle);

module.exports = Logger;
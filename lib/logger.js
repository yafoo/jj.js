const {app: cfg_app, log: cfg_log} = require('./config');

/**
 * @typedef {import('../types').LogLevel} LogLevel
 * @typedef {import('../types').LogHandle} LogHandle
 */

class Logger
{
    static handle = cfg_log.log_handle;

    /**
     * Creat a new `Logger` class
     * @public
     * @static
     * @param {LogHandle} [handle]
     */
    constructor(handle) {
        if(new.target) {
            // @ts-ignore
            class ClildLogger extends this.constructor {
                static handle = handle || cfg_log.log_handle;
            }
            return ClildLogger;
        }
    }

    /**
     * 输出system日志
     * @public
     * @static
     * @param  {...any} args
     */
    static system(...args) {
        this.log('system', ...args);
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
     * @param  {LogLevel} deep - 日志级别、标识
     * @param  {...any} args - 日志内容
     */
    static log(deep='info', ...args) {
        (cfg_app.app_debug || ~cfg_log.log_deep.indexOf(deep)) && this.handle(deep, ...args);
    }

    /**
     * 设置日志handle
     * @public
     * @static
     * @param {LogHandle} handle
     * @returns {Logger}
     */
    static setHandle(handle) {
        if(typeof handle != 'function') {
            throw new Error('handle must be a function');
        }
        this.handle = handle;
        return this;
    }
}

module.exports = Logger;
const {app: cfg_app, log: cfg_log} = require('./config');

class Logger
{
    constructor(handle) {
        if(new.target) {
            class ClildLogger extends this.constructor {}
            ClildLogger.setHandle(handle);
            return ClildLogger;
        }
    }

    static error(...args) {
        args.forEach(msg => this.log(msg, 'error'));
    }

    static warning(...args) {
        args.forEach(msg => this.log(msg, 'warning'));
    }

    static info(...args) {
        args.forEach(msg => this.log(msg, 'info'));
    }

    static debug(...args) {
        args.forEach(msg => this.log(msg, 'debug'));
    }

    static sql(...args) {
        args.forEach(msg => this.log(msg, 'sql'));
    }

    static http(...args) {
        args.forEach(msg => this.log(msg, 'http'));
    }

    static log(msg, level='info') {
        (cfg_app.app_debug || ~cfg_log.log_level.indexOf(level)) && this.handle(msg, level);
    }

    static setHandle(handle) {
        this.handle = typeof(handle) == 'function' ? handle : cfg_log.log_handle;
    }
}

Logger.setHandle(cfg_log.log_handle);

module.exports = Logger;
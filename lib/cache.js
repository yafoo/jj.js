const {cache: cfg_cache} = require('./config');

class Cache
{
    /**
     * Creat a new `Cache` class
     * @public
     */
    constructor() {
        if(new.target) {
            // @ts-ignore
            class ChildCache extends this.constructor {}
            ChildCache.cache = {};
            ChildCache.timer = null;
            // @ts-ignore
            ChildCache.setIntervalTime(cfg_cache.clear_time);
            return ChildCache;
        }
    }

    /**
     * 获取缓存
     * @public
     * @static
     * @param {string} [key] - 为空时，返回所有缓存
     * @returns {*}
     */
    static get(key) {
        if(key === undefined) {
            return this.cache;
        }
        const now_time = Math.round(Date.now() / 1000);
        if(this.cache[key] && this.cache[key].time > now_time) {
            return this.cache[key].data;
        } else {
            this.delete(key);
            return undefined;
        }
    }

    /**
     * 设置缓存
     * @public
     * @static
     * @param {string} key - 缓存键
     * @param {*} data - 缓存值
     * @param {number} [cache_time] 单位秒，默认10年
     */
    static set(key, data, cache_time) {
        cache_time || (cache_time = cfg_cache.cache_time || 60 * 60 * 24 * 365 * 10);
        const now_time = this.time();
        this.cache[key] = {data: data, time: cache_time + now_time};
    }

    /**
     * 删除或清理缓存
     * @public
     * @static
     * @param {string} [key] - 为空时，清理所有缓存
     */
    static delete(key) {
        if(key) {
            delete this.cache[key];
        } else {
            // @ts-ignore
            this.cache = {};
        }
    }

    /**
     * 设置缓存自动清理
     * @public
     * @static
     * @param {number} [time] - 清理周期，单位秒；为空或0，则关闭自动清理功能
     */
    static setIntervalTime(time) {
        if(time) {
            this.timer && clearInterval(this.timer);
            // @ts-ignore
            this.timer = setInterval(() => {
                const now_time = this.time();
                for(let key in this.cache) {
                    this.cache[key].time < now_time && this.delete(key);
                }
            }, time * 1000);
        } else {
            this.timer && clearInterval(this.timer);
            // @ts-ignore
            this.timer = null;
        }
    }

    /**
     * 获取当前时间戳
     * @public
     * @static
     * @returns {number}
     */
    static time() {
        return Math.round(Date.now() / 1000);
    }
}

/**
 * 缓存store
 */
// @ts-ignore
Cache.cache = {};
/**
 * 缓存自动清理定时器
 */
// @ts-ignore
Cache.timer = null;
/**
 * 开启缓存自动清理
 */
Cache.setIntervalTime(cfg_cache.clear_time);

module.exports = Cache;
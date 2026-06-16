const {cache: cfg_cache} = require('./config');

class Cache
{
    static cache = new Map();
    static timer = null;

    /**
     * Creat a new `Cache` class
     * @public
     * @param {Map} [store] - 缓存存储实例
     */
    constructor(store) {
        if(new.target) {
            // @ts-ignore
            class ChildCache extends this.constructor {
                static cache = store || Cache.cache;
            }
            // 只有独立 cache 时才声明独立的 timer
            if(store) {
                // @ts-ignore
                ChildCache.timer = null;
                // @ts-ignore
                ChildCache.setIntervalTime(cfg_cache.clear_time);
            }
            return ChildCache;
        }
    }

    static {
        this.setIntervalTime(cfg_cache.clear_time);
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
        const item = this.cache.get(key);
        if(item && item.time > this.time()) {
            return item.data;
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
        this.cache.set(key, {data: data, time: cache_time + this.time()});
    }

    /**
     * 删除或清理缓存
     * @public
     * @static
     * @param {string} [key] - 为空时，清理所有缓存
     */
    static delete(key) {
        if(key) {
            this.cache.delete(key);
        } else {
            // @ts-ignore
            this.cache = new Map();
        }
    }

    /**
     * 检查缓存是否存在
     * @public
     * @static
     * @param {string} key - 缓存键
     * @returns {boolean}
     */
    static has(key) {
        const item = this.cache.get(key);
        if(item && item.time > this.time()) {
            return true;
        } else if(item) {
            // 已过期，删除
            this.delete(key);
        }
        return false;
    }

    /**
     * 获取有效缓存数量（过滤已过期）
     * @public
     * @static
     * @returns {number}
     */
    static size() {
        let count = 0;
        const now_time = this.time();
        for(let [key, item] of this.cache) {
            if(item.time > now_time) {
                count++;
            } else {
                // 自动清理过期缓存
                this.delete(key);
            }
        }
        return count;
    }

    /**
     * 获取所有有效缓存的键（过滤已过期）
     * @public
     * @static
     * @returns {string[]}
     */
    static keys() {
        const keys = [];
        const now_time = this.time();
        for(let [key, item] of this.cache) {
            if(item.time > now_time) {
                keys.push(key);
            } else {
                // 自动清理过期缓存
                this.delete(key);
            }
        }
        return keys;
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
                for(let [key, item] of this.cache) {
                    item.time < now_time && this.delete(key);
                }
            }, time * 1000);
        } else {
            this.timer && clearInterval(this.timer);
            // @ts-ignore
            this.timer = null;
        }
    }

    /**
     * 设置缓存存储实例
     * @public
     * @static
     * @param {Map} [store] - 缓存存储实例
     */
    static setStore(store) {
        this.cache = store || new Map();
        this.setIntervalTime(cfg_cache.clear_time);
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

module.exports = Cache;
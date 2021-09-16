const {cache: cfg_cache} = require('./config');

class Cache
{
    constructor() {
        if(new.target) {
            class ChildCache extends this.constructor {}
            ChildCache.cache = {};
            ChildCache.timer = null;
            ChildCache.setIntervalTime(cfg_cache.clear_time);
            return ChildCache;
        }
    }

    static get(key) {
        if(key === undefined) {
            return this.cache;
        }
        const now_time = Math.round(new Date() / 1000);
        if(this.cache[key] && this.cache[key].time > now_time) {
            return this.cache[key].data;
        } else {
            this.delete(key);
            return undefined;
        }
    }

    static set(key, data, cache_time) {
        cache_time || (cache_time = cfg_cache.cache_time || 60 * 60 * 24 * 365 * 10);
        const now_time = this.time();
        this.cache[key] = {data: data, time: cache_time + now_time};
    }

    static delete(key) {
        if(key) {
            delete this.cache[key];
        } else {
            this.cache = {};
        }
    }

    static setIntervalTime(time) {
        if(time) {
            this.timer && clearInterval(this.timer);
            this.timer = setInterval(() => {
                const now_time = this.time();
                for(let key in this.cache) {
                    this.cache[key].time < now_time && this.delete(key);
                }
            }, time * 1000);
        } else {
            this.timer && clearInterval(this.timer);
            this.timer = null;
        }
    }

    static time() {
        return Math.round(new Date() / 1000);
    }
}

Cache.cache = {};
Cache.timer = null;
Cache.setIntervalTime(cfg_cache.clear_time);

module.exports = Cache;
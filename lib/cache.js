const {cache: cfg_cache} = require('./config');

class Cache {
    constructor() {
        if(new.target) {
            class ChildCache extends this.constructor {}
            ChildCache.cache = {};
            ChildCache.timer = null;
            ChildCache.clear(cfg_cache.clear_time);
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
            return undefined;
        }
    }

    static set(key, data, cache_time) {
        typeof(cache_time) == 'undefined' && (cache_time = cfg_cache.cache_time);
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

    static clear(time) {
        switch(time) {
            case undefined:
                const now_time = this.time();
                for(let key in this.cache) {
                    this.cache[key].time < now_time && (delete this.cache[key]);
                }
                break;
            case 0:
                this.timer && clearInterval(this.timer);
                this.timer = null;
                break;
            default:
                this.timer && clearInterval(this.timer);
                this.timer = setInterval(() => {
                    const now_time = this.time();
                    for(let key in this.cache) {
                        this.cache[key].time < now_time && (delete this.cache[key]);
                    }
                }, time * 1000);
        }
    }

    static time() {
        return Math.round(new Date() / 1000);
    }
}

Cache.cache = {};
Cache.timer = null;
Cache.clear(cfg_cache.clear_time);

module.exports = Cache;
const IN_WEBCONTAINER = typeof process !== 'undefined' && process.versions && 'webcontainer' in process.versions;
/**
 * @typedef {{$: Record<string, any>, $$: Record<string, any>, $config: Record<string, any>, DEEP: string, CONTROLLER: string, ACTION: string}} Store
 * @type {import('async_hooks').AsyncLocalStorage<Store>}
 */
let storage;
if (!IN_WEBCONTAINER) {
    const { AsyncLocalStorage } = require('async_hooks');
    storage = new AsyncLocalStorage();
} else {
    const store = { _data: undefined };
    storage = {
        getStore() { return store._data; },
        async run(ctx, fn) {
            const prev = store._data;
            store._data = ctx;
            try {
                return await fn();
            } finally {
                store._data = prev;
            }
        },
        async exit(fn) {
            const prev = store._data;
            store._data = undefined;
            try {
                return await fn();
            } finally {
                store._data = prev;
            }
        },
        disable() { store._data = undefined; }
    };
}

/**
 * 把函数绑定到调用时的存储上下文
 *
 * 原生模块（sqlite3 等）的回调不继承 AsyncLocalStorage 的上下文：Node 24 起
 * AsyncContextFrame 成为默认实现后，这类回调里 storage.getStore() 会拿到
 * undefined，此时访问 this.$xxx 就会抛
 * `Cannot destructure property '$' of 'store' as it is undefined`。
 * 在回调里执行用户代码前用本方法把上下文补回来即可。
 *
 * @param {function} fun - 要绑定的函数
 * @returns {function} 绑定了当前上下文的新函数；当前无上下文时原样返回
 */
storage.bind = function(fun) {
    if(typeof fun !== 'function') return fun;
    const store = storage.getStore();
    if(store === undefined) return fun;
    return (...args) => storage.run(store, () => fun(...args));
};

module.exports = storage;
const IN_WEBCONTAINER = typeof process !== 'undefined' && process.versions && 'webcontainer' in process.versions;
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

module.exports = storage;
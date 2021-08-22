module.exports = new Proxy({}, {
    get: (target, prop) => {
        if(prop in target || typeof prop == 'symbol' || prop == 'inspect') {
            return target[prop];
        }
        if(prop == 'type') {
            return para => Object.prototype.toString.call(para).slice(8,-1);
        }
        return require('./' + prop);
    }
});
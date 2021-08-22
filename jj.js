module.exports = new Proxy({}, {
    get: (target, prop) => {
        if(prop in target || typeof prop == 'symbol' || prop == 'inspect'){
            return target[prop];
        }
        prop = prop.toLowerCase();
        return require(`./lib/${prop == 'utils' ? 'utils/' : ''}${prop}`);
    }
});
/**
 * 配置重载工具，暂时支持数据库配置，其他未测
 * @function - reload - Reload the configuration
 */
function reload() {
    const base_dir = require('../config').app.base_dir;
    const files = Object.keys(require('../config'));
    const path = require('path');
    files.forEach(file => {
        try { delete require.cache[require.resolve(path.join(base_dir, 'config', file))]; } catch(e) {}
    });
    try { delete require.cache[require.resolve(path.join(base_dir, 'config'))]; } catch(e) {}
    delete require.cache[require.resolve('../config')];
    require('../loader').clearPathCache();
}
module.exports = { reload };

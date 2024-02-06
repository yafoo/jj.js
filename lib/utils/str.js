/**
 * @function - 转为驼峰
 * @param {string} name
 * @returns {string}
 */
function toHump(name) {
    return name.replace(/\_(\w)/g, function(all, letter){
        return letter.toUpperCase();
    });
}

/**
 * @function - 转为下划线
 * @param {string} name
 * @returns {string}
 */
function toLine(name) {
    return name.replace(/(?!^)([A-Z])/g, "_$1").toLowerCase();
}

module.exports = {toHump, toLine};
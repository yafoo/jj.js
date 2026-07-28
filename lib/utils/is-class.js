/**
 * 判断一个值是否是 ES6 class
 * @param {*} fn - 需要判断的值
 * @returns {boolean} 是否是 class
 */
function isClass(fn) {
    if (typeof fn !== 'function') return false;
    const str = Function.prototype.toString.call(fn);
    return /^class[\s{]/.test(str);
}

module.exports = isClass;

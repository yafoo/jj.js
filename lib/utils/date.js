/**
 * @function
 * @param {string} fmt - 格式化模板
 * @param {(number|Date)} [date] - 时间戳或Date实例
 * @returns {string} - 格式化后时间
 */
function format(fmt, date) {
    (typeof date === 'string' || typeof date === 'number') && (date = new Date(parseInt(date + '000')));
	  date = date || new Date();
    let ret;
    let opt = {
        "Y+": date.getFullYear().toString(),        // 年
        "y+": date.getFullYear().toString().slice(2),// 年
        "m+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "H+": date.getHours().toString(),           // 时
        "h+": (date.getHours() > 12 ? date.getHours() - 12 : date.getHours()).toString(),// 时
        "i+": date.getMinutes().toString(),         // 分
        "s+": date.getSeconds().toString()          // 秒
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        };
    };
    return fmt;
}

/**
 * @function - 获取多长时间前
 * @param {number} time - 时间戳
 * @returns {string} - 例如5分钟前
 */
function before(time) {
    time -= 0;
    let difTime = Date.now() / 1000 - time;
    let { h, m } = { h: difTime / 3600, m: difTime / 60 };
    let msg = "";
    if (h < 1) {
        msg = `${m}分钟前`;
    } else if (h >= 1 && h <= 24) {
        msg = `${h}小时前`;
    } else if (h > 24) {
        h = h / 24
        msg = `${h}天前`;
    }
    return msg;
}

module.exports = {format, before};
let crypto;
module.exports = (str) => {
    if(!crypto) {
        crypto = require('crypto');
    }
    return crypto.createHash('md5').update(str).digest('hex');
}
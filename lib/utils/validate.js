/**
 * Validate path name
 * @param {string} name
 * @returns {boolean}
 */
function validatePath(name) {
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
        return false;
    }
    return true;
}

module.exports = { validatePath };
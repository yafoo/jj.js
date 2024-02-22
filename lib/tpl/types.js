module.exports = `/**
* @type {typeof import('jj.js/types')}
*/
const JJCtx = require('jj.js').Ctx;

/**
 * @typedef {import('jj.js/types').Config} JJConfig
 */

__TYPES__

/**
 * @class Ctx
 */
class Ctx extends JJCtx {
__PROPERTY__
}

/**
 * @module types
 */
module.exports = Ctx;`;
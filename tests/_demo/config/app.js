const { default: koaBody } = require("koa-body");

/**
 * @module config
 * @type {import('../../../types').AppConfig}
 */
module.exports = {
    app_debug: true,
    koa_body: {}, // 开启post
}
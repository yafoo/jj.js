const Middleware = require('./middleware');

/**
 * @extends Middleware
 */
class Controller extends Middleware
{
    /**
     * 模版数据赋值
     * @public
     * @param {string} name
     * @param {any} value 
     * @returns {this}
     */
    $assign(name, value) {
        this.$view.assign(name, value);
        return this;
    }

    /**
     * 获取模版数据
     * @public
     * @param {string} [name]
     * @returns {object}
     */
    $data(name) {
        return this.$view.data(name);
    }

    /**
     * 获取文件内容并输出
     * @public
     * @param {string} [template]
     */
    async $load(template) {
        const content = await this.$view.load(template);
        this.$show(content);
    }

    /**
     * 渲染(解析数据)内容并输出
     * @public
     * @param {string} content
     */
    async $render(content) {
        const html = await this.$view.render(content);
        this.$show(html);
    }

    /**
     * 渲染(解析数据)文件并输出
     * @public
     * @param {string} [template]
     */
    async $fetch(template) {
        const content = await this.$view.fetch(template);
        this.$show(content);
    }
}

module.exports = Controller;
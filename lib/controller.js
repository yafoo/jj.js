const Middleware = require('./middleware');

/**
 * @typedef {import('../types').ViewInstance} ViewInstance
 */

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
        this._$view.assign(name, value);
        return this;
    }

    /**
     * 获取模版数据
     * @public
     * @param {string} [name]
     * @returns {object}
     */
    $data(name) {
        return this._$view.data(name);
    }

    /**
     * 获取文件内容并输出
     * @public
     * @param {string} [template]
     */
    async $load(template) {
        const content = await this._$view.load(template);
        this.$show(content);
    }

    /**
     * 渲染(解析数据)内容并输出
     * @public
     * @param {string} content
     */
    async $render(content) {
        const html = await this._$view.render(content);
        this.$show(html);
    }

    /**
     * 渲染(解析数据)文件并输出
     * @public
     * @param {string} [template]
     */
    async $fetch(template) {
        const content = await this._$view.fetch(template);
        this.$show(content);
    }

    /**
     * @type {ViewInstance} View实例
     * @private
     */
    // @ts-ignore
    __view = null;

    /**
     * @type {ViewInstance} View实例
     */
    get _$view() {
        if(this.__view === null) {
            if(this.$view && this.$view.__ISCLASS__) {
                this.__view = this.$view;
            } else if(this.$ && this.$.view) {
                this.__view = this.$.view;
            } else {
                this.__view = new (require('./view'))(this.ctx);
            }
        }
        return this.__view;
    }

    set _$view(view) {
        this.__view = view;
    }
}

module.exports = Controller;
const Middleware = require('./middleware');

class Controller extends Middleware {
    constructor(...args) {
        super(...args);
        this._view = this.$view.__node.isClass ? this.$view : this.$.view;
    }

    // 直接内容输出
    async show(content) {
        this.$response.show(content);
    }

    // 直接文件输出
    async load(template, html=false) {
        const content = await this._view.load(template);
        if(html) {
            return content;
        } else {
            this.show(content);
        }
    }

    // 渲染内容输出
    async render(data, html=false) {
        const content = await this._view.render(data);
        if(html) {
            return content;
        } else {
            this.show(content);
        }
    }

    // 渲染文件输出
    async fetch(template, html=false) {
        const content = await this._view.fetch(template);
        if(html) {
            return content;
        } else {
            this.show(content);
        }
    }

    // 赋值模版数据
    assign(name, value) {
        this._view.assign(name, value);
    }

    // 获取模版数据
    data(name) {
        return this._view.data(name);
    }
}

module.exports = Controller;
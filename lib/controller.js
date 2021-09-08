const Middleware = require('./middleware');

class Controller extends Middleware
{
    constructor(...args) {
        super(...args);
        if(!this.$view.__node.isClass) {
            this.$view = this.$.view;
        }
    }

    // 赋值模版数据
    $assign(name, value) {
        this.$view.assign(name, value);
        return this;
    }

    // 获取模版数据
    $data(name) {
        return this.$view.data(name);
    }

    // 直接文件输出
    async $load(template) {
        const content = await this.$view.load(template);
        this.$show(content);
    }

    // 渲染内容输出
    async $render(data) {
        const content = await this.$view.render(data);
        this.$show(content);
    }

    // 渲染文件输出
    async $fetch(template) {
        const content = await this.$view.fetch(template);
        this.$show(content);
    }
}

module.exports = Controller;
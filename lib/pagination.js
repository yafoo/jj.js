const {page: cfg_page} = require('./config');
const Context = require('./context');

class Pagination extends Context
{
    constructor(ctx) {
        super(ctx);
        this._page = 1;
        this._pageSize = 10;
        this._total = 0;
        this._totalPage = 0;
        this.init();
    }

    // 分页配置
    init(options) {
        this.options = {...cfg_page, ...options};
        this._pageKey = this.options.page_key;
        this._keyOrigin = this.options.key_origin;
        this._ctxPage = this.ctx
            && this.ctx[this._keyOrigin]
            && this.ctx[this._keyOrigin][this._pageKey]
            && +this.ctx[this._keyOrigin][this._pageKey];
        this.page(this._ctxPage);
        this.pageSize(this.options.page_size);
        return this;
    }

    // 设置或获取当前页
    page(page) {
        if(typeof page != 'undefined') {
            this._page = parseInt(page) || 1;
            return this;
        } else {
            return this._page;
        }
    }

    // 设置或获取分页大小
    pageSize(page_size) {
        if(page_size) {
            this._pageSize = page_size;
            return this;
        } else {
            return this._pageSize;
        }
    }

    // 设置或获取总数
    total(total) {
        if(typeof total != 'undefined') {
            this._total = parseInt(total) || 0;
            return this;
        } else {
            return this._total;
        }
    }

    // 渲染html
    render(total, page, page_size) {
        this.total(total);
        this.page(page);
        this.pageSize(page_size);
        this._totalPage = Math.ceil(this._total / this._pageSize);

        return this._initRule().options['template'].replace(/\$\{(\w+)\}/g, (...args) => {
            return this['_' + args[1]]();
        });
    }

    // 首页
    _index() {
        return !this._totalPage || this._page == 1 ? '' : this._parseTpl('index_tpl', 1);
    }

    // 末页
    _end() {
        return !this._totalPage || this._page == this._totalPage ? '' : this._parseTpl('end_tpl', this._totalPage);
    }

    // 上一页
    _prev() {
        return !this._totalPage || this._page == 1 ? '' : this._parseTpl('prev_tpl', this._page - 1);
    }

    // 下一页
    _next() {
        return !this._totalPage || this._page == this._totalPage ? '' : this._parseTpl('next_tpl', this._page + 1);
    }

    // 信息
    _info() {
        return this._parseTpl('info_tpl', this._totalPage);
    }

    // 分页
    _list() {
        let list = '';
        let list_start = 1;
        let list_end = this.options.page_length;
        const list_left = parseInt(this.options.page_length / 2);

        if(this._page >= list_end) {
            list_start = this._page - list_left;
            list_end = this._page + this.options.page_length - list_left - 1;
        }
        if(list_end > this._totalPage) {
            list_end = this._totalPage;
            list_start = this._totalPage - this.options.page_length + 1;
        }
        if(list_start < 1) {
            list_start = 1;
        }

        for(list_start; list_start <= list_end; list_start++) {
            list += this._parseTpl(list_start == this._page ? 'active_tpl' : 'list_tpl', list_start);
        }
        
        return list;
    }

    // 解析模块
    _parseTpl(tpl_key, num) {
        return this.options[tpl_key].replace(/\$\{(\w+)\}/g, (...args) => {
            return args[1] == 'url' ? this._parseUrl(num) : args[1] == 'page' ? num : args[1] == 'total' ? this._total : this._totalPage;
        });
    }

    // 解析网址
    _parseUrl(page) {
        return (page == 1 ? this._urlIndex : this._urlPage).replace('${page}', page);
    }

    // 初始网址规则
    _initRule() {
        let url_index = this.options.url_index;
        let url_page = this.options.url_page;

        if(url_index.slice(0, 1) == ':') {
            url_index = this.$url.ruleUrl(url_index.substr(1), {[this._pageKey]: '__page__'}).replace('__page__', '${page}');
        }

        if(url_page.slice(0, 1) == ':') {
            url_page = this.$url.ruleUrl(url_page.substr(1), {[this._pageKey]: '__page__'}).replace('__page__', '${page}');
        }

        if(url_index == '' || url_page == '') {
            const url = this.ctx.url;
            const arr = url.split('?');
            let url_rule = '';
            if(this._ctxPage) {
                url_rule =
                    this._keyOrigin == 'query'
                    ?
                    url.replace(this._pageKey + '=' + this._page, this._pageKey + '=${page}')
                    :
                    arr[0].replace(/(\d+)/g, (...args) => {
                        return args[1] == this._page ? '${page}' : args[1];
                    }) + (arr[1] ? ('?' + arr[1]) : '');

                url_index || (url_index = url_rule);
                url_page || (url_page = url_rule);
            } else {
                url_index || (url_index = url);
                url_rule =
                    this._keyOrigin == 'query'
                    ?
                    url + (arr[1] ? '&' : '?') + this._pageKey + '=${page}'
                    :
                    arr[0].replace(/\/$/g, '') + '/${page}' + (arr[1] ? ('?' + arr[1]) : '');
                url_index || (url_index = url);
                url_page || (url_page = url_rule);
            }
        }

        this._urlIndex = url_index;
        this._urlPage = url_page;

        return this;
    }
}

module.exports = Pagination;
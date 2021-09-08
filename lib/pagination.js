const {page: cfg_page} = require('./config');
const Context = require('./context');

class Pagination extends Context
{
    constructor(ctx) {
        super(ctx);
        this.init();
    }

    // 分页配置
    init(options) {
        this.options = {...cfg_page, ...options};
        this.ctxPage = this.ctx
                        && this.ctx[this.options.pageType]
                        && this.ctx[this.options.pageType][this.options.pageKey]
                        && +this.ctx[this.options.pageType][this.options.pageKey];
        return this.page(this.ctxPage);
    }

    // 分页总数计算
    total(total) {
        this.totalNum = total && +total || 0;
        this.pageTotal = this.totalNum % this.options.pageSize == 0 ? this.totalNum / this.options.pageSize : Math.ceil(this.totalNum / this.options.pageSize);
        this.pageTotal || (this.pageTotal = 1);
        return this;
    }

    // 设置当前页
    page(page) {
        this.curPage = page && parseInt(page) || 1;
        return this;
    }

    // 渲染html
    render(total, page, options) {
        if(typeof page == 'object') {
            [page, options] = [options, page];
        }
        typeof options == 'object' && this.init(options);
        (total || typeof this.totalNum == 'undefined') && this.total(total);
        page && this.page(page);
        return this.options['pageRender'].replace(/\$\{(\w+)\}/g, (...args) => {
            return this[args[1]]();
        });
    }

    // 上一页
    prev() {
        return this.curPage == 1 ? '' : this._parseLink('linkPrev', this.curPage - 1);
    }

    // 下一页
    next() {
        return this.curPage == this.pageTotal ? '' : this._parseLink('linkNext', this.curPage + 1);
    }

    // 首页
    index() {
        return this.curPage == 1 ? '' : this._parseLink('linkIndex', 1);
    }

    // 末页
    end() {
        return this.curPage == this.pageTotal ? '' : this._parseLink('linkEnd', this.pageTotal);
    }

    // 信息
    info() {
        return this._parseLink('linkInfo', this.pageTotal);
    }

    // 分页
    list() {
        let list = '';
        let list_start = 1;
        let list_end = this.options.pageLength;
        const list_left = parseInt(this.options.pageLength / 2);

        if(this.curPage >= list_end) {
            list_start = this.curPage - list_left;
            list_end = this.curPage + this.options.pageLength - list_left - 1;
        }
        if(list_end > this.pageTotal) {
            list_end = this.pageTotal;
            list_start = this.pageTotal - this.options.pageLength + 1;
        }
        if(list_start < 1) {
            list_start = 1;
        }

        for(list_start; list_start<=list_end; list_start++) {
            list += this._parseLink(list_start == this.curPage ? 'linkActive' : 'linkList', list_start);
        }
        return list;
    }

    // 解析链接
    _parseLink(linkKey, page) {
        return this.options[linkKey].replace(/\$\{(\w+)\}/g, (...args) => {
            return args[1] == 'page' ? page : args[1] == 'total' ? this.totalNum : this._parseUrl(page);
        });
    }

    // 解析网址
    _parseUrl(page) {
        if(this.options.urlPage == '' || this.options.urlIndex == '') {
            const url = this.ctx.url;
            const urls = url.split('?');
            if(this.ctxPage) {
                const urlReg = this.options.pageType == 'params' ? 
                    urls[0].replace(/(\d+)/g, (...args) => {
                        return args[1] == this.curPage ? '${page}' : args[1];
                    }) + (urls[1] ? ('?' + urls[1]) : '')
                    :
                    url.replace(this.options.pageKey + '=' + this.curPage, this.options.pageKey + '=${page}');
                this.options.urlIndex || (this.options.urlIndex = this.options.urlIndex = urlReg);
                this.options.urlPage || (this.options.urlPage = this.options.urlPage = urlReg);
            } else {
                this.options.urlIndex || (this.options.urlIndex = this.options.urlIndex = this.ctx.url);
                if(this.options.pageType == 'params') {
                    this.options.urlPage = urls[0].replace(/\/$/g, '') + '/${page}' + (urls[1] ? ('?' + urls[1]) : '');
                } else {
                    this.options.urlPage = url + (urls[1] ? '&' : '?') + this.options.pageKey + '=${page}';
                }
            }
        }

        return (page == 1 ? this.options.urlIndex : this.options.urlPage).replace('${page}', page);;
    }
}

module.exports = Pagination;
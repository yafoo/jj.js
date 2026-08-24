const {page: cfg_page} = require('./config');
const Context = require('./context');

/**
 * @typedef {import('../types').KoaCtx} KoaCtx
 * @typedef {import('../types').PageConfig} PageConfig
 * @typedef {import('../types').PaginationData} PaginationData
 * @typedef {import('../types').RequestInstance} RequestInstance
 * @typedef {import('../types').UrlInstance} UrlInstance
 */

/**
 * @extends Context
 */
class Pagination extends Context
{
    /**
     * @type {PageConfig}
     * @private
     */
    // @ts-ignore
    options = null;

    /**
     * Initialize a new `Pagination`
     * @public
     * @param {KoaCtx} ctx
     */
    constructor(ctx) {
        super(ctx);
        this._page = 1;
        this._pageSize = 10;
        this._total = 0;
        this._totalPage = 0;
        this.init();
    }

    /**
     * 分页配置
     * @public
     * @param {PageConfig} [options]
     * @returns {this}
     */
    init(options) {
        /**
         * @type {PageConfig}
         * @private
         */
        this.options = {...cfg_page, ...options};
        this._pageKey = this.options.page_key || 'page';

        // 兼容旧配置：params -> param
        const origin = this.options.key_origin || 'query';
        this._keyOrigin = origin === 'params' ? 'param' : origin;
        // URL 生成模式：param 为路径模式，其他为查询参数模式
        this._isPathMode = this._keyOrigin === 'param';

        // 通过 request 类获取页码值（支持 get/post/param/query 四种方式）
        let ctxPage = 0;
        if(this._$request) {
            switch(this._keyOrigin) {
                case 'get':
                    ctxPage = this._$request.get(this._pageKey, 0);
                    break;
                case 'post':
                    ctxPage = this._$request.post(this._pageKey, 0);
                    break;
                case 'param':
                    ctxPage = this._$request.param(this._pageKey, 0);
                    break;
                case 'query':
                default:
                    ctxPage = this._$request.query(this._pageKey, 0);
                    break;
            }
        }
        this._ctxPage = ctxPage;

        this.page(this._ctxPage);
        this.pageSize(this.options.page_size);
        return this;
    }

    /**
     * 设置或获取当前页码
     * @public
     * @param {number} [page]
     * @returns {(this|number)}
     */
    page(page) {
        if(typeof page != 'undefined') {
            let num = parseInt(page, 10);
            if(isNaN(num) || num < 1) {
                num = 1;
            }
            if(this._totalPage && num > this._totalPage) {
                num = this._totalPage;
            }
            this._page = num;
            return this;
        } else {
            return this._page;
        }
    }

    /**
     * 设置或获取分页大小
     * @public
     * @param {number} [page_size]
     * @returns {(this|number)}
     */
    pageSize(page_size) {
        if(typeof page_size != 'undefined') {
            let num = parseInt(page_size, 10);
            if(isNaN(num) || num < 1) {
                num = 10;
            }
            this._pageSize = num;
            return this;
        } else {
            return this._pageSize;
        }
    }

    /**
     * 设置或获取总数
     * @public
     * @param {number} [total]
     * @returns {(this|number)}
     */
    total(total) {
        if(typeof total != 'undefined') {
            let num = parseInt(total, 10);
            if(isNaN(num) || num < 0) {
                num = 0;
            }
            this._total = num;
            return this;
        } else {
            return this._total;
        }
    }

    /**
     * 渲染生成分页html
     * @public
     * @param {number} [total] - 数据总数
     * @param {number} [page] - 当前分页
     * @param {number} [page_size] - 分页大小
     * @returns {string}
     */
    render(total, page, page_size) {
        this.total(total);
        this.pageSize(page_size);
        this._totalPage = Math.ceil(this._total / this._pageSize);
        this.page(page);

        return this._initRule().options['template'].replace(/\$\{(\w+)\}/g, (...args) => {
            // @ts-ignore
            return this['_' + args[1]]();
        });
    }

    /**
     * 返回分页数据（适用于接口响应）
     * @public
     * @param {number} [total] - 数据总数
     * @param {number} [page] - 当前分页
     * @param {number} [page_size] - 分页大小
     * @returns {PaginationData}
     */
    toJSON(total, page, page_size) {
        this.total(total);
        this.pageSize(page_size);
        this._totalPage = Math.ceil(this._total / this._pageSize);
        this.page(page);

        return {
            page: this._page,
            pageSize: this._pageSize,
            total: this._total,
            totalPage: this._totalPage,
        };
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
        const list_left = this.options.page_length / 2;

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

    /**
     * 解析模块
     * @param {string} tpl_key 
     * @param {*} num 
     * @returns 
     */
    _parseTpl(tpl_key, num) {
        // @ts-ignore
        return this.options[tpl_key].replace(/\$\{(\w+)\}/g, (...args) => {
            return args[1] == 'url' ? this._parseUrl(num) : args[1] == 'page' ? num : args[1] == 'total' ? this._total : this._totalPage;
        });
    }

    /**
     * 解析网址
     * @param {number} page 
     * @returns 
     */
    _parseUrl(page) {
        // @ts-ignore
        return ((page == 1 ? this._urlIndex : this._urlPage) || '').replace('${page}', page);
    }

    // 初始网址规则
    _initRule() {
        let url_index = this.options.url_index || '';
        let url_page = this.options.url_page || '';

        // 处理路由命名规则
        if(url_index.slice(0, 1) == ':') {
            // @ts-ignore
            url_index = this._$url.ruleUrl(url_index.substr(1), {[this._pageKey]: '__page__'}).replace('__page__', '${page}');
        }

        if(url_page.slice(0, 1) == ':') {
            // @ts-ignore
            url_page = this._$url.ruleUrl(url_page.substr(1), {[this._pageKey]: '__page__'}).replace('__page__', '${page}');
        }

        // 如果没有自定义规则，根据当前 URL 自动生成
        if(url_index == '' || url_page == '') {
            const currentUrl = this.ctx.url;
            const parsed = new URL(currentUrl, 'http://dummy');

            if(this._ctxPage) {
                // 当前有页码，替换它
                if(!this._isPathMode) {
                    // query 模式：替换 query 参数
                    parsed.searchParams.set(this._pageKey, '${page}');
                    const rule = parsed.pathname + parsed.search.replace('%24%7Bpage%7D', '${page}');
                    url_index || (url_index = rule);
                    url_page || (url_page = rule);
                } else {
                    // path 模式：替换路径中的页码数字
                    const pathParts = parsed.pathname.split('/');
                    for(let i = pathParts.length - 1; i >= 0; i--) {
                        if(pathParts[i] === String(this._page)) {
                            pathParts[i] = '${page}';
                            break;
                        }
                    }
                    const rule = pathParts.join('/') + parsed.search;
                    url_index || (url_index = rule);
                    url_page || (url_page = rule);
                }
            } else {
                // 当前没有页码
                url_index || (url_index = currentUrl);

                if(!this._isPathMode) {
                    // query 模式：添加页码参数
                    parsed.searchParams.set(this._pageKey, '${page}');
                    url_page = parsed.pathname + parsed.search.replace('%24%7Bpage%7D', '${page}');
                } else {
                    // path 模式：在路径末尾添加页码
                    const path = parsed.pathname.replace(/\/$/, '');
                    url_page = path + '/${page}' + parsed.search;
                }
            }
        }

        this._urlIndex = url_index || '';
        this._urlPage = url_page || '';

        return this;
    }

    /**
     * @type {RequestInstance} Request实例
     * @private
     */
    // @ts-ignore
    __request = null;

    /**
     * @type {RequestInstance} Request实例
     */
    get _$request() {
        if(this.__request === null) {
            if(this.$request && this.$request.__ISCLASS__) {
                this.__request = this.$request;
            } else if(this.$ && this.$.request) {
                this.__request = this.$.request;
            } else {
                this.__request = new (require('./request'))(this.ctx);
            }
        }
        return this.__request;
    }

    set _$request(request) {
        this.__request = request;
    }

    /**
     * @type {UrlInstance} Url实例
     * @private
     */
    // @ts-ignore
    __url = null;

    /**
     * @type {UrlInstance} Url实例
     */
    get _$url() {
        if(this.__url === null) {
            if(this.$url && this.$url.__ISCLASS__) {
                this.__url = this.$url;
            } else if(this.$ && this.$.url) {
                this.__url = this.$.url;
            } else {
                this.__url = new (require('./url'))(this.ctx);
            }
        }
        return this.__url;
    }

    set _$url(url) {
        this.__url = url;
    }
}

module.exports = Pagination;
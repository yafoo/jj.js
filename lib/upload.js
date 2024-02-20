const pt = require('path');
const fs = require('fs');
const utils = require('./utils/utils');
const Context = require('./context');
const {app: cfg_app} = require('./config');

/**
 * @typedef {import('formidable').Files} Files
 * @typedef {import('formidable').File} File
 * @typedef {import('../types').UploadData} UploadData
 * @typedef {import('../types').ValidateRule} ValidateRule
 */

/**
 * @extends Context
 */
class Upload extends Context
{
    /**
     * 设置上传文件
     * @public
     * @param {(string|File)} file
     * @returns {this}
     */
    file(file) {
        /**
         * @private
         */
        this._file = /** @type {File} */ (typeof file == 'string' ? this.getFile(file) : file);
        return this;
    }

    /**
     * 设置检查规则
     * @public
     * @param {ValidateRule} [rule]
     * @returns {this}
     */
    validate(rule={}) {
        /**
         * @private
         */
        this._rule = rule;
        return this;
    }

    /**
     * 设置存储文件名或函数
     * @public
     * @param {(string|function)} [name]
     * @returns {this}
     */
    rule(name) {
        /**
         * @private
         */
        this._name = name;
        return this;
    }

    /**
     * 保存文件到目录
     * @public
     * @param {string} [dir]
     * @returns {Promise<(boolean|UploadData)>}
     */
    async save(dir) {
        if(!this.check()) {
            return false;
        }

        let savename = '';
        if(this._name) {
            savename = (typeof this._name == 'function' ? this._name() : this._name) + '';
        } else {
            savename = utils.date.format('YYYY/mmdd/') + utils.md5(Date.now() + Math.random().toString(36).substr(2));
        }
        if(!pt.extname(savename)) {
            savename += pt.extname(this._file.originalFilename);
        }

        try {
            const filePath = pt.join(cfg_app.base_dir, dir, savename);
            await utils.fs.mkdirs(pt.dirname(filePath));
            const reader = fs.createReadStream(this._file.filepath);
            const writer = fs.createWriteStream(filePath);
            reader.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('close', () => {
                    resolve('操作成功！');
                });
                writer.on('error', (err) => {
                    reject(err);
                });
            });
            return {
                filename: pt.basename(savename),
                extname: pt.extname(savename).slice(1),
                savename,
                filepath: filePath,
                name: this._file.originalFilename,
                size: this._file.size,
                mimetype: this._file.mimetype,
                hash: this._file.hash
            };
        } catch(e) {
            this._error = '文件保存失败！';
            return false;
        }
    }

    /**
     * 获取上传文件
     * @public
     * @param {string} [name] - 为空时，获取所有上传文件
     * @returns {(File|File[]|Files)}
     */
    getFile(name) {
        return typeof name == 'string' ? this.ctx.request.files[name] : this.ctx.request.files;
    }

    /**
     * 获取错误信息
     * @public
     * @returns {string}
     */
    getError() {
        return this._error;
    }

    /**
     * 检查上传文件
     * @public
     * @returns {boolean}
     */
    check() {
        if(!this._file) {
            this._error = '上传文件为找到！';
            return false;
        }
        
        const rule = this._rule || {};

        if(rule.size && this._file.size > rule.size) {
            this._error = '上传文件大小不符！';
            return false;
        }

        if(rule.ext && !this.checkExt(rule.ext)) {
            this._error = '上传文件后缀不允许！';
            return false;
        }

        if(rule.type && !this.checkType(rule.type)) {
            this._error = '上传文件MIME类型不允许！';
            return false;
        }

        if(!this.checkImg()) {
            this._error = '上传非法图片文件！';
            return false;
        }

        return true;
    }

    /**
     * 检查上传文件后缀
     * @public
     * @param {(string|array)} ext
     * @returns {boolean}
     */
    checkExt(ext) {
        if(typeof ext == 'string') {
            ext = ext.split(',');
        }
        if(!~ext.indexOf(pt.extname(this._file.originalFilename).slice(1).toLowerCase())) {
            return false;
        }
        return true;
    }

    /**
     * 检查上传文件mimetype
     * @public
     * @param {(string|array)} type
     * @returns {boolean}
     */
    checkType(type) {
        if(typeof type == 'string') {
            type = type.split(',');
        }
        if(!~type.indexOf(this._file.mimetype.toLowerCase())) {
            return false;
        }
        return true;
    }

    /**
     * 检查上传图片
     * @public
     * @returns {boolean}
     */
    checkImg() {
        const fileExt = pt.extname(this._file.originalFilename).slice(1).toLowerCase();
        const fileType = this._file.mimetype.toLowerCase().split('/');
        const exts = ['gif', 'png', 'jpeg', 'webp', 'ico', 'bmp', 'svg', 'jpg', 'tiff'];
        const mimes = ['gif', 'png', 'jpeg', 'webp', 'x-icon', 'bmp', 'svg+xml', 'tiff'];
        if(~exts.indexOf(fileExt) && (fileType[0] != 'image' || !~mimes.indexOf(fileType[1]))) {
            return false;
        }
        return true;
    }
}

module.exports = Upload;
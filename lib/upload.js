const pt = require('path');
const fs = require('fs');
const utils = require('./utils/utils');
const Context = require('./context');

class Upload extends Context
{
    file(file) {
        this._file = typeof file == 'string' ? this.getFile(file) : file;
        return this;
    }

    validate(rule={}) {
        this._rule = rule;
        return this;
    }

    rule(name) {
        this._name = name;
        return this;
    }

    async save(dir) {
        if(!this.check()) {
            return false;
        }

        let savename = '';
        if(this._name || this._name === 0) {
            savename = (typeof this._name == 'function' ? this._name() : this._name) + '';
        } else {
            savename = utils.date.format('YYYY/mmdd/') + utils.md5(new Date().getTime() + Math.random().toString(36).substr(2));
        }
        if(!pt.extname(savename)) {
            savename += pt.extname(this._file.name);
        }

        try {
            const filePath = pt.join(this.$config.app.base_dir, dir, savename);
            await utils.fs.mkdirs(pt.dirname(filePath));
            const reader = fs.createReadStream(this._file.path);
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
                name: this._file.name,
                size: this._file.size,
                type: this._file.type,
                hash: this._file.hash
            };
        } catch(e) {
            this._error = '文件保存失败！';
            return false;
        }
    }

    getFile(name) {
        return typeof name == 'string' ? this.ctx.request.files[name] : this.ctx.request.files;
    }

    getError() {
        return this._error;
    }

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

    checkExt(ext) {
        if(typeof ext == 'string') {
            ext = ext.split(',');
        }
        if(!~ext.indexOf(pt.extname(this._file.name).slice(1).toLowerCase())) {
            return false;
        }
        return true;
    }

    checkType(type) {
        if(typeof type == 'string') {
            type = type.split(',');
        }
        if(!~type.indexOf(this._file.type.toLowerCase())) {
            return false;
        }
        return true;
    }

    // 此判断方法无效
    checkImg() {
        const fileExt = pt.extname(this._file.name).slice(1).toLowerCase();
        const fileType = this._file.type.toLowerCase().split('/');
        const exts = ['gif', 'png', 'jpeg', 'webp', 'ico', 'bmp', 'svg', 'jpg'];
        const mimes = ['gif', 'png', 'jpeg', 'webp', 'x-icon', 'bmp', 'svg+xml'];
        if(~exts.indexOf(fileExt) && (fileType[0] != 'image' || !~mimes.indexOf(fileType[1]))) {
            return false;
        }
        return true;
    }
}

module.exports = Upload;
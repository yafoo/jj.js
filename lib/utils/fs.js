const fs = require('fs');
const pt = require('path');
const fsFun = {};

//(读取类)
['mkdir', 'rmdir', 'readdir', 'readFile', 'copyFile', 'unlink', 'exists', 'stat'].forEach(function (item) {
    fsFun[item] = function (pathname, copypath) {
        return new Promise(function (resolve, reject) {
            let arg = [function (err, data) {
                if (item === 'exists') {
                    return resolve(err);
                }
                if (err) {
                    return reject(err);
                }
                resolve(data || true);
            }];
            item === 'readFile' ? arg.unshift(copypath || 'utf8') : null;
            item === 'copyFile' ? arg.unshift(copypath || '') : null;
            fs[item](pathname, ...arg)
        });
    }
});

//(写入类)
['writeFile', 'appendFile'].forEach(function (item) {
    fsFun[item] = function (pathname, content, charset='utf8') {
        if (typeof content !== 'string') {
            content = JSON.stringify(content)
        };
        return new Promise(function (resolve, reject) {
            fs[item](pathname, content, charset, function(err, data){
                if (err) {
                    return reject(err);
                }
                resolve(data || '');
            });
        });
    }
});

//(判断类)
fsFun.isFileSync = (path) => {return fs.existsSync(path) && fs.statSync(path).isFile();}
fsFun.isDirSync = (path) => {return fs.existsSync(path) && fs.statSync(path).isDirectory();}

['isFile', 'isDir'].forEach(function (item) {
    fsFun[item] = function (pathname) {
        return new Promise(function (resolve, reject) {
            fsFun.exists(pathname).then((result) => {
                if (!result) {
                    resolve(result);
                } else {
                    fsFun.stat(pathname).then((result) => {
                        resolve(item === 'isFile' ? result.isFile() : result.isDirectory());
                    }).catch((error) => {
                        reject(error);
                    });
                }
            }).catch((error) => {
                reject(error);
            });
        });
    }
});

//(多级目录生成)
fsFun.mkdirs = async function (dirname) {
    if(await fsFun.isDir(dirname)) {
        return true;
    } else {
        if(await fsFun.mkdirs(pt.dirname(dirname))) {
            await fsFun.mkdir(dirname);
            return true;
        }
    }
}

module.exports = fsFun;
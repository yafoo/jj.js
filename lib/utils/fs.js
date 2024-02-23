const fs = require('fs');
const fsPromises = require('fs').promises;
const pt = require('path');

// 是否存在
const exists = async path => {
    try {
        await fsPromises.stat(path);
        return true;
    } catch(err) {
        if(err.code === 'ENOENT') {
            return false;
        }
        throw err;
    }
}

// 是否文件
const isFile = async path => {
    try {
        const stats = await fsPromises.stat(path);
        return stats.isFile();
    } catch(err) {
        if(err.code === 'ENOENT') {
            return false;
        }
        throw err;
    }
}
const isFileSync = path => {
    return fs.existsSync(path) && fs.statSync(path).isFile();
}

// 是否目录
const isDir = async path => {
    try {
        const stats = await fsPromises.stat(path);
        return stats.isDirectory();
    } catch(err) {
        if(err.code === 'ENOENT') {
            return false;
        }
        throw err;
    }
}
const isDirSync = path => {
    return fs.existsSync(path) && fs.statSync(path).isDirectory();
}

// 生成多级目录
const mkdirs = async function (dirname) {
    if(await isDir(dirname)) {
        return true;
    } else {
        if(await mkdirs(pt.dirname(dirname))) {
            await fsPromises.mkdir(dirname);
            return true;
        }
    }
}

module.exports = {
    exists,
    isFile,
    isFileSync,
    isDir,
    isDirSync,
    mkdirs
};
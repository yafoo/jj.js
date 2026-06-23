const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const {app: cfg_app} = require('./config');
const toHump = require('./utils/str').toHump;
const Logger = require('./logger');

/**
 * watch
 */
function start() {
    const filter = function(f) {
        const static_dir = cfg_app.static_dir ? path.join(cfg_app.base_dir, cfg_app.static_dir) : '';
        // if(~f.indexOf('.')) return false;
        if((/\.js(on)?$/.test(f)) && ~f.indexOf('types.js')) return false;
        if(static_dir && ~f.indexOf(static_dir)) return false;
        return true;
    };

    let prevFile = {file: null,action: null,stat: null};
    let debounceTimer = null;
    const DEBOUNCE_DELAY = 300; // 300ms 防抖延迟
    
    // 使用 Node.js 原生 fs.watch 替代 watch 包
    const watcher = fs.watch(cfg_app.base_dir, { recursive: true }, (eventType, filename) => {
        // 清除之前的定时器
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        
        // 设置新的防抖定时器
        debounceTimer = setTimeout(() => {
            if (!filename) return;
            
            const fullPath = path.join(cfg_app.base_dir, filename);
            
            // 应用过滤器
            if (!filter(filename)) return;

            // 跳过 node_modules 目录
            if (filename.includes('node_modules')) return;

            try {
                const stat = fs.statSync(fullPath);
                
                if (eventType === 'rename') {
                    // 检查文件是否存在来判断是创建还是删除
                    if (fs.existsSync(fullPath)) {
                        // 文件被创建
                        if (prevFile.file != fullPath || prevFile.action != "created") {
                            prevFile = {file: fullPath, action: "created", stat: stat};
                            createFile(fullPath);
                        }
                    } else {
                        // 文件被删除
                        if (prevFile.file != fullPath || prevFile.action != "removed") {
                            prevFile = { file: fullPath, action: "removed", stat: stat };
                            createFile(fullPath);
                        }
                    }
                } else if (eventType === 'change') {
                    // 文件被修改
                    if (prevFile.file === null || prevFile.file != fullPath) {
                        prevFile = { file: fullPath, action: "change", stat: stat };
                        createFile(fullPath);
                    } else {
                        // 检查修改时间是否真的变化了
                        try {
                            if (!prevFile.stat || prevFile.stat.mtime.getTime() !== stat.mtime.getTime()) {
                                prevFile = { file: fullPath, action: "change", stat: stat };
                                createFile(fullPath);
                            }
                        } catch(e) {
                            prevFile = { file: fullPath, action: "change", stat: stat };
                            createFile(fullPath);
                        }
                    }
                }
            } catch (err) {
                // 忽略统计错误
            }
        }, DEBOUNCE_DELAY);
    });

    // 初始扫描
    scanDirectory(cfg_app.base_dir, (file) => {
        Logger.system("watch:", file);
    }).then(() => {
        createFile();
    });
    
    return watcher;
}

/**
 * 递归扫描目录
 */
async function scanDirectory(dir, callback, ignoreDirs = ['node_modules']) {
    try {
        const files = await fsPromises.readdir(dir, { withFileTypes: true });
        
        for (const file of files) {
            const fullPath = path.join(dir, file.name);
            
            if (file.isDirectory()) {
                if (!ignoreDirs.includes(file.name)) {
                    callback(fullPath);
                    await scanDirectory(fullPath, callback, ignoreDirs);
                }
            } else {
                callback(fullPath);
            }
        }
    } catch (err) {
        Logger.system('scanDirectory error:', err);
    }
}

/**
 * createTypesFile
 */
async function createFile(f) {
    if(f) {
        require.cache[f] && delete(require.cache[f])
        if(f == this._f) {
            return;
        }
        
        this._f && require.cache[this._f] && delete(require.cache[this._f]);
        this._f = f;
    
        const f_info = f.replace(cfg_app.base_dir + path.sep, '').split(path.sep);
        if(cfg_app.app_multi && f_info[0] && f_info[1] && f_info[0] != cfg_app.common_app && f_info[0] != 'config' && !~f_info[0].indexOf('.')) {
            this._APP = f_info[0];
        }
    } else {
        this._APP = cfg_app.default_app;
    }
    

    const ignore = ['node_modules', 'docker', 'package-lock.json', 'types.js', '.git', '.gitignore'];
    ignore.push(path.basename(require.main.filename));
    cfg_app.static_dir && ignore.push(path.join(cfg_app.base_dir, cfg_app.static_dir));

    const node_list = await getNodeList('.', ignore);
    calcNodeList(node_list, this._APP);

    const types_tpl = require('./tpl/types');
    const types_str = types_tpl.replace('__TYPES__', createTypes(node_list)).replace('__PROPERTY__', createProps(node_list));
    const types_js = path.join(cfg_app.base_dir, 'types.js');
    fsPromises.writeFile(types_js, types_str).then(_ => {
        Logger.system('createTypes success:', types_js);
    }).catch(err => {
        Logger.system('createTypes error:', err);
    });
}

// 生成类型定义
function createTypes(node_list, base_type = '') {
    let types = '';
    let props = '';
    Object.entries(node_list).forEach(([path, node]) => {
        const type_name = toHump(base_type + '_' + node.node_name);
        if(node.file_type == 'dir') {
            types += createTypes(node.children, type_name);
        } else {
            if(!node.is_class) {
                types += `/**\n * @typedef {typeof import('${path}')} ${type_name}\n */\n\n`;
            } else {
                types += `/**\n * @typedef {typeof import('${path}')} ${type_name}Class\n`;
                types += ` * @typedef {typeof import('${path}').prototype} ${type_name}Instance\n`;
                types += ` * @typedef {(${type_name}Class & ${type_name}Instance)} ${type_name}\n */\n\n`;
            }
        }

        props += ` * @property {${type_name}} ${node.node_name} - ${path}\n`;
    });

    if(base_type) {
        types += `/**\n * @typedef {object} ${base_type}\n${props} */\n\n`;
    }

    return types;
}

// 生成智能属性
function createProps(node_list) {
    let props = '';

    Object.entries(node_list).forEach(([path, node]) => {
        const type_name = toHump('_' + node.node_name);
        if(type_name != 'Config') {
            props += `\n    /** @type {${type_name}} */\n    $${node.node_name}\n`;
        }
    });

    let type_config = 'JJConfig';
    if(node_list['./config']) {
        type_config = '(JJConfig & Config)';
    }
    props += `\n    /** @type {${type_config}} */\n    $config\n`;

    return props;
}

// 获取节点对象
async function getNodeList(dir, ignore=['node_modules', 'docker', 'package-lock.json', '.git', '.gitignore']) {
    const isClass = require('is-class');
    const files = await fsPromises.readdir(path.join(cfg_app.base_dir, dir), {withFileTypes: true});
    const type_list = {};
    for(const dirent of files) {
        const file_name = dirent.name;
        const file_path = dir + '/' + file_name;
        const node_name = path.parse(file_name).name;
        const abs_path = path.join(cfg_app.base_dir, file_path);
        if(ignore.filter(n => abs_path.includes(n)).length) {
            continue;
        }

        const file_type = dirent.isFile() ? 'file' : dirent.isDirectory() ? 'dir' : '';
        const regFile = /.+\.js(on)?$/.test(file_name);
        const regDir = !file_name.includes('.');
        if(file_type == 'file' && !regFile) {
            continue;
        }
        if(file_type == 'dir' && !regDir) {
            continue;
        }

        if(file_type == 'file') {
            try {
                // @ts-ignore
                type_list[file_path] = {node_name, file_name, file_type, is_class: isClass(require(abs_path))};
            } catch(e) {
                // 包含语法错误时，require会出错
            }
        } else if(file_type == 'dir') {
            type_list[file_path] = {node_name, file_name, file_type, children: await getNodeList(file_path, ignore)};;
        }

    };
    return type_list;
}

// 复制子节点
function copyNodeList(node_list) {
    const copy_node_list = {};
    Object.entries(node_list).forEach(([path, node]) => {
        copy_node_list[path] = {...node};
        if(node.children) {
            copy_node_list[path].children = copyNodeList(node.children);
        }
    });
    return copy_node_list;
}

// 处理common库
function calcNodeList(node_list, _APP) {
    // 处理common
    const node_common = './' + cfg_app.common_app;
    if(cfg_app.common_app && node_list[node_common] && node_list[node_common].children) {
        const children = copyNodeList(node_list[node_common].children);
        Object.entries(children).forEach(([path, node]) => {
            node_list[path] = node;
        });
    }

    // 处理app
    const node_app = './' + _APP;
    if(_APP && node_list[node_app] && node_list[node_app].children) {
        Object.entries(node_list[node_app].children).forEach(([path, node]) => {
            const path_common = path.replace(node_app, node_common);
            if(!node_list[path_common]) {
                node_list[path] = node;
            } else if(node_list[path_common].file_type == 'file') {
                delete node_list[path_common];
                node_list[path] = node;
            } else if(node.children) {
                Object.entries(node.children).forEach(([p, n]) => {
                    const p_commmon = p.replace(node_app, node_common);
                    node_list[path_common].children[p_commmon] && delete node_list[path_common].children[p_commmon];
                    node_list[path_common].children[p] = n;
                });
            }
        });
    }

    // 特殊处理view和response
    const node_view = './' + _APP + '/view';
    const common_view = './' + cfg_app.common_app + '/view';
    if(node_list[node_view] && !node_list[node_view].is_class) {
        delete node_list[node_view];
    }
    if(node_list[common_view] && !node_list[common_view].is_class) {
        delete node_list[common_view];
    }
    const node_response = './' + _APP + '/response';
    const common_response = './' + cfg_app.common_app + '/response';
    if(node_list[node_response] && !node_list[node_response].is_class) {
        delete node_list[node_response];
    }
    if(node_list[common_response] && !node_list[common_response].is_class) {
        delete node_list[common_response];
    }
}

module.exports = start;
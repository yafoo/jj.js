const path = require('path');
const fs = require('fs');
const {app: cfg_app} = require('./config');
const toHump = require('./utils/str').toHump;
const Logger = require('./logger');

/**
 * watch
 */
function start() {
    const watch = require('watch');
    const filter = function(f, stat) {
        const static_dir = cfg_app.static_dir ? path.join(cfg_app.base_dir, cfg_app.static_dir) : '';
        return (!~f.indexOf('.') || /\.js(on)?$/.test(f)) && !~f.indexOf('types.js') && (static_dir && !~f.indexOf(static_dir));
    };

    let prevFile = {file: null,action: null,stat: null};
    watch.watchTree(cfg_app.base_dir, {ignoreDotFiles: true, ignoreDirectoryPattern: /node_modules/, filter}, (f, curr, prev) => {
        if(typeof f == "object" && prev === null && curr === null) {
            // Finished walking the tree
            Object.keys(f).forEach(file => {
                Logger.system("wacth:", file);
            });
        } else if(prev === null) {
            // f is a new file
            if(prevFile.file != f || prevFile.action != "created") {
                prevFile = {file: f, action: "created", stat: curr};
                createFile(f);
            }
        } else if(curr.nlink === 0) {
            // f was removed
            if(prevFile.file != f || prevFile.action != "removed") {
                prevFile = { file: f, action: "removed", stat: curr };
                createFile(f);
            }
        } else {
            // f was changed
            if(prevFile.file === null) {
                createFile(f);
            } else {
                // stat might return null, so catch errors
                try {
                    if (prevFile.stat.mtime.getTime() !== curr.mtime.getTime()) {
                        createFile(f);
                    }
                } catch(e) {
                    createFile(f);
                }
            }
        }
    });
}

/**
 * createTypesFile
 */
function createFile(f) {
    if(this._f == f) {
        return;
    }
    this._f = f;

    const f_info = f.replace(cfg_app.base_dir + path.sep, '').split(path.sep);
    if(f_info[0] && f_info[0] != cfg_app.common_app && !~f_info[0].indexOf('.')) {
        this._APP = f_info[0];
    }

    const ignore = ['node_modules', 'docker', 'package-lock.json', 'types.js'];
    ignore.push(path.basename(module.parent.parent.parent.filename));
    cfg_app.static_dir && ignore.push(path.join(cfg_app.base_dir, cfg_app.static_dir));

    const node_list = getNodeList('.', ignore);
    calcNodeList(node_list, this._APP);

    const types_tpl = require('./tpl/types');
    const types_str = types_tpl.replace('__TYPES__', createTypes(node_list)).replace('__PROPERTY__', createProps(node_list));
    fs.writeFile('types.js', types_str, function(err) {
        if(err) {
            Logger.system('createTypes error:', err);
        } else {
            Logger.system('createTypes success:', path.join(cfg_app.base_dir, 'types.js'));
        }
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
function getNodeList(dir, ignore=['node_modules', 'docker', 'package-lock.json']) {
    const isClass = require('is-class');
    const files = fs.readdirSync(path.join(cfg_app.base_dir, dir), {withFileTypes: true});
    const type_list = {};
    files.forEach(dirent => {
        const file_name = dirent.name;
        const file_path = dir + '/' + file_name;
        const node_name = path.parse(file_name).name;
        const abs_path = path.join(cfg_app.base_dir, file_path);
        if(ignore.filter(n => abs_path.includes(n)).length) {
            return;
        }

        const file_type = dirent.isFile() ? 'file' : dirent.isDirectory() ? 'dir' : '';
        const regFile = /.+\.js(on)?$/.test(file_name);
        const regDir = !file_name.includes('.');
        if(file_type == 'file' && !regFile) {
            return;
        }
        if(file_type == 'dir' && !regDir) {
            return;
        }

        if(file_type == 'file') {
            try {
                // @ts-ignore
                type_list[file_path] = {node_name, file_name, file_type, is_class: isClass(require(abs_path))};
            } catch(e) {
                // 包含语法错误时，require会出错
            }
        } else if(file_type == 'dir') {
            type_list[file_path] = {node_name, file_name, file_type, children: getNodeList(file_path, ignore)};;
        }

    });
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
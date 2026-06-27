const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const {app: cfg_app} = require('./config');
const toCamelCase = require('./utils/parse').toCamelCase;
const Logger = require('./logger');

/**
 * @typedef {Object} NodeInfo
 * @property {string} node_name - 节点名称
 * @property {string} [file_name] - 文件名
 * @property {string} file_type - 文件类型 (file/dir)
 * @property {boolean} [is_class] - 是否为类
 * @property {Object<string, NodeInfo>} [children] - 子节点
 */

/**
 * @typedef {Object} TypesGeneratorState
 * @property {string|null} _f - 当前处理的文件路径
 * @property {string} _APP - 当前应用名称
 * @property {fs.FSWatcher|null} _watcher - 文件监听器
 */

/**
 * @typedef {Object} PrevFile
 * @property {string|null} file
 * @property {string|null} action
 * @property {import('fs').Stats|null} stat
 */

/**
 * TypesGenerator 类型定义生成器
 */
class TypesGenerator {
    constructor() {
        /** @type {TypesGeneratorState} */
        this.state = {
            _f: null,
            _APP: cfg_app.default_app,
            _watcher: null
        };
    }

    /**
     * 启动文件监听并自动生成类型定义
     * @returns {fs.FSWatcher|null}
     */
    watch() {
        const filter = (/** @type {string} */ f) => {
            const static_dir = cfg_app.static_dir ? path.join(cfg_app.base_dir, cfg_app.static_dir) : '';
            if((/\.js(on)?$/.test(f)) && ~f.indexOf('types.js')) return false;
            if(static_dir && ~f.indexOf(static_dir)) return false;
            return true;
        };

        /** @type {PrevFile} */
        let prevFile = {file: null, action: null, stat: null};
        /** @type {NodeJS.Timeout|null} */
        let debounceTimer = null;
        const DEBOUNCE_DELAY = 300;

        this.state._watcher = fs.watch(cfg_app.base_dir, { recursive: true }, (eventType, filename) => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            
            debounceTimer = setTimeout(() => {
                this.handleFileChange(eventType, filename, filter, prevFile);
            }, DEBOUNCE_DELAY);
        });

        // 初始扫描
        this.scanDirectory(cfg_app.base_dir, (/** @type {string} */ file) => {
            Logger.system("watch:", file);
        }).then(() => {
            this.createFile();
        });
        
        return this.state._watcher;
    }

    /**
     * 处理文件变化回调
     * @param {string} eventType - 事件类型 (rename/change)
     * @param {string|null} filename - 文件名
     * @param {function(string): boolean} filter - 过滤器函数
     * @param {PrevFile} prevFile - 上一个文件信息
     */
    handleFileChange(eventType, filename, filter, prevFile) {
        if (!filename) return;
        
        const fullPath = path.join(cfg_app.base_dir, filename);
        
        if (!filter(filename)) return;
        if (filename.includes('node_modules')) return;

        try {
            const stat = fs.statSync(fullPath);
            
            if (eventType === 'rename') {
                if (fs.existsSync(fullPath)) {
                    if (prevFile.file != fullPath || prevFile.action != "created") {
                        prevFile.file = fullPath;
                        prevFile.action = "created";
                        prevFile.stat = stat;
                        this.createFile(fullPath);
                    }
                } else {
                    if (prevFile.file != fullPath || prevFile.action != "removed") {
                        prevFile.file = fullPath;
                        prevFile.action = "removed";
                        prevFile.stat = stat;
                        this.createFile(fullPath);
                    }
                }
            } else if (eventType === 'change') {
                if (prevFile.file === null || prevFile.file != fullPath) {
                    prevFile.file = fullPath;
                    prevFile.action = "change";
                    prevFile.stat = stat;
                    this.createFile(fullPath);
                } else {
                    try {
                        if (!prevFile.stat || prevFile.stat.mtime.getTime() !== stat.mtime.getTime()) {
                            prevFile.file = fullPath;
                            prevFile.action = "change";
                            prevFile.stat = stat;
                            this.createFile(fullPath);
                        }
                    } catch(e) {
                        prevFile.file = fullPath;
                        prevFile.action = "change";
                        prevFile.stat = stat;
                        this.createFile(fullPath);
                    }
                }
            }
        } catch (err) {
            // 忽略统计错误
        }
    }

    /**
     * 递归扫描目录
     * @param {string} dir 
     * @param {function(string): void} callback 
     * @param {string[]} ignoreDirs 
     * @returns {Promise<void>}
     */
    async scanDirectory(dir, callback, ignoreDirs = ['node_modules']) {
        try {
            const files = await fsPromises.readdir(dir, { withFileTypes: true });
            
            for (const file of files) {
                const fullPath = path.join(dir, file.name);
                
                if (file.isDirectory()) {
                    if (!ignoreDirs.includes(file.name)) {
                        callback(fullPath);
                        await this.scanDirectory(fullPath, callback, ignoreDirs);
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
     * 创建类型定义文件
     * @param {string} [f] - 触发变更的文件路径
     * @returns {Promise<void>}
     */
    async createFile(f) {
        if(f) {
            require.cache[f] && delete(require.cache[f]);
            if(f == this.state._f) {
                return;
            }
            
            this.state._f && require.cache[this.state._f] && delete(require.cache[this.state._f]);
            this.state._f = f;
        
            const f_info = f.replace(cfg_app.base_dir + path.sep, '').split(path.sep);
            if(cfg_app.app_multi && f_info[0] && f_info[1] && f_info[0] != cfg_app.common_app && f_info[0] != 'config' && !~f_info[0].indexOf('.')) {
                this.state._APP = f_info[0];
            }
        } else {
            this.state._APP = cfg_app.default_app;
        }
        

        const ignore = ['node_modules', 'docker', 'package-lock.json', 'types.js', '.git', '.gitignore'];
        ignore.push(path.basename(require.main?.filename || 'server.js'));
        cfg_app.static_dir && ignore.push(path.join(cfg_app.base_dir, cfg_app.static_dir));

        const node_list = await this.getNodeList('.', ignore);
        this.calcNodeList(node_list, this.state._APP);

        const types_tpl = require('./tpl/types');
        const types_str = types_tpl.replace('__TYPES__', this.createTypes(node_list)).replace('__PROPERTY__', this.createProps(node_list));
        const types_js = path.join(cfg_app.base_dir, 'types.js');
        fsPromises.writeFile(types_js, types_str).then(_ => {
            Logger.system('createTypes success:', types_js);
        }).catch(err => {
            Logger.system('createTypes error:', err);
        });
    }

    /**
     * 生成类型定义
     * @param {Object<string, NodeInfo>} node_list 
     * @param {string} [base_type] 
     * @returns {string}
     */
    createTypes(node_list, base_type = '') {
        let types = '';
        let props = '';
        Object.entries(node_list).forEach(([path, node]) => {
            const type_name = toCamelCase(base_type + '_' + node.node_name);
            if(node.file_type == 'dir' && node.children) {
                types += this.createTypes(node.children, type_name);
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

    /**
     * 生成智能属性
     * @param {Object<string, NodeInfo>} node_list 
     * @returns {string}
     */
    createProps(node_list) {
        let props = '';

        Object.entries(node_list).forEach(([path, node]) => {
            const type_name = toCamelCase('_' + node.node_name);
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

    /**
     * 获取节点对象
     * @param {string} dir 
     * @param {string[]} ignore 
     * @returns {Promise<Object<string, NodeInfo>>}
     */
    async getNodeList(dir, ignore = ['node_modules', 'docker', 'package-lock.json', '.git', '.gitignore']) {
        const isClass = require('is-class');
        const files = await fsPromises.readdir(path.join(cfg_app.base_dir, dir), {withFileTypes: true});
        /** @type {Object<string, NodeInfo>} */
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
                type_list[file_path] = {node_name, file_name, file_type, children: await this.getNodeList(file_path, ignore)};
            }
        }
        return type_list;
    }

    /**
     * 复制子节点
     * @param {Object<string, NodeInfo>} node_list 
     * @returns {Object<string, NodeInfo>}
     */
    copyNodeList(node_list) {
        /** @type {Object<string, NodeInfo>} */
        const copy_node_list = {};
        Object.entries(node_list).forEach(([path, node]) => {
            copy_node_list[path] = {...node};
            if(node.children) {
                copy_node_list[path].children = this.copyNodeList(node.children);
            }
        });
        return copy_node_list;
    }

    /**
     * 处理common库
     * @param {Object<string, NodeInfo>} node_list 
     * @param {string} _APP 
     */
    calcNodeList(node_list, _APP) {
        // 处理common
        const node_common = './' + cfg_app.common_app;
        if(cfg_app.common_app && node_list[node_common] && node_list[node_common].children) {
            const children = this.copyNodeList(node_list[node_common].children);
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
                        if (node_list[path_common].children) {
                            node_list[path_common].children[p_commmon] && delete node_list[path_common].children[p_commmon];
                            node_list[path_common].children[p] = n;
                        }
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
}

// 创建单例实例
const generator = new TypesGenerator();

module.exports = {
    /**
     * 启动文件监听并自动生成类型定义
     * @returns {fs.FSWatcher|null}
     */
    watch: () => generator.watch(),
    
    /**
     * 手动创建类型定义文件
     * @param {string} [f] - 触发变更的文件路径
     * @returns {Promise<void>}
     */
    createFile: (f) => generator.createFile(f),
    
    /**
     * 获取生成器实例
     * @returns {TypesGenerator}
     */
    generator
};
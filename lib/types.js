const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const {app: {base_dir: BASE_DIR}} = require('./config');
const {toCamelCase, pathToDeep} = require('./utils/internal');
const Logger = require('./logger');
const libs = require('./utils/libs');

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
 * @property {string|null} _deep - 当前处理的文件深度
 * @property {fs.FSWatcher|null} _watcher - 文件监听器
 * @property {string} _content - 生成的类型定义文件内容
 */

/**
 * TypesGenerator 类型定义生成器
 */
class TypesGenerator {
    constructor() {
        /** @type {TypesGeneratorState} */
        this.state = {
            _f: null,
            _deep: null,
            _watcher: null,
            _content: '',
        };
        this.appDir = path.join(BASE_DIR, 'app');
    }

    /**
     * 启动文件监听并自动生成类型定义
     * 只监控 app/ 目录，不存在则等待创建
     * @returns {fs.FSWatcher|null}
     */
    watch() {
        const appDir = this.appDir;
        /** @type {NodeJS.Timeout|null} */
        let debounceTimer = null;
        const DEBOUNCE_DELAY = 300;

        // app 目录不存在时，监控 BASE_DIR 等待创建
        if(!fs.existsSync(appDir)) {
            Logger.system('watch: waiting for app directory:', appDir);
            this.state._watcher = fs.watch(BASE_DIR, (eventType, filename) => {
                if(filename === 'app' && fs.existsSync(appDir)) {
                    this.state._watcher && this.state._watcher.close();
                    this.watch();
                    this.createFile();
                }
            });
            return this.state._watcher;
        }

        // 监控 app/ 目录
        this.state._watcher = fs.watch(appDir, { recursive: true }, (eventType, filename) => {
            if(debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.handleFileChange(eventType, filename);
            }, DEBOUNCE_DELAY);
        });

        // 初始生成
        this.createFile();
        return this.state._watcher;
    }

    /**
     * 处理文件变化回调
     * @param {string} eventType - 文件变化类型
     * @param {string|null} filename - 文件名（相对于 app/）
     */
    handleFileChange(eventType, filename) {
        if(eventType == 'rename') {
            this.createFile();
        }
        if(!filename) return;
        this.createFile(path.join(this.appDir, filename));
    }

    /**
     * 创建类型定义文件
     * @param {string} [f] - 触发变更的文件路径
     * @returns {Promise<void>}
     */
    async createFile(f) {
        if(f) {
            require.cache[f] && delete(require.cache[f]);
            if(f === this.state._f) return;
            this.state._f && require.cache[this.state._f] && delete(require.cache[this.state._f]);
            this.state._f = f;
            const _deep = pathToDeep(path.dirname(path.dirname(f)), BASE_DIR);
            if(this.state._deep === _deep) {
                return;
            }
            this.state._deep = _deep;
        }

        const ignore = [];
        const node_list = await this.getNodeList(this.appDir, this.state._deep, ignore);

        const file_content = this.generateFileContent(node_list);
        const types_js = path.join(BASE_DIR, 'types.js');
        fsPromises.writeFile(types_js, file_content).then(_ => {
            Logger.system('createTypes success:', types_js);
        }).catch(err => {
            Logger.system('createTypes error:', err);
        });
    }

    /**
     * 生成完整的类型文件内容（含层级Ctx继承）
     * @param {Object<string, NodeInfo>} node_list - app/ 下的节点
     * @returns {string}
     */
    generateFileContent(node_list) {
        /** @type {Object<string, string[]>} */
        const $props = {};
        const jj_types = this.createJJTypes();
        const types = this.createTypes(node_list, '', $props);
        const props = this.createProps($props);
        const types_tpl = require('./tpl/types');
        const content = types_tpl.replace('__JJ_TYPES__', jj_types).replace('__TYPES__', types).replace('__PROPERTYS__', props);

        return content;
    }

    /**
     * 生成类型定义
     * @param {Object<string, NodeInfo>} node_list
     * @param {string} [base_type] - 基础类型名
     * @param {Object<string, string[]>} [prop_list] - $属性列表，接收返回值
     * @returns {string} - [类型定义]
     */
    createTypes(node_list, base_type = '', prop_list = {}) {
        const types = [];
        const props = [];
        Object.entries(node_list).forEach(([nodePath, node]) => {
            const type_name = toCamelCase(base_type + '_' + node.node_name);
            // types.js 在根目录，import 路径需要加上 app/ 前缀
            const importPath = './app/' + nodePath.slice(2);
            if(node.file_type == 'dir' && node.children) {
                types.push(this.createTypes(node.children, type_name, prop_list));
            } else {
                if(!node.is_class) {
                    types.push(`/**\n * @typedef {typeof import('${importPath}')} ${type_name}\n */`);
                } else {
                    types.push(`/**
 * @typedef {typeof import('${importPath}')} ${type_name}Class
 * @typedef {typeof import('${importPath}').prototype} ${type_name}Instance
 * @typedef {(${type_name}Class & ${type_name}Instance)} ${type_name}
 **/`);
                }
            }

            props.push(` * @property {${type_name}} ${node.node_name} - ${importPath}`);

            if(!prop_list[node.node_name]) prop_list[node.node_name] = [];
            prop_list[node.node_name].push(type_name);
        });

        if(base_type) {
            types.push(`/**\n * @typedef {object} ${base_type}${props.length ? '\n' : ''}${props.join('\n')}\n **/`);
        }

        return types.join('\n\n');
    }

    /**
     * 生成当前层级的 $ 属性
     * @param {Object<string, string[]>} $props
     * @returns {string}
     */
    createProps($props) {
        const props = [];

        Object.entries($props).forEach(([node_name, types]) => {
            const uni_types = [...types];
            if(libs.includes(node_name)) uni_types.push(`JJ${toCamelCase('_' + node_name)}`);
            props.push(`    /** @type {${uni_types.join(' & ')}} */\n    $${node_name}`);
        });

        return props.join('\n\n');
    }

    /**
     * 生成jj.js系统类型定义
     * @returns {string}
     */
    createJJTypes() {
        return [
            '/**',
            ...libs.filter(lib => lib != 'ctx').map(lib => ` * @typedef {import('jj.js/types').${toCamelCase('_' + lib)}} JJ${toCamelCase('_' + lib)}`),
            '*/'
        ].join('\n');
    }

    /**
     * 获取节点对象
     * @param {string} dir - 绝对路径
     * @param {string} deep - 文件深度
     * @param {string[]} ignore
     * @returns {Promise<Object<string, NodeInfo>>}
     */
    async getNodeList(dir, deep, ignore = ['types.js']) {
        if(deep !== null) {
            const _deep = pathToDeep(dir, BASE_DIR);
            if(_deep && !~deep.indexOf(_deep)) {
                return {};
            }
        }

        const isClass = require('is-class');
        let files;
        try {
            files = await fsPromises.readdir(dir, {withFileTypes: true});
        } catch(e) {
            return {};
        }
        /** @type {Object<string, NodeInfo>} */
        const type_list = {};
        for(const dirent of files) {
            const file_name = dirent.name;
            if(ignore.some(n => file_name.includes(n))) continue;

            const node_name = path.parse(file_name).name;
            const abs_path = path.join(dir, file_name);
            const rel_path = './' + path.relative(this.appDir, abs_path).replace(/\\/g, '/');

            const file_type = dirent.isFile() ? 'file' : dirent.isDirectory() ? 'dir' : '';
            const regFile = /.+\.js(on)?$/.test(file_name);
            const regDir = !file_name.includes('.');
            if(file_type == 'file' && !regFile) continue;
            if(file_type == 'dir' && !regDir) continue;

            if(file_type == 'file') {
                try {
                    // @ts-ignore
                    type_list[rel_path] = {node_name, file_name, file_type, is_class: isClass(require(abs_path))};
                } catch(e) {
                    // 包含语法错误时，require会出错
                }
            } else if(file_type == 'dir') {
                type_list[rel_path] = {node_name, file_name, file_type, children: await this.getNodeList(abs_path, deep, ignore)};
            }
        }
        return type_list;
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

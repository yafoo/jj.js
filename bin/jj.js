#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

const templates = {
    hello: 'Hello World 示例项目',
    todo: 'Todo List 完整示例项目'
};

// 颜色输出
const c = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m'
};

const log = {
    info: (msg) => console.log(`${c.blue}›${c.reset} ${msg}`),
    success: (msg) => console.log(`${c.green}✔${c.reset} ${msg}`),
    warn: (msg) => console.log(`${c.yellow}⚠${c.reset} ${msg}`),
    error: (msg) => console.log(`${c.red}✖${c.reset} ${msg}`)
};

/**
 * 递归复制目录
 */
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * 选择模板
 */
function selectTemplate() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('\n  请选择项目模板:');
        const templateList = Object.entries(templates);
        templateList.forEach(([name, desc], index) => {
            console.log(`    ${index + 1}. ${c.cyan}${name}${c.reset} - ${desc}`);
        });

        rl.question(`\n  ${c.blue}›${c.reset} 请输入序号 ${c.dim}(默认 1)${c.reset}: `, (answer) => {
            rl.close();
            const index = parseInt(answer) - 1;
            if (index >= 0 && index < templateList.length) {
                resolve(templateList[index][0]);
            } else {
                resolve(templateList[0][0]);
            }
        });
    });
}

/**
 * 初始化项目
 */
function initProject(template, targetDir) {
    if (!templates[template]) {
        log.error(`未知的模板 "${template}"`);
        console.log('\n  可用模板:');
        for (const [name, desc] of Object.entries(templates)) {
            console.log(`    ${c.cyan}${name}${c.reset} - ${desc}`);
        }
        process.exit(1);
    }

    const isInPlace = targetDir === '.';
    const targetName = isInPlace ? path.basename(process.cwd()) : path.basename(targetDir);
    const targetPath = isInPlace ? process.cwd() : path.resolve(targetDir);

    console.log('');
    console.log(`  ${c.cyan}jj.js${c.reset} - 轻量级 Node.js MVC 框架`);
    console.log(`  ${c.dim}────────────────────────────${c.reset}`);
    console.log('');

    if (isInPlace) {
        log.info(`在当前目录初始化: ${c.cyan}${targetName}/${c.reset}`);
    } else {
        // 检查目标目录是否为空
        if (fs.existsSync(targetPath) && fs.readdirSync(targetPath).length > 0) {
            log.error(`目录 "${targetName}" 已存在且不为空`);
            process.exit(1);
        }
        fs.mkdirSync(targetPath, { recursive: true });
        log.info(`创建项目目录: ${targetName}/`);
    }

    log.info(`使用模板: ${c.cyan}${template}${c.reset} - ${templates[template]}`);

    // 复制模板文件
    const templatePath = path.join(TEMPLATES_DIR, template);
    copyDir(templatePath, targetPath);
    log.success('模板文件复制完成');

    // 更新 package.json 中的项目名称
    const pkgPath = path.join(targetPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        pkg.name = isInPlace ? path.basename(process.cwd()) : targetDir;
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        log.success('package.json 已更新');
    }

    // 安装依赖
    console.log('');
    log.info('正在安装依赖（这可能需要几分钟）...');
    try {
        execSync('npm install', { cwd: targetPath, stdio: 'inherit' });
        log.success('依赖安装完成');
    } catch (e) {
        log.error('依赖安装失败，请稍后手动执行: npm install');
    }

    // 完成提示
    console.log('');
    console.log(`  ${c.green}✔ 项目创建成功！${c.reset}`);
    console.log('');
    console.log(`  ${c.dim}接下来：${c.reset}`);
    console.log('');
    if (!isInPlace) {
        console.log(`    ${c.cyan}cd ${targetName}${c.reset}`);
    }
    console.log(`    ${c.cyan}npm start${c.reset}`);
    console.log('');
}

/**
 * 显示帮助
 */
function showHelp() {
    console.log('');
    console.log(`  ${c.cyan}jj.js${c.reset} - 轻量级 Node.js MVC 框架`);
    console.log('');
    console.log('  用法:');
    console.log(`    ${c.cyan}npx jj.js init [项目名]${c.reset}   创建新项目（不指定则在当前目录初始化）`);
    console.log(`    ${c.green}npx jj.js help${c.reset}             显示帮助信息`);
    console.log('');
    console.log('  示例:');
    console.log(`    npx jj.js init myapp       # 在 myapp 目录创建项目`);
    console.log(`    npx jj.js init             # 在当前目录初始化`);
    console.log(`    cd myapp`);
    console.log(`    npm start                  # 启动项目`);
    console.log('');
}

// 主入口
const command = process.argv[2];

if (command === 'init') {
    const targetDir = process.argv[3];

    // 先选择模板，再处理目录
    selectTemplate().then(template => {
        if (targetDir) {
            initProject(template, targetDir);
        } else {
            // 动态提示用户输入
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question(`  ${c.blue}›${c.reset} 请输入项目目录名 ${c.dim}(直接回车在当前目录初始化)${c.reset}: `, (answer) => {
                rl.close();
                const dir = answer.trim();
                initProject(template, dir || '.');
            });
        }
    });
} else if (command === 'help' || command === undefined) {
    showHelp();
} else if (command === '--help' || command === '-h') {
    showHelp();
} else {
    log.error(`未知命令: ${command}`);
    showHelp();
    process.exit(1);
}

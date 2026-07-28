#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const templates = {
    hello: 'Hello World 示例项目',
    todo: 'Todo List 完整示例项目'
};

function showHelp() {
    console.log(`
jj.js - 轻量级 Node.js MVC 框架

用法:
  npx jj.js init <project-name>

示例:
  npx jj.js init myapp
`);
}

function selectTemplate() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('\n请选择项目模板:');
        const templateList = Object.entries(templates);
        templateList.forEach(([name, desc], index) => {
            console.log(`  ${index + 1}. ${name.padEnd(10)} - ${desc}`);
        });

        rl.question('\n请输入序号 (1): ', (answer) => {
            rl.close();
            const index = parseInt(answer) - 1;
            if (index >= 0 && index < templateList.length) {
                resolve(templateList[index][0]);
            } else {
                resolve('hello'); // 默认选择第一个
            }
        });
    });
}

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
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

function initProject(template, projectName) {
    if (!templates[template]) {
        console.error(`错误: 未知的模板 "${template}"`);
        console.log('\n可用模板:');
        for (const [name, desc] of Object.entries(templates)) {
            console.log(`  ${name.padEnd(10)} ${desc}`);
        }
        process.exit(1);
    }
    
    const projectPath = path.resolve(process.cwd(), projectName || template + '-app');
    
    if (fs.existsSync(projectPath)) {
        console.error(`错误: 目录 "${projectName}" 已存在`);
        process.exit(1);
    }
    
    console.log(`正在创建 ${templates[template]}...`);
    
    // 复制模板文件
    const templatePath = path.join(__dirname, '..', 'templates', template);
    copyDir(templatePath, projectPath);
    
    // 更新 package.json 中的项目名称
    const pkgPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        pkg.name = projectName || template + '-app';
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }
    
    console.log(`\n✓ 项目创建成功: ${projectPath}`);
    console.log('\n下一步:');
    console.log(`  cd ${projectName || template + '-app'}`);
    console.log('  npm install');
    console.log('  npm start');
}

// 解析命令行参数
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    process.exit(0);
}

if (command === 'init') {
    const projectName = args[1];
    
    if (!projectName) {
        console.error('错误: 请指定项目名称');
        showHelp();
        process.exit(1);
    }
    
    // 交互式选择模板
    selectTemplate().then(template => {
        initProject(template, projectName);
    });
} else {
    console.error(`错误: 未知的命令 "${command}"`);
    showHelp();
    process.exit(1);
}

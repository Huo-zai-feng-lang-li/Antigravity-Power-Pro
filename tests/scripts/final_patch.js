const fs = require('fs');
const path = require('path');

const ROOT = 'c:\\Users\\Administrator\\Desktop\\超级文件\\AI-IDE\\AI\\Antigravity-Power-Pro';
const IDE_RESOURCES = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\Antigravity\\resources\\app';

const CONSTANTS_JS = path.join(ROOT, 'patcher', 'patches', 'cascade-panel', 'constants.js');
const WORKBENCH_JS = path.join(IDE_RESOURCES, 'out', 'vs', 'code', 'electron-browser', 'workbench', 'workbench.js');
const ENHANCE_JS = path.join(ROOT, 'patcher', 'patches', 'shared', 'enhance.js');

function run() {
    try {
        console.log('--- 正在执行最终绝对路径注入 ---');

        // 1. 修改选择器
        let constants = fs.readFileSync(CONSTANTS_JS, 'utf8');
        const broadSelector = '.prose, .prose-sm, .markdown-body, .whitespace-pre-wrap, .break-word, [data-testid*=\"message\"]';
        constants = constants.replace(/export const CONTENT_SELECTOR = .*;/, `export const CONTENT_SELECTOR = '${broadSelector}';`);
        fs.writeFileSync(CONSTANTS_JS, constants);
        console.log('✅ constants.js 已更新');

        // 2. 修改输入框选择器 (enhance.js)
        let enhance = fs.readFileSync(ENHANCE_JS, 'utf8');
        enhance = enhance.replace(/document.querySelector\('\.chat-input textarea'\)/g, 'document.querySelector(".cursor-text, .chat-input textarea, [contenteditable=\\\"true\\\"]")');
        fs.writeFileSync(ENHANCE_JS, enhance);
        console.log('✅ enhance.js 已更新');

        // 3. 寄生注入 workbench.js
        if (fs.existsSync(WORKBENCH_JS)) {
            let content = fs.readFileSync(WORKBENCH_JS, 'utf8');
            const injection = 'import "../../../../../extensions/antigravity/cascade-panel/cascade-panel.js";\n';
            if (!content.includes('cascade-panel.js')) {
                fs.writeFileSync(WORKBENCH_JS, injection + content);
            }
            console.log('✅ workbench.js 注入完成');
        }

        console.log('\n🚀 修改已全部下发。请立即重启反重力 IDE！');

    } catch (e) {
        console.error('❌ 错误:', e.message);
    }
}

run();

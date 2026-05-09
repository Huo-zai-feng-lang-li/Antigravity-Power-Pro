const fs = require('fs');
const path = require('path');

const ROOT = 'c:\\Users\\Administrator\\Desktop\\超级文件\\AI-IDE\\AI\\Antigravity-Power-Pro';
const ENHANCE_JS = path.join(ROOT, 'patcher', 'patches', 'shared', 'enhance.js');
const CONSTANTS_JS = path.join(ROOT, 'patcher', 'patches', 'cascade-panel', 'constants.js');

function run() {
    try {
        console.log('--- 执行 ID 级精准注入 ---');

        // 1. 修改输入框选择器
        let enhance = fs.readFileSync(ENHANCE_JS, 'utf8');
        // 直接使用最强力 ID 选择器
        const newSelector = '#antigravity\\.agentSidePanelInputBox [contenteditable=\"true\"], .cursor-text, .chat-input textarea';
        enhance = enhance.replace(/const inputSelector = .*;/, `const inputSelector = '${newSelector}';`);
        
        // 修正注入逻辑：我们将按钮注入到输入框的父级容器 #antigravity.agentSidePanelInputBox
        enhance = enhance.replace(/const container = input.parentElement;/, 'const container = document.getElementById("antigravity.agentSidePanelInputBox") || input.parentElement;');
        
        fs.writeFileSync(ENHANCE_JS, enhance);
        console.log('✅ enhance.js 已更新 (ID 级适配)');

        // 2. 重新分发资源到 IDE
        // (注：由于我们之前已经在 workbench.js 注入了 import，
        // 同步 patcher/patches 里的文件到 extensions 目录即可)
        console.log('\n🚀 坐标已修正。请执行最后一次重启验证！');

    } catch (e) {
        console.error('❌ 故障:', e.message);
    }
}

run();

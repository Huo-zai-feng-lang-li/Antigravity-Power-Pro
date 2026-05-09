const fs = require('fs');
const path = require('path');

const WORKBENCH_HTML = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\Antigravity\\resources\\app\\out\\vs\\code\\electron-browser\\workbench\\workbench.html';
const PATCH_JS_REL = '../../../../../extensions/antigravity/cascade-panel/cascade-panel.js';
const PATCH_CSS_REL = '../../../../../extensions/antigravity/cascade-panel/cascade-panel.css';

function inject() {
    try {
        console.log('--- 启动主窗口全量注入 ---');
        let content = fs.readFileSync(WORKBENCH_HTML, 'utf8');
        
        const tags = `
<!-- Antigravity Power Pro Injection -->
<link rel="stylesheet" href="${PATCH_CSS_REL}">
<script src="${PATCH_JS_REL}" type="module"></script>
`;

        if (content.includes('cascade-panel.js')) {
            // 先清理旧的标签（防止重复注入）
            content = content.replace(/<!-- Antigravity Power Pro Injection -->[\s\S]*?<script.*cascade-panel\.js.*<\/script>/, '');
        }
        
        content = content.replace('</body>', `${tags}</body>`);
        fs.writeFileSync(WORKBENCH_HTML, content);
        console.log('✅ workbench.html JS & CSS 注入成功！');

    } catch (e) {
        console.error('❌ 故障:', e.message);
    }
}

inject();

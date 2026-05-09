const fs = require('fs');
const path = require('path');

// 绝对路径修正
const PROJECT_ROOT = 'c:\\Users\\Administrator\\Desktop\\超级文件\\AI-IDE\\AI\\Antigravity-Power-Pro';
const IDE_BASE = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\Antigravity\\resources\\app\\extensions\\antigravity';
const PATCH_SRC = path.join(PROJECT_ROOT, 'patcher', 'patches');

async function inject() {
    try {
        console.log('--- 开始[数字化暴力注入] ---');

        if (!fs.existsSync(IDE_BASE)) throw new Error(`IDE路径不存在: ${IDE_BASE}`);

        // 注入 Html
        const htmlTarget = path.join(IDE_BASE, 'cascade-panel.html');
        fs.copyFileSync(path.join(PATCH_SRC, 'cascade-panel.html'), htmlTarget);
        console.log('✅ cascade-panel.html 注入成功');

        // 注入 目录
        const cascadeTargetDir = path.join(IDE_BASE, 'cascade-panel');
        if (!fs.existsSync(cascadeTargetDir)) fs.mkdirSync(cascadeTargetDir);
        
        fs.readdirSync(path.join(PATCH_SRC, 'cascade-panel')).forEach(file => {
            const src = path.join(PATCH_SRC, 'cascade-panel', file);
            if (fs.statSync(src).isFile()) {
                fs.copyFileSync(src, path.join(cascadeTargetDir, file));
            }
        });
        console.log('✅ cascade-panel/ 面板资源更新成功');

        // 注入 shared 文件
        fs.copyFileSync(path.join(PATCH_SRC, 'shared', 'enhance.js'), path.join(cascadeTargetDir, 'enhance.js'));
        console.log('✅ enhance.js 推送成功');

        console.log('\n🔥 注入完成。请直接重启反重力 IDE 查看效果！');
    } catch (e) {
        console.error('❌ 注入失败:', e.message);
    }
}

inject();

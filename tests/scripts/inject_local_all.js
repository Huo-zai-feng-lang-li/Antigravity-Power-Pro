const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = 'c:\\Users\\Administrator\\Desktop\\超级文件\\AI-IDE\\AI\\Antigravity-Power-Pro';
const PATCH_SRC = path.join(PROJECT_ROOT, 'patcher', 'patches');
const APP_RESOURCES = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\Antigravity\\resources\\app';

const TARGETS = [
    {
        name: 'Cascade Panel',
        html: path.join(APP_RESOURCES, 'extensions', 'antigravity', 'cascade-panel.html'),
        dir: path.join(APP_RESOURCES, 'extensions', 'antigravity', 'cascade-panel'),
        patchHtml: 'cascade-panel.html',
        patchDir: 'cascade-panel'
    },
    {
        name: 'Manager Panel (Jetski)',
        html: path.join(APP_RESOURCES, 'out', 'vs', 'code', 'electron-browser', 'workbench', 'workbench-jetski-agent.html'),
        dir: path.join(APP_RESOURCES, 'out', 'vs', 'code', 'electron-browser', 'workbench', 'manager-panel'),
        patchHtml: 'workbench-jetski-agent.html',
        patchDir: 'manager-panel'
    }
];

function syncDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);
    for (const file of files) {
        const s = path.join(src, file);
        const d = path.join(dest, file);
        if (fs.statSync(s).isFile()) {
            fs.copyFileSync(s, d);
        }
    }
}

async function start() {
    console.log('--- 启动[全入口暴力同步] ---');
    for (const t of TARGETS) {
        try {
            console.log(`\n正在处理: ${t.name}`);
            
            // 备份并写入 HTML
            if (fs.existsSync(path.join(PATCH_SRC, t.patchHtml))) {
                if (fs.existsSync(t.html) && !fs.existsSync(t.html + '.bak')) {
                    fs.copyFileSync(t.html, t.html + '.bak');
                }
                fs.copyFileSync(path.join(PATCH_SRC, t.patchHtml), t.html);
                console.log(`  ✅ HTML 已注入: ${path.basename(t.html)}`);
            } else {
                console.warn(`  ⚠️ patch 文件不存在: ${t.patchHtml}`);
            }

            // 同步目录
            const srcDir = path.join(PATCH_SRC, t.patchDir);
            if (fs.existsSync(srcDir)) {
                syncDir(srcDir, t.dir);
                console.log(`  ✅ 资源目录已同步: ${path.basename(t.dir)}`);
                
                // 额外注入 enhance.js (如果需要)
                const enhanceSrc = path.join(PATCH_SRC, 'shared', 'enhance.js');
                if (fs.existsSync(enhanceSrc)) {
                    fs.copyFileSync(enhanceSrc, path.join(t.dir, 'enhance.js'));
                    console.log(`  ✅ enhance.js 已同步到 ${t.name}`);
                }
            }
        } catch (e) {
            console.error(`  ❌ 处理 ${t.name} 失败: ${e.message}`);
        }
    }
    console.log('\n🔥 所有已知入口点已完成 100% 数字化覆盖！');
    console.log('请现在重启反重力 IDE。如果按钮不显示，请反馈控制台日志。');
}

start();

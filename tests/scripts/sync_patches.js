const fs = require('fs');
const path = require('path');

const SRC_PATCHES = 'c:\\Users\\Administrator\\Desktop\\超级文件\\AI-IDE\\AI\\Antigravity-Power-Pro\\patcher\\patches';
const DEST_EXT = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\Antigravity\\resources\\app\\extensions\\antigravity';

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
            console.log(`Synced: ${entry.name}`);
        }
    }
}

try {
    console.log('--- 开始同步补丁资源 ---');
    copyDir(path.join(SRC_PATCHES, 'cascade-panel'), path.join(DEST_EXT, 'cascade-panel'));
    copyDir(path.join(SRC_PATCHES, 'shared'), path.join(DEST_EXT, 'shared'));
    console.log('✅ 同步完成！');
} catch (e) {
    console.error('同步失败:', e.message);
}

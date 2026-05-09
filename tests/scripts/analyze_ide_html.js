const fs = require('fs');
const path = require('path');

function analyze() {
    const filePath = 'c:\\Users\\Administrator\\Desktop\\超级文件\\AI-IDE\\AI\\Antigravity-Power-Pro\\反重力ide.html';
    console.log(`--- 正在解剖: ${filePath} ---`);
    
    if (!fs.existsSync(filePath)) {
        console.error('❌ 文件不存在！');
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // 1. 输入框
    const inputMatches = content.match(/<div[^>]+contenteditable=\"true\"[^>]*>/gi);
    console.log('Found [contenteditable] tags:', inputMatches ? inputMatches.length : 0);
    if (inputMatches) {
        inputMatches.slice(0, 3).forEach(m => console.log('  Input HTML:', m));
    }

    // 2. 类名频率
    const classCount = {};
    const classMatches = content.match(/class=\"([^\"]+)\"/g);
    if (classMatches) {
        classMatches.forEach(m => {
            const cls = m.match(/"([^"]+)"/)[1];
            cls.split(' ').forEach(c => classCount[c] = (classCount[c] || 0) + 1);
        });
    }
    const sorted = Object.entries(classCount).sort((a,b) => b[1] - a[1]).slice(0, 50);
    console.log('Top Classes:', JSON.stringify(sorted, null, 2));

    // 3. 寻找 Markdown 特征
    // 在新版 Tailwind 结构中，经常使用 [data-testid="message-content"]
    const testidMatches = content.match(/data-testid=\"([^\"]+)\"/g);
    console.log('TestID Matches:', testidMatches ? testidMatches.slice(0, 10) : 'None');

    // 4. 定位消息容器的具体类名
    // 技巧：寻找包含 <p> 标签最多的父容器
    console.log('P tag count:', (content.match(/<p/g) || []).length);
}

analyze();

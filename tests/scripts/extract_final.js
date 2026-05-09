const fs = require('fs');

const content = fs.readFileSync('c:\\Users\\Administrator\\Desktop\\超级文件\\AI-IDE\\AI\\Antigravity-Power-Pro\\反重力ide.html', 'utf8');
const match = content.match(/<div[^>]+contenteditable=\"true\"[^>]*>/i);

if (match) {
    console.log('--- FOUND INPUT ---');
    console.log(match[0]);
    
    // 提取它的父级类名
    const index = match.index;
    const snippet = content.substring(Math.max(0, index - 1000), index);
    const parents = snippet.match(/<div[^>]*class=\"([^\"]+)\"[^>]*>/gi);
    if (parents) {
        console.log('--- PARENT CHAIN ---');
        parents.slice(-5).forEach(p => console.log(p));
    }
} else {
    console.log('Input not found');
}

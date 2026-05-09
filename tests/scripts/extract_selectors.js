const fs = require('fs');

function extract() {
    const content = fs.readFileSync('c:\\Users\\Administrator\\Desktop\\超级文件\\AI-IDE\\AI\\Antigravity-Power-Pro\\反重力ide.html', 'utf8');
    
    // 1. 查找所有 contenteditable
    const matches = content.match(/<div[^>]+contenteditable=\"true\"[^>]*>/gi) || [];
    console.log(`Found ${matches.length} editable divs.`);
    
    // 2. 查找包含 "cursor-text" 的 div
    const cursorMatches = content.match(/<div[^>]*class=\"[^\"]*cursor-text[^\"]*\"[^>]*>/gi) || [];
    console.log(`Found ${cursorMatches.length} cursor-text divs.`);
    
    // 3. 打印详细特征以供选择
    console.log('\n--- 候选节点列表 ---');
    [...matches, ...cursorMatches].slice(0, 10).forEach((tag, i) => {
        console.log(`[${i}] ${tag}`);
    });
}

extract();

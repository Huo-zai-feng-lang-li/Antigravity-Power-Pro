const playwright = require('playwright');

async function debug() {
    try {
        const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
        const pages = browser.contexts()[0].pages();
        const page = pages.find(p => p.url().includes('workbench.html'));
        
        if (!page) {
            console.log('未找到 workbench 页面');
            await browser.close();
            return;
        }

        console.log('--- 获取控制台错误 ---');
        // 在页面执行一次报错检查
        const logs = await page.evaluate(() => {
            return {
                config: window.location.href,
                // 检查入口脚本是否已运行
                check: typeof applyFontSize === 'function',
                // 手动尝试导入看看报什么错
                importTest: async () => {
                    try {
                        await import('./enhance.js');
                        return 'OK';
                    } catch (e) {
                        return e.message;
                    }
                }
            };
        });
        
        console.log(JSON.stringify(logs, null, 2));
        
        // 监控一段时间日志
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warn') {
                console.log(`[IDE ${msg.type()}] ${msg.text()}`);
            }
        });

        await new Promise(r => setTimeout(r, 5000));
        await browser.close();
    } catch (e) {
        console.error('CDP 连接失败:', e.message);
    }
}

debug();

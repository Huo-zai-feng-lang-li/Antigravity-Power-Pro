const playwright = require('playwright');

async function debug() {
    try {
        const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
        const page = browser.contexts()[0].pages().find(p => p.url().includes('workbench.html'));
        
        console.log('--- 抓取主窗口控制台 ---');
        
        // 1. 检查是否存在 404
        const resources = await page.evaluate(() => {
            return performance.getEntriesByType('resource')
                .filter(r => r.name.includes('cascade'))
                .map(r => ({ name: r.name, duration: r.duration }));
        });
        console.log('资源加载记录:', JSON.stringify(resources, null, 2));

        // 2. 注入一个测试变量并检查返回
        await page.evaluate(() => {
            console.log('--- Agent CDP Probe ---');
        });

        // 3. 检查控制台最后几条错误
        // (注：Playwright 的 console 事件只能监听生命周期内的，我们要看已发生的)
        const errors = await page.evaluate(() => {
            // 虽然不能看历史，但我们可以搜一下是否有特定报错特征
            return document.body.innerText.includes('CSP') ? 'Detected CSP in DOM' : 'No CSP text';
        });
        console.log('DOM特征检查:', errors);

        await browser.close();
    } catch (e) {
        console.error('调试失败:', e.message);
    }
}

debug();

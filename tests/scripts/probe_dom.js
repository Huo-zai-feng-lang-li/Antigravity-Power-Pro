const playwright = require('playwright');
(async () => {
    try {
        const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
        const page = browser.contexts()[0].pages().find(p => p.url().includes('workbench.html'));
        const results = await page.evaluate(() => {
            // 寻找包含特定文本（比如 AI 回复）的容器类名
            const paragraphs = Array.from(document.querySelectorAll('p, div'));
            const samples = paragraphs.filter(p => p.textContent.length > 50 && p.children.length === 0)
                .map(p => ({
                    parentClass: p.parentElement.className,
                    grandParentClass: p.parentElement.parentElement ? p.parentElement.parentElement.className : '',
                    text: p.textContent.substring(0, 30)
                }));
            return samples.slice(0, 10);
        });
        console.log(JSON.stringify(results, null, 2));
        await browser.close();
    } catch (e) {
        console.error(e);
    }
})();

const playwright = require('playwright');

async function debug() {
    try {
        const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
        const contexts = browser.contexts();
        
        for (const context of contexts) {
            for (const page of context.pages()) {
                const url = page.url();
                if (url.includes('cascade-panel.html') || url.includes('workbench-jetski-agent.html')) {
                    console.log(`\n>>> ANALYZING: ${url}`);
                    
                    const resources = await page.evaluate(() => {
                        return Array.from(document.querySelectorAll('link[rel="stylesheet"], script')).map(el => ({
                            tag: el.tagName,
                            src: el.src || el.href,
                            readyState: el.sheet ? 'loaded' : 'unknown'
                        }));
                    });
                    console.log('Resources found:', resources);

                    // 检查是否存在大的重叠布局
                    const layoutInfo = await page.evaluate(() => {
                        const body = document.body;
                        return {
                            bodyPosition: window.getComputedStyle(body).position,
                            bodyDisplay: window.getComputedStyle(body).display,
                            container: document.getElementById('window-container') ? window.getComputedStyle(document.getElementById('window-container')).position : 'N/A'
                        };
                    });
                    console.log('Layout Info:', layoutInfo);
                }
            }
        }
        await browser.close();
    } catch (e) {
        console.error('FAILED:', e.message);
    }
}
debug();

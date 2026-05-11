const playwright = require('playwright');

async function debug() {
    try {
        const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
        const context = browser.contexts()[0];
        const pages = context.pages();
        
        for (const page of pages) {
            const url = page.url();
            if (url.includes('workbench-jetski-agent.html') || url.includes('cascade-panel.html')) {
                console.log(`\n=== CONSOLE FOR ${url} ===`);
                page.on('console', msg => {
                    console.log(`[${msg.type()}] ${msg.text()}`);
                });
            }
        }
        
        await new Promise(r => setTimeout(r, 5000));
        await browser.close();
    } catch (e) {
        console.error('FAILED:', e.message);
    }
}
debug();

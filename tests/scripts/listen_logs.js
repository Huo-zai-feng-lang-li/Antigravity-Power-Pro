const playwright = require('playwright');

async function debug() {
    try {
        const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
        const contexts = browser.contexts();
        
        for (const context of contexts) {
            for (const page of context.pages()) {
                const url = page.url();
                if (url.includes('cascade-panel.html') || url.includes('workbench-jetski-agent.html')) {
                    console.log(`\n>>> LISTENING: ${url}`);
                    page.on('console', msg => {
                        if (msg.type() === 'error' || msg.type() === 'warn') {
                            console.log(`[${url}] ${msg.type().toUpperCase()}: ${msg.text()}`);
                        }
                    });
                }
            }
        }
        await new Promise(r => setTimeout(r, 3000));
        await browser.close();
    } catch (e) {
        console.error('FAILED:', e.message);
    }
}
debug();

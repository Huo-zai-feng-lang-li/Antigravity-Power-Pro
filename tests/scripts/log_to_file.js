const playwright = require('playwright');
const fs = require('fs');

async function debug() {
    try {
        const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
        const context = browser.contexts()[0];
        const pages = context.pages();
        let logStream = fs.createWriteStream('c:/Users/Administrator/Desktop/超级文件/AI-IDE/AI/Antigravity-Power-Pro/ide_debug.log');
        
        for (const page of pages) {
            const url = page.url();
            page.on('console', msg => {
                logStream.write(`[${url}] [${msg.type()}] ${msg.text()}\n`);
            });
        }
        
        await new Promise(r => setTimeout(r, 5000));
        await browser.close();
        logStream.end();
        console.log('DONE');
    } catch (e) {
        console.error('FAILED:', e.message);
    }
}
debug();

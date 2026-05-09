const playwright = require('playwright');
const fs = require('fs');

async function locate() {
    try {
        const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
        const page = browser.contexts()[0].pages().find(p => p.url().includes('workbench.html'));
        
        const result = await page.evaluate(() => {
            // 定位那个有 "Ask" 提示的输入框
            const els = Array.from(document.querySelectorAll('[contenteditable="true"]'));
            const target = els.find(e => {
                const text = (e.innerText || '').toLowerCase();
                const placeholder = (e.getAttribute('placeholder') || '').toLowerCase();
                return text.includes('ask') || placeholder.includes('ask');
            });

            if (target) {
                return {
                    classes: '.' + target.className.trim().split(/\s+/).join('.'),
                    parentClasses: '.' + target.parentElement.className.trim().split(/\s+/).join('.')
                };
            }
            return 'NOT_FOUND';
        });

        console.log('Result:', result);
        fs.writeFileSync('found_selector.json', JSON.stringify(result));
        await browser.close();
    } catch (e) {
        console.error(e);
    }
}

locate();

const { chromium } = require('playwright-core');
const http = require('http');

function getTargets() {
    return new Promise(r => http.get('http://127.0.0.1:9000/json', res => {
        let d = ''; res.on('data', chunk => d += chunk); res.on('end', () => r(JSON.parse(d)));
    }));
}

(async () => {
    const targets = await getTargets();
    for (const t of targets) {
        if (!t.webSocketDebuggerUrl || t.type === 'worker') continue;
        try {
            const browser = await chromium.connectOverCDP(t.webSocketDebuggerUrl);
            const page = browser.contexts()[0].pages()[0];
            if (page) {
                const info = await page.evaluate(() => {
                    // 全量搜索所有 Button 
                    const btns = Array.from(document.querySelectorAll('button, div[role="button"]'));
                    const match = btns.find(b => b.innerText.includes('✨') || b.className.includes('enhance'));
                    
                    if (!match) return null;
                    
                    const style = window.getComputedStyle(match);
                    const parent = match.parentElement;
                    const pStyle = window.getComputedStyle(parent);
                    
                    return {
                        url: window.location.href,
                        title: document.title,
                        btn: {
                            bottom: style.bottom,
                            className: match.className,
                            innerText: match.innerText
                        },
                        parent: {
                            tagName: parent.tagName,
                            className: parent.className,
                            height: pStyle.height,
                            overflow: pStyle.overflow
                        }
                    };
                });
                if (info) console.log(`[FOUND]`, JSON.stringify(info, null, 2));
            }
            await browser.close();
        } catch (e) {}
    }
    console.log('[End]');
})();

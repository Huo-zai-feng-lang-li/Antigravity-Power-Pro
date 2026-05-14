const { chromium } = require('playwright-core');
const http = require('http');

function getTargets() {
    return new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9000/json', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

(async () => {
    try {
        const targets = await getTargets();
        console.log(`[Debug] HTTP Targets: ${targets.length}`);

        const browser = await chromium.connectOverCDP('http://localhost:9000');
        const contexts = browser.contexts();
        const pages = contexts.flatMap(ctx => ctx.pages());
        
        console.log(`[Debug] Playwright Pages: ${pages.length}`);

        for (const page of pages) {
            const url = page.url();
            console.log(`[Scanning] ${url}`);
            
            const data = await page.evaluate(() => {
                const btn = document.querySelector('.Antigravity-Power-Pro-enhance-btn');
                if (!btn) return null;
                
                const style = window.getComputedStyle(btn);
                const parent = btn.parentElement;
                const parentStyle = parent ? window.getComputedStyle(parent) : {};
                
                return {
                    url: window.location.href,
                    btn: {
                        bottom: style.bottom,
                        position: style.position,
                        classes: btn.className
                    },
                    parent: {
                        tag: parent.tagName,
                        classes: parent.className,
                        position: parentStyle.position,
                        height: parentStyle.height,
                        paddingBottom: parentStyle.paddingBottom
                    }
                };
            }).catch(() => null);

            if (data) {
                console.log('>>> 发现按钮数据:', JSON.stringify(data, null, 2));
                
                // 处理如果是侧边栏的特殊逻辑
                if (url.includes('cascade') || data.parent.classes.includes('textarea')) {
                    console.log('>>> 侧边栏目标锁定！');
                }
            }
        }

        await browser.close();
    } catch (err) {
        console.error('Probing Error:', err.message);
    }
})();

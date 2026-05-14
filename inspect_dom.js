const { chromium } = require('playwright-core');

(async () => {
    let browser;
    try {
        browser = await chromium.connectOverCDP('http://localhost:9000');
        const pages = browser.contexts().flatMap(ctx => ctx.pages());
        
        for (const page of pages) {
            console.log(`[Scanning Page] ${page.url()}`);
            const results = await page.evaluate(() => {
                const found = [];
                
                function scan(node, source = 'Main') {
                    if (!node) return;
                    
                    // 检查当前节点的按钮
                    const btns = node.querySelectorAll('.Antigravity-Power-Pro-enhance-btn');
                    btns.forEach(btn => {
                        const style = window.getComputedStyle(btn);
                        const parent = btn.parentElement;
                        found.push({
                            source,
                            bottom: style.bottom,
                            position: style.position,
                            parentClass: parent ? parent.className : 'N/A',
                            parentStyle: parent ? window.getComputedStyle(parent).position : 'N/A'
                        });
                    });
                    
                    // 深入 Shadow DOM
                    const all = node.querySelectorAll('*');
                    all.forEach(el => {
                        if (el.shadowRoot) scan(el.shadowRoot, `${source} > Shadow`);
                    });
                    
                    // 深入 Iframe (仅限同源或能访问的)
                    if (node === document) {
                        document.querySelectorAll('iframe').forEach((iframe, i) => {
                            try {
                                if (iframe.contentDocument) {
                                    scan(iframe.contentDocument, `${source} > Iframe[${iframe.src || i}]`);
                                }
                            } catch (e) {}
                        });
                    }
                }
                
                scan(document);
                return found;
            });
            
            if (results.length > 0) {
                console.log(`>>> 发现 ${results.length} 个按钮:`, JSON.stringify(results, null, 2));
            }
        }
    } catch (err) {
        console.error('Debug Error:', err.message);
    } finally {
        if (browser) await browser.close();
    }
})();

const { chromium } = require('playwright');
(async () => {
    let browser;
    try {
        browser = await chromium.connectOverCDP('http://localhost:9000');
        const p = browser.contexts()[0].pages().find(p => p.url().includes('workbench.html'));
        if (p) {
            const audit = await p.evaluate(() => {
                const results = {
                    root: !!document.querySelector(".antigravity-agent-side-panel"),
                    scrollables: Array.from(document.querySelectorAll(".overflow-y-auto, .overflow-auto"))
                                     .map(el => ({
                                         classes: el.className,
                                         sh: el.scrollHeight,
                                         ch: el.clientHeight,
                                         isVisible: el.offsetParent !== null
                                     })),
                    btn: !!document.getElementById('cascade-scroll-bottom-btn')
                };
                return results;
            });
            console.log(JSON.stringify(audit, null, 2));
        }
    } catch (e) {
        console.error(e);
    } finally {
        if (browser) await browser.close();
    }
})();

// @ts-nocheck
const { connectCDP } = require("./cdp-utils.js");
(async () => {
    const b = await connectCDP();
    for (const c of b.contexts()) {
        for (const p of c.pages()) {
            const t = await p.title().catch(() => "");
            if (!t.includes("Antigravity-Power-Pro")) continue;
            console.log("=== " + t + " ===");
            const r = await p.evaluate(() => {
                const o = {};
                o.scrollBtnExists = !!document.getElementById('cascade-scroll-bottom-btn');
                o.enhanceCount = document.querySelectorAll('.Antigravity-Power-Pro-enhance-btn').length;
                const panel = document.querySelector('.antigravity-agent-side-panel');
                o.panelExists = !!panel;
                if (panel) {
                    const inp = panel.querySelector('[role="textbox"][contenteditable="true"]') || panel.querySelector('[contenteditable="true"]');
                    o.inputFound = !!inp;
                }
                // check all console errors by looking at script tags
                o.scriptCount = document.querySelectorAll('script[src*="cascade"]').length;
                o.cssCount = document.querySelectorAll('link[href*="cascade"]').length;
                return o;
            });
            console.log(JSON.stringify(r, null, 2));

            // Now get JS console errors
            const errors = await p.evaluate(async () => {
                // Try manually loading config
                try {
                    const r = await fetch("./cascade-panel/config.json", { cache: "no-store" });
                    const j = await r.json();
                    return { configOK: true, enabled: j.promptEnhance?.enabled, apiKey: j.promptEnhance?.apiKey?.substring(0,10) };
                } catch(e) {
                    return { configError: e.message };
                }
            });
            console.log("Config:", JSON.stringify(errors));

            // Try to manually re-init enhance
            const initResult = await p.evaluate(async () => {
                try {
                    const m = await import("./cascade-panel/../shared/enhance.js");
                    return { enhanceLoaded: true, exports: Object.keys(m) };
                } catch(e) {
                    return { enhanceError: e.message };
                }
            });
            console.log("Enhance import:", JSON.stringify(initResult));
        }
    }
    await b.close();
})();

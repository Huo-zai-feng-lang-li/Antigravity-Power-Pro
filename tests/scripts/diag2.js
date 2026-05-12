const { connectCDP } = require("./cdp-utils.js");
(async () => {
    const b = await connectCDP();
    for (const c of b.contexts()) {
        for (const p of c.pages()) {
            const t = await p.title().catch(() => "");
            if (!t.includes("Antigravity-Power-Pro")) continue;
            console.log("=== " + t + " ===");
            // Check console errors via CDP
            const client = await p.context().newCDPSession(p);
            await client.send('Runtime.enable');
            // Evaluate and check errors
            const r = await p.evaluate(() => {
                const o = {};
                // Check if scan.js config loaded
                o.configTest = null;
                try {
                    const url = new URL("./config.json", "vscode-file://vscode-app/d:/Antigravity/resources/app/out/vs/code/electron-browser/workbench/cascade-panel/cascade-panel.js").href;
                    o.configURL = url;
                } catch(e) { o.configURLError = e.message; }
                // Check scan.js errors
                o.allScriptErrors = [];
                // Check enhance module
                o.enhanceModuleCheck = typeof window.__enhanceModule;
                // Try to manually find input and check why button wasn't created
                const panel = document.querySelector('.antigravity-agent-side-panel');
                if (panel) {
                    const inp = panel.querySelector('[role="textbox"][contenteditable="true"]') || panel.querySelector('[contenteditable="true"]');
                    o.inputFound = !!inp;
                    if (inp) {
                        o.inputParent = inp.parentElement?.className?.substring(0,60);
                        o.parentHasBtn = !!inp.parentElement?.querySelector('.Antigravity-Power-Pro-enhance-btn');
                    }
                }
                // Check if config was actually loaded by scan.js
                o.scrollBtnExists = !!document.getElementById('cascade-scroll-bottom-btn');
                return o;
            });
            console.log(JSON.stringify(r, null, 2));
            
            // Now check JS console for errors
            const logs = await p.evaluate(() => {
                // Try to fetch config and see if it works
                return fetch(new URL("./config.json", import.meta?.url || document.currentScript?.src || location.href).href)
                    .then(r => ({ status: r.status, ok: r.ok }))
                    .catch(e => ({ error: e.message }));
            }).catch(e => ({ evalError: e.message }));
            console.log("Config fetch test:", JSON.stringify(logs, null, 2));
        }
    }
    await b.close();
})();

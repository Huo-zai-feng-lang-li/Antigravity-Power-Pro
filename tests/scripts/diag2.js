const { connectCDP } = require("./cdp-utils.js");
const fs = require("fs");
(async () => {
    const b = await connectCDP();
    const out = [];
    for (const c of b.contexts()) {
        for (const p of c.pages()) {
            const t = await p.title().catch(() => "");
            if (t.indexOf("Antigravity-Power") === -1) continue;
            out.push("=== " + t + " ===");
            const r = await p.evaluate(() => {
                const o = {};
                const s = document.getElementById("cascade-scroll-bottom-btn");
                if (s) { const cs = getComputedStyle(s); o.scroll = { bottom: cs.bottom, left: cs.left }; }
                const e = document.querySelectorAll(".Antigravity-Power-Pro-enhance-btn");
                o.enhanceCount = e.length;
                o.btns = [];
                e.forEach((b, i) => {
                    const r = b.getBoundingClientRect();
                    const pp = b.parentElement;
                    const pr = pp.getBoundingClientRect();
                    o.btns.push({ i, bx: r.x|0, by: r.y|0, bw: r.width|0, bh: r.height|0, pCls: pp.className?.substring(0,60), px: pr.x|0, py: pr.y|0, pw: pr.width|0, ph: pr.height|0 });
                });
                const panel = document.querySelector(".antigravity-agent-side-panel");
                o.panelExists = !!panel;
                if (panel) {
                    const inp = panel.querySelector('[role="textbox"][contenteditable="true"]') || panel.querySelector('[contenteditable="true"]');
                    o.panelHasInput = !!inp;
                    if (inp) {
                        const ir = inp.getBoundingClientRect();
                        o.input = { x: ir.x|0, y: ir.y|0, w: ir.width|0, h: ir.height|0 };
                        o.inputHasEnhanceBtn = !!inp.parentElement.querySelector(".Antigravity-Power-Pro-enhance-btn");
                    }
                } else {
                    // check if input exists in document at all
                    const allInp = document.querySelector('[role="textbox"][contenteditable="true"]');
                    o.docHasInput = !!allInp;
                    if (allInp) {
                        o.docInputParent = allInp.parentElement?.className?.substring(0,60);
                    }
                }
                o.enhanceCssInjected = !!document.querySelector('style[data-id="antigravity-enhance-css"]');
                return o;
            });
            out.push(JSON.stringify(r, null, 2));
        }
    }
    await b.close();
    fs.writeFileSync("/tmp/cdp_diag.json", out.join("\n"));
    console.log("DONE: /tmp/cdp_diag.json");
})();

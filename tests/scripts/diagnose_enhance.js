const { connectCDP } = require("./cdp-utils.js");

async function diagnose() {
    const browser = await connectCDP();
    
    for (const ctx of browser.contexts()) {
        for (const page of ctx.pages()) {
            const title = await page.title().catch(() => "N/A");
            
            if (title.includes("Antigravity-Power-Pro")) {
                console.log("=== MAIN WINDOW ===");
                
                const r = await page.evaluate(() => {
                    const logs = [];
                    
                    // 滚动按钮
                    const scrollBtn = document.getElementById('cascade-scroll-bottom-btn');
                    if (scrollBtn) {
                        const cs = window.getComputedStyle(scrollBtn);
                        logs.push(`[SCROLL] bottom=${cs.bottom} left=${cs.left} computed-transform=${cs.transform}`);
                        logs.push(`[SCROLL] rect: ${JSON.stringify(scrollBtn.getBoundingClientRect())}`);
                    }
                    
                    // 提示词按钮
                    const enhanceBtns = document.querySelectorAll('.Antigravity-Power-Pro-enhance-btn');
                    logs.push(`[ENHANCE] count: ${enhanceBtns.length}`);
                    enhanceBtns.forEach((btn, i) => {
                        const rect = btn.getBoundingClientRect();
                        const parent = btn.parentElement;
                        const pRect = parent.getBoundingClientRect();
                        const cs = window.getComputedStyle(btn);
                        logs.push(`[ENHANCE ${i}]`);
                        logs.push(`  btn rect: x=${rect.x.toFixed(0)} y=${rect.y.toFixed(0)} w=${rect.width.toFixed(0)} h=${rect.height.toFixed(0)}`);
                        logs.push(`  visibility=${cs.visibility} display=${cs.display} opacity=${cs.opacity} overflow=${cs.overflow}`);
                        logs.push(`  position=${cs.position} z-index=${cs.zIndex}`);
                        logs.push(`  parent: ${parent.tagName} class="${parent.className?.substring(0,80)}"`);
                        logs.push(`  parent rect: x=${pRect.x.toFixed(0)} y=${pRect.y.toFixed(0)} w=${pRect.width.toFixed(0)} h=${pRect.height.toFixed(0)}`);
                        logs.push(`  parent overflow: ${window.getComputedStyle(parent).overflow}`);
                        
                        // 遍历祖先找 overflow:hidden
                        let node = parent;
                        for (let d = 0; d < 5 && node; d++) {
                            const ncs = window.getComputedStyle(node);
                            if (ncs.overflow === 'hidden' || ncs.overflowY === 'hidden' || ncs.overflowX === 'hidden') {
                                const nRect = node.getBoundingClientRect();
                                logs.push(`  ancestor[${d}] OVERFLOW HIDDEN: ${node.tagName}.${node.className?.substring(0,40)} rect: h=${nRect.height.toFixed(0)} y=${nRect.y.toFixed(0)}`);
                            }
                            node = node.parentElement;
                        }
                    });
                    
                    // 输入框
                    const input = document.querySelector('[role="textbox"][contenteditable="true"]');
                    if (input) {
                        const rect = input.getBoundingClientRect();
                        const parent = input.parentElement;
                        logs.push(`[INPUT] rect: x=${rect.x.toFixed(0)} y=${rect.y.toFixed(0)} w=${rect.width.toFixed(0)} h=${rect.height.toFixed(0)}`);
                        logs.push(`[INPUT] parent class="${parent.className?.substring(0,80)}"`);
                        
                        // 查找同级的 enhance btn
                        const siblingBtn = parent.querySelector('.Antigravity-Power-Pro-enhance-btn');
                        logs.push(`[INPUT] sibling enhance btn: ${!!siblingBtn}`);
                        if (siblingBtn) {
                            const bRect = siblingBtn.getBoundingClientRect();
                            logs.push(`[INPUT] sibling btn rect: x=${bRect.x.toFixed(0)} y=${bRect.y.toFixed(0)} w=${bRect.width.toFixed(0)} h=${bRect.height.toFixed(0)}`);
                        }
                    }
                    
                    return logs;
                });
                
                r.forEach(l => console.log(l));
            }
        }
    }
    
    await browser.close();
}

diagnose().catch(console.error);

const puppeteer = require('puppeteer-core');
const axios = require('axios');

async function test() {
    try {
        const response = await axios.get('http://127.0.0.1:9000/json');
        const pages = response.data;
        // Find the main workbench or jetski-agent page
        const targetPage = pages.find(p => p.url.includes('workbench.html') || p.url.includes('antigravity'));
        if (!targetPage) {
            console.log('Target page not found. Pages:', pages.map(p => p.url));
            return;
        }

        console.log('Connecting to:', targetPage.url);
        const browser = await puppeteer.connect({
            browserWSEndpoint: targetPage.webSocketDebuggerUrl,
            defaultViewport: null
        });

        const [page] = await browser.pages();
        
        // 1. Enter text
        const testText = "测试提示词增强: " + Math.random().toString(36).substring(7);
        console.log('Inputting text:', testText);
        
        // Find input (searching shadow DOM)
        const result = await page.evaluate(async (text) => {
            function querySelectorAllDeep(selector, root = document) {
                const list = [];
                function traverse(node) {
                    if (!node) return;
                    node.querySelectorAll(selector).forEach((el) => list.push(el));
                    const all = node.querySelectorAll("*");
                    all.forEach((child) => {
                        if (child.shadowRoot) traverse(child.shadowRoot);
                    });
                }
                traverse(root);
                return list;
            }

            const inputs = querySelectorAllDeep('[role="textbox"][contenteditable="true"]');
            if (inputs.length === 0) return { error: 'No input found' };
            const input = inputs[0];
            input.focus();
            input.innerText = text;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Click button
            const btns = querySelectorAllDeep('.Antigravity-Power-Pro-enhance-btn');
            if (btns.length === 0) return { error: 'No enhance button found' };
            btns[0].click();
            
            return { success: true, btnText: btns[0].innerText };
        }, testText);

        console.log('Action result:', result);
        
        if (result.success) {
            console.log('Waiting for response (15s)...');
            await new Promise(r => setTimeout(r, 15000));
            
            const finalValue = await page.evaluate(() => {
                function querySelectorAllDeep(selector, root = document) {
                     const list = [];
                    function traverse(node) {
                        if (!node) return;
                        node.querySelectorAll(selector).forEach((el) => list.push(el));
                        const all = node.querySelectorAll("*");
                        all.forEach((child) => {
                            if (child.shadowRoot) traverse(child.shadowRoot);
                        });
                    }
                    traverse(root);
                    return list;
                }
                const inputs = querySelectorAllDeep('[role="textbox"][contenteditable="true"]');
                return inputs[0]?.innerText || "NOT_FOUND";
            });
            
            console.log('Final text in input:', finalValue);
            if (finalValue !== testText && finalValue !== "NOT_FOUND") {
                console.log('✅ TEST PASSED: Echo detected!');
            } else {
                console.log('❌ TEST FAILED: Text unchanged.');
            }
        }

        await browser.disconnect();
    } catch (e) {
        console.error('Test Error:', e.message);
    }
}

test();

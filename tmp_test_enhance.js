const puppeteer = require('puppeteer-core');
const axios = require('axios');

async function test() {
    try {
        const response = await axios.get('http://127.0.0.1:9000/json');
        const pages = response.data;
        
        const mainTab = pages.find(p => p.url.includes('workbench.html'));
        const launchpadTab = pages.find(p => p.url.includes('workbench-jetski-agent.html'));

        if (!mainTab || !launchpadTab) {
            console.log('Tabs not found:', { main: !!mainTab, launchpad: !!launchpadTab });
            return;
        }

        console.log('Connecting to Launchpad to inject proxy...');
        const browserL = await puppeteer.connect({ browserWSEndpoint: launchpadTab.webSocketDebuggerUrl, defaultViewport: null });
        const [pageL] = await browserL.pages();
        
        // Inject Proxy Listener into Launchpad
        await pageL.evaluate(() => {
            if (window.proxyInitialized) return;
            const channel = new BroadcastChannel('Antigravity_Fetch_Proxy');
            channel.onmessage = async (e) => {
                const { id, type, url, options } = e.data || {};
                if (type === 'FETCH_REQUEST') {
                    console.log("[TestProxy] Serving:", url);
                    try {
                        const r = await fetch(url, options);
                        const data = await r.json();
                        channel.postMessage({ id, type: 'FETCH_RESPONSE', ok: r.ok, status: r.status, data });
                    } catch (err) {
                        channel.postMessage({ id, type: 'FETCH_RESPONSE', error: err.message });
                    }
                }
            };
            window.proxyInitialized = true;
            console.log("[TestProxy] Initialized");
        });

        console.log('Connecting to Main Workbench to test button...');
        const browserM = await puppeteer.connect({ browserWSEndpoint: mainTab.webSocketDebuggerUrl, defaultViewport: null });
        const [pageM] = await browserM.pages();

        // 1. Enter text into input (Searching shadow DOM)
        const result = await pageM.evaluate(async () => {
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
            const originalText = "Hello AI, enhance this!";
            input.innerText = originalText;
            input.dispatchEvent(new Event('input', { bubbles: true }));

            const btns = querySelectorAllDeep('.Antigravity-Power-Pro-enhance-btn');
            if (btns.length === 0) return { error: 'No enhance button found' };
            
            console.log("Found button, clicking...");
            btns[0].click();
            return { success: true, originalText };
        });

        console.log('Action result:', result);
        if (result.success) {
            console.log('Waiting 10s for API...');
            await new Promise(r => setTimeout(r, 10000));
            
            const finalText = await pageM.evaluate(() => {
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
                return inputs[0]?.innerText || "";
            });

            console.log('Original Text:', result.originalText);
            console.log('Final Text:', finalText);
            
            if (finalText !== result.originalText && finalText.length > 5) {
                console.log('✅✅✅ INTEGRATION TEST PASSED: API echoed back to input!');
            } else {
                console.log('❌❌❌ INTEGRATION TEST FAILED: Text not updated.');
            }
        }

        await browserL.disconnect();
        await browserM.disconnect();
    } catch (e) {
        console.error('Test Error:', e.stack);
    }
}

test();

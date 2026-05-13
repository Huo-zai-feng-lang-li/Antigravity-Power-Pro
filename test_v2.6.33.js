const puppeteer = require('puppeteer-core');
const axios = require('axios');

async function testV2633() {
    console.log("Connecting to IDE via port 9000...");
    let response;
    try {
        response = await axios.get('http://127.0.0.1:9000/json');
    } catch (e) {
        console.error("Could not connect to port 9000. Please ensure Antigravity is running with --remote-debugging-port=9000");
        return;
    }

    const pages = response.data;
    const sidebarPage = pages.find(p => p.url.includes('workbench.html'));
    const managerPage = pages.find(p => p.url.includes('workbench-jetski-agent.html'));

    if (!sidebarPage || !managerPage) {
        console.error("Critical pages not found. Sidebar:", !!sidebarPage, "Manager:", !!managerPage);
        return;
    }

    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9000' });

    // 1. Monitor Manager for incoming proxy requests
    const manager = (await browser.pages()).find(p => p.url().includes('workbench-jetski-agent.html'));
    if (manager) {
        manager.on('console', msg => console.log(`[Manager Console] ${msg.text()}`));
        manager.on('request', request => {
            if (request.url().includes('completions')) {
                console.log(`[Manager Network] Proxy Fetch detected: ${request.url()}`);
            }
        });
    }

    // 2. Trigger Sidebar
    const sidebar = (await browser.pages()).find(p => p.url().includes('workbench.html'));
    if (sidebar) {
        sidebar.on('console', msg => console.log(`[Sidebar Console] ${msg.text()}`));
        
        console.log("Triggering Prompt Enhancement in Sidebar...");
        
        await sidebar.evaluate(async () => {
            // Helper to find deep
            function findDeep(selector) {
                const search = (root) => {
                    const found = root.querySelector(selector);
                    if (found) return found;
                    const children = root.querySelectorAll('*');
                    for (const child of children) {
                        if (child.shadowRoot) {
                            const result = search(child.shadowRoot);
                            if (result) return result;
                        }
                    }
                    return null;
                };
                return search(document);
            }

            const btn = findDeep('#antigravity-enhance-btn');
            
            if (btn) {
                console.log("Found button, clicking...");
                btn.click();
            } else {
                console.error("Enhance button not found in DOM");
            }
        });
    }

    console.log("Waiting for 5 seconds to observe behavior...");
    await new Promise(r => setTimeout(r, 5000));
    
    await browser.disconnect();
}

testV2633();

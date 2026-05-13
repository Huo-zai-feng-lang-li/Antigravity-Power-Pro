const WebSocket = require('ws');
const axios = require('axios');

async function sendCDP(wsUrl, method, params = {}) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        const id = Math.floor(Math.random() * 1000000);
        ws.on('open', () => ws.send(JSON.stringify({ id, method, params })));
        ws.on('message', (data) => {
            const res = JSON.parse(data.toString());
            if (res.id === id) { ws.close(); resolve(res.result); }
        });
        ws.on('error', reject);
        setTimeout(() => { ws.close(); reject(new Error('CDP Timeout')); }, 10000);
    });
}

async function test() {
    try {
        const response = await axios.get('http://127.0.0.1:9000/json');
        const pages = response.data;
        const mainTab = pages.find(p => p.url.includes('workbench.html'));
        const launchpadTab = pages.find(p => p.url.includes('workbench-jetski-agent.html'));

        if (!mainTab || !launchpadTab) return console.log('Tabs not found');

        // Reset & Inject Proxy
        await sendCDP(launchpadTab.webSocketDebuggerUrl, 'Runtime.evaluate', {
            expression: `(() => {
                const channel = new BroadcastChannel('Antigravity_Fetch_Proxy');
                channel.onmessage = async (e) => {
                    const { id, type, url, options } = e.data || {};
                    if (type === 'FETCH_REQUEST') {
                        try {
                            const r = await fetch(url, options);
                            const data = await r.json();
                            channel.postMessage({ id, type: 'FETCH_RESPONSE', ok: r.ok, status: r.status, data });
                        } catch (err) {
                            channel.postMessage({ id, type: 'FETCH_RESPONSE', error: err.message });
                        }
                    }
                };
            })()`
        });

        // Test Click
        const testText = "告诉我在 Antigravity 2.6.30 中你看到了什么";
        await sendCDP(mainTab.webSocketDebuggerUrl, 'Runtime.evaluate', {
            awaitPromise: true,
            expression: `(async () => {
                const q = (s, r=document) => {
                    const l = [];
                    const t = (n) => {
                        if(!n) return;
                        n.querySelectorAll(s).forEach(e => l.push(e));
                        n.querySelectorAll("*").forEach(c => { if(c.shadowRoot) t(c.shadowRoot); });
                    };
                    t(r); return l;
                };
                const ins = q('[role="textbox"][contenteditable="true"]');
                if(!ins[0]) throw new Error("No input");
                ins[0].focus(); ins[0].innerText = "${testText}";
                ins[0].dispatchEvent(new Event('input', {bubbles:true}));
                const btns = q('.Antigravity-Power-Pro-enhance-btn');
                if(!btns[0]) throw new Error("No btn");
                btns[0].click();
                return "CLICKED";
            })()`
        });

        console.log('Clicked. Waiting 15s for API...');
        await new Promise(r => setTimeout(r, 15000));

        const statusRes = await sendCDP(mainTab.webSocketDebuggerUrl, 'Runtime.evaluate', {
            expression: `(() => {
                const q = (s, r=document) => {
                    const l = [];
                    const t = (n) => {
                        if(!n) return;
                        n.querySelectorAll(s).forEach(e => l.push(e));
                        n.querySelectorAll("*").forEach(c => { if(c.shadowRoot) t(c.shadowRoot); });
                    };
                    t(r); return l;
                };
                const toast = q('.Antigravity-Power-Pro-toast.show')[0];
                const input = q('[role="textbox"][contenteditable="true"]')[0];
                return JSON.stringify({ toast: toast?.innerText, text: input?.innerText });
            })()`
        });

        const val = JSON.parse(statusRes.result.value);
        console.log('Result:', val);
        
        if (val.text && val.text !== testText && val.text.length > 5) {
            console.log('✅ SUCCESS: Text enhanced and echoed!');
        } else if (val.toast) {
            console.log('⚠️ INFO: Toast message found:', val.toast);
        } else {
            console.log('❌ FAIL: Input content not updated.');
        }
    } catch (e) { console.error('Error:', e.message); }
}
test();

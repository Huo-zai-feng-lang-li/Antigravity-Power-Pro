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
        setTimeout(() => { ws.close(); reject(new Error('CDP Timeout')); }, 5000);
    });
}

async function test() {
    try {
        const response = await axios.get('http://127.0.0.1:9000/json');
        const pages = response.data;
        const mainTab = pages.find(p => p.url.includes('workbench.html'));
        const launchpadTab = pages.find(p => p.url.includes('workbench-jetski-agent.html'));

        // Listen for console
        const wsL = new WebSocket(launchpadTab.webSocketDebuggerUrl);
        wsL.on('open', () => {
            wsL.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
            wsL.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
        });
        wsL.on('message', (data) => {
            const res = JSON.parse(data.toString());
            if (res.method === 'Runtime.consoleAPICalled') {
                console.log('[Launchpad Console]', ...res.params.args.map(a => a.value || a.description));
            }
        });

        const wsM = new WebSocket(mainTab.webSocketDebuggerUrl);
        wsM.on('open', () => {
            wsM.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
            wsM.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
        });
        wsM.on('message', (data) => {
            const res = JSON.parse(data.toString());
            if (res.method === 'Runtime.consoleAPICalled') {
                console.log('[Main Console]', ...res.params.args.map(a => a.value || a.description));
            }
        });

        console.log('--- STARTING TEST ---');

        // Inject Proxy logging
        await sendCDP(launchpadTab.webSocketDebuggerUrl, 'Runtime.evaluate', {
            expression: `(() => {
                const channel = new BroadcastChannel('Antigravity_Fetch_Proxy');
                channel.onmessage = async (e) => {
                    const { id, type, url, options } = e.data || {};
                    if (type === 'FETCH_REQUEST') {
                        console.log("[Proxy] Fetching:", url);
                        try {
                            const r = await fetch(url, options);
                            const data = await r.json();
                            console.log("[Proxy] Data Received:", JSON.stringify(data).substring(0, 50) + "...");
                            channel.postMessage({ id, type: 'FETCH_RESPONSE', ok: r.ok, status: r.status, data });
                        } catch (err) {
                            console.log("[Proxy] Error:", err.message);
                            channel.postMessage({ id, type: 'FETCH_RESPONSE', error: err.message });
                        }
                    }
                };
            })()`
        });

        // Click button
        const testText = "测试提示词";
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
                ins[0].focus(); ins[0].innerText = "${testText}";
                ins[0].dispatchEvent(new Event('input', {bubbles:true}));
                const btns = q('.Antigravity-Power-Pro-enhance-btn');
                btns[0].click();
            })()`
        });

        await new Promise(r => setTimeout(r, 20000));
        wsL.close(); wsM.close();
        console.log('--- TEST ENDED ---');
    } catch (e) { console.error('Error:', e.message); }
}
test();

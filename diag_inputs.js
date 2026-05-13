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
        if (!mainTab) return console.log('Main tab not found');

        console.log('Diagnostic: Searching for all inputs...');
        const diag = await sendCDP(mainTab.webSocketDebuggerUrl, 'Runtime.evaluate', {
            expression: `(() => {
                function q(s, r=document) {
                    const l = [];
                    const t = (n) => {
                        if(!n) return;
                        n.querySelectorAll(s).forEach(e => l.push({
                            tag: e.tagName,
                            id: e.id,
                            cls: e.className,
                            role: e.getAttribute('role'),
                            text: e.innerText || e.value || "",
                            visible: e.offsetWidth > 0 && e.offsetHeight > 0
                        }));
                        n.querySelectorAll("*").forEach(c => { if(c.shadowRoot) t(c.shadowRoot); });
                    };
                    t(r); return l;
                }
                const inputs = q('[contenteditable="true"]');
                const textboxes = q('[role="textbox"]');
                return JSON.stringify({ inputs, textboxes });
            })()`
        });

        console.log('Diagnostic Results:', JSON.parse(diag.value));
    } catch (e) {
        console.error('Error:', e.message);
    }
}
test();

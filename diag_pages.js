const WebSocket = require('ws');
const axios = require('axios');

async function sendCDP(wsUrl, method, params = {}) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        const id = Math.floor(Math.random() * 1000000);
        ws.on('open', () => ws.send(JSON.stringify({ id, method, params })));
        ws.on('message', (data) => {
            const res = JSON.parse(data.toString());
            if (res.id === id) { ws.close(); resolve(res); }
        });
        ws.on('error', reject);
        setTimeout(() => { ws.close(); reject(new Error('CDP Timeout')); }, 5000);
    });
}

async function test() {
    try {
        const response = await axios.get('http://127.0.0.1:9000/json');
        const pages = response.data;
        for (const page of pages) {
            if (page.type !== 'page') continue;
            console.log(`Checking page: ${page.title}`);
            const res = await sendCDP(page.webSocketDebuggerUrl, 'Runtime.evaluate', {
                expression: `(function(){
                    const el = document.querySelector('[role="textbox"]') || document.querySelector('[contenteditable="true"]');
                    return el ? (el.tagName + " | " + el.className) : "NOT_FOUND";
                })()`
            });
            console.log('Result:', JSON.stringify(res, null, 2));
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}
test();

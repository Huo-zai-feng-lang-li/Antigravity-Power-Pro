/**
 * 抓取 Manager Panel 的 console 日志.
 * CDP 无法获取历史日志, 此脚本主要用于实时监听.
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 9222;

async function getManagerPage() {
    return new Promise((resolve, reject) => {
        http.get(`http://${CDP_HOST}:${CDP_PORT}/json`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const pages = JSON.parse(data);
                const manager = pages.find(p => p.url.includes('jetski-agent'));
                resolve(manager || null);
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('[日志抓取] 连接 Antigravity Manager...');

    const manager = await getManagerPage();
    if (!manager) {
        console.error('[错误] 未找到 Manager 页面');
        process.exit(1);
    }

    console.log('[日志抓取] 已连接\n');

    const ws = new WebSocket(manager.webSocketDebuggerUrl);
    const logs = [];
    let id = 1;

    ws.on('open', () => {
        // 启用 Runtime 以接收 console 事件.
        ws.send(JSON.stringify({
            id: id++,
            method: 'Runtime.enable',
        }));

        // 同时执行表达式, 用于读取页面缓存的日志数组.
        // 注意: CDP 无法获取历史日志, 只能获取实时日志.
        ws.send(JSON.stringify({
            id: id++,
            method: 'Runtime.evaluate',
            params: {
                expression: `
                    // 检查是否有日志缓存.
                    window.__managerDebugLogs || []
                `,
                returnByValue: true,
            }
        }));
    });

    ws.on('message', (msg) => {
        const data = JSON.parse(msg);

        // 处理 console 事件.
        if (data.method === 'Runtime.consoleAPICalled') {
            const args = data.params.args || [];
            const text = args.map(a => a.value || a.description || '').join(' ');
            if (text.includes('[Manager')) {
                logs.push(text);
            }
        }

        // 处理表达式结果.
        if (data.id === 2 && data.result?.result?.value) {
            const storedLogs = data.result.result.value;
            if (Array.isArray(storedLogs) && storedLogs.length > 0) {
                console.log('='.repeat(60));
                console.log('存储的日志');
                console.log('='.repeat(60));
                storedLogs.forEach(log => console.log(log));
            }
        }
    });

    // 监听实时日志 5 秒.
    console.log('正在监听实时 console 日志 (5 秒)...\n');

    await new Promise(r => setTimeout(r, 5000));

    ws.close();

    if (logs.length > 0) {
        console.log('='.repeat(60));
        console.log('实时捕获的日志');
        console.log('='.repeat(60));
        logs.forEach(log => console.log(log));
    } else {
        console.log('未捕获到 [Manager] 相关日志');
        console.log('提示：请重新安装补丁并重启 Antigravity，然后在启动完成后运行此脚本');
    }
}

main().catch(console.error);

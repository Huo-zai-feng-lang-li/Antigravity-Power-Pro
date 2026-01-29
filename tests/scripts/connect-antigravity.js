/**
 * 连接 Antigravity 远程调试端口.
 *
 * 使用方法:
 * 1. 启动 Antigravity: & "E:\\Program Files\\Antigravity\\Antigravity.exe" --remote-debugging-port=9222
 * 2. 复制终端显示的 WebSocket URL (ws://127.0.0.1:9222/devtools/browser/xxx)
 * 3. 运行: node scripts/connect-antigravity.js "ws://127.0.0.1:9222/devtools/browser/xxx"
 */

const { chromium } = require('playwright');

async function main() {
    // 从命令行参数获取 WebSocket URL.
    const wsUrl = process.argv[2];

    if (!wsUrl) {
        console.log('❌ 请提供 WebSocket URL 作为参数！\n');
        console.log('使用方法:');
        console.log('  node scripts/connect-antigravity.js "ws://127.0.0.1:9222/devtools/browser/xxxxxx"\n');
        console.log('WebSocket URL 可以在启动 Antigravity 时的终端输出中找到:');
        console.log('  DevTools listening on ws://127.0.0.1:9222/devtools/browser/xxxxxx\n');
        process.exit(1);
    }

    console.log(`🔗 正在连接到: ${wsUrl}\n`);

    try {
        // 直接使用 WebSocket URL 连接
        const browser = await chromium.connectOverCDP(wsUrl);
        console.log('✅ 成功连接到 Antigravity!\n');

        // 获取所有上下文和页面
        const contexts = browser.contexts();
        console.log(`📂 找到 ${contexts.length} 个浏览器上下文\n`);

        let pageIndex = 0;
        for (const context of contexts) {
            const pages = context.pages();
            for (const page of pages) {
                pageIndex++;
                const title = await page.title();
                const url = page.url();
                console.log(`--- 页面 ${pageIndex} ---`);
                console.log(`   标题: ${title}`);
                console.log(`   URL: ${url}`);
                console.log('');
            }
        }

        // 如果有页面, 选择第一个进行 DOM 探索.
        if (contexts.length > 0 && contexts[0].pages().length > 0) {
            const firstPage = contexts[0].pages()[0];
            console.log('🔍 正在分析第一个页面的 DOM 结构...\n');

            // 获取顶层元素信息
            const bodyInfo = await firstPage.evaluate(() => {
                const body = document.body;
                const children = Array.from(body.children).map(el => ({
                    tag: el.tagName.toLowerCase(),
                    id: el.id || '(无)',
                    className: el.className || '(无)',
                    childCount: el.children.length
                }));
                return {
                    totalElements: document.querySelectorAll('*').length,
                    bodyChildren: children
                };
            });

            console.log(`📊 DOM 统计:`);
            console.log(`   总元素数: ${bodyInfo.totalElements}`);
            console.log(`   body 直接子元素数: ${bodyInfo.bodyChildren.length}\n`);

            console.log('📋 body 直接子元素:');
            bodyInfo.bodyChildren.forEach((child, i) => {
                console.log(`   ${i + 1}. <${child.tag}> id="${child.id}" class="${child.className}" (${child.childCount} 个子元素)`);
            });
        }

        console.log('\n📌 提示: 连接保持打开状态，你可以在脚本中添加更多调试代码');
        console.log('   按 Ctrl+C 退出\n');

        // 保持脚本运行, 方便进一步调试.
        await new Promise(() => { });

    } catch (error) {
        console.error('❌ 连接失败:', error.message);
        console.log('\n请确保:');
        console.log('1. Antigravity 已使用以下命令启动:');
        console.log('   & "E:\\Program Files\\Antigravity\\Antigravity.exe" --remote-debugging-port=9222');
        console.log('2. 端口 9222 没有被其他程序占用');
        console.log('3. Antigravity 已完全启动并显示主界面');
    }
}

main();

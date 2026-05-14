const { chromium } = require('playwright');

(async () => {
    try {
        const browser = await chromium.connectOverCDP('http://localhost:9000');
        const contexts = browser.contexts();
        
        console.log(`[Debug] 已开启的上下文数: ${contexts.length}`);
        
        for (const context of contexts) {
            const pages = context.pages();
            for (const page of pages) {
                const url = page.url();
                console.log(`[Debug] 页面 URL: ${url}`);
                
                if (url.includes('cascade-panel.html')) {
                    console.log(`[Debug] 锁定侧边栏页面: ${url}`);
                    
                    const result = await page.evaluate(() => {
                        const btn = document.querySelector('.Antigravity-Power-Pro-enhance-btn');
                        if (!btn) return "未找到增强按钮";
                        
                        const style = window.getComputedStyle(btn);
                        const parent = btn.parentElement;
                        const parentStyle = parent ? window.getComputedStyle(parent) : null;
                        
                        return {
                            button: {
                                bottom: style.bottom,
                                right: style.right,
                                position: style.position,
                                zIndex: style.zIndex,
                                margin: style.margin,
                                display: style.display,
                                visibility: style.visibility
                            },
                            parent: parent ? {
                                tagName: parent.tagName,
                                className: parent.className,
                                position: parentStyle.position,
                                bottom: parentStyle.bottom,
                                height: parentStyle.height,
                                paddingBottom: parentStyle.paddingBottom,
                                overflow: parentStyle.overflow
                            } : "无父容器"
                        };
                    });
                    
                    console.log('[Debug] 探测结果:', JSON.stringify(result, null, 2));
                }
            }
        }
        
        await browser.close();
    } catch (e) {
        console.error('[Debug] 探测失败:', e);
    }
})();

const playwright = require('playwright');

(async () => {
  try {
    const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
    const contexts = browser.contexts();
    
    for (const context of contexts) {
      for (const page of context.pages()) {
        const url = page.url();
        if (!url.includes('workbench.html') || url.includes('jetski')) continue;

        const result = await page.evaluate(() => {
          const CONVERSATION_SELECTORS = [
            '.antigravity-agent-side-panel',
            '.h-full.overflow-y-auto.min-h-0',
            '[class*="chat-background"]',
            '[data-testid="chat-list"]',
            '[role="log"]',
            '.overflow-y-auto',
          ];
          const NOISE_SELECTORS = [
            'nav', '[class*="sidebar"]', '[class*="workspace"]',
            '[class*="toolbar"]', '[class*="statusbar"]',
            'button', '[role="button"]', '[class*="tab-"]',
          ];

          for (const selector of CONVERSATION_SELECTORS) {
            const el = document.querySelector(selector);
            if (!el) continue;
            const clone = el.cloneNode(true);
            NOISE_SELECTORS.forEach(ns => clone.querySelectorAll(ns).forEach(n => n.remove()));
            const text = clone.innerText?.trim();
            if (text && text.length > 30) {
              return { selector, textLength: text.length, sample: text.slice(-300) };
            }
          }
          return { selector: null, textLength: 0, sample: '' };
        });

        if (result.selector) {
          console.log(`✅ 命中选择器: "${result.selector}"`);
          console.log(`   文本长度: ${result.textLength} 字符`);
          console.log(`   最近内容 (末尾300字):\n${result.sample}`);
        } else {
          console.log('❌ 所有选择器均未命中');
        }
      }
    }
    await browser.close();
  } catch (err) {
    console.error('CDP Error:', err.message);
  }
})();

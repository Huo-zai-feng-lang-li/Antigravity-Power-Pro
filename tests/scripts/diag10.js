const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
  for (const ctx of browser.contexts()) {
    for (const page of ctx.pages()) {
      if (!page.url().includes('workbench.html') || page.url().includes('jetski')) continue;
      const r = await page.evaluate(() => {
        const NOISE = ['nav', 'select', '[role="combobox"]', 'button', '[role="button"]',
          '[class*="toolbar"]', '[class*="statusbar"]', '[class*="model-picker"]', '[class*="tab-"]'];
        
        const el = document.querySelector('.antigravity-agent-side-panel .overflow-y-auto');
        if (!el) return { found: false };
        const clone = el.cloneNode(true);
        NOISE.forEach(s => clone.querySelectorAll(s).forEach(n => n.remove()));
        const text = clone.innerText?.trim() || '';
        return { found: true, len: text.length, tail: text.slice(-400), head: text.slice(0, 200) };
      });
      console.log('found:', r.found, '长度:', r.len);
      console.log('\n--- 开头 ---\n', r.head);
      console.log('\n--- 末尾 ---\n', r.tail);
    }
  }
  await browser.close();
})();

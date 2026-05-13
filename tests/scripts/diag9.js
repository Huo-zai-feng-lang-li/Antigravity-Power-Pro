const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
  for (const ctx of browser.contexts()) {
    for (const page of ctx.pages()) {
      if (!page.url().includes('workbench.html') || page.url().includes('jetski')) continue;
      const r = await page.evaluate(() => {
        // 检查两种选择器采集结果
        const sel1 = document.querySelector('.antigravity-agent-side-panel');
        const sel2 = document.querySelector('.h-full.overflow-y-auto.min-h-0');
        
        const getCleanText = (el) => {
          if (!el) return null;
          const clone = el.cloneNode(true);
          ['button', '[role="button"]', 'nav', 'select', '[class*="toolbar"]', '[class*="statusbar"]', 'input'].forEach(s => {
            clone.querySelectorAll(s).forEach(n => n.remove());
          });
          return clone.innerText?.trim() || '';
        };
        
        const t1 = getCleanText(sel1);
        const t2 = getCleanText(sel2);
        return {
          sel1_len: t1?.length || 0,
          sel1_tail: t1?.slice(-300) || '',
          sel2_found: !!sel2,
          sel2_len: t2?.length || 0,
          sel2_tail: t2?.slice(-300) || '',
        };
      });
      console.log('=== antigravity-agent-side-panel ===');
      console.log('长度:', r.sel1_len, '字符');
      console.log('末尾:\n', r.sel1_tail);
      console.log('\n=== .h-full.overflow-y-auto.min-h-0 ===');
      console.log('found:', r.sel2_found, '长度:', r.sel2_len);
      console.log('末尾:\n', r.sel2_tail);
    }
  }
  await browser.close();
})();

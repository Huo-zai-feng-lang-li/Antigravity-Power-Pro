const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
  for (const ctx of browser.contexts()) {
    for (const page of ctx.pages()) {
      if (!page.url().includes('workbench.html') || page.url().includes('jetski')) continue;
      
      const r = await page.evaluate(() => {
        const el = document.querySelector('.antigravity-agent-side-panel .h-full.overflow-y-auto.grow')
          || document.querySelector('.antigravity-agent-side-panel .overflow-y-auto.grow');
        if (!el) return { found: false, reason: 'no .grow selector match' };
        const t = el.innerText?.trim() || '';
        return { found: true, len: t.length, tail: t.slice(-300) };
      });
      
      console.log('found:', r.found, 'len:', r.len);
      if (r.found) console.log('tail:\n', r.tail);
      else console.log('reason:', r.reason);
    }
  }
  await browser.close();
})();

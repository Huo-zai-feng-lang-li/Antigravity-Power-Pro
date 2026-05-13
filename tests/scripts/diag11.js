const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
  for (const ctx of browser.contexts()) {
    for (const page of ctx.pages()) {
      if (!page.url().includes('workbench.html') || page.url().includes('jetski')) continue;
      
      const r = await page.evaluate(() => {
        const panel = document.querySelector('.antigravity-agent-side-panel');
        if (!panel) return 'panel not found';
        
        // 找到 panel 内所有 overflow-y-auto 容器，分析每个
        const candidates = panel.querySelectorAll('.overflow-y-auto');
        const results = Array.from(candidates).map((el, i) => {
          const text = el.innerText?.trim() || '';
          return {
            i,
            className: el.className.substring(0, 80),
            textLen: text.length,
            sample: text.substring(0, 100),
          };
        });
        return results;
      });
      
      console.log('panel 内 overflow-y-auto 列表:\n');
      r.forEach(item => {
        console.log(`[${item.i}] len=${item.textLen} class="${item.className}"`);
        console.log(`    text: "${item.sample}"\n`);
      });
    }
  }
  await browser.close();
})();

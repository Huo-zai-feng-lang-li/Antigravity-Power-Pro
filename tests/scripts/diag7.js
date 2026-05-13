const playwright = require('playwright');

(async () => {
  try {
    const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
    const contexts = browser.contexts();
    
    for (const context of contexts) {
      for (const page of context.pages()) {
        const url = page.url();
        if (!url.includes('workbench.html') || url.includes('jetski')) continue;
        console.log(`\n=== 分析 ${url} ===\n`);
        
        // 1. 扫描所有 iframe/frame
        const frames = page.frames();
        console.log(`Frames count: ${frames.length}`);
        for (const f of frames) {
          console.log(`  Frame URL: ${f.url()}`);
        }

        // 2. 在主 frame 中扫描可能包含对话内容的元素
        const result = await page.evaluate(() => {
          const candidates = [
            '.cascade-scrollbar',
            '[class*="cascade-scrollbar"]',
            '[class*="CascadePanel"]',
            '[class*="cascade-panel"]',
            '[class*="chat"]',
            '[data-testid]',
            '[role="log"]',
            '.overflow-y-auto',
            // 找到侧边栏的父容器
            '.antigravity-agent-side-panel',
            '[class*="side-panel"]',
            '[class*="sidePanel"]',
            '[class*="sidebar"]',
          ];
          
          const hits = {};
          for (const sel of candidates) {
            const els = document.querySelectorAll(sel);
            if (els.length > 0) {
              hits[sel] = Array.from(els).map(el => ({
                tag: el.tagName,
                className: el.className.substring(0, 80),
                childCount: el.childElementCount,
                textSample: el.innerText?.trim()?.substring(0, 100) || ''
              }));
            }
          }
          return hits;
        });
        
        console.log('\n候选选择器命中结果:');
        for (const [sel, items] of Object.entries(result)) {
          console.log(`\n  "${sel}" (${items.length} 个):`);
          items.slice(0, 2).forEach(i => console.log(`    [${i.tag}] class=${i.className} text="${i.textSample}"`));
        }
        if (Object.keys(result).length === 0) {
          console.log('  ❌ 所有选择器均未命中！');
        }
      }
    }
    await browser.close();
  } catch (err) {
    console.error('CDP Error:', err.message);
  }
})();

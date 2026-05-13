const playwright = require('playwright');

(async () => {
  try {
    const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
    const contexts = browser.contexts();
    
    console.log(`Found ${contexts.length} contexts`);
    
    for (const context of contexts) {
      const pages = context.pages();
      for (const page of pages) {
        const url = page.url();
        const title = await page.title();
        console.log(`Page: ${title} (${url})`);
        
        if (url.includes('workbench.html') || url.includes('cascade-panel.html')) {
          console.log(`Analyzing target page: ${url}`);
          
          const result = await page.evaluate(() => {
            const btn = document.getElementById('cascade-scroll-bottom-btn');
            if (!btn) return 'Button not found';
            
            const style = window.getComputedStyle(btn);
            return {
              id: btn.id,
              className: btn.className,
              rect: btn.getBoundingClientRect(),
              computedStyle: {
                position: style.position,
                bottom: style.bottom,
                left: style.left,
                right: style.right,
                transform: style.transform,
                zIndex: style.zIndex
              },
              container: btn.parentElement?.className || btn.parentElement?.tagName
            };
          });
          
          console.log('Scroll Button Analysis:', JSON.stringify(result, null, 2));
        }
      }
    }
    
    await browser.close();
  } catch (error) {
    console.error('CDP Error:', error);
  }
})();

const playwright = require('playwright');

(async () => {
  try {
    const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
    const contexts = browser.contexts();
    
    for (const context of contexts) {
      const pages = context.pages();
      for (const page of pages) {
        const url = page.url();
        console.log(`Checking page: ${url}`);
        if (url.includes('cascade-panel.html')) {
          console.log('Found Cascade Panel page!');
          const result = await page.evaluate(() => {
             const sel = '[class*="cascade-scrollbar"]';
             const el = document.querySelector(sel);
             return {
                found: !!el,
                html: el ? el.outerHTML.substring(0, 500) : 'not found'
             };
          });
          console.log('Cascade Result:', result);
        }
      }
    }
    await browser.close();
  } catch (error) {
    console.error('CDP Error:', error);
  }
})();

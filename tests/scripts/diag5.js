const playwright = require('playwright');

(async () => {
  try {
    const browser = await playwright.chromium.connectOverCDP('http://localhost:9000');
    const contexts = browser.contexts();
    
    for (const context of contexts) {
      const pages = context.pages();
      for (const page of pages) {
        const url = page.url();
        if (url.includes('workbench.html')) {
          const result = await page.evaluate(() => {
            const CONVERSATION_SELECTORS = [
              '[class*="cascade-scrollbar"]',
              '[data-testid="chat-list"]',
              '[class*="conversation"]',
              '[role="log"]'
            ];
            
            const NOISE_SELECTORS = [
              'nav', '[class*="sidebar"]', 'button', '[role="button"]'
            ];

            let foundSelector = null;
            let text = "";

            for (const selector of CONVERSATION_SELECTORS) {
              const el = document.querySelector(selector);
              if (el) {
                foundSelector = selector;
                const clone = el.cloneNode(true);
                NOISE_SELECTORS.forEach(s => {
                  clone.querySelectorAll(s).forEach(n => n.remove());
                });
                text = clone.innerText.trim().substring(0, 500);
                break;
              }
            }
            
            return { foundSelector, sampleText: text };
          });
          console.log('DOM Collection Result:', JSON.stringify(result, null, 2));
        }
      }
    }
    await browser.close();
  } catch (error) {
    console.error('CDP Error:', error);
  }
})();

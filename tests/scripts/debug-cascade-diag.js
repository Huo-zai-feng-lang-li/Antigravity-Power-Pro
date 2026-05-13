const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9000');
  const contexts = browser.contexts();
  
  for (const ctx of contexts) {
    for (const page of ctx.pages()) {
      if (!page.url().includes('workbench.html') || page.url().includes('jetski')) continue;
      
      // Type something in the input
      const inputEl = await page.$('[contenteditable="true"][role="textbox"]');
      if (!inputEl) {
        console.log('No input found');
        continue;
      }
      
      // Type test text
      await inputEl.click();
      await page.keyboard.type('test prompt text');
      await page.waitForTimeout(500);
      
      // Now check what findCascadeInput would return
      const result = await page.evaluate(() => {
        // Simulate findCascadeInput logic
        const INPUT_SELECTORS = [
          '.antigravity-agent-side-panel [role="textbox"]',
          '.antigravity-agent-side-panel [contenteditable="true"]',
          '[placeholder*="Ask anything"]',
          '[contenteditable="true"]',
        ];
        const INPUT_SELECTOR = INPUT_SELECTORS.join(", ");
        
        function querySelectorAllDeep(selector, root = document) {
          const list = [];
          function traverse(node) {
            if (!node) return;
            node.querySelectorAll(selector).forEach((el) => list.push(el));
            const all = node.querySelectorAll("*");
            all.forEach((child) => {
              if (child.shadowRoot) traverse(child.shadowRoot);
            });
          }
          traverse(root);
          return list;
        }
        
        const inputs = querySelectorAllDeep(INPUT_SELECTOR);
        
        return {
          total: inputs.length,
          elements: inputs.map((el, i) => ({
            index: i,
            tag: el.tagName,
            role: el.getAttribute('role'),
            class: (el.className || '').substring(0, 80),
            innerText: (el.innerText || '').substring(0, 100),
            textContent: (el.textContent || '').substring(0, 100),
            value: el.value,
            valueType: typeof el.value,
            contentEditable: el.contentEditable,
            innerHTML: el.innerHTML.substring(0, 150),
          })),
        };
      });
      
      console.log('=== After typing "test prompt text" ===');
      console.log(JSON.stringify(result, null, 2));
      
      // Clean up: clear the input
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
    }
  }
  
  await browser.close();
})();

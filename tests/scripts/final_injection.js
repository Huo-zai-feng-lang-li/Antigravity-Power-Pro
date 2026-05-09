const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function injectLocally() {
    let browser;
    try {
        console.log('Connecting to IDE...');
        browser = await chromium.connectOverCDP('http://localhost:9000');
        
        // Find workbench page
        const p = browser.contexts()[0].pages().find(p => p.url().includes('workbench.html'));
        if (!p) {
            console.error('Workbench page not found!');
            return;
        }
        
        console.log('Reading patch files...');
        const cssPath = 'c:\\Users\\Administrator\\Desktop\\超级文件\\AI-IDE\\AI\\Antigravity-Power-Pro\\patcher\\patches\\cascade-panel\\cascade-panel.css';
        const jsPath = 'c:\\Users\\Administrator\\Desktop\\超级文件\\AI-IDE\\AI\\Antigravity-Power-Pro\\patcher\\patches\\cascade-panel\\scroll-to-bottom.js';
        
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        const jsContentRaw = fs.readFileSync(jsPath, 'utf8');
        
        // Prepare JS: remove export, make it a self-invoking function
        const jsContent = `
            (() => {
                ${jsContentRaw.replace(/export const init =/g, 'const init =')}
                init();
            })();
        `;
        
        console.log('Injecting CSS...');
        await p.addStyleTag({ content: cssContent });
        
        console.log('Injecting JS...');
        await p.evaluate((code) => {
            const script = document.createElement('script');
            script.textContent = code;
            document.body.appendChild(script);
        }, jsContent);
        
        console.log('Injection successful!');
        
        // Verify existence of container
        const verification = await p.evaluate(() => {
            const el = Array.from(document.querySelectorAll('.overflow-y-auto, .overflow-auto'))
                        .sort((a,b) => b.scrollHeight - a.scrollHeight)[0];
            return {
                foundContainer: !!el,
                scrollHeight: el?.scrollHeight,
                classes: el?.className
            };
        });
        console.log('Verification:', JSON.stringify(verification, null, 2));
        
    } catch (e) {
        console.error('Error during injection:', e);
    } finally {
        if (browser) await browser.close();
    }
}

injectLocally();

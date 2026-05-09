const { chromium } = require('playwright');
const fs = require('fs');

async function injectWithTrust() {
    let browser;
    try {
        browser = await chromium.connectOverCDP('http://localhost:9000');
        const p = browser.contexts()[0].pages().find(p => p.url().includes('workbench.html'));
        if (!p) return;
        
        const cssPath = 'c:\\Users\\Administrator\\Desktop\\超级文件\\AI-IDE\\AI\\Antigravity-Power-Pro\\patcher\\patches\\cascade-panel\\cascade-panel.css';
        const jsPath = 'c:\\Users\\Administrator\\Desktop\\超级文件\\AI-IDE\\AI\\Antigravity-Power-Pro\\patcher\\patches\\cascade-panel\\scroll-to-bottom.js';
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        const jsContentRaw = fs.readFileSync(jsPath, 'utf8');
        
        await p.evaluate(({css, js}) => {
            // Register bypass if not exists
            if (window.trustedTypes && !window.trustedTypes.defaultPolicy) {
                try {
                    window.trustedTypes.createPolicy('default', {
                        createHTML: (s) => s,
                        createScript: (s) => s,
                        createScriptURL: (s) => s,
                    });
                } catch(e) {}
            }

            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);

            const code = `
                (() => {
                    ${js.replace(/export const init =/g, 'const init =')}
                    init();
                })();
            `;
            
            const script = document.createElement('script');
            // Use Trusted Types if available
            if (window.trustedTypes && window.trustedTypes.defaultPolicy) {
                script.text = window.trustedTypes.defaultPolicy.createScript(code);
            } else {
                script.textContent = code;
            }
            document.body.appendChild(script);
        }, {css: cssContent, js: jsContentRaw});
        
        console.log('Final Injection Success!');
    } catch (e) {
        console.error(e);
    } finally {
        if (browser) await browser.close();
    }
}

injectWithTrust();

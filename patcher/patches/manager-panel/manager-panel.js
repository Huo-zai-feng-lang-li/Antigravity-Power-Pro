/**
 * Manager Panel 补丁入口 (Unified Workbench Entry)
 * 适配新版 IDE (Cascade 整合进 Workbench 模式)
 * 
 * 功能 (极简模式)：
 * - 只有 字体大小调整 和 滚动到底部按钮
 */

const SCRIPT_BASE = new URL('./', import.meta.url).href;

const DEFAULT_CONFIG = {
    mermaid: false,        // 已按需禁用
    math: false,           // 已按需禁用
    copyButton: false,     // 已按需禁用
    tableColor: false,     // 已按需禁用
    maxWidthEnabled: false,
    maxWidthRatio: 75,
    fontSizeEnabled: true,
    fontSize: 14,
    scrollToBottom: true,
    promptEnhance: {
        enabled: true,
        apiBase: "http://127.0.0.1:8045/v1",
        apiKey: "",
        model: "gemini-3-flash",
    },
};

const loadStyle = (href) => {
    return new Promise((resolve, reject) => {
        const fullHref = new URL(href, SCRIPT_BASE).href;
        if (document.querySelector(`link[href="${fullHref}"]`)) {
            resolve();
            return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fullHref;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load CSS: ${fullHref}`));
        document.head.appendChild(link);
    });
};

const loadConfig = async () => {
    try {
        const configUrl = new URL('config.json', SCRIPT_BASE).href;
        const res = await fetch(configUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        return { ...DEFAULT_CONFIG, ...data };
    } catch {
        return DEFAULT_CONFIG;
    }
};

const applyFontSize = (userConfig) => {
    const root = document.documentElement;
    if (!root || !userConfig?.fontSizeEnabled) return;
    root.style.setProperty('--manager-panel-font-size', `${userConfig.fontSize}px`);
};

(async () => {
    console.log('[Manager Panel] 补丁载入 (极简模式：字体+滚动+提示词增强)...');

    try {
        await loadStyle('manager-panel.css');
    } catch (err) {
        console.warn('[Manager Panel] 样式未加载');
    }

    const config = await loadConfig();
    applyFontSize(config);

    // 1. 提示词增强模块 (支持所有输入框)
    if (config.promptEnhance?.enabled) {
        try {
            const enhance = await import('../shared/enhance.js');
            enhance.init(config.promptEnhance);
            enhance.injectStyles();

            // 监听所有输入框
            const observer = new MutationObserver(() => {
                const inputs = document.querySelectorAll('textarea, [contenteditable="true"]');
                inputs.forEach(input => {
                    if (input.parentElement.querySelector(".Antigravity-Power-Pro-enhance-btn") || 
                        input.classList.contains("Antigravity-Power-Pro-exclude")) return;

                    const btn = enhance.createEnhanceButton(async () => {
                        const text = input.value || input.textContent || "";
                        if (!text.trim()) {
                            enhance.showToast("请先输入提示词", "error");
                            return;
                        }

                        btn.classList.add("loading");
                        try {
                            const enhanced = await enhance.enhance(text);
                            await enhance.setInputValue(input, enhanced);
                        } catch (error) {
                            enhance.showToast(error.message, "error");
                        } finally {
                            btn.classList.remove("loading");
                        }
                    });

                    // 注入
                    input.parentElement.style.position = "relative";
                    input.parentElement.appendChild(btn);
                });
            });

            observer.observe(document.body, { childList: true, subtree: true });
            console.log('[Manager Panel] 提示词增强已开启');
        } catch (e) {
            console.error('[Manager Panel] 提示词模块加载失败:', e);
        }
    }

    // 2. 扫描逻辑 (基础扫描)
    const { start } = await import('./scan.js');
    start(config);

    // 3. 启动滚动到底部 (支持 Cascade 和 Manager 窗口)
    if (config.scrollToBottom !== false) {
        try {
            const { init } = await import('./scroll-to-bottom.js');
            init();
        } catch (e) {
            console.warn('[Manager Panel] 滚动模块加载失败');
        }
    }

    console.log('[Manager Panel] 极简补丁已就绪');
})();

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
    console.log('[Manager Panel] 补丁载入 (极简模式：字体+滚动)...');

    try {
        await loadStyle('manager-panel.css');
    } catch (err) {
        console.warn('[Manager Panel] 样式未加载');
    }

    const config = await loadConfig();
    applyFontSize(config);

    // 1. 扫描逻辑 (仅保留基础扫描以支持未来扩展，目前主要通过 CSS 控制字体)
    const { start } = await import('./scan.js');
    start(config);

    // 2. 启动滚动到底部 (支持 Cascade 和 Manager 窗口)
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

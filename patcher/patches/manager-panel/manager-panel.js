/**
 * Manager Panel 补丁入口 (Unified Workbench Entry)
 * 适配新版 IDE (Cascade 整合进 Workbench 模式)
 * 
 * 功能：
 * - 滚动到底部、提示词增强、字体大小调整（默认关闭）
 */

// 1. 注册受信任类型策略 (必须在最前面)
if (window.trustedTypes && !window.trustedTypes.defaultPolicy) {
  window.trustedTypes.createPolicy("default", {
    createHTML: (string) => string,
    createScriptURL: (string) => string,
    createScript: (string) => string,
  });
}

const SCRIPT_BASE = new URL('./', import.meta.url).href;
const FEATURE_DEFAULTS_VERSION = 1;

const DEFAULT_CONFIG = {
    featureDefaultsVersion: FEATURE_DEFAULTS_VERSION,
    scrollToBottom: true,
    fontSizeEnabled: false,
    fontSize: 16,
    promptEnhance: {
        enabled: true,
    },
};

const normalizeConfig = (data = {}) => {
    const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    const merged = {
        ...DEFAULT_CONFIG,
        ...source,
        promptEnhance: { ...DEFAULT_CONFIG.promptEnhance, ...(source.promptEnhance || {}) },
    };
    if ((Number(source.featureDefaultsVersion) || 0) < FEATURE_DEFAULTS_VERSION) {
        merged.fontSizeEnabled = false;
    }
    merged.featureDefaultsVersion = FEATURE_DEFAULTS_VERSION;
    return merged;
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
        return normalizeConfig(data);
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
    console.log('[Manager Panel] 补丁载入 (滚动+提示词+字体)...');

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



    console.log('[Manager Panel] 补丁已就绪 (字体+滚动+提示词)');
})();

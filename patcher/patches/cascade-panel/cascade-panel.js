/**
 * Antigravity-Power-Pro 补丁入口 (Trusted Types 增强版)
 */

// 1. 注册受信任类型策略 (必须在最前面)
if (window.trustedTypes && !window.trustedTypes.defaultPolicy) {
  window.trustedTypes.createPolicy("default", {
    createHTML: (string) => string,
    createScriptURL: (string) => string,
    createScript: (string) => string,
  });
  console.log("[Cascade] Trusted Types 'default' policy registered.");
}

import { loadStyle } from "./utils.js";

const DEFAULT_CONFIG = {
  mermaid: true,
  math: true,
  copyButton: true,
  tableColor: true,
  fontSizeEnabled: true,
  fontSize: 14,
  scrollToBottom: true,
  placeholder: "Ask Antigravity...",
  promptEnhance: {
    enabled: true,
    apiBase: "http://127.0.0.1:8045/v1",
    apiKey: "",
    model: "gemini-3-flash",
    systemPrompt: "",
  },
};

// 后续逻辑保持不变...
// 已经同步修改的代码逻辑：
const loadConfig = async () => {
    try {
        const res = await fetch("./cascade-panel/config.json", { cache: "no-store" });
        return await res.json();
    } catch {
        return DEFAULT_CONFIG;
    }
};

const applyFontSize = (userConfig) => {
    const root = document.documentElement;
    if (root && userConfig?.fontSizeEnabled) {
        root.style.setProperty("--cascade-panel-font-size", `${userConfig.fontSize}px`);
    }
};

(async () => {
    console.log("[Cascade] 补丁加载中...");
    
    // 1. 加载样式
    try {
        await loadStyle("cascade-panel.css");
    } catch (err) {
        console.warn("[Cascade] 样式加载失败:", err);
    }

    const config = await loadConfig();
    applyFontSize(config);

    // 2. 提示词增强模块
    if (config.promptEnhance?.enabled) {
        try {
            const enhance = await import("../shared/enhance.js");
            enhance.init(config.promptEnhance);
            enhance.injectStyles();
            enhance.startInjectionScanner();
            console.log("[Cascade] 提示词增强监听已启动");
        } catch (e) {
            console.error("[Cascade] 提示词加载失败:", e);
        }
    }

    // 3. 启动扫描与滚动逻辑
    try {
        const { start } = await import("./scan.js");
        start(config);

        if (config.scrollToBottom !== false) {
            const { init } = await import("./scroll-to-bottom.js");
            init();
        }
    } catch (e) {
        console.error("[Cascade] 扫描模块加载失败:", e);
    }
})();

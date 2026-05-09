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
  const config = await loadConfig();
  applyFontSize(config);

  // 重要：在 Trusted Types 环境下，动态 import 可能仍受限
  // 按照我们之前的逻辑，enhance.js 已经移动到同级目录
  if (config.promptEnhance?.enabled) {
    try {
      const { init, injectStyles } = await import("../shared/enhance.js");
      init(config.promptEnhance);
      injectStyles();
      console.log("[Cascade] 提示词增强模块已加载");
    } catch (e) {
      console.error("[Cascade] 提示词加载失败:", e);
    }
  }

  const { start } = await import("./scan.js");
  start(config);

  if (config.scrollToBottom !== false) {
    const { init } = await import("./scroll-to-bottom.js");
    init();
  }
})();

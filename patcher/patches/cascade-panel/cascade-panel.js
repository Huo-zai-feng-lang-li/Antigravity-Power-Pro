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

const FEATURE_DEFAULTS_VERSION = 1;
const DEFAULT_OFF_KEYS = ["mermaid", "math", "copyButton", "tableColor", "fontSizeEnabled"];

const DEFAULT_CONFIG = {
  featureDefaultsVersion: FEATURE_DEFAULTS_VERSION,
  mermaid: false,
  math: false,
  copyButton: false,
  tableColor: false,
  fontSizeEnabled: false,
  fontSize: 14,
  scrollToBottom: true,
  placeholder: "Ask Antigravity...",
  promptEnhance: {
    enabled: true,
    apiBase: "https://api.freemodel.dev/v1",
    apiKey: "",
    model: "gpt-5.4-mini",
    systemPrompt: "",
  },
};

const normalizeConfig = (data = {}) => {
    const source = data && typeof data === "object" && !Array.isArray(data) ? data : {};
    const merged = {
        ...DEFAULT_CONFIG,
        ...source,
        promptEnhance: { ...DEFAULT_CONFIG.promptEnhance, ...(source.promptEnhance || {}) },
    };
    if ((Number(source.featureDefaultsVersion) || 0) < FEATURE_DEFAULTS_VERSION) {
        DEFAULT_OFF_KEYS.forEach((key) => {
            merged[key] = false;
        });
    }
    merged.featureDefaultsVersion = FEATURE_DEFAULTS_VERSION;
    return merged;
};

// 后续逻辑保持不变...
// 已经同步修改的代码逻辑：
const loadConfig = async () => {
    try {
        const configUrl = new URL("./config.json", import.meta.url).href;
        const res = await fetch(configUrl, { cache: "no-store" });
        const data = await res.json();
        return normalizeConfig(data);
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

  // scan.js 内部会加载 enhance 模块，这里不重复初始化
  const { start } = await import("./scan.js");
  start(config);

  if (config.scrollToBottom !== false) {
    const { init } = await import("./scroll-to-bottom.js");
    init();
  }
})();

/**
 * Windsurf Panel 补丁入口
 * 功能: 字体大小调节 + 提示词增强 + 滚动到底部
 *
 * 注入点: workbench.html (主窗口)
 * Cascade 面板直接在主窗口 DOM 中, 无 iframe 隔离
 */

/**
 * Windsurf CSP 启用了 require-trusted-types-for 'script',
 * 必须在任何 innerHTML 赋值之前创建 default 策略.
 * workbench-windsurf.html 的 CSP trusted-types 白名单已添加 'default'.
 */
if (window.trustedTypes && !window.trustedTypes.defaultPolicy) {
  try {
    window.trustedTypes.createPolicy("default", {
      createHTML: (s) => s,
      createScript: (s) => s,
      createScriptURL: (s) => s,
    });
  } catch { /* policy already exists */ }
}

const SCRIPT_BASE = new URL("./", import.meta.url).href;

const DEFAULT_CONFIG = {
  fontSizeEnabled: false,
  fontSize: 16,
  promptEnhance: {
    enabled: false,
    provider: "anthropic",
    apiBase: "https://api.anthropic.com",
    apiKey: "",
    model: "claude-sonnet-4-5-20250514",
    systemPrompt: "",
  },
};

const loadConfig = async () => {
  try {
    const url = new URL("config.json", SCRIPT_BASE).href;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Config load failed: ${res.status}`);
    const data = await res.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return DEFAULT_CONFIG;
    }
    return { ...DEFAULT_CONFIG, ...data };
  } catch {
    return DEFAULT_CONFIG;
  }
};

const loadStyle = (href) => {
  return new Promise((resolve, reject) => {
    const fullHref = new URL(href, SCRIPT_BASE).href;
    if (document.querySelector(`link[href="${fullHref}"]`)) {
      resolve();
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fullHref;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load CSS: ${fullHref}`));
    document.head.appendChild(link);
  });
};

const applyFontSize = (userConfig) => {
  const panel = document.getElementById("windsurf.cascadePanel");
  const root = panel || document.documentElement;

  if (!userConfig?.fontSizeEnabled) {
    root.style.removeProperty("--windsurf-panel-font-size");
    return;
  }

  const size = Number(userConfig.fontSize);
  if (!Number.isFinite(size) || size <= 0) {
    root.style.removeProperty("--windsurf-panel-font-size");
    return;
  }

  root.style.setProperty("--windsurf-panel-font-size", `${size}px`);
};

/**
 * 等待 Cascade 面板 DOM 就绪
 * Windsurf 的 Cascade 面板是延迟渲染的, 需要等待
 */
const waitForCascadePanel = (timeout = 15000) => {
  return new Promise((resolve) => {
    const el = document.getElementById("windsurf.cascadePanel");
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const el = document.getElementById("windsurf.cascadePanel");
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(document.getElementById("windsurf.cascadePanel"));
    }, timeout);
  });
};

/**
 * 初始化提示词增强
 */
const initPromptEnhance = async (config) => {
  try {
    const enhance = await import("./enhance.js");
    enhance.init(config.promptEnhance);
    enhance.injectStyles();

    const startScan = () => {
      const panel = document.getElementById("windsurf.cascadePanel");
      if (!panel) return;

      const injectButton = () => {
        const input = panel.querySelector(
          '[contenteditable][role="textbox"], textarea, [contenteditable="true"]',
        );
        if (!input) return;

        const container = input.closest(
          '[class*="vscroll"], [class*="input"], [class*="rounded"]',
        );
        const parent = container || input.parentElement;
        if (!parent || parent.querySelector(".Antigravity-Power-Pro-enhance-btn"))
          return;

        const btn = enhance.createEnhanceButton(async () => {
          const currentInput = panel.querySelector(
            '[contenteditable][role="textbox"], textarea, [contenteditable="true"]',
          );
          if (!currentInput) {
            enhance.showErrorModal("找不到输入框");
            return;
          }

          const text = currentInput.value || currentInput.textContent || "";
          if (!text.trim()) {
            enhance.showErrorModal("请先输入提示词");
            return;
          }

          btn.classList.add("loading");
          try {
            const enhanced = await enhance.enhance(text);
            await enhance.setInputValue(currentInput, enhanced);
            enhance.showResultModal(enhanced, () => {}, () => {});
          } catch (error) {
            enhance.showErrorModal(error.message);
          } finally {
            btn.classList.remove("loading");
          }
        });

        const inputWrapper = input.parentElement;
        if (inputWrapper) {
          inputWrapper.style.position = "relative";
          inputWrapper.appendChild(btn);
        }
      };

      injectButton();

      const observer = new MutationObserver(() => injectButton());
      observer.observe(panel, { childList: true, subtree: true });
    };

    startScan();
    console.log("[Windsurf Panel] 提示词增强已启动");
  } catch (error) {
    console.warn("[Windsurf Panel] 提示词增强加载失败:", error);
  }
};

/**
 * 滚动到底部按钮
 * 监听 .cascade-scrollbar 滚动位置, 未到底时显示浮动按钮
 */
const SCROLL_BTN_ID = "windsurf-scroll-bottom-btn";
const SCROLL_THRESHOLD = 120;

const initScrollToBottom = (panel) => {
  const scrollEl = panel.querySelector(".cascade-scrollbar");
  if (!scrollEl) return;

  if (document.getElementById(SCROLL_BTN_ID)) return;

  const btn = document.createElement("button");
  btn.id = SCROLL_BTN_ID;
  btn.title = "滚动到底部";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  const p1 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  p1.setAttribute("points", "7 13 12 18 17 13");
  const p2 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  p2.setAttribute("points", "7 6 12 11 17 6");
  svg.appendChild(p1);
  svg.appendChild(p2);
  btn.appendChild(svg);

  const wrapper = scrollEl.parentElement || panel;
  if (getComputedStyle(wrapper).position === "static") {
    wrapper.style.position = "relative";
  }
  wrapper.appendChild(btn);

  const updateVisibility = () => {
    const gap = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
    btn.classList.toggle("visible", gap > SCROLL_THRESHOLD);
  };

  btn.addEventListener("click", () => {
    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: "smooth" });
  });

  scrollEl.addEventListener("scroll", updateVisibility, { passive: true });
  updateVisibility();

  const resizeObs = new ResizeObserver(updateVisibility);
  resizeObs.observe(scrollEl);
};

(async () => {
  console.log("[Windsurf Panel] 补丁加载中...");

  try {
    await loadStyle("windsurf-panel.css");
  } catch (err) {
    console.warn("[Windsurf Panel] 样式加载失败:", err);
  }

  const config = await loadConfig();

  const panel = await waitForCascadePanel();

  applyFontSize(config);

  if (panel) {
    initScrollToBottom(panel);
  }

  if (config.promptEnhance?.enabled) {
    await initPromptEnhance(config);
  }

  console.log("[Windsurf Panel] 补丁已启动", config);
})();

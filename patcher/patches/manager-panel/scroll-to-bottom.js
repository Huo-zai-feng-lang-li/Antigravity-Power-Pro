/**
 * Cascade & Manager Window — 滚动到底部按钮 (Unified V2.3)
 *
 * 逻辑：
 * 1. 递归穿透 Shadow DOM 寻找主滚动容器。
 * 2. 识别 Cascade 侧边栏和 Manager 主窗口两种场景。
 */

const BTN_ID = "manager-scroll-bottom-btn";
const THRESHOLD = 100;

/** 查找挂载根节点 — Manager 专用
 * 
 * 架构说明：manager-panel 补丁独占 workbench-jetski-agent.html。
 * 该页面不含 .part.editor / .part.sidebar / .monaco-workbench 等结构，
 * 也不使用语义化类名（全 Tailwind 工具类）。直接返回 document.body。
 */
const findRoot = () => document.body;

/** 查找主滚动容器 — 按 scrollHeight 取最大可滚动元素
 * 
 * Manager 页面全部用 Tailwind 工具类（如 scrollbar-hide、overflow-y-auto），
 * 不含 .chat-container / .cascade-scrollbar 等语义类名。
 * 策略：遍历所有元素，找 overflow-y 为 auto/scroll 且 scrollHeight 最大的那个。
 */
const findScrollEl = (root) => {
    if (!root) return null;

    let best = null;
    let bestHeight = 0;

    const check = (el) => {
        if (el.scrollHeight <= el.clientHeight + 50) return;
        const ov = window.getComputedStyle(el).overflowY;
        if (ov !== "auto" && ov !== "scroll" && ov !== "overlay") return;
        if (el.scrollHeight > bestHeight) {
            bestHeight = el.scrollHeight;
            best = el;
        }
    };

    root.querySelectorAll("*").forEach(el => {
        check(el);
        if (el.shadowRoot) {
            el.shadowRoot.querySelectorAll("*").forEach(check);
        }
    });

    return best;
};

const createArrowSVG = () => {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  const attrs = {
    width: "16", height: "16", viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", "stroke-width": "3",
    "stroke-linecap": "round", "stroke-linejoin": "round",
  };
  for (const [k, v] of Object.entries(attrs)) svg.setAttribute(k, v);

  const pts = ["7 13 12 18 17 13", "7 6 12 11 17 6"];
  for (const p of pts) {
    const poly = document.createElementNS(ns, "polyline");
    poly.setAttribute("points", p);
    svg.appendChild(poly);
  }
  return svg;
};

export const init = () => {
  let trackedEl = null;
  let btn = null;

  /** State Lock: 已锁定的滚动容器仍然有效则跳过 O(N) 扫描 */
  const isTrackedValid = () => 
    trackedEl?.isConnected && trackedEl.scrollHeight > trackedEl.clientHeight + 50;

  /** 轻量滚动间距计算 — 绝不触发 DOM 扫描 */
  const update = () => {
    if (!trackedEl?.isConnected) {
      btn?.classList.remove("visible");
      return;
    }
    const gap = trackedEl.scrollHeight - trackedEl.scrollTop - trackedEl.clientHeight;
    btn?.classList.toggle("visible", trackedEl.clientHeight > 0 && gap > THRESHOLD);
  };

  const ensureButton = () => {
    // 互斥：cascade 按钮已存在说明此 DOM 由 cascade 管辖
    if (document.getElementById("cascade-scroll-bottom-btn")) return;

    const root = findRoot();
    if (!root) return;

    // State Lock: 有效容器直接复用，跳过万级节点遍历
    const el = isTrackedValid() ? trackedEl : findScrollEl(root);
    if (!el) return;

    if (!btn || !btn.isConnected) {
      btn = document.getElementById(BTN_ID);
    }
    if (!btn) {
      btn = document.createElement("button");
      btn.id = BTN_ID;
      btn.appendChild(createArrowSVG());
      root.appendChild(btn);
      
      if (window.getComputedStyle(root).position === "static") {
        root.style.position = "relative";
      }

      btn.addEventListener("click", () => {
        const target = trackedEl || findScrollEl(findRoot());
        if (target) target.scrollTo({ top: target.scrollHeight, behavior: "smooth" });
      });
    }

    if (el !== trackedEl) {
        trackedEl?.removeEventListener("scroll", update);
        el.addEventListener("scroll", update, { passive: true });
        
        // root 级别捕获兜底，应对内部 DOM 替换
        if (!trackedEl && root) {
            root.addEventListener("scroll", update, true); 
        }
        trackedEl = el;
    }

    update();
  };

  ensureButton();

  let timer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(ensureButton, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  
  window.addEventListener("resize", ensureButton);
  
  console.log("[Manager] 滚动按钮已初始化 (状态锁定模式)");
};

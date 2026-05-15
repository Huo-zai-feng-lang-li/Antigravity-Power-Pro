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

  const ensureButton = () => {
    const root = findRoot();
    const el = findScrollEl(root);
    
    if (!el || !root) return;

    let btn = document.getElementById(BTN_ID);
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
        if (target) {
            target.scrollTo({ top: target.scrollHeight, behavior: "smooth" });
        }
      });
    }

    // update 只做轻量计算，不重新扫描 DOM
    const update = () => {
      const scrollEl = trackedEl;
      if (!scrollEl || !scrollEl.isConnected) {
        btn.classList.remove("visible");
        return;
      }
      
      const gap = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
      const shouldShow = scrollEl.clientHeight > 0 && gap > THRESHOLD;
      btn.classList.toggle("visible", shouldShow);
    };

    if (el !== trackedEl) {
        trackedEl?.removeEventListener("scroll", update);
        el.addEventListener("scroll", update, { passive: true });
        
        // 终极防水漏：在 root 级别捕获所有滚动事件，即使内部具体 DOM 被替换也能监听到
        if (!trackedEl && root) {
            root.addEventListener("scroll", update, true); 
        }
        trackedEl = el;
    }

    update();
  };

  ensureButton();

  // 防抖 300ms，与 cascade 版本保持一致
  let timer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(ensureButton, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  
  window.addEventListener("resize", ensureButton);
  
  console.log("[Manager] 滚动按钮已初始化 (全窗口支持)");
};

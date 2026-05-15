/**
 * Cascade Panel — 滚动到底部按钮 (Surgical Fix V2.1 - Shadow DOM Compatible)
 *
 * 逻辑：
 * 1. 递归穿透 Shadow DOM 寻找主滚动容器。
 * 2. 挂载到根容器，并通过 scrollHeight 识别目标。
 */

const BTN_ID = "cascade-scroll-bottom-btn";
const THRESHOLD = 150;

/** 查找侧边栏根容器 */
const findRoot = () => 
  document.querySelector(".antigravity-agent-side-panel") || document.body;

/** 查找主滚动容器：递归穿透 Shadow DOM，取最大的 scrollHeight */
const findScrollEl = () => {
    const scrollables = [];
    
    function traverse(root) {
        if (!root) return;
        // 查找当前层级的滚动容器
        const els = root.querySelectorAll(".overflow-y-auto, .overflow-auto");
        els.forEach(el => {
            if (el.clientHeight > 50) scrollables.push(el);
        });
        
        // 递归进入影子 DOM
        const all = root.querySelectorAll("*");
        all.forEach(el => {
            if (el.shadowRoot) traverse(el.shadowRoot);
        });
    }

    traverse(document);
    
    if (scrollables.length === 0) return null;
    // 按 scrollHeight 降序排
    return scrollables.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
};

/** 创建双箭头 SVG */
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
    const el = findScrollEl();
    
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
        const target = trackedEl || findScrollEl();
        if (target) target.scrollTo({ top: target.scrollHeight, behavior: "instant" });
      });

      // 清除 manager-panel 可能注入的重复按钮
      const dup = document.getElementById("manager-scroll-bottom-btn");
      if (dup) dup.remove();
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
  console.log("[Cascade] 滚动到底部按钮已启动 (Shadow Penetrating Mode)");
};

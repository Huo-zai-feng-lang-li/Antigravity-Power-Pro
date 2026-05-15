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
 * 架构说明：manager-panel 补丁注入在独立的 workbench-jetski-agent.html 里运行。
 * 该页面不含 .part.editor / .part.sidebar 等主工作区结构。
 * 只需判断：当前 DOM 里有聊天容器，且不在 cascade 侧边栏内，即确认是 Manager 环境。
 */
const findRoot = () => {
  const chatEl = document.querySelector(
    ".chat-container, .conversation-container, .agent-view-container, .jetski-agent-container, .antigravity-manager-container"
  );
  // 排除：若聊天容器嵌在 cascade 侧边栏里，说明我们在侧边栏页面，绝不挂载
  if (!chatEl || chatEl.closest(".antigravity-agent-side-panel")) return null;
  return document.querySelector(".monaco-workbench") || document.body;
};

/** 查找主滚动容器：增加隔离与排除逻辑 */
const findScrollEl = (root) => {
    if (!root) return null;
    
    // 优先寻找特定的聊天/Agent 专用滚动类名
    const prioritySelectors = [
        ".cascade-scrollbar",
        ".chat-container",
        ".monaco-list-rows",
        ".agent-view-container",
        ".monaco-scrollable-element"
    ];

    let candidates = [];

    function traverse(searchRoot) {
        if (!searchRoot) return;
        
        prioritySelectors.forEach(s => {
            const els = searchRoot.querySelectorAll(s);
            els.forEach(el => {
                // 确保元素真的是个滚动容器（且内容超出）
                if (el.scrollHeight > el.clientHeight + 20) {
                    const style = window.getComputedStyle(el);
                    // 只有这三种 overflow-y 设置才可能原生产生 scroll 事件
                    if (style.overflowY === "auto" || style.overflowY === "scroll" || style.overflowY === "overlay" || style.overflowY === "hidden") {
                        let basePriority = 20;
                        if (el.classList.contains("chat-container") || el.classList.contains("cascade-scrollbar") || el.classList.contains("agent-view-container")) {
                            basePriority += 10000;
                        }
                        candidates.push({ el, priority: basePriority + el.scrollHeight });
                    }
                }
            });
        });

        const all = searchRoot.querySelectorAll("*");
        all.forEach(el => {
            if (el.scrollHeight > el.clientHeight + 20) {
                const style = window.getComputedStyle(el);
                if (style.overflowY === "auto" || style.overflowY === "scroll" || style.overflowY === "overlay") {
                    candidates.push({ el, priority: 5 + el.scrollHeight / 1000 });
                }
            }
            if (el.shadowRoot) traverse(el.shadowRoot);
        });
    }

    // 关键：从挂载点（root）开始向下找
    traverse(root);
    
    // 如果没有找到优先的，并且根是 body，尝试在整个文档内找最大的 fallback
    if (candidates.length === 0 && root === document.body) {
        const agentManager = document.querySelector(".antigravity-manager-container, .jetski-agent-container, .chat-container, .monaco-list-rows");
        if (agentManager) traverse(agentManager);
    }
    
    if (candidates.length === 0) return null;
    return candidates.sort((a, b) => b.priority - a.priority)[0].el;
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

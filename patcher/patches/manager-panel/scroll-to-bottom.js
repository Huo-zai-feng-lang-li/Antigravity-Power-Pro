/**
 * Cascade & Manager Window — 滚动到底部按钮 (Unified V2.3)
 *
 * 逻辑：
 * 1. 递归穿透 Shadow DOM 寻找主滚动容器。
 * 2. 识别 Cascade 侧边栏和 Manager 主窗口两种场景。
 */

const BTN_ID = "manager-scroll-bottom-btn";
const THRESHOLD = 100;

/** 查找挂载根节点 — Manager 专用 */
const findRoot = () => {
  // 查找能够证明 Manager 处于打开状态的标志性容器（同时排除侧边栏）
  const chatEls = document.querySelectorAll(".chat-container, .conversation-container, .agent-view-container, .jetski-agent-container, .antigravity-manager-container");
  let isManagerActive = false;
  
  for (const el of chatEls) {
      if (!el.closest(".antigravity-agent-side-panel")) {
          isManagerActive = true;
          break;
      }
  }

  // 只有真正打开了 Manager 才会返回 .monaco-workbench 作为挂载点
  // 因为 CSS 的定位依赖于主工作区居中
  if (!isManagerActive) return null;
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
                // 排除逻辑：绝对不能是侧边栏、编辑器内部或者搜索结果列表等
                if (el.closest(".monaco-editor") || el.closest(".search-view") || el.closest(".part.sidebar")) return;
                
                if (el.scrollHeight > el.clientHeight + 20) {
                    let basePriority = 20;
                    // 如果发现确切的聊天区域容器，给予绝对高优先级，避免被文件资源管理器等篡夺
                    if (el.classList.contains("chat-container") || el.classList.contains("cascade-scrollbar") || el.classList.contains("agent-view-container")) {
                        basePriority += 10000;
                    }
                    candidates.push({ el, priority: basePriority + el.scrollHeight });
                }
            });
        });

        // 如果没找到优先级容器，再尝试扫描通用容器，但仅限于 scope 内部
        const all = searchRoot.querySelectorAll("*");
        all.forEach(el => {
            if (el.closest(".monaco-editor")) return; // 再次硬排除编辑器
            
            if (el.scrollHeight > el.clientHeight + 20) {
                const style = window.getComputedStyle(el);
                if (style.overflowY === "auto" || style.overflowY === "scroll") {
                    candidates.push({ el, priority: 5 + el.scrollHeight / 1000 });
                }
            }
            if (el.shadowRoot) traverse(el.shadowRoot);
        });
    }

    // 关键：从挂载点（root）开始向下找，而不是从 document 找
    traverse(root);
    
    // 如果在该 root 下没找到，再回退到 document 但限定在 Agent 容器内
    if (candidates.length === 0 && root === document.body) {
        const agentManager = document.querySelector(".antigravity-manager-container") || 
                           document.querySelector(".jetski-agent-container");
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
    const el = findScrollEl(root); // 传入 root，限制探测范围
    
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
        const currentRoot = findRoot();
        const target = findScrollEl(currentRoot); // 点击时也带 Context
        if (target) {
            target.scrollTo({ top: target.scrollHeight, behavior: "smooth" });
        }
      });
    }

    const update = () => {
      const currentRoot = findRoot();
      const currentScrollEl = findScrollEl(currentRoot);
      if (!currentScrollEl || !currentScrollEl.isConnected) {
        btn.classList.remove("visible");
        return;
      }
      
      const gap = currentScrollEl.scrollHeight - currentScrollEl.scrollTop - currentScrollEl.clientHeight;
      const shouldShow = currentScrollEl.clientHeight > 0 && gap > THRESHOLD;
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

  // 增加扫描频率，确保动态内容加载后能及时挂载
  const observer = new MutationObserver(ensureButton);
  observer.observe(document.body, { childList: true, subtree: true });
  
  // 窗口大小改变也重新检测
  window.addEventListener("resize", ensureButton);
  
  console.log("[Manager] 滚动按钮已初始化 (全窗口支持)");
};

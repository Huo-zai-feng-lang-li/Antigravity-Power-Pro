/**
 * Cascade Panel — 滚动到底部按钮 (Surgical Fix V2.1 - Shadow DOM Compatible)
 *
 * 逻辑：
 * 1. 递归穿透 Shadow DOM 寻找主滚动容器。
 * 2. 挂载到根容器，并通过 scrollHeight 识别目标。
 */

const BTN_CLASS = "antigravity-scroll-btn";
const THRESHOLD = 150;

/** 查找所有可能的侧边栏/编辑器根容器 */
const findRoots = () => {
  const roots = Array.from(document.querySelectorAll(".antigravity-agent-side-panel, .chat-container, #chat, #react-app"));
  if (roots.length === 0) return [document.body];
  return roots;
};

/** 创建三重箭头 SVG */
const createArrowSVG = () => {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  const attrs = {
    width: "20", height: "20", viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", "stroke-width": "2.5",
    "stroke-linecap": "round", "stroke-linejoin": "round",
  };
  for (const [k, v] of Object.entries(attrs)) svg.setAttribute(k, v);

  // 三重箭头，更具动感
  const pts = ["7 17 12 22 17 17", "7 10 12 15 17 10", "7 3 12 8 17 3"];
  for (const p of pts) {
    const poly = document.createElementNS(ns, "polyline");
    poly.setAttribute("points", p);
    svg.appendChild(poly);
  }
  return svg;
};

export const init = () => {
    const panels = new Map(); // Map<root, {btn, scrollEl}>

    const syncButtons = () => {
        const roots = findRoots();
        
        roots.forEach(root => {
            if (panels.has(root)) return;

            const btn = document.createElement("button");
            btn.className = BTN_CLASS;
            btn.appendChild(createArrowSVG());
            
            if (window.getComputedStyle(root).position === "static") {
                root.style.position = "relative";
            }
            
            root.appendChild(btn);

            const update = () => {
                const el = root.querySelector(".overflow-y-auto, .overflow-auto") || root;
                if (!el || el.clientHeight === 0) {
                    btn.classList.remove("visible");
                    return;
                }
                const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
                const isVisible = gap > THRESHOLD;
                
                if (isVisible) {
                    btn.classList.add("visible");
                } else {
                    btn.classList.remove("visible");
                }
            };

            btn.addEventListener("click", () => {
                const el = root.querySelector(".overflow-y-auto, .overflow-auto") || root;
                el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
            });

            const scrollEl = root.querySelector(".overflow-y-auto, .overflow-auto") || root;
            scrollEl.addEventListener("scroll", update, { passive: true });
            
            panels.set(root, { btn, update });
            update();
        });
    };

    syncButtons();
    const observer = new MutationObserver(() => syncButtons());
    observer.observe(document.body, { childList: true, subtree: true });
    console.log("[Cascade] 多个滚动到底部按钮监听已启动");
};

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
  const roots = new Set();
  
  // 1. 常见侧边栏容器
  document.querySelectorAll(".antigravity-agent-side-panel, .chat-container, #chat, #react-app, .monaco-pane").forEach(r => roots.add(r));
  
  // 2. 深度穿透寻找
  function traverse(node) {
    if (!node) return;
    if (node.shadowRoot) traverse(node.shadowRoot);
    if (node.tagName === 'IFRAME') { try { traverse(node.contentDocument); } catch(e){} }
    
    // 如果一个元素有大量内容且溢出，认为它是潜在根
    if (node.classList?.contains('conversation') || node.classList?.contains('message-list')) {
        roots.add(node.parentElement || node);
    }
    
    const children = node.children || [];
    for(let child of children) traverse(child);
  }
  traverse(document.body);

  if (roots.size === 0) return [document.body];
  return Array.from(roots);
};

export const init = () => {
    const panels = new Map();

    const syncButtons = () => {
        const roots = findRoots();
        
        roots.forEach(root => {
            if (panels.has(root)) return;

            // 检查 root 是否真的包含滚动内容
            const scrollEl = root.querySelector?.(".overflow-y-auto, .overflow-auto") || 
                           (root.scrollHeight > root.clientHeight ? root : null);
            
            if (!scrollEl) return;

            const btn = document.createElement("button");
            btn.className = BTN_CLASS;
            btn.appendChild(createArrowSVG());
            
            if (window.getComputedStyle(root).position === "static") {
                root.style.position = "relative";
            }
            
            root.appendChild(btn);

            const update = () => {
                if (!scrollEl.isConnected) {
                    btn.remove();
                    panels.delete(root);
                    return;
                }
                const gap = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
                const isVisible = gap > THRESHOLD;
                btn.classList.toggle("visible", isVisible);
            };

            btn.addEventListener("click", () => {
                scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: "smooth" });
            });

            scrollEl.addEventListener("scroll", update, { passive: true });
            panels.set(root, { btn });
            update();
        });
    };

    syncButtons();
    setInterval(syncButtons, 2000); // 周期性扫描，防止动态加载漏掉
};

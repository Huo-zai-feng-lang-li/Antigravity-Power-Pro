import { querySelectorAllDeep } from './utils.js';

const CONTENT_SELECTOR = '.antigravity-agent-side-panel, .chat-container, .conversation-container';
const INPUT_SELECTOR = '[role="textbox"], [contenteditable="true"], textarea[placeholder*="Ask"], .chat-input textarea';
const ENHANCE_BTN_CLASS = "Antigravity-Power-Pro-enhance-btn";

const actionButtonSelectors = [
    'button[aria-label*="send" i]',
    'button[aria-label*="发送" i]',
    'button[aria-label*="Mic" i]',
    'button[title*="send" i]',
    'button[title*="Mic" i]',
    'button[type="submit"]',
    '[class*="send-button"]',
    '[data-testid*="send"]',
];

let config = {};
let enhanceModule = null;

export const start = async (userConfig) => {
    config = userConfig;
    console.log("[Manager] 启动扫描，配置:", config);
    try {
        enhanceModule = await import('../shared/enhance.js');
        enhanceModule.init(config.promptEnhance);
        
        // 启动轮询检查
        setInterval(scan, 2000);
        scan();
        console.log("[Manager] 扫描器已就绪");
    } catch (e) {
        console.error("[Manager] 初始化失败:", e);
    }
};

const scan = () => {
    const root = document.getElementById('window-container') || document.body;
    const inputAreas = querySelectorAllDeep(INPUT_SELECTOR, root);

    inputAreas.forEach(input => {
        // 终端过滤 (针对 Manager 窗口优化：仅排除真正的命令行，保留输入框)
        if (input.closest('.terminal-container') || 
            input.closest('.xterm-helper-textarea') ||
            (input.className.includes('xterm') && !input.getAttribute('role'))) {
          return;
        }

        if (input.parentElement.querySelector(`.${ENHANCE_BTN_CLASS}`)) return;

        const btn = enhanceModule.createEnhanceButton(async () => {
            const conf = enhanceModule.getConfig();
            if (!conf.apiKey) {
                enhanceModule.showErrorModal("请先在 Antigravity-Power-Pro 中配置 apiKey 并设置模型");
                return;
            }

            const text = input.value || input.textContent || "";
            if (!text.trim()) {
                enhanceModule.showErrorModal("请先输入需要增强的提示词");
                return;
            }

            btn.classList.add("loading");
            try {
                const enhanced = await enhanceModule.enhance(text);
                await enhanceModule.setInputValue(input, enhanced);
            } finally {
                btn.classList.remove("loading");
            }
        });

        // 插入逻辑：采用动态邻近算法
        const parent = input.parentElement || root;
        
        const findActionButton = () => {
          // 在整个根节点深层搜索原生按钮
          for (const selector of actionButtonSelectors) {
            const els = querySelectorAllDeep(selector, root);
            // 找到距离当前输入框最近的那个
            if (els.length > 0) {
              // 优先返回在同一容器或邻近容器的
              return els.find(el => input.closest('.relative')?.contains(el)) || els[0];
            }
          }
          return null;
        };

        const actionBtn = findActionButton();

        if (actionBtn && actionBtn.parentElement) {
            console.log("[Manager-Prompt] 找到原生按钮组，往右侧插入");
            // 插入到操作区的最后面，使其在所有按钮的最右边
            actionBtn.parentElement.appendChild(btn);
            btn.style.setProperty('position', 'relative', 'important');
            btn.style.setProperty('margin', '0 0 0 8px', 'important'); // 左边距，与前一个按钮拉开
            btn.style.setProperty('flex-shrink', '0', 'important');
            btn.style.setProperty('left', 'auto', 'important');
            btn.style.setProperty('right', 'auto', 'important');
        } else {
            // 备选方案：绝对定位在输入框区域的右下角（更靠右）
            const container = input.closest('.relative') || input.parentElement || root;
            console.warn("[Manager-Prompt] 未找到原生按钮，使用容器挂载:", container);
            container.style.setProperty('position', 'relative', 'important');
            btn.style.setProperty('position', 'absolute', 'important');
            btn.style.setProperty('right', '8px', 'important');
            btn.style.setProperty('left', 'auto', 'important');
            btn.style.setProperty('bottom', '8px', 'important');
            btn.style.setProperty('z-index', '9999', 'important');
            container.appendChild(btn);
        }
    });
};

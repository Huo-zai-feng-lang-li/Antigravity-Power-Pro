/**
 * Manager Panel DOM 扫描与监听 (Shadow DOM 增强版 V2.2 - 完整闭环)
 *
 * 职责：
 * - 扫描内容渲染 (Mermaid, Math)
 * - 提示词增强按钮注入 (极致 Shadow DOM 兼容)
 * - 去除 Copy 按钮
 */

import { CONTENT_SELECTOR } from './constants.js';
import { renderMath } from './math.js';
import { scanMermaid } from './mermaid.js';

let config = {
    mermaid: false,
    math: false,
    copyButton: false, 
    promptEnhance: { enabled: false }
};

const STABLE_RENDER_DELAY = 400;
const STABLE_RENDER_MAX_WAIT = 3000;
const deferredRenders = new WeakMap();

/** 递归穿透 Shadow DOM 查找所有匹配元素 */
function querySelectorAllDeep(selector, root = document) {
    const list = [];
    function traverse(node) {
        if (!node) return;
        node.querySelectorAll(selector).forEach(el => list.push(el));
        const children = node.querySelectorAll("*");
        children.forEach(child => {
            if (child.shadowRoot) traverse(child.shadowRoot);
        });
    }
    traverse(root);
    return list;
}

const isContentComplete = (el) => {
    let node = el;
    for (let i = 0; i < 15 && node; i++) {
        if (node.querySelector('[data-tooltip-id^="up-"], [data-tooltip-id^="down-"]')) return true;
        node = node.parentElement;
    }
    return false;
};

const clearDeferredRender = (el) => {
    const state = deferredRenders.get(el);
    if (state) {
        clearTimeout(state.timerId);
        deferredRenders.delete(el);
    }
};

const scheduleDeferredRender = (el) => {
    if (!el || !el.isConnected) return;
    const text = el.textContent || '';
    const now = Date.now();
    const existing = deferredRenders.get(el);

    if (existing) {
        if (existing.lastText !== text) {
            existing.lastText = text;
            existing.lastChange = now;
        }
        return;
    }

    const state = { lastText: text, lastChange: now, startTime: now, timerId: 0 };
    const attempt = () => {
        deferredRenders.delete(el);
        if (!el || !el.isConnected) return;
        const currentText = el.textContent || '';
        const currentTime = Date.now();

        if (currentText !== state.lastText) {
            state.lastText = currentText;
            state.lastChange = currentTime;
            state.timerId = window.setTimeout(attempt, STABLE_RENDER_DELAY);
            deferredRenders.set(el, state);
            return;
        }

        const idleMs = currentTime - state.lastChange;
        const totalMs = currentTime - state.startTime;
        if (isContentComplete(el) || (totalMs >= STABLE_RENDER_MAX_WAIT && idleMs >= STABLE_RENDER_DELAY)) {
            renderContentNode(el, true);
            return;
        }
        state.timerId = window.setTimeout(attempt, STABLE_RENDER_DELAY);
        deferredRenders.set(el, state);
    };
    state.timerId = window.setTimeout(attempt, STABLE_RENDER_DELAY);
    deferredRenders.set(el, state);
};

const renderContentNode = (el, force = false) => {
    if (!el || !el.isConnected) return;
    if (config.mermaid) scanMermaid(el);
    const ready = force || isContentComplete(el);
    if (!ready) {
        scheduleDeferredRender(el);
        return;
    }
    clearDeferredRender(el);
    if (config.math) void renderMath(el);
};

/** 提示词增强按钮逻辑 */
let enhanceModule = null;
const initPromptEnhanceButton = async () => {
    if (!config.promptEnhance?.enabled) return;
    if (!enhanceModule) {
        try {
            enhanceModule = await import('../shared/enhance.js');
            enhanceModule.init(config.promptEnhance);
        } catch (e) { return; }
    }

    const inputSelectors = [
        'textarea[placeholder*="Ask"]', 
        'textarea[data-testid]', 
        '[contenteditable="true"][role="textbox"]',
        '.chat-input textarea'
    ];
    const inputs = querySelectorAllDeep(inputSelectors.join(", "));

    inputs.forEach(input => {
        const root = input.getRootNode();
        if (root.querySelector(`.Antigravity-Power-Pro-enhance-btn[data-for-id="${input.id || 'any'}"]`)) return;

        const btn = enhanceModule.createEnhanceButton(async () => {
            const text = input.value || input.textContent || "";
            if (!text.trim()) return;
            btn.classList.add("loading");
            try {
                const enhanced = await enhanceModule.enhance(text);
                await enhanceModule.setInputValue(input, enhanced);
            } finally {
                btn.classList.remove("loading");
            }
        });
        btn.setAttribute('data-for-id', input.id || 'any');

        const parent = input.parentElement || root;
        const sendBtn = parent.querySelector('button[type="submit"], [class*="send"], [class*="submit"]');
        if (sendBtn && sendBtn.parentElement) {
            sendBtn.parentElement.insertBefore(btn, sendBtn);
        } else {
            btn.style.position = 'absolute';
            btn.style.right = '42px';
            btn.style.bottom = '12px';
            btn.style.zIndex = '9999';
            const container = input.closest('.relative') || parent;
            if (window.getComputedStyle(container).position === 'static') container.style.position = 'relative';
            container.appendChild(btn);
        }
    });
};

const scan = (root) => {
    if (!root || !root.isConnected) return;
    const contentNodes = querySelectorAllDeep(CONTENT_SELECTOR, root);
    contentNodes.forEach((node) => renderContentNode(node));
};

const init = () => {
    scan(document);
    initPromptEnhanceButton();
    const observer = new MutationObserver(() => {
        scan(document);
        initPromptEnhanceButton();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    console.log('[Manager Panel] 全量扫描已启动 (Copy离线/Shadow穿透)');
};

export const start = (userConfig = {}) => {
    config = { ...config, ...userConfig };
    init();
};

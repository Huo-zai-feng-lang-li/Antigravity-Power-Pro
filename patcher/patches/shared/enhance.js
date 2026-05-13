/**
 * 提示词增强模块
 * 调用自定义 LLM API 优化用户输入的提示词
 * 支持 OpenAI 兼容格式和 Anthropic Claude 格式
 *
 * 功能特性:
 * - 输入框旁显性按钮触发
 * - 直接替换输入框内容（无弹窗）
 * - 自动收集 IDE 上下文信息
 * - 简洁的 toast 提示
 */

// 默认系统提示词 - 基于对话上下文的优化版
const DEFAULT_SYSTEM_PROMPT = `你是一个智能提示词优化器，专门帮助用户生成更有效的 AI 对话提示词。

## 核心任务
将用户输入的原始提示词优化为更清晰、更具体、更有效的版本。

## 你会收到的信息
1. **对话上下文**：之前的对话历史（如果有）
2. **当前文件**：用户正在编辑的文件（如果有）
3. **选中代码**：用户选中的代码片段（如果有）
4. **用户原始提示词**：需要优化的内容

## 优化规则
1. **理解上下文**：仔细阅读对话历史，理解当前讨论的主题和背景
2. **保持连贯性**：优化后的提示词应该与之前的对话保持逻辑连贯
3. **具体化**：让模糊的问题变得具体，如果上下文中有相关信息就引用它
4. **结构化**：为复杂问题添加清晰的结构，使用 Markdown 列表
5. **保持意图**：不改变用户的原始意图，只是表达得更清晰
6. **保留格式**：必须使用 Markdown 格式（换行、列表、代码块），确保生成的提示词易于阅读

## 输出要求
- **只输出优化后的提示词**，不要任何解释、前缀或额外内容
- 保持用户使用的语言（中文/英文）
- 如果原始提示词是追问或继续之前的话题，保持这种连续性
- **关键**：确保输出包含必要的换行符，不要将长文本压缩成一行

## 示例

### 示例 1 - 无上下文
输入: hi
输出: 你好，请帮我解决一个问题。我会详细描述需求，请提供完整的解决方案。

### 示例 2 - 有上下文（之前讨论了一个 bug）
对话历史: [用户问了如何修复登录 bug，AI 提供了方案]
输入: 还有问题
输出: 按照你之前提供的登录 bug 修复方案，我尝试后发现仍有问题。请帮我进一步排查，可能是哪些原因导致的？

### 示例 3 - 引用代码
选中代码: function getData() { ... }
输入: 优化这个
输出: 请帮我优化上面选中的 getData 函数。具体需要：
1. 提高性能
2. 改进可读性
3. 添加错误处理

请解释每处修改的原因。

记住：直接输出优化后的提示词，不要任何其他内容。`;

// 配置默认值
const DEFAULT_CONFIG = {
  enabled: true,
  provider: "openai",
  apiBase: "https://api.freemodel.dev/v1",
  apiKey: "fe_oa_d489e9161b01e3cb8954bf50c5a8cd80fdb4b25e5e8870f9",
  model: "gpt-5.4-mini",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
};

let config = { ...DEFAULT_CONFIG };

/**
 * 初始化配置
 * @param {Object} userConfig - 用户配置
 */
export function init(userConfig = {}) {
  config = { ...DEFAULT_CONFIG, ...userConfig };
  if (!config.systemPrompt) {
    config.systemPrompt = DEFAULT_SYSTEM_PROMPT;
  }

  // 始终注入样式，确保 Toast 和按钮视觉一致
  injectStyles();
}

/**
 * 检查功能是否启用
 * @returns {boolean}
 */
export function isEnabled() {
  return config.enabled;
}


// ============================================
// 对话上下文收集 - 极简 innerText 方案
// ============================================

// 对话容器候选选择器 (CDP 枚举实测, [0] 号容器精确命中对话内容)
const CONVERSATION_SELECTORS = [
  // 最精准: 侧边栏内 grow flex-col 的主对话滚动区 (CDP 实测 [0] 号容器)
  '.antigravity-agent-side-panel .h-full.overflow-y-auto.grow',
  '.antigravity-agent-side-panel .overflow-y-auto.grow',
  // 兜底: 侧边栏根容器
  '.antigravity-agent-side-panel',
  '[data-testid="chat-list"]',
  '[data-testid="chat-history"]',
  '[class*="conversation"]',
  '[role="log"]',
];

// 应排除的 DOM 噪声 (导航/按钮/模型选择器/输入区)
const NOISE_SELECTORS = [
  'nav', 'select', '[role="combobox"]',
  '[class*="toolbar"]', '[class*="statusbar"]',
  '[class*="model-picker"]', '[class*="model-select"]',
  'button', '[role="button"]', '[class*="tab-"]',
];

/**
 * 找到对话容器, 提取仅对话内容的 innerText
 * - 克隆节点后移除 UI 噪声, 再取 innerText
 * - 让 LLM 自己理解文本流, 无需在此层做角色解析
 * @param {number} maxChars 
 * @returns {string}
 */
function collectConversationText(maxChars = 3000) {
  for (const selector of CONVERSATION_SELECTORS) {
    try {
      const el = document.querySelector(selector);
      if (!el) continue;

      // 克隆后移除噪声节点
      const clone = el.cloneNode(true);
      NOISE_SELECTORS.forEach(ns => {
        clone.querySelectorAll(ns).forEach(n => n.remove());
      });

      const text = clone.innerText?.trim();
      if (text && text.length > 30) {
        return text.slice(-maxChars);
      }
    } catch (_) { /* 继续下一个 */ }
  }
  return '';
}

/**
 * 获取当前活动标签页的文件名
 * @returns {string|null}
 */
function getCurrentFile() {
  const selectors = [
    '[role="tab"][aria-selected="true"]',
    '[class*="tab"][aria-selected="true"]',
    '[class*="breadcrumb"] span:last-child',
  ];
  for (const sel of selectors) {
    try {
      const text = document.querySelector(sel)?.textContent?.trim();
      if (text && /\.\w{1,10}$/.test(text)) return text;
    } catch (_) { /* 继续 */ }
  }
  return null;
}

/**
 * 格式化上下文前缀（给 LLM 的输入）
 * @returns {string}
 */
function buildContextPrefix() {
  const parts = [];

  const file = getCurrentFile();
  if (file) parts.push(`[当前文件: ${file}]`);

  const text = collectConversationText();
  if (text) {
    parts.push(`\n=== 当前对话上下文 (最近内容) ===\n${text}\n=== 对话上下文结束 ===`);
  }

  return parts.length > 0 ? parts.join('\n') + '\n\n' : '';
}

// ============================================
// API 调用
// ============================================

/**
 * 检查是否为 Anthropic API
 */
function isAnthropicAPI() {
  return config.provider === "anthropic" || config.apiBase.includes("anthropic");
}



/**
 * 调用 Anthropic Claude API
 */
async function callAnthropicAPI(prompt, contextPrefix = "") {
  const userMessage = contextPrefix
    ? `上下文信息:\n${contextPrefix}\n用户原始提示词:\n${prompt.trim()}`
    : prompt.trim();

  const response = await fetch(`${config.apiBase}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 2048,
      system: config.systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Anthropic API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text?.trim() || "";
}

/**
 * 调用 OpenAI 兼容 API
 */
async function callOpenAICompatibleAPI(prompt, contextPrefix = "") {
  const userMessage = contextPrefix
    ? `上下文信息:\n${contextPrefix}\n用户原始提示词:\n${prompt.trim()}`
    : prompt.trim();

  const messages = [
    { role: "system", content: config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  const response = await fetch(`${config.apiBase}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

/**
 * 调用 LLM API 增强提示词
 */
export async function enhance(prompt) {
  if (!isEnabled()) {
    throw new Error("提示词增强功能未配置或未启用");
  }

  if (!prompt || !prompt.trim()) {
    throw new Error("提示词不能为空");
  }

  const contextPrefix = buildContextPrefix();
  console.log('[PromptEnhance] 触发增强, 上下文长度:', contextPrefix.length);

  try {
    if (isAnthropicAPI()) {
      return await callAnthropicAPI(prompt, contextPrefix);
    } else {
      return await callOpenAICompatibleAPI(prompt, contextPrefix);
    }
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("网络请求失败,请检查网络连接和 API 地址");
    }
    throw error;
  }
}

// ============================================
// 输入框操作
// ============================================

/**
 * 查找当前活动的输入框
 * @returns {HTMLTextAreaElement|HTMLInputElement|null}
 */
function findActiveInput() {
  const active = document.activeElement;
  if (
    active &&
    (active.tagName === "TEXTAREA" ||
      (active.tagName === "INPUT" && active.type === "text") ||
      active.contentEditable === "true")
  ) {
    return active;
  }
  return document.querySelector(
    '[role="textbox"][contenteditable="true"], textarea[placeholder*="Ask"], .chat-input textarea'
  );
}

/**
 * 获取输入框的值
 * @param {HTMLElement} input
 * @returns {string}
 */
function getInputValue(input) {
  if (input.contentEditable === "true") {
    return input.textContent || "";
  }
  return input.value || "";
}

/**
 * 设置输入框的值（保留换行和格式）
 * @param {HTMLElement} input
 * @param {string} value
 */
/**
 * 辅助函数：延迟
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 可靠地设置输入框的值（保留换行和格式，处理 React 受控组件）
 * @param {HTMLElement} input
 * @param {string} value
 * @returns {Promise<boolean>} 是否设置成功
 */
export async function setInputValue(input, value) {
  console.log(
    "[PromptEnhance] 开始设置输入框值, 元素类型:",
    input.tagName,
    "是否contentEditable:",
    input.contentEditable,
  );

  // 先聚焦输入框
  input.focus();
  await sleep(50);

  // 方法1: 对于 contenteditable，使用 execCommand
  if (input.contentEditable === "true") {
    console.log("[PromptEnhance] 方法1: contenteditable + execCommand");
    // 选中全部 → 插入新内容
    document.execCommand("selectAll", false, null);
    await sleep(10);
    const success = document.execCommand("insertText", false, value);

    if (success && input.textContent === value) {
      console.log("[PromptEnhance] execCommand 成功");
      return true;
    }

    // 备选: 直接设置 innerHTML
    console.log("[PromptEnhance] execCommand 失败，尝试直接设置 innerHTML");
    // 处理换行符，将其转换为 div 或 br，取决于具体编辑器的行为
    // 大多数现代编辑器 (如 ProseMirror, Monaco) 在 contenteditable 中使用 div 或 p 表示换行
    const formattedHtml = value
      .split("\n")
      .map((line) => (line ? `<div>${line}</div>` : "<div><br></div>"))
      .join("");

    input.innerHTML = formattedHtml;
    input.dispatchEvent(
      new InputEvent("input", { bubbles: true, inputType: "insertText" }),
    );
    return true;
  }

  // 方法2: 对于 textarea/input，尝试 execCommand（某些 Electron 框架支持）
  console.log("[PromptEnhance] 方法2: textarea/input + execCommand");
  input.focus();
  input.select(); // 选中所有文本
  await sleep(10);

  const execSuccess = document.execCommand("insertText", false, value);
  await sleep(50);

  if (execSuccess && input.value === value) {
    console.log("[PromptEnhance] execCommand 成功");
    return true;
  }

  // 方法3: 使用原生 setter
  console.log("[PromptEnhance] 方法3: 原生 setter + React 事件");
  const nativeSetter = Object.getOwnPropertyDescriptor(
    input.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype,
    "value",
  )?.set;

  if (nativeSetter) {
    nativeSetter.call(input, value);
  } else {
    input.value = value;
  }

  // 触发多种事件
  input.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: value,
    }),
  );
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));

  await sleep(100);
  if (input.value === value) {
    console.log("[PromptEnhance] 原生 setter 成功");
    return true;
  }

  // 方法4: 使用剪贴板粘贴（终极方案）
  console.log("[PromptEnhance] 方法4: 剪贴板粘贴");
  try {
    // 保存当前剪贴板内容
    const originalClipboard = await navigator.clipboard
      .readText()
      .catch(() => "");

    // 写入新内容到剪贴板
    await navigator.clipboard.writeText(value);

    // 聚焦并选中所有
    input.focus();
    input.select();
    await sleep(10);

    // 模拟粘贴事件
    const pasteEvent = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
      clipboardData: new DataTransfer(),
    });
    pasteEvent.clipboardData.setData("text/plain", value);
    input.dispatchEvent(pasteEvent);

    // 或者使用 execCommand paste
    document.execCommand("paste");

    await sleep(100);

    // 恢复原剪贴板
    if (originalClipboard) {
      await navigator.clipboard.writeText(originalClipboard);
    }

    if (input.value === value) {
      console.log("[PromptEnhance] 剪贴板粘贴成功");
      return true;
    }
  } catch (e) {
    console.warn("[PromptEnhance] 剪贴板方法失败:", e);
  }

  console.warn(
    "[PromptEnhance] 所有方法都失败了，输入框值:",
    input.value?.substring(0, 50),
  );
  return false;
}

// ============================================
// Toast 提示
// ============================================

/**
 * 显示 Toast 提示
 * @param {string} message
 * @param {'info'|'success'|'error'} type
 * @param {number} duration
 */
function showToast(message, type = "info", duration = 2000) {
  // 移除已有的 toast
  const existing = document.querySelector(".Antigravity-Power-Pro-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `Antigravity-Power-Pro-toast Antigravity-Power-Pro-toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // 显示动画
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  // 自动隐藏
  if (duration > 0) {
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  return toast;
}

/**
 * 执行提示词增强（直接替换输入框内容）
 */
async function performEnhance() {
  if (!isEnabled()) {
    showToast("提示词增强功能已关闭", "error");
    return;
  }

  // 检查 API Key
  if (!config.apiKey) {
    showToast("请先在 Antigravity-Power-Pro 配置 apiKey，设置好模型", "error", 5000);
    return;
  }

  const input = findActiveInput();
  if (!input) {
    showToast("未找到输入框", "error");
    return;
  }

  const originalPrompt = getInputValue(input).trim();
  if (!originalPrompt) {
    showToast("请先输入需要增强的提示词", "error");
    return;
  }

  // 显示加载状态
  const loadingToast = showToast("✨ 正在优化提示词...", "info", 0);

  try {
    const enhanced = await enhance(originalPrompt);

    // 直接替换输入框内容
    setInputValue(input, enhanced);

    // 移除加载提示，显示成功
    loadingToast.remove();
    showToast("✓ 提示词已优化", "success", 1500);
  } catch (error) {
    loadingToast.remove();
    showToast(`✗ ${error.message}`, "error", 3000);
    console.error("[PromptEnhance] Error:", error);
  }
}

// 快捷键功能已移除，统一使用按钮触发

/**
 * 创建增强按钮元素
 * @param {Function} onClick - 点击回调
 * @returns {HTMLButtonElement}
 */
export function createEnhanceButton(onClick) {
  const btn = document.createElement("button");
  btn.className = "Antigravity-Power-Pro-enhance-btn";
  btn.title = "";
  btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
    `;
  btn.addEventListener("click", onClick || performEnhance);
  return btn;
}

/**
 * 注入样式
 */
export function injectStyles() {
  if (document.getElementById("Antigravity-Power-Pro-enhance-styles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "Antigravity-Power-Pro-enhance-styles";
  style.textContent = `
        /* 增强按钮样式 */
        .Antigravity-Power-Pro-enhance-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 26px !important;
            height: 26px !important;
            padding: 0 !important;
            margin: -6px 4px 0 0 !important;
            background: rgba(255, 255, 255, 0.1) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 4px !important;
            color: rgba(255, 255, 255, 0.7) !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            flex-shrink: 0 !important;
            position: relative !important;
        }

        .Antigravity-Power-Pro-enhance-btn:hover {
            background: rgba(251, 191, 36, 0.2) !important;
            color: #fbbf24 !important;
            border-color: rgba(251, 191, 36, 0.4) !important;
        }

        .Antigravity-Power-Pro-enhance-btn:active {
            transform: scale(0.9) !important;
        }

        .Antigravity-Power-Pro-enhance-btn.loading {
            pointer-events: none;
            opacity: 0.6;
        }

        .Antigravity-Power-Pro-enhance-btn.loading svg {
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .Antigravity-Power-Pro-enhance-btn svg {
            width: 14px;
            height: 14px;
        }

        /* Toast 提示样式 */
        .Antigravity-Power-Pro-toast {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            z-index: 99999;
            opacity: 0;
            transition: all 0.2s ease;
            pointer-events: none;
            white-space: nowrap;
        }

        .Antigravity-Power-Pro-toast.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }

        .Antigravity-Power-Pro-toast-info {
            background: rgba(59, 130, 246, 0.95);
            color: white;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .Antigravity-Power-Pro-toast-success {
            background: rgba(34, 197, 94, 0.95);
            color: white;
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
        }

        .Antigravity-Power-Pro-toast-error {
            background: rgba(239, 68, 68, 0.95);
            color: white;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }
    `;
  document.head.appendChild(style);
}

/**
 * 显示错误提示（向后兼容）
 * @param {string} message - 错误信息
 */
export function showErrorModal(message) {
  showToast(`✗ ${message}`, "error", 3000);
}

/**
 * 显示结果（向后兼容，直接应用）
 * @param {string} enhancedPrompt - 增强后的提示词
 * @param {Function} onApply - 应用回调
 * @param {Function} onCancel - 取消回调
 */
export function showResultModal(enhancedPrompt, onApply, onCancel) {
  // 直接应用，不再显示弹窗
  if (onApply) {
    onApply(enhancedPrompt);
  }
  showToast("✓ 提示词已优化", "success", 1500);
}

/**
 * 获取配置
 * @returns {Object}
 */
export function getConfig() {
  return { ...config };
}

/**
 * 手动触发增强（供外部调用）
 */
export function triggerEnhance() {
  performEnhance();
}

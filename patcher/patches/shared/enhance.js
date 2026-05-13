/**
 * 提示词增强模块
 * 调用自定义 LLM API 优化用户输入的提示词
 * 支持 OpenAI 兼容格式和 Anthropic Claude 格式
 * 
 * 功能特性:
 * - 直接替换输入框内容
 * - 自动收集 IDE 上下文信息
 * - 简洁的 toast 提示
 */

const DEFAULT_SYSTEM_PROMPT = `你是一个智能提示词优化器，专门帮助用户生成更有效的 AI 对话提示词。

核心任务
将用户输入的原始提示词优化为更清晰、更具体、更有效的版本。

你会收到的信息
1. 对话上下文：之前的对话历史（如果有）
2. 当前文件：用户正在编辑的文件（如果有）
3. 选中代码：用户选中的代码片段（如果有）
4. 用户原始提示词：需要优化的内容

优化规则
1. 理解上下文：仔细阅读对话历史，理解当前讨论的主题和背景
2. 保持连贯性：优化后的提示词应该与之前的对话保持逻辑连贯
3. 具体化：让模糊的问题变得具体，如果上下文中有相关信息就引用它
4. 结构化：为复杂问题添加清晰的结构
5. 保持意图：不改变用户的原始意图，只是表达得更清晰

输出格式 重要
- 禁止使用 Markdown 语法（禁止 ** 加粗、禁止 # 标题、禁止 \` 代码块）
- 使用纯文本格式：换行分隔段落，用数字1./2. 或短横线 - 开头列表
- 只输出优化后的提示词，不要任何解释和额外内容
- 保持用户使用的语言（中文/英文）
- 确保输出包含必要的换行符，不要将长文本压缩成一行

示例

示例 1 - 无上下文
输入: hi
输出: 你好，请帮我解决一个问题。我会详细描述需求，请提供完整的解决方案。

示例 2 - 有上下文
对话历史: [用户问了如何修复登录 bug，AI 提供了方案]
输入: 还有问题
输出: 按照你之前提供的登录 bug 修复方案，我尝试后发现仍有问题。请帮我进一步排查，可能是哪些原因导致的？`;

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

// 初始化配置
try {
  const savedConfig = localStorage.getItem("Antigravity_PromptEnhance_Config");
  if (savedConfig) {
    const parsed = JSON.parse(savedConfig);
    // 强制清理 legacy 错误配置
    if (parsed.apiBase && parsed.apiBase.includes("127.0.0.1:8045")) {
      console.log("[PromptEnhance] 清理旧版本地代理地址，重置为 Freemodel");
      parsed.apiBase = DEFAULT_CONFIG.apiBase;
      parsed.model = DEFAULT_CONFIG.model;
    }
    config = { ...config, ...parsed };
  }
} catch (e) {
  console.error("[PromptEnhance] 加载配置失败:", e);
}

// 供外部更新配置的方法
window.updatePromptEnhanceConfig = (newConfig) => {
  config = { ...config, ...newConfig };
  localStorage.setItem("Antigravity_PromptEnhance_Config", JSON.stringify(config));
  console.log("[PromptEnhance] 配置已更新", config);
};

export const init = (initialConfig) => {
  if (initialConfig) {
    config = { ...config, ...initialConfig };
  }
  injectStyles();
  console.log("[PromptEnhance] 模块已初始化", config);
};

export const isEnabled = () => config.enabled;
const isAnthropicAPI = () => config.provider === "anthropic" || config.apiBase.includes("anthropic");

// ============================================
// 上下文收集
// ============================================

const CONVERSATION_SELECTORS = [
  // Antigravity v1.23+ 唯一精准对话容器 (CDP 实测)
  ".antigravity-agent-side-panel .h-full.overflow-y-auto.grow",
  ".cascade-scrollbar",
  ".conversation-container",
  "[class*=\"conversation\"]",
];

const NOISE_SELECTORS = [
  ".model-selector-container",
  ".chat-input-container",
  "button",
  ".antigravity-agent-side-panel-header",
];

/**
 * 收集对话上下文信息
 */
function buildContextPrefix() {
  let context = "";

  // 1. 获取对话滚动区域
  let conversationEl = null;
  for (const selector of CONVERSATION_SELECTORS) {
    conversationEl = document.querySelector(selector);
    if (conversationEl) break;
  }

  if (conversationEl) {
    // 克隆并过滤噪声元素
    const clone = conversationEl.cloneNode(true);
    NOISE_SELECTORS.forEach(s => {
      clone.querySelectorAll(s).forEach(n => n.remove());
    });
    const historyText = clone.innerText.trim();
    if (historyText) {
      context += `对话历史:\n${historyText.substring(Math.max(0, historyText.length - 3000))}\n\n`;
    }
  }

  // 2. 获取当前编辑文件名 (尝试从 Tab 获取)
  const activeTab = document.querySelector("[class*=\"tab-\"].active, .tab.selected");
  if (activeTab) {
    context += `当前文件: ${activeTab.innerText.trim()}\n\n`;
  }

  // 3. 获取选中的代码 (如果可能)
  const selection = window.getSelection().toString().trim();
  if (selection && selection.length < 2000) {
    context += `选中代码:\n${selection}\n\n`;
  }

  return context;
}

// ============================================
// LLM 交互
// ============================================

/**
 * 执行提示词增强
 * @param {string} prompt - 原始提示词
 * @returns {Promise<string>} - 增强后的提示词
 */
export async function enhance(prompt) {
  if (!prompt.trim()) {
    throw new Error("提示词不能为空");
  }

  const contextPrefix = buildContextPrefix();

  try {
    if (isAnthropicAPI()) {
      return await callAnthropicAPI(prompt, contextPrefix);
    } else {
      return await callOpenAIAPI(prompt, contextPrefix);
    }
  } catch (error) {
    console.error("[PromptEnhance] API Error:", error);
    throw error;
  }
}

/**
 * 调用 OpenAI 兼容 API
 */
async function callOpenAIAPI(prompt, contextPrefix = "") {
  const userMessage = contextPrefix 
    ? `上下文信息:\n${contextPrefix}\n用户原始提示词:\n${prompt.trim()}`
    : prompt.trim();

  const response = await fetch(`${config.apiBase}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || prompt;
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
      system: config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Anthropic API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text?.trim() || prompt;
}

// ============================================
// DOM 交互逻辑
// ============================================

const INPUT_SELECTORS = [
  "[contenteditable=\"true\"][role=\"textbox\"]",
  "textarea.native-textarea",
  "textarea[placeholder*=\"Ask\"]",
  "textarea[placeholder*=\"message\"]",
  "#windsurf-input",
];

function findActiveInput() {
  for (const selector of INPUT_SELECTORS) {
    const el = document.querySelector(selector);
    if (el && el.isConnected) return el;
  }
  return document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.contentEditable === "true" 
    ? document.activeElement : null;
}

function getInputValue(input) {
  if (!input) return "";
  return input.contentEditable === "true" ? (input.innerText || "") : (input.value || "");
}

async function setInputValue(input, value) {
  if (!input) return false;
  input.focus();

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // 方法1: 直接操作 innerText/value
  if (input.contentEditable === "true") {
    input.innerText = value;
  } else {
    input.value = value;
  }

  // 方法2: execCommand (某些 IDE 必需)
  try {
    document.execCommand("selectAll", false, null);
    document.execCommand("insertText", false, value);
  } catch (e) {
    console.warn("[PromptEnhance] execCommand 失败，尝试 fallback");
  }

  await sleep(50);
  if (getInputValue(input) === value) return true;

  // 方法3: 原生 Setterfallback
  const nativeSetter = Object.getOwnPropertyDescriptor(
    input.contentEditable === "true" ? window.HTMLElement.prototype : window.HTMLTextAreaElement.prototype,
    input.contentEditable === "true" ? "innerText" : "value"
  )?.set;

  if (nativeSetter) {
    nativeSetter.call(input, value);
  } else {
    if (input.contentEditable === "true") input.innerText = value;
    else input.value = value;
  }

  // 触发事件
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));

  return getInputValue(input) === value;
}

// ============================================
// Toast & UI
// ============================================

function showToast(message, type = "info", duration = 2000) {
  const existing = document.querySelector(".Antigravity-Power-Pro-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `Antigravity-Power-Pro-toast Antigravity-Power-Pro-toast-${type}`;
  toast.innerText = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));

  if (duration > 0) {
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }
  return toast;
}

async function performEnhance() {
  if (!isEnabled()) {
    showToast("提示词增强功能已关闭", "error");
    return;
  }

  if (!config.apiKey) {
    showToast("请先在配置中设置 API Key", "error", 5000);
    return;
  }

  const input = findActiveInput();
  if (!input) {
    showToast("未找到活动输入框", "error");
    return;
  }

  const originalPrompt = getInputValue(input).trim();
  if (!originalPrompt) {
    showToast("请先输入提示词", "error");
    return;
  }

  const loadingToast = showToast("✨ 正在优化提示词...", "info", 0);
  try {
    const enhanced = await enhance(originalPrompt);
    const success = await setInputValue(input, enhanced);
    loadingToast.remove();
    if (success) showToast("✓ 已完成并自动填充", "success", 2000);
    else showToast("⚠️ 优化成功但回显失败，请尝试手动刷新", "info", 4000);
  } catch (error) {
    loadingToast.remove();
    showToast(`✗ 失败: ${error.message}`, "error", 4000);
  }
}

export function createEnhanceButton(onClick) {
  const btn = document.createElement("button");
  btn.className = "Antigravity-Power-Pro-enhance-btn";
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
    </svg>
  `;
  btn.addEventListener("click", onClick || performEnhance);
  return btn;
}

export function injectStyles() {
  if (document.getElementById("Antigravity-Power-Pro-enhance-styles")) return;
  const style = document.createElement("style");
  style.id = "Antigravity-Power-Pro-enhance-styles";
  style.textContent = `
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
    }
    .Antigravity-Power-Pro-enhance-btn:hover {
      background: rgba(251, 191, 36, 0.2) !important;
      color: #fbbf24 !important;
      border-color: rgba(251, 191, 36, 0.4) !important;
    }
    .Antigravity-Power-Pro-toast {
      position: fixed;
      bottom: 100px;
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
    .Antigravity-Power-Pro-toast-info { background: #3b82f6; color: white; }
    .Antigravity-Power-Pro-toast-success { background: #22c55e; color: white; }
    .Antigravity-Power-Pro-toast-error { background: #ef4444; color: white; }
  `;
  document.head.appendChild(style);
}

export function showErrorModal(msg) { showToast(msg, "error"); }
export function showResultModal(enhanced, onApply) { if (onApply) onApply(enhanced); showToast("✓ 已优化", "success"); }
export function getConfig() { return { ...config }; }
export function triggerEnhance() { performEnhance(); }
export { setInputValue };

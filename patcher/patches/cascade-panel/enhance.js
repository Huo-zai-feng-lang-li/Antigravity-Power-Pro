/**
 * 提示词增强模块
 * 调用自定义 LLM API 优化用户输入的提示词
 * 支持 OpenAI 兼容格式和 Anthropic Claude 格式
 */

// 默认系统提示词
const DEFAULT_SYSTEM_PROMPT = `你是一个专业的提示词优化专家。你的任务是优化用户提供的提示词,使其更加:
1. 清晰明确 - 消除歧义,让意图更加明显
2. 结构化 - 添加合理的结构和格式要求
3. 具体详细 - 补充必要的上下文和约束条件
4. 有效高效 - 确保 AI 能够准确理解并给出高质量回答

规则:
- 直接输出优化后的提示词,不要添加任何解释或前缀
- 保持用户原始意图不变
- 使用与用户相同的语言(中文或英文)
- 如果原始提示词已经很好,可以适当润色但不要过度修改`;

// 配置默认值
const DEFAULT_CONFIG = {
  enabled: false,
  provider: "anthropic",
  apiBase: "https://api.anthropic.com",
  apiKey: "",
  model: "claude-sonnet-4-20250514",
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
}

/**
 * 检查功能是否启用
 * @returns {boolean}
 */
export function isEnabled() {
  return config.enabled && config.apiKey && config.apiBase && config.model;
}

/**
 * 检查是否为 Anthropic API
 * @returns {boolean}
 */
function isAnthropicAPI() {
  return (
    config.provider === "anthropic" || config.apiBase.includes("anthropic")
  );
}

/**
 * 调用 Anthropic Claude API
 * @param {string} prompt - 原始提示词
 * @returns {Promise<string>} - 增强后的提示词
 */
async function callAnthropicAPI(prompt) {
  const response = await fetch(`${config.apiBase}/v1/messages`, {
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
      messages: [{ role: "user", content: prompt.trim() }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `API 请求失败: ${response.status}`,
    );
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error("API 返回内容为空");
  }

  return content.trim();
}

/**
 * 调用 OpenAI 兼容 API
 * @param {string} prompt - 原始提示词
 * @returns {Promise<string>} - 增强后的提示词
 */
async function callOpenAICompatibleAPI(prompt) {
  const messages = [
    { role: "system", content: config.systemPrompt },
    { role: "user", content: prompt.trim() },
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
    throw new Error(
      errorData.error?.message || `API 请求失败: ${response.status}`,
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("API 返回内容为空");
  }

  return content.trim();
}

/**
 * 调用 LLM API 增强提示词
 * @param {string} prompt - 原始提示词
 * @returns {Promise<string>} - 增强后的提示词
 */
export async function enhance(prompt) {
  if (!isEnabled()) {
    throw new Error("提示词增强功能未配置或未启用");
  }

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new Error("提示词不能为空");
  }

  try {
    if (isAnthropicAPI()) {
      return await callAnthropicAPI(prompt);
    } else {
      return await callOpenAICompatibleAPI(prompt);
    }
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("网络请求失败,请检查网络连接和 API 地址");
    }
    throw error;
  }
}

/**
 * 创建增强按钮元素
 * @param {Function} onClick - 点击回调
 * @returns {HTMLButtonElement}
 */
export function createEnhanceButton(onClick) {
  const btn = document.createElement("button");
  btn.className = "anti-power-enhance-btn";
  btn.title = "提示词增强 (AI 优化)";
  btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
    `;
  btn.addEventListener("click", onClick);
  return btn;
}

/**
 * 注入增强按钮的样式
 */
export function injectStyles() {
  if (document.getElementById("anti-power-enhance-styles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "anti-power-enhance-styles";
  style.textContent = `
        .anti-power-enhance-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            padding: 0;
            margin: 0 4px;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            transition: all 0.15s ease;
            flex-shrink: 0;
        }

        .anti-power-enhance-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fbbf24;
            border-color: rgba(251, 191, 36, 0.3);
        }

        .anti-power-enhance-btn:active {
            transform: scale(0.95);
        }

        .anti-power-enhance-btn.loading {
            pointer-events: none;
            opacity: 0.6;
        }

        .anti-power-enhance-btn.loading svg {
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .anti-power-enhance-btn svg {
            width: 14px;
            height: 14px;
        }

        /* 增强结果弹窗 */
        .anti-power-enhance-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(4px);
        }

        .anti-power-enhance-modal-content {
            background: #1e1e1e;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .anti-power-enhance-modal h3 {
            margin: 0 0 16px;
            font-size: 16px;
            font-weight: 500;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .anti-power-enhance-modal h3 svg {
            color: #fbbf24;
        }

        .anti-power-enhance-result {
            background: #2d2d2d;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 12px;
            font-size: 14px;
            line-height: 1.6;
            color: #e0e0e0;
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 300px;
            overflow-y: auto;
        }

        .anti-power-enhance-actions {
            display: flex;
            gap: 12px;
            margin-top: 16px;
            justify-content: flex-end;
        }

        .anti-power-enhance-actions button {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.15s;
        }

        .anti-power-enhance-actions .primary {
            background: #3b82f6;
            border: none;
            color: white;
        }

        .anti-power-enhance-actions .primary:hover {
            background: #2563eb;
        }

        .anti-power-enhance-actions .secondary {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #e0e0e0;
        }

        .anti-power-enhance-actions .secondary:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .anti-power-enhance-error {
            color: #ef4444;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 8px;
            padding: 12px;
            font-size: 14px;
        }
    `;
  document.head.appendChild(style);
}

/**
 * 显示增强结果弹窗
 * @param {string} enhancedPrompt - 增强后的提示词
 * @param {Function} onApply - 应用回调
 * @param {Function} onCancel - 取消回调
 */
export function showResultModal(enhancedPrompt, onApply, onCancel) {
  const modal = document.createElement("div");
  modal.className = "anti-power-enhance-modal";
  modal.innerHTML = `
        <div class="anti-power-enhance-modal-content">
            <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                提示词增强结果
            </h3>
            <div class="anti-power-enhance-result">${escapeHtml(enhancedPrompt)}</div>
            <div class="anti-power-enhance-actions">
                <button class="secondary" data-action="cancel">取消</button>
                <button class="secondary" data-action="copy">复制</button>
                <button class="primary" data-action="apply">应用</button>
            </div>
        </div>
    `;

  modal.addEventListener("click", (e) => {
    const action = e.target.dataset?.action;
    if (action === "apply") {
      onApply(enhancedPrompt);
      modal.remove();
    } else if (action === "cancel" || e.target === modal) {
      onCancel?.();
      modal.remove();
    } else if (action === "copy") {
      navigator.clipboard.writeText(enhancedPrompt).then(() => {
        e.target.textContent = "已复制!";
        setTimeout(() => {
          e.target.textContent = "复制";
        }, 1500);
      });
    }
  });

  document.body.appendChild(modal);
  return modal;
}

/**
 * 显示错误弹窗
 * @param {string} message - 错误信息
 */
export function showErrorModal(message) {
  const modal = document.createElement("div");
  modal.className = "anti-power-enhance-modal";
  modal.innerHTML = `
        <div class="anti-power-enhance-modal-content">
            <h3>增强失败</h3>
            <div class="anti-power-enhance-error">${escapeHtml(message)}</div>
            <div class="anti-power-enhance-actions">
                <button class="primary" data-action="close">关闭</button>
            </div>
        </div>
    `;

  modal.addEventListener("click", (e) => {
    if (e.target.dataset?.action === "close" || e.target === modal) {
      modal.remove();
    }
  });

  document.body.appendChild(modal);
  return modal;
}

/**
 * HTML 转义
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 获取配置
 * @returns {Object}
 */
export function getConfig() {
  return { ...config };
}

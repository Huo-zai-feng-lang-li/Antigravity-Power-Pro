# Changelog

本文件记录每个版本的 Bug 修复和关键备忘, 防止后续改代码时重复踩坑.

---

## v2.6.25 (2026-05-13)

### Bug 修复

| Bug | 根因 | 修复文件 | 关键细节 |
|-----|------|----------|----------|
| 输入框有值但提示词按钮仍报"请先输入" | 点击处理器用宽泛的 `querySelectorAllDeep(INPUT_SELECTOR)` 可能匹配到非用户输入的空 contenteditable 元素; 且未清理零宽字符 | `cascade-panel/scan.js` + `manager-panel/scan.js` | 改为与注入逻辑一致的精确 querySelector, 并 strip 零宽字符 (`\u200B-\u200D`, `\uFEFF`) |
| 侧边栏出现两个滚动按钮 | `manager-panel/scroll-to-bottom.js` 的 `findRoot()` 优先匹配 `.antigravity-agent-side-panel`, 在 Manager 窗口中把按钮挂到了侧边栏容器, 与 cascade-panel 自己的按钮重叠 | `manager-panel/scroll-to-bottom.js` | 移除 `.antigravity-agent-side-panel` 匹配, Manager 滚动按钮仅挂载到 Manager 专用容器 |
| 滚动按钮位置微调 | 用户反馈居中按钮需下移 10px | `cascade-panel/cascade-panel.css` | `bottom: 80px` -> `70px` |

---

## v2.6.24 (2026-05-13)

### Bug 修复

| Bug | 根因 | 修复文件 | 关键细节 |
|-----|------|----------|----------|
| 滚动按钮偏右 (根治) | `workbench.html` 同时加载 `cascade-panel.css` 和 `manager-panel.css`, 两者用相同 ID `#cascade-scroll-bottom-btn` 定义不同 `left` 值, 后加载的 `calc(50%+120px)` 覆盖 `50%` | `manager-panel/scroll-to-bottom.js` + `manager-panel.css` | Manager 按钮 ID 改为 `#manager-scroll-bottom-btn`, 彻底消除 CSS 选择器冲突 |
| 安装器 systemPrompt 旧版 | `mergePromptEnhance` 无法区分旧版默认 prompt 与用户自定义 prompt, 旧版含 Markdown 格式(`## 标题`, `** 加粗`) 的默认值被保留 | `src/App.vue` | 引入 `SYSTEM_PROMPT_VERSION` 版本号机制, 磁盘版本 < 当前版本时自动重置 |

### 关键备忘 (踩坑记录)

#### 8. CSS ID 冲突: 多 CSS 文件共享 ID 的致命问题

Manager 和 Cascade 的滚动按钮之前使用相同的 CSS ID `#cascade-scroll-bottom-btn`. 由于 Antigravity workbench.html 同时加载了 `cascade-panel.css` 和 `manager-panel.css`, 后加载的规则覆盖前者. 教训: **不同模块的 DOM 元素必须使用不同 ID, 即使它们"看似不会同时存在"**.

通过 Playwright 远程调试 (`--remote-debugging-port=9000`) 抓取 computed style 确认了真实 left 值.

#### 9. systemPrompt 版本号迁移机制

在 `features.promptEnhance` 中新增 `systemPromptVersion` 字段:
- 每次更新 `DEFAULT_SYSTEM_PROMPT` 时, 只需递增 `SYSTEM_PROMPT_VERSION` 常量
- `mergePromptEnhance` 对比磁盘版本号: 旧版自动重置, 新版保留用户自定义
- 不再依赖 Markdown 特征检测或文本比对

---

## v2.6.23 (2026-05-13)

### Bug 修复

| Bug | 根因 | 修复文件 | 关键细节 |
|-----|------|----------|----------|
| 滚动按钮偏右 | `.visible` 的 `transform` 缺少 `!important`, 被初始状态的 `!important` 覆盖, `translateX(-50%)` 居中失效 | `cascade-panel.css` + `manager-panel.css` | 给 `.visible` 的 transform 加 `!important` (后被 v2.6.24 的 ID 冲突根治取代) |
| "请先输入" 误判 | `contenteditable` 元素无 `.value` 属性 (返回 `undefined`), `.textContent` 在某些 DOM 结构下为空 | `cascade-panel/scan.js` L402 | 优先使用 `innerText` 获取可见文本 |
| 安装器 systemPrompt 旧版 (初修) | `mergePromptEnhance` 无条件保留磁盘 `systemPrompt` | `src/App.vue` | 添加与 DEFAULT_SYSTEM_PROMPT 的文本比对 (后被 v2.6.24 的版本号机制取代) |

---

## v2.6.22 (2026-05-13)

### Bug 修复

| Bug | 根因 | 修复文件 | 关键细节 |
|-----|------|----------|----------|
| 提示词增强按钮消失 | `enhance.js` 全量重写时遗漏了 `init`, `isEnabled`, `setInputValue` 三个导出 | `patches/shared/enhance.js` | `scan.js` 第 370/371/411 行依赖这三个函数, 缺失任何一个都会导致按钮不注入 |
| 滚动按钮不居中 | CSS `transform` 在同一规则块内定义了两次, 后者覆盖前者且没加 `!important` | `patches/cascade-panel/cascade-panel.css` | CSS 同块内后定义的属性总是覆盖前面的, 与 `!important` 无关 |
| 安装器编译失败 (TS1005) | `App.vue` 模板字符串中包含未转义的反引号 `` ` `` | `src/App.vue` | 模板字符串 `` `...` `` 内不能直接写 `` ` ``, 需要用 `\`` 转义或改为文字描述 |
| 提示词回显显示 Markdown 符号 | `App.vue` 和 `enhance.js` 的系统提示词要求 AI 使用 `**`/`##` 格式, 但 IDE 输入框是纯文本 | `src/App.vue` + `patches/shared/enhance.js` | 两个文件的 `DEFAULT_SYSTEM_PROMPT` 必须同步修改 |
| 连接测试报错 "Failed to fetch" | Tauri webview 的 CORS 限制, 无法直接发起跨域请求 | `src/components/PromptEnhanceCard.vue` | 捕获 CORS 错误后显示友好提示, 引导用户在 IDE 内验证 |

### 关键备忘 (踩坑记录)

#### 1. enhance.js 导出接口清单

`scan.js` 依赖以下全部导出, 修改 `enhance.js` 时**必须保留**:

```
export const init
export const isEnabled
export async function enhance
export function createEnhanceButton
export function injectStyles
export function showErrorModal
export function showResultModal
export function getConfig
export function triggerEnhance
export { setInputValue }
```

#### 2. CSS 同规则块内禁止重复属性

```css
/* BAD - 后者覆盖前者, 第一行的 !important 无效 */
#btn {
    transform: translateX(-50%) !important;  /* 被覆盖 */
    transform: translateX(-50%) scale(0.9);  /* 实际生效, 无 !important */
}

/* GOOD - 只写一次 */
#btn {
    transform: translateX(-50%) translateY(10px) scale(0.9) !important;
}
```

#### 3. 模板字符串内的反引号必须转义

```typescript
// BAD - 编译报错 TS1005
const prompt = `禁止使用 \` 代码块`;

// GOOD - 用文字替代
const prompt = `禁止使用反引号代码块`;
```

#### 4. 系统提示词双端同步

修改提示词时, 必须同时更新两个文件:
- `patcher/patches/shared/enhance.js` 的 `DEFAULT_SYSTEM_PROMPT` (IDE 运行时)
- `patcher/src/App.vue` 的 `DEFAULT_SYSTEM_PROMPT` (安装器 UI 展示/写入 config.json)

#### 5. 工具编辑中文文件的 CRLF 陷阱

用 AI 编辑工具修改含大量中文 + Windows CRLF 换行符的文件时, 可能出现字节偏移错位导致文件损坏. 安全做法:
- 优先用 `write_to_file` 全量重写
- 或用 Node.js 脚本做正则替换
- 避免对长中文字符串做多次小范围 diff 编辑

#### 6. GitHub Actions 触发规则

- `.github/workflows/release.yml` 监听 `push tags: v*`
- force-push 已有 tag **不保证**触发 CI 重新构建
- 稳妥做法: bump 新版本号, 推送全新 tag

#### 7. 补丁文件是编译时嵌入的

`patcher/patches/` 下的文件通过 `build.rs` 在编译时嵌入到 Rust 二进制中. 修改源文件后:
- 本地测试: 需要重新 `npm run tauri:build`
- 发布: 推送新 tag, 等 GitHub Actions 自动构建

---

## v2.6.20 (2026-05-13)

### 主要变更
- 安装前自动清除遗留配置 (防止旧版本残留配置污染新版)
- 上下文采集选择器更新为 CDP 实测的精准选择器 `.antigravity-agent-side-panel .h-full.overflow-y-auto.grow`
- Freemodel API 开箱即用 (内置默认 apiBase/model/apiKey)
- 双路径注入架构 (侧边栏 + Manager 窗口)

## v2.6.18 (2026-05-12)

### 主要变更
- Rust 内置默认 API 配置
- 上下文采集去噪 (过滤 model-selector, header 等干扰元素)
- 版本配置三端对齐 (package.json / tauri.conf.json / Cargo.toml)

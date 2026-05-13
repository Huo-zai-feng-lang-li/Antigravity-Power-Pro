# Changelog

本文件记录每个版本的 Bug 修复和关键备忘, 防止后续改代码时重复踩坑.

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

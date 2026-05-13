# 最新接续状态 (2026-05-13 13:25)

## 核心进展
- **v2.6.20 已 tag 并推送**，CI 自动构建 EXE 中。
- **上下文采集修复闭环**：通过 CDP 枚举 `.antigravity-agent-side-panel` 内所有 `.overflow-y-auto` 元素，实测确认 `[0]` 号元素（class 含 `grow flex-col`）为真实对话滚动区，选择器已更新为 `.antigravity-agent-side-panel .h-full.overflow-y-auto.grow`。
- **安装前遗留配置清除**：`confirmInstall` 和 `confirmWindsurfInstall` 均在调用 Rust 前执行 `mergePromptEnhance` 强制重置旧版 `localhost:8045`、`gemini-3-flash` 等遗留值。
- **废弃脚本全清**：`tests/scripts/` 下的 40+ diag/debug 文件已删除，仅保留 `cdp-utils.js` 和 `connect-antigravity.js`。

## 变更决策

| 文件 | 变更内容 |
|------|----------|
| `patcher/patches/shared/enhance.js` | CONVERSATION_SELECTORS 更新为 CDP 实测精准值；删除重复 `isAnthropicAPI` 和未使用 `isOpenAIAPI` |
| `patcher/patches/cascade-panel/cascade-panel.css` | 滚动按钮 `left/right/transform` 加 `!important` |
| `patcher/src/App.vue` | `confirmInstall` / `confirmWindsurfInstall` 安装前调用 `mergePromptEnhance` 清除遗留配置；`checkPatchStatus` 读取旧配置时过滤遗留值 |
| `README.md` | 版本升至 v2.6.20，IDE 支持升至 v1.23.2，新增手动定制 PowerShell 章节 |
| `tests/scripts/` | 删除全部临时诊断脚本 |

## 待办事项 (Next Steps)
- [ ] **等待用户实测**：用最新 EXE 安装后，确认：1) 提示词增强默认 freemodel.dev；2) 滚动按钮居中；3) 上下文采集有内容传送给 LLM
- [ ] **Windsurf 侧上下文采集**：`enhance.js` 的 CONVERSATION_SELECTORS 目前仅针对 Antigravity DOM，Windsurf 的选择器是否有效，需用 Windsurf CDP 单独验证
- [ ] **回显输入框验证**：`setInputValue` 已实现，但 `[contenteditable]` 的 nativeInputValueSetter 注入路径在新版 IDE 下需实际测试确认有效

## 关键上下文
- 目录: `c:\Users\Administrator\Desktop\超级文件\AI-IDE\AI\Antigravity-Power-Pro`
- 主要文件:
  - `patcher/patches/shared/enhance.js` (上下文采集核心)
  - `patcher/src/App.vue` (安装器配置合并逻辑)
  - `patcher/patches/cascade-panel/cascade-panel.css` (滚动按钮样式)
- CDP 调试命令: `D:\Antigravity\Antigravity.exe --remote-debugging-port=9000`
- CDP 实测关键发现: `.antigravity-agent-side-panel` 存在于 workbench.html，无 iframe 隔离
- 当前版本: `v2.6.20` (tag 已推送)

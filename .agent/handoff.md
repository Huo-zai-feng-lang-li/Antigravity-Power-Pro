# 最新接续状态 (2026-05-13 19:50)

## 核心进展
- **v2.6.25 发布**: 修复提示词按钮输入检测 + 移除侧边栏重复滚动按钮 + 按钮下移 10px.

## 变更决策
- **提示词按钮输入检测**: 点击处理器从宽泛的 `querySelectorAllDeep(INPUT_SELECTOR)` 改为与注入逻辑一致的精确 `panel.querySelector('[role="textbox"]')`, 并 strip 零宽字符.
- **Manager findRoot 隔离**: `manager-panel/scroll-to-bottom.js` 移除 `.antigravity-agent-side-panel` 优先匹配, 避免 Manager 的滚动按钮侵入侧边栏.
- **滚动按钮位置**: `cascade-panel.css` bottom 80px -> 70px.

## 待办事项 (Next Steps)
- [ ] 等 CI 构建 v2.6.25 exe, 下载后重新注入验证两个 Bug
- [ ] 确认 Windsurf 的 systemPromptVersion 是否也需要同步处理
- [ ] 清理 `tests/scripts/debug-cascade-diag.js` 调试脚本 (或保留为诊断工具)

## 关键上下文
- 目录: `c:\Users\Administrator\Desktop\超级文件\AI-IDE\AI\Antigravity-Power-Pro`
- 主要文件: `patcher/patches/cascade-panel/scan.js`, `patcher/patches/manager-panel/scroll-to-bottom.js`, `patcher/patches/cascade-panel/cascade-panel.css`
- 调试方式: `D:\Antigravity\Antigravity.exe --remote-debugging-port=9000` + Playwright 连接
- IDE 安装路径: `D:\Antigravity\`

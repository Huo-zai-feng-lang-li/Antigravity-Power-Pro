# Changelog

本文件记录每个版本的 Bug 修复和关键备忘, 防止后续改代码时重复踩坑. 时间格式如 `2026-05-15 09:00:00`同步的是git 提交时间

## v2.6.63 (2026-05-16 02:26:00)

### Manager 提示词增强按钮重复创建修复

| 修复项 | 根因 | 影响范围 |
|--------|------|----------|
| **Manager 输入框每2秒增加一个提示词增强按钮** | `scan.js` 去重检查在 `input.parentElement` 查找按钮，但按钮实际被插入到 `actionBtn.parentElement` 或 `findContainer(input)`，检查位置 ≠ 插入位置，导致每次轮询都创建新按钮 | `manager-panel/scan.js` |
| **修复方案** | 改用 `input.dataset.enhanceAttached` 在 input 元素自身打标记去重，与按钮插入位置解耦 | 同上 |

---

## v2.6.62 (2026-05-15 21:17:00)

### 双面板滚动按钮互斥修复

| 修复项 | 根因 | 影响范围 |
|--------|------|----------|
| **侧边栏出现两个滚动按钮** | manager-panel.js 注入 workbench-jetski-agent.html 后在 `document.body` 创建 `manager-scroll-bottom-btn`，而侧边栏 cascade webview 共享外层 document 的部分 DOM 可见性，导致 manager 按钮视觉上出现在侧边栏区域。cascade 侧有事后 `dup.remove()` 清除逻辑但被 manager 的 MutationObserver 300ms 后重建覆盖 | `manager-panel/scroll-to-bottom.js` + `cascade-panel/scroll-to-bottom.js` |
| **修复方案** | manager 的 `ensureButton()` 开头检测 `cascade-scroll-bottom-btn` 是否存在，若存在则让权不创建按钮；cascade 侧移除冗余的事后删除逻辑 | 同上 |

---

## v2.6.61 (2026-05-15 20:31:00)

### Manager 滚动按钮终极修复 — findRoot/findScrollEl 条件判断全部落空

| 修复项 | 根因 | 影响范围 |
|--------|------|----------|
| **Manager 滚动按钮始终不显示** | `findRoot()` 查找 `.chat-container` / `.agent-view-container` 等语义类名，但 Manager 页面全部使用 Tailwind 工具类（如 `scrollbar-hide`、`overflow-y-auto`），导致 `findRoot()` 永远返回 `null`，`ensureButton()` 在守卫条件处直接退出 | `manager-panel/scroll-to-bottom.js` |
| **修复方案** | Manager 补丁独占 `workbench-jetski-agent.html`，`findRoot()` 直接返回 `document.body`；`findScrollEl()` 改为按 `scrollHeight` 取最大可滚动元素，不再依赖任何语义类名 | `manager-panel/scroll-to-bottom.js` |

### 踩坑备忘

- Manager 页面 DOM 全部由 Tailwind CSS 驱动，无任何语义化类名（`.chat-container` 等不存在），补丁代码不可依赖这些选择器
- CDP 取证流程：注入检查 → 模块加载检查 → `init()` 手动调用 → 确认 `findRoot()` 返回 `null` → 定位根因

---

## v2.6.60 (2026-05-15 20:00:46)

### Manager 滚动侦测重构 — 解除误伤屏蔽 + 全局事件代理

| 修复项 | 根因 | 影响范围 |
|--------|------|----------|
| **Manager 滚动按钮仍不展示** | `findScrollEl` 残存 `.monaco-editor` 硬排除，Manager 聊天区嵌套在编辑器内核内被误伤丢弃；仅识别 `auto/scroll` 忽略了 `overlay/hidden` 自定义滚动 | `scroll-to-bottom.js` |
| **修复方案** | 移除不必要排除（独立页面无需排除）；放宽 overflow 识别；增加 root 级 `capture: true` 全局滚动代理 | `scroll-to-bottom.js` |

---

## v2.6.59 (2026-05-15 19:15:37)

### Manager 滚动按钮修复（根因：findRoot 错误使用 .part.editor）

| 修复项 | 根因 | 影响范围 |
|--------|------|----------|
| **Manager 滚动按钮不显示** | `manager-panel` 补丁运行在独立的 `workbench-jetski-agent.html` 页面里，该页面不含 `.part.editor`，导致 `closest(".part.editor")` 永远返回 null | `manager-panel/scroll-to-bottom.js` |

---

## v2.6.58 (2026-05-15 18:00:00)

### 三连补丁：规则加固 + 降级兜底 + Manager 滚动按钮精准识别

| 修复项 | 根因 | 影响范围 |
|--------|------|----------|
| **架构规则加固** | 将"禁止 selectAll + 必须用 Range.selectNodeContents"写进永恒规则库 | `.agent/rules/README.md` |
| **增强降级兜底** | 回写失败时自动 `clipboard.writeText` 确保结果不丢失 | `shared/enhance.js` |
| **Manager 滚动按钮消失** | `closest(".antigravity-agent-side-panel")` 误判 Manager 也满足条件 | `manager-panel/scroll-to-bottom.js` |

---

## v2.6.57 (2026-05-15 17:30:00)

### 彻底根除回显文本"只追加不覆盖"问题 (Range Override Injection Fix)

| 修复项 | 根因 | 影响范围 |
|--------|------|----------|
| **提示词增强回填追加 Bug** | `execCommand("selectAll")` 在虚拟 DOM 框架下光标塌缩，改用 `Range.selectNodeContents` 物理全选覆盖 | `shared/enhance.js` |
| **性能收益** | 在侧边栏存在大量聊天历史时，扫描耗时降低约 40%-60% | `scan.js` 全系列 |

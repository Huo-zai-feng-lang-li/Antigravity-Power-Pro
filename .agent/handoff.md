# 最新接续状态 (2026-05-13 12:38)

## 核心进展
- **v2.6.11 -> v2.6.18 全链路修复完成**：解决了 exe 安装器无法注入侧边栏功能（滚动按钮、提示词增强按钮）的架构性问题，实现了与本地手术式注入一致的运行环境。最新版本 v2.6.18 已推送至 GitHub，CI 正在编译。

## 变更决策

### 1. 注入架构重构 (v2.6.13-v2.6.15)
- **双路径写入**：Rust 安装器将补丁文件同时写入 `extensions/antigravity/`（插件上下文）和 `workbench/`（主窗口上下文）
- **执行顺序**：`workbench.html` 的 cascade 注入逻辑移至 `install_patch` 末尾，确保在 `write_manager_patches` 覆盖后执行
- **路径映射修复**：`build.rs` 嵌入 `shared/` 为 `cascade-panel/`，但 `scan.js` import 路径是 `../shared/enhance.js`。修复：在 workbench 目录同步创建 `shared/` 目录
- **幂等注入**：`inject_cascade_into_html` 函数采用硬编码路径 + Marker，不依赖 .bak 恢复

### 2. 全链路默认值对齐 (v2.6.16-v2.6.18)
- **三端统一**：`App.vue`（前端）、`patch.rs`（Rust 后端）、`enhance.js`（注入脚本）全部硬编码相同默认值：
  - API URL: `https://api.freemodel.dev/v1`
  - API Key: `fe_oa_d489e9161b01e3cb8954bf50c5a8cd80fdb4b25e5e8870f9`
  - Model: `gpt-5.4-mini`
  - System Prompt: 内置完整"提示词优化器"提示词（Rust 中新增 `DEFAULT_SYSTEM_PROMPT` 常量）

### 3. 视觉修复 (v2.6.17-v2.6.18)
- **滚动按钮居中**：`cascade-panel.css` 中 `#cascade-scroll-bottom-btn` 添加 `transform: translateX(-50%)`
- **上下文采集去噪**：`enhance.js` 中 `collectConversationText` 重构，移除 `.antigravity-agent-side-panel` 选择器（抓整个侧边栏含导航），优先 `.cascade-scrollbar`，克隆节点后剔除 nav/button/sidebar 等噪声

## 待办事项 (Next Steps)
- [ ] **验证 v2.6.18 exe**：下载 CI 构建的最新 exe，安装后确认：1) 滚动按钮居中 2) 提示词按钮可用 3) API 默认配置开箱即用 4) 上下文不再包含侧边栏导航文本
- [ ] **上下文采集深度验证**：用 CDP 远程调试确认 `.cascade-scrollbar` 选择器在侧边栏 DOM 中能命中正确的消息区域，且噪声过滤不会误删对话内容
- [ ] **代码清理**：清理 `enhance.js` 中 `collectIDEContext`、`formatContextForPrompt` 等重构遗留的死代码（L180-L304 区域有两套上下文格式化逻辑共存）
- [ ] **Manager 窗口同步验证**：确认 Manager 窗口的滚动按钮和提示词按钮也能正常工作（共享 `shared/enhance.js`）
- [ ] **Windsurf 默认提示词**：`windsurfFeatures.promptEnhance.systemPrompt` 当前为空字符串，需确认是否应同步内置默认提示词

## 关键上下文
- 目录: `c:\Users\Administrator\Desktop\超级文件\AI-IDE\AI\Antigravity-Power-Pro`
- 主要文件:
  - `patcher/src-tauri/src/commands/patch.rs` (核心注入逻辑 + Rust 默认配置)
  - `patcher/patches/shared/enhance.js` (提示词增强前端逻辑 + 上下文采集)
  - `patcher/patches/cascade-panel/cascade-panel.css` (滚动按钮样式)
  - `patcher/src/App.vue` (安装器 UI + 前端默认值)
  - `patcher/src-tauri/build.rs` (嵌入文件映射)

## 版本变更追踪

| 版本 | 根因 | 修复 |
|---|---|---|
| v2.6.11 | enhance.js SyntaxError + 按钮注入到 statusbar | 删残留代码 + 单例限定面板 |
| v2.6.12 | exe 默认 apiKey 为空 | Rust default 写入 freemodel key |
| v2.6.13 | exe 只写 extensions 不注入 workbench.html | 双路径写入 + inject_html_file |
| v2.6.14 | manager 覆盖 cascade 注入 | inject 移到 install_patch 末尾 |
| v2.6.15 | build.rs 将 shared/X 嵌入为 cascade-panel/X, workbench/shared/ 为空 | cascade-panel/* 同步写到 shared/* |
| v2.6.16 | 前端默认值仍为旧 localhost API | App.vue 3 处 promptEnhance 统一 freemodel |
| v2.6.17 | 滚动按钮偏右 + 上下文抓导航垃圾 | CSS transform + 噪声过滤 |
| v2.6.18 | enhance.js apiKey 为空 + Rust 无默认提示词 | 三端硬编码默认值完全对齐 |

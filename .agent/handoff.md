# 最新接续状态 (2026-05-16 19:06)

## 核心进展
- **本轮发布目标为 v2.6.69**：删除非核心残留文件与引用后走 `/tag` 工作流；远端 tag 触发 GitHub 自动构建部署。
- **非核心功能已物理移除**：copy、Mermaid、Math、表格修复相关 JS/CSS/工具文件已删除，Cascade 主链路不再 import 这些模块。
- **保留功能边界已收敛**：滚动到底部与提示词增强默认开启；字体大小调节保留为可选功能，但默认关闭。
- **Manager 性能边界已收敛**：提示词增强关闭时不再加载增强模块；扫描从固定 2 秒轮询改为 MutationObserver 节流触发。
- **共享模块部署已修复**：`shared/enhance.js` 作为真实共享目录嵌入，Manager/Windsurf 单独安装也会写入 `workbench/shared/`。

## 功能边界红线
- **默认开启**：滚动到底部按钮、提示词增强按钮。
- **保留但默认关闭**：字体大小调节。
- 当前规则只维护仍存在的功能边界；已删除链路不再作为可配置功能记录。

## 关键实现点
- `FEATURE_DEFAULTS_VERSION = 1` 是当前默认策略边界。
- 旧配置识别逻辑在 `patcher/src-tauri/src/commands/patch.rs`：缺少 `featureDefaultsVersion` 时返回 `0`，交给前端迁移。
- 前端迁移逻辑在 `patcher/src/App.vue`：`normalizeDefaultOffFeatures()` 当前只负责清洗旧配置中的 `fontSizeEnabled`。
- 补丁运行时迁移逻辑在：
  - `patcher/patches/cascade-panel/cascade-panel.js`
  - `patcher/patches/manager-panel/manager-panel.js`
  - `patcher/patches/windsurf-panel/windsurf-panel.js`
- 嵌入清单由 `patcher/src-tauri/build.rs` 生成；`shared/` 不能伪装成面板目录，必须以真实 `shared/*` 路径嵌入。

## 已验证
- `npm run build` 通过。
- `cargo check` 通过。
- 关键 JS `node --check` 通过：Cascade、Manager、Windsurf、shared enhance。
- `git diff --check` 通过。
- 历史残留扫描通过：仅剩 CHANGELOG 历史记录与 README_EN 当前移除说明。
- 嵌入清单确认 `shared/enhance.js` 以真实 `shared/` 路径入包。
- tag 推送待执行。

## 后续注意
- 用户明确偏好：不需要本地启动运行；发版走 tag，GitHub 自动构建。
- 更新日志、提交说明、交付说明优先使用中文。
- 下次修改功能默认值前，必须先检查 `.agent/rules/README.md` 与本文件，确认没有误放开非核心功能。

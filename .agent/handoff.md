# Antigravity Power Pro Project Handoff (v2.6.71)

## 当前状态 (Current Status)
- **版本**: v2.6.71
- **核心变更**:
  - 在 Cascade 侧边栏新增了左右间距控制（默认 8px / 3px），并已实现自动化配置生效。
  - **版本管理架构升级**：引入了 `scripts/sync-version.js`，通过修改 `patcher/package.json` 并运行 `npm run --prefix patcher sync-version` 即可全量同步 6 处版本号。
  - **连接测试闭环**：提示词增强连接测试已从前端 `fetch` 改为 Tauri 后端命令，避免安装器跨域假失败。
  - **功能收敛**：已彻底删除 Mermaid、Math、Table Fix 等非核心功能。

## 待办事项 (Next Steps)
1. **正式发版**：执行 `/tag` 工作流，打上 `v2.6.71` 的 Tag 并推送到远端触发构建。
2. **文档维护**：定期检查 `CHANGELOG.md` 确保记录了 v2.6.71 的连接测试与版本同步脚本修复。

## 技术规范提醒 (Critical Reminders)
- **版本同步**：禁止手动在各处改版本号，必须使用同步脚本。
- **DOM 策略**：严禁硬编码 Tailwind 语义类名，必须使用特征无关的 `findScrollEl` 策略。
- **配置合并**：补丁更新时必须遵循增量合并，严禁覆盖用户的 `apiKey`。
- **共享模块**：`shared/enhance.js` 为核心逻辑，修改将影响双面板。

## 历史遗留
- `handoff_2.6.69版本.md` 已被清理。
- 所有 2.6.69 的功能清理任务已完成闭环。

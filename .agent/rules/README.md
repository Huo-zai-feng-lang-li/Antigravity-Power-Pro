---
trigger: glob
---

- **配置零覆盖原则**: 补丁更新时，禁止覆盖用户已有的 `config.json`。必须采用增量合并逻辑，确保用户的 `apiKey` 和自定义 API 路径在升级后依然有效。
- **版本全量同步**: 每次发布新 Tag 前，必须确保 `package.json`, `tauri.conf.json`, `Cargo.toml`, `App.vue`, `README.md` 五处版本号完全一致。
- **发布审计**: 打 Tag 必须包含 `git push origin --tags -f` 操作。


> 目标: 让 AI 一眼理解本项目在做什么, 补丁如何落地, 关键入口在哪里.

## 项目定位

- Antigravity-Power-Pro 是 Antigravity AI IDE 和 Windsurf IDE 的增强补丁.
- Antigravity: 侧边栏 (cascade-panel) Mermaid/公式渲染, 一键复制, 表格修复, 字体调节, 提示词增强.
- Windsurf: Cascade 面板字体调节, 提示词增强, 滚动到底部按钮.
- 前端使用 Tab 切换布局 (Antigravity / Windsurf).
- 当前重点支持 Windows, macOS 仅手动安装流程 (见 `README.md` / `patcher/patches/manual-install.md`).

## 补丁落地流程 (核心链路)

1. 桌面安装器位于 `patcher/` (Tauri + Vue).
2. Rust 后端负责: 检测安装路径, 安装/卸载, 更新配置 (`patcher/src-tauri/src/commands/*.rs`).
3. 安装时会:
   - 备份 `resources/app/extensions/antigravity/cascade-panel.html` 为 `.bak`
   - 写入补丁文件与 `cascade-panel/` 目录
   - 生成 `cascade-panel/config.json` (功能开关)
4. 补丁文件来源于 `patcher/patches/`, 嵌入清单由 `patcher/src-tauri/build.rs` 自动生成 (排除列表 `patcher/patches/.embed-exclude.txt`), `patcher/src-tauri/src/embedded.rs` 通过 `include!` 引入清单.

## 关键目录 (修改点优先级)

- `patcher/patches/`: 注入到 Antigravity 的补丁源文件 (HTML/JS/CSS).
- `patcher/src-tauri/`: 安装器后端逻辑 (路径检测, 备份/写入, 配置).
- `patcher/src/`: 安装器前端 UI (功能开关, 安装/卸载按钮).
- `docs/`: 开发, 发布, 结构, 已知问题与截图 (见 `docs/README.md`).
- `tests/scripts/`: Playwright 脚本, 用于远程调试 Antigravity 的 Manager 窗口 DOM.
- `patcher/patches/manual-install.md`: 随补丁压缩包提供的手动安装说明 (Windows/macOS).
- `patcher/patches/workbench-jetski-agent.html` + `patcher/patches/manager-panel/`: Manager 窗口补丁入口与模块.

## IDE 内部 Hook 点

### Antigravity
- 侧边栏: `resources/app/extensions/antigravity/cascade-panel.html`
- Manager 窗口: `resources/app/out/vs/code/electron-browser/workbench/workbench-jetski-agent.html`
- 注意: 修改 `workbench-jetski-agent.html` 会触发 "扩展已损坏" 提示, 但不影响使用.

### Windsurf
- 主窗口: `resources/app/out/vs/code/electron-browser/workbench/workbench.html`
- 补丁目录: 同级 `windsurf-panel/` (JS/CSS/config.json/enhance.js)
- 修改 `workbench.html` 会触发 "安装似乎损坏" 提示, 通过清除 `product.json` checksums 解决.
- CSP 启用了 `require-trusted-types-for 'script'`, 补丁通过注册 `default` Trusted Types 策略解决.
- Cascade 面板 DOM: `#windsurf.cascadePanel`, 滚动区 `.cascade-scrollbar`, 输入框 `[contenteditable][role="textbox"]`.

## 运行逻辑速览 (侧边栏补丁)

- 入口: `patcher/patches/cascade-panel.html` -> `cascade-panel/cascade-panel.js`
- `cascade-panel.js` 读取 `config.json`, 按需加载模块并启动扫描.
- `scan.js` 基于 DOM 监听与内容稳定性判断触发渲染与复制按钮注入.

## 构建与发布 (安装器)

- 在 `patcher/` 下:
  - `npm run tauri:dev`
  - `npm run tauri:build`
- 发布前需同步版本号: `patcher/package.json`, `patcher/src-tauri/tauri.conf.json`, `patcher/src-tauri/Cargo.toml`, `patcher/src/App.vue`, `README.md` (详见 `docs/guides/release-guide.md`).

## 重要约束/风险

- 嵌入清单由 build.rs 自动生成, 新增/删除补丁文件时确认 `.embed-exclude.txt` 是否需要更新 (如 `config.json`, 文档).
- 安装逻辑使用白名单: 侧边栏仅 `cascade-panel.html` + `cascade-panel/`, Manager 仅 `workbench-jetski-agent.html` + `manager-panel/`, Windsurf 仅 `workbench-windsurf.html` -> `workbench.html` + `windsurf-panel/`.
- Antigravity 官方更新会覆盖补丁, 需要重新安装.
- 已知问题: 表格内含 `|` 的 LaTeX 公式渲染异常 (见 `docs/reference/known-issues.md`).

## 开发注意事项 (工具/环境)

- 文档统一使用英文标点符号 (中英文内容都使用英文标点), 避免中文标点导致工具处理异常.
- `apply_patch` 在中文内容较长时可能触发 `byte index ... is not a char boundary`, 导致补丁失败.
  - 解决: 使用提权 PowerShell `Set-Content -Encoding UTF8` 直接写入, 或先写 ASCII 再分段追加.
- 写入 `patcher/patches/` 或清理 `tests/` 在沙箱下可能 `Access denied`, 需要使用提权命令执行写入/删除.
- PowerShell `ConvertTo-Json | Set-Content` 会写入 UTF-8 BOM, 导致 serde_json 解析失败. Rust 代码已添加 `trim_start_matches('\u{feff}')` 处理.
- Windsurf 卸载时需恢复 `product.json.bak`, 否则仍会显示 "安装损坏".

## v2.6.2+ 设计规范 (视觉归一化)

- **设计语言**: 统一使用 "Obsidian Gold" (黑金玻璃拟态) 风格.
- **几何形状**: 功能按键 (如滚动到底部) 统一使用 **圆形 (Circular)**, 投影需包含金色发光效果 (`rgba(251, 191, 36, 0.4)`).
- **多入口同步**: 修改侧边栏 (`cascade-panel.css`) 时, 必须同步更新 Manager 窗口 (`manager-panel.css`) 的视觉表现.
- **Shadow DOM 穿透**: 注入 UI 到 IDE 暗层时, 必须使用 `querySelectorAllDeep` 逻辑, 否则在复杂的 Shadow DOM 容器 (如侧边栏输入框) 中会失效.
## v2.6.46+ 架构隔离红线 (关键防线)

- **环境主权隔离**: `manager-panel/scan.js` 禁止干预侧边栏元素。必须包含 `if (input.closest('.antigravity-agent-side-panel')) return;` 隔离逻辑，确保侧边栏定位由 `cascade-panel/scan.js` 唯一控制。
- **定位权下放**: `shared/enhance.js` 仅负责创建 UI 组件与 API 交互，**禁止**在共享模块内硬编码 `bottom/right/position` 等定位属性。所有位置参数必须在各自页面的 `scan.js` 中通过 `setProperty(..., 'important')` 动态注入。
- **虚拟 DOM 劫持准则 (v2.6.56+)**: 侧重于输入框的强制覆写时，严禁使用低级的 `input.innerText = value`。现代 IDE (React/Monaco) 存在死板的数据流单向绑定。若只改 DOM 会导致“状态脱轨回旋镖”（字面写进去了却被框架刷新吃掉）。必须使用 **原生用户交互伪装技术（`execCommand("insertText")` 组合假冒的 `ClipboardEvent("paste")` 物理级粘贴事件并手动 `dispatchEvent(new Event("input"))`）** 暴力击穿框架防线。
- **UI 状态闭环底线 (v2.6.56+)**: 任何调度长耗时异步任务（如 LLM 提示词增强）时，必须配备完整的 `showResultModal()` 或全套 Toast 反馈 UI。在遭遇到极高防御级别无法写入的黑盒 Dom 时，必须安全降级为“复制到剪贴板并提示”，绝对禁止发生静默失败（吞并用户点击）。
- **空间抢夺防护 (v2.6.55+)**: 向极度复杂的 Manager 等窗口挂载滚动监听、悬浮按钮时，切记不要使用贪婪的全局 `root` 查找。容易被同窗口内其他超长的独立侧边栏（如文件树、资源管理器）发生“焦点夺取”。必须进行精准判断、增加排异逻辑并叠加权重。
- **容器溢出保障**: 注入绝对定位按钮时，必须强制父容器 `overflow: visible !important`，防止按钮位移时被宿主容器意外截断。


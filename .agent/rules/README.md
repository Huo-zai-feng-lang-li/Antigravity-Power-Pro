---
trigger: glob
globs: 目标: 让 AI 一眼理解本项目在做什么, 补丁如何落地, 关键入口在哪里
---

- **配置零覆盖原则**: 补丁更新时，禁止覆盖用户已有的 `config.json`。必须采用增量合并逻辑，确保用户的 `apiKey` 和自定义 API 路径在升级后依然有效。在 Rust 侧后端或 Vue 侧保存时也要分情况合并。
- **版本全量同步**: 每次发布新 Tag 前，必须确保 6 处版本号完全一致：`patcher/package.json`、`patcher/src-tauri/tauri.conf.json`、`patcher/src-tauri/Cargo.toml`、`patcher/src/App.vue`、`README.md`、`README_EN.md`。
- **发布审计**: 打 Tag 必须包含 `git push origin --tags` 等全链路声明，遵照 `/tag` 工作流要求。

> 目标: 让 AI 一眼理解本项目在做什么, 补丁如何落地, 关键入口在哪里。

## 项目定位

- Antigravity-Power-Pro 是 AI 本地 IDE（如 Antigravity IDE Cascade 原型版本和 Windsurf IDE） 的全能挂载增强补丁。
- Antigravity：全面改造其 Cascade 面板和 Manager 面板（包含渲染增强、表格修复、回退样式、极客滚动控制以及高度定制的智能提示词 API 接口挂载等）。
- 当前只需要保留滚动底部和提示词增强俩个功能即可，其他功能默认全部关闭。
- Windsurf：改造其独立客户端（包括字体调节、增强悬浮模块、提示词等）。
- 前端安装器使用了 Vue 提供的 Tab 布局进行环境切换（隔离状态）。

## 补丁落地流程 (核心链路)

1. 桌面安装器位于 `patcher/` (Tauri + Vue)。
2. Rust 后端由 `patcher/src-tauri/src/commands/*.rs` 负责：检测各自 IDE 路径、拉取默认配置与本地磁盘比对（执行白名单功能开关控制）。
3. 安装具体流程：
   - IDE 核心入口 `XXXX.html` 被 `app/out/...` 等路径下的 HTML 入口引用，安装时会被备份为 `.bak`，再原封不动写入增强补丁 `<script type="module" src="..."></script>`。
   - 补丁目录结构按 IDE 面板强隔离：`cascade-panel/`、`manager-panel/`、`windsurf-panel/`，配置互相不干扰（写入各自领域的 `config.json`）。
4. 本地补丁源代码置于 `patcher/patches/`，Rust 于编译时使用 `build.rs` 自动索引并打包至嵌入单体（除开 `.embed-exclude.txt` 排列项）。

## 关键目录 (优先修改落点)

- `patcher/patches/`: 全部补丁原始文件（HTML / JS / CSS），是前端视觉与注入的灵魂心脏。
- `patcher/src-tauri/`: 安装引擎逻辑。所有路径嗅探和备份重构。
- `patcher/src/`: 安装工具 UI 层，配置功能开关、检查各依赖可用性与系统同步。
- `.agent/`: AI Agent 自定义准则、工作流程的约束核心与知识挂载。

## IDE 内部 Hook 锚标与漏洞机制

### Antigravity
- 侧翼环境: `resources/app/extensions/antigravity/cascade-panel.html`
- 会话中枢 (Manager): `resources/app/out/vs/code/electron-browser/workbench/workbench-jetski-agent.html`

### Windsurf
- 聚合门户: `resources/app/out/vs/code/electron-browser/workbench/workbench.html`
- 挂载须知: 替换修改该文件将不可避免地招致 “程序防篡改校验（安装似乎损坏）”，所以卸载功能被要求绝对退回 `.bak` 文件。并且 Windsurf 设置了严防死守的 `require-trusted-types-for`，已透过 `default` Trusted Types 全局下推来豁免。

## v2.6.2+ 设计规范 (视觉与环境控制)

- **设计语言**: 统一使用 "Obsidian Gold" (黑金拟物极客) 风格。功能悬浮按键统一为 **Circular 圆形**，配搭金耀色晕投影 (`rgba(251, 191, 36, 0.4)`)。
- **UI 同步化**: 当你在某一环境例如 `cascade-panel` 修改了外观，**必须联动核准并更新**在 `manager-panel` 和 `windsurf-panel` 中的同级类视图。
- **暗层穿透 (Shadow DOM)**: 对于 IDE 阴影 DOM 层深藏的结构（输入框文本），必须用特制的深穿透查询脚本（如 `querySelectorAllDeep`）去提取，切勿简单地相信标准的 `.querySelector`。

## v2.6.56+ 终极架构防护红线

- **虚拟 DOM 劫持准则**: 对框架富文本区施行暴力植入时，**严禁裸修 `innerText`**。此类操作将引发“状态脱轨回旋镖”（被 React 数据流吃掉）。必须利用 `execCommand("insertText")` 加码 `ClipboardEvent("paste")` 和底层事件唤醒来实现最高优先级的物理级事件注入。
- **UI 状态闭环底线**: LLM 增强与各种大工作量任务派发时，不能允许“点击没反应用户干等”。如果在防守严密的特定环境实在打不穿（比如极少数怪异布局），必须提供安全回退方案并 **触发明显的剪贴板复制提示 (showResultModal) **，拒绝静默失败。
- **空间焦点抢夺防护**: 向 Manager 类融合会话面板加插按钮或进行长列表追踪时（如滚动条吸底），禁绝贪婪匹配全体 root！这种行为会被窗口内同层文件列表等其他系统级长列表诱发劫夺，必须叠加专属 CSS 限定甚至施加超高 `10000` 权重，锁定专属领域挂载。
- **环境主权隔离**: `manager-panel/scan.js` 扫描时必须规避并隔离已属于侧边栏 `cascade-panel` 的特有类容（如 `.antigravity-agent-side-panel` 元素），实现跨模块井水不犯河水。位置定点权必须交放给各面板自己管理。绝对定位容器必须加上 `overflow: visible !important` 的超高权柄，防止界面跳变被断层裁剪。
- **遗留配置清洗**: App.vue 等设置界面的初始化里，若是探测到过去落后遗留的 API 地址或者淘汰默认值，应通过条件判定予以剔除和静默覆盖，不要给用户留下过时的包袱。
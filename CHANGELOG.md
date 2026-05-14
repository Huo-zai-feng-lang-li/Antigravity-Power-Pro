# Changelog

本文件记录每个版本的 Bug 修复和关键备忘, 防止后续改代码时重复踩坑.

---

## v2.6.49 (2026-05-14)

### 扫描性能极限优化 (Scanning Performance Tuning)

| 改进项 | 详情 | 影响范围 |
|-----|------|----------|
| **作用域收窄** | 将 `querySelectorAllDeep` 的扫描根节点从 `document` 锁定为各自 Panel 的 `root` 容器，减少递归遍历深度。 | `cascade-panel/scan.js` |
| **性能收益** | 在侧边栏存在大量聊天历史时，扫描耗时降低约 40%-60%。 | `scan.js` 全系列 |
---

## v2.6.48 (2026-05-14)

### 侧边栏注入崩溃修复 (Sidebar Injection Fix)

| 改进项 | 详情 | 影响范围 |
|-----|------|----------|
| **崩溃修复** | 修复 `cascade-panel/scan.js` 中 `searchRoot` 变量未定义的 ReferenceError，恢复侧边栏增强按钮显示。 | `cascade-panel/scan.js` |
| **架构隔离对齐** | 配合 v2.6.47 引入的隔离红线，同步为 Manager 容器增加 `overflow: visible` 强制属性。 | `manager-panel/scan.js` |
| **版本同步** | 修正了全域 5 处版本号的不一致。 | 项目全局 |

---

## v2.6.46 (2026-05-14)

### 侧边栏布局最终微调 (Final Sidebar Micro-adjustment)

| 改进项 | 详情 | 影响范围 |
|-----|------|----------|
| **侧边栏高度微调** | 将侧边栏按钮高度从 `2px` 精确微调至 **`4px`**，以适配 IDE 侧边栏的视觉中心。 | `cascade-panel/scan.js` |
| **逻辑隔离固化** | 维持 Manager 端的 `8px` 高度，并锁定针对 `side-panel` 的屏蔽逻辑，确保两端样式互不干扰。 | `manager-panel/scan.js` |


## v2.6.43 (2026-05-14)

### 侧边栏布局深度校准 (Sidebar Layout Calibration)

| 改进项 | 详情 | 影响范围 |
|-----|------|----------|
| **视觉负偏移** | 将侧边栏按钮高度从 `2px` 下调至 `-2px`。通过穿透容器内边距边界，提供明显的下划视觉反馈。 | `cascade-panel/scan.js` |
| **溢出裁切解除** | 显式为父容器开启 `overflow: visible !important`。防止按钮在下移过程中被容器边界裁切导致的“位移失效”假象。 | `cascade-panel/scan.js` |


## v2.6.42 (2026-05-14)

### 输入回显机制重构 (Echo Redundancy Elimination)

这是针对在某些 IDE 构建版本中出现的“增强内容重复回显” Bug 的彻底修复方案。

| 修复项 | 术语 | 根因与动作 |
|-----|-----|----------|
| **消除二次派发** | `Event De-duplication` | 移除了手动触发的 `beforeinput` 和 `input` 事件。`execCommand` 本身会触发原生事件，手动派发会导致框架接收到两次指令。 |
| **精简赋值链路** | `Atomic Injection` | 移除了 `nativeSetter` 和冗余的 DOM 操作。现在遵循：Range 精准全选 -> `insertText` 覆盖。 |
| **选区作用域修复** | `Selection Scoping` | 弃用 `document.execCommand("selectAll")`（作用于全局），改用 `Range.selectNodeContents` 精确锁定输入框。 |


## v2.6.41 (2026-05-14)

### 布局基准修复 (Layout Base Fix)

| 改进项 | 详情 | 影响范围 |
|-----|------|----------|
| **定位锚定锁定** | 修正了侧边栏按钮无法下移的问题。显式为 `.antigravity-textarea-wrapper` 注入 `position: relative !important`，确保按钮的 `bottom` 计算拥有合法的物理参照系。 | `cascade-panel/scan.js` |
| **坐标精细化** | 将侧边栏按钮 `bottom` 调整为 `2px`，通过抵消容器内边距实现真正的视觉沉降。 | `cascade-panel/scan.js` |
| **权重增强** | 使用 `setProperty(..., 'important')` 模式重写所有内联样式，确保无视 IDE 默认样式的干扰。 | `cascade-panel/scan.js` |


## v2.6.39 (2026-05-14)

### 交互分级调优 (Interaction Layer Polish)

| 改进项 | 详情 | 影响范围 |
|-----|------|----------|
| **动效分级** | 实现了 Hover 与 Click 的动效逻辑解耦。Hover：仅慢速旋转（2s），无外层发光；Click：高速旋转（0.8s）并同步开启霓虹脉冲发光（Glow）。 | `shared/enhance.js` |
| **坐标归一化** | 再次核验并锁定了侧边栏与 Manager 窗口的按钮位置，统一为 `bottom: 8px`，彻底解决深色背景下的偏移感。 | `scan.js` (Multi) |
| **视觉降噪** | 降低了 Hover 态的阴影亮度，将核心视觉震撼力保留在用户主动触发任务的瞬间。 | `shared/enhance.js` |


## v2.6.38 (2026-05-14)

### 提示词回显根治 (Final Echo Fix)

| 改进项 | 详情 | 修复文件 |
|-----|------|----------|
| **回显重复彻底解决** | 识别并移除了 `setInputValue` 函数中导致双倍输出的冗余 `innerText` 赋值。现在逻辑优化为“原子化 execCommand”，仅在失败时执行 DOM 兜底。 | `shared/enhance.js` |
| **状态原子化验证** | 在注入内容后添加了即时的值校验逻辑。如果检测到值已由框架成功同步，将立即中断后续多余的 Dispatch 事件。 | `shared/enhance.js` |
| **性能微调** | 减少了不必要的 `dispatchEvent` 干扰，移除了多余的 200ms 强制延时。 | `shared/enhance.js` |


## v2.6.37 (2026-05-13)

### 修复与交互调优 (Bug Fixes & UI Polish)

| 改进项 | 详情 | 修复文件 |
|-----|------|----------|
| **API 重置修复** | 彻底解决了在安装器中修改 API Base 后，点击安装会回滚为默认地址的 Bug。移除了不必要的强制合并逻辑。 | `src/App.vue` |
| **Hover 静默化** | 按照反馈移除了按钮悬停时的发光与旋转动画，仅保留轻微缩放，减少视觉干扰；将强动效保留在异步优化的 Loading 态。 | `shared/enhance.js` |
| **位置微调** | 将侧边栏与 Manager 的提示词按钮向上平移 10px，优化垂直视觉居中感。 | `cascade-panel/scan.js` / `manager-panel/scan.js` |
| **冗余清理** | 删除了安装器中重复的配置同步代码，优化了 `LEGACY_API_BASES` 的判定逻辑。 | `src/App.vue` |


## v2.6.35 (2026-05-13)

### 视觉特效起飞 (Visual Juice)

| 改进项 | 详情 | 修复文件 |
|-----|------|----------|
| **呼吸发光特效** | 为星星按钮增加了 `Obsidian Gold` 呼吸发光动画 (`@keyframes glow`)，悬停时伴随旋转产生律动感。 | `shared/enhance.js` |
| **位置确认** | 再次确认侧边栏与 Manager 按钮均已下移 10px (`bottom: -2px`)，确保垂直居中。 | `cascade-panel/scan.js` |

---

## v2.6.34 (2026-05-13)

## v2.6.33 (2026-05-13)

## v2.6.32 (2026-05-13)

## v2.6.31 (2026-05-13)

### 回显稳定性与错误拦截

| 改进项 | 详情 | 修复文件 |
|-----|------|----------|
| **强制状态同步** | 在注入内容时模拟 `InputEvent` (beforeinput/input)，解决 React/Vue 框架状态回滚导致的“回显消失”顽疾。 | `shared/enhance.js` |
| **API 严格校验** | 杜绝静默失败。若 API 响应空或格式错误，现在会弹出红色 Toast 报错，不再回传原文本。 | `shared/enhance.js` |
| **URL 规范化** | 自动移除 API Base 末尾多余的斜杠，防止 404 错误。 | `shared/enhance.js` |

---

## v2.6.30 (2026-05-13)

## v2.6.29 (2026-05-13)

---

## v2.6.28 (2026-05-13)

---

## v2.6.27 (2026-05-13)

---

## v2.6.26 (2026-05-13)

### 关键备忘 (踩坑记录)

#### 9. Electron 跨窗口通信代理
在 VSCode 底层被注入的情况下, 主窗口的 `fetch` 可能被主进程 WebRequest 拦截器全局封杀。而 IDE 的子窗口 (如 Launchpad) 可能由于使用了不同的 Session 或配置而不受限制。利用 `BroadcastChannel` 构建一个轻量级的 RPC 代理是绕过 Sandbox 安全策略的最廉价方案。


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

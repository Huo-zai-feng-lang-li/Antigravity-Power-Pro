<p align="center">
  <img src="docs/assets/images/LOGO.gif" alt="Antigravity-Power-Pro" width="320">
</p>

<h1 align="center">🚀 Antigravity-Power-Pro</h1>

<p align="center">
  <strong>让你的 AI IDE 体验更上一层楼 — 强大的 Antigravity & Windsurf 增强补丁</strong>
</p>

<p align="center">
  <a href="https://github.com/Huo-zai-feng-lang-li/Antigravity-Power-Pro/releases">
    <img src="https://img.shields.io/badge/version-v2.6.56-gold?style=flat-square" alt="版本">

  </a>
  <a href="https://codeium.com/antigravity">
    <img src="https://img.shields.io/badge/支持_Antigravity-v1.23.2-green.svg?style=flat-square" alt="Antigravity">

  </a>
  <a href="https://codeium.com/windsurf">
    <img src="https://img.shields.io/badge/支持_Windsurf-✓-00b4d8.svg?style=flat-square" alt="Windsurf">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/协议-MIT-orange.svg?style=flat-square" alt="开源协议">
  </a>
  <br>
  <a href="README_EN.md">
    <img src="https://img.shields.io/badge/Language-English-blue?style=for-the-badge&logo=google-translate&logoColor=white" alt="English">
  </a>
</p>

---

## 🌟 项目简介

**Antigravity-Power-Pro** 是一款专为 **Antigravity AI IDE** 和 **Windsurf IDE** 打造的深度增强工具。它通过巧妙的注入技术，补齐了官方在侧边栏和 Manager 窗口中的体验短板。

无论是复杂的 **Mermaid 渲染**、精确的 **数学公式显示**，还是极大提升效率的 **提示词增强 (Prompt Enhance)**，本项目都致力于为你提供最顺滑、最专业的 AI 辅助编程环境。

---

## ✨ 核心特性

| 功能模块                  | 描述说明                                                    |
| :------------------------ | :---------------------------------------------------------- |
| 🧠 **提示词增强**         | 对接自定义 LLM API，一键优化你的 Prompt (类似 Augment Code) |
| ⚓ **智能滚动**           | Cascade 面板浮动按钮，助你快速定位到最新对话                |
| 📏 **字体调节**           | 自由调节侧边栏字体大小，打造最舒适的阅读体验                |

### 🌊 Windsurf 专属支持

- ⚡ **内嵌增强按钮**：深度集成至 Windsurf 输入框，实现毫秒级响应。
- ⚓ **智能滚动**：消息区域浮动按钮，助你快速定位到最新对话。

---

## 📸 效果预览

> [!TIP]
> 更多高清效果截图请查看 [效果展示.md](docs/reference/screenshots.md)

![提示词增强效果](./docs/assets/images/8.gif)

---

## 📥 快速开始

### 💻 Windows 用户（推荐）

1. 📥 前往 [Releases](https://github.com/Huo-zai-feng-lang-li/Antigravity-Power-Pro/releases) 下载最新版 `Antigravity-Power-Pro.exe`。
2. 🚀 双击运行（程序具备自动路径识别功能）。
3. ✅ 勾选你想要的功能模块，点击 **「安装补丁」**。
4. 🔄 重启 IDE，立即享受增强体验。

> [!TIP]
> **进阶推荐**：配合 [Auto-Agent-AntiGravity](https://github.com/Huo-zai-feng-lang-li/Auto-Agent-AntiGravity) 项目，可实现自动点击「允许」并支持自动重试，让自动化流程更顺滑。

---

## 🧭 文档索引

- [🎨 效果展示](docs/reference/screenshots.md)
- [🐛 已知问题与修复方案](docs/reference/known-issues.md)
- [🛠️ 开发与贡献指南](docs/guides/developer-guide.md)
- [📦 发布流程说明](docs/guides/release-guide.md)

---

## 📋 版本历史

> [!NOTE]
> 查看官方更新动态：[Antigravity Changelog](https://antigravity.google/changelog)

| 补丁版本    | 支持 IDE 版本      | 发布日期   | 重大更新内容                                                                                         |
| :---------- | :----------------- | :--------- | :--------------------------------------------------------------------------------------------------- |
| **v2.6.56** | v1.23.2 / Windsurf | 2026-05-15 | **终极修复**: 采用 ClipboardEvent 与 execCommand 强制绕透 React 虚拟 DOM，解决回显状态不固化 Bug | ✅ 推荐 |
| **v2.6.55** | v1.23.2 / Windsurf | 2026-05-15 | **修复**: Manager 滚动按钮增加 +10000 优先级防御侧边栏高度争占。 | - |
| **v2.6.54** | v1.23.2 / Windsurf | 2026-05-15 | **修复**: Manager 面板精确定位挂载主界面的条件渲染控制。 | - |
| **v2.6.53** | v1.23.2 / Windsurf | 2026-05-15 | **微调**: 剥离对 `.monaco-workbench` 的贪婪后退匹配。 | - |
| **v2.6.52** | v1.23.2 / Windsurf | 2026-05-15 | **修复**: Manager 面板滚动按钮不显示（findRoot 误匹配侧边栏容器）| - |
| **v2.6.51** | v1.23.2 / Windsurf | 2026-05-15 | **修复**: Windsurf 面板输入框取值改用 `innerText`，回填结果准确反映成功/失败状态 | - |
| **v2.6.49** | v1.23.2 / Windsurf | 2026-05-14 | **性能**: 扫描作用域收窄至根容器，大幅降低大规模 DOM 树下的 CPU 负载。 | - |
| **v2.6.48** | v1.23.2 / Windsurf | 2026-05-14 | **修正**: 侧边栏注入崩溃修复，架构隔离红线落地，版本全量同步。 | - |
| **v2.6.42** | v1.23.2 / Windsurf | 2026-05-14 | **根治**: 提示词回显多倍重复 Bug (移除冗余事件驱动 & 精简注入链) |
| **v2.6.41** | v1.23.2 / Windsurf | 2026-05-14 | **修复**: 侧边栏按钮下移失效问题 (强制锚定父容器定位基准) |
| **v2.6.40** | v1.23.2 / Windsurf | 2026-05-14 | **微调**: 侧边栏按钮位置下移 4px (差异化高度对齐) |
| **v2.6.39** | v1.23.2 / Windsurf | 2026-05-14 | **优化**: 交互动效分级 (Hover 仅旋转, Click 发光), 按钮位置强制归一化 |
| **v2.6.38** | v1.23.2 / Windsurf | 2026-05-14 | **根治**: 提示词增强回显重复 Bug, 注入状态原子化验证 |
| **v2.6.37** | v1.23.2 / Windsurf | 2026-05-13 | **修复**: API 地址被重置 Bug, 按钮同步逻辑优化, **交互**: Hover 静默 & Loading 旋转 |
| **v2.6.35** | v1.23.2 / Windsurf | 2026-05-13 | **视觉特效**: 星星按钮呼吸发光特效, 按钮位置归一化微调 |
| **v2.6.25** | v1.23.2 / Windsurf | 2026-05-13 | **修复**: 提示词按钮输入检测(零宽字符+精确定位), 移除侧边栏重复滚动按钮 |
| **v2.6.24** | v1.23.2 / Windsurf | 2026-05-13 | **根治**: Manager/Cascade CSS ID 冲突导致滚动按钮偏右, systemPrompt 版本号迁移机制 |
| **v2.6.23** | v1.23.2 / Windsurf | 2026-05-13 | **修复**: 滚动按钮居中(!important 优先级), prompt 输入检测(innerText), 安装器旧版 systemPrompt 合并 |
| **v2.6.22** | v1.23.2 / Windsurf | 2026-05-13 | **核心修复**: 彻底修复 enhance.js 文件损坏问题, 恢复语法完整性, 优化 AI 输出格式为纯文本 |
| **v2.6.20** | v1.23.2 / Windsurf | 2026-05-13 | **全链路修复**: 安装前自动清除遗留配置, 上下文采集 CDP 实测精准选择器, 滚动按钮强制居中 |
| *早期版本*  | v1.15.8 / Windsurf | -          | 见 [GitHub Releases](https://github.com/Huo-zai-feng-lang-li/Antigravity-Power-Pro/releases)        |

---

## 🔧 手动定制 IDE 版本

如果想自定义 Antigravity 版本可在 PowerShell 中执行以下命令手动定制版本号：

```powershell
$p = "D:\Antigravity\resources\app\product.json"
$prod = Get-Content $p -Raw | ConvertFrom-Json
$prod.ideVersion = "1.23.2"
$prod.date = "2026-04-16T08:28:19.366Z"
$prod | ConvertTo-Json -Depth 100 | Set-Content $p -Encoding UTF8
Write-Output "✅ ideVersion & date 修改完成"
```

> [!NOTE]
> 将路径中的 `D:\Antigravity` 替换为实际安装路径。执行后无需重新安装补丁，重启 IDE 即可生效。

---

## 🤝 参与贡献

我们非常欢迎社区的反馈与支持！

- 提交 [Issue](https://github.com/Huo-zai-feng-lang-li/Antigravity-Power-Pro/issues) 报告 Bug 或提出新功能。
- 提交 [Pull Request](https://github.com/Huo-zai-feng-lang-li/Antigravity-Power-Pro/pulls) 贡献代码。

感谢贡献者: [@mikessslxxx](https://github.com/mikessslxxx)

---

<p align="center">
  💡 如果这个项目提升了你的开发效率, 欢迎点个 <b>Star ⭐</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
</p>

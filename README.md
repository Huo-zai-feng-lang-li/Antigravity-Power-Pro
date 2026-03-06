<p align="center">
  <img src="docs/assets/images/LOGO.gif" alt="Antigravity-Power-Pro" width="320">
</p>

<h1 align="center">Antigravity-Power-Pro IDE增强补丁</h1>

<p align="center">
  <a href="https://github.com/Huo-zai-feng-lang-li/Antigravity-Power-Pro/releases">
    <img src="https://img.shields.io/badge/版本-v2.5.1-blue.svg" alt="版本">
  </a>
  <a href="https://codeium.com/antigravity">
    <img src="https://img.shields.io/badge/支持_Antigravity-v1.14.2-green.svg" alt="Antigravity">
  </a>
  <a href="https://codeium.com/windsurf">
    <img src="https://img.shields.io/badge/支持_Windsurf-✓-00b4d8.svg" alt="Windsurf">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/协议-MIT-orange.svg" alt="开源协议">
  </a>
  <br>
  <a href="README_EN.md">
    <img src="https://img.shields.io/badge/Language-English-blue?style=for-the-badge&logo=google-translate&logoColor=white" alt="English">
  </a>
</p>

> 针对 **Antigravity AI IDE** 和 **Windsurf IDE** 的增强补丁, 提升侧边栏和 Manager 窗口的对话体验!

---

## 项目简介

Antigravity-Power-Pro 以补丁方式增强 Antigravity 和 Windsurf IDE 的对话体验. 提供 Mermaid 渲染, 数学公式渲染, 一键复制, 表格颜色修复, 字号调节, 提示词增强, 一键滚动到底部等能力. 我们希望通过社区协作持续完善体验, 欢迎提交 Issue 或 Pull Request.

---
![提示词增强效果](./docs/assets/images/8.gif)
## 功能特性

| 功能                 | 描述                                              |
| -------------------- | ------------------------------------------------- |
| **Mermaid 渲染**     | 自动渲染流程图, 时序图, 类图等, 支持深色主题      |
| **数学公式渲染**     | 支持 `$...$` 行内公式和 `$$...$$` 块级公式        |
| **一键复制**         | 侧边栏与 Manager 提供 Copy 按钮, 自动转 Markdown  |
| **表格颜色修复**     | 修复深色主题下表格文字不可见问题                  |
| **Manager 布局调节** | 支持对话宽度与字号调节                            |
| **悬浮复制按钮**     | 内容区域右上角悬浮按钮, 不影响阅读                |
| **提示词增强**       | 调用自定义 LLM API 优化提示词 (类似 Augment Code) |

### Windsurf IDE 支持

| 功能               | 描述                                              |
| ------------------ | ------------------------------------------------- |
| **提示词增强**     | 输入框内嵌增强按钮, 一键优化提示词                |
| **滚动到底部**     | 消息区浮动按钮, 未到底时自动显示, 点击即达底部    |

### 复制功能亮点

- 代码块自动带语言标识, 例如 ` ```python `
- 表格自动转换为 Markdown 表格格式
- 智能忽略 AI 中间思考过程, 仅复制最终结果
- 公式和 Mermaid 自动还原为源码

---

## 📸 效果展示

效果截图见 [screenshots.md](docs/reference/screenshots.md).

---

## 📥 下载安装

### Windows（推荐）

1. 前往 Releases 页面下载 `Antigravity-Power-Pro.exe`
2. 双击运行, 无需安装
3. 程序自动检测 Antigravity 安装路径
4. 选择需要的功能, 点击 安装补丁
5. 重启 Antigravity 或重新打开 Manager 窗口查看效果

### Windsurf IDE (Windows)

1. 前往 Releases 页面下载 `Antigravity-Power-Pro.exe`
2. 双击运行, 切换到 **Windsurf** 标签页
3. 程序自动检测 Windsurf 安装路径
4. 配置提示词增强等功能
5. 点击 安装补丁, 重启 Windsurf 查看效果

如需手动安装, 下载 Release 中的补丁压缩包 (例如 `Antigravity-Power-Pro-patches.zip`), 并参考 [manual-install.md](patcher/patches/manual-install.md).

### macOS & Linux

现支持使用 [Antigravity-Power-Pro.sh](patcher/patches/Antigravity-Power-Pro.sh) 脚本一键替换

> ⚠️ **注意**: 由于权限原因, 建议直接使用 macOS 自带的 **Terminal (终端)** 运行脚本

```bash
chmod +x ./Antigravity-Power-Pro.sh
sudo ./Antigravity-Power-Pro.sh
```

如需手动安装，请参考 [manual-install.md](patcher/patches/manual-install.md).

---

## 注意事项

- **更新覆盖**: Antigravity 官方更新后, 补丁可能被覆盖, 需要重新安装
- **版本兼容**: 使用前请确认 Antigravity 版本与支持版本一致
- **备份习惯**: 替换文件前请备份原文件, 便于回滚
- **已知问题**: 详见 [known-issues.md](docs/reference/known-issues.md)

---

## 文档导航

- 效果截图: [screenshots.md](docs/reference/screenshots.md)
- 已知问题: [known-issues.md](docs/reference/known-issues.md)
- 开发调试指南: [developer-guide.md](docs/guides/developer-guide.md)
- 发布指南: [release-guide.md](docs/guides/release-guide.md)
- 文档索引: [README.md](docs/README.md)

---

## 📋 版本信息
https://antigravity.google/changelog
Antigravity稳定版的使用v1.15.8 ，最新版支持使用v1.16.5 ，v1.18.3 版本不支持，ide全面更新了，暂时未适配，作者没时间

| 补丁版本 | 支持的 Antigravity 版本 | 发布日期   | 更新内容                                                           |
| -------- | ----------------------- | ---------- | ------------------------------------------------------------------ |
| v2.5.1   |  v1.15.8 / Windsurf      | 2026-02-11 | 提示词增强模块复用优化, 修复滚动按钮, 去除 Windsurf 字体调节     |
| v2.5.0   | v1.15.8 / Windsurf      | 2026-02-10 | 新增 Windsurf IDE 支持 (提示词增强, 滚动到底部)                   |
| v2.3.9   | v1.15.8                 | 2026-01-30 | 修复提示词增强功能在受控组件下的输入问题，实现前端自动读取版本号   |
| v2.3.7   | v1.15.8                 | 2026-01-29 | 新增提示词增强功能, 支持自定义 API/模型                            |
| v2.2.0   | v1.14.2                 | 2026-01-21 | Manager Mermaid/数学公式渲染, 对话宽度/字号调节, 感谢 @mikessslxxx |
| v2.1.0   | v1.14.2                 | 2026-01-19 | 侧边栏字体调节, Mermaid 报错提示优化, Manager 一键复制             |
| v2.0.1   | v1.14.2                 | 2026-01-14 | 性能优化                                                           |
| v2.0.0   | v1.14.2                 | 2026-01-14 | 新增 Tauri 工具, 支持功能单独开关                                  |
| v1.2.1   | v1.13.3                 | 2026-01-13 | Bug 修复                                                           |
| v1.2.0   | v1.13.3                 | 2026-01-13 | Mermaid 渲染                                                       |
| v1.1.0   | v1.13.3                 | 2026-01-13 | 数学公式渲染                                                       |
| v1.0.0   | v1.13.3                 | 2026-01-13 | 一键复制, 表格修复                                                 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request.

---

## 🙏 致谢

感谢以下贡献者对本项目的支持:

- [@mikessslxxx](https://github.com/mikessslxxx)

---

## ⚖️ 开源协议

MIT License

---

<p align="center">
  💡 如果这个项目对你有帮助, 欢迎 Star ⭐
</p>

---
description: 打 tag 发版前的检查清单和代码规范
---

# /tag 发版工作流

## 前置检查 (必须全部通过才能打 tag)

### 1. 版本号同步 (5 处)

以下文件的版本号必须一致, 缺一不可:

// turbo-all

```bash
grep -n '"version"' patcher/package.json
grep -n '"version"' patcher/src-tauri/tauri.conf.json
grep -n 'version = ' patcher/src-tauri/Cargo.toml
grep -n 'APP_VERSION' patcher/src/App.vue
grep -n 'version-v' README.md | head -1
```

### 2. CHANGELOG.md 更新

- 在 `CHANGELOG.md` 顶部添加新版本记录
- 必须包含: Bug 修复表格 + 踩坑备忘 (如有新发现)
- 格式参考已有条目

### 3. README.md 版本表更新

- 更新 badge 版本号
- 在版本历史表格顶部添加新行

### 4. 代码规范检查

- [ ] CSS: 不同模块的 DOM 元素必须使用**不同 ID**, 禁止跨模块共享 CSS ID
- [ ] CSS: 通过 JS toggle class 切换的属性, 初始态和目标态的 `!important` 级别必须一致
- [ ] JS: `contenteditable` 元素取值优先用 `innerText`, 禁止用 `.value`
- [ ] 系统提示词: 修改 `DEFAULT_SYSTEM_PROMPT` 时必须同时递增 `SYSTEM_PROMPT_VERSION`
- [ ] 系统提示词: `App.vue` 和 `enhance.js` 的 `DEFAULT_SYSTEM_PROMPT` 必须同步
- [ ] 嵌入排除: 新增/删除补丁文件时检查 `.embed-exclude.txt` 是否需要更新
- [ ] 圈复杂度 ≤ 9

### 5. 嵌入文件验证

确认 `build.rs` 自动生成的嵌入清单包含所有需要的补丁文件:

```bash
grep -r "include!" patcher/src-tauri/src/embedded.rs
cat patcher/patches/.embed-exclude.txt
```

### 6. 多入口同步检查

修改以下文件时, 必须检查对应模块是否需要同步:

| 修改文件 | 必须同步检查 |
|----------|-------------|
| `cascade-panel/cascade-panel.css` | `manager-panel/manager-panel.css` 视觉归一 |
| `cascade-panel/scan.js` | `manager-panel/scan.js` (如有) |
| `shared/enhance.js` DEFAULT_SYSTEM_PROMPT | `src/App.vue` DEFAULT_SYSTEM_PROMPT |
| `cascade-panel/scroll-to-bottom.js` | `manager-panel/scroll-to-bottom.js` |

## 执行步骤

### Step 1: 递增版本号

同时修改 5 个文件的版本号 (如 2.6.24 -> 2.6.25).

### Step 2: 更新文档

- CHANGELOG.md: 添加新版本记录
- README.md: 更新 badge + 版本历史表

### Step 3: 提交 + 打 tag + 推送

```bash
git add -A
git commit -m "chore: bump to vX.Y.Z

- <变更摘要>"
git tag vX.Y.Z
git push origin main --tags
```

### Step 4: 验证 CI

```bash
# 检查 GitHub Actions 是否触发
# 注意: force-push 已有 tag 不保证触发 CI, 必须用新 tag
```

## 禁止事项

- ❌ 禁止不改版本号就打 tag
- ❌ 禁止 force-push 已有 tag (删除重建可以, 但需同时删除远程 tag)
- ❌ 禁止跳过 CHANGELOG 更新
- ❌ 禁止修改补丁源文件后不重新构建 exe 就测试

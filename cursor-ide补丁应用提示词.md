# Cursor IDE 补丁应用开发提示词

> 参考项目: Antigravity-Power-Pro

---

## 项目目标

为 Cursor IDE 创建 [具体功能] 增强补丁，如：侧边栏字体调节、Mermaid 渲染、一键复制等。

---

## 技术栈

| 组件       | 技术                            | 说明                                        |
| ---------- | ------------------------------- | ------------------------------------------- |
| 目标 IDE   | Cursor (VSCode fork, Electron)  | 安装路径: `%LOCALAPPDATA%\Programs\cursor\` |
| 安装器后端 | **Rust + Tauri**                | 文件操作、路径检测、备份恢复                |
| 安装器前端 | **Vue 3 + TypeScript + Vite**   | UI 界面、功能配置                           |
| 补丁文件   | **HTML + CSS + JS (ES Module)** | 注入到 IDE 的增强代码                       |

---

## 核心原理

```
1. 定位 Hook 点 (IDE 中的 HTML 文件)
   ↓
2. 替换/追加 <link> 和 <script> 引用
   ↓
3. 补丁 JS 执行：DOM 操作 + 样式覆盖 + 事件拦截
```

---

## 项目结构

```
cursor-power-pro/
├── patcher/
│   ├── src/                 <- Vue 前端 (安装器 UI)
│   ├── src-tauri/           <- Rust 后端 (文件操作)
│   │   ├── src/commands/    <- 检测/安装/卸载命令
│   │   └── build.rs         <- 嵌入补丁文件清单
│   └── patches/             <- 补丁源文件
│       ├── panel.html       <- 入口 HTML
│       └── panel/           <- JS/CSS 模块
├── docs/
└── README.md
```

---

## 开发步骤

### 1. 调研阶段 - 精准找 DOM

> 参考项目: [Auto-Agent-AntiGravity](https://github.com/Huo-zai-feng-lang-li/Auto-Agent-AntiGravity)
> 核心文件: `main_scripts/cdp-handler.js` + `main_scripts/selector_finder.js`

#### 方法 A: CDP 远程调试 (推荐, 最精准)

**原理**: 通过 Chrome DevTools Protocol 连接 IDE 的 Electron 进程, 在主窗口执行 JS 探测 DOM.

**步骤 1 - 启动 IDE 并开启调试端口**

```bash
# 在 IDE 快捷方式的"目标"末尾追加参数:
--remote-debugging-port=9222

# 或命令行启动:
"C:\...\Windsurf.exe" --remote-debugging-port=9222
"C:\...\Cursor.exe" --remote-debugging-port=9222
```

> 注意: 必须先关闭所有 IDE 进程再重启, 否则端口不会生效.

**步骤 2 - 确认连接**

```bash
# 浏览器访问, 应返回 JSON 页面列表
http://127.0.0.1:9222/json
```

**步骤 3 - 通过 Node.js + ws 模块执行 DOM 探测**

```bash
# 安装 ws 模块 (全局)
npm install -g ws
```

```javascript
// cdp-probe.js - 通用 DOM 探测脚本
const WebSocket = require("ws");
const fs = require("fs");
const http = require("http");

// 1. 获取页面 WebSocket URL
http.get("http://127.0.0.1:9222/json", (res) => {
  let data = "";
  res.on("data", (c) => (data += c));
  res.on("end", () => {
    const pages = JSON.parse(data);
    const page = pages[0]; // 主窗口
    console.log("Target:", page.title, page.url);

    // 2. 连接 WebSocket
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    ws.on("open", () => {
      // 3. 执行 DOM 探测表达式
      const expr = `(function(){
        // 列出所有带 ID 的元素
        var ids = Array.from(document.querySelectorAll("[id]"))
          .map(e => e.id).filter(id => id.length > 3);
        return "IDs:\\n" + ids.join("\\n");
      })()`;

      ws.send(
        JSON.stringify({
          id: 1,
          method: "Runtime.evaluate",
          params: { expression: expr },
        }),
      );
    });
    ws.on("message", (d) => {
      const r = JSON.parse(d);
      if (r.id === 1) {
        const val = r.result?.result?.value || JSON.stringify(r);
        fs.writeFileSync("cdp_output.txt", val, "utf8");
        console.log("Result saved to cdp_output.txt");
        ws.close();
      }
    });
  });
});
```

```bash
# 运行 (注意设置 NODE_PATH 指向全局模块)
set NODE_PATH=C:\Users\Administrator\AppData\Local\nvm\v20.19.5\node_modules
node cdp-probe.js
```

**步骤 4 - 常用探测表达式**

```javascript
// 列出所有元素 ID
'Array.from(document.querySelectorAll("[id]")).map(e=>e.id).filter(id=>id.length>3).join("\\n")'

// 查找特定关键词的 CSS 类
'(function(){var s=new Set();document.querySelectorAll("*").forEach(e=>{if(typeof e.className==="string")e.className.split(" ").forEach(c=>{if(c.includes("chat")||c.includes("message")||c.includes("input")||c.includes("cascade"))s.add(c);});});return Array.from(s).sort().join("\\n");})()'

// 探测输入框
'(function(){var inputs=document.querySelectorAll("textarea,input,[contenteditable]");return Array.from(inputs).map(e=>e.tagName+" cls="+e.className.substring(0,80)+" placeholder="+(e.placeholder||"")).join("\\n");})()'

// 递归 dump DOM 树 (指定根节点 ID)
'(function(){var el=document.getElementById("TARGET_ID");function dump(e,d,m){if(d>m)return "";var i="  ".repeat(d);var t=e.tagName;var c=e.className&&typeof e.className==="string"?"."+e.className.split(" ").slice(0,3).join("."):"";var id=e.id?"#"+e.id:"";return i+t+id+c+"\\n"+Array.from(e.children).slice(0,8).map(c=>dump(c,d+1,m)).join("");}return dump(el,0,5);})()'
```

**步骤 5 - 注入 Selector Finder (交互式点击探测)**

参考 Auto-Agent-AntiGravity 的 `selector_finder.js`:

```javascript
// 通过 CDP 注入到主窗口, 点击任意元素即可在 Console 中看到精确选择器
const selectorFinderCode = fs.readFileSync("selector_finder.js", "utf8");
ws.send(
  JSON.stringify({
    id: 2,
    method: "Runtime.evaluate",
    params: { expression: selectorFinderCode, userGesture: true },
  }),
);
```

`selector_finder.js` 核心逻辑:
- `getElementInfo(el)`: 获取 tagName, id, className, ariaLabel, text, role
- `generateSelector(el)`: 生成 CSS 选择器 (优先 id, 其次 class + 属性)
- `getFullPath(el)`: 生成完整的祖先链路径
- `attachListeners(doc, name)`: 递归遍历所有 iframe, 在每个 document 上监听 click 事件
- 每 2 秒自动重新绑定, 确保动态加载的 iframe 也能被捕获

#### 方法 B: DevTools 手动检查 (快速但不精准)

```
- Ctrl+Shift+P -> "Developer: Toggle Developer Tools"
- Elements 面板检查 DOM
- Console 执行 JS 查询
- 注意: 某些 IDE 的面板在 iframe/webview 中, DevTools 默认只能看到外层
```

#### 各 IDE 架构差异速查

| IDE | Cascade/Chat 面板位置 | iframe 隔离 | Hook 文件 |
|---|---|---|---|
| Antigravity | `extensions/antigravity/cascade-panel.html` | 是 (webview iframe) | `cascade-panel.html` |
| Windsurf | 主窗口 DOM `#windsurf.cascadePanel` | **否** | `workbench.html` |
| Cursor | 待探测 | 待确认 | 待确认 |
| VS Code | 待探测 | 待确认 | 待确认 |

#### Windsurf DOM 结构实测结果

```
#windsurf.cascadePanel (class: chat-client-root vscode-dark)
  #chat (class: flex h-full flex-col items-center)
    .cascade-scrollbar (消息滚动区)
      div.pb-20 (消息列表)
    div[contenteditable][role="textbox"] (输入框, class: min-h-[2rem] outline-none)

CSS 框架: Tailwind CSS
CSS 变量: --codeium-*, --vscode-*
消息文本类: .text-ide-message-block-bot-color
总元素数: ~5756
```

### 2. 补丁开发

```
补丁入口 JS:
- 加载 config.json 配置
- 应用 CSS 变量覆盖样式
- 按需动态 import 功能模块
- 使用 MutationObserver 监听 DOM 变化
```

### 3. 安装器开发

```
Rust 后端:
- detect_path(): 检测 Cursor 安装路径
- install(): 备份 .bak + 复制补丁 + 写入配置
- uninstall(): 恢复 .bak 备份

Vue 前端:
- 显示检测路径
- 功能开关 (复选框/滑块)
- 安装/卸载按钮
```

### 4. 构建发布

```bash
cd patcher
npm install
npm run tauri:dev    # 开发调试
npm run tauri:build  # 打包 EXE
```

---

## 关键代码模板

### 补丁入口 JS

```javascript
const DEFAULT_CONFIG = { fontSize: 14, featureA: true };

const loadConfig = async () => {
  try {
    const res = await fetch("./panel/config.json", { cache: "no-store" });
    return { ...DEFAULT_CONFIG, ...(await res.json()) };
  } catch {
    return DEFAULT_CONFIG;
  }
};

(async () => {
  const config = await loadConfig();
  document.documentElement.style.setProperty(
    "--custom-font-size",
    `${config.fontSize}px`,
  );

  if (config.featureA) {
    const mod = await import("./featureA.js");
    mod.init(config);
  }
})();
```

### Rust 安装命令

```rust
#[tauri::command]
pub fn install_patch(path: String, config: Config) -> Result<(), String> {
    let target = PathBuf::from(&path).join("resources/app/.../panel.html");

    // 备份
    fs::copy(&target, target.with_extension("html.bak"))?;

    // 写入补丁
    fs::write(&target, EMBEDDED_PATCHES["panel.html"])?;
    fs::write(target.parent().unwrap().join("panel/config.json"),
              serde_json::to_string(&config)?)?;
    Ok(())
}
```

---

## 注意事项

1. **更新覆盖**: Cursor 更新会覆盖补丁，需重新安装
2. **签名警告**: 修改核心文件可能触发"扩展已损坏"提示
3. **编码问题**: 中文内容需 UTF-8 编码
4. **权限**: 安装目录可能需要管理员权限

---

## 输出清单

- [ ] 补丁文件 (HTML/CSS/JS)
- [ ] 配置文件 (config.json)
- [ ] 安装器源码 (Tauri + Vue)
- [ ] 打包后的 EXE
- [ ] README 使用说明
- [ ] 手动安装文档

## 验证

1. **安装验证**: 运行 EXE → 检测到路径 → 点击安装 → 提示成功
2. **效果验证**: 重启 Cursor → 打开侧边栏 → 确认功能生效
3. **卸载验证**: 点击卸载 → 重启 Cursor → 确认恢复原状
4. **手动检查**: 查看 `resources/app/.../panel.html.bak` 备份是否存在

import os
import shutil
import re
import json

# 配置路径
IDE_PATH = r"D:\Antigravity"
# 自动获取脚本所在目录，确保移动位置不报错
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
PROJECT_PATCHES = os.path.join(PROJECT_ROOT, "patcher", "patches")
APP_ROOT = os.path.join(IDE_PATH, "resources", "app")
WORKBENCH_DIR = os.path.join(APP_ROOT, "out", "vs", "code", "electron-browser", "workbench")

def inject_html(file_path, js_path, css_path=None):
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}, not found.")
        return

    # 备份
    if not os.path.exists(file_path + ".bak"):
        shutil.copy(file_path, file_path + ".bak")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. 注入 Trusted Types 绕过
    tt_marker = "[Antigravity-Power-Pro] Trusted Types Bypass"
    tt_bypass = f"""
    <script>
    /* {tt_marker} */
    if (window.trustedTypes && !window.trustedTypes.defaultPolicy) {{
        try {{
            window.trustedTypes.createPolicy("default", {{
                createHTML: (s) => s,
                createScript: (s) => s,
                createScriptURL: (s) => s,
            }});
        }} catch (e) {{}}
    }}
    </script>
    """
    if tt_marker not in content:
        content = content.replace("<head>", "<head>" + tt_bypass)

    # 2. 注入 CSS
    if css_path and css_path not in content:
        css_tag = f'<link rel="stylesheet" href="{css_path}">'
        content = content.replace("</head>", css_tag + "</head>")

    # 3. 注入 JS
    if js_path and js_path not in content:
        js_tag = f'<script src="{js_path}" type="module"></script>'
        content = content.replace("</body>", js_tag + "</body>")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Injected/Updated: {file_path}")

def main():
    print("Starting Surgical Injection...")

    # A. 复制资源目录
    target_cascade_dir = os.path.join(WORKBENCH_DIR, "cascade-panel")
    target_manager_dir = os.path.join(WORKBENCH_DIR, "manager-panel")
    target_shared_dir = os.path.join(WORKBENCH_DIR, "shared")

    if os.path.exists(target_cascade_dir): shutil.rmtree(target_cascade_dir)
    shutil.copytree(os.path.join(PROJECT_PATCHES, "cascade-panel"), target_cascade_dir)
    
    if os.path.exists(target_manager_dir): shutil.rmtree(target_manager_dir)
    shutil.copytree(os.path.join(PROJECT_PATCHES, "manager-panel"), target_manager_dir)

    if os.path.exists(target_shared_dir): shutil.rmtree(target_shared_dir)
    shutil.copytree(os.path.join(PROJECT_PATCHES, "shared"), target_shared_dir)

    # B. 对 HTML 进行注入 (1.107.0 模式)
    # 1. 主窗口注入侧边栏逻辑
    inject_html(
        os.path.join(WORKBENCH_DIR, "workbench.html"),
        "./cascade-panel/cascade-panel.js",
        "./cascade-panel/cascade-panel.css"
    )

    # 2. Manager 窗口注入增强逻辑
    inject_html(
        os.path.join(WORKBENCH_DIR, "workbench-jetski-agent.html"),
        "./manager-panel/manager-panel.js",
        "./manager-panel/manager-panel.css"
    )

    # 3. 官方 Extension 侧边栏 HTML 注入 (核心)
    target_cascade_html = os.path.join(APP_ROOT, "extensions/antigravity/cascade-panel.html")
    if os.path.exists(target_cascade_html):
        inject_html(
            target_cascade_html,
            "../../out/vs/code/electron-browser/workbench/cascade-panel/cascade-panel.js",
            "../../out/vs/code/electron-browser/workbench/cascade-panel/cascade-panel.css"
        )

    # C. 清除 Checksums
    prod_json = os.path.join(APP_ROOT, "product.json")
    if os.path.exists(prod_json):
        with open(prod_json, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
        if "checksums" in data:
            data["checksums"] = {}
            with open(prod_json, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent='\t')
            print("Checksums cleared.")

    # D. 创建配置文件
    config = {
        "mermaid": True,
        "math": True,
        "copyButton": False,
        "tableColor": False,
        "fontSizeEnabled": False,
        "fontSize": 14,
        "scrollToBottom": True,
        "promptEnhance": {
            "enabled": True,
            "provider": "openai",
            "apiBase": "http://127.0.0.1:8045/v1",
            "apiKey": "",
            "model": "gemini-3-flash",
            "systemPrompt": ""
        }
    }
    with open(os.path.join(target_cascade_dir, "config.json"), 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)
    
    with open(os.path.join(target_manager_dir, "config.json"), 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)

    # E. Windsurf 支持 (如果存在)
    target_windsurf_dir = os.path.join(WORKBENCH_DIR, "windsurf-panel")
    source_windsurf_dir = os.path.join(PROJECT_PATCHES, "windsurf-panel")
    if os.path.exists(source_windsurf_dir):
        if os.path.exists(target_windsurf_dir): shutil.rmtree(target_windsurf_dir)
        shutil.copytree(source_windsurf_dir, target_windsurf_dir)
        with open(os.path.join(target_windsurf_dir, "config.json"), 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2)
        print("Windsurf resources injected.")

    print("Injection Completed. Please restart your IDE.")

if __name__ == "__main__":
    main()

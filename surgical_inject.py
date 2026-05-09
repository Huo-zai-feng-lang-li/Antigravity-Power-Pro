import os
import shutil
import re
import json

# 配置路径
IDE_PATH = r"D:\Antigravity"
PROJECT_PATCHES = r"c:\Users\Administrator\Desktop\超级文件\AI-IDE\AI\Antigravity-Power-Pro\patcher\patches"
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

    # 1. 注入 Trusted Types 绕过 (必须在任何脚本之前)
    tt_bypass = """
    <script>
    if (window.trustedTypes && !window.trustedTypes.defaultPolicy) {
        try {
            window.trustedTypes.createPolicy("default", {
                createHTML: (s) => s,
                createScript: (s) => s,
                createScriptURL: (s) => s,
            });
            console.log("[Antigravity-Power-Pro] Trusted Types Bypass Active");
        } catch (e) {}
    }
    </script>
    """
    if "Antigravity-Power-Pro" not in content:
        content = content.replace("<head>", "<head>" + tt_bypass)

        # 2. 注入 CSS
        if css_path:
            css_tag = f'<link rel="stylesheet" href="{css_path}">'
            content = content.replace("</head>", css_tag + "</head>")

        # 3. 注入 JS
        js_tag = f'<script src="{js_path}" type="module"></script>'
        content = content.replace("</html>", js_tag + "</html>")

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully injected: {file_path}")
    else:
        print(f"Already injected: {file_path}")

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
        "./manager-panel/manager-panel.js"
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
    with open(os.path.join(target_cascade_dir, "config.json"), 'w') as f:
        json.dump({"enabled": True, "mermaid": True, "math": True, "copyButton": True}, f)

    print("Injection Completed. Please restart Antigravity.")

if __name__ == "__main__":
    main()

import json
import os

# Paths
IDE_PATH = r"D:\Antigravity"
APP_ROOT = os.path.join(IDE_PATH, "resources", "app")
WORKBENCH_DIR = os.path.join(APP_ROOT, "out", "vs", "code", "electron-browser", "workbench")
CONFIG_PATH = os.path.join(WORKBENCH_DIR, "cascade-panel", "config.json")
MANAGER_CONFIG_PATH = os.path.join(WORKBENCH_DIR, "manager-panel", "config.json")
PROD_JSON_PATH = os.path.join(APP_ROOT, "product.json")

def update_config():
    config = {
        "mermaid": False,
        "math": False,
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
        },
        "placeholder": "Ask Antigravity..."
    }

    # Manager Config (Similar structure but include specific fields if needed)
    manager_config = {
        "mermaid": False,
        "math": False,
        "copyButton": True,
        "maxWidthEnabled": False,
        "maxWidthRatio": 75,
        "fontSizeEnabled": False,
        "fontSize": 14,
        "promptEnhance": config["promptEnhance"]
    }

    with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)
    print(f"Updated {CONFIG_PATH}")

    if os.path.exists(os.path.dirname(MANAGER_CONFIG_PATH)):
        with open(MANAGER_CONFIG_PATH, 'w', encoding='utf-8') as f:
            json.dump(manager_config, f, indent=2)
        print(f"Updated {MANAGER_CONFIG_PATH}")

def clear_checksums():
    if not os.path.exists(PROD_JSON_PATH):
        print("product.json not found")
        return
    
    # Try multiple encodings
    content = None
    for enc in ['utf-8-sig', 'utf-8', 'utf-16']:
        try:
            with open(PROD_JSON_PATH, 'r', encoding=enc) as f:
                content = f.read()
            data = json.loads(content)
            print(f"Successfully read product.json with {enc}")
            break
        except Exception:
            continue
            
    if data and "checksums" in data:
        data["checksums"] = {}
        with open(PROD_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent='\t')
        print("Checksums cleared successfully.")
    else:
        print("Checksums not found or already cleared.")

if __name__ == "__main__":
    update_config()
    clear_checksums()

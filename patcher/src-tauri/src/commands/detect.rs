// 路径检测模块
// Windows: 注册表查询 + 常见路径扫描
// macOS: 标准路径探测, 未命中时返回 None

use std::path::PathBuf;

// 平台特定实现直接内联, 避免子模块路径问题

/// 检测 Antigravity 安装路径
/// 返回找到的第一个有效路径, 或 None
#[tauri::command]
pub fn detect_antigravity_path() -> Option<String> {
    #[cfg(target_os = "windows")]
    {
        detect_windows()
    }

    #[cfg(target_os = "macos")]
    {
        detect_macos()
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        None
    }
}

/// 验证路径是否为有效的 Antigravity 安装目录
fn is_valid_antigravity_path(path: &PathBuf) -> bool {
    // 通过核心 hook 文件判断目录有效性
    let cascade_panel_path = path
        .join("resources")
        .join("app")
        .join("extensions")
        .join("antigravity")
        .join("cascade-panel.html");
    
    cascade_panel_path.exists()
}

// Windows 实现
#[cfg(target_os = "windows")]
fn detect_windows() -> Option<String> {
    // 方式 1: 尝试从注册表读取
    if let Some(path) = try_registry() {
        return Some(path);
    }

    // 方式 2: 扫描常见路径
    if let Some(path) = try_common_paths_windows() {
        return Some(path);
    }

    None
}

#[cfg(target_os = "windows")]
fn try_registry() -> Option<String> {
    use winreg::enums::*;
    use winreg::RegKey;

    // 尝试 HKEY_LOCAL_MACHINE
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    
    // Antigravity 可能的注册表路径
    let paths = [
        r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Antigravity",
        r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Antigravity",
    ];

    for reg_path in paths {
        if let Ok(key) = hklm.open_subkey(reg_path) {
            if let Ok(install_location) = key.get_value::<String, _>("InstallLocation") {
                let path = PathBuf::from(&install_location);
                if is_valid_antigravity_path(&path) {
                    return Some(install_location);
                }
            }
        }
    }

    // 尝试 HKEY_CURRENT_USER
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    for reg_path in paths {
        if let Ok(key) = hkcu.open_subkey(reg_path) {
            if let Ok(install_location) = key.get_value::<String, _>("InstallLocation") {
                let path = PathBuf::from(&install_location);
                if is_valid_antigravity_path(&path) {
                    return Some(install_location);
                }
            }
        }
    }

    None
}

#[cfg(target_os = "windows")]
fn try_common_paths_windows() -> Option<String> {
    let literal_paths = [
        r"C:\Program Files\Antigravity",
        r"D:\Program Files\Antigravity", 
        r"E:\Program Files\Antigravity",
    ];

    for path_str in literal_paths {
        let path = PathBuf::from(path_str);
        if is_valid_antigravity_path(&path) {
            return Some(path_str.to_string());
        }
    }

    // 检查用户本地目录
    if let Some(local_data) = dirs::data_local_dir() {
        let user_path = local_data.join("Programs").join("Antigravity");
        if is_valid_antigravity_path(&user_path) {
            return user_path.to_str().map(String::from);
        }
    }

    None
}

// macOS 实现
#[cfg(target_os = "macos")]
fn detect_macos() -> Option<String> {
    let standard_paths = [
        "/Applications/Antigravity.app",
    ];

    for path_str in standard_paths {
        let path = PathBuf::from(path_str);
        if is_valid_antigravity_path(&path) {
            return Some(path_str.to_string());
        }
    }

    // 检查用户 Applications 目录
    if let Some(home) = dirs::home_dir() {
        let user_app = home.join("Applications").join("Antigravity.app");
        if is_valid_antigravity_path(&user_app) {
            return user_app.to_str().map(String::from);
        }
    }

    None
}

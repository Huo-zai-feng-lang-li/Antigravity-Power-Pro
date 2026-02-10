// Antigravity-Power-Pro Patcher Rust 后端.
// 负责路径检测, 补丁安装/卸载, 配置读写.

mod commands;
mod embedded;

use commands::{
    detect_antigravity_path, install_patch, uninstall_patch, update_config,
    check_patch_status, read_patch_config, read_manager_patch_config,
    get_config, save_config,
    detect_windsurf_path, install_windsurf_patch, uninstall_windsurf_patch,
    update_windsurf_config, check_windsurf_patch_status, read_windsurf_patch_config,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            detect_antigravity_path,
            install_patch,
            uninstall_patch,
            update_config,
            check_patch_status,
            read_patch_config,
            read_manager_patch_config,
            get_config,
            save_config,
            detect_windsurf_path,
            install_windsurf_patch,
            uninstall_windsurf_patch,
            update_windsurf_config,
            check_windsurf_patch_status,
            read_windsurf_patch_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

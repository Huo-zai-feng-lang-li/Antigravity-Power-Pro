// 命令模块入口

mod detect;
mod patch;
mod config;

pub use detect::{detect_antigravity_path, detect_windsurf_path};
pub use patch::{
    install_patch, uninstall_patch, update_config, check_patch_status,
    read_patch_config, read_manager_patch_config,
    install_windsurf_patch, uninstall_windsurf_patch, update_windsurf_config,
    check_windsurf_patch_status, read_windsurf_patch_config,
};
pub use config::{get_config, save_config};

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, 'patcher', 'package.json');

if (!fs.existsSync(pkgPath)) {
  console.error('[Error] patcher/package.json not found!');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkg.version;

console.log(`\x1b[36m[Sync] Source Version (patcher/package.json): ${version}\x1b[0m`);

// 1. patcher/src-tauri/tauri.conf.json
const tauriConfPath = path.join(rootDir, 'patcher', 'src-tauri', 'tauri.conf.json');
if (fs.existsSync(tauriConfPath)) {
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
  if (tauriConf.version !== version) {
    tauriConf.version = version;
    fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
    console.log(`[✓] patcher/src-tauri/tauri.conf.json -> ${version}`);
  }
}

// 2. patcher/src-tauri/Cargo.toml
const cargoPath = path.join(rootDir, 'patcher', 'src-tauri', 'Cargo.toml');
if (fs.existsSync(cargoPath)) {
  let cargo = fs.readFileSync(cargoPath, 'utf8');
  const newCargo = cargo.replace(/^version = ".*"/m, `version = "${version}"`);
  if (cargo !== newCargo) {
    fs.writeFileSync(cargoPath, newCargo);
    console.log(`[✓] patcher/src-tauri/Cargo.toml -> ${version}`);
  }
}

// 3. patcher/src/App.vue
const appVuePath = path.join(rootDir, 'patcher', 'src', 'App.vue');
if (fs.existsSync(appVuePath)) {
  let appVue = fs.readFileSync(appVuePath, 'utf8');
  const newAppVue = appVue.replace(/const APP_VERSION = ref\(".*"\);/, `const APP_VERSION = ref("${version}");`);
  if (appVue !== newAppVue) {
    fs.writeFileSync(appVuePath, newAppVue);
    console.log(`[✓] patcher/src/App.vue -> ${version}`);
  }
}

// 4. README Files (Badges)
const readmes = ['README.md', 'README_EN.md'];
readmes.forEach(file => {
  const readmePath = path.join(rootDir, file);
  if (fs.existsSync(readmePath)) {
    let readme = fs.readFileSync(readmePath, 'utf8');
    let updated = readme;
    // Badge: version-vX.X.X-gold
    updated = updated.replace(/version-v\d+\.\d+\.\d+-gold/g, `version-v${version}-gold`);
    // Badge EN: Version-v\d+\.\d+\.\d+-gold\.svg
    updated = updated.replace(/Version-v\d+\.\d+\.\d+-gold\.svg/g, `Version-v${version}-gold.svg`);

    if (readme !== updated) {
      fs.writeFileSync(readmePath, updated);
      console.log(`[✓] ${file} (Badges) -> ${version}`);
    }
  }
});

console.log('\x1b[32m[Finished] All version locations are synchronized.\x1b[0m');

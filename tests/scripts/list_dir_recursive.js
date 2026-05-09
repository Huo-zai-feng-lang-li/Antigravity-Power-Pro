const fs = require('fs');
const path = require('path');

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (let file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            console.log(`[DIR] ${fullPath}`);
            walk(fullPath);
        } else {
            console.log(`[FILE] ${fullPath}`);
        }
    }
}

try {
    walk('C:\\Users\\Administrator\\AppData\\Local\\Programs\\Antigravity\\resources\\app\\extensions\\antigravity');
} catch (e) {
    console.error(e);
}

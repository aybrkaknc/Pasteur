const fs = require('fs');
const path = require('path');

const projectDir = path.resolve(__dirname, '..');
const distDir = path.join(projectDir, 'dist');
const platforms = ['chrome', 'firefox'];
const filesToCopy = ['manifest.json', 'content.js'];
const dirsToCopy = ['icons', '_locales'];

/**
 * Belirtilen klasörü tamamen siler ve yeniden oluşturur.
 * @param {string} dir - Temizlenecek klasör yolu
 */
function cleanDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(dir, { recursive: true });
}

/**
 * Kaynak dosyayı veya klasörü hedef yola rekürsif olarak kopyalar.
 * @param {string} src - Kaynak yol
 * @param {string} dest - Hedef yol
 */
function copyRecursive(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

const isCleanOnly = process.argv.includes('--clean-only');

console.log('--- copy2select Build Script (v0.0.114) ---');

// 1. Clean dist
console.log('[1/3] Cleaning dist directory...');
cleanDir(distDir);

if (isCleanOnly) {
    console.log('Clean complete. Exiting (--clean-only mode).');
    process.exit(0);
}

/**
 * Platform bazlı manifest düzenlemesi yapar.
 * Chrome: browser_specific_settings (Gecko ID) alanını kaldırır.
 * Firefox: Manifest olduğu gibi korunur.
 * @param {string} manifestPath - Düzenlenecek manifest.json dosya yolu
 * @param {string} platform - Hedef platform (chrome/firefox)
 */
function adjustManifestForPlatform(manifestPath, platform) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    if (platform === 'chrome') {
        delete manifest.browser_specific_settings;
        console.log(`  [!] Chrome: browser_specific_settings kaldırıldı.`);
    }

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

// 2. Build for each platform
platforms.forEach(platform => {
    const platformDist = path.join(distDir, platform);
    console.log(`[2/3] Building for ${platform}...`);
    fs.mkdirSync(platformDist, { recursive: true });

    filesToCopy.forEach(file => {
        fs.copyFileSync(path.join(projectDir, file), path.join(platformDist, file));
    });

    dirsToCopy.forEach(dir => {
        copyRecursive(path.join(projectDir, dir), path.join(platformDist, dir));
    });

    // Platform bazlı manifest farklılaştırması
    adjustManifestForPlatform(path.join(platformDist, 'manifest.json'), platform);
});

console.log('[3/3] Build complete! Folders created in /dist');
console.log('DONE.');

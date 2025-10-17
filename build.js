/**
 * Build Script for Portfolio Optimization
 * Minifies CSS and JavaScript files
 * 
 * Usage: node build.js
 * 
 * Note: This is a simple build script. For production, consider using
 * tools like Webpack, Vite, or Parcel for more advanced optimization.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const config = {
  cssFiles: [
    'css/themes.css',
    'css/animations.css',
    'css/style.css',
    'css/responsive-fixes.css',
    'css/performance-optimizations.css'
  ],
  jsFiles: [
    'js/config.js',
    'js/polyfills.js',
    'js/i18n.js',
    'js/animation-controller.js',
    'js/lazy-loader.js',
    'js/performance-monitor.js',
    'js/analytics.js',
    'js/project-data.js',
    'js/project-modal.js',
    'js/form-handler.js',
    'js/app.js'
  ],
  outputDir: 'dist'
};

// Simple CSS minifier
function minifyCSS(css) {
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove whitespace
    .replace(/\s+/g, ' ')
    // Remove spaces around special characters
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    // Remove trailing semicolons
    .replace(/;}/g, '}')
    // Remove unnecessary quotes
    .replace(/url\((['"]?)([^'")]+)\1\)/g, 'url($2)')
    .trim();
}

// Simple JS minifier (basic - for production use a proper minifier like Terser)
function minifyJS(js) {
  return js
    // Remove single-line comments (but preserve URLs)
    .replace(/(?:^|\s)\/\/.*$/gm, '')
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove whitespace around operators and punctuation
    .replace(/\s*([{}();,:])\s*/g, '$1')
    .trim();
}

// Generate hash for build version
function generateHash(content) {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

// Ensure output directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Process CSS files
function processCSS() {
  console.log('\n📦 Processing CSS files...');
  const cssDir = path.join(config.outputDir, 'css');
  ensureDir(cssDir);

  const processedFiles = [];

  config.cssFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const minified = minifyCSS(content);
      const originalSize = Buffer.byteLength(content, 'utf8');
      const minifiedSize = Buffer.byteLength(minified, 'utf8');
      const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(2);

      const outputFile = file;
      const outputPath = path.join(config.outputDir, outputFile);
      ensureDir(path.dirname(outputPath));
      fs.writeFileSync(outputPath, minified);

      console.log(`✓ ${file}`);
      console.log(`  Original: ${(originalSize / 1024).toFixed(2)} KB`);
      console.log(`  Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
      console.log(`  Savings: ${savings}%`);

      processedFiles.push({
        original: file,
        output: outputFile
      });
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error.message);
    }
  });

  return processedFiles;
}

// Process JS files
function processJS() {
  console.log('\n📦 Processing JavaScript files...');
  const jsDir = path.join(config.outputDir, 'js');
  ensureDir(jsDir);

  const processedFiles = [];

  config.jsFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const minified = minifyJS(content);
      const originalSize = Buffer.byteLength(content, 'utf8');
      const minifiedSize = Buffer.byteLength(minified, 'utf8');
      const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(2);

      const outputFile = file;
      const outputPath = path.join(config.outputDir, outputFile);
      ensureDir(path.dirname(outputPath));
      fs.writeFileSync(outputPath, minified);

      console.log(`✓ ${file}`);
      console.log(`  Original: ${(originalSize / 1024).toFixed(2)} KB`);
      console.log(`  Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
      console.log(`  Savings: ${savings}%`);

      processedFiles.push({
        original: file,
        output: outputFile
      });
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error.message);
    }
  });

  return processedFiles;
}

// Copy other assets
function copyAssets() {
  console.log('\n📦 Copying other assets...');

  // Copy images
  const imgDir = path.join(config.outputDir, 'img');
  ensureDir(imgDir);

  if (fs.existsSync('img')) {
    const images = fs.readdirSync('img');
    images.forEach(img => {
      fs.copyFileSync(path.join('img', img), path.join(imgDir, img));
    });
    console.log(`✓ Copied ${images.length} images`);
  }

  // Copy locales
  const localesDir = path.join(config.outputDir, 'locales');
  ensureDir(localesDir);

  if (fs.existsSync('locales')) {
    const locales = fs.readdirSync('locales');
    locales.forEach(locale => {
      fs.copyFileSync(path.join('locales', locale), path.join(localesDir, locale));
    });
    console.log(`✓ Copied ${locales.length} locale files`);
  }

  // Copy other files
  const otherFiles = ['index.html', 'manifest.json', 'robots.txt', 'sitemap.xml', '.htaccess'];
  otherFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(config.outputDir, file));
      console.log(`✓ Copied ${file}`);
    }
  });
}

// Generate build manifest
function generateManifest(cssFiles, jsFiles) {
  const manifest = {
    buildTime: new Date().toISOString(),
    version: generateHash(Date.now().toString()),
    files: {
      css: cssFiles,
      js: jsFiles
    }
  };

  fs.writeFileSync(
    path.join(config.outputDir, 'build-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log('\n✓ Generated build manifest');
}

// Main build function
function build() {
  console.log('🚀 Starting build process...\n');
  console.log('Configuration:');
  console.log(`  Output directory: ${config.outputDir}`);

  // Clean output directory
  if (fs.existsSync(config.outputDir)) {
    fs.rmSync(config.outputDir, { recursive: true });
  }
  ensureDir(config.outputDir);

  // Process files
  const cssFiles = processCSS();
  const jsFiles = processJS();
  copyAssets();
  generateManifest(cssFiles, jsFiles);

  console.log('\n✅ Build completed successfully!');
  console.log(`\nOutput directory: ${path.resolve(config.outputDir)}`);
  console.log('\n💡 Note: For production builds, consider using professional tools like:');
  console.log('   - Terser for JavaScript minification');
  console.log('   - cssnano for CSS optimization');
  console.log('   - imagemin for image compression');
  console.log('   - Webpack, Vite, or Parcel for complete build pipelines');
}

// Run build
try {
  build();
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}

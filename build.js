const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
  outputDir: 'dist',
  copyDirs: ['img', 'locales'],
  rootFiles: ['robots.txt', 'sitemap.xml', '.htaccess']
};

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/url\((['"]?)([^'")]+)\1\)/g, 'url($2)')
    .trim();
}

function minifyJS(js) {
  return js
    .replace(/(?:^|\s)\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}();,:])\s*/g, '$1')
    .trim();
}

function generateHash(content) {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanOutputDir() {
  if (fs.existsSync(config.outputDir)) {
    fs.rmSync(config.outputDir, { recursive: true, force: true });
  }
  ensureDir(config.outputDir);
}

function createHashedFile(relativeFilePath, content) {
  const dir = path.dirname(relativeFilePath);
  const ext = path.extname(relativeFilePath);
  const base = path.basename(relativeFilePath, ext);
  const hash = generateHash(content);
  const hashedRelativePath = path.posix.join(dir.replace(/\\/g, '/'), `${base}.${hash}${ext}`);
  const outputPath = path.join(config.outputDir, hashedRelativePath);

  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, content);

  return hashedRelativePath;
}

function processAssets(files, minifier, label) {
  console.log(`\nProcessing ${label} files...`);

  const manifestEntries = [];
  const assetMap = {};

  files.forEach((file) => {
    try {
      const source = fs.readFileSync(file, 'utf8');
      const optimized = minifier(source);
      const outputFile = createHashedFile(file, optimized);
      const originalSize = Buffer.byteLength(source, 'utf8');
      const optimizedSize = Buffer.byteLength(optimized, 'utf8');
      const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(2);

      manifestEntries.push({
        original: file,
        output: outputFile,
        originalSize,
        optimizedSize,
        savings: `${savings}%`
      });

      assetMap[file] = outputFile;

      console.log(`OK ${file} -> ${outputFile}`);
    } catch (error) {
      console.error(`ERROR processing ${file}:`, error.message);
      process.exitCode = 1;
    }
  });

  return { manifestEntries, assetMap };
}

function replaceMetaValue(html, pattern, replacement) {
  return html.replace(pattern, replacement);
}

function processIndexHtml(assetMap) {
  const siteUrl = (process.env.SITE_URL || 'https://careca.is-a.dev').replace(/\/$/, '');
  const ga4MeasurementId = (process.env.GA4_MEASUREMENT_ID || '').trim();
  const socialImageUrl = (process.env.SOCIAL_IMAGE_URL || `${siteUrl}/img/profile.svg`).trim();

  let html = fs.readFileSync('index.html', 'utf8');

  html = replaceMetaValue(html, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${siteUrl}/">`);
  html = replaceMetaValue(html, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${siteUrl}/">`);
  html = replaceMetaValue(html, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${socialImageUrl}">`);
  html = replaceMetaValue(html, /<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${socialImageUrl}">`);
  html = replaceMetaValue(html, /<meta name="ga4-measurement-id" content="[^"]*">/, `<meta name="ga4-measurement-id" content="${ga4MeasurementId}">`);

  Object.entries(assetMap).forEach(([originalPath, hashedPath]) => {
    html = html.replaceAll(originalPath, hashedPath);
  });

  fs.writeFileSync(path.join(config.outputDir, 'index.html'), html);

  return {
    siteUrl,
    ga4MeasurementIdConfigured: Boolean(ga4MeasurementId),
    socialImageUrl
  };
}

function copyDirectoryRecursive(sourceDir, destinationDir) {
  ensureDir(destinationDir);

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  entries.forEach((entry) => {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryRecursive(sourcePath, destinationPath);
      return;
    }

    fs.copyFileSync(sourcePath, destinationPath);
  });
}

function copyStaticAssets() {
  config.copyDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) return;
    copyDirectoryRecursive(dir, path.join(config.outputDir, dir));
    console.log(`Copied ${dir}/`);
  });

  config.rootFiles.forEach((file) => {
    if (!fs.existsSync(file)) return;

    const destination = path.join(config.outputDir, file);
    ensureDir(path.dirname(destination));

    if (file === 'robots.txt') {
      const siteUrl = (process.env.SITE_URL || 'https://careca.is-a.dev').replace(/\/$/, '');
      const robots = fs.readFileSync(file, 'utf8')
        .replace(/Sitemap:\s*https?:\/\/[^\s]+/i, `Sitemap:${siteUrl}/sitemap.xml`);
      fs.writeFileSync(destination, robots);
      return;
    }

    if (file === 'sitemap.xml') {
      const siteUrl = (process.env.SITE_URL || 'https://careca.is-a.dev').replace(/\/$/, '');
      const sitemap = fs.readFileSync(file, 'utf8')
        .replace(/<loc>https?:\/\/[^<]+<\/loc>/i, `<loc>${siteUrl}/</loc>`);
      fs.writeFileSync(destination, sitemap);
      return;
    }

    fs.copyFileSync(file, destination);
  });
}

function generateManifest(cssEntries, jsEntries, metadata) {
  const manifest = {
    buildTime: new Date().toISOString(),
    version: generateHash(Date.now().toString()),
    metadata,
    files: {
      css: cssEntries,
      js: jsEntries
    }
  };

  fs.writeFileSync(
    path.join(config.outputDir, 'build-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
}

function build() {
  console.log('Starting build process...');

  cleanOutputDir();

  const { manifestEntries: cssEntries, assetMap: cssMap } = processAssets(config.cssFiles, minifyCSS, 'CSS');
  const { manifestEntries: jsEntries, assetMap: jsMap } = processAssets(config.jsFiles, minifyJS, 'JavaScript');
  const assetMap = { ...cssMap, ...jsMap };

  copyStaticAssets();
  const metadata = processIndexHtml(assetMap);
  generateManifest(cssEntries, jsEntries, metadata);

  if (process.exitCode && process.exitCode !== 0) {
    throw new Error('Build completed with errors');
  }

  console.log('Build completed successfully');
  console.log(`Output directory: ${path.resolve(config.outputDir)}`);
}

try {
  build();
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

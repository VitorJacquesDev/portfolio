const fs = require('fs');

const htmlPath = process.argv.includes('--dist') ? 'dist/index.html' : 'index.html';

if (!fs.existsSync(htmlPath)) {
  console.error(`Missing file: ${htmlPath}`);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

const requiredTokens = [
  '<title>',
  'id="home"',
  'id="about"',
  'id="skills"',
  'id="projects"',
  'id="contact"',
  'id="contactForm"'
];

const missingTokens = requiredTokens.filter((token) => !html.includes(token));
if (missingTokens.length > 0) {
  console.error('Smoke test failed. Missing tokens:', missingTokens);
  process.exit(1);
}

const linkedAssets = [
  ...html.matchAll(/<link[^>]+href="([^"]+)"/g),
  ...html.matchAll(/<script[^>]+src="([^"]+)"/g)
]
  .map((match) => match[1])
  .filter((value) => /^(css|js)\//.test(value));

const baseDir = htmlPath.startsWith('dist/') ? 'dist' : '.';
const missingAssets = linkedAssets.filter((asset) => !fs.existsSync(`${baseDir}/${asset}`));

if (missingAssets.length > 0) {
  console.error('Smoke test failed. Missing assets:', missingAssets);
  process.exit(1);
}

console.log(`OK Smoke test passed (${htmlPath})`);

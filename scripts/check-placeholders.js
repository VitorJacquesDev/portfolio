const fs = require('fs');

const targets = [
  { file: 'index.html', pattern: 'seudominio.com' },
  { file: 'js/config.js', pattern: 'G-XXXXXXXXXX' }
];

let hasError = false;

for (const target of targets) {
  const content = fs.readFileSync(target.file, 'utf8');
  if (content.includes(target.pattern)) {
    hasError = true;
    console.error(`Placeholder found: "${target.pattern}" in ${target.file}`);
  }
}

if (hasError) process.exit(1);
console.log('✓ No blocked production placeholders found');

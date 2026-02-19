const fs = require('fs');

function flatten(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return { ...acc, ...flatten(value, fullKey) };
    }

    acc[fullKey] = value;
    return acc;
  }, {});
}

const localeFiles = ['locales/pt-BR.json', 'locales/en-US.json', 'locales/es-ES.json'];
const localeData = localeFiles.map((file) => ({
  file,
  keys: new Set(Object.keys(flatten(JSON.parse(fs.readFileSync(file, 'utf8')))))
}));

const html = fs.readFileSync('index.html', 'utf8');
const usedKeys = new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map((match) => match[1]));

let hasError = false;

localeData.forEach(({ file, keys }) => {
  const missing = [];

  usedKeys.forEach((key) => {
    if (!keys.has(key)) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    hasError = true;
    console.error(`Missing translation keys in ${file}:`, missing.slice(0, 20));
  }
});

if (hasError) {
  process.exit(1);
}

console.log(`OK i18n key usage validation passed (${usedKeys.size} keys used)`);

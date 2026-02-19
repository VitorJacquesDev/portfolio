const fs = require('fs');

const files = ['locales/pt-BR.json', 'locales/en-US.json', 'locales/es-ES.json'];

const flatten = (obj, prefix = '') => Object.entries(obj).reduce((acc, [key, value]) => {
  const fullKey = prefix ? `${prefix}.${key}` : key;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...acc, ...flatten(value, fullKey) };
  }
  acc[fullKey] = value;
  return acc;
}, {});

const datasets = files.map((file) => ({ file, flat: flatten(JSON.parse(fs.readFileSync(file, 'utf8'))) }));
const baseline = Object.keys(datasets[0].flat);
let hasError = false;

for (let i = 1; i < datasets.length; i += 1) {
  const currentKeys = Object.keys(datasets[i].flat);
  const missing = baseline.filter((key) => !currentKeys.includes(key));
  const extra = currentKeys.filter((key) => !baseline.includes(key));

  if (missing.length || extra.length) {
    hasError = true;
    console.error(`Locale mismatch in ${datasets[i].file}`);
    if (missing.length) console.error(' Missing:', missing.slice(0, 10));
    if (extra.length) console.error(' Extra:', extra.slice(0, 10));
  }
}

if (hasError) {
  process.exit(1);
}

console.log('✓ Locale keys are in parity across all languages');

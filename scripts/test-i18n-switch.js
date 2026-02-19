const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const langButtons = [...html.matchAll(/class="lang-btn[^"]*"\s+data-lang="([^"]+)"/g)].map((m) => m[1]);

const expectedLanguages = ['pt-BR', 'en-US', 'es-ES'];
const missingButtons = expectedLanguages.filter((lang) => !langButtons.includes(lang));

if (missingButtons.length > 0) {
  console.error('i18n switch test failed. Missing language buttons:', missingButtons);
  process.exit(1);
}

const missingLocales = expectedLanguages.filter((lang) => !fs.existsSync(`locales/${lang}.json`));

if (missingLocales.length > 0) {
  console.error('i18n switch test failed. Missing locale files:', missingLocales);
  process.exit(1);
}

console.log('OK i18n switch sanity test passed');

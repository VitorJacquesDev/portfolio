const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

const idMatches = [...html.matchAll(/\sid="([^"]+)"/g)];
const ids = new Set(idMatches.map((match) => match[1]));

const hrefMatches = [...html.matchAll(/href="#([^"]+)"/g)];
const missingTargets = [];

hrefMatches.forEach((match) => {
  const target = match[1];
  if (!ids.has(target)) {
    missingTargets.push(target);
  }
});

if (missingTargets.length > 0) {
  console.error('Missing internal anchor targets:', [...new Set(missingTargets)]);
  process.exit(1);
}

console.log(`OK Internal links valid (${hrefMatches.length} anchors checked)`);

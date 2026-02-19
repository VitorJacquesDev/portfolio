const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist']);

function collectJsonFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        collectJsonFiles(fullPath, files);
      }
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = collectJsonFiles(process.cwd());
let hasError = false;

files.forEach((file) => {
  try {
    JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    hasError = true;
    console.error(`Invalid JSON: ${path.relative(process.cwd(), file)} -> ${error.message}`);
  }
});

if (hasError) {
  process.exit(1);
}

console.log(`OK JSON validation passed (${files.length} files)`);

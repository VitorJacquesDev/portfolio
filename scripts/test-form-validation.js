const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

if (!html.includes('id="contactForm"')) {
  console.error('Form validation test failed: #contactForm not found');
  process.exit(1);
}

function findTagById(id, tag) {
  const regex = new RegExp(`<${tag}[^>]*id="${id}"[^>]*>`, 'i');
  const match = html.match(regex);
  return match ? match[0] : '';
}

const nameTag = findTagById('name', 'input');
const emailTag = findTagById('email', 'input');
const subjectTag = findTagById('subject', 'input');
const messageTag = findTagById('message', 'textarea');

const checks = [
  { id: 'name', ok: /required/i.test(nameTag) },
  { id: 'email', ok: /required/i.test(emailTag) && /type="email"/i.test(emailTag) },
  { id: 'subject', ok: /required/i.test(subjectTag) },
  { id: 'message', ok: /required/i.test(messageTag) }
];

const missing = checks.filter((item) => !item.ok).map((item) => item.id);

if (missing.length > 0) {
  console.error('Form validation test failed for fields:', missing);
  process.exit(1);
}

console.log('OK Form validation sanity test passed');

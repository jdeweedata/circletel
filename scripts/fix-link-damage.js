#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function getAllFiles(dir, extensions = ['.tsx', '.ts']) {
  const results = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.name === 'node_modules' || item.name === '.next' || item.name === '.git' || item.name === '.worktrees') continue;
      if (item.isDirectory()) {
        results.push(...getAllFiles(fullPath, extensions));
      } else if (extensions.some(ext => item.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  } catch (e) {}
  return results;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix damaged Link components - <PiLinkBold back to <Link
  if (content.includes('<PiLinkBold') && content.includes('</Link>')) {
    content = content.replace(/<PiLinkBold(\s)/g, '<Link$1');
    content = content.replace(/<PiLinkBold>/g, '<Link>');

    // Remove PiLinkBold from imports if no longer used
    if (!content.includes('<PiLinkBold') && !content.includes('icon: PiLinkBold') && !content.includes('icon={PiLinkBold}')) {
      content = content.replace(/,?\s*PiLinkBold\s*,?/g, (match) => {
        if (match.startsWith(',') && match.endsWith(',')) return ',';
        return '';
      });
      // Clean up empty or single-item imports
      content = content.replace(/import\s*\{\s*,\s*\}\s*from\s*['"]react-icons\/pi['"];\n?/g, '');
      content = content.replace(/import\s*\{\s*\}\s*from\s*['"]react-icons\/pi['"];\n?/g, '');
    }
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed: ' + filePath);
    return true;
  }
  return false;
}

console.log('Fixing damaged Link components...\n');
const files = getAllFiles(process.cwd());
let fixedCount = 0;
for (const file of files) {
  if (fixFile(file)) fixedCount++;
}
console.log('\nFixed ' + fixedCount + ' files');

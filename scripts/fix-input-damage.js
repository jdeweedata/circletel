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

  // Fix damaged Input components - if PiTextboxBold has props like label, value, onChange
  // it's actually an Input component
  if (content.includes('<PiTextboxBold') && (content.includes('onChange') || content.includes('value='))) {
    content = content.replace(/<PiTextboxBold(\s)/g, '<Input$1');
    content = content.replace(/<PiTextboxBold>/g, '<Input>');
    content = content.replace(/<\/PiTextboxBold>/g, '</Input>');

    // Remove PiTextboxBold from imports
    content = content.replace(/,?\s*PiTextboxBold\s*,?/g, (match) => {
      if (match.startsWith(',') && match.endsWith(',')) return ',';
      return '';
    });
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed: ' + filePath);
    return true;
  }
  return false;
}

console.log('Fixing damaged Input components...\n');
const files = getAllFiles(process.cwd());
let fixedCount = 0;
for (const file of files) {
  if (fixFile(file)) fixedCount++;
}
console.log('\nFixed ' + fixedCount + ' files');

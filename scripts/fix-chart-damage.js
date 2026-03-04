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

  // Fix damaged BarChart components from recharts
  if (content.includes('<PiChartBarBold') && content.includes('</BarChart>')) {
    content = content.replace(/<PiChartBarBold(\s)/g, '<BarChart$1');
    content = content.replace(/<PiChartBarBold>/g, '<BarChart>');

    // Remove PiChartBarBold from imports if not used elsewhere
    if (!content.match(/<PiChartBarBold[^>]*\/>/)) {
      content = content.replace(/,?\s*PiChartBarBold\s*,?/g, (match) => {
        if (match.startsWith(',') && match.endsWith(',')) return ',';
        return '';
      });
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

console.log('Fixing damaged BarChart components...\n');
const files = getAllFiles(process.cwd());
let fixedCount = 0;
for (const file of files) {
  if (fixFile(file)) fixedCount++;
}
console.log('\nFixed ' + fixedCount + ' files');

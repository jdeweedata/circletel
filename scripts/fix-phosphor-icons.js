#!/usr/bin/env node
/**
 * Fix incorrect Phosphor icon names
 */

const fs = require('fs');
const path = require('path');

// Corrections for incorrect icon names
const CORRECTIONS = {
  'PiWifiBold': 'PiWifiHighBold',
  'PiServerBold': 'PiDesktopTowerBold',
  'PiSparklesBold': 'PiSparkleBold',
  'PiActivityBold': 'PiPulseBold',
  'PiFileQuestionBold': 'PiFileXBold',
};

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

  for (const [wrong, correct] of Object.entries(CORRECTIONS)) {
    if (content.includes(wrong)) {
      content = content.replace(new RegExp(wrong, 'g'), correct);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  return false;
}

console.log('Fixing incorrect Phosphor icon names...\n');
const files = getAllFiles(process.cwd());
let fixedCount = 0;
for (const file of files) {
  if (fixFile(file)) fixedCount++;
}
console.log(`\nFixed ${fixedCount} files`);

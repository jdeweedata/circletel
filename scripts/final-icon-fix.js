#!/usr/bin/env node
/**
 * Final comprehensive icon fix
 */

const fs = require('fs');
const path = require('path');

// Map of Lucide icon names to Phosphor equivalents
const LUCIDE_TO_PHOSPHOR = {
  'FileText': 'PiFileTextBold',
  'Wifi': 'PiWifiHighBold',
  'Clock': 'PiClockBold',
  'CheckCircle': 'PiCheckCircleBold',
  'Zap': 'PiLightningBold',
  'Package': 'PiPackageBold',
  'MapPin': 'PiMapPinBold',
  'Shield': 'PiShieldBold',
  'Signal': 'PiCellSignalFullBold',
  'User': 'PiUserBold',
  'Users': 'PiUsersBold',
  'Building2': 'PiBuildingsBold',
  'CreditCard': 'PiCreditCardBold',
  'Target': 'PiTargetBold',
  'Key': 'PiKeyBold',
  'Check': 'PiCheckBold',
  'ClipboardCheck': 'PiClipboardTextBold',
  'FileSignature': 'PiSignatureBold',
  'Wrench': 'PiWrenchBold',
  'Pencil': 'PiPencilBold',
  'ArrowUpRight': 'PiArrowUpRightBold',
  'Briefcase': 'PiBriefcaseBold',
  'AlertCircle': 'PiWarningCircleBold',
  'Info': 'PiInfoBold',
  'Star': 'PiStarBold',
  'Lock': 'PiLockBold',
  'Smartphone': 'PiDeviceMobileBold',
};

// Phosphor icons that are used but might not be imported
const PHOSPHOR_ICONS = [
  'PiCheckBold', 'PiCreditCardBold', 'PiInfoBold', 'PiShieldCheckBold',
  'PiStarBold', 'PiLockBold', 'PiDeviceMobileBold', 'PiClockBold',
  'PiWifiHighBold', 'PiFileTextBold', 'PiCheckCircleBold', 'PiLightningBold',
  'PiPackageBold', 'PiMapPinBold', 'PiShieldBold', 'PiCellSignalFullBold',
  'PiUserBold', 'PiUsersBold', 'PiBuildingsBold', 'PiTargetBold',
  'PiKeyBold', 'PiClipboardTextBold', 'PiSignatureBold', 'PiWrenchBold',
  'PiPencilBold', 'PiArrowUpRightBold', 'PiBriefcaseBold', 'PiWarningCircleBold',
];

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
  const neededImports = new Set();

  // Replace Lucide icon references with Phosphor
  for (const [lucide, phosphor] of Object.entries(LUCIDE_TO_PHOSPHOR)) {
    // Match icon={IconName} JSX prop pattern
    const jsxIconPropPattern = new RegExp(`(icon=\\{)${lucide}(\\})`, 'g');
    if (jsxIconPropPattern.test(content)) {
      content = content.replace(new RegExp(`(icon=\\{)${lucide}(\\})`, 'g'), `$1${phosphor}$2`);
      neededImports.add(phosphor);
      modified = true;
    }

    // Match icon: IconName patterns (object properties)
    const iconObjPattern = new RegExp(`(icon:\\s*)${lucide}([\\s,}])`, 'g');
    if (iconObjPattern.test(content)) {
      content = content.replace(new RegExp(`(icon:\\s*)${lucide}([\\s,}])`, 'g'), `$1${phosphor}$2`);
      neededImports.add(phosphor);
      modified = true;
    }

    // Match JSX usage like <FileText className=... /> (self-closing)
    const jsxSelfClosingPattern = new RegExp(`<${lucide}(\\s[^>]*)?/>`, 'g');
    if (jsxSelfClosingPattern.test(content)) {
      content = content.replace(new RegExp(`<${lucide}(\\s[^>]*)?/>`, 'g'), `<${phosphor}$1/>`);
      neededImports.add(phosphor);
      modified = true;
    }
  }

  // Find Phosphor icons used but not imported
  for (const icon of PHOSPHOR_ICONS) {
    const usagePattern = new RegExp(`[<{:\\s]${icon}[\\s/>},)]`);
    if (usagePattern.test(content)) {
      // Check if it's in imports
      const importPattern = new RegExp(`import\\s*\\{[^}]*${icon}[^}]*\\}\\s*from\\s*['"]react-icons/pi['"]`);
      if (!importPattern.test(content)) {
        neededImports.add(icon);
      }
    }
  }

  // Add missing imports
  if (neededImports.size > 0) {
    const existingMatch = content.match(/import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]react-icons\/pi['"]/);

    if (existingMatch) {
      const existingIcons = existingMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      const allIcons = new Set([...existingIcons, ...neededImports]);
      const newImport = `import { ${Array.from(allIcons).sort().join(', ')} } from 'react-icons/pi'`;
      content = content.replace(/import\s*\{[^}]+\}\s*from\s*['"]react-icons\/pi['"]/, newImport);
      modified = true;
    } else if (neededImports.size > 0) {
      // Add new import
      const importLine = `import { ${Array.from(neededImports).sort().join(', ')} } from 'react-icons/pi';\n`;
      if (content.includes("'use client'")) {
        content = content.replace(/(['"]use client['"];?\n)/, `$1${importLine}`);
      } else {
        const firstImport = content.match(/^import\s/m);
        if (firstImport) {
          content = content.replace(/^(import\s)/, `${importLine}$1`);
        }
      }
      modified = true;
    }
  }

  // Remove LucideIcon type references, replace with IconType
  if (content.includes('LucideIcon') && content.includes('react-icons')) {
    content = content.replace(/LucideIcon/g, 'IconType');
    // Ensure IconType is imported
    if (!content.includes("import { IconType }") && !content.includes("import type { IconType }")) {
      content = content.replace(/(import\s*\{[^}]*\}\s*from\s*['"]react-icons\/pi['"])/,
        `import { IconType } from 'react-icons';\n$1`);
    }
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  return false;
}

console.log('Running final icon fix...\n');
const files = getAllFiles(process.cwd());
let fixedCount = 0;
for (const file of files) {
  if (fixFile(file)) fixedCount++;
}
console.log(`\nFixed ${fixedCount} files`);

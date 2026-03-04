#!/usr/bin/env node
/**
 * Fix missing Phosphor icon imports
 * Scans for undefined icon usages and adds proper imports
 */

const fs = require('fs');
const path = require('path');

// All remaining unmapped Lucide icons with Phosphor equivalents
const REMAINING_MAPPINGS = {
  // Media
  'Video': 'PiVideoCameraBold',
  'Play': 'PiPlayBold',
  'Camera': 'PiCameraBold',
  'ImageIcon': 'PiImageBold',

  // Actions
  'Pencil': 'PiPencilBold',
  'Printer': 'PiPrinterBold',
  'QrCode': 'PiQrCodeBold',
  'Receipt': 'PiReceiptBold',

  // Business
  'Briefcase': 'PiBriefcaseBold',
  'Target': 'PiTargetBold',
  'Presentation': 'PiPresentationChartBold',
  'FileSignature': 'PiSignatureBold',
  'FileCheck': 'PiFileCheckBold',
  'FileSpreadsheet': 'PiFileXlsBold',
  'Newspaper': 'PiNewspaperBold',

  // Navigation
  'Home': 'PiHouseBold',
  'ArrowUpRight': 'PiArrowUpRightBold',
  'ArrowDownRight': 'PiArrowDownRightBold',
  'ChevronsLeft': 'PiCaretDoubleLeftBold',
  'ChevronsRight': 'PiCaretDoubleRightBold',

  // Users
  'UserX': 'PiUserMinusBold',
  'UserCircle': 'PiUserCircleBold',

  // Status
  'CheckCircle': 'PiCheckCircleBold',
  'ClipboardCheck': 'PiClipboardTextBold',
  'DoorOpen': 'PiDoorBold',

  // Communication
  'MailX': 'PiEnvelopeSimpleBold',
  'MessageSquare': 'PiChatBold',
  'PhoneCall': 'PiPhoneCallBold',

  // Objects
  'Key': 'PiKeyBold',
  'Shield': 'PiShieldBold',
  'FileText': 'PiFileTextBold',
  'Clock': 'PiClockBold',
  'MapPin': 'PiMapPinBold',
  'User': 'PiUserBold',
  'Users': 'PiUsersBold',
  'Building2': 'PiBuildingsBold',
  'CreditCard': 'PiCreditCardBold',
  'Wrench': 'PiWrenchBold',
  'Wifi': 'PiWifiHighBold',
  'Check': 'PiCheckBold',
  'Grid3X3': 'PiGridNineBold',
  'Terminal': 'PiTerminalBold',
  'Store': 'PiStorefrontBold',
  'Lightbulb': 'PiLightbulbBold',
  'Layout': 'PiLayoutBold',
  'UploadCloud': 'PiCloudArrowUpBold',
  'Workflow': 'PiFlowArrowBold',
  'ToggleLeft': 'PiToggleLeftBold',
  'ToggleRight': 'PiToggleRightBold',
  'Crown': 'PiCrownBold',
  'Keyboard': 'PiKeyboardBold',
  'Images': 'PiImagesBold',
  'CloudOff': 'PiCloudSlashBold',
  'CalendarCheck': 'PiCalendarCheckBold',
  'CalendarPlus': 'PiCalendarPlusBold',
  'Folder': 'PiFolderBold',
  'FolderPlus': 'PiFolderPlusBold',
  'Link': 'PiLinkBold',
  'LinkIcon': 'PiLinkBold',
  'MousePointer': 'PiCursorBold',
  'MousePointerClick': 'PiCursorClickBold',
  'PanelTop': 'PiSidebarSimpleBold',
  'Space': 'PiSelectionBold',
  'SimCard': 'PiSimCardBold',
  'Type': 'PiTextAaBold',
  'Undo2': 'PiArrowCounterClockwiseBold',
  'Redo2': 'PiArrowClockwiseBold',
  'ShoppingBag': 'PiShoppingBagBold',
  'Edit3': 'PiPencilSimpleBold',
  'Antenna': 'PiBroadcastBold',
  'ArrowDownCircle': 'PiArrowCircleDownBold',
  'BarChart': 'PiChartBarBold',
  'BarChart2': 'PiChartBarBold',
  'FileEdit': 'PiNotePencilBold',
  'FileSearch': 'PiFileMagnifyingGlassBold',
  'FormInput': 'PiTextboxBold',
  'MapPinned': 'PiMapPinBold',
  'PauseCircle': 'PiPauseCircleBold',

  // Heroicons that might remain
  'MagnifyingGlassIcon': 'PiMagnifyingGlassBold',
  'ExclamationTriangleIcon': 'PiWarningBold',

  // Common icons that might be bare
  'PiArrowLeftBold': 'PiArrowLeftBold',
  'PiShieldBold': 'PiShieldBold',
  'PiCheckCircleBold': 'PiCheckCircleBold',
  'PiCaretRightBold': 'PiCaretRightBold',
  'PiBuildingsBold': 'PiBuildingsBold',
  'PiMoneyBold': 'PiMoneyBold',
  'PiTicketBold': 'PiTicketBold',
  'PiPackageBold': 'PiPackageBold',
  'PiTruckBold': 'PiTruckBold',
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
  const neededImports = new Set();

  // Find all icon usages (both JSX and references)
  for (const [lucideIcon, phosphorIcon] of Object.entries(REMAINING_MAPPINGS)) {
    // Check for JSX usage like <IconName or icon={IconName}
    const jsxPattern = new RegExp(`<${lucideIcon}[\\s/>]|icon[=:]\\s*${lucideIcon}[\\s,})]|icon:\\s*${lucideIcon}[\\s,}]`, 'g');

    if (jsxPattern.test(content)) {
      // Replace the usage
      content = content.replace(new RegExp(`<${lucideIcon}([\\s/>])`, 'g'), `<${phosphorIcon}$1`);
      content = content.replace(new RegExp(`(icon[=:]\\s*)${lucideIcon}([\\s,})])`, 'g'), `$1${phosphorIcon}$2`);
      content = content.replace(new RegExp(`(icon:\\s*)${lucideIcon}([\\s,}])`, 'g'), `$1${phosphorIcon}$2`);
      neededImports.add(phosphorIcon);
      modified = true;
    }
  }

  if (modified && neededImports.size > 0) {
    // Check if file already has react-icons/pi import
    const existingImportMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]react-icons\/pi['"]/);

    if (existingImportMatch) {
      // Add to existing import
      const existingIcons = existingImportMatch[1].split(',').map(s => s.trim());
      const allIcons = new Set([...existingIcons, ...neededImports]);
      const newImport = `import { ${Array.from(allIcons).sort().join(', ')} } from 'react-icons/pi'`;
      content = content.replace(/import\s*\{[^}]+\}\s*from\s*['"]react-icons\/pi['"]/, newImport);
    } else {
      // Add new import after 'use client' or at top
      const importLine = `import { ${Array.from(neededImports).sort().join(', ')} } from 'react-icons/pi';\n`;
      if (content.includes("'use client'")) {
        content = content.replace(/(['"]use client['"];?\n)/, `$1${importLine}`);
      } else {
        content = importLine + content;
      }
    }

    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath} (added ${neededImports.size} icons)`);
    return true;
  }
  return false;
}

console.log('Fixing missing Phosphor icon imports...\n');
const files = getAllFiles(process.cwd());
let fixedCount = 0;
for (const file of files) {
  if (fixFile(file)) fixedCount++;
}
console.log(`\nFixed ${fixedCount} files`);

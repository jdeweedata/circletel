#!/usr/bin/env node
/**
 * Comprehensive icon fix - handles all remaining patterns
 */

const fs = require('fs');
const path = require('path');

// Complete Lucide -> Phosphor mapping
const LUCIDE_TO_PHOSPHOR = {
  'FileText': 'PiFileTextBold',
  'Video': 'PiVideoCameraBold',
  'Wifi': 'PiWifiHighBold',
  'Clock': 'PiClockBold',
  'CheckCircle': 'PiCheckCircleBold',
  'CheckCircle2': 'PiCheckCircleBold',
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
  'Radio': 'PiRadioBold',
  'Camera': 'PiCameraBold',
  'Printer': 'PiPrinterBold',
  'Phone': 'PiPhoneBold',
  'Mail': 'PiEnvelopeBold',
  'Settings': 'PiGearBold',
  'Eye': 'PiEyeBold',
  'EyeOff': 'PiEyeSlashBold',
  'Loader2': 'PiSpinnerBold',
  'Router': 'PiRouterBold',
  'ShoppingCart': 'PiShoppingCartBold',
  'Download': 'PiDownloadSimpleBold',
  'Upload': 'PiUploadSimpleBold',
  'Play': 'PiPlayBold',
  'Pause': 'PiPauseBold',
  'Home': 'PiHouseBold',
  'Megaphone': 'PiMegaphoneBold',
  'Gift': 'PiGiftBold',
  'BarChart3': 'PiChartBarBold',
  'BarChart2': 'PiChartBarBold',
  'BarChart': 'PiChartBarBold',
  'Plus': 'PiPlusBold',
  'Percent': 'PiPercentBold',
  'Calendar': 'PiCalendarBold',
  'DollarSign': 'PiCurrencyDollarBold',
  'Banknote': 'PiMoneyBold',
  'TrendingUp': 'PiTrendUpBold',
  'TrendingDown': 'PiTrendDownBold',
  'Archive': 'PiArchiveBold',
  'ChevronLeft': 'PiCaretLeftBold',
  'ChevronRight': 'PiCaretRightBold',
  'ChevronDown': 'PiCaretDownBold',
  'ChevronUp': 'PiCaretUpBold',
  'MessageSquare': 'PiChatBold',
  'ImageIcon': 'PiImageBold',
  'Image': 'PiImageBold',
  'FileSpreadsheet': 'PiFileXlsBold',
  'Presentation': 'PiPresentationChartBold',
  'X': 'PiXBold',
  'ArrowLeft': 'PiArrowLeftBold',
  'ArrowRight': 'PiArrowRightBold',
  'Search': 'PiMagnifyingGlassBold',
  'Trash2': 'PiTrashBold',
  'Copy': 'PiCopyBold',
  'ExternalLink': 'PiArrowSquareOutBold',
  'RefreshCw': 'PiArrowsClockwiseBold',
  'MoreHorizontal': 'PiDotsThreeBold',
  'MoreVertical': 'PiDotsThreeVerticalBold',
  'Bell': 'PiBellBold',
  'Globe': 'PiGlobeBold',
  'Server': 'PiDesktopTowerBold',
  'Database': 'PiDatabaseBold',
  'Cloud': 'PiCloudBold',
  'Cpu': 'PiCpuBold',
  'HardDrive': 'PiHardDriveBold',
  'Headphones': 'PiHeadphonesBold',
  'LineChart': 'PiChartLineUpBold',
  'Gauge': 'PiGaugeBold',
  'SlidersHorizontal': 'PiSlidersHorizontalBold',
  'Filter': 'PiFunnelBold',
  'HelpCircle': 'PiQuestionBold',
  'AlertTriangle': 'PiWarningBold',
  'Heart': 'PiHeartBold',
  'Rocket': 'PiRocketBold',
  'Code': 'PiCodeBold',
  'Truck': 'PiTruckBold',
  'Building': 'PiBuildingBold',
  'Calculator': 'PiCalculatorBold',
  'Activity': 'PiPulseBold',
  'Power': 'PiPowerBold',
  'Battery': 'PiBatteryFullBold',
  'Hash': 'PiHashBold',
  'Layers': 'PiStackBold',
  'Circle': 'PiCircleBold',
  'Square': 'PiSquareBold',
  'LogIn': 'PiSignInBold',
  'LogOut': 'PiSignOutBold',
  'Menu': 'PiListBold',
  'Bookmark': 'PiBookmarkBold',
  'Folder': 'PiFolderBold',
  'FolderOpen': 'PiFolderOpenBold',
  'File': 'PiFileBold',
  'Clipboard': 'PiClipboardBold',
  'Book': 'PiBookBold',
  'BookOpen': 'PiBookOpenBold',
  'Wallet': 'PiWalletBold',
  'Tag': 'PiTagBold',
  'Ticket': 'PiTicketBold',
  'Network': 'PiGraphBold',
  'Laptop': 'PiLaptopBold',
  'Monitor': 'PiMonitorBold',
  'Tv': 'PiTelevisionBold',
  'Award': 'PiTrophyBold',
  'Trophy': 'PiTrophyBold',
  'Bot': 'PiRobotBold',
  'Box': 'PiCubeBold',
  'Handshake': 'PiHandshakeBold',
  'IdCard': 'PiIdentificationCardBold',
  'History': 'PiClockCounterClockwiseBold',
  'Crosshair': 'PiCrosshairBold',
  'Navigation': 'PiNavigationArrowBold',
  'Map': 'PiMapTrifoldBold',
  'Send': 'PiPaperPlaneRightBold',
  'Inbox': 'PiTrayBold',
  'UserPlus': 'PiUserPlusBold',
  'UserCheck': 'PiUserCheckBold',
  'ShieldCheck': 'PiShieldCheckBold',
  'ShieldAlert': 'PiShieldWarningBold',
  'Minus': 'PiMinusBold',
  'PlusCircle': 'PiPlusCircleBold',
  'XCircle': 'PiXCircleBold',
  'Save': 'PiFloppyDiskBold',
  'Edit': 'PiPencilSimpleBold',
  'Edit2': 'PiPencilSimpleBold',
  'RotateCcw': 'PiArrowCounterClockwiseBold',
  'RefreshCcw': 'PiArrowsCounterClockwiseBold',
  'WifiOff': 'PiWifiSlashBold',
  'Cable': 'PiPlugBold',
  'Quote': 'PiQuotesBold',
  'MessageCircle': 'PiChatCircleBold',
  'MessageSquarePlus': 'PiChatPlusBold',
  'Sparkles': 'PiSparkleBold',
  'Bug': 'PiBugBold',
  'TestTube': 'PiTestTubeBold',
  'Ban': 'PiProhibitBold',
  'Infinity': 'PiInfinityBold',
  'Share2': 'PiShareBold',
  'GripVertical': 'PiDotsSixVerticalBold',
  'Maximize2': 'PiArrowsOutBold',
  'PlayCircle': 'PiPlayCircleBold',
  'CheckSquare': 'PiCheckSquareBold',
  'LayoutDashboard': 'PiSquaresFourBold',
  'LayoutGrid': 'PiGridFourBold',
  'Grid': 'PiGridFourBold',
  'Columns3': 'PiColumnsBold',
  'PanelLeft': 'PiSidebarBold',
  'PanelRight': 'PiSidebarBold',
  'List': 'PiListBold',
  'ListOrdered': 'PiListNumbersBold',
  'Bold': 'PiTextBBold',
  'Italic': 'PiTextItalicBold',
  'Facebook': 'PiFacebookLogoBold',
  'Linkedin': 'PiLinkedinLogoBold',
  'Twitter': 'PiTwitterLogoBold',
};

// All Phosphor icons that might be used
const ALL_PHOSPHOR_ICONS = Object.values(LUCIDE_TO_PHOSPHOR);

function getAllFiles(dir, extensions = ['.tsx', '.ts']) {
  const results = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.name === 'node_modules' || item.name === '.next' || item.name === '.git' || item.name === '.worktrees' || item.name === '.backup') continue;
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
  let originalContent = content;
  const neededImports = new Set();

  // Replace all Lucide icon usages with Phosphor equivalents
  for (const [lucide, phosphor] of Object.entries(LUCIDE_TO_PHOSPHOR)) {
    // Pattern 1: icon={IconName}
    const jsxIconPropPattern = new RegExp(`(icon=\\{)${lucide}(\\})`, 'g');
    if (jsxIconPropPattern.test(content)) {
      content = content.replace(new RegExp(`(icon=\\{)${lucide}(\\})`, 'g'), `$1${phosphor}$2`);
      neededImports.add(phosphor);
    }

    // Pattern 2: icon: IconName (object property)
    const iconObjPattern = new RegExp(`(icon:\\s*)${lucide}([\\s,}])`, 'g');
    if (iconObjPattern.test(content)) {
      content = content.replace(new RegExp(`(icon:\\s*)${lucide}([\\s,}])`, 'g'), `$1${phosphor}$2`);
      neededImports.add(phosphor);
    }

    // Pattern 3: propertyName: IconName (generic object with icon value)
    // Match patterns like "flyer: FileText" or "document: FileText"
    const genericObjPattern = new RegExp(`(\\w+:\\s*)${lucide}([,\\s}])`, 'g');
    if (genericObjPattern.test(content)) {
      // Only replace if it looks like an icon mapping (lowercase property name)
      content = content.replace(new RegExp(`([a-z]\\w*:\\s*)${lucide}([,\\s}])`, 'g'), `$1${phosphor}$2`);
      neededImports.add(phosphor);
    }

    // Pattern 4: <IconName /> or <IconName .../>
    const jsxSelfClosingPattern = new RegExp(`<${lucide}(\\s[^>]*)?/>`, 'g');
    if (jsxSelfClosingPattern.test(content)) {
      content = content.replace(new RegExp(`<${lucide}(\\s[^>]*)?/>`, 'g'), `<${phosphor}$1/>`);
      neededImports.add(phosphor);
    }

    // Pattern 5: <IconName>...</IconName>
    const jsxOpenClosePattern = new RegExp(`<${lucide}(\\s[^>]*)?>([^<]*)</${lucide}>`, 'g');
    if (jsxOpenClosePattern.test(content)) {
      content = content.replace(new RegExp(`<${lucide}(\\s[^>]*)?>`, 'g'), `<${phosphor}$1>`);
      content = content.replace(new RegExp(`</${lucide}>`, 'g'), `</${phosphor}>`);
      neededImports.add(phosphor);
    }
  }

  // Find Phosphor icons used but not imported
  for (const icon of ALL_PHOSPHOR_ICONS) {
    const usagePattern = new RegExp(`[<{:\\s]${icon}[\\s/>},)]`);
    if (usagePattern.test(content)) {
      const importPattern = new RegExp(`import\\s*\\{[^}]*\\b${icon}\\b[^}]*\\}\\s*from\\s*['"]react-icons/pi['"]`);
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
      const sortedIcons = Array.from(allIcons).sort();
      const newImport = `import { ${sortedIcons.join(', ')} } from 'react-icons/pi'`;
      content = content.replace(/import\s*\{[^}]+\}\s*from\s*['"]react-icons\/pi['"]/, newImport);
    } else if (neededImports.size > 0) {
      const sortedIcons = Array.from(neededImports).sort();
      const importLine = `import { ${sortedIcons.join(', ')} } from 'react-icons/pi';\n`;
      if (content.includes("'use client'")) {
        content = content.replace(/(['"]use client['"];?\n)/, `$1${importLine}`);
      } else {
        const firstImport = content.match(/^import\s/m);
        if (firstImport) {
          content = content.replace(/^(import\s)/, `${importLine}$1`);
        }
      }
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  return false;
}

console.log('Running comprehensive icon fix...\n');
const files = getAllFiles(process.cwd());
let fixedCount = 0;
for (const file of files) {
  if (fixFile(file)) fixedCount++;
}
console.log(`\nFixed ${fixedCount} files`);

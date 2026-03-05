#!/usr/bin/env node
/**
 * Smart Lucide to Phosphor converter
 * Avoids converting Recharts components (BarChart, LineChart, etc.)
 * Only converts actual icon usages
 */

const fs = require('fs');
const path = require('path');

// Lucide icons to convert (excluding Recharts components)
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
  'ShoppingCart': 'PiShoppingCartBold',
  'Download': 'PiDownloadSimpleBold',
  'Upload': 'PiUploadSimpleBold',
  'Play': 'PiPlayBold',
  'Pause': 'PiPauseBold',
  'Home': 'PiHouseBold',
  'Megaphone': 'PiMegaphoneBold',
  'Gift': 'PiGiftBold',
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
  'FileSpreadsheet': 'PiFileXlsBold',
  'Presentation': 'PiPresentationChartBold',
  'X': 'PiXBold',
  'ArrowLeft': 'PiArrowLeftBold',
  'ArrowRight': 'PiArrowRightBold',
  'ArrowDown': 'PiArrowDownBold',
  'ArrowUp': 'PiArrowUpBold',
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
  'BatteryCharging': 'PiBatteryChargingBold',
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
  'ClipboardList': 'PiClipboardTextBold',
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
  'FileEdit': 'PiPencilSimpleBold',
  'RotateCcw': 'PiArrowCounterClockwiseBold',
  'RefreshCcw': 'PiArrowsCounterClockwiseBold',
  'WifiOff': 'PiWifiSlashBold',
  'Cable': 'PiPlugBold',
  'Quote': 'PiQuotesBold',
  'MessageCircle': 'PiChatCircleBold',
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
  'Crown': 'PiCrownBold',
  'Receipt': 'PiReceiptBold',
  'Workflow': 'PiFlowArrowBold',
};

// DO NOT convert these - they are Recharts components
const RECHARTS_COMPONENTS = [
  'BarChart', 'LineChart', 'AreaChart', 'PieChart', 'RadarChart',
  'ComposedChart', 'ScatterChart', 'FunnelChart', 'Treemap',
  'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'Legend',
  'Bar', 'Line', 'Area', 'Pie', 'Cell', 'Scatter'
];

function getAllFiles(dir, extensions = ['.tsx', '.ts']) {
  const results = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.name === 'node_modules' || item.name === '.next' || item.name === '.git' || item.name === '.worktrees' || item.name === '.backup' || item.name === 'scripts') continue;
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
  const originalContent = content;
  const neededImports = new Set();

  // Check if file uses recharts
  const usesRecharts = content.includes("from 'recharts'") || content.includes('from "recharts"');

  for (const [lucide, phosphor] of Object.entries(LUCIDE_TO_PHOSPHOR)) {
    // Skip if this looks like a Recharts component
    if (usesRecharts && (lucide === 'BarChart' || lucide === 'LineChart' || lucide === 'AreaChart')) {
      continue;
    }

    // ONLY convert specific icon usage patterns

    // Pattern 1: Self-closing icon tags <FileText /> or <FileText className="..." />
    // But NOT <FileText>content</FileText> (which would be a Recharts component)
    const selfClosingTagPattern = new RegExp(`<${lucide}(\\s[^>]*)?\\s*/>`, 'g');
    if (selfClosingTagPattern.test(content)) {
      content = content.replace(new RegExp(`<${lucide}(\\s[^>]*)?\\s*/>`, 'g'), `<${phosphor}$1 />`);
      neededImports.add(phosphor);
    }

    // Pattern 2: icon={FileText}
    const iconPropPattern = new RegExp(`icon=\\{${lucide}\\}`, 'g');
    if (iconPropPattern.test(content)) {
      content = content.replace(iconPropPattern, `icon={${phosphor}}`);
      neededImports.add(phosphor);
    }

    // Pattern 3: icon: FileText (in objects)
    const iconObjPattern = new RegExp(`(icon:\\s*)${lucide}([,\\s}])`, 'g');
    if (iconObjPattern.test(content)) {
      content = content.replace(iconObjPattern, `$1${phosphor}$2`);
      neededImports.add(phosphor);
    }

    // Pattern 4: || FileText (fallback)
    const fallbackPattern = new RegExp(`\\|\\|\\s*${lucide}(?=[^\\w]|$)`, 'g');
    if (fallbackPattern.test(content)) {
      content = content.replace(fallbackPattern, `|| ${phosphor}`);
      neededImports.add(phosphor);
    }

    // Pattern 5: property value in object (lowercase property name followed by icon)
    const objValuePattern = new RegExp(`([a-z]\\w*:\\s*)${lucide}([,\\s}])`, 'g');
    if (objValuePattern.test(content)) {
      content = content.replace(objValuePattern, `$1${phosphor}$2`);
      neededImports.add(phosphor);
    }
  }

  // Add missing imports for Phosphor icons used
  const allPhosphorIcons = new Set(Object.values(LUCIDE_TO_PHOSPHOR));
  for (const icon of allPhosphorIcons) {
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
      const uniqueIcons = [...allIcons].filter((v, i, a) => a.indexOf(v) === i);
      const sortedIcons = uniqueIcons.sort();
      const newImport = `import { ${sortedIcons.join(', ')} } from 'react-icons/pi'`;
      content = content.replace(/import\s*\{[^}]+\}\s*from\s*['"]react-icons\/pi['"]/, newImport);
    } else if (neededImports.size > 0) {
      const sortedIcons = Array.from(neededImports).sort();
      const importLine = `import { ${sortedIcons.join(', ')} } from 'react-icons/pi';\n`;

      if (content.includes("'use client'") || content.includes('"use client"')) {
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

console.log('Smart Lucide to Phosphor conversion (avoiding Recharts)...\n');
const files = getAllFiles(process.cwd());
let fixedCount = 0;
for (const file of files) {
  if (fixFile(file)) fixedCount++;
}
console.log(`\nFixed ${fixedCount} files`);

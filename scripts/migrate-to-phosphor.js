#!/usr/bin/env node
/**
 * Phosphor Icons Migration Script
 * Converts Lucide and Heroicons imports to Phosphor Bold via react-icons/pi
 */

const fs = require('fs');
const path = require('path');

// Complete Lucide → Phosphor mapping
const LUCIDE_TO_PHOSPHOR = {
  // Loaders & Status
  'Loader2': 'PiSpinnerBold',
  'CheckCircle': 'PiCheckCircleBold',
  'CheckCircle2': 'PiCheckCircleBold',
  'AlertCircle': 'PiWarningCircleBold',
  'XCircle': 'PiXCircleBold',
  'CircleCheck': 'PiCheckCircleBold',

  // Basic Actions
  'Check': 'PiCheckBold',
  'X': 'PiXBold',
  'Plus': 'PiPlusBold',
  'PlusCircle': 'PiPlusCircleBold',
  'Minus': 'PiMinusBold',
  'Search': 'PiMagnifyingGlassBold',
  'Copy': 'PiCopyBold',
  'Save': 'PiFloppyDiskBold',
  'Edit': 'PiPencilSimpleBold',
  'Edit2': 'PiPencilSimpleBold',
  'Trash2': 'PiTrashBold',
  'Download': 'PiDownloadSimpleBold',
  'Upload': 'PiUploadSimpleBold',
  'RefreshCw': 'PiArrowsClockwiseBold',
  'RefreshCcw': 'PiArrowsCounterClockwiseBold',
  'RotateCcw': 'PiArrowCounterClockwiseBold',

  // Arrows
  'ArrowLeft': 'PiArrowLeftBold',
  'ArrowRight': 'PiArrowRightBold',
  'ArrowUp': 'PiArrowUpBold',
  'ArrowDown': 'PiArrowDownBold',
  'ArrowUpDown': 'PiArrowsDownUpBold',
  'ChevronLeft': 'PiCaretLeftBold',
  'ChevronRight': 'PiCaretRightBold',
  'ChevronUp': 'PiCaretUpBold',
  'ChevronDown': 'PiCaretDownBold',
  'ExternalLink': 'PiArrowSquareOutBold',

  // Communication
  'Mail': 'PiEnvelopeBold',
  'Phone': 'PiPhoneBold',
  'MessageCircle': 'PiChatCircleBold',
  'MessageSquare': 'PiChatBold',
  'MessageSquarePlus': 'PiChatPlusBold',
  'Send': 'PiPaperPlaneRightBold',
  'Inbox': 'PiTrayBold',
  'Bell': 'PiBellBold',
  'Megaphone': 'PiMegaphoneBold',

  // Users
  'User': 'PiUserBold',
  'Users': 'PiUsersBold',
  'UserPlus': 'PiUserPlusBold',
  'UserCheck': 'PiUserCheckBold',

  // Navigation & Location
  'Home': 'PiHouseBold',
  'Menu': 'PiListBold',
  'MapPin': 'PiMapPinBold',
  'Map': 'PiMapTrifoldBold',
  'Navigation': 'PiNavigationArrowBold',
  'Globe': 'PiGlobeBold',
  'Crosshair': 'PiCrosshairBold',

  // Time & Calendar
  'Clock': 'PiClockBold',
  'Calendar': 'PiCalendarBold',
  'History': 'PiClockCounterClockwiseBold',

  // Files & Documents
  'File': 'PiFileBold',
  'FileText': 'PiFileTextBold',
  'FileQuestion': 'PiFileQuestionBold',
  'FolderOpen': 'PiFolderOpenBold',
  'Clipboard': 'PiClipboardBold',
  'ClipboardList': 'PiClipboardTextBold',
  'Book': 'PiBookBold',
  'BookOpen': 'PiBookOpenBold',
  'Bookmark': 'PiBookmarkBold',

  // Security
  'Lock': 'PiLockBold',
  'Key': 'PiKeyBold',
  'KeyRound': 'PiKeyBold',
  'Shield': 'PiShieldBold',
  'ShieldCheck': 'PiShieldCheckBold',
  'ShieldAlert': 'PiShieldWarningBold',
  'Eye': 'PiEyeBold',
  'EyeOff': 'PiEyeSlashBold',

  // Commerce
  'ShoppingCart': 'PiShoppingCartBold',
  'CreditCard': 'PiCreditCardBold',
  'DollarSign': 'PiCurrencyDollarBold',
  'Banknote': 'PiMoneyBold',
  'Wallet': 'PiWalletBold',
  'Percent': 'PiPercentBold',
  'Tag': 'PiTagBold',
  'Gift': 'PiGiftBold',
  'Ticket': 'PiTicketBold',

  // Tech & Connectivity
  'Wifi': 'PiWifiBold',
  'WifiOff': 'PiWifiSlashBold',
  'Signal': 'PiCellSignalFullBold',
  'Smartphone': 'PiDeviceMobileBold',
  'Laptop': 'PiLaptopBold',
  'Monitor': 'PiMonitorBold',
  'Tv': 'PiTelevisionBold',
  'Server': 'PiServerBold',
  'Database': 'PiDatabaseBold',
  'Cloud': 'PiCloudBold',
  'Router': 'PiRouterBold',
  'Network': 'PiGraphBold',
  'Cable': 'PiPlugBold',
  'Cpu': 'PiCpuBold',
  'HardDrive': 'PiHardDriveBold',
  'Radio': 'PiRadioBold',
  'Headphones': 'PiHeadphonesBold',
  'HeadphonesIcon': 'PiHeadphonesBold',

  // Charts & Stats
  'TrendingUp': 'PiTrendUpBold',
  'TrendingDown': 'PiTrendDownBold',
  'BarChart3': 'PiChartBarBold',
  'LineChart': 'PiChartLineUpBold',
  'Gauge': 'PiGaugeBold',

  // Settings & Tools
  'Settings': 'PiGearBold',
  'Cog': 'PiGearBold',
  'SlidersHorizontal': 'PiSlidersHorizontalBold',
  'Wrench': 'PiWrenchBold',
  'Webhook': 'PiWebhooksLogoBold',
  'Filter': 'PiFunnelBold',
  'Wand2': 'PiMagicWandBold',

  // Alerts & Info
  'AlertTriangle': 'PiWarningBold',
  'Info': 'PiInfoBold',
  'HelpCircle': 'PiQuestionBold',
  'Bug': 'PiBugBold',

  // Misc
  'Zap': 'PiLightningBold',
  'Star': 'PiStarBold',
  'Heart': 'PiHeartBold',
  'Award': 'PiTrophyBold',
  'Trophy': 'PiTrophyBold',
  'Rocket': 'PiRocketBold',
  'Sparkles': 'PiSparklesBold',
  'Bot': 'PiRobotBold',
  'Code': 'PiCodeBold',
  'Package': 'PiPackageBold',
  'Box': 'PiCubeBold',
  'Truck': 'PiTruckBold',
  'TruckIcon': 'PiTruckBold',
  'Building': 'PiBuildingBold',
  'Building2': 'PiBuildingsBold',
  'Handshake': 'PiHandshakeBold',
  'IdCard': 'PiIdentificationCardBold',
  'Calculator': 'PiCalculatorBold',
  'Quote': 'PiQuotesBold',
  'Link2': 'PiLinkBold',
  'Activity': 'PiActivityBold',
  'Power': 'PiPowerBold',
  'Unplug': 'PiPlugBold',
  'Battery': 'PiBatteryFullBold',
  'BatteryCharging': 'PiBatteryChargingBold',
  'Hash': 'PiHashBold',
  'Layers': 'PiStackBold',
  'Archive': 'PiArchiveBold',
  'Circle': 'PiCircleBold',
  'Square': 'PiSquareBold',
  'Dot': 'PiCircleBold',
  'Ban': 'PiProhibitBold',
  'Infinity': 'PiInfinityBold',
  'TestTube': 'PiTestTubeBold',
  'Image': 'PiImageBold',
  'ImageIcon': 'PiImageBold',
  'Share2': 'PiShareBold',
  'MoreHorizontal': 'PiDotsThreeBold',
  'MoreVertical': 'PiDotsThreeVerticalBold',
  'GripVertical': 'PiDotsSixVerticalBold',
  'Maximize2': 'PiArrowsOutBold',
  'LogIn': 'PiSignInBold',
  'LogOut': 'PiSignOutBold',
  'PlayCircle': 'PiPlayCircleBold',
  'Pause': 'PiPauseBold',
  'CheckSquare': 'PiCheckSquareBold',

  // Layout
  'LayoutDashboard': 'PiSquaresFourBold',
  'LayoutGrid': 'PiGridFourBold',
  'LayoutIcon': 'PiLayoutBold',
  'Grid': 'PiGridFourBold',
  'Columns3': 'PiColumnsBold',
  'PanelLeft': 'PiSidebarBold',
  'PanelRight': 'PiSidebarBold',
  'List': 'PiListBold',
  'ListIcon': 'PiListBold',
  'ListOrdered': 'PiListNumbersBold',

  // Text Formatting
  'Bold': 'PiTextBBold',
  'Italic': 'PiTextItalicBold',
  'Heading2': 'PiTextHBold',
  'Heading3': 'PiTextHBold',

  // Social
  'Facebook': 'PiFacebookLogoBold',
  'Linkedin': 'PiLinkedinLogoBold',
  'Twitter': 'PiTwitterLogoBold',

  // Additional missing icons
  'Antenna': 'PiAntennaBold',
  'ArrowDownCircle': 'PiArrowCircleDownBold',
  'ArrowDownRight': 'PiArrowDownRightBold',
  'ArrowUpRight': 'PiArrowUpRightBold',
  'BarChart': 'PiChartBarBold',
  'BarChart2': 'PiChartBarBold',
  'Briefcase': 'PiBriefcaseBold',
  'CalendarCheck': 'PiCalendarCheckBold',
  'CalendarPlus': 'PiCalendarPlusBold',
  'Camera': 'PiCameraBold',
  'ChevronsLeft': 'PiCaretDoubleLeftBold',
  'ChevronsRight': 'PiCaretDoubleRightBold',
  'ClipboardCheck': 'PiClipboardTextBold',
  'CloudOff': 'PiCloudSlashBold',
  'Crown': 'PiCrownBold',
  'DoorOpen': 'PiDoorOpenBold',
  'Edit3': 'PiPencilSimpleBold',
  'FileCheck': 'PiFileCheckBold',
  'FileEdit': 'PiFilePlusBold',
  'FileSearch': 'PiFileMagnifyingGlassBold',
  'FileSignature': 'PiFileTextBold',
  'FileSpreadsheet': 'PiFileXlsBold',
  'Folder': 'PiFolderBold',
  'FolderPlus': 'PiFolderPlusBold',
  'FormInput': 'PiTextboxBold',
  'Grid3X3': 'PiGridNineBold',
  'Images': 'PiImagesBold',
  'Keyboard': 'PiKeyboardBold',
  'Layout': 'PiLayoutBold',
  'Lightbulb': 'PiLightbulbBold',
  'Link': 'PiLinkBold',
  'LinkIcon': 'PiLinkBold',
  'MailX': 'PiEnvelopeBold',
  'MapPinned': 'PiMapPinBold',
  'MousePointer': 'PiCursorBold',
  'MousePointerClick': 'PiCursorClickBold',
  'Newspaper': 'PiNewspaperBold',
  'PanelTop': 'PiSidebarBold',
  'PauseCircle': 'PiPauseCircleBold',
  'Pencil': 'PiPencilBold',
  'PhoneCall': 'PiPhoneCallBold',
  'Play': 'PiPlayBold',
  'Presentation': 'PiPresentationChartBold',
  'Printer': 'PiPrinterBold',
  'QrCode': 'PiQrCodeBold',
  'Receipt': 'PiReceiptBold',
  'Redo2': 'PiArrowClockwiseBold',
  'ShoppingBag': 'PiShoppingBagBold',
  'SimCard': 'PiSimCardBold',
  'Space': 'PiSelectionBold',
  'Store': 'PiStorefrontBold',
  'Target': 'PiTargetBold',
  'Terminal': 'PiTerminalBold',
  'ToggleLeft': 'PiToggleLeftBold',
  'ToggleRight': 'PiToggleRightBold',
  'Tool': 'PiWrenchBold',
  'Type': 'PiTextAaBold',
  'Undo2': 'PiArrowCounterClockwiseBold',
  'UploadCloud': 'PiCloudArrowUpBold',
  'UserCircle': 'PiUserCircleBold',
  'UserX': 'PiUserMinusBold',
  'Video': 'PiVideoCameraBold',
  'Workflow': 'PiFlowArrowBold',
};

// Heroicons → Phosphor mapping
const HEROICONS_TO_PHOSPHOR = {
  'CheckCircleIcon': 'PiCheckCircleBold',
  'XMarkIcon': 'PiXBold',
  'ArrowPathIcon': 'PiArrowsClockwiseBold',
  'FunnelIcon': 'PiFunnelBold',
  'BuildingOfficeIcon': 'PiBuildingOfficeBold',
  'ArrowTrendingUpIcon': 'PiTrendUpBold',
  'ArrowTrendingDownIcon': 'PiTrendDownBold',
  'ClockIcon': 'PiClockBold',
  'XCircleIcon': 'PiXCircleBold',
  'ArrowDownTrayIcon': 'PiDownloadSimpleBold',
  'ChartBarIcon': 'PiChartBarBold',
  'CurrencyDollarIcon': 'PiCurrencyDollarBold',
  'PlusIcon': 'PiPlusBold',
  'GlobeAltIcon': 'PiGlobeBold',
};

function getAllFiles(dir, extensions = ['.tsx', '.ts']) {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    // Skip directories
    if (item.name === 'node_modules' || item.name === '.next' || item.name === '.git') {
      continue;
    }

    if (item.isDirectory()) {
      results.push(...getAllFiles(fullPath, extensions));
    } else if (extensions.some(ext => item.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }

  return results;
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const phosphorImports = new Set();

  // Check for Lucide imports
  const lucideImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
  let match;

  while ((match = lucideImportRegex.exec(content)) !== null) {
    const importedIcons = match[1].split(',').map(s => s.trim().split(' as ')[0].trim());

    for (const icon of importedIcons) {
      if (icon === 'type LucideIcon' || icon === 'LucideIcon') continue;

      const phosphorIcon = LUCIDE_TO_PHOSPHOR[icon];
      if (phosphorIcon) {
        phosphorImports.add(phosphorIcon);
        // Replace usage in JSX (e.g., <User ... /> becomes <PiUserBold ... />)
        const usageRegex = new RegExp(`<${icon}(\\s|\\/)`, 'g');
        content = content.replace(usageRegex, `<${phosphorIcon}$1`);
        // Replace references like className={icon} or icon={User}
        const refRegex = new RegExp(`(icon[=:]\\s*)${icon}([\\s,}\\)])`, 'g');
        content = content.replace(refRegex, `$1${phosphorIcon}$2`);
        modified = true;
      } else {
        console.warn(`  WARNING: No mapping for Lucide icon: ${icon} in ${filePath}`);
      }
    }
  }

  // Check for Heroicons imports
  const heroiconsImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@heroicons\/react\/24\/outline['"]/g;

  while ((match = heroiconsImportRegex.exec(content)) !== null) {
    const importedIcons = match[1].split(',').map(s => s.trim());

    for (const icon of importedIcons) {
      const phosphorIcon = HEROICONS_TO_PHOSPHOR[icon];
      if (phosphorIcon) {
        phosphorImports.add(phosphorIcon);
        const usageRegex = new RegExp(`<${icon}(\\s|\\/)`, 'g');
        content = content.replace(usageRegex, `<${phosphorIcon}$1`);
        modified = true;
      } else {
        console.warn(`  WARNING: No mapping for Heroicon: ${icon} in ${filePath}`);
      }
    }
  }

  if (modified && phosphorImports.size > 0) {
    // Remove old imports
    content = content.replace(/import\s*\{[^}]+\}\s*from\s*['"]lucide-react['"];?\n?/g, '');
    content = content.replace(/import\s*\{[^}]+\}\s*from\s*['"]@heroicons\/react\/24\/outline['"];?\n?/g, '');

    // Add Phosphor import at the top (after 'use client' if present)
    const phosphorImportLine = `import { ${Array.from(phosphorImports).sort().join(', ')} } from 'react-icons/pi';\n`;

    if (content.includes("'use client'")) {
      content = content.replace(/(['"]use client['"];?\n)/, `$1${phosphorImportLine}`);
    } else {
      // Add after first import or at top
      const firstImport = content.match(/^import\s/m);
      if (firstImport) {
        content = content.replace(/^(import\s)/, `${phosphorImportLine}$1`);
      } else {
        content = phosphorImportLine + content;
      }
    }

    fs.writeFileSync(filePath, content);
    console.log(`  Migrated: ${filePath}`);
    return true;
  }

  return false;
}

// Main execution
console.log('Phosphor Icons Migration Script');
console.log('================================\n');

const rootDir = process.cwd();
const files = getAllFiles(rootDir);

console.log(`Found ${files.length} TypeScript/TSX files to check\n`);

let migratedCount = 0;
for (const file of files) {
  if (migrateFile(file)) {
    migratedCount++;
  }
}

console.log(`\n================================`);
console.log(`Migration complete: ${migratedCount} files updated`);
console.log(`\nNext steps:`);
console.log(`1. Run: npm uninstall lucide-react @heroicons/react`);
console.log(`2. Run: npm run type-check:memory`);
console.log(`3. Run: npm run dev:memory (visual review)`);

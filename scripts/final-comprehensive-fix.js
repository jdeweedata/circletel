#!/usr/bin/env node
/**
 * Final comprehensive fix for all remaining icon migration issues
 */

const fs = require('fs');
const path = require('path');

// Files that need specific fixes
const SPECIFIC_FIXES = {
  // Fix Image component damage (next/image)
  imageComponentFix: [
    'components/navigation/Logo.tsx',
    'components/order/stages/PaymentStage.tsx',
    'components/partners/navigation/PartnerHeader.tsx',
    'components/products/ProductHero.tsx',
    'components/products/ProviderLogo.tsx',
    'components/sanity/PortableTextComponents.tsx',
    'components/sanity/blocks/ProductShowcaseBlock.tsx',
    'components/sanity/blocks/TestimonialBlock.tsx',
  ],

  // Fix User type damage (supabase)
  userTypeFix: [
    'lib/auth/admin-api-auth.ts',
    'lib/auth/customer-auth-service.ts',
    'middleware/admin-auth.ts',
    'middleware/ambassador-auth.ts',
    'components/providers/CustomerAuthProvider.tsx',
    'components/providers/CustomerAuthProvider.refactored.tsx',
  ]
};

// Complete Lucide -> Phosphor mapping (including missing ones)
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
  'Router': 'PiWifiHighBold', // No PiRouterBold, use WifiHigh
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
  'Crown': 'PiCrownBold',
  'Receipt': 'PiReceiptBold',
  'Workflow': 'PiFlowArrowBold',
};

// All possible Phosphor icons (for import checking)
const ALL_PHOSPHOR_ICONS = new Set(Object.values(LUCIDE_TO_PHOSPHOR));

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

function fixImageComponent(content, filePath) {
  // Fix cases where Image from next/image was replaced with PiImageBold
  // Pattern: <PiImageBold src="..." alt="..." />

  // Check if there's an Image component with src props being misidentified
  if (content.includes('PiImageBold') && content.includes('src=')) {
    // Remove PiImageBold from import if it was wrongly added
    content = content.replace(
      /import\s*\{([^}]*)\bPiImageBold\b([^}]*)\}\s*from\s*['"]react-icons\/pi['"]/g,
      (match, before, after) => {
        const cleaned = (before + after).replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '').replace(/\s*,\s*$/, '');
        if (!cleaned.trim()) return ''; // Remove entire import if empty
        return `import { ${cleaned} } from 'react-icons/pi'`;
      }
    );

    // Restore Image imports if missing
    if (!content.includes("from 'next/image'") && !content.includes('from "next/image"')) {
      // Check if we need Image import
      if (/<Image\s/.test(content) || /<PiImageBold\s+[^>]*src=/.test(content)) {
        const firstImport = content.match(/^import\s/m);
        if (firstImport) {
          content = `import Image from 'next/image';\n${content}`;
        }
      }
    }

    // Replace PiImageBold back to Image when it has src prop
    content = content.replace(/<PiImageBold(\s+[^>]*src=[^>]*)\/>/g, '<Image$1/>');
    content = content.replace(/<PiImageBold(\s+[^>]*src=[^>]*)>/g, '<Image$1>');
    content = content.replace(/<\/PiImageBold>/g, '</Image>');
  }

  return content;
}

function fixUserType(content, filePath) {
  // Fix cases where User type from supabase was replaced with PiUserBold
  // Pattern: user: PiUserBold  or  User | null  etc

  // These are type contexts - should be User, not PiUserBold
  // Look for patterns like: user: PiUserBold, customer: PiUserBold, etc
  content = content.replace(/:\s*PiUserBold\s*\|/g, ': User |');
  content = content.replace(/\|\s*PiUserBold\b/g, '| User');
  content = content.replace(/:\s*PiUserBold\s*;/g, ': User;');
  content = content.replace(/:\s*PiUserBold\s*}/g, ': User }');
  content = content.replace(/:\s*PiUserBold\s*\)/g, ': User)');
  content = content.replace(/<PiUserBold>/g, '<User>');
  content = content.replace(/<PiUserBold,/g, '<User,');

  // For function return types
  content = content.replace(/Promise<PiUserBold>/g, 'Promise<User>');

  // For type declarations
  content = content.replace(/type\s+\w+\s*=\s*PiUserBold/g, (match) => match.replace('PiUserBold', 'User'));

  // Remove PiUserBold from react-icons import if present in auth files
  if (filePath.includes('auth') || filePath.includes('middleware')) {
    content = content.replace(
      /import\s*\{([^}]*)\bPiUserBold\b([^}]*)\}\s*from\s*['"]react-icons\/pi['"]/g,
      (match, before, after) => {
        const cleaned = (before + after).replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '').replace(/\s*,\s*$/, '');
        if (!cleaned.trim()) return ''; // Remove entire import if empty
        return `import { ${cleaned} } from 'react-icons/pi'`;
      }
    );
  }

  return content;
}

function fixRouterIcon(content) {
  // PiRouterBold doesn't exist - replace with PiWifiHighBold
  content = content.replace(/PiRouterBold/g, 'PiWifiHighBold');
  return content;
}

function fixShorthandProperties(content) {
  // Fix object shorthand properties like { Shield, Crown, Package }
  // These need to become { Shield: PiShieldBold, Crown: PiCrownBold, etc }

  for (const [lucide, phosphor] of Object.entries(LUCIDE_TO_PHOSPHOR)) {
    // Pattern: property name followed by comma or closing brace (shorthand)
    // But NOT followed by : (which would be a proper assignment)
    const shorthandPattern = new RegExp(`(\\{[^}]*?)\\b${lucide}\\b(?!\\s*:)([^}]*?\\})`, 'g');
    content = content.replace(shorthandPattern, `$1${lucide}: ${phosphor}$2`);
  }

  return content;
}

function fixMissingImports(content, filePath) {
  const neededImports = new Set();

  // Find all Phosphor icons used in the file
  for (const icon of ALL_PHOSPHOR_ICONS) {
    const usagePattern = new RegExp(`[<{:\\s]${icon}[\\s/>},)]`);
    if (usagePattern.test(content)) {
      // Check if already imported
      const importPattern = new RegExp(`import\\s*\\{[^}]*\\b${icon}\\b[^}]*\\}\\s*from\\s*['"]react-icons/pi['"]`);
      if (!importPattern.test(content)) {
        neededImports.add(icon);
      }
    }
  }

  // Also check for Lucide icons that need conversion
  for (const [lucide, phosphor] of Object.entries(LUCIDE_TO_PHOSPHOR)) {
    // Check for standalone Lucide icon usage
    const lucideUsage = new RegExp(`[<{:\\s]${lucide}[\\s/>},)]`);
    if (lucideUsage.test(content)) {
      // Convert the usage
      content = content.replace(new RegExp(`(<)${lucide}(\\s)`, 'g'), `$1${phosphor}$2`);
      content = content.replace(new RegExp(`(icon:\\s*)${lucide}([,\\s}])`, 'g'), `$1${phosphor}$2`);
      content = content.replace(new RegExp(`(icon=\\{)${lucide}(\\})`, 'g'), `$1${phosphor}$2`);
      neededImports.add(phosphor);
    }
  }

  // Add missing imports
  if (neededImports.size > 0) {
    const existingMatch = content.match(/import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]react-icons\/pi['"]/);

    if (existingMatch) {
      const existingIcons = existingMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      const allIcons = new Set([...existingIcons, ...neededImports]);
      // Remove duplicates
      const uniqueIcons = [...allIcons].filter((v, i, a) => a.indexOf(v) === i);
      const sortedIcons = uniqueIcons.sort();
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

  return content;
}

function fixDuplicateImports(content) {
  // Find react-icons/pi import
  const importMatch = content.match(/import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]react-icons\/pi['"]/);
  if (importMatch) {
    const icons = importMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    const uniqueIcons = [...new Set(icons)].sort();
    if (icons.length !== uniqueIcons.length) {
      const newImport = `import { ${uniqueIcons.join(', ')} } from 'react-icons/pi'`;
      content = content.replace(/import\s*\{[^}]+\}\s*from\s*['"]react-icons\/pi['"]/, newImport);
    }
  }
  return content;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Apply fixes in order
  content = fixRouterIcon(content);
  content = fixImageComponent(content, filePath);
  content = fixUserType(content, filePath);
  content = fixShorthandProperties(content);
  content = fixMissingImports(content, filePath);
  content = fixDuplicateImports(content);

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  return false;
}

console.log('Running final comprehensive icon fix...\n');
const files = getAllFiles(process.cwd());
let fixedCount = 0;
for (const file of files) {
  if (fixFile(file)) fixedCount++;
}
console.log(`\nFixed ${fixedCount} files`);

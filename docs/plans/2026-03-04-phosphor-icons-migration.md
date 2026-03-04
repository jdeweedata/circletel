# Phosphor Icons Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all Lucide and Heroicon imports with Phosphor Icons (Bold weight) via react-icons/pi

**Architecture:** A Node.js codemod script transforms all icon imports automatically. The script reads each file, applies regex-based replacements using a comprehensive mapping table, and writes the updated content.

**Tech Stack:** Node.js (fs, path), TypeScript/TSX files, react-icons/pi (already installed)

---

## Task 1: Create Icon Mapping Reference

**Files:**
- Create: `docs/design-system/ICON_MAPPING.md`

**Step 1: Create the mapping documentation**

```markdown
# Icon Mapping Reference

## Lucide → Phosphor Bold

| Lucide | Phosphor Bold | Usage Count |
|--------|---------------|-------------|
| Loader2 | PiSpinnerBold | 167 |
| CheckCircle | PiCheckCircleBold | 111 |
| AlertCircle | PiWarningCircleBold | 94 |
| Check | PiCheckBold | 92 |
| Wifi | PiWifiBold | 87 |
| Clock | PiClockBold | 86 |
| Shield | PiShieldBold | 82 |
| X | PiXBold | 77 |
| ArrowLeft | PiArrowLeftBold | 72 |
| MapPin | PiMapPinBold | 68 |
| ArrowRight | PiArrowRightBold | 64 |
| Zap | PiLightningBold | 61 |
| RefreshCw | PiArrowsClockwiseBold | 60 |
| Mail | PiEnvelopeBold | 56 |
| CheckCircle2 | PiCheckCircleBold | 55 |
| TrendingUp | PiTrendUpBold | 52 |
| FileText | PiFileTextBold | 52 |
| Search | PiMagnifyingGlassBold | 48 |
| Phone | PiPhoneBold | 45 |
| XCircle | PiXCircleBold | 44 |
| Users | PiUsersBold | 44 |
| Lock | PiLockBold | 42 |
| Calendar | PiCalendarBold | 42 |
| ChevronRight | PiCaretRightBold | 37 |
| User | PiUserBold | 36 |
| ChevronDown | PiCaretDownBold | 36 |
| Settings | PiGearBold | 34 |
| Info | PiInfoBold | 34 |
| Eye | PiEyeBold | 34 |
| AlertTriangle | PiWarningBold | 34 |
| Building2 | PiBuildingsBold | 32 |
| CreditCard | PiCreditCardBold | 31 |
| Plus | PiPlusBold | 28 |
| Star | PiStarBold | 26 |
| Package | PiPackageBold | 25 |
| DollarSign | PiCurrencyDollarBold | 25 |
| Download | PiDownloadSimpleBold | 22 |
| Circle | PiCircleBold | 22 |
| Server | PiServerBold | 21 |
| Cloud | PiCloudBold | 20 |
| Bell | PiBellBold | 20 |

## Heroicons → Phosphor Bold

| Heroicons | Phosphor Bold |
|-----------|---------------|
| CheckCircleIcon | PiCheckCircleBold |
| XMarkIcon | PiXBold |
| ArrowPathIcon | PiArrowsClockwiseBold |
| FunnelIcon | PiFunnelBold |
| BuildingOfficeIcon | PiBuildingOfficeBold |
| ArrowTrendingUpIcon | PiTrendUpBold |
| ArrowTrendingDownIcon | PiTrendDownBold |
| ClockIcon | PiClockBold |
| XCircleIcon | PiXCircleBold |
| ArrowDownTrayIcon | PiDownloadSimpleBold |
| ChartBarIcon | PiChartBarBold |
| CurrencyDollarIcon | PiCurrencyDollarBold |
| PlusIcon | PiPlusBold |
| GlobeAltIcon | PiGlobeBold |
```

**Step 2: Commit**

```bash
git add docs/design-system/ICON_MAPPING.md
git commit -m "docs: add Lucide to Phosphor icon mapping reference"
```

---

## Task 2: Create Codemod Script

**Files:**
- Create: `scripts/migrate-to-phosphor.js`

**Step 1: Write the migration script**

```javascript
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
```

**Step 2: Make script executable and test dry run**

```bash
chmod +x scripts/migrate-to-phosphor.js
```

**Step 3: Commit**

```bash
git add scripts/migrate-to-phosphor.js
git commit -m "feat: add Phosphor icons migration codemod script"
```

---

## Task 3: Run Migration

**Files:**
- Modify: ~600 files across app/, components/, slices/

**Step 1: Create backup branch**

```bash
git checkout -b backup/pre-phosphor-migration
git checkout -
```

**Step 2: Run the migration**

```bash
node scripts/migrate-to-phosphor.js
```

**Step 3: Review warnings for unmapped icons**

Check console output for any `WARNING: No mapping for` messages. Manually fix these.

**Step 4: Commit migrated files**

```bash
git add -A
git commit -m "refactor: migrate all icons from Lucide/Heroicons to Phosphor Bold

- Replaced ~600 Lucide icon imports with Phosphor equivalents
- Replaced ~15 Heroicon imports with Phosphor equivalents
- Using react-icons/pi (Phosphor Bold weight)
- Design differentiation: distinctive look vs generic Lucide"
```

---

## Task 4: Remove Old Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Uninstall old icon packages**

```bash
npm uninstall lucide-react @heroicons/react
```

**Step 2: Verify package.json**

```bash
grep -E "lucide|heroicons" package.json
# Should return nothing
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove lucide-react and @heroicons/react dependencies"
```

---

## Task 5: Type Check & Build Verification

**Step 1: Run type check**

```bash
npm run type-check:memory
```

Expected: No errors (or fix any type errors from unmapped icons)

**Step 2: Run build**

```bash
npm run build:memory
```

Expected: Build succeeds

**Step 3: Start dev server for visual review**

```bash
npm run dev:memory
```

Review key pages:
- Homepage (/)
- Packages page (/packages)
- Admin dashboard (/admin)
- Partner portal (/partners)

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve icon migration type errors"
```

---

## Task 6: Update Documentation

**Files:**
- Modify: `/root/.claude/projects/-home-circletel/memory/MEMORY.md`

**Step 1: Update memory with new convention**

Add/update the Phosphor Icons section:

```markdown
### Phosphor Icons Convention (2026-03-04)
**Primary icon library**: Phosphor Icons (Bold weight) via `react-icons/pi`
**Import**: `import { PiXxxBold } from 'react-icons/pi';`

| Use Case | Icon |
|----------|------|
| Close | `PiXBold` |
| Check | `PiCheckBold` |
| Loading | `PiSpinnerBold` |
| Search | `PiMagnifyingGlassBold` |
| Settings | `PiGearBold` |
| User | `PiUserBold` |

**Full mapping**: `docs/design-system/ICON_MAPPING.md`
```

**Step 2: Commit**

```bash
git add -A
git commit -m "docs: update memory with Phosphor Icons convention"
```

---

## Success Criteria

- [ ] Zero `lucide-react` imports remain
- [ ] Zero `@heroicons/react` imports remain
- [ ] `npm run type-check:memory` passes
- [ ] `npm run build:memory` succeeds
- [ ] Visual review confirms icons display correctly
- [ ] `docs/design-system/ICON_MAPPING.md` created
- [ ] Memory updated with new convention

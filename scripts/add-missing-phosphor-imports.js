#!/usr/bin/env node
/**
 * Safely adds missing Phosphor icon imports
 * Only adds imports - never modifies existing code
 */

const fs = require('fs');
const path = require('path');

// All Phosphor icons that might be used
const ALL_PHOSPHOR_ICONS = [
  'PiArchiveBold', 'PiArrowCounterClockwiseBold', 'PiArrowDownBold', 'PiArrowLeftBold',
  'PiArrowRightBold', 'PiArrowSquareOutBold', 'PiArrowUpBold', 'PiArrowUpRightBold',
  'PiArrowsClockwiseBold', 'PiArrowsCounterClockwiseBold', 'PiArrowsOutBold',
  'PiBatteryChargingBold', 'PiBatteryFullBold', 'PiBellBold', 'PiBookBold',
  'PiBookOpenBold', 'PiBookmarkBold', 'PiBriefcaseBold', 'PiBugBold', 'PiBuildingBold',
  'PiBuildingsBold', 'PiCalculatorBold', 'PiCalendarBold', 'PiCameraBold',
  'PiCaretDownBold', 'PiCaretLeftBold', 'PiCaretRightBold', 'PiCaretUpBold',
  'PiCellSignalFullBold', 'PiChartBarBold', 'PiChartLineUpBold', 'PiChatBold',
  'PiChatCircleBold', 'PiChatPlusBold', 'PiCheckBold', 'PiCheckCircleBold',
  'PiCheckSquareBold', 'PiCircleBold', 'PiClipboardBold', 'PiClipboardTextBold',
  'PiClockBold', 'PiClockCounterClockwiseBold', 'PiCloudBold', 'PiCodeBold',
  'PiColumnsBold', 'PiCopyBold', 'PiCpuBold', 'PiCreditCardBold', 'PiCrosshairBold',
  'PiCrownBold', 'PiCubeBold', 'PiCurrencyDollarBold', 'PiDatabaseBold',
  'PiDesktopTowerBold', 'PiDeviceMobileBold', 'PiDotsThreeBold', 'PiDotsThreeVerticalBold',
  'PiDotsSixVerticalBold', 'PiDownloadSimpleBold', 'PiEnvelopeBold', 'PiEyeBold',
  'PiEyeSlashBold', 'PiFacebookLogoBold', 'PiFileBold', 'PiFileTextBold',
  'PiFileXlsBold', 'PiFloppyDiskBold', 'PiFlowArrowBold', 'PiFolderBold',
  'PiFolderOpenBold', 'PiFunnelBold', 'PiGaugeBold', 'PiGearBold', 'PiGiftBold',
  'PiGlobeBold', 'PiGraphBold', 'PiGridFourBold', 'PiHandshakeBold', 'PiHardDriveBold',
  'PiHashBold', 'PiHeadphonesBold', 'PiHeartBold', 'PiHouseBold',
  'PiIdentificationCardBold', 'PiImageBold', 'PiInfoBold', 'PiInfinityBold',
  'PiKeyBold', 'PiLaptopBold', 'PiLightningBold', 'PiLinkedinLogoBold', 'PiListBold',
  'PiListNumbersBold', 'PiLockBold', 'PiMagnifyingGlassBold', 'PiMapPinBold',
  'PiMapTrifoldBold', 'PiMegaphoneBold', 'PiMinusBold', 'PiMoneyBold', 'PiMonitorBold',
  'PiNavigationArrowBold', 'PiPackageBold', 'PiPaperPlaneRightBold', 'PiPauseBold',
  'PiPencilBold', 'PiPencilSimpleBold', 'PiPercentBold', 'PiPhoneBold', 'PiPlayBold',
  'PiPlayCircleBold', 'PiPlugBold', 'PiPlusBold', 'PiPlusCircleBold', 'PiPowerBold',
  'PiPresentationChartBold', 'PiPrinterBold', 'PiProhibitBold', 'PiPulseBold',
  'PiQuestionBold', 'PiQuotesBold', 'PiRadioBold', 'PiReceiptBold', 'PiRobotBold',
  'PiRocketBold', 'PiShareBold', 'PiShieldBold', 'PiShieldCheckBold', 'PiShieldWarningBold',
  'PiShoppingCartBold', 'PiSidebarBold', 'PiSignInBold', 'PiSignOutBold',
  'PiSignatureBold', 'PiSlidersHorizontalBold', 'PiSparkleBold', 'PiSpinnerBold',
  'PiSquareBold', 'PiSquaresFourBold', 'PiStackBold', 'PiStarBold', 'PiTagBold',
  'PiTargetBold', 'PiTelevisionBold', 'PiTestTubeBold', 'PiTextBBold',
  'PiTextItalicBold', 'PiTicketBold', 'PiTrayBold', 'PiTrendDownBold', 'PiTrendUpBold',
  'PiTrophyBold', 'PiTruckBold', 'PiTwitterLogoBold', 'PiUploadSimpleBold',
  'PiUserBold', 'PiUserCheckBold', 'PiUserPlusBold', 'PiUsersBold',
  'PiVideoCameraBold', 'PiWalletBold', 'PiWarningBold', 'PiWarningCircleBold',
  'PiWifiHighBold', 'PiWifiSlashBold', 'PiWrenchBold', 'PiXBold', 'PiXCircleBold'
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

function addMissingImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const neededImports = new Set();

  // Find all Phosphor icons used in the file
  for (const icon of ALL_PHOSPHOR_ICONS) {
    // Check if icon is used (various patterns)
    const usagePatterns = [
      new RegExp(`<${icon}[\\s/>]`),      // JSX usage: <PiXBold />
      new RegExp(`icon=\\{${icon}\\}`),    // prop: icon={PiXBold}
      new RegExp(`icon:\\s*${icon}[,\\s}]`), // object: icon: PiXBold
      new RegExp(`:\\s*${icon}[,\\s}]`),   // any object property value
    ];

    const isUsed = usagePatterns.some(pattern => pattern.test(content));

    if (isUsed) {
      // Check if already imported
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
      // Add to existing import
      const existingIcons = existingMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      const allIcons = new Set([...existingIcons, ...neededImports]);
      const uniqueIcons = [...allIcons].filter((v, i, a) => a.indexOf(v) === i);
      const sortedIcons = uniqueIcons.sort();
      const newImport = `import { ${sortedIcons.join(', ')} } from 'react-icons/pi'`;
      content = content.replace(/import\s*\{[^}]+\}\s*from\s*['"]react-icons\/pi['"]/, newImport);
    } else {
      // Add new import line
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
    console.log(`Added imports to: ${filePath} (${Array.from(neededImports).join(', ')})`);
    return true;
  }
  return false;
}

console.log('Adding missing Phosphor icon imports...\n');
const files = getAllFiles(process.cwd());
let fixedCount = 0;
for (const file of files) {
  if (addMissingImports(file)) fixedCount++;
}
console.log(`\nFixed ${fixedCount} files`);

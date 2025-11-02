#!/usr/bin/env node
/**
 * MTN Deals Import Script
 * Imports monthly MTN promotional deals from Excel into service_packages table
 * 
 * Usage: node scripts/import-mtn-deals.js "path/to/MTN-Deals.xlsx"
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Parse price from Excel (can be number or string like "R 849")
 */
function parsePrice(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value).replace(/[R\s,]/g, '');
  return parseFloat(str) || 0;
}

/**
 * Parse Excel date serial number to Date object
 */
function parseExcelDate(serial) {
  if (!serial) return null;
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  return date_info;
}

/**
 * Generate slug from product name
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parse data amount (e.g., "2.5GB" → 2.5, "10GB" → 10)
 */
function parseDataAmount(dataStr) {
  if (!dataStr) return 0;
  const match = String(dataStr).match(/([\d.]+)\s*GB/i);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Parse minutes (e.g., "200min" → 200, "0min" → 0)
 */
function parseMinutes(minStr) {
  if (!minStr) return 0;
  const match = String(minStr).match(/([\d]+)\s*min/i);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Parse SMS (e.g., "500sms" → 500, "0sms" → 0)
 */
function parseSMS(smsStr) {
  if (!smsStr) return 0;
  const match = String(smsStr).match(/([\d]+)\s*sms/i);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Determine if device/plan is 5G or LTE
 */
function determineServiceType(device, plan) {
  // Check device name for 5G indicator
  const deviceStr = String(device || '').toLowerCase();
  const planStr = String(plan || '').toLowerCase();
  
  if (deviceStr.includes('5g') || planStr.includes('5g')) {
    return '5g';
  }
  
  // All other mobile deals are LTE (default for mobile data)
  return 'lte';
}

/**
 * Check if this is a valid mobile/wireless deal to import
 * Excludes: fibre deals, handsets (phones)
 * Includes: SIM-only plans (Use Your Own), CPE devices (routers)
 */
function isMobileDeal(plan, device) {
  const planStr = String(plan || '').toLowerCase();
  const deviceStr = String(device || '').toLowerCase();
  
  // Exclude fibre deals
  if (planStr.includes('fibre') || planStr.includes('fiber')) {
    return false;
  }

  // ❌ EXCLUDE HANDSETS (phones, tablets)
  if (deviceStr.includes('phone') ||
      deviceStr.includes('galaxy') ||
      deviceStr.includes('iphone') ||
      deviceStr.includes('oppo') ||
      deviceStr.includes('vivo') ||
      deviceStr.includes('huawei') ||
      deviceStr.includes('xiaomi') ||
      deviceStr.includes('nokia') ||
      deviceStr.includes('sony') ||
      deviceStr.includes('lg')) {
    return false;
  }

  // ✅ INCLUDE CPE/Router devices (5G/LTE home internet)
  if (deviceStr.includes('router') ||
      deviceStr.includes('cpe') ||
      deviceStr.includes('modem') ||
      deviceStr.includes('tozed')) {
    return true;
  }

  // ❌ EXCLUDE MoMo Point of Sale devices (not typical CPE)
  if (deviceStr.includes('momo point of sale') || 
      deviceStr.includes('point of sale')) {
    return false;
  }
  
  // ✅ INCLUDE SIM-only plans (Use Your Own device)
  if (device === 'Use Your Own' && planStr.includes('made for business')) {
    return true;
  }
  
  // Default: exclude everything else
  return false;
}

/**
 * Map Excel row to service_packages schema
 */
function mapRowToServicePackage(row) {
  const [
    dealId,
    promoStartDate,
    promoEndDate,
    oemDevice,
    freebiesDevice,
    freebiesPriceplan,
    totalSubInclVat,
    totalSubExVat,
    onceOffPayIn,
    deviceStatus,
    pricePlan,
    eppixPackage,
    eppixTariff,
    packageDescription,
    tariffDescription,
    contractTerm,
    freeSim,
    freeCli,
    freeItb,
    onNetMinBundle,
    anytimeMinBundle,
    smsBundle,
    dataBundle,
    bundleDescription,
    inclusivePlanMinutes,
    inclusivePlanData,
    inclusivePlanSms,
    inclusivePlanInGroup,
    inclusivePlanOnNet,
    totalData,
    totalMinutes,
    ebuInventoryMain,
    ebuInventoryFreebie,
    channelDealVisibility,
    deviceRangeApplicability,
    availableHelios,
    availableILula
  ] = row;

  // Skip non-mobile deals
  if (!isMobileDeal(pricePlan, oemDevice)) {
    return null;
  }

  // Parse dates
  const startDate = parseExcelDate(promoStartDate);
  const endDate = parseExcelDate(promoEndDate);

  // Parse pricing
  const monthlyPrice = parsePrice(totalSubInclVat);
  const onceOffFee = parsePrice(onceOffPayIn);

  // Parse data and voice
  const totalDataGB = parseDataAmount(totalData);
  const totalMins = parseMinutes(totalMinutes);
  const totalSms = parseSMS(smsBundle);

  // Determine service type (5G or LTE)
  const serviceType = determineServiceType(oemDevice, pricePlan);

  // Construct product name
  const devicePart = oemDevice !== 'Use Your Own' ? ` + ${oemDevice}` : '';
  const productName = `MTN ${pricePlan}${devicePart}`;
  
  // Construct description
  const description = [
    `${pricePlan} - ${totalDataGB}GB Data`,
    totalMins > 0 ? `${totalMins} Minutes` : null,
    totalSms > 0 ? `${totalSms} SMS` : null,
    `${contractTerm} Month Contract`,
    oemDevice !== 'Use Your Own' ? `Includes ${oemDevice}` : 'SIM Only'
  ].filter(Boolean).join(' • ');

  // Features array
  const features = [];
  if (freeSim === 'Yes') features.push('Free SIM Card');
  if (freeCli === 'Yes') features.push('Free CLI (Caller Line ID)');
  if (freeItb === 'Yes') features.push('Free ITB (International Toll Bypass)');
  if (totalDataGB > 0) features.push(`${totalDataGB}GB Data`);
  if (totalMins > 0) features.push(`${totalMins} Minutes`);
  if (totalSms > 0) features.push(`${totalSms} SMS`);
  
  // Metadata
  const metadata = {
    dealId,
    promoStartDate: startDate?.toISOString(),
    promoEndDate: endDate?.toISOString(),
    oemDevice,
    deviceStatus,
    pricePlan,
    eppixPackage,
    eppixTariff,
    packageDescription,
    tariffDescription,
    contractTerm: parseInt(contractTerm) || 24,
    freebiesDevice,
    freebiesPriceplan,
    bundleDescription,
    inclusivePlanMinutes,
    inclusivePlanData,
    inclusivePlanSms,
    ebuInventoryMain,
    ebuInventoryFreebie,
    channelDealVisibility,
    deviceRangeApplicability,
    availableHelios: availableHelios === 'Yes',
    availableILula: availableILula === 'Yes'
  };

  // Pricing object
  const pricing = {
    monthly: monthlyPrice,
    setup: onceOffFee,
    monthly_ex_vat: parsePrice(totalSubExVat),
    download_speed: null, // Not applicable for mobile deals
    upload_speed: null
  };

  return {
    name: productName,
    description: description,
    slug: generateSlug(productName),
    sku: dealId,
    service_type: serviceType, // '5g' or 'lte' based on device
    product_category: 'business', // B2B deals
    customer_type: 'business',
    base_price_zar: monthlyPrice,
    pricing: pricing,
    features: features,
    metadata: metadata,
    is_featured: false,
    is_popular: totalDataGB >= 5, // Mark deals with 5GB+ as popular
    status: 'active',
    active: true,
    network_provider_id: null, // Will be set if MTN provider exists
    requires_fttb_coverage: false
  };
}

/**
 * Main import function
 */
async function importMTNDeals(filePath, options = {}) {
  const { dryRun = false, updateExisting = true } = options;

  console.log('\n📦 MTN Deals Import\n');
  console.log(`File: ${path.basename(filePath)}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no database changes)' : 'LIVE IMPORT'}`);
  console.log(`Update existing: ${updateExisting ? 'Yes' : 'No'}\n`);

  // 1. Read Excel file
  console.log('📖 Reading Excel file...');
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  console.log(`   Sheet: ${sheetName}`);
  console.log(`   Total rows: ${sheetData.length}`);

  // 2. Parse products (skip header row)
  console.log('\n🔍 Parsing deals...');
  const products = [];
  const errors = [];
  let skippedNonMobile = 0;

  for (let i = 1; i < sheetData.length; i++) {
    const row = sheetData[i];
    if (!row || row.length === 0 || !row[0]) continue; // Skip empty rows

    try {
      const product = mapRowToServicePackage(row);
      if (product === null) {
        // Non-mobile deal, skip
        skippedNonMobile++;
        continue;
      }
      products.push(product);
    } catch (error) {
      errors.push({ row: i + 1, error: error.message });
    }
  }

  console.log(`   ✅ Parsed: ${products.length} mobile deals (LTE/5G)`);
  if (skippedNonMobile > 0) {
    console.log(`   ⏭️  Skipped: ${skippedNonMobile} non-mobile deals`);
  }
  if (errors.length > 0) {
    console.log(`   ⚠️  Errors: ${errors.length}`);
    errors.slice(0, 5).forEach(err => {
      console.log(`      Row ${err.row}: ${err.error}`);
    });
  }

  // 3. Preview first 3 products
  console.log('\n📋 Sample Products:\n');
  products.slice(0, 3).forEach((p, i) => {
    const dataGB = parseDataAmount(p.metadata.totalData || '');
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   Price: R${p.base_price_zar}/month + R${p.pricing.setup} setup`);
    console.log(`   Data: ${dataGB > 0 ? dataGB + 'GB' : 'N/A'}`);
    console.log(`   Contract: ${p.metadata.contractTerm} months`);
    console.log(`   SKU: ${p.sku}`);
    console.log('');
  });

  if (dryRun) {
    console.log('🚫 DRY RUN - No database changes made');
    return { products, inserted: 0, updated: 0, skipped: 0 };
  }

  // 4. Find MTN provider (if exists)
  console.log('🔍 Looking for MTN network provider...');
  const { data: mtnProvider } = await supabase
    .from('fttb_network_providers')
    .select('id')
    .ilike('name', '%MTN%')
    .limit(1)
    .single();

  if (mtnProvider) {
    console.log(`   ✅ Found MTN provider: ${mtnProvider.id}`);
    products.forEach(p => p.network_provider_id = mtnProvider.id);
  } else {
    console.log('   ⚠️  MTN provider not found');
  }

  // 5. Import products
  console.log('\n💾 Importing to database...');
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    try {
      // Check if product exists by SKU (Deal ID)
      const { data: existing } = await supabase
        .from('service_packages')
        .select('id, sku')
        .eq('sku', product.sku)
        .single();

      if (existing && updateExisting) {
        // Update existing product
        const { error } = await supabase
          .from('service_packages')
          .update(product)
          .eq('id', existing.id);

        if (error) throw error;
        updated++;
        console.log(`   ✅ Updated: ${product.name} (${product.sku})`);
      } else if (!existing) {
        // Insert new product
        const { error } = await supabase
          .from('service_packages')
          .insert(product);

        if (error) throw error;
        inserted++;
        console.log(`   ✅ Inserted: ${product.name} (${product.sku})`);
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`   ❌ Error with ${product.name}: ${error.message}`);
    }
  }

  // 6. Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary');
  console.log('='.repeat(60));
  console.log(`Total parsed: ${products.length}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors.length}`);
  console.log('='.repeat(60));

  return { products, inserted, updated, skipped, errors };
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node import-mtn-deals.js <path-to-excel> [options]\n');
    console.log('Options:');
    console.log('  --dry-run           Preview without making database changes');
    console.log('  --no-update         Skip updating existing products\n');
    console.log('Example:');
    console.log('  node scripts/import-mtn-deals.js "docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Oct-2025/Helios and iLula Business Promos - Oct 2025 - Deals.xlsx"');
    console.log('  node scripts/import-mtn-deals.js "path/to/deals.xlsx" --dry-run');
    process.exit(1);
  }

  const filePath = args[0];
  const dryRun = args.includes('--dry-run');
  const updateExisting = !args.includes('--no-update');

  importMTNDeals(filePath, { dryRun, updateExisting })
    .then(() => {
      console.log('\n✅ Import completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Import failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { importMTNDeals };

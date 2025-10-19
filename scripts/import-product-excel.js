#!/usr/bin/env node
/**
 * Product Excel Import Script
 * Imports products from Excel into the product approval queue
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
 * Parse price string to number
 */
function parsePrice(priceStr) {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr || priceStr === 'R -' || priceStr === '-') return 0;
  const cleaned = priceStr.replace(/[R\s,]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Parse router information
 */
function parseRouter(routerStr) {
  const included = routerStr.includes('(included)');
  const model = routerStr.replace(/\(included\)/i, '').replace(/\*/g, '').trim();
  const upfrontContribution = routerStr.includes('*') ? 500 : undefined;
  const rentalFee = routerStr.includes('**') ?
    (model.includes('RG-EG305GH') ? 99 : 149) : undefined;

  return { model, included, rentalFee, upfrontContribution };
}

/**
 * Parse BizFibre Connect products
 */
function parseBizFibreConnectSheet(sheetData) {
  const products = [];
  const headerRowIndex = sheetData.findIndex(row =>
    row[0] === 'Package' && row[1] === 'Speed'
  );

  if (headerRowIndex === -1) {
    throw new Error('Could not find product pricing header');
  }

  for (let i = headerRowIndex + 1; i < sheetData.length; i++) {
    const row = sheetData[i];
    if (!row || row.length === 0 || row[0] === '' || row[0]?.includes('Detailed Cost Breakdown')) {
      break;
    }
    if (row[0]?.includes('*Requires') || row[0]?.includes('**Available')) {
      continue;
    }

    const [packageName, speed, regularPrice, promoPrice, router, installationFee, totalFirstMonth] = row;
    if (!packageName || !speed) continue;

    products.push({
      name: packageName.trim(),
      speed: speed.trim(),
      regularPrice: parsePrice(regularPrice),
      promoPrice: parsePrice(promoPrice) || undefined,
      router: parseRouter(router),
      installationFee: parsePrice(installationFee),
      totalFirstMonth: parsePrice(totalFirstMonth.split('(')[0]),
      features: [],
      notes: ''
    });
  }

  return products;
}

/**
 * Main import function
 */
async function importProductExcel(filePath, userId) {
  console.log('\n📦 Starting Product Import...\n');

  // 1. Read Excel file
  console.log('📖 Reading Excel file...');
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // 2. Parse products
  console.log('🔍 Parsing products...');
  const products = parseBizFibreConnectSheet(sheetData);
  console.log(`   Found ${products.length} products`);

  // 3. Extract metadata
  const title = sheetData[0]?.[0] || 'Unknown Product';
  const version = sheetData[2]?.[0]?.match(/Version\s+([\d.]+)/i)?.[1] || '1.0';

  const metadata = {
    title,
    version,
    excelSheets: workbook.SheetNames,
    importNotes: 'Imported via automated script'
  };

  // 4. Create product import record
  console.log('\n💾 Creating product import record...');
  const { data: importRecord, error: importError } = await supabase
    .from('product_imports')
    .insert({
      source_file: path.basename(filePath),
      product_category: 'BizFibre Connect',
      imported_by: userId,
      status: 'pending',
      total_products: products.length,
      metadata,
      notes: `Imported ${products.length} products from ${path.basename(filePath)}`
    })
    .select()
    .single();

  if (importError) {
    console.error('❌ Error creating import record:', importError);
    throw importError;
  }

  console.log(`✅ Import record created: ${importRecord.id}`);

  // 5. Add products to approval queue
  console.log('\n📋 Adding products to approval queue...');
  const approvalQueueItems = products.map(product => ({
    import_id: importRecord.id,
    product_name: product.name,
    product_data: product,
    status: 'pending',
    priority: 'medium',
    approval_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
  }));

  const { data: queueItems, error: queueError } = await supabase
    .from('product_approval_queue')
    .insert(approvalQueueItems)
    .select();

  if (queueError) {
    console.error('❌ Error adding to approval queue:', queueError);
    throw queueError;
  }

  console.log(`✅ Added ${queueItems.length} products to approval queue`);

  // 6. Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary');
  console.log('='.repeat(60));
  console.log(`Import ID: ${importRecord.id}`);
  console.log(`Category: ${importRecord.product_category}`);
  console.log(`Products: ${importRecord.total_products}`);
  console.log(`Status: ${importRecord.status}`);
  console.log(`View in admin: /admin/products/approvals/${importRecord.id}`);
  console.log('='.repeat(60));

  return importRecord;
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node import-product-excel.js <path-to-excel> [user-id]');
    console.log('\nExample:');
    console.log('  node import-product-excel.js "docs/products/01_ACTIVE_PRODUCTS/BizFibreConnect/DFA Business Internet Access Service with ENNI-GNNI Infrastructure.xlsx"');
    process.exit(1);
  }

  const filePath = args[0];
  const userId = args[1] || null; // Optional user ID

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  importProductExcel(filePath, userId)
    .then(() => {
      console.log('\n✅ Import completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Import failed:', error.message);
      process.exit(1);
    });
}

module.exports = { importProductExcel };

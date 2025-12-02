/**
 * Import MTN Dealer Products from JSON file
 * Usage: node scripts/import-mtn-dealer-products.js
 */

const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const BATCH_SIZE = 500; // Import 500 at a time

async function importProducts() {
  console.log('📦 Loading JSON file...');
  
  const jsonPath = path.join(__dirname, '../docs/products/helios-ilula-business-promos-nov-2025.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  const promos = data.promos;
  console.log(`📊 Found ${promos.length} promos to import`);
  
  // Filter for current deals only (optional - remove if you want all)
  const today = new Date().toISOString().split('T')[0];
  const currentPromos = promos.filter(p => {
    const startDate = p.promo_start_date_mm_dd_yyyy;
    const endDate = p.promo_end_date_mm_dd_yyyy;
    return startDate <= today && (!endDate || endDate >= today);
  });
  
  console.log(`📅 ${currentPromos.length} are current deals (within promo period)`);
  
  // Use all promos or just current ones
  const promosToImport = promos; // Change to currentPromos if you only want active deals
  
  let totalImported = 0;
  let totalErrors = 0;
  
  // Process in batches
  for (let i = 0; i < promosToImport.length; i += BATCH_SIZE) {
    const batch = promosToImport.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(promosToImport.length / BATCH_SIZE);
    
    console.log(`\n🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} items)...`);
    
    try {
      const response = await fetch(`${API_URL}/api/admin/mtn-dealer-products/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promos: batch,
          source_file: data.metadata?.source || 'helios-ilula-business-promos-nov-2025.json',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        totalImported += result.data.imported_records;
        totalErrors += result.data.error_records;
        console.log(`   ✅ Imported: ${result.data.imported_records}, Errors: ${result.data.error_records}`);
      } else {
        console.log(`   ❌ Batch failed: ${result.error}`);
        totalErrors += batch.length;
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
      totalErrors += batch.length;
    }
    
    // Small delay between batches to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 IMPORT COMPLETE');
  console.log('='.repeat(50));
  console.log(`   Total processed: ${promosToImport.length}`);
  console.log(`   Successfully imported: ${totalImported}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log('='.repeat(50));
}

importProducts().catch(console.error);

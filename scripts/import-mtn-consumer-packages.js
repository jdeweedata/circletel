/**
 * Import MTN Consumer Packages
 *
 * Imports consumer-friendly MTN packages into the service_packages table.
 * Package data is maintained in scripts/data/mtn-consumer-packages.js
 *
 * Features:
 * - Consumer-friendly naming: "MTN Home [Tier] [Technology] [Speed]"
 * - Simplified descriptions
 * - Consumer-focused features (Family WiFi, Streaming, Gaming)
 * - No "Work Express" or business jargon
 * - Original pricing (before business 10% increase)
 *
 * Usage: node scripts/import-mtn-consumer-packages.js
 *
 * @module scripts/import-mtn-consumer-packages
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { consumerPackages, packageSummary } = require('./data/mtn-consumer-packages');

// ============================================================================
// CONFIGURATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a package already exists in the database
 * @param {string} name - Package name
 * @returns {Promise<boolean>} True if package exists
 */
async function packageExists(name) {
  const { data, error } = await supabase
    .from('service_packages')
    .select('id')
    .eq('name', name)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return !!data;
}

/**
 * Insert a package into the database
 * @param {Object} pkg - Package data
 * @returns {Promise<Object>} Inserted package data
 */
async function insertPackage(pkg) {
  const { data, error } = await supabase
    .from('service_packages')
    .insert([pkg])
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

/**
 * Log package import result
 * @param {Object} pkg - Package that was imported
 */
function logImportSuccess(pkg) {
  console.log(`✅ IMPORTED: ${pkg.name}`);
  console.log(`   Type: ${pkg.service_type.toUpperCase()} | Speed: ${pkg.speed_down} Mbps | Price: R${pkg.price}`);
  console.log(`   Tier: ${pkg.provider_specific_config.consumer_tier}\n`);
}

/**
 * Print final summary
 * @param {Object} counts - Import result counts
 */
function printSummary(counts) {
  console.log('\n=== Import Summary ===');
  console.log(`✅ Successfully imported: ${counts.success}`);
  console.log(`⚠️  Skipped: ${counts.skip}`);
  console.log(`❌ Errors: ${counts.error}`);
  console.log(`📊 Total processed: ${counts.total}`);

  if (counts.success > 0) {
    console.log('\n🎉 Consumer packages are now live on CircleTel!');
    console.log('Categories:');
    console.log(`  - 5G Uncapped: ${packageSummary.fiveG} packages`);
    console.log(`  - LTE Uncapped: ${packageSummary.lteUncapped} packages`);
    console.log(`  - LTE Capped: ${packageSummary.lteCapped} packages`);
    console.log(`  - Price range: R${packageSummary.priceRange.min}-R${packageSummary.priceRange.max}`);
  }
}

// ============================================================================
// MAIN IMPORT LOGIC
// ============================================================================

async function importConsumerPackages() {
  console.log('=== MTN Consumer Packages Import ===\n');
  console.log(`📦 Importing ${consumerPackages.length} consumer packages...\n`);

  const counts = { success: 0, skip: 0, error: 0, total: consumerPackages.length };

  for (const pkg of consumerPackages) {
    try {
      // Check for existing package
      if (await packageExists(pkg.name)) {
        console.log(`⚠️  SKIP: ${pkg.name} (already exists)`);
        counts.skip++;
        continue;
      }

      // Insert new package
      await insertPackage(pkg);
      logImportSuccess(pkg);
      counts.success++;
    } catch (error) {
      console.error(`❌ ERROR: ${pkg.name}`);
      console.error(`   ${error.message}\n`);
      counts.error++;
    }
  }

  printSummary(counts);
}

// ============================================================================
// ENTRY POINT
// ============================================================================

importConsumerPackages()
  .then(() => {
    console.log('\n✨ Consumer package import completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error);
    process.exit(1);
  });

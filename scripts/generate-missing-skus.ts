/**
 * Auto-Generate SKUs for Service Packages
 *
 * Generates unique SKUs for service_packages that don't have them
 * SKU format: Slugified package name in uppercase
 *
 * Usage:
 *   npx tsx scripts/generate-missing-skus.ts --dry-run
 *   npx tsx scripts/generate-missing-skus.ts
 */

import { createClient } from '@supabase/supabase-js';

// Parse command-line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Generate SKU from package name
 * Converts to uppercase, removes special chars, replaces spaces with hyphens
 */
function generateSKUFromName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Remove duplicate hyphens
    .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
}

/**
 * Ensure SKU is unique by appending a number if necessary
 */
async function ensureUniqueSKU(baseSKU: string, existingSKUs: Set<string>): Promise<string> {
  let sku = baseSKU;
  let counter = 1;

  // Check against existing SKUs in database and in current batch
  while (existingSKUs.has(sku)) {
    sku = `${baseSKU}-${counter.toString().padStart(2, '0')}`;
    counter++;
  }

  return sku;
}

/**
 * Main function to generate and update SKUs
 */
async function generateMissingSKUs() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Auto-Generate Missing SKUs');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Mode: ${isDryRun ? '🧪 DRY RUN' : '🚀 LIVE'}`);
  console.log('');

  // 1. Load all existing SKUs to ensure uniqueness
  const { data: allPackages, error: allError } = await supabase
    .from('service_packages')
    .select('sku')
    .not('sku', 'is', null)
    .neq('sku', '');

  if (allError) {
    console.error('❌ Failed to load existing SKUs:', allError.message);
    process.exit(1);
  }

  const existingSKUs = new Set(allPackages?.map(p => p.sku) || []);
  console.log(`📦 Found ${existingSKUs.size} existing SKUs in database`);
  console.log('');

  // 2. Query packages without SKUs
  const { data: packagesWithoutSKU, error: queryError } = await supabase
    .from('service_packages')
    .select('id, name, sku, status, service_type, provider')
    .or('sku.is.null,sku.eq.')
    .order('created_at', { ascending: false });

  if (queryError) {
    console.error('❌ Failed to query packages:', queryError.message);
    process.exit(1);
  }

  if (!packagesWithoutSKU || packagesWithoutSKU.length === 0) {
    console.log('✅ All packages already have SKUs!');
    process.exit(0);
  }

  console.log(`📋 Found ${packagesWithoutSKU.length} packages without SKUs`);
  console.log('');

  // 3. Generate SKUs for each package
  const updates: Array<{ id: string; name: string; oldSKU: string | null; newSKU: string; status: string }> = [];

  for (const pkg of packagesWithoutSKU) {
    const baseSKU = generateSKUFromName(pkg.name);
    const uniqueSKU = await ensureUniqueSKU(baseSKU, existingSKUs);

    // Add to existing SKUs set to prevent duplicates in this batch
    existingSKUs.add(uniqueSKU);

    updates.push({
      id: pkg.id,
      name: pkg.name,
      oldSKU: pkg.sku,
      newSKU: uniqueSKU,
      status: pkg.status,
    });

    console.log(`📝 ${pkg.name}`);
    console.log(`   Old SKU: ${pkg.sku || '(none)'}`);
    console.log(`   New SKU: ${uniqueSKU}`);
    console.log(`   Status:  ${pkg.status}`);
    console.log('');
  }

  // 4. Apply updates (or dry run)
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  if (isDryRun) {
    console.log('🧪 DRY RUN - No changes will be made');
    console.log('');
    console.log(`Would update ${updates.length} packages with generated SKUs`);
    console.log('Run without --dry-run to apply changes');
  } else {
    console.log('💾 Updating database...');
    console.log('');

    let successCount = 0;
    let failCount = 0;

    for (const update of updates) {
      const { error } = await supabase
        .from('service_packages')
        .update({ sku: update.newSKU })
        .eq('id', update.id);

      if (error) {
        console.error(`❌ Failed to update ${update.name}:`, error.message);
        failCount++;
      } else {
        console.log(`✅ Updated: ${update.name} → ${update.newSKU}`);
        successCount++;
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Summary');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`  Total Packages:  ${updates.length}`);
    console.log(`  ✅ Success:      ${successCount}`);
    console.log(`  ❌ Failed:       ${failCount}`);
    console.log('');

    if (failCount > 0) {
      process.exit(1);
    }
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
}

// Run the script
generateMissingSKUs().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

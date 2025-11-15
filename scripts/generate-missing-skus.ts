/**
 * Auto-Generate Standardized SKUs for Service Packages
 *
 * Generates unique, standardized SKUs for service_packages that don't have them
 *
 * SKU Format: {PROVIDER}-{CATEGORY}-{COUNTER}
 * - PROVIDER: MTN, SKY, BIZ, HOME, WLS, GEN
 * - CATEGORY: 5G, LTE, FBR (Fibre), WLS (Wireless), BIZ (Business), HME (Home), PKG (Generic)
 * - COUNTER: 3-digit sequential number (001, 002, 003...)
 *
 * Examples:
 *   MTN Home 5G → MTN-5G-001
 *   SkyFibre Home Lite → SKY-FBR-001
 *   BizFibre Connect Pro → BIZ-FBR-001
 *
 * Usage:
 *   npm run zoho:generate-skus:dry-run  # Preview changes
 *   npm run zoho:generate-skus          # Apply changes
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

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
 * Extract provider from package name
 */
function extractProvider(name: string, provider?: string): string {
  if (provider) return provider.toUpperCase();

  const nameLower = name.toLowerCase();
  if (nameLower.includes('mtn')) return 'MTN';
  if (nameLower.includes('skyfibre') || nameLower.includes('sky')) return 'SKY';
  if (nameLower.includes('bizfibre')) return 'BIZ';
  if (nameLower.includes('homefibre')) return 'HOME';
  if (nameLower.includes('wireless')) return 'WLS';

  return 'GEN'; // Generic
}

/**
 * Extract category from package name
 */
function extractCategory(name: string, serviceType?: string): string {
  const nameLower = name.toLowerCase();

  // Service type priority
  if (serviceType) {
    const type = serviceType.toLowerCase();
    if (type.includes('5g')) return '5G';
    if (type.includes('lte')) return 'LTE';
    if (type.includes('fibre')) return 'FBR';
    if (type.includes('wireless')) return 'WLS';
  }

  // Fallback to name analysis
  if (nameLower.includes('5g')) return '5G';
  if (nameLower.includes('lte')) return 'LTE';
  if (nameLower.includes('fibre')) return 'FBR';
  if (nameLower.includes('wireless')) return 'WLS';
  if (nameLower.includes('business') || nameLower.includes('biz')) return 'BIZ';
  if (nameLower.includes('home')) return 'HME';

  return 'PKG'; // Generic package
}

/**
 * Generate standardized SKU
 * Format: {PROVIDER}-{CATEGORY}-{COUNTER}
 * Example: MTN-5G-001, SKY-FBR-042, BIZ-HME-015
 */
function generateStandardizedSKU(
  name: string,
  provider?: string,
  serviceType?: string,
  existingSKUs: Set<string> = new Set()
): string {
  const providerCode = extractProvider(name, provider);
  const categoryCode = extractCategory(name, serviceType);

  // Find next available counter for this provider-category combination
  const prefix = `${providerCode}-${categoryCode}-`;
  let counter = 1;

  // Check existing SKUs to find the highest counter
  for (const sku of existingSKUs) {
    if (sku.startsWith(prefix)) {
      const parts = sku.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num >= counter) {
          counter = num + 1;
        }
      }
    }
  }

  return `${prefix}${counter.toString().padStart(3, '0')}`;
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
  const updates: Array<{ id: string; name: string; oldSKU: string | null; newSKU: string; status: string; provider: string; serviceType: string }> = [];

  for (const pkg of packagesWithoutSKU) {
    const newSKU = generateStandardizedSKU(pkg.name, pkg.provider, pkg.service_type, existingSKUs);

    // Add to existing SKUs set to prevent duplicates in this batch
    existingSKUs.add(newSKU);

    updates.push({
      id: pkg.id,
      name: pkg.name,
      oldSKU: pkg.sku,
      newSKU: newSKU,
      status: pkg.status,
      provider: pkg.provider || 'N/A',
      serviceType: pkg.service_type || 'N/A',
    });

    console.log(`📝 ${pkg.name}`);
    console.log(`   Provider:    ${pkg.provider || '(detected from name)'}`);
    console.log(`   Service Type: ${pkg.service_type || '(detected from name)'}`);
    console.log(`   Old SKU:      ${pkg.sku || '(none)'}`);
    console.log(`   New SKU:      ${newSKU}`);
    console.log(`   Status:       ${pkg.status}`);
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

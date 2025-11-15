/**
 * Backfill Script for Zoho Billing Sync
 *
 * Syncs all existing service_packages to Zoho Billing (Plans and Items)
 * Updates product_integrations table with Billing IDs
 *
 * Epic 3.4 - Backfill Script for Zoho Billing
 *
 * Usage:
 *   npx tsx scripts/backfill-zoho-billing.ts
 *   npx tsx scripts/backfill-zoho-billing.ts --dry-run
 *   npx tsx scripts/backfill-zoho-billing.ts --filter=active
 *   npx tsx scripts/backfill-zoho-billing.ts --limit=10
 */

import { createClient } from '@supabase/supabase-js';
import { syncServicePackageToZohoBilling, type BillingSyncResult } from '@/lib/integrations/zoho/billing-sync-service';

// Parse command-line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const filterArg = args.find(arg => arg.startsWith('--filter='));
const limitArg = args.find(arg => arg.startsWith('--limit='));

const statusFilter = filterArg ? filterArg.split('=')[1] : 'active'; // Default: active only
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;

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
 * Update product_integrations table with Billing sync result
 */
async function updateProductIntegrations(servicePackageId: string, billingResult: BillingSyncResult) {
  if (isDryRun) {
    console.log('   [DRY RUN] Would update product_integrations:', {
      service_package_id: servicePackageId,
      plan_id: billingResult.planId,
      item_id: billingResult.installationItemId,
      hardware_id: billingResult.hardwareItemId,
    });
    return;
  }

  try {
    const updateData = billingResult.success
      ? {
          zoho_billing_plan_id: billingResult.planId,
          zoho_billing_item_id: billingResult.installationItemId,
          zoho_billing_hardware_item_id: billingResult.hardwareItemId || null,
          zoho_billing_sync_status: 'ok' as const,
          zoho_billing_last_synced_at: new Date().toISOString(),
          zoho_billing_last_sync_error: null,
        }
      : {
          zoho_billing_sync_status: 'failed' as const,
          zoho_billing_last_sync_error: billingResult.error || 'Unknown error',
        };

    const { error } = await supabase
      .from('product_integrations')
      .update(updateData)
      .eq('service_package_id', servicePackageId);

    if (error) {
      console.error('   ❌ Failed to update product_integrations:', error.message);
    }
  } catch (error: any) {
    console.error('   ❌ Error updating product_integrations:', error.message);
  }
}

/**
 * Main backfill function
 */
async function backfillZohoBilling() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Zoho Billing Backfill Script');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Mode:           ${isDryRun ? '🧪 DRY RUN' : '🚀 LIVE'}`);
  console.log(`  Status Filter:  ${statusFilter}`);
  console.log(`  Limit:          ${limit || 'No limit'}`);
  console.log('');

  // 1. Query service_packages
  let query = supabase
    .from('service_packages')
    .select('id, sku, name, price, status, pricing, metadata, service_type, product_category, market_segment, provider, speed_down, speed_up, cost_price_zar, active, valid_from, valid_to, is_featured, promotion_price, description')
    .order('created_at', { ascending: false });

  if (statusFilter === 'active') {
    query = query.eq('status', 'active');
  } else if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data: packages, error: queryError } = await query;

  if (queryError) {
    console.error('❌ Failed to query service_packages:', queryError.message);
    process.exit(1);
  }

  if (!packages || packages.length === 0) {
    console.log('ℹ️  No service_packages found matching filter');
    process.exit(0);
  }

  console.log(`📦 Found ${packages.length} service_packages to sync`);
  console.log('');

  // 2. Sync each package
  const results = {
    total: packages.length,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [] as Array<{ sku: string; name: string; error: string }>,
  };

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    const progress = `[${i + 1}/${packages.length}]`;

    console.log(`${progress} ${pkg.sku} - ${pkg.name}`);

    try {
      if (isDryRun) {
        console.log('   [DRY RUN] Would sync to Zoho Billing');
        results.skipped++;
        continue;
      }

      // Sync to Zoho Billing
      const billingResult = await syncServicePackageToZohoBilling(pkg);

      if (billingResult.success) {
        console.log('   ✅ Synced successfully');
        console.log(`      Plan ID: ${billingResult.planId}`);
        console.log(`      Installation Item ID: ${billingResult.installationItemId}`);
        if (billingResult.hardwareItemId) {
          console.log(`      Hardware Item ID: ${billingResult.hardwareItemId}`);
        }

        // Update product_integrations
        await updateProductIntegrations(pkg.id, billingResult);

        results.success++;
      } else {
        console.error(`   ❌ Sync failed: ${billingResult.error}`);
        results.failed++;
        results.errors.push({
          sku: pkg.sku,
          name: pkg.name,
          error: billingResult.error || 'Unknown error',
        });

        // Update product_integrations with error
        await updateProductIntegrations(pkg.id, billingResult);
      }
    } catch (error: any) {
      console.error(`   ❌ Exception: ${error.message}`);
      results.failed++;
      results.errors.push({
        sku: pkg.sku,
        name: pkg.name,
        error: error.message,
      });

      // Update product_integrations with error
      await updateProductIntegrations(pkg.id, {
        success: false,
        error: error.message,
      });
    }

    // Add delay to avoid rate limiting (100ms between requests)
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 3. Print summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Backfill Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Total Packages:  ${results.total}`);
  console.log(`  ✅ Success:      ${results.success}`);
  console.log(`  ❌ Failed:       ${results.failed}`);
  console.log(`  ⏭️  Skipped:      ${results.skipped}`);
  console.log('');

  if (results.errors.length > 0) {
    console.log('Errors:');
    console.log('');
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.sku} - ${error.name}`);
      console.log(`     ${error.error}`);
    });
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  if (isDryRun) {
    console.log('ℹ️  This was a DRY RUN - no changes were made');
    console.log('   Run without --dry-run to perform actual sync');
    console.log('');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the backfill
backfillZohoBilling().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

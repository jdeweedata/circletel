#!/usr/bin/env tsx
/**
 * ZOHO Billing Subscription Backfill Script
 *
 * Syncs all active CircleTel services to ZOHO Billing Subscriptions
 * Prerequisites: Customers must be synced first
 *
 * Usage:
 *   npx tsx scripts/zoho-backfill-subscriptions.ts [--dry-run] [--batch-size=5]
 *
 * Options:
 *   --dry-run       Simulate without actually syncing to ZOHO
 *   --batch-size=N  Process N subscriptions at a time (default: 5)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';
import { syncSubscriptionToZohoBilling } from '../lib/integrations/zoho/subscription-sync-service';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 5;

interface CustomerService {
  id: string;
  customer_id: string;
  service_package_id: string;
  status: string;
  activation_date: string | null;
  monthly_price: number | null;
  zoho_subscription_id: string | null;
  customer: {
    email: string;
    account_number: string;
    zoho_billing_customer_id: string | null;
    account_type: string;
  };
  package: {
    product_name: string;
  };
}

interface SyncResult {
  success: boolean;
  zoho_subscription_id?: string;
  error?: string;
  dry_run?: boolean;
}

/**
 * Sync service to ZOHO Billing Subscription
 */
async function syncService(service: CustomerService, index: number, total: number): Promise<SyncResult> {
  console.log(`\n[${index + 1}/${total}] Processing service: ${service.package.product_name}`);
  console.log(`  Customer: ${service.customer.email} (${service.customer.account_number})`);
  console.log(`  Status: ${service.status}`);
  console.log(`  Monthly Price: R${service.monthly_price || 0}`);

  // Skip if customer is internal_test
  if (service.customer.account_type === 'internal_test') {
    console.log(`  ⏭️  Skipped: Internal test account`);
    return { success: true, error: 'Internal test account - skipped' };
  }

  // Skip if customer not synced to ZOHO
  if (!service.customer.zoho_billing_customer_id) {
    console.log(`  ⚠️  Skipped: Customer not synced to ZOHO yet`);
    return { success: false, error: 'Customer not synced to ZOHO - sync customers first' };
  }

  if (isDryRun) {
    console.log('  🔍 DRY RUN: Would create ZOHO subscription');
    return { success: true, dry_run: true };
  }

  try {
    const result = await syncSubscriptionToZohoBilling(service.id);

    if (result.success) {
      console.log(`  ✅ Created ZOHO subscription: ${result.zoho_subscription_id}`);
    } else {
      console.error(`  ❌ Failed: ${result.error}`);
    }

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  ❌ Failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Process services in batches
 */
async function processInBatches(services: CustomerService[]) {
  const results = {
    total: services.length,
    synced: 0,
    skipped: 0,
    failed: 0,
    errors: [] as Array<{ service: string; customer: string; error: string }>
  };

  for (let i = 0; i < services.length; i += batchSize) {
    const batch = services.slice(i, Math.min(i + batchSize, services.length));
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(services.length / batchSize);

    console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} services)`);

    // Process batch sequentially
    for (let idx = 0; idx < batch.length; idx++) {
      const service = batch[idx];
      const result = await syncService(service, i + idx, services.length);

      if (result.success) {
        if (result.dry_run || result.error?.includes('skipped')) {
          results.skipped++;
        } else {
          results.synced++;
        }
      } else {
        results.failed++;
        results.errors.push({
          service: service.package.product_name,
          customer: service.customer.email,
          error: result.error || 'Unknown error'
        });
      }

      // Delay between services (500ms)
      if (idx < batch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Delay between batches (2 seconds)
    if (i + batchSize < services.length) {
      console.log('\n⏳ Waiting 2 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * Main backfill function
 */
async function main() {
  console.log('\n🔄 ZOHO Billing Subscription Backfill');
  console.log('═'.repeat(60));
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN' : '✅ LIVE SYNC'}`);
  console.log(`Batch Size: ${batchSize} subscriptions per batch`);
  console.log('═'.repeat(60));

  // Fetch all active services
  console.log('\n📊 Fetching active services...');

  const { data: services, error: fetchError } = await supabase
    .from('customer_services')
    .select(`
      id,
      customer_id,
      service_package_id,
      status,
      activation_date,
      monthly_price,
      zoho_subscription_id,
      customer:customers!inner(
        email,
        account_number,
        zoho_billing_customer_id,
        account_type
      ),
      package:service_packages!inner(
        product_name
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('❌ Error fetching services:', fetchError);
    process.exit(1);
  }

  if (!services || services.length === 0) {
    console.log('✅ No active services found');
    return;
  }

  // Filter out internal_test accounts
  const productionServices = services.filter(
    s => s.customer && s.customer.account_type !== 'internal_test'
  );

  const needingSync = productionServices.filter(s => !s.zoho_subscription_id);
  const alreadySynced = productionServices.filter(s => s.zoho_subscription_id);

  console.log(`\n📈 Subscription Status:`);
  console.log(`  Total Active Services: ${productionServices.length}`);
  console.log(`  Already Synced: ${alreadySynced.length}`);
  console.log(`  Needing Sync: ${needingSync.length}`);

  if (needingSync.length === 0) {
    console.log('\n✅ All active services already synced to ZOHO!');
    return;
  }

  // Process services
  console.log(`\n🚀 Starting subscription sync...`);
  const startTime = Date.now();

  const results = await processInBatches(needingSync);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Display results
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 Backfill Results');
  console.log('═'.repeat(60));
  console.log(`Total Services: ${results.total}`);
  console.log(`✅ Successfully Synced: ${results.synced}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏱️  Duration: ${duration} seconds`);

  if (results.errors.length > 0) {
    console.log(`\n❌ Failed Services:`);
    results.errors.forEach(({ service, customer, error }) => {
      console.log(`  - ${service} (${customer}): ${error}`);
    });
  }

  if (isDryRun) {
    console.log(`\n🔍 This was a DRY RUN. No actual changes were made to ZOHO.`);
  } else {
    console.log(`\n✅ Subscription backfill complete!`);
  }
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

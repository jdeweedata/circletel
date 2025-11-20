#!/usr/bin/env tsx
/**
 * ZOHO Billing Customer Backfill Script
 *
 * Syncs all production CircleTel customers to ZOHO Billing
 * Excludes internal_test accounts
 *
 * Usage:
 *   npm run tsx scripts/zoho-backfill-customers.ts [--dry-run] [--batch-size=10]
 *   npx tsx scripts/zoho-backfill-customers.ts [--dry-run]
 *
 * Options:
 *   --dry-run       Simulate without actually syncing to ZOHO
 *   --batch-size=N  Process N customers at a time (default: 10)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';
import { syncCustomerToZohoBilling } from '../lib/integrations/zoho/customer-sync-service';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
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
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 10;

interface Customer {
  id: string;
  account_number: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  account_type: string;
  zoho_billing_customer_id: string | null;
}

interface SyncResult {
  success: boolean;
  zoho_customer_id?: string;
  error?: string;
  dry_run?: boolean;
}

/**
 * Sync customer to ZOHO Billing (simulated for dry-run)
 */
async function syncCustomer(customer: Customer, index: number, total: number): Promise<SyncResult> {
  console.log(`\n[${index + 1}/${total}] Processing customer: ${customer.email}`);
  console.log(`  Account: ${customer.account_number}`);
  console.log(`  Type: ${customer.account_type}`);
  console.log(`  Name: ${customer.first_name || ''} ${customer.last_name || ''}`);

  if (isDryRun) {
    console.log('  🔍 DRY RUN: Would sync to ZOHO Billing');
    return { success: true, dry_run: true };
  }

  try {
    // Call the sync service function directly
    const result = await syncCustomerToZohoBilling(customer.id);

    if (result.success) {
      console.log(`  ✅ Synced to ZOHO: ${result.zoho_customer_id}`);
    } else {
      console.error(`  ❌ Failed to sync: ${result.error}`);
    }

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  ❌ Failed to sync: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Process customers in batches with delay between batches
 */
async function processInBatches(customers: Customer[]) {
  const results = {
    total: customers.length,
    synced: 0,
    skipped: 0,
    failed: 0,
    errors: [] as Array<{ customer: string; error: string }>
  };

  for (let i = 0; i < customers.length; i += batchSize) {
    const batch = customers.slice(i, Math.min(i + batchSize, customers.length));
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(customers.length / batchSize);

    console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} customers)`);

    // Process batch sequentially to avoid overwhelming ZOHO API
    for (let idx = 0; idx < batch.length; idx++) {
      const customer = batch[idx];
      const result = await syncCustomer(customer, i + idx, customers.length);

      if (result.success) {
        results.synced++;
      } else {
        results.failed++;
        results.errors.push({
          customer: customer.email,
          error: result.error || 'Unknown error'
        });
      }

      // Small delay between customers within a batch (500ms)
      if (idx < batch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Delay between batches to avoid rate limiting (2 seconds)
    if (i + batchSize < customers.length) {
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
  console.log('\n🔄 ZOHO Billing Customer Backfill');
  console.log('═'.repeat(60));
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN' : '✅ LIVE SYNC'}`);
  console.log(`Batch Size: ${batchSize} customers per batch`);
  console.log('═'.repeat(60));

  // Step 1: Fetch all production customers (exclude internal_test)
  console.log('\n📊 Fetching production customers...');

  const { data: customers, error: fetchError } = await supabase
    .from('customers')
    .select('id, account_number, email, first_name, last_name, account_type, zoho_billing_customer_id')
    .neq('account_type', 'internal_test')
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('❌ Error fetching customers:', fetchError);
    process.exit(1);
  }

  if (!customers) {
    console.error('❌ No customers found');
    process.exit(1);
  }

  const needingSync = customers.filter(c => !c.zoho_billing_customer_id);
  const alreadySynced = customers.filter(c => c.zoho_billing_customer_id);

  console.log(`\n📈 Customer Status:`);
  console.log(`  Total Production: ${customers.length}`);
  console.log(`  Already Synced: ${alreadySynced.length}`);
  console.log(`  Needing Sync: ${needingSync.length}`);

  if (needingSync.length === 0) {
    console.log('\n✅ All customers already synced to ZOHO!');
    return;
  }

  // Step 2: Process customers in batches
  console.log(`\n🚀 Starting customer sync...`);
  const startTime = Date.now();

  const results = await processInBatches(needingSync);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Step 3: Display results
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 Backfill Results');
  console.log('═'.repeat(60));
  console.log(`Total Customers: ${results.total}`);
  console.log(`✅ Successfully Synced: ${results.synced}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏱️  Duration: ${duration} seconds`);

  if (results.errors.length > 0) {
    console.log(`\n❌ Failed Customers:`);
    results.errors.forEach(({ customer, error }) => {
      console.log(`  - ${customer}: ${error}`);
    });
  }

  if (isDryRun) {
    console.log(`\n🔍 This was a DRY RUN. No actual changes were made to ZOHO.`);
    console.log(`   Remove --dry-run flag to perform actual sync.`);
  } else {
    console.log(`\n✅ Customer backfill complete!`);
  }
}

// Run the script
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

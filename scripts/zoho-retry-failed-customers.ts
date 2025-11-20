#!/usr/bin/env tsx
/**
 * ZOHO Billing Failed Customer Retry Script
 *
 * Retries syncing customers that failed during backfill
 * Only processes customers with zoho_sync_status = 'failed'
 *
 * Usage:
 *   npx tsx scripts/zoho-retry-failed-customers.ts [--dry-run]
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
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  account_number: string;
  account_type: string;
  zoho_billing_customer_id: string | null;
  zoho_sync_status: string | null;
}

async function main() {
  console.log('\n🔄 ZOHO Billing Failed Customer Retry');
  console.log('═'.repeat(60));
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN' : '✅ LIVE SYNC'}`);
  console.log('═'.repeat(60));

  // Fetch failed customers
  console.log('\n📊 Fetching failed customers...');

  const { data: customers, error: fetchError } = await supabase
    .from('customers')
    .select('id, email, first_name, last_name, account_number, account_type, zoho_billing_customer_id, zoho_sync_status')
    .eq('zoho_sync_status', 'failed')
    .neq('account_type', 'internal_test')
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('❌ Error fetching customers:', fetchError);
    process.exit(1);
  }

  if (!customers || customers.length === 0) {
    console.log('✅ No failed customers found!');
    console.log('All customers successfully synced.');
    return;
  }

  console.log(`\n📈 Found ${customers.length} failed customer(s):\n`);
  customers.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.email || '(no email)'} - ${c.account_number}`);
  });

  if (isDryRun) {
    console.log('\n🔍 DRY RUN: Would retry these customers');
    return;
  }

  console.log(`\n🚀 Starting retry...`);
  const startTime = Date.now();

  const results = {
    total: customers.length,
    synced: 0,
    failed: 0,
    errors: [] as Array<{ email: string; error: string }>
  };

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];

    console.log(`\n[${i + 1}/${customers.length}] Retrying: ${customer.email}`);
    console.log(`  Account: ${customer.account_number}`);
    console.log(`  Name: ${customer.first_name} ${customer.last_name}`);

    try {
      const result = await syncCustomerToZohoBilling(customer.id);

      if (result.success) {
        console.log(`  ✅ Successfully synced: ${result.zoho_customer_id}`);
        results.synced++;
      } else {
        console.log(`  ❌ Failed: ${result.error}`);
        results.failed++;
        results.errors.push({
          email: customer.email,
          error: result.error || 'Unknown error'
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      console.log(`  ❌ Exception: ${errorMessage}`);
      results.failed++;
      results.errors.push({
        email: customer.email,
        error: errorMessage
      });
    }

    // Add 2 second delay between retries to avoid rate limiting
    if (i < customers.length - 1) {
      console.log('  ⏳ Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 Retry Results');
  console.log('═'.repeat(60));
  console.log(`Total Attempted: ${results.total}`);
  console.log(`✅ Successfully Synced: ${results.synced}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏱️  Duration: ${duration} seconds`);

  if (results.errors.length > 0) {
    console.log('\n❌ Failed Customers:');
    results.errors.forEach(e => {
      console.log(`  - ${e.email}: ${e.error}`);
    });
  }

  console.log('');

  if (results.failed === 0) {
    console.log('✅ All failed customers successfully synced!');
  } else {
    console.log('⚠️  Some customers still failed. Check errors above.');
    console.log('If rate limited, wait 10-15 minutes and retry again.');
  }

  process.exit(results.failed === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

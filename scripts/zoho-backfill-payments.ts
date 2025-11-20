#!/usr/bin/env tsx
/**
 * ZOHO Billing Payment Backfill Script
 *
 * Syncs completed CircleTel payments to ZOHO Billing
 * Records payments and links them to invoices for reconciliation
 *
 * Usage:
 *   npx tsx scripts/zoho-backfill-payments.ts [--dry-run] [--batch-size=10]
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';
import { syncPaymentToZohoBilling } from '../lib/integrations/zoho/payment-sync-service';

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
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 10;

interface Payment {
  id: string;
  transaction_reference: string | null;
  payment_method: string;
  amount: number;
  status: string;
  zoho_payment_id: string | null;
  customer: {
    email: string;
    account_number: string;
    zoho_billing_customer_id: string | null;
    account_type: string;
  };
}

async function syncPayment(payment: Payment, index: number, total: number) {
  console.log(`\n[${index + 1}/${total}] Processing payment: ${payment.transaction_reference || payment.id.substring(0, 8)}`);
  console.log(`  Customer: ${payment.customer.email}`);
  console.log(`  Method: ${payment.payment_method}`);
  console.log(`  Amount: R${payment.amount}`);

  if (payment.customer.account_type === 'internal_test') {
    console.log(`  ⏭️  Skipped: Internal test account`);
    return { success: true, error: 'Internal test account - skipped' };
  }

  if (!payment.customer.zoho_billing_customer_id) {
    console.log(`  ⚠️  Skipped: Customer not synced to ZOHO`);
    return { success: false, error: 'Customer not synced' };
  }

  if (isDryRun) {
    console.log('  🔍 DRY RUN: Would record ZOHO payment');
    return { success: true, dry_run: true };
  }

  try {
    const result = await syncPaymentToZohoBilling(payment.id);
    if (result.success) {
      console.log(`  ✅ Recorded ZOHO payment: ${result.zoho_payment_id}`);
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

async function main() {
  console.log('\n🔄 ZOHO Billing Payment Backfill');
  console.log('═'.repeat(60));
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN' : '✅ LIVE SYNC'}`);
  console.log(`Batch Size: ${batchSize}`);
  console.log('═'.repeat(60));

  console.log('\n📊 Fetching completed payments...');

  const { data: payments, error: fetchError } = await supabase
    .from('payment_transactions')
    .select(`
      id,
      transaction_reference,
      payment_method,
      amount,
      status,
      zoho_payment_id,
      customer:customers!inner(
        email,
        account_number,
        zoho_billing_customer_id,
        account_type
      )
    `)
    .eq('status', 'completed')
    .order('processed_at', { ascending: true });

  if (fetchError) {
    console.error('❌ Error fetching payments:', fetchError);
    process.exit(1);
  }

  if (!payments || payments.length === 0) {
    console.log('✅ No completed payments found');
    return;
  }

  const productionPayments = payments.filter(
    pmt => pmt.customer && pmt.customer.account_type !== 'internal_test'
  );

  const needingSync = productionPayments.filter(pmt => !pmt.zoho_payment_id);
  const alreadySynced = productionPayments.filter(pmt => pmt.zoho_payment_id);

  console.log(`\n📈 Payment Status:`);
  console.log(`  Total Completed Payments: ${productionPayments.length}`);
  console.log(`  Already Synced: ${alreadySynced.length}`);
  console.log(`  Needing Sync: ${needingSync.length}`);

  if (needingSync.length === 0) {
    console.log('\n✅ All completed payments already synced!');
    return;
  }

  console.log(`\n🚀 Starting payment sync...`);
  const startTime = Date.now();

  const results = {
    total: needingSync.length,
    synced: 0,
    skipped: 0,
    failed: 0,
    errors: [] as Array<{ payment: string; error: string }>
  };

  for (let i = 0; i < needingSync.length; i++) {
    const payment = needingSync[i];
    const result = await syncPayment(payment, i, needingSync.length);

    if (result.success) {
      if (result.dry_run || result.error?.includes('skipped')) {
        results.skipped++;
      } else {
        results.synced++;
      }
    } else {
      results.failed++;
      results.errors.push({
        payment: payment.transaction_reference || payment.id.substring(0, 8),
        error: result.error || 'Unknown error'
      });
    }

    // Delay between payments (500ms)
    if (i < needingSync.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 Backfill Results');
  console.log('═'.repeat(60));
  console.log(`Total Payments: ${results.total}`);
  console.log(`✅ Successfully Synced: ${results.synced}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏱️  Duration: ${duration} seconds`);

  if (results.errors.length > 0) {
    console.log(`\n❌ Failed Payments:`);
    results.errors.forEach(({ payment, error }) => {
      console.log(`  - ${payment}: ${error}`);
    });
  }

  if (isDryRun) {
    console.log(`\n🔍 This was a DRY RUN. No actual changes were made.`);
  } else {
    console.log(`\n✅ Payment backfill complete!`);
  }
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

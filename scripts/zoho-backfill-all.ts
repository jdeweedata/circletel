#!/usr/bin/env tsx
/**
 * ZOHO Billing Master Backfill Orchestrator
 *
 * Runs all ZOHO Billing backfill scripts in the correct order:
 * 1. Customers (prerequisite for all others)
 * 2. Subscriptions (requires customers)
 * 3. Invoices (requires customers)
 * 4. Payments (requires customers and invoices)
 *
 * Usage:
 *   npx tsx scripts/zoho-backfill-all.ts [--dry-run] [--skip-customers] [--skip-subscriptions] [--skip-invoices] [--skip-payments]
 *
 * Options:
 *   --dry-run              Simulate without actually syncing
 *   --skip-customers       Skip customer backfill
 *   --skip-subscriptions   Skip subscription backfill
 *   --skip-invoices        Skip invoice backfill
 *   --skip-payments        Skip payment backfill
 *
 * Examples:
 *   # Dry-run full backfill
 *   npx tsx scripts/zoho-backfill-all.ts --dry-run
 *
 *   # Run only subscriptions (customers already synced)
 *   npx tsx scripts/zoho-backfill-all.ts --skip-customers --skip-invoices --skip-payments
 *
 *   # Live sync everything
 *   npx tsx scripts/zoho-backfill-all.ts
 */

import { spawn } from 'child_process';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const skipCustomers = args.includes('--skip-customers');
const skipSubscriptions = args.includes('--skip-subscriptions');
const skipInvoices = args.includes('--skip-invoices');
const skipPayments = args.includes('--skip-payments');

interface BackfillResult {
  phase: string;
  success: boolean;
  duration: number;
  output: string;
  error?: string;
}

/**
 * Run a backfill script as a child process
 */
async function runBackfillScript(scriptName: string, phase: string): Promise<BackfillResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const scriptArgs = isDryRun ? ['--dry-run'] : [];

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🚀 Starting ${phase}...`);
    console.log(`${'═'.repeat(60)}`);

    const child = spawn('npx', ['tsx', `scripts/${scriptName}`, ...scriptArgs], {
      stdio: 'inherit',
      shell: true
    });

    let output = '';

    child.on('error', (error) => {
      resolve({
        phase,
        success: false,
        duration: Date.now() - startTime,
        output,
        error: error.message
      });
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;

      if (success) {
        console.log(`\n✅ ${phase} completed successfully in ${(duration / 1000).toFixed(2)}s`);
      } else {
        console.error(`\n❌ ${phase} failed with code ${code}`);
      }

      resolve({
        phase,
        success,
        duration,
        output,
        error: code !== 0 ? `Exit code ${code}` : undefined
      });
    });
  });
}

/**
 * Main orchestration function
 */
async function main() {
  const startTime = Date.now();
  const results: BackfillResult[] = [];

  console.log('\n');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(58) + '║');
  console.log('║' + '  ZOHO Billing Master Backfill Orchestrator'.padEnd(58) + '║');
  console.log('║' + ' '.repeat(58) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log('\n📋 Configuration:');
  console.log(`   Mode: ${isDryRun ? '🔍 DRY RUN' : '✅ LIVE SYNC'}`);
  console.log(`   Skip Customers: ${skipCustomers ? 'Yes' : 'No'}`);
  console.log(`   Skip Subscriptions: ${skipSubscriptions ? 'Yes' : 'No'}`);
  console.log(`   Skip Invoices: ${skipInvoices ? 'Yes' : 'No'}`);
  console.log(`   Skip Payments: ${skipPayments ? 'Yes' : 'No'}`);
  console.log('');

  // Phase 1: Customers
  if (!skipCustomers) {
    const result = await runBackfillScript(
      'zoho-backfill-customers.ts',
      'Phase 1: Customer Backfill'
    );
    results.push(result);

    if (!result.success) {
      console.error('\n❌ Customer backfill failed. Aborting remaining phases.');
      console.error('   Fix the errors and run again, or use --skip-customers if already synced.');
      await printSummary(results, startTime);
      process.exit(1);
    }
  } else {
    console.log('\n⏭️  Skipping Phase 1: Customer Backfill');
  }

  // Small delay between phases
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Phase 2: Subscriptions
  if (!skipSubscriptions) {
    const result = await runBackfillScript(
      'zoho-backfill-subscriptions.ts',
      'Phase 2: Subscription Backfill'
    );
    results.push(result);

    if (!result.success) {
      console.error('\n⚠️  Subscription backfill had errors. Continuing with remaining phases...');
    }
  } else {
    console.log('\n⏭️  Skipping Phase 2: Subscription Backfill');
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Phase 3: Invoices
  if (!skipInvoices) {
    const result = await runBackfillScript(
      'zoho-backfill-invoices.ts',
      'Phase 3: Invoice Backfill'
    );
    results.push(result);

    if (!result.success) {
      console.error('\n⚠️  Invoice backfill had errors. Continuing with payments...');
    }
  } else {
    console.log('\n⏭️  Skipping Phase 3: Invoice Backfill');
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Phase 4: Payments
  if (!skipPayments) {
    const result = await runBackfillScript(
      'zoho-backfill-payments.ts',
      'Phase 4: Payment Backfill'
    );
    results.push(result);

    if (!result.success) {
      console.error('\n⚠️  Payment backfill had errors.');
    }
  } else {
    console.log('\n⏭️  Skipping Phase 4: Payment Backfill');
  }

  // Print final summary
  await printSummary(results, startTime);
}

/**
 * Print final summary of all backfill phases
 */
async function printSummary(results: BackfillResult[], startTime: number) {
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const allSucceeded = results.every(r => r.success);
  const someSucceeded = results.some(r => r.success);

  console.log('\n');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(58) + '║');
  console.log('║' + '  📊 Backfill Summary'.padEnd(58) + '║');
  console.log('║' + ' '.repeat(58) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log('');

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const duration = (result.duration / 1000).toFixed(2);
    console.log(`${status} ${result.phase}`);
    console.log(`   Duration: ${duration}s`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });

  console.log('═'.repeat(60));
  console.log(`Total Duration: ${totalDuration}s`);
  console.log(`Phases Completed: ${results.filter(r => r.success).length}/${results.length}`);
  console.log('═'.repeat(60));

  if (isDryRun) {
    console.log('\n🔍 This was a DRY RUN. No actual changes were made to ZOHO.');
    console.log('   Remove --dry-run flag to perform actual sync.');
  } else if (allSucceeded) {
    console.log('\n✅ All backfill phases completed successfully!');
    console.log('\n📊 Next Steps:');
    console.log('   1. Verify data in ZOHO Billing dashboard');
    console.log('   2. Check sync logs at /admin/zoho-sync');
    console.log('   3. Monitor sync status for any failures');
  } else if (someSucceeded) {
    console.log('\n⚠️  Some backfill phases completed, but there were errors.');
    console.log('   Review the logs above and retry failed phases.');
  } else {
    console.log('\n❌ Backfill failed. Please review the errors above.');
  }

  console.log('');
}

// Run the orchestrator
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

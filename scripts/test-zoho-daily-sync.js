/**
 * Test Script for Zoho Daily Sync Cron Job
 *
 * Tests the /api/cron/zoho-sync endpoint locally
 *
 * Usage:
 *   node scripts/test-zoho-daily-sync.js              # Test with dry-run
 *   node scripts/test-zoho-daily-sync.js --live       # Run actual sync
 *   node scripts/test-zoho-daily-sync.js --limit=5    # Limit to 5 products
 */

require('dotenv').config({ path: '.env.local' });

const args = process.argv.slice(2);
const isDryRun = !args.includes('--live');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;

console.log('═══════════════════════════════════════════════════════════');
console.log('ZOHO DAILY SYNC - LOCAL TEST');
console.log('═══════════════════════════════════════════════════════════');
console.log();
console.log(`Mode:        ${isDryRun ? '🧪 DRY RUN' : '🚀 LIVE'}`);
console.log(`Limit:       ${limit || 'No limit (100 max in cron)'}`);
console.log(`Base URL:    http://localhost:3000`);
console.log();

async function testCronEndpoint() {
  try {
    // Build URL with query params for testing
    let url = 'http://localhost:3000/api/cron/zoho-sync';
    const params = new URLSearchParams();

    if (isDryRun) {
      params.append('dryRun', 'true');
    }

    if (limit) {
      params.append('maxProducts', limit.toString());
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log('Making request to:', url);
    console.log();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const data = await response.json();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('RESPONSE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log();
    console.log(`Status:      ${response.status} ${response.statusText}`);
    console.log(`Success:     ${data.success ? '✅' : '❌'}`);
    console.log();

    if (data.summary) {
      console.log('Summary:');
      console.log(`  Total Candidates:  ${data.summary.totalCandidates}`);
      console.log(`  Processed:         ${data.summary.processed}`);
      console.log(`  CRM Succeeded:     ${data.summary.crmSucceeded}`);
      console.log(`  CRM Failed:        ${data.summary.crmFailed}`);
      console.log(`  Billing Succeeded: ${data.summary.billingSucceeded}`);
      console.log(`  Billing Failed:    ${data.summary.billingFailed}`);
      console.log(`  Skipped:           ${data.summary.skipped}`);
      console.log();
    }

    if (data.duration_ms) {
      console.log(`Duration:    ${(data.duration_ms / 1000).toFixed(1)}s`);
      console.log();
    }

    if (data.results && data.results.length > 0) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('DETAILED RESULTS (First 10)');
      console.log('═══════════════════════════════════════════════════════════');
      console.log();

      data.results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.name} (${result.sku})`);
        console.log(`   CRM:     ${result.crmSuccess ? '✅' : '❌'} ${result.crmError || ''}`);
        console.log(`   Billing: ${result.billingSuccess ? '✅' : '❌'} ${result.billingError || ''}`);
        console.log();
      });
    }

    if (data.error) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('ERROR');
      console.log('═══════════════════════════════════════════════════════════');
      console.log();
      console.log(`Error:   ${data.error}`);
      console.log(`Details: ${data.details || 'N/A'}`);
      console.log();
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log();

    if (isDryRun) {
      console.log('NOTE: This was a DRY RUN - no changes were made');
      console.log('Run with --live to perform actual sync');
      console.log();
    }

    if (!response.ok) {
      process.exit(1);
    }
  } catch (error) {
    console.error('═══════════════════════════════════════════════════════════');
    console.error('FATAL ERROR');
    console.error('═══════════════════════════════════════════════════════════');
    console.error();
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error();
    console.error('Make sure:');
    console.error('  1. Development server is running (npm run dev:memory)');
    console.error('  2. CRON_SECRET is set in .env.local');
    console.error('  3. Database is accessible');
    console.error();
    process.exit(1);
  }
}

// Check prerequisites
if (!process.env.CRON_SECRET) {
  console.error('❌ CRON_SECRET not found in environment');
  console.error('   Please add CRON_SECRET to .env.local');
  console.error();
  process.exit(1);
}

// Run test
testCronEndpoint();

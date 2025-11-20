#!/usr/bin/env node
/**
 * Cleanup Remaining Payment Validation Test
 *
 * Removes the 1 remaining payment validation test that was missed in the initial cleanup
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function main() {
  console.log('\n🧹 Cleanup Remaining Payment Validation Test');
  console.log('═'.repeat(60));

  // Check current count
  const { data: before, error: beforeError } = await supabase
    .from('payment_transactions')
    .select('id, reference, customer_email, amount, status')
    .like('reference', 'PAYMENT-METHOD-VALIDATION%');

  if (beforeError) {
    console.error('❌ Error checking payments:', beforeError);
    process.exit(1);
  }

  console.log(`\nFound ${before.length} payment validation test(s):`);
  before.forEach(p => {
    console.log(`  - ${p.reference} (${p.customer_email}) - R${p.amount} - ${p.status}`);
  });

  if (before.length === 0) {
    console.log('\n✅ No payment validation tests to clean up!');
    return;
  }

  // Delete
  const { error: deleteError } = await supabase
    .from('payment_transactions')
    .delete()
    .like('reference', 'PAYMENT-METHOD-VALIDATION%')
    .eq('customer_email', 'test@circletel.co.za')
    .eq('status', 'pending')
    .eq('amount', 1.00);

  if (deleteError) {
    console.error('❌ Error deleting payments:', deleteError);
    process.exit(1);
  }

  console.log(`\n✅ Deleted ${before.length} payment validation test(s)`);

  // Verify
  const { data: after, error: afterError } = await supabase
    .from('payment_transactions')
    .select('COUNT(*)')
    .like('reference', 'PAYMENT-METHOD-VALIDATION%')
    .single();

  if (afterError) {
    console.error('❌ Error verifying cleanup:', afterError);
    process.exit(1);
  }

  console.log(`\n📊 Verification:`);
  console.log(`  Remaining validation tests: ${after.count || 0}`);

  if ((after.count || 0) === 0) {
    console.log('\n✅ Cleanup complete! No validation tests remaining.');
  } else {
    console.log(`\n⚠️  Warning: ${after.count} validation test(s) still remain.`);
  }
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

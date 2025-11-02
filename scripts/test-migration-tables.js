// Test Customer Dashboard migration tables
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMigrations() {
  console.log('Testing Customer Dashboard Migrations\n');
  console.log('='.repeat(80));

  const tests = [];

  // Test 1: validation_errors table
  console.log('\n1. Testing validation_errors table...');
  try {
    const { data, error, count } = await supabase
      .from('validation_errors')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) throw error;

    console.log(`   ✅ Table accessible`);
    console.log(`   📊 Row count: ${count || 0}`);
    if (data && data.length > 0) {
      console.log(`   📝 Sample columns: ${Object.keys(data[0]).join(', ')}`);
    }
    tests.push({ name: 'validation_errors', status: 'PASS' });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    tests.push({ name: 'validation_errors', status: 'FAIL', error: err.message });
  }

  // Test 2: customer_services table
  console.log('\n2. Testing customer_services table...');
  try {
    const { data, error, count } = await supabase
      .from('customer_services')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) throw error;

    console.log(`   ✅ Table accessible`);
    console.log(`   📊 Row count: ${count || 0}`);
    if (data && data.length > 0) {
      console.log(`   📝 Sample columns: ${Object.keys(data[0]).join(', ')}`);
      console.log(`   📄 Sample record: Account ${data[0].account_number}, Status: ${data[0].status}`);
    }
    tests.push({ name: 'customer_services', status: 'PASS' });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    tests.push({ name: 'customer_services', status: 'FAIL', error: err.message });
  }

  // Test 3: customer_billing table
  console.log('\n3. Testing customer_billing table...');
  try {
    const { data, error, count } = await supabase
      .from('customer_billing')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) throw error;

    console.log(`   ✅ Table accessible`);
    console.log(`   📊 Row count: ${count || 0}`);
    if (data && data.length > 0) {
      console.log(`   📝 Sample columns: ${Object.keys(data[0]).join(', ')}`);
    }
    tests.push({ name: 'customer_billing', status: 'PASS' });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    tests.push({ name: 'customer_billing', status: 'FAIL', error: err.message });
  }

  // Test 4: customer_invoices table
  console.log('\n4. Testing customer_invoices table...');
  try {
    const { data, error, count } = await supabase
      .from('customer_invoices')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) throw error;

    console.log(`   ✅ Table accessible`);
    console.log(`   📊 Row count: ${count || 0}`);
    if (data && data.length > 0) {
      console.log(`   📝 Sample columns: ${Object.keys(data[0]).join(', ')}`);
      console.log(`   💰 Sample invoice: ${data[0].invoice_number}, Amount: R${data[0].total_amount}, Status: ${data[0].payment_status}`);
    }
    tests.push({ name: 'customer_invoices', status: 'PASS' });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    tests.push({ name: 'customer_invoices', status: 'FAIL', error: err.message });
  }

  // Test 5: customer_payment_methods table
  console.log('\n5. Testing customer_payment_methods table...');
  try {
    const { data, error, count } = await supabase
      .from('customer_payment_methods')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) throw error;

    console.log(`   ✅ Table accessible`);
    console.log(`   📊 Row count: ${count || 0}`);
    tests.push({ name: 'customer_payment_methods', status: 'PASS' });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    tests.push({ name: 'customer_payment_methods', status: 'FAIL', error: err.message });
  }

  // Test 6: payment_transactions table
  console.log('\n6. Testing payment_transactions table...');
  try {
    const { data, error, count } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) throw error;

    console.log(`   ✅ Table accessible`);
    console.log(`   📊 Row count: ${count || 0}`);
    tests.push({ name: 'payment_transactions', status: 'PASS' });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    tests.push({ name: 'payment_transactions', status: 'FAIL', error: err.message });
  }

  // Test 7: billing_cycles table
  console.log('\n7. Testing billing_cycles table...');
  try {
    const { data, error, count } = await supabase
      .from('billing_cycles')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) throw error;

    console.log(`   ✅ Table accessible`);
    console.log(`   📊 Row count: ${count || 0}`);
    tests.push({ name: 'billing_cycles', status: 'PASS' });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    tests.push({ name: 'billing_cycles', status: 'FAIL', error: err.message });
  }

  // Test 8: service_action_log table
  console.log('\n8. Testing service_action_log table...');
  try {
    const { data, error, count } = await supabase
      .from('service_action_log')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) throw error;

    console.log(`   ✅ Table accessible`);
    console.log(`   📊 Row count: ${count || 0}`);
    tests.push({ name: 'service_action_log', status: 'PASS' });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    tests.push({ name: 'service_action_log', status: 'FAIL', error: err.message });
  }

  // Test 9: service_suspensions table
  console.log('\n9. Testing service_suspensions table...');
  try {
    const { data, error, count } = await supabase
      .from('service_suspensions')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) throw error;

    console.log(`   ✅ Table accessible`);
    console.log(`   📊 Row count: ${count || 0}`);
    tests.push({ name: 'service_suspensions', status: 'PASS' });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    tests.push({ name: 'service_suspensions', status: 'FAIL', error: err.message });
  }

  // Test 10: usage_history table
  console.log('\n10. Testing usage_history table...');
  try {
    const { data, error, count } = await supabase
      .from('usage_history')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) throw error;

    console.log(`   ✅ Table accessible`);
    console.log(`   📊 Row count: ${count || 0}`);
    tests.push({ name: 'usage_history', status: 'PASS' });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    tests.push({ name: 'usage_history', status: 'FAIL', error: err.message });
  }

  // Test 11: migration_review_queue table
  console.log('\n11. Testing migration_review_queue table...');
  try {
    const { data, error, count } = await supabase
      .from('migration_review_queue')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) throw error;

    console.log(`   ✅ Table accessible`);
    console.log(`   📊 Row count: ${count || 0}`);
    if (data && data.length > 0) {
      console.log(`   📋 Sample record: ${data[0].record_type}, Status: ${data[0].review_status}`);
    }
    tests.push({ name: 'migration_review_queue', status: 'PASS' });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    tests.push({ name: 'migration_review_queue', status: 'FAIL', error: err.message });
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));

  const passed = tests.filter(t => t.status === 'PASS').length;
  const failed = tests.filter(t => t.status === 'FAIL').length;

  console.log(`\n✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    tests.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`  ❌ ${t.name}: ${t.error}`);
    });
  }

  console.log('\n' + '='.repeat(80));

  return failed === 0;
}

testMigrations()
  .then((success) => {
    if (success) {
      console.log('\n🎉 All migration tests passed!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

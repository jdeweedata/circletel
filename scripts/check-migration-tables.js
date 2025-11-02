// Check if tables from Customer Dashboard migrations exist
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('Checking Customer Dashboard migration tables...\n');

  // Tables expected from each migration
  const expectedTables = {
    '20251102121000_customer_dashboard_backfill_orders.sql': [
      'validation_errors'
    ],
    '20251102122000_customer_services_and_billing_tables.sql': [
      'customer_services',
      'customer_billing'
    ],
    '20251102123000_customer_invoices_and_payments.sql': [
      'customer_invoices',
      'customer_payment_methods',
      'payment_transactions',
      'billing_cycles'
    ],
    '20251102124000_audit_and_tracking_tables.sql': [
      'service_action_log',
      'service_suspensions',
      'usage_history',
      'migration_review_queue'
    ]
  };

  let allTablesExist = true;
  let results = {};

  for (const [migration, tables] of Object.entries(expectedTables)) {
    console.log(`\nMigration: ${migration}`);
    console.log('─'.repeat(80));

    results[migration] = { exists: [], missing: [] };

    for (const tableName of tables) {
      // Try to query the table (just count)
      const { data, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('not found')) {
          console.log(`  ❌ ${tableName} - NOT FOUND`);
          results[migration].missing.push(tableName);
          allTablesExist = false;
        } else {
          console.log(`  ⚠️  ${tableName} - ERROR: ${error.message}`);
          results[migration].missing.push(tableName);
          allTablesExist = false;
        }
      } else {
        console.log(`  ✅ ${tableName} - EXISTS`);
        results[migration].exists.push(tableName);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  for (const [migration, result] of Object.entries(results)) {
    const migrationName = migration.replace('.sql', '');
    const status = result.missing.length === 0 ? '✅ APPLIED' : '❌ NOT APPLIED';
    console.log(`\n${status}: ${migrationName}`);
    if (result.missing.length > 0) {
      console.log(`  Missing tables: ${result.missing.join(', ')}`);
    }
  }

  console.log('\n' + '='.repeat(80));

  if (allTablesExist) {
    console.log('✅ All Customer Dashboard migrations have been applied!');
    return true;
  } else {
    console.log('❌ Some migrations need to be applied');
    return false;
  }
}

checkTables()
  .then((allApplied) => {
    process.exit(allApplied ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

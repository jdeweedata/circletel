// Check database schema directly using raw SQL
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('Checking database schema for Customer Dashboard tables...\n');

  // List of tables to check
  const tablesToCheck = [
    'validation_errors',
    'customer_services',
    'customer_billing',
    'customer_invoices',
    'customer_payment_methods',
    'payment_transactions',
    'billing_cycles',
    'service_action_log',
    'service_suspensions',
    'usage_history',
    'migration_review_queue'
  ];

  console.log('Querying information_schema...\n');

  for (const tableName of tablesToCheck) {
    // Query information_schema to check if table exists
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          table_schema,
          table_name,
          (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = t.table_schema
           AND table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_name = '${tableName}'
        AND table_schema = 'public'
      `
    });

    if (error) {
      // Try alternative method - direct query
      const altQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = '${tableName}'
        ) as table_exists;
      `;

      console.log(`Checking ${tableName}...`);
      console.log(`  ⚠️  RPC method failed: ${error.message}`);
      continue;
    }

    if (data && data.length > 0) {
      console.log(`✅ ${tableName}`);
      console.log(`   Schema: ${data[0].table_schema}`);
      console.log(`   Columns: ${data[0].column_count}`);
    } else {
      console.log(`❌ ${tableName} - NOT FOUND`);
    }
  }

  // Alternative approach: Check using pg_catalog
  console.log('\n' + '='.repeat(80));
  console.log('Alternative check using simplified query...\n');

  const checkQuery = `
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (${tablesToCheck.map(t => `'${t}'`).join(',')})
    ORDER BY tablename;
  `;

  console.log('Query:', checkQuery);
}

checkSchema()
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

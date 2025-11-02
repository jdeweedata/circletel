// Check which migrations have been applied
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMigrations() {
  console.log('Checking applied migrations...\n');

  // Query the migrations table
  const { data, error } = await supabase
    .from('supabase_migrations')
    .select('name, version')
    .order('version', { ascending: false })
    .limit(30);

  if (error) {
    console.error('Error querying migrations:', error.message);

    // Try alternative schema
    const { data: altData, error: altError } = await supabase.rpc('exec_sql', {
      sql: "SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 30"
    });

    if (altError) {
      console.error('Alternative query failed:', altError.message);
      return;
    }

    console.log('Applied migrations:', altData);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No migrations found or table does not exist');
    return;
  }

  console.log('Applied migrations:');
  console.log('─'.repeat(80));

  const targetMigrations = [
    '20251102121000_customer_dashboard_backfill_orders',
    '20251102122000_customer_services_and_billing_tables',
    '20251102123000_customer_invoices_and_payments',
    '20251102124000_audit_and_tracking_tables'
  ];

  data.forEach(row => {
    const isTarget = targetMigrations.some(m => row.version?.includes(m) || row.name?.includes(m));
    const marker = isTarget ? '✅' : '  ';
    console.log(`${marker} ${row.version || row.name || 'Unknown'}`);
  });

  console.log('─'.repeat(80));
  console.log('\n✅ = Target migration\n');

  // Check which target migrations are missing
  const appliedVersions = data.map(row => row.version || row.name || '');
  const missing = targetMigrations.filter(m =>
    !appliedVersions.some(v => v.includes(m))
  );

  if (missing.length > 0) {
    console.log('Missing migrations:');
    missing.forEach(m => console.log(`  ❌ ${m}`));
  } else {
    console.log('✅ All target migrations are applied!');
  }
}

checkMigrations()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function listTables() {
  console.log('📊 CircleTel Supabase Database Tables\n');

  // List of known tables based on CLAUDE.md documentation
  const tables = [
    // Core tables
    'service_packages',
    'coverage_leads',
    'orders',
    'consumer_orders',
    'customers',

    // Admin & RBAC
    'admin_users',
    'role_templates',
    'permissions',

    // Providers
    'fttb_network_providers',

    // Partner tables
    'partners',
    'partner_compliance_documents',
    'partner_leads',
    'partner_commissions',

    // Business quotes
    'business_quotes',
    'quote_line_items',

    // Logs & tracking
    'api_usage_logs',
    'kyc_documents'
  ];

  let count = 0;
  console.log('Table Name                          Row Count');
  console.log('─'.repeat(55));

  for (const table of tables) {
    try {
      const { count: rowCount, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        count++;
        const rows = rowCount !== null ? rowCount.toString() : '0';
        console.log(`✅ ${table.padEnd(35)} ${rows.padStart(10)}`);
      }
    } catch (e) {
      // Table doesn't exist or no access
    }
  }

  console.log('─'.repeat(55));
  console.log(`\nTotal tables found: ${count}`);
}

listTables().catch(console.error);

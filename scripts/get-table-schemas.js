require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function getTableSchemas() {
  console.log('📋 Fetching Table Schemas...\n');

  const tables = [
    'admin_users',
    'customers',
    'consumer_orders',
    'partners',
    'partner_compliance_documents',
    'kyc_documents',
    'business_quotes'
  ];

  for (const table of tables) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Table: ${table}`);
    console.log('='.repeat(70));

    try {
      // Get one row to see the structure
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Error: ${error.message}`);
        continue;
      }

      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`\nColumns (${columns.length} total):`);
        columns.forEach(col => {
          const value = data[0][col];
          const type = typeof value === 'object' && value !== null ? 'object' : typeof value;
          console.log(`  • ${col.padEnd(30)} (${type})`);
        });
      } else {
        console.log('\n⚠️ Table is empty, fetching schema from metadata...');

        // Alternative: Try to infer from table structure
        const { data: schemaData, error: schemaError } = await supabase
          .from(table)
          .select('*')
          .limit(0);

        if (schemaError) {
          console.log(`❌ Cannot fetch schema: ${schemaError.message}`);
        }
      }
    } catch (e) {
      console.log(`❌ Error fetching ${table}: ${e.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Schema fetch complete');
  console.log('='.repeat(70));
}

getTableSchemas().catch(console.error);

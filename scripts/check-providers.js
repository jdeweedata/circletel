const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProviders() {
  console.log('='.repeat(60));
  console.log('Checking Network Providers Table');
  console.log('='.repeat(60));

  // Check all providers with provider_code
  const { data: allProviders, error: error1 } = await supabase
    .from('fttb_network_providers')
    .select('id, name, provider_code, type, enabled, priority, service_offerings, coverage_source')
    .order('priority', { ascending: true });

  if (error1) {
    console.error('Error fetching providers:', error1);
    return;
  }

  console.log('\nAll Providers:');
  console.table(allProviders);

  // Check specifically MTN providers
  const { data: mtnProviders, error: error2 } = await supabase
    .from('fttb_network_providers')
    .select('*')
    .or('name.ilike.%mtn%,provider_code.eq.mtn');

  if (error2) {
    console.error('Error fetching MTN providers:', error2);
    return;
  }

  console.log('\nMTN Providers:');
  console.table(mtnProviders);

  // Check if provider_code column exists and has unique constraint
  const { data: schema, error: error3 } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'fttb_network_providers'
        AND column_name IN ('provider_code', 'service_offerings', 'coverage_source')
        ORDER BY column_name;
      `
    })
    .single();

  if (!error3 && schema) {
    console.log('\nProvider Code Schema:');
    console.table(schema);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log('='.repeat(60));
  console.log(`Total providers: ${allProviders.length}`);
  console.log(`Providers with provider_code: ${allProviders.filter(p => p.provider_code).length}`);
  console.log(`MTN providers: ${mtnProviders.length}`);
}

checkProviders()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

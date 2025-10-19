require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkSchema() {
  console.log('Checking provider-related tables...\n');

  // Check if provider_configuration exists
  const { data: providerConfig, error: configError } = await supabase
    .from('provider_configuration')
    .select('*')
    .limit(1);

  if (configError) {
    console.log('❌ provider_configuration table:', configError.message);
  } else {
    console.log('✅ provider_configuration table exists');
    console.log('Columns:', Object.keys(providerConfig[0] || {}));
  }

  // Check network_providers
  const { data: networkProviders, error: npError } = await supabase
    .from('network_providers')
    .select('*')
    .limit(1);

  if (npError) {
    console.log('\n❌ network_providers table:', npError.message);
  } else {
    console.log('\n✅ network_providers table exists');
    if (networkProviders[0]) {
      console.log('Columns:', Object.keys(networkProviders[0]));
    }
  }

  // Check fttb_network_providers
  const { data: fttbProviders, error: fttbError } = await supabase
    .from('fttb_network_providers')
    .select('*')
    .limit(1);

  if (fttbError) {
    console.log('\n❌ fttb_network_providers table:', fttbError.message);
  } else {
    console.log('\n✅ fttb_network_providers table exists');
    if (fttbProviders[0]) {
      console.log('Columns:', Object.keys(fttbProviders[0]));
    }
  }

  // Check provider_api_logs
  const { data: apiLogs, error: logsError } = await supabase
    .from('provider_api_logs')
    .select('*')
    .limit(1);

  if (logsError) {
    console.log('\n❌ provider_api_logs table:', logsError.message);
  } else {
    console.log('\n✅ provider_api_logs table exists');
    if (apiLogs[0]) {
      console.log('Columns:', Object.keys(apiLogs[0]));
    }
  }
}

checkSchema();

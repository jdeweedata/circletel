require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .limit(0);

  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Partners table columns exist and are accessible');
  }

  // Try to insert with minimal fields to see what's required
  const { error: insertError } = await supabase
    .from('partners')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      business_name: 'Test',
      business_type: 'company'
    })
    .select();

  console.log('\nInsert error (shows what columns are actually required):', insertError?.message);
}

checkSchema();

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('\n🔍 Checking admin_users table for devadmin@circletel.co.za...\n');

  const userId = '172c9f7c-7c32-43bd-8782-278df0d4a322';

  // Try different query patterns
  console.log('Query 1: Select all fields with is_active filter');
  const { data: data1, error: error1 } = await supabase
    .from('admin_users')
    .select('id, email, is_active, role')
    .eq('id', userId)
    .eq('is_active', true)
    .single();

  console.log(JSON.stringify({ data: data1, error: error1 }, null, 2));

  console.log('\nQuery 2: Select without is_active filter');
  const { data: data2, error: error2 } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', userId);

  console.log(JSON.stringify({ data: data2, error: error2 }, null, 2));

  console.log('\nQuery 3: Search by email');
  const { data: data3, error: error3 } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', 'devadmin@circletel.co.za');

  console.log(JSON.stringify({ data: data3, error: error3 }, null, 2));

  process.exit(0);
})();

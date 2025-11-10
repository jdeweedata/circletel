/**
 * Check if admin user exists in admin_users table
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.log('SERVICE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminUser() {
  const email = 'jeffrey.de.wee@circletel.co.za';

  console.log(`\nChecking admin user: ${email}\n`);

  // Check in admin_users
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('❌ Error querying admin_users:', error.message);
  } else if (!data) {
    console.log('❌ User NOT found in admin_users table');
    console.log('\nLet me check all admin users:');

    const { data: allAdmins } = await supabase
      .from('admin_users')
      .select('email, role, is_active, status')
      .limit(10);

    console.log(`Found ${allAdmins?.length || 0} admin users:`);
    allAdmins?.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.role}, ${admin.status})`);
    });
  } else {
    console.log('✅ User found in admin_users:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkAdminUser().catch(console.error);

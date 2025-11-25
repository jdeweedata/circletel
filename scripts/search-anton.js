const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function searchAnton() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('Searching for Anton Gibbons...\n');

  // Search by name
  const { data: byName, error: nameError } = await supabase
    .from('admin_users')
    .select('id, email, full_name, role, is_active')
    .ilike('full_name', '%anton%');

  if (!nameError && byName && byName.length > 0) {
    console.log('Found users with "Anton" in name:');
    byName.forEach(user => {
      console.log(`  - ${user.full_name} (${user.email}) - ${user.role} - ${user.is_active ? 'Active' : 'Inactive'}`);
    });
  } else {
    console.log('No users found with "Anton" in name');
  }

  console.log('\n');

  // Search by email domain
  const { data: byEmail, error: emailError } = await supabase
    .from('admin_users')
    .select('id, email, full_name, role, is_active')
    .ilike('email', '%newgenmc%');

  if (!emailError && byEmail && byEmail.length > 0) {
    console.log('Found users with "newgenmc" in email:');
    byEmail.forEach(user => {
      console.log(`  - ${user.full_name} (${user.email}) - ${user.role} - ${user.is_active ? 'Active' : 'Inactive'}`);
    });
  } else {
    console.log('No users found with "newgenmc" in email domain');
  }

  console.log('\n');

  // Check specific email
  const { data: specific, error: specificError } = await supabase
    .from('admin_users')
    .select('id, email, full_name, role, is_active')
    .eq('email', 'antong@newgenmc.co.za')
    .maybeSingle();

  if (specific) {
    console.log('✅ Found exact match for antong@newgenmc.co.za:');
    console.log(`   ${specific.full_name} - ${specific.role} - ${specific.is_active ? 'Active' : 'Inactive'}`);
  } else {
    console.log('❌ No admin account exists for antong@newgenmc.co.za');
    console.log('\nTo create an admin account, you would need to:');
    console.log('1. Insert a record into the admin_users table');
    console.log('2. Create the corresponding auth user in Supabase Auth');
    console.log('3. Assign appropriate role and permissions');
  }
}

searchAnton().catch(console.error);

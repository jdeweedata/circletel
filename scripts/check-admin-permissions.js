/**
 * Check Admin User Permissions
 *
 * This script checks the permissions for admin users in the database
 * Run: node scripts/check-admin-permissions.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminPermissions() {
  console.log('Checking admin users...\n');

  const { data: users, error } = await supabase
    .from('admin_users')
    .select('id, email, full_name, role, permissions, is_active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin users:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No admin users found.');
    return;
  }

  users.forEach((user, index) => {
    console.log(`\n=== User ${index + 1} ===`);
    console.log('Email:', user.email);
    console.log('Full Name:', user.full_name);
    console.log('Role:', user.role);
    console.log('Is Active:', user.is_active);
    console.log('Permissions:', JSON.stringify(user.permissions, null, 2));

    // Check for product permissions
    const productPerms = {
      'products:edit': user.permissions?.['products:edit'],
      'products:create': user.permissions?.['products:create'],
      'products:delete': user.permissions?.['products:delete'],
      'products:manage_pricing': user.permissions?.['products:manage_pricing'],
    };
    console.log('Product Permissions:', productPerms);
  });
}

checkAdminPermissions().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

/**
 * Verify Test Admin Account
 *
 * This script verifies that the test admin account exists in the database.
 * Account: admin@circletel.co.za / admin123
 * Run: node scripts/verify-test-admin-account.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyTestAdmin() {
  console.log('🔍 Verifying Test Admin Account...');
  console.log('');

  const testEmail = 'admin@circletel.co.za';

  try {
    // Check if user exists in admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (adminError) {
      if (adminError.code === 'PGRST116') {
        console.log('❌ Test admin account NOT found in admin_users table');
        console.log('');
        console.log('To create the test admin account, run:');
        console.log('  node scripts/create-test-admin.js');
        return false;
      }
      throw adminError;
    }

    console.log('✅ Test admin account found in admin_users table');
    console.log('');
    console.log('📋 Account Details:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Full Name: ${adminUser.full_name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Role Template: ${adminUser.role_template_id}`);
    console.log(`   Active: ${adminUser.is_active ? 'Yes' : 'No'}`);
    console.log(`   Created: ${new Date(adminUser.created_at).toLocaleString()}`);
    console.log('');

    // Check if user exists in auth.users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.log('⚠️  Could not verify auth.users (requires admin privileges)');
      console.log('');
    } else {
      const authUser = users.find(u => u.email === testEmail);
      if (authUser) {
        console.log('✅ Test admin account found in auth.users');
        console.log(`   User ID: ${authUser.id}`);
        console.log(`   Email Confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);
        console.log(`   Last Sign In: ${authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString() : 'Never'}`);
      } else {
        console.log('❌ Test admin account NOT found in auth.users');
        console.log('');
        console.log('The account exists in admin_users but not in auth.users.');
        console.log('This will prevent login. Please run:');
        console.log('  node scripts/create-test-admin.js');
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Test Admin Account Verification Complete');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Test Credentials:');
    console.log('  Email: admin@circletel.co.za');
    console.log('  Password: admin123');
    console.log('');
    console.log('⚠️  NOTE: These credentials are for DEVELOPMENT ONLY');
    console.log('         Do not use in production!');

    return true;

  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Run verification
verifyTestAdmin()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });

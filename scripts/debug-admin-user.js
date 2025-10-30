/**
 * Debug Admin User Account
 *
 * This script debugs why a user can't login by checking both auth.users and admin_users.
 * Run: node scripts/debug-admin-user.js
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

async function debugAdminUser() {
  console.log('🔍 Debugging Admin User Login Issue...');
  console.log('');

  const testEmail = 'admin@circletel.co.za';
  const testPassword = 'admin123';

  try {
    // Step 1: Try to authenticate
    console.log('Step 1: Testing Authentication with Supabase Auth');
    console.log(`Email: ${testEmail}`);
    console.log('');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (authError) {
      console.log('❌ Authentication Failed:', authError.message);
      console.log('');
      console.log('This means the credentials are wrong or the user does not exist in auth.users');
      return;
    }

    console.log('✅ Authentication Successful');
    console.log(`User ID: ${authData.user.id}`);
    console.log(`Email: ${authData.user.email}`);
    console.log('');

    // Step 2: Check if user exists in admin_users
    console.log('Step 2: Checking admin_users table');
    console.log('');

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (adminError) {
      console.log('❌ User NOT found in admin_users table');
      console.log('Error:', adminError.message);
      console.log('');
      console.log('🔧 SOLUTION: The user exists in auth.users but not in admin_users');
      console.log('   This is why you get "Access denied: Not an admin user"');
      console.log('');
      console.log('   Run this command to create the admin_users record:');
      console.log('   node scripts/sync-admin-user.js');

      // Try to find by user ID instead
      console.log('');
      console.log('Checking by user ID instead...');

      const { data: adminUserById, error: byIdError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (byIdError) {
        console.log('❌ Also not found by user ID');
        console.log('');
        console.log('The user needs to be added to admin_users table.');
      } else {
        console.log('✅ Found by user ID!');
        console.log('Email in admin_users:', adminUserById.email);
        console.log('Email in auth.users:', authData.user.email);
        console.log('');
        console.log('🔧 ISSUE: Email mismatch!');
        console.log('   The emails do not match exactly (case or whitespace issue)');
      }

      return;
    }

    console.log('✅ User found in admin_users table');
    console.log('');
    console.log('📋 Admin User Details:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Full Name: ${adminUser.full_name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Role Template: ${adminUser.role_template_id}`);
    console.log(`   Is Active: ${adminUser.is_active}`);
    console.log('');

    // Step 3: Check ID match
    console.log('Step 3: Verifying ID Match');
    console.log('');

    if (authData.user.id !== adminUser.id) {
      console.log('⚠️  WARNING: User IDs do not match!');
      console.log(`   auth.users ID: ${authData.user.id}`);
      console.log(`   admin_users ID: ${adminUser.id}`);
      console.log('');
      console.log('🔧 SOLUTION: Update admin_users.id to match auth.users.id');
    } else {
      console.log('✅ User IDs match');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Debug Complete - User should be able to login');
    console.log('═══════════════════════════════════════════════════════════');

    // Sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run debug
debugAdminUser()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
  });

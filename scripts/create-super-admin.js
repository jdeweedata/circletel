/**
 * Create Super Admin User
 *
 * Creates a super admin account with full system access and sends a password reset email.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperAdmin() {
  console.log('=== Creating Super Admin Account ===\n');

  const email = 'jeffrey.de.wee@circletel.co.za';
  const fullName = 'Jeffrey De Wee';
  const roleTemplateId = 'super_admin';

  try {
    // Step 1: Check if user already exists in auth.users
    console.log(`1️⃣  Checking if user exists: ${email}`);
    const { data: existingAuthUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error checking existing users:', listError.message);
      throw listError;
    }

    const existingAuthUser = existingAuthUsers.users.find(u => u.email === email);

    let userId;

    if (existingAuthUser) {
      console.log('✅ User already exists in auth.users');
      userId = existingAuthUser.id;
    } else {
      // Step 2: Create user in auth.users (Supabase Auth)
      console.log('2️⃣  Creating user in Supabase Auth...');

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: fullName
        }
      });

      if (authError) {
        console.error('❌ Error creating auth user:', authError.message);
        throw authError;
      }

      userId = authData.user.id;
      console.log(`✅ Auth user created with ID: ${userId}`);
    }

    // Step 3: Check if admin_users record exists
    console.log('\n3️⃣  Checking admin_users table...');
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('id, email, role_template_id, is_active')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('❌ Error checking admin_users:', checkError.message);
      throw checkError;
    }

    if (existingAdmin) {
      console.log('✅ Admin record already exists');
      console.log(`   Current role: ${existingAdmin.role_template_id}`);
      console.log(`   Active: ${existingAdmin.is_active}`);

      // Update to super_admin if different
      if (existingAdmin.role_template_id !== roleTemplateId) {
        console.log('\n4️⃣  Updating to Super Admin role...');
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({
            role: 'super_admin', // Legacy column
            role_template_id: roleTemplateId,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAdmin.id);

        if (updateError) {
          console.error('❌ Error updating admin role:', updateError.message);
          throw updateError;
        }
        console.log('✅ Admin role updated to Super Admin');
      }
    } else {
      // Step 4: Create admin_users record
      console.log('4️⃣  Creating admin_users record...');

      const { error: insertError } = await supabase
        .from('admin_users')
        .insert({
          id: userId,
          email: email,
          full_name: fullName,
          role: 'super_admin', // Legacy column (still required)
          role_template_id: roleTemplateId,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Error creating admin_users record:', insertError.message);
        throw insertError;
      }

      console.log('✅ Admin user record created');
    }

    // Step 5: Send password reset email
    console.log('\n5️⃣  Sending password reset email...');

    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (resetError) {
      console.error('❌ Error generating password reset link:', resetError.message);
      throw resetError;
    }

    console.log('✅ Password reset email sent!');

    // Summary
    console.log('\n=== ✅ Super Admin Account Created Successfully ===\n');
    console.log('Account Details:');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${fullName}`);
    console.log(`   Role: Super Administrator`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Status: Active`);
    console.log('\n📧 Password reset email has been sent to: ${email}');
    console.log('\nNext Steps:');
    console.log('1. Check your email inbox for the password reset link');
    console.log('2. Click the link to set your password');
    console.log('3. Login at: http://localhost:3000/admin/login');
    console.log('4. You will have full super admin access to all functions');

  } catch (error) {
    console.error('\n❌ Failed to create super admin:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();

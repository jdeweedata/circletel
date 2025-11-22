const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production.latest' });

async function confirmUserEmail() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = 'jdewee@live.com';

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('Looking up user:', email);

  // Get the user
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing users:', listError);
    process.exit(1);
  }

  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.error('❌ User not found');
    process.exit(1);
  }

  console.log('✅ Found user:', user.id);
  console.log('   Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');

  if (user.email_confirmed_at) {
    console.log('\n✅ Email already confirmed!');
    console.log('   Confirmed at:', user.email_confirmed_at);
    return;
  }

  // Confirm the email
  console.log('\n🔄 Confirming email...');
  const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { email_confirm: true }
  );

  if (updateError) {
    console.error('❌ Failed to confirm email:', updateError);
    process.exit(1);
  }

  console.log('✅ Email confirmed successfully!');
  console.log('\n🎉 User can now login at: https://www.circletel.co.za/admin/login');
  console.log('   Email:', email);
  console.log('   Password: %G^LoLQkz_K!dmUm');
}

confirmUserEmail().catch(console.error);

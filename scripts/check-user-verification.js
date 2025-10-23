// Check email verification status for a specific user
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkUserVerification() {
  const email = 'jeffrey.de.wee@circletel.co.za';

  console.log('\n=== Checking User Verification Status ===\n');
  console.log(`Email: ${email}\n`);

  // Check auth.users table
  const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }

  const user = authUser.users.find(u => u.email === email);

  if (!user) {
    console.log('❌ User not found in auth.users');
    return;
  }

  console.log('✅ User found in auth.users');
  console.log(`   User ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Email Confirmed: ${user.email_confirmed_at ? '✅ YES' : '❌ NO'}`);
  if (user.email_confirmed_at) {
    console.log(`   Confirmed At: ${user.email_confirmed_at}`);
  }
  console.log(`   Created At: ${user.created_at}`);
  console.log(`   Last Sign In: ${user.last_sign_in_at || 'Never'}\n`);

  // Check customers table
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (customerError) {
    console.log('❌ Customer record not found:', customerError.message);
    return;
  }

  console.log('✅ Customer record found');
  console.log(`   Customer ID: ${customer.id}`);
  console.log(`   Name: ${customer.first_name} ${customer.last_name}`);
  console.log(`   Email: ${customer.email}`);
  console.log(`   Phone: ${customer.phone}`);
  console.log(`   Email Verified (customers): ${customer.email_verified ? '✅ YES' : '❌ NO'}`);
  console.log(`   Account Type: ${customer.account_type}`);
  console.log(`   Status: ${customer.status}`);
  console.log(`   Created At: ${customer.created_at}`);
  console.log(`   Updated At: ${customer.updated_at}\n`);

  // Summary
  console.log('=== SUMMARY ===');
  if (user.email_confirmed_at && customer.email_verified) {
    console.log('✅ Email verification COMPLETE');
    console.log('✅ Both auth.users and customers tables are synced');
  } else if (user.email_confirmed_at && !customer.email_verified) {
    console.log('⚠️  Email confirmed in auth.users but NOT synced to customers table');
    console.log('⚠️  Trigger may have failed');
  } else {
    console.log('❌ Email NOT yet verified');
    console.log('⏳ Waiting for user to click verification link in email');
  }
  console.log('\n');
}

checkUserVerification().catch(console.error);

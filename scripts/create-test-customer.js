/**
 * Create Test Customer Account
 * Creates a customer account in Supabase Auth and customers table for testing
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestCustomer() {
  console.log('🔧 Creating test customer account...\n');

  const testCustomer = {
    email: 'test.customer@circletel.co.za',
    password: 'TestCustomer123!',
    first_name: 'Test',
    last_name: 'Customer',
    phone: '+27821234567'
  };

  try {
    // Step 1: Check if auth user already exists
    console.log('1️⃣ Checking if auth user exists...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users.find(u => u.email === testCustomer.email);

    let authUserId;

    if (existingAuthUser) {
      console.log('   ✅ Auth user already exists:', existingAuthUser.id);
      authUserId = existingAuthUser.id;
    } else {
      // Create auth user
      console.log('   Creating new auth user...');
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: testCustomer.email,
        password: testCustomer.password,
        email_confirm: true,
        user_metadata: {
          first_name: testCustomer.first_name,
          last_name: testCustomer.last_name,
          phone: testCustomer.phone
        }
      });

      if (authError) {
        throw new Error(`Auth user creation failed: ${authError.message}`);
      }

      authUserId = authUser.user.id;
      console.log('   ✅ Auth user created:', authUserId);
    }

    // Step 2: Check if customer record exists
    console.log('\n2️⃣ Checking customer record...');
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (existingCustomer) {
      console.log('   ✅ Customer record already exists');
      console.log('   Account Number:', existingCustomer.account_number || 'Not assigned');
      console.log('   Status:', existingCustomer.account_status);
    } else {
      // Create customer record
      console.log('   Creating customer record...');
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          auth_user_id: authUserId,
          first_name: testCustomer.first_name,
          last_name: testCustomer.last_name,
          email: testCustomer.email,
          phone: testCustomer.phone,
          account_status: 'active'
        })
        .select()
        .single();

      if (customerError) {
        throw new Error(`Customer creation failed: ${customerError.message}`);
      }

      console.log('   ✅ Customer record created');
      console.log('   Customer ID:', customer.id);
      console.log('   Account Number:', customer.account_number || 'Will be auto-generated');
    }

    // Step 3: Summary
    console.log('\n✅ TEST CUSTOMER READY!\n');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:    ', testCustomer.email);
    console.log('🔑 Password: ', testCustomer.password);
    console.log('═══════════════════════════════════════');
    console.log('\n🔗 Login at: http://localhost:3001/auth/login');
    console.log('📊 Dashboard: http://localhost:3001/dashboard');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createTestCustomer();

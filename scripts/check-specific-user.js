/**
 * Check Specific User Script
 * 
 * This script checks if a specific user exists in auth and customers tables
 * and displays detailed information about their account status.
 * 
 * Run: node scripts/check-specific-user.js jeffrey.de.wee@circletel.co.za
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get email from command line argument
const targetEmail = process.argv[2];

if (!targetEmail) {
  console.error('❌ Usage: node scripts/check-specific-user.js <email>');
  console.error('   Example: node scripts/check-specific-user.js user@example.com');
  process.exit(1);
}

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
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

async function checkUser(email) {
  console.log('🔍 Checking user:', email);
  console.log('=' .repeat(60) + '\n');

  try {
    // Get all auth users (Supabase doesn't support filtering by email in admin API)
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      throw new Error(`Failed to fetch auth users: ${usersError.message}`);
    }

    // Find user by email
    const authUser = users.find(u => u.email === email);

    if (!authUser) {
      console.log('❌ AUTH USER NOT FOUND');
      console.log('   This user does not exist in the authentication system.\n');
      console.log('   The user needs to sign up first at:');
      console.log('   https://www.circletel.co.za/order/account\n');
      return;
    }

    console.log('✅ AUTH USER FOUND');
    console.log('   ID:', authUser.id);
    console.log('   Email:', authUser.email);
    console.log('   Email verified:', authUser.email_confirmed_at ? 'Yes ✅' : 'No ❌');
    console.log('   Created:', new Date(authUser.created_at).toLocaleString());
    console.log('   Last sign in:', authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString() : 'Never');
    
    if (authUser.user_metadata && Object.keys(authUser.user_metadata).length > 0) {
      console.log('   Metadata:', JSON.stringify(authUser.user_metadata, null, 2));
    }
    
    console.log('');

    // Check for customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError) {
      console.log('❌ ERROR FETCHING CUSTOMER RECORD');
      console.log('   Error:', customerError.message);
      console.log('   Code:', customerError.code);
      console.log('');
      return;
    }

    if (!customer) {
      console.log('❌ CUSTOMER RECORD NOT FOUND');
      console.log('   The auth user exists but has no customer record in the database.');
      console.log('   This is the issue causing the dashboard error.\n');
      console.log('   🔧 FIX: Creating customer record now...\n');

      // Create the customer record
      const firstName = authUser.user_metadata?.first_name || 
                        authUser.user_metadata?.full_name?.split(' ')[0] || 
                        'Customer';
      const lastName = authUser.user_metadata?.last_name || 
                       authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                       'User';
      const phone = authUser.user_metadata?.phone || authUser.phone || '';

      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          auth_user_id: authUser.id,
          first_name: firstName,
          last_name: lastName,
          email: authUser.email,
          phone: phone,
          account_type: 'personal',
          email_verified: !!authUser.email_confirmed_at,
          status: 'active',
        })
        .select()
        .single();

      if (createError) {
        console.log('   ❌ Failed to create customer record:', createError.message);
        console.log('   Error code:', createError.code);
        return;
      }

      console.log('   ✅ Customer record created successfully!');
      console.log('   Customer ID:', newCustomer.id);
      console.log('   Name:', newCustomer.first_name, newCustomer.last_name);
      console.log('   Email:', newCustomer.email);
      console.log('   Phone:', newCustomer.phone || '(not set)');
      console.log('   Account type:', newCustomer.account_type);
      console.log('');
      console.log('✅ ISSUE FIXED! User can now access the dashboard.\n');
      return;
    }

    console.log('✅ CUSTOMER RECORD FOUND');
    console.log('   Customer ID:', customer.id);
    console.log('   Name:', customer.first_name, customer.last_name);
    console.log('   Email:', customer.email);
    console.log('   Phone:', customer.phone || '(not set)');
    console.log('   Account number:', customer.account_number || '(not assigned)');
    console.log('   Account type:', customer.account_type);
    console.log('   Status:', customer.status);
    console.log('   Email verified:', customer.email_verified ? 'Yes ✅' : 'No ❌');
    console.log('   Created:', new Date(customer.created_at).toLocaleString());
    console.log('');

    // Check for services
    const { data: services, error: servicesError } = await supabase
      .from('customer_services')
      .select('*')
      .eq('customer_id', customer.id);

    if (!servicesError && services) {
      console.log(`📦 SERVICES: ${services.length} service(s)`);
      if (services.length > 0) {
        services.forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.package_name} - ${service.status}`);
        });
      }
      console.log('');
    }

    // Check for orders
    const { data: orders, error: ordersError } = await supabase
      .from('consumer_orders')
      .select('*')
      .eq('customer_id', customer.id);

    if (!ordersError && orders) {
      console.log(`📋 ORDERS: ${orders.length} order(s)`);
      if (orders.length > 0) {
        orders.forEach((order, index) => {
          console.log(`   ${index + 1}. ${order.order_number} - ${order.status}`);
        });
      }
      console.log('');
    }

    console.log('✅ ALL CHECKS PASSED! User should be able to access the dashboard.\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
checkUser(targetEmail)
  .then(() => {
    console.log('=' .repeat(60));
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });

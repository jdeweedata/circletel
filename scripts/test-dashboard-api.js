/**
 * Test Dashboard API Script
 * 
 * This script tests the dashboard summary API by simulating a request
 * with a valid user ID and checking the response.
 * 
 * Run: node scripts/test-dashboard-api.js jeffrey.de.wee@circletel.co.za
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get email from command line argument
const targetEmail = process.argv[2];

if (!targetEmail) {
  console.error('❌ Usage: node scripts/test-dashboard-api.js <email>');
  console.error('   Example: node scripts/test-dashboard-api.js user@example.com');
  process.exit(1);
}

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
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

async function testDashboardAPI(email) {
  console.log('🧪 Testing Dashboard API for:', email);
  console.log('=' .repeat(60) + '\n');

  try {
    // Step 1: Find the auth user
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      throw new Error(`Failed to fetch auth users: ${usersError.message}`);
    }

    const authUser = users.find(u => u.email === email);

    if (!authUser) {
      console.log('❌ Auth user not found');
      return;
    }

    console.log('✅ Auth user found:', authUser.id);
    console.log('');

    // Step 2: Simulate the dashboard API query
    console.log('📊 Simulating dashboard summary API queries...\n');

    const startTime = Date.now();

    // Query 1: Get customer details
    console.log('1️⃣  Fetching customer details...');
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone, account_number, account_status, created_at')
      .eq('auth_user_id', authUser.id)
      .single();

    const customerTime = Date.now() - startTime;

    if (customerError) {
      console.log(`   ❌ Failed (${customerTime}ms):`, customerError.message);
      console.log('   Code:', customerError.code);
      console.log('   Details:', customerError.details);
      console.log('   Hint:', customerError.hint);
      return;
    }

    if (!customer) {
      console.log(`   ❌ No customer record found (${customerTime}ms)`);
      return;
    }

    console.log(`   ✅ Success (${customerTime}ms)`);
    console.log(`   Customer ID: ${customer.id}`);
    console.log(`   Name: ${customer.first_name} ${customer.last_name}`);
    console.log('');

    // Query 2: Get services
    console.log('2️⃣  Fetching services...');
    const servicesStart = Date.now();
    const { data: services, error: servicesError } = await supabase
      .from('customer_services')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    const servicesTime = Date.now() - servicesStart;

    if (servicesError) {
      console.log(`   ❌ Failed (${servicesTime}ms):`, servicesError.message);
    } else {
      console.log(`   ✅ Success (${servicesTime}ms): ${services.length} service(s)`);
    }
    console.log('');

    // Query 3: Get billing
    console.log('3️⃣  Fetching billing info...');
    const billingStart = Date.now();
    const { data: billing, error: billingError } = await supabase
      .from('customer_billing')
      .select('*')
      .eq('customer_id', customer.id)
      .single();

    const billingTime = Date.now() - billingStart;

    if (billingError) {
      if (billingError.code === 'PGRST116') {
        console.log(`   ⚠️  No billing record (${billingTime}ms) - This is OK`);
      } else {
        console.log(`   ❌ Failed (${billingTime}ms):`, billingError.message);
      }
    } else {
      console.log(`   ✅ Success (${billingTime}ms)`);
    }
    console.log('');

    // Query 4: Get orders
    console.log('4️⃣  Fetching orders...');
    const ordersStart = Date.now();
    const { data: orders, error: ordersError } = await supabase
      .from('consumer_orders')
      .select('id, order_number, status, total_paid, created_at, package_name')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const ordersTime = Date.now() - ordersStart;

    if (ordersError) {
      console.log(`   ❌ Failed (${ordersTime}ms):`, ordersError.message);
    } else {
      console.log(`   ✅ Success (${ordersTime}ms): ${orders.length} order(s)`);
    }
    console.log('');

    // Query 5: Get invoices
    console.log('5️⃣  Fetching invoices...');
    const invoicesStart = Date.now();
    const { data: invoices, error: invoicesError } = await supabase
      .from('customer_invoices')
      .select('*')
      .eq('customer_id', customer.id)
      .order('invoice_date', { ascending: false })
      .limit(5);

    const invoicesTime = Date.now() - invoicesStart;

    if (invoicesError) {
      console.log(`   ❌ Failed (${invoicesTime}ms):`, invoicesError.message);
    } else {
      console.log(`   ✅ Success (${invoicesTime}ms): ${invoices.length} invoice(s)`);
    }
    console.log('');

    // Query 6: Get transactions
    console.log('6️⃣  Fetching transactions...');
    const transactionsStart = Date.now();
    const { data: transactions, error: transactionsError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('customer_id', customer.id)
      .order('initiated_at', { ascending: false })
      .limit(5);

    const transactionsTime = Date.now() - transactionsStart;

    if (transactionsError) {
      console.log(`   ❌ Failed (${transactionsTime}ms):`, transactionsError.message);
    } else {
      console.log(`   ✅ Success (${transactionsTime}ms): ${transactions.length} transaction(s)`);
    }
    console.log('');

    const totalTime = Date.now() - startTime;

    console.log('=' .repeat(60));
    console.log('📊 PERFORMANCE SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total execution time: ${totalTime}ms`);
    console.log(`Customer query: ${customerTime}ms`);
    console.log(`Services query: ${servicesTime}ms`);
    console.log(`Billing query: ${billingTime}ms`);
    console.log(`Orders query: ${ordersTime}ms`);
    console.log(`Invoices query: ${invoicesTime}ms`);
    console.log(`Transactions query: ${transactionsTime}ms`);
    console.log('=' .repeat(60));

    if (totalTime > 15000) {
      console.log('\n⚠️  WARNING: Total time exceeds 15 second timeout!');
      console.log('   The dashboard API will timeout and fail.');
      console.log('   Consider optimizing slow queries or increasing timeout.');
    } else if (totalTime > 10000) {
      console.log('\n⚠️  CAUTION: Total time is approaching timeout limit.');
    } else {
      console.log('\n✅ All queries completed within acceptable time.');
    }

    console.log('\n✅ Dashboard API test completed successfully!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the script
testDashboardAPI(targetEmail)
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });

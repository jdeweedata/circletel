// Check if account number system is implemented
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAccountNumberSystem() {
  console.log('Checking Account Number System Implementation\n');
  console.log('='.repeat(80));

  // Check 1: account_number_counter table
  console.log('\n1. Checking account_number_counter table...');
  try {
    const { data, error, count } = await supabase
      .from('account_number_counter')
      .select('*', { count: 'exact' });

    if (error) {
      console.log('   ❌ Table not found or not accessible');
      console.log(`   Error: ${error.message}`);
    } else {
      console.log('   ✅ Table exists');
      console.log(`   📊 Counters: ${count || 0}`);
      if (data && data.length > 0) {
        console.log('   Sample:', data[0]);
      }
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }

  // Check 2: customers.account_number column
  console.log('\n2. Checking customers table for account_number column...');
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, account_number')
      .limit(5);

    if (error) {
      console.log('   ❌ Error querying customers table');
      console.log(`   Error: ${error.message}`);
    } else {
      console.log('   ✅ account_number column exists');
      console.log(`   📊 Sample customers:\n`);

      if (data && data.length > 0) {
        data.forEach((customer, idx) => {
          const accountNum = customer.account_number || '(not set)';
          const name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email;
          console.log(`   ${idx + 1}. ${name}`);
          console.log(`      Account #: ${accountNum}`);
          console.log(`      Customer ID: ${customer.id.substring(0, 12)}...`);
        });
      } else {
        console.log('   No customers found');
      }
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }

  // Check 3: Test account number generation
  console.log('\n3. Checking account number generation function...');
  console.log('   (This would be tested when creating a new customer)\n');

  console.log('='.repeat(80));
  console.log('\n📋 RECOMMENDATIONS:\n');
  console.log('1. Display Format: CT-YYYY-NNNNN (e.g., CT-2025-00001)');
  console.log('2. Dashboard Location: Line 213 in app/dashboard/page.tsx');
  console.log('3. Current Code (WRONG):');
  console.log('   {data.customer.id && (');
  console.log('     <span className="text-sm text-gray-500 ml-2">(#{data.customer.id.substring(0, 12)})</span>');
  console.log('   )}');
  console.log('\n4. Should Be:');
  console.log('   {data.customer.account_number && (');
  console.log('     <span className="text-sm text-gray-500 ml-2">Account: {data.customer.account_number}</span>');
  console.log('   )}');
  console.log('\n');
}

checkAccountNumberSystem()
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

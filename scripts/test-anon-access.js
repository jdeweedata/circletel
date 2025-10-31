require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🧪 Testing Anonymous Access to Sensitive Table\n');
console.log('='.repeat(70));

// Create anon client (no authentication)
const anonSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  console.log('\nTest 1: Try to read admin_users (should FAIL)');
  console.log('-'.repeat(70));

  try {
    const { data, error } = await anonSupabase
      .from('admin_users')
      .select('email')
      .limit(1);

    if (error) {
      console.log('✅ GOOD: Access denied');
      console.log(`   Error code: ${error.code}`);
      console.log(`   Message: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log('❌ BAD: Data returned (RLS not working!)');
      console.log(`   Rows returned: ${data.length}`);
    } else if (data && data.length === 0) {
      console.log('⚠️  UNCLEAR: Empty result (policies may allow read but filter all rows)');
    }
  } catch (e) {
    console.log('✅ GOOD: Exception thrown');
    console.log(`   ${e.message}`);
  }

  console.log('\n\nTest 2: Try to read customers (should FAIL)');
  console.log('-'.repeat(70));

  try {
    const { data, error } = await anonSupabase
      .from('customers')
      .select('email')
      .limit(1);

    if (error) {
      console.log('✅ GOOD: Access denied');
      console.log(`   Error code: ${error.code}`);
      console.log(`   Message: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log('❌ BAD: Data returned (RLS not working!)');
      console.log(`   Rows returned: ${data.length}`);
    } else if (data && data.length === 0) {
      console.log('⚠️  UNCLEAR: Empty result (policies may allow read but filter all rows)');
      console.log('   This means anon CAN query the table structure!');
    }
  } catch (e) {
    console.log('✅ GOOD: Exception thrown');
    console.log(`   ${e.message}`);
  }

  console.log('\n\nTest 3: Try to read service_packages (should SUCCEED - public)');
  console.log('-'.repeat(70));

  try {
    const { data, error } = await anonSupabase
      .from('service_packages')
      .select('name')
      .limit(1);

    if (error) {
      console.log('❌ BAD: Access denied (should be public!)');
      console.log(`   Error code: ${error.code}`);
      console.log(`   Message: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log('✅ GOOD: Public access working');
      console.log(`   Rows returned: ${data.length}`);
    } else if (data && data.length === 0) {
      console.log('⚠️  No data returned (table might be empty or policy too restrictive)');
    }
  } catch (e) {
    console.log('❌ BAD: Exception thrown (should be accessible)');
    console.log(`   ${e.message}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📋 Interpretation:');
  console.log('   ✅ GOOD = RLS is working as expected');
  console.log('   ❌ BAD  = RLS is NOT working properly');
  console.log('   ⚠️  UNCLEAR = Needs investigation\n');
})();

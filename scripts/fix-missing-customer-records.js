/**
 * Fix Missing Customer Records Script
 * 
 * This script identifies auth users without corresponding customer records
 * and creates the missing records using the service role.
 * 
 * Run: node scripts/fix-missing-customer-records.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

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

async function fixMissingCustomerRecords() {
  console.log('🔍 Scanning for auth users without customer records...\n');

  try {
    // Get all auth users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      throw new Error(`Failed to fetch auth users: ${usersError.message}`);
    }

    console.log(`✅ Found ${users.length} auth users\n`);

    // Get all existing customer records
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('auth_user_id, email');

    if (customersError) {
      throw new Error(`Failed to fetch customers: ${customersError.message}`);
    }

    console.log(`✅ Found ${customers.length} customer records\n`);

    // Create a set of auth_user_ids that already have customer records
    const existingAuthUserIds = new Set(customers.map(c => c.auth_user_id));

    // Find auth users without customer records
    const missingUsers = users.filter(user => !existingAuthUserIds.has(user.id));

    if (missingUsers.length === 0) {
      console.log('✅ No missing customer records found. All users have corresponding customer records.\n');
      return;
    }

    console.log(`⚠️  Found ${missingUsers.length} users without customer records:\n`);

    // Process each missing user
    let successCount = 0;
    let failCount = 0;

    for (const user of missingUsers) {
      console.log(`\n📝 Processing user: ${user.email}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email verified: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   - Created: ${new Date(user.created_at).toLocaleString()}`);

      try {
        // Extract names from user metadata or use placeholders
        const firstName = user.user_metadata?.first_name || 
                          user.user_metadata?.full_name?.split(' ')[0] || 
                          'Customer';
        const lastName = user.user_metadata?.last_name || 
                         user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                         'User';
        const phone = user.user_metadata?.phone || user.phone || '';

        // Create customer record
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            auth_user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            email: user.email,
            phone: phone,
            account_type: 'personal',
            email_verified: !!user.email_confirmed_at,
            status: 'active',
          })
          .select()
          .single();

        if (createError) {
          console.log(`   ❌ Failed to create customer record: ${createError.message}`);
          console.log(`   Error code: ${createError.code}`);
          failCount++;
        } else {
          console.log(`   ✅ Customer record created successfully`);
          console.log(`   Customer ID: ${newCustomer.id}`);
          console.log(`   Name: ${newCustomer.first_name} ${newCustomer.last_name}`);
          successCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        failCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total users processed: ${missingUsers.length}`);
    console.log(`✅ Successfully created: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('='.repeat(60) + '\n');

    if (successCount > 0) {
      console.log('✅ Customer records have been created. Users can now access their dashboards.\n');
    }

    if (failCount > 0) {
      console.log('⚠️  Some records failed to create. Check the errors above for details.\n');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Starting customer record fix script...\n');
fixMissingCustomerRecords()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });

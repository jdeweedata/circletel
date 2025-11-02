// Backfill account numbers for existing customers
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backfillAccountNumbers() {
  console.log('='.repeat(80));
  console.log('BACKFILLING CUSTOMER ACCOUNT NUMBERS');
  console.log('='.repeat(80));
  console.log('\nFormat: CT-YYYY-NNNNN (e.g., CT-2025-00001)\n');

  // Step 1: Get customers without account numbers
  console.log('Step 1: Fetching customers without account numbers...\n');

  const { data: customers, error: fetchError } = await supabase
    .from('customers')
    .select('id, email, first_name, last_name, created_at, account_number')
    .is('account_number', null)
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('❌ Error fetching customers:', fetchError.message);
    process.exit(1);
  }

  if (!customers || customers.length === 0) {
    console.log('✅ All customers already have account numbers!');
    console.log('\nNo backfill needed.\n');
    process.exit(0);
  }

  console.log(`📋 Found ${customers.length} customers without account numbers:\n`);
  customers.forEach((customer, idx) => {
    const name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email;
    console.log(`${idx + 1}. ${name}`);
    console.log(`   Email: ${customer.email}`);
    console.log(`   Created: ${new Date(customer.created_at).toLocaleDateString()}`);
    console.log(`   ID: ${customer.id.substring(0, 12)}...`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('Step 2: Generating account numbers...\n');

  let successCount = 0;
  let errorCount = 0;
  const results = [];

  for (const customer of customers) {
    const name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email;

    try {
      // Call the generate_account_number() function
      const { data: accountNumberData, error: generateError } = await supabase.rpc(
        'generate_account_number'
      );

      if (generateError) {
        console.log(`❌ ${name}: Failed to generate account number`);
        console.log(`   Error: ${generateError.message}`);
        errorCount++;
        results.push({
          customer: name,
          status: 'FAILED',
          error: generateError.message,
          id: customer.id
        });
        continue;
      }

      const accountNumber = accountNumberData;

      // Update customer with generated account number
      const { error: updateError } = await supabase
        .from('customers')
        .update({ account_number: accountNumber })
        .eq('id', customer.id);

      if (updateError) {
        console.log(`❌ ${name}: Failed to update customer`);
        console.log(`   Error: ${updateError.message}`);
        errorCount++;
        results.push({
          customer: name,
          status: 'FAILED',
          error: updateError.message,
          id: customer.id,
          accountNumber
        });
        continue;
      }

      console.log(`✅ ${name}: ${accountNumber}`);
      successCount++;
      results.push({
        customer: name,
        status: 'SUCCESS',
        accountNumber,
        id: customer.id
      });

    } catch (err) {
      console.log(`❌ ${name}: Unexpected error`);
      console.log(`   Error: ${err.message}`);
      errorCount++;
      results.push({
        customer: name,
        status: 'FAILED',
        error: err.message,
        id: customer.id
      });
    }
  }

  // Step 3: Summary
  console.log('\n' + '='.repeat(80));
  console.log('BACKFILL SUMMARY');
  console.log('='.repeat(80));
  console.log(`\n✅ Success: ${successCount}/${customers.length}`);
  console.log(`❌ Failed: ${errorCount}/${customers.length}\n`);

  if (successCount > 0) {
    console.log('Successfully assigned account numbers:\n');
    results
      .filter(r => r.status === 'SUCCESS')
      .forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.customer}: ${r.accountNumber}`);
      });
  }

  if (errorCount > 0) {
    console.log('\n⚠️  Failed assignments:\n');
    results
      .filter(r => r.status === 'FAILED')
      .forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.customer}: ${r.error}`);
      });
  }

  console.log('\n' + '='.repeat(80));

  // Step 4: Verification
  console.log('Step 3: Verifying account numbers...\n');

  const { data: verifyData, error: verifyError } = await supabase
    .from('customers')
    .select('id, email, first_name, last_name, account_number')
    .order('account_number', { ascending: true })
    .limit(10);

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
  } else {
    console.log('📊 Current account numbers in database:\n');
    verifyData.forEach((customer, idx) => {
      const name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email;
      const accountNum = customer.account_number || '(not set)';
      console.log(`${idx + 1}. ${name}: ${accountNum}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n${successCount === customers.length ? '🎉' : '⚠️'}  Backfill ${successCount === customers.length ? 'Complete!' : 'Finished with Errors'}\n`);

  process.exit(errorCount > 0 ? 1 : 0);
}

backfillAccountNumbers()
  .catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });

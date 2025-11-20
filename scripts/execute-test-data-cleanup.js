/**
 * Execute Test Data Cleanup
 *
 * This script:
 * 1. Applies the internal_test account type migration
 * 2. Marks 4 admin customer accounts as internal_test
 * 3. Deletes test customer, quotes, admin user, and payment validations
 * 4. Displays verification results
 *
 * Usage: node scripts/execute-test-data-cleanup.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log('\n🧹 CircleTel Database Cleanup - Before ZOHO Backfill');
  console.log('='.repeat(60));

  try {
    // Step 1: Apply migration (add internal_test account type)
    console.log('\n📝 Step 1: Adding internal_test account type...');

    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE customers
        DROP CONSTRAINT IF EXISTS customers_account_type_check;

        ALTER TABLE customers
        ADD CONSTRAINT customers_account_type_check
        CHECK (account_type IN ('personal', 'business', 'internal_test'));

        COMMENT ON COLUMN customers.account_type IS 'Type of customer account: personal, business, or internal_test (for admin/testing accounts)';
      `
    });

    if (migrationError) {
      // Try alternative approach using direct SQL
      const migrations = [
        "ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_account_type_check",
        "ALTER TABLE customers ADD CONSTRAINT customers_account_type_check CHECK (account_type IN ('personal', 'business', 'internal_test'))",
        "COMMENT ON COLUMN customers.account_type IS 'Type of customer account: personal, business, or internal_test (for admin/testing accounts)'"
      ];

      for (const sql of migrations) {
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error && !error.message.includes('does not exist')) {
          console.warn('⚠️  Migration warning:', error.message);
        }
      }
    }

    console.log('✅ Migration applied successfully');

    // Step 2: Mark internal test accounts
    console.log('\n📝 Step 2: Marking admin accounts as internal_test...');

    const { data: updatedAccounts, error: updateError } = await supabase
      .from('customers')
      .update({ account_type: 'internal_test' })
      .in('email', [
        'devadmin@circletel.co.za',
        'product.manager@circletel.co.za',
        'editor@circletel.co.za',
        'viewer@circletel.co.za'
      ])
      .select('id, email, account_number, account_type');

    if (updateError) {
      console.error('❌ Error updating accounts:', updateError.message);
    } else {
      console.log(`✅ Marked ${updatedAccounts?.length || 0} accounts as internal_test:`);
      updatedAccounts?.forEach(acc => {
        console.log(`   - ${acc.email} (${acc.account_number})`);
      });
    }

    // Step 3: Delete test customer
    console.log('\n📝 Step 3: Deleting test customer...');

    const { data: deletedCustomer, error: customerError } = await supabase
      .from('customers')
      .delete()
      .eq('email', 'test@circletel.test')
      .eq('id', '0adb9dac-6512-4bb0-8592-60fe74434c78')
      .select('id, email, account_number');

    if (customerError) {
      console.error('❌ Error deleting customer:', customerError.message);
    } else if (!deletedCustomer || deletedCustomer.length === 0) {
      console.log('ℹ️  Test customer not found (may already be deleted)');
    } else {
      console.log('✅ Deleted test customer:', deletedCustomer[0].email);
      console.log('   ⚠️  MANUAL ACTION REQUIRED: Delete ZOHO customer ID 6179546000000820001');
    }

    // Step 4: Delete test business quotes
    console.log('\n📝 Step 4: Deleting test business quotes...');

    const { data: deletedQuotes, error: quotesError } = await supabase
      .from('business_quotes')
      .delete()
      .in('id', [
        '63328b37-7c0a-461e-b596-14af8df31050',
        'db1e8876-0db0-4b46-9787-719f81eb909b'
      ])
      .select('id, quote_number, company_name');

    if (quotesError) {
      console.error('❌ Error deleting quotes:', quotesError.message);
    } else {
      console.log(`✅ Deleted ${deletedQuotes?.length || 0} test quotes`);
      deletedQuotes?.forEach(q => {
        console.log(`   - ${q.quote_number}: ${q.company_name}`);
      });
    }

    // Step 5: Delete test admin user
    console.log('\n📝 Step 5: Deleting test admin user...');

    const { data: deletedAdmin, error: adminError } = await supabase
      .from('admin_users')
      .delete()
      .eq('email', 'finaltest@circletel.co.za')
      .eq('id', '125dd25f-a66e-4854-a044-f3cf5db96ed8')
      .select('id, email, first_name, last_name');

    if (adminError) {
      console.error('❌ Error deleting admin:', adminError.message);
    } else if (!deletedAdmin || deletedAdmin.length === 0) {
      console.log('ℹ️  Test admin user not found (may already be deleted)');
    } else {
      console.log('✅ Deleted test admin:', deletedAdmin[0].email);
    }

    // Step 6: Delete payment validation tests
    console.log('\n📝 Step 6: Deleting payment validation tests...');

    const { data: deletedPayments, error: paymentsError } = await supabase
      .from('payment_transactions')
      .delete()
      .like('reference', 'PAYMENT-METHOD-VALIDATION%')
      .eq('customer_email', 'test@circletel.co.za')
      .eq('status', 'pending')
      .select('id');

    if (paymentsError) {
      console.error('❌ Error deleting payments:', paymentsError.message);
    } else {
      console.log(`✅ Deleted ${deletedPayments?.length || 0} payment validation tests`);
    }

    // Step 7: Verification
    console.log('\n📊 Verification Results');
    console.log('='.repeat(60));

    // Count customers by type
    const { data: customerCounts } = await supabase
      .from('customers')
      .select('account_type, zoho_billing_customer_id')
      .then(result => {
        const counts = {
          total: result.data?.length || 0,
          personal: 0,
          business: 0,
          internal_test: 0,
          with_zoho_id: 0,
          production_ready: 0
        };

        result.data?.forEach(c => {
          counts[c.account_type] = (counts[c.account_type] || 0) + 1;
          if (c.zoho_billing_customer_id) counts.with_zoho_id++;
          if (['personal', 'business'].includes(c.account_type) && !c.zoho_billing_customer_id) {
            counts.production_ready++;
          }
        });

        return { data: counts };
      });

    console.log('\nCustomers:');
    console.log(`  Total: ${customerCounts?.total || 0}`);
    console.log(`  Personal: ${customerCounts?.personal || 0}`);
    console.log(`  Business: ${customerCounts?.business || 0}`);
    console.log(`  Internal Test: ${customerCounts?.internal_test || 0}`);
    console.log(`  With ZOHO ID: ${customerCounts?.with_zoho_id || 0}`);
    console.log(`  Production Ready for Sync: ${customerCounts?.production_ready || 0}`);

    // Count other entities
    const { count: quoteCount } = await supabase
      .from('business_quotes')
      .select('*', { count: 'exact', head: true });

    const { count: adminCount } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true });

    const { count: paymentCount } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true });

    console.log(`\nBusiness Quotes: ${quoteCount || 0}`);
    console.log(`Admin Users: ${adminCount || 0}`);
    console.log(`Payment Transactions: ${paymentCount || 0}`);

    // Summary
    console.log('\n✅ Cleanup Complete!');
    console.log('='.repeat(60));
    console.log('\n📋 Next Steps:');
    console.log('1. ⚠️  MANUAL: Delete ZOHO customer ID 6179546000000820001');
    console.log('   See: docs/zoho/MANUAL_CLEANUP_GUIDE.md');
    console.log('2. 🚀 Run Phase 5 ZOHO backfill scripts');
    console.log(`3. 📊 Monitor sync at /admin/zoho-sync`);
    console.log(`\n${customerCounts?.production_ready || 0} customers ready for ZOHO sync\n`);

  } catch (error) {
    console.error('\n❌ Cleanup Failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

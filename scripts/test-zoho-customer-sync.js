/**
 * Test ZOHO Customer Sync Service
 *
 * Tests syncing CircleTel customers to ZOHO Billing
 * Usage: node scripts/test-zoho-customer-sync.js [customer_id]
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { syncCustomerToZohoBilling, getCustomerSyncStatus, findCustomersNeedingSync } from '../lib/integrations/zoho/customer-sync-service.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCustomerSync() {
  console.log('\n=== ZOHO Customer Sync Test ===\n');

  try {
    // Get customer ID from args or find a test customer
    let customerId = process.argv[2];

    if (!customerId) {
      console.log('No customer ID provided, finding test customer...');

      // Try to find a customer that needs syncing
      const needingSyncIds = await findCustomersNeedingSync(1);

      if (needingSyncIds.length > 0) {
        customerId = needingSyncIds[0];
        console.log(`Found customer needing sync: ${customerId}`);
      } else {
        // Get any customer for testing
        const { data: customers } = await supabase
          .from('customers')
          .select('id, email, first_name, last_name')
          .limit(1);

        if (!customers || customers.length === 0) {
          console.error('❌ No customers found in database');
          return;
        }

        customerId = customers[0].id;
        console.log(`Using customer: ${customers[0].email}`);
      }
    }

    // Get customer details before sync
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (!customer) {
      console.error('❌ Customer not found:', customerId);
      return;
    }

    console.log('\n📋 Customer Details:');
    console.log('  ID:', customer.id);
    console.log('  Email:', customer.email);
    console.log('  Name:', `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'N/A');
    console.log('  Phone:', customer.phone || 'N/A');
    console.log('  Account Number:', customer.account_number || 'N/A');
    console.log('  Current ZOHO ID:', customer.zoho_billing_customer_id || 'Not synced');
    console.log('  Sync Status:', customer.zoho_sync_status || 'pending');

    // Check if already synced
    if (customer.zoho_billing_customer_id) {
      console.log('\n⚠️  Customer already synced to ZOHO');
      console.log('   ZOHO Customer ID:', customer.zoho_billing_customer_id);
      console.log('   Last Synced:', customer.zoho_last_synced_at || 'N/A');

      const resync = process.argv.includes('--force');
      if (!resync) {
        console.log('\n💡 Use --force to re-sync');

        // Show current sync status
        const status = await getCustomerSyncStatus(customerId);
        console.log('\n📊 Current Sync Status:', status);
        return;
      }

      console.log('\n🔄 Force re-sync enabled, proceeding...');
      // Clear ZOHO ID to force re-sync
      await supabase
        .from('customers')
        .update({
          zoho_billing_customer_id: null,
          zoho_sync_status: 'pending'
        })
        .eq('id', customerId);
    }

    // Perform sync
    console.log('\n🚀 Starting sync to ZOHO Billing...');
    const startTime = Date.now();

    const result = await syncCustomerToZohoBilling(customerId);

    const duration = Date.now() - startTime;
    console.log(`⏱️  Sync completed in ${duration}ms`);

    // Display results
    if (result.success) {
      console.log('\n✅ Sync Successful!');
      console.log('   ZOHO Customer ID:', result.zoho_customer_id);

      // Get updated customer data
      const { data: updatedCustomer } = await supabase
        .from('customers')
        .select('zoho_billing_customer_id, zoho_sync_status, zoho_last_synced_at')
        .eq('id', customerId)
        .single();

      console.log('\n📊 Updated Customer Record:');
      console.log('   ZOHO ID:', updatedCustomer.zoho_billing_customer_id);
      console.log('   Sync Status:', updatedCustomer.zoho_sync_status);
      console.log('   Last Synced:', updatedCustomer.zoho_last_synced_at);

      // Get sync status
      const status = await getCustomerSyncStatus(customerId);
      console.log('\n📈 Full Sync Status:', status);

      // Check sync logs
      const { data: logs } = await supabase
        .from('zoho_sync_logs')
        .select('*')
        .eq('entity_type', 'customer')
        .eq('entity_id', customerId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (logs && logs.length > 0) {
        console.log('\n📝 Latest Sync Log:');
        console.log('   Status:', logs[0].status);
        console.log('   Attempt:', logs[0].attempt_number);
        console.log('   Timestamp:', logs[0].created_at);
      }

    } else {
      console.error('\n❌ Sync Failed!');
      console.error('   Error:', result.error);

      // Get error details from database
      const { data: updatedCustomer } = await supabase
        .from('customers')
        .select('zoho_sync_status, zoho_last_sync_error')
        .eq('id', customerId)
        .single();

      console.error('\n📊 Customer Record:');
      console.error('   Sync Status:', updatedCustomer.zoho_sync_status);
      console.error('   Error:', updatedCustomer.zoho_last_sync_error);
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error);
    console.error('Stack:', error.stack);
  }
}

// Run test
testCustomerSync()
  .then(() => {
    console.log('\n=== Test Complete ===\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal Error:', error);
    process.exit(1);
  });

/**
 * Test ZOHO Subscription Sync Service
 *
 * Tests syncing CircleTel services to ZOHO Billing Subscriptions
 * Usage: node scripts/test-zoho-subscription-sync.js [service_id]
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { syncSubscriptionToZohoBilling, getSubscriptionSyncStatus, findSubscriptionsNeedingSync } from '../lib/integrations/zoho/subscription-sync-service.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSubscriptionSync() {
  console.log('\n=== ZOHO Subscription Sync Test ===\n');

  try {
    // Get service ID from args or find a test service
    let serviceId = process.argv[2];

    if (!serviceId) {
      console.log('No service ID provided, finding test service...');

      // Try to find a service that needs syncing
      const needingSyncIds = await findSubscriptionsNeedingSync(1);

      if (needingSyncIds.length > 0) {
        serviceId = needingSyncIds[0];
        console.log(`Found service needing sync: ${serviceId}`);
      } else {
        // Get any active service for testing
        const { data: services } = await supabase
          .from('customer_services')
          .select('id, status, customer_id')
          .eq('status', 'active')
          .limit(1);

        if (!services || services.length === 0) {
          console.error('❌ No active services found in database');
          return;
        }

        serviceId = services[0].id;
        console.log(`Using active service: ${serviceId}`);
      }
    }

    // Get service details before sync
    const { data: service } = await supabase
      .from('customer_services')
      .select(`
        *,
        customer:customers(*),
        package:service_packages(
          *,
          integration:product_integrations(*)
        )
      `)
      .eq('id', serviceId)
      .single();

    if (!service) {
      console.error('❌ Service not found:', serviceId);
      return;
    }

    console.log('\n📋 Service Details:');
    console.log('  ID:', service.id);
    console.log('  Customer:', service.customer?.email || 'N/A');
    console.log('  Package:', service.package?.name || 'N/A');
    console.log('  Monthly Price:', `R${service.monthly_price || service.package?.monthly_price || 0}`);
    console.log('  Status:', service.status);
    console.log('  Activation Date:', service.activation_date || 'N/A');
    console.log('  Next Billing:', service.next_billing_date || 'N/A');
    console.log('  Current ZOHO Subscription ID:', service.zoho_subscription_id || 'Not synced');
    console.log('  Sync Status:', service.zoho_sync_status || 'pending');

    // Check prerequisites
    console.log('\n🔍 Checking Prerequisites:');

    // Check customer sync
    if (!service.customer?.zoho_billing_customer_id) {
      console.log('  ⚠️  Customer not synced to ZOHO (will be synced automatically)');
      console.log('      Customer:', service.customer?.email);
    } else {
      console.log('  ✅ Customer synced to ZOHO:', service.customer.zoho_billing_customer_id);
    }

    // Check product/plan sync
    const planId = service.package?.integration?.[0]?.zoho_billing_plan_id;
    if (!planId) {
      console.error('\n❌ ERROR: Product/Plan not synced to ZOHO!');
      console.error('   Package:', service.package?.name);
      console.error('   Please publish the product to ZOHO first via admin panel');
      return;
    }
    console.log('  ✅ Product/Plan synced to ZOHO:', planId);

    // Check service status
    if (service.status !== 'active') {
      console.error('\n❌ ERROR: Service is not active:', service.status);
      console.error('   Only active services can be synced as subscriptions');
      return;
    }
    console.log('  ✅ Service is active');

    // Check if already synced
    if (service.zoho_subscription_id) {
      console.log('\n⚠️  Service already synced to ZOHO');
      console.log('   ZOHO Subscription ID:', service.zoho_subscription_id);
      console.log('   Last Synced:', service.zoho_last_synced_at || 'N/A');

      const resync = process.argv.includes('--force');
      if (!resync) {
        console.log('\n💡 Use --force to re-sync');

        // Show current sync status
        const status = await getSubscriptionSyncStatus(serviceId);
        console.log('\n📊 Current Sync Status:', status);
        return;
      }

      console.log('\n🔄 Force re-sync enabled, proceeding...');
      // Clear ZOHO ID to force re-sync
      await supabase
        .from('customer_services')
        .update({
          zoho_subscription_id: null,
          zoho_sync_status: 'pending'
        })
        .eq('id', serviceId);
    }

    // Perform sync
    console.log('\n🚀 Starting sync to ZOHO Billing...');
    const startTime = Date.now();

    const result = await syncSubscriptionToZohoBilling(serviceId);

    const duration = Date.now() - startTime;
    console.log(`⏱️  Sync completed in ${duration}ms`);

    // Display results
    if (result.success) {
      console.log('\n✅ Sync Successful!');
      console.log('   ZOHO Subscription ID:', result.zoho_subscription_id);
      console.log('   ℹ️  ZOHO will auto-generate recurring invoices from this subscription');

      // Get updated service data
      const { data: updatedService } = await supabase
        .from('customer_services')
        .select('zoho_subscription_id, zoho_sync_status, zoho_last_synced_at')
        .eq('id', serviceId)
        .single();

      console.log('\n📊 Updated Service Record:');
      console.log('   ZOHO Subscription ID:', updatedService.zoho_subscription_id);
      console.log('   Sync Status:', updatedService.zoho_sync_status);
      console.log('   Last Synced:', updatedService.zoho_last_synced_at);

      // Get sync status
      const status = await getSubscriptionSyncStatus(serviceId);
      console.log('\n📈 Full Sync Status:', status);

      // Check sync logs
      const { data: logs } = await supabase
        .from('zoho_sync_logs')
        .select('*')
        .eq('entity_type', 'subscription')
        .eq('entity_id', serviceId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (logs && logs.length > 0) {
        console.log('\n📝 Latest Sync Log:');
        console.log('   Status:', logs[0].status);
        console.log('   Attempt:', logs[0].attempt_number);
        console.log('   Timestamp:', logs[0].created_at);
        if (logs[0].response_payload) {
          console.log('   Subscription Number:', logs[0].response_payload.subscription_number || 'N/A');
          console.log('   ZOHO Status:', logs[0].response_payload.status || 'N/A');
        }
      }

    } else {
      console.error('\n❌ Sync Failed!');
      console.error('   Error:', result.error);

      // Get error details from database
      const { data: updatedService } = await supabase
        .from('customer_services')
        .select('zoho_sync_status, zoho_last_sync_error')
        .eq('id', serviceId)
        .single();

      console.error('\n📊 Service Record:');
      console.error('   Sync Status:', updatedService.zoho_sync_status);
      console.error('   Error:', updatedService.zoho_last_sync_error);
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error);
    console.error('Stack:', error.stack);
  }
}

// Run test
testSubscriptionSync()
  .then(() => {
    console.log('\n=== Test Complete ===\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal Error:', error);
    process.exit(1);
  });

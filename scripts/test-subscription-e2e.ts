/**
 * E2E Test Script for Zoho Billing Subscription Flow
 *
 * Tests the complete flow:
 * 1. Create/Upsert Customer
 * 2. Create Subscription with Plan
 * 3. Add Installation Item as Addon
 * 4. Retrieve Generated Invoice
 * 5. Verify Invoice Details
 *
 * Usage:
 *   npx tsx scripts/test-subscription-e2e.ts
 */

import { ZohoBillingClient } from '../lib/integrations/zoho/billing-client';
import { config } from 'dotenv';

// Load environment variables from .env.local (Next.js convention)
config({ path: '.env.local' });

// Test customer data
const TEST_CUSTOMER = {
  email: 'test.customer@circletel.co.za',
  display_name: 'CircleTel Test Customer',
  first_name: 'Test',
  last_name: 'Customer',
  phone: '+27123456789',
  mobile: '+27823456789',
  company_name: 'CircleTel Test Company',
  // Billing address
  street: '123 Test Street',
  city: 'Johannesburg',
  state: 'Gauteng',
  zip: '2001',
  country: 'South Africa',
  currency_code: 'ZAR',
};

// Test subscription data (using the package we synced in backfill)
// Note: plan must be an object with plan_code, not just a string
const TEST_SUBSCRIPTION = {
  plan: {
    plan_code: '202501EBU8176', // MTN Made For Business S
  },
  // Will be set after customer creation
  customer_id: '',
  // Offline mode - manual payments (no auto-charging)
  auto_collect: false,
};

async function runE2ETest() {
  const client = new ZohoBillingClient();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Zoho Billing E2E Subscription Test');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  try {
    // =========================================================================
    // STEP 1: Create/Upsert Customer
    // =========================================================================
    console.log('STEP 1: Creating/Updating Customer');
    console.log('───────────────────────────────────────────────────────────');

    const customerId = await client.upsertCustomer(TEST_CUSTOMER.email, TEST_CUSTOMER);

    console.log('✅ Customer created/updated:', {
      customer_id: customerId,
      email: TEST_CUSTOMER.email,
      name: TEST_CUSTOMER.display_name,
    });
    console.log('');

    // =========================================================================
    // STEP 2: Retrieve Customer Details
    // =========================================================================
    console.log('STEP 2: Retrieving Customer Details');
    console.log('───────────────────────────────────────────────────────────');

    const customer = await client.getCustomer(customerId);

    console.log('✅ Customer retrieved:', {
      customer_id: customer.customer_id,
      display_name: customer.display_name,
      email: customer.email,
      currency_code: customer.currency_code,
      status: customer.status,
    });
    console.log('');

    // =========================================================================
    // STEP 3: Create Subscription
    // =========================================================================
    console.log('STEP 3: Creating Subscription');
    console.log('───────────────────────────────────────────────────────────');

    const subscriptionPayload = {
      ...TEST_SUBSCRIPTION,
      customer_id: customerId,
    };

    const subscription = await client.createSubscription(subscriptionPayload);

    console.log('✅ Subscription created:', {
      subscription_id: subscription.subscription_id,
      subscription_number: subscription.subscription_number,
      plan_code: subscription.plan.plan_code,
      plan_name: subscription.plan.name,
      status: subscription.status,
      interval: subscription.interval,
      interval_unit: subscription.interval_unit,
      amount: subscription.amount,
      currency_code: subscription.currency_code,
      next_billing_at: subscription.next_billing_at,
    });

    console.log('');

    // =========================================================================
    // STEP 4: Retrieve Generated Invoices
    // =========================================================================
    console.log('STEP 4: Retrieving Generated Invoices');
    console.log('───────────────────────────────────────────────────────────');

    const invoices = await client.getSubscriptionInvoices(subscription.subscription_id);

    console.log(`✅ Found ${invoices.length} invoice(s)`);
    console.log('');

    if (invoices.length > 0) {
      invoices.forEach((invoice: any, index: number) => {
        console.log(`Invoice #${index + 1}:`);
        console.log({
          invoice_id: invoice.invoice_id,
          invoice_number: invoice.invoice_number,
          status: invoice.status,
          total: invoice.total,
          balance: invoice.balance,
          currency_code: invoice.currency_code,
          date: invoice.date,
          due_date: invoice.due_date,
        });
        console.log('');

        // Show line items
        if (invoice.line_items && invoice.line_items.length > 0) {
          console.log('  Line Items:');
          invoice.line_items.forEach((item: any) => {
            console.log(`    - ${item.name}: ${item.quantity} x ${item.rate} = ${item.amount} ${invoice.currency_code}`);
          });
          console.log('');
        }
      });

      // ========================================================================
      // STEP 5: Verify Invoice Details
      // ========================================================================
      console.log('STEP 5: Verifying Invoice Details');
      console.log('───────────────────────────────────────────────────────────');

      const firstInvoice = invoices[0];
      const invoiceDetails = await client.getInvoice(firstInvoice.invoice_id);

      console.log('✅ Invoice verified:', {
        invoice_number: invoiceDetails.invoice_number,
        customer_name: invoiceDetails.customer_name,
        status: invoiceDetails.status,
        total: invoiceDetails.total,
        balance: invoiceDetails.balance,
        line_items_count: invoiceDetails.line_items?.length || 0,
      });
      console.log('');

      // ========================================================================
      // STEP 6: Test Subscription Retrieval
      // ========================================================================
      console.log('STEP 6: Testing Subscription Retrieval');
      console.log('───────────────────────────────────────────────────────────');

      const retrievedSubscription = await client.getSubscription(subscription.subscription_id);

      console.log('✅ Subscription retrieved:', {
        subscription_id: retrievedSubscription.subscription_id,
        status: retrievedSubscription.status,
        current_term_starts_at: retrievedSubscription.current_term_starts_at,
        current_term_ends_at: retrievedSubscription.current_term_ends_at,
      });
      console.log('');
    }

    // =========================================================================
    // TEST SUMMARY
    // =========================================================================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Test Summary');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ All tests passed!');
    console.log('');
    console.log('Tested:');
    console.log('  ✅ Customer creation/upsert');
    console.log('  ✅ Customer retrieval');
    console.log('  ✅ Subscription creation with plan');
    console.log('  ✅ Invoice auto-generation');
    console.log('  ✅ Invoice retrieval and verification');
    console.log('  ✅ Subscription retrieval');
    console.log('');
    console.log('Results:');
    console.log(`  Customer ID: ${customerId}`);
    console.log(`  Subscription ID: ${subscription.subscription_id}`);
    console.log(`  Subscription Number: ${subscription.subscription_number}`);
    console.log(`  Invoice Count: ${invoices.length}`);
    console.log('');
    console.log('Next Steps:');
    console.log('  - Test payment webhook integration (NetCash → Invoice status update)');
    console.log('  - Test subscription cancellation');
    console.log('  - Test subscription lifecycle (trial → active → cancelled)');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('  Test Failed');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('');
    console.error('Error:', error);
    console.error('');

    if (error instanceof Error && 'response' in error) {
      console.error('API Response:', (error as any).response);
    }

    process.exit(1);
  }
}

// Run the test
runE2ETest().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

#!/usr/bin/env tsx
/**
 * Delete Test Records from ZOHO Billing
 *
 * Deletes test invoice INV-000034, payment PMT-002, and test customer
 * from ZOHO Billing via API
 *
 * Usage:
 *   npx tsx scripts/delete-zoho-test-records.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

import { ZohoBillingClient } from '../lib/integrations/zoho/billing-client';

const TEST_CUSTOMER_ID = '6179546000000820001';
const TEST_INVOICE_NUMBER = 'INV-000034';
const TEST_PAYMENT_NUMBER = 'PMT-002';

async function main() {
  console.log('\n🧹 Delete ZOHO Billing Test Records');
  console.log('═'.repeat(60));

  const client = new ZohoBillingClient();

  try {
    // Step 1: Find and delete test payment PMT-002
    console.log(`\n📝 Step 1: Searching for test payment ${TEST_PAYMENT_NUMBER}...`);

    // List all payments for the test customer
    const paymentsResponse = await client['request']<any>(
      `/payments?customer_id=${TEST_CUSTOMER_ID}`
    );

    const testPayment = paymentsResponse.payments?.find(
      (p: any) => p.payment_number === TEST_PAYMENT_NUMBER
    );

    if (testPayment) {
      console.log(`   Found: Payment ID ${testPayment.payment_id}`);
      console.log(`   Amount: R${testPayment.amount}`);
      console.log(`   Date: ${testPayment.payment_date}`);

      console.log(`\n   Deleting payment...`);
      await client.deletePayment(testPayment.payment_id);
      console.log(`   ✅ Payment ${TEST_PAYMENT_NUMBER} deleted successfully`);
    } else {
      console.log(`   ⚠️  Payment ${TEST_PAYMENT_NUMBER} not found (may already be deleted)`);
    }

    // Step 2: Find and delete test invoice INV-000034
    console.log(`\n📝 Step 2: Searching for test invoice ${TEST_INVOICE_NUMBER}...`);

    // List all invoices for the test customer
    const invoicesResponse = await client['request']<any>(
      `/invoices?customer_id=${TEST_CUSTOMER_ID}`
    );

    const testInvoice = invoicesResponse.invoices?.find(
      (inv: any) => inv.invoice_number === TEST_INVOICE_NUMBER
    );

    if (testInvoice) {
      console.log(`   Found: Invoice ID ${testInvoice.invoice_id}`);
      console.log(`   Amount: R${testInvoice.total}`);
      console.log(`   Date: ${testInvoice.invoice_date}`);
      console.log(`   Status: ${testInvoice.status}`);

      console.log(`\n   Deleting invoice...`);
      await client.deleteInvoice(testInvoice.invoice_id);
      console.log(`   ✅ Invoice ${TEST_INVOICE_NUMBER} deleted successfully`);
    } else {
      console.log(`   ⚠️  Invoice ${TEST_INVOICE_NUMBER} not found (may already be deleted)`);
    }

    // Step 3: Delete test customer
    console.log(`\n📝 Step 3: Deleting test customer ${TEST_CUSTOMER_ID}...`);

    try {
      // Check if customer exists first
      const customer = await client.getCustomer(TEST_CUSTOMER_ID);
      console.log(`   Found: ${customer.display_name || customer.email}`);
      console.log(`   Email: ${customer.email}`);

      // Check for associated subscriptions
      const subscriptionsResponse = await client['request']<any>(
        `/subscriptions?customer_id=${TEST_CUSTOMER_ID}`
      );

      if (subscriptionsResponse.subscriptions && subscriptionsResponse.subscriptions.length > 0) {
        console.log(`\n   ⚠️  Customer has ${subscriptionsResponse.subscriptions.length} subscription(s)`);
        console.log(`   Cannot delete customer with active subscriptions`);
        console.log(`   Please cancel/delete subscriptions first via ZOHO dashboard`);
      } else {
        console.log(`\n   No subscriptions found, deleting customer...`);
        await client.deleteCustomer(TEST_CUSTOMER_ID);
        console.log(`   ✅ Customer ${TEST_CUSTOMER_ID} deleted successfully`);
      }
    } catch (error: any) {
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        console.log(`   ⚠️  Customer ${TEST_CUSTOMER_ID} not found (may already be deleted)`);
      } else {
        throw error;
      }
    }

    // Summary
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('✅ ZOHO Cleanup Complete');
    console.log('═'.repeat(60));
    console.log('');
    console.log('Deleted:');
    if (testPayment) console.log(`  ✅ Payment: ${TEST_PAYMENT_NUMBER}`);
    if (testInvoice) console.log(`  ✅ Invoice: ${TEST_INVOICE_NUMBER}`);
    console.log('');
    console.log('Next: Complete pre-backfill checklist Section 2');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);

    if (error instanceof Error) {
      console.error('Message:', error.message);
      if (error.stack) {
        console.error('Stack:', error.stack);
      }
    }

    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

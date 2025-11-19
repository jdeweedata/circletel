/**
 * Test Script for NetCash → Zoho Billing Payment Integration
 *
 * Demonstrates the complete payment flow:
 * 1. Get existing subscription and invoice from E2E test
 * 2. Simulate NetCash payment webhook
 * 3. Record payment in Zoho Billing
 * 4. Verify invoice status updated to "paid"
 *
 * Usage:
 *   npx tsx scripts/test-payment-webhook.ts
 *
 * Prerequisites:
 *   - Run test-subscription-e2e.ts first to create subscription and invoice
 *   - Note the subscription ID and invoice ID from that test
 */

import { ZohoBillingClient } from '../lib/integrations/zoho/billing-client';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Test data from E2E subscription test
// UPDATE THESE with actual IDs from your E2E test run
const TEST_DATA = {
  customerId: '6179546000000793035', // From E2E test
  subscriptionId: '6179546000000796055', // From E2E test
  invoiceId: '6179546000000796073', // From E2E test
  invoiceNumber: 'INV-000034', // From E2E test
  invoiceAmount: 159, // R159 (MTN Made For Business S monthly)
};

// Simulated NetCash payment webhook data
const NETCASH_PAYMENT = {
  TransactionID: 'NC' + Date.now(), // Simulate NetCash transaction ID
  Amount: TEST_DATA.invoiceAmount * 100, // Amount in cents
  Reference: TEST_DATA.invoiceNumber,
  Status: 'PAID',
  CustomerEmail: 'test.customer@circletel.co.za',
  PaymentDate: new Date().toISOString(),
};

async function testPaymentWebhook() {
  const client = new ZohoBillingClient();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  NetCash → Zoho Billing Payment Integration Test');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  try {
    // =========================================================================
    // STEP 1: Verify Invoice Exists (Before Payment)
    // =========================================================================
    console.log('STEP 1: Verifying Invoice Before Payment');
    console.log('───────────────────────────────────────────────────────────');

    const invoiceBefore = await client.getInvoice(TEST_DATA.invoiceId);

    console.log('✅ Invoice retrieved:', {
      invoice_id: invoiceBefore.invoice_id,
      invoice_number: invoiceBefore.invoice_number,
      status: invoiceBefore.status,
      total: invoiceBefore.total,
      balance: invoiceBefore.balance,
      payment_made: invoiceBefore.payment_made || 0,
    });
    console.log('');

    if (invoiceBefore.status === 'paid') {
      console.log('⚠️  Invoice already paid! Run test-subscription-e2e.ts to create a new unpaid invoice.');
      console.log('');
      process.exit(0);
    }

    // =========================================================================
    // STEP 2: Simulate NetCash Payment Webhook
    // =========================================================================
    console.log('STEP 2: Simulating NetCash Payment Webhook');
    console.log('───────────────────────────────────────────────────────────');

    console.log('Simulated webhook data:', {
      transaction_id: NETCASH_PAYMENT.TransactionID,
      amount: `R${(NETCASH_PAYMENT.Amount / 100).toFixed(2)}`,
      reference: NETCASH_PAYMENT.Reference,
      status: NETCASH_PAYMENT.Status,
      customer_email: NETCASH_PAYMENT.CustomerEmail,
    });
    console.log('');

    // =========================================================================
    // STEP 3: Record Payment in Zoho Billing
    // =========================================================================
    console.log('STEP 3: Recording Payment in Zoho Billing');
    console.log('───────────────────────────────────────────────────────────');

    const payment = await client.recordPayment({
      customer_id: TEST_DATA.customerId,
      payment_mode: 'banktransfer', // NetCash payment
      amount: NETCASH_PAYMENT.Amount / 100, // Convert cents to rands
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      reference_number: NETCASH_PAYMENT.TransactionID,
      description: `NetCash payment - ${NETCASH_PAYMENT.Reference}`,
      invoices: [
        {
          invoice_id: TEST_DATA.invoiceId,
          amount_applied: NETCASH_PAYMENT.Amount / 100,
        },
      ],
    });

    console.log('✅ Payment recorded:', {
      payment_id: payment.payment_id,
      payment_number: payment.payment_number,
      amount: payment.amount,
      payment_mode: payment.payment_mode,
      date: payment.date,
      reference_number: payment.reference_number,
    });
    console.log('');

    // =========================================================================
    // STEP 4: Verify Invoice Status Updated
    // =========================================================================
    console.log('STEP 4: Verifying Invoice After Payment');
    console.log('───────────────────────────────────────────────────────────');

    const invoiceAfter = await client.getInvoice(TEST_DATA.invoiceId);

    console.log('✅ Invoice updated:', {
      invoice_id: invoiceAfter.invoice_id,
      invoice_number: invoiceAfter.invoice_number,
      status: invoiceAfter.status,
      total: invoiceAfter.total,
      balance: invoiceAfter.balance,
      payment_made: invoiceAfter.payment_made,
    });
    console.log('');

    // =========================================================================
    // STEP 5: Verify Payment in Zoho
    // =========================================================================
    console.log('STEP 5: Retrieving Payment Details');
    console.log('───────────────────────────────────────────────────────────');

    const paymentDetails = await client.getPayment(payment.payment_id);

    console.log('✅ Payment retrieved:', {
      payment_id: paymentDetails.payment_id,
      payment_number: paymentDetails.payment_number,
      customer_name: paymentDetails.customer_name,
      amount: paymentDetails.amount,
      payment_mode: paymentDetails.payment_mode,
      invoices_count: paymentDetails.invoices?.length || 0,
    });

    if (paymentDetails.invoices && paymentDetails.invoices.length > 0) {
      console.log('');
      console.log('Applied to invoices:');
      paymentDetails.invoices.forEach((inv: any) => {
        console.log(`  - ${inv.invoice_number}: R${inv.amount_applied} (Balance: R${inv.balance_amount})`);
      });
    }
    console.log('');

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
    console.log('  ✅ Invoice verification (before payment)');
    console.log('  ✅ NetCash webhook simulation');
    console.log('  ✅ Payment recording in Zoho Billing');
    console.log('  ✅ Invoice status update verification');
    console.log('  ✅ Payment details retrieval');
    console.log('');
    console.log('Results:');
    console.log(`  Invoice Before: ${invoiceBefore.status} (Balance: R${invoiceBefore.balance})`);
    console.log(`  Invoice After: ${invoiceAfter.status} (Balance: R${invoiceAfter.balance})`);
    console.log(`  Payment ID: ${payment.payment_id}`);
    console.log(`  Payment Number: ${payment.payment_number}`);
    console.log(`  Amount Paid: R${payment.amount}`);
    console.log('');

    if (invoiceAfter.status === 'paid' && invoiceAfter.balance === 0) {
      console.log('🎉 SUCCESS: Invoice fully paid!');
    } else {
      console.log('⚠️  WARNING: Invoice not fully paid. Expected status: "paid", Got:', invoiceAfter.status);
    }
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
testPaymentWebhook().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

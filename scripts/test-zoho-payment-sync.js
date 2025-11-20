/**
 * Test ZOHO Payment Sync Service
 *
 * Tests syncing CircleTel payments to ZOHO Billing
 * Usage: node scripts/test-zoho-payment-sync.js [payment_id]
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { syncPaymentToZohoBilling, getPaymentSyncStatus, findPaymentsNeedingSync } from '../lib/integrations/zoho/payment-sync-service.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPaymentSync() {
  console.log('\n=== ZOHO Payment Sync Test ===\n');

  try {
    // Get payment ID from args or find a test payment
    let paymentId = process.argv[2];

    if (!paymentId) {
      console.log('No payment ID provided, finding test payment...');

      // Try to find a payment that needs syncing
      const needingSyncIds = await findPaymentsNeedingSync(1);

      if (needingSyncIds.length > 0) {
        paymentId = needingSyncIds[0];
        console.log(`Found payment needing sync: ${paymentId}`);
      } else {
        // Get any completed payment for testing
        const { data: payments } = await supabase
          .from('payment_transactions')
          .select('id, transaction_reference, customer_id, amount')
          .eq('status', 'completed')
          .limit(1);

        if (!payments || payments.length === 0) {
          console.error('❌ No completed payments found in database');
          return;
        }

        paymentId = payments[0].id;
        console.log(`Using payment: ${payments[0].transaction_reference || paymentId.substring(0, 8)}`);
      }
    }

    // Get payment details before sync
    const { data: payment } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        customer:customers(*),
        invoice:customer_invoices(*)
      `)
      .eq('id', paymentId)
      .single();

    if (!payment) {
      console.error('❌ Payment not found:', paymentId);
      return;
    }

    console.log('\n📋 Payment Details:');
    console.log('  ID:', payment.id);
    console.log('  Transaction Ref:', payment.transaction_reference || 'N/A');
    console.log('  Customer:', payment.customer?.email || 'N/A');
    console.log('  Amount:', `R${payment.amount || 0}`);
    console.log('  Payment Method:', payment.payment_method || 'N/A');
    console.log('  Status:', payment.status);
    console.log('  Processed At:', payment.processed_at || 'N/A');
    console.log('  Description:', payment.description || 'N/A');

    // Show linked invoice
    if (payment.invoice_id && payment.invoice) {
      console.log('\n  Linked Invoice:');
      console.log('    Invoice Number:', payment.invoice.invoice_number || 'N/A');
      console.log('    Invoice Type:', payment.invoice.invoice_type || 'N/A');
      console.log('    Total Amount:', `R${payment.invoice.total_amount || 0}`);
      console.log('    ZOHO Invoice ID:', payment.invoice.zoho_billing_invoice_id || 'Not synced');
    } else {
      console.log('\n  ℹ️  No invoice linked (standalone payment)');
    }

    console.log('\n  Current ZOHO Payment ID:', payment.zoho_payment_id || 'Not synced');
    console.log('  Sync Status:', payment.zoho_sync_status || 'pending');

    // Check payment status
    console.log('\n🔍 Checking Payment Status:');
    if (payment.status !== 'completed') {
      console.error(`\n❌ ERROR: Payment is not completed: ${payment.status}`);
      console.error('   Only completed payments can be synced to ZOHO');
      return;
    }
    console.log('  ✅ Payment is completed');

    // Check prerequisites
    console.log('\n🔍 Checking Prerequisites:');

    // Check customer sync
    if (!payment.customer?.zoho_billing_customer_id) {
      console.log('  ⚠️  Customer not synced to ZOHO (will be synced automatically)');
      console.log('      Customer:', payment.customer?.email);
    } else {
      console.log('  ✅ Customer synced to ZOHO:', payment.customer.zoho_billing_customer_id);
    }

    // Check invoice sync (if linked)
    if (payment.invoice_id && payment.invoice) {
      if (!payment.invoice.zoho_billing_invoice_id) {
        console.log('  ⚠️  Invoice not synced to ZOHO (will be synced automatically)');
        console.log('      Invoice:', payment.invoice.invoice_number);
      } else {
        console.log('  ✅ Invoice synced to ZOHO:', payment.invoice.zoho_billing_invoice_id);
      }
    }

    // Check if already synced
    if (payment.zoho_payment_id) {
      console.log('\n⚠️  Payment already synced to ZOHO');
      console.log('   ZOHO Payment ID:', payment.zoho_payment_id);
      console.log('   Last Synced:', payment.zoho_last_synced_at || 'N/A');

      const resync = process.argv.includes('--force');
      if (!resync) {
        console.log('\n💡 Use --force to re-sync');

        // Show current sync status
        const status = await getPaymentSyncStatus(paymentId);
        console.log('\n📊 Current Sync Status:', status);
        return;
      }

      console.log('\n🔄 Force re-sync enabled, proceeding...');
      // Clear ZOHO ID to force re-sync
      await supabase
        .from('payment_transactions')
        .update({
          zoho_payment_id: null,
          zoho_sync_status: 'pending'
        })
        .eq('id', paymentId);
    }

    // Perform sync
    console.log('\n🚀 Starting sync to ZOHO Billing...');
    const startTime = Date.now();

    const result = await syncPaymentToZohoBilling(paymentId);

    const duration = Date.now() - startTime;
    console.log(`⏱️  Sync completed in ${duration}ms`);

    // Display results
    if (result.success) {
      console.log('\n✅ Sync Successful!');
      console.log('   ZOHO Payment ID:', result.zoho_payment_id);
      if (payment.invoice_id) {
        console.log('   ℹ️  Invoice will be marked as paid in ZOHO');
      }

      // Get updated payment data
      const { data: updatedPayment } = await supabase
        .from('payment_transactions')
        .select('zoho_payment_id, zoho_sync_status, zoho_last_synced_at')
        .eq('id', paymentId)
        .single();

      console.log('\n📊 Updated Payment Record:');
      console.log('   ZOHO Payment ID:', updatedPayment.zoho_payment_id);
      console.log('   Sync Status:', updatedPayment.zoho_sync_status);
      console.log('   Last Synced:', updatedPayment.zoho_last_synced_at);

      // Get sync status
      const status = await getPaymentSyncStatus(paymentId);
      console.log('\n📈 Full Sync Status:', status);

      // Check sync logs
      const { data: logs } = await supabase
        .from('zoho_sync_logs')
        .select('*')
        .eq('entity_type', 'payment')
        .eq('entity_id', paymentId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (logs && logs.length > 0) {
        console.log('\n📝 Latest Sync Log:');
        console.log('   Status:', logs[0].status);
        console.log('   Attempt:', logs[0].attempt_number);
        console.log('   Timestamp:', logs[0].created_at);
        if (logs[0].response_payload) {
          console.log('   Payment Number:', logs[0].response_payload.payment_number || 'N/A');
          console.log('   Amount:', `R${logs[0].response_payload.amount || 0}`);
        }
      }

    } else {
      console.error('\n❌ Sync Failed!');
      console.error('   Error:', result.error);

      // Get error details from database
      const { data: updatedPayment } = await supabase
        .from('payment_transactions')
        .select('zoho_sync_status, zoho_last_sync_error')
        .eq('id', paymentId)
        .single();

      console.error('\n📊 Payment Record:');
      console.error('   Sync Status:', updatedPayment.zoho_sync_status);
      console.error('   Error:', updatedPayment.zoho_last_sync_error);
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error);
    console.error('Stack:', error.stack);
  }
}

// Run test
testPaymentSync()
  .then(() => {
    console.log('\n=== Test Complete ===\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal Error:', error);
    process.exit(1);
  });

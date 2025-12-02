/**
 * Payment Sync Service
 *
 * Orchestrates payment recording to ZOHO Billing as "offline payments"
 * Called after NetCash webhook confirms successful payment
 *
 * Architecture:
 * 1. NetCash Pay Now → processes payment (20+ ZA methods)
 * 2. Webhook → /api/webhooks/netcash
 * 3. Supabase (SOURCE OF TRUTH) → update invoice, record payment
 * 4. Resend → send payment confirmation email (immediate)
 * 5. ZOHO Billing → async sync as "offline payment" (best-effort)
 *
 * @see agent-os/specs/20251202-unified-payment-billing/SPEC.md
 */

import { createClient } from '@/lib/supabase/server';
import { ZohoBillingClient } from '@/lib/integrations/zoho/billing-client';
import { logZohoSync } from '@/lib/integrations/zoho/billing-sync-logger';
import {
  type PaymentSyncRequest,
  type PaymentSyncResult,
  type PaymentSyncStatus,
  type InvoiceRecord,
  getZohoPaymentMode,
  PAYMENT_SYNC_RETRY_CONFIG,
} from './types';

// =============================================================================
// MAIN SYNC FUNCTION
// =============================================================================

/**
 * Sync a payment to ZOHO Billing as an offline payment
 *
 * @param request - Payment sync request with payment details
 * @returns Sync result with ZOHO payment ID or error
 */
export async function syncPaymentToZoho(
  request: PaymentSyncRequest
): Promise<PaymentSyncResult> {
  const supabase = await createClient();

  try {
    console.log('[PaymentSync] Starting sync for payment:', request.payment_id);

    // 1. Update sync status to 'syncing'
    await supabase
      .from('payment_transactions')
      .update({ zoho_sync_status: 'syncing' as PaymentSyncStatus })
      .eq('id', request.payment_id);

    // 2. Get invoice with ZOHO invoice ID
    const { data: invoice, error: invoiceError } = await supabase
      .from('customer_invoices')
      .select(`
        *,
        customer:customers(
          id,
          email,
          first_name,
          last_name,
          zoho_billing_customer_id
        )
      `)
      .eq('id', request.invoice_id)
      .single();

    if (invoiceError || !invoice) {
      throw new Error(`Invoice not found: ${request.invoice_id}`);
    }

    // 3. Check if invoice has ZOHO invoice ID
    const zohoInvoiceId = invoice.zoho_billing_invoice_id || invoice.zoho_invoice_id;
    if (!zohoInvoiceId) {
      console.log('[PaymentSync] Invoice not synced to ZOHO, skipping payment sync');

      // Mark as skipped - can't sync payment without ZOHO invoice
      await supabase
        .from('payment_transactions')
        .update({
          zoho_sync_status: 'skipped' as PaymentSyncStatus,
          zoho_last_sync_error: 'Invoice not synced to ZOHO Billing',
        })
        .eq('id', request.payment_id);

      await logZohoSync({
        entity_type: 'payment',
        entity_id: request.payment_id,
        zoho_entity_type: 'Payment',
        zoho_entity_id: null,
        status: 'failed',
        attempt_number: 1,
        error_message: 'Invoice not synced to ZOHO Billing - cannot record payment',
      });

      return {
        success: false,
        error: 'Invoice not synced to ZOHO Billing',
      };
    }

    // 4. Check if customer has ZOHO customer ID
    const zohoCustomerId = invoice.customer?.zoho_billing_customer_id;
    if (!zohoCustomerId) {
      throw new Error('Customer not synced to ZOHO Billing');
    }

    // 5. Map payment method to ZOHO payment mode
    const paymentMode = getZohoPaymentMode(request.payment_method);

    // 6. Build ZOHO payment payload
    const zohoPayload = {
      customer_id: zohoCustomerId,
      payment_mode: paymentMode,
      amount: request.amount,
      date: request.transaction_date.split('T')[0], // YYYY-MM-DD format
      reference_number: request.reference,
      description: `NetCash payment for Invoice ${invoice.invoice_number}`,
      invoices: [
        {
          invoice_id: zohoInvoiceId,
          amount_applied: request.amount,
        },
      ],
    };

    console.log('[PaymentSync] Recording payment in ZOHO:', {
      payment_id: request.payment_id,
      invoice_number: invoice.invoice_number,
      amount: request.amount,
      payment_mode: paymentMode,
    });

    // 7. Call ZOHO Billing API
    const billingClient = new ZohoBillingClient();
    const zohoPayment = await billingClient.recordPayment(zohoPayload);

    const zoho_payment_id = zohoPayment.payment_id;

    console.log('[PaymentSync] Successfully recorded payment in ZOHO:', {
      zoho_payment_id,
      payment_number: zohoPayment.payment_number,
      amount: zohoPayment.amount,
    });

    // 8. Update payment transaction with ZOHO payment ID
    await supabase
      .from('payment_transactions')
      .update({
        zoho_payment_id,
        zoho_sync_status: 'synced' as PaymentSyncStatus,
        zoho_last_synced_at: new Date().toISOString(),
        zoho_last_sync_error: null,
      })
      .eq('id', request.payment_id);

    // 9. Log successful sync
    await logZohoSync({
      entity_type: 'payment',
      entity_id: request.payment_id,
      zoho_entity_type: 'Payment',
      zoho_entity_id: zoho_payment_id,
      status: 'success',
      attempt_number: 1,
      request_payload: zohoPayload,
      response_payload: zohoPayment,
    });

    return {
      success: true,
      zoho_payment_id,
      attempt_number: 1,
    };

  } catch (error) {
    console.error('[PaymentSync] Error syncing payment:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update payment with error status
    await supabase
      .from('payment_transactions')
      .update({
        zoho_sync_status: 'failed' as PaymentSyncStatus,
        zoho_last_sync_error: errorMessage,
      })
      .eq('id', request.payment_id);

    // Log failed sync
    await logZohoSync({
      entity_type: 'payment',
      entity_id: request.payment_id,
      zoho_entity_type: 'Payment',
      zoho_entity_id: null,
      status: 'failed',
      attempt_number: 1,
      error_message: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
      retry_scheduled: true,
    };
  }
}

// =============================================================================
// RETRY LOGIC
// =============================================================================

/**
 * Retry failed payment syncs
 * Called by cron job every 4 hours
 *
 * @param limit - Maximum number of payments to retry
 * @returns Summary of retry results
 */
export async function retryFailedPaymentSyncs(
  limit: number = 50
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const supabase = await createClient();

  console.log('[PaymentSync] Starting retry of failed payment syncs');

  // Find failed payment syncs that haven't exceeded max attempts
  const { data: failedPayments, error } = await supabase
    .from('payment_transactions')
    .select(`
      id,
      reference,
      amount,
      payment_method,
      customer_id,
      invoice_id,
      initiated_at,
      metadata
    `)
    .eq('zoho_sync_status', 'failed')
    .eq('status', 'completed')
    .not('invoice_id', 'is', null)
    .limit(limit);

  if (error) {
    console.error('[PaymentSync] Error fetching failed payments:', error);
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  if (!failedPayments || failedPayments.length === 0) {
    console.log('[PaymentSync] No failed payments to retry');
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  console.log(`[PaymentSync] Found ${failedPayments.length} failed payments to retry`);

  let succeeded = 0;
  let failed = 0;

  for (const payment of failedPayments) {
    try {
      const result = await syncPaymentToZoho({
        payment_id: payment.id,
        invoice_id: payment.invoice_id!,
        customer_id: payment.customer_id!,
        amount: payment.amount,
        payment_method: payment.payment_method || 'unknown',
        reference: payment.reference,
        transaction_date: payment.initiated_at,
      });

      if (result.success) {
        succeeded++;
      } else {
        failed++;
      }

      // Small delay between retries to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error('[PaymentSync] Error retrying payment:', payment.id, error);
      failed++;
    }
  }

  console.log('[PaymentSync] Retry complete:', { processed: failedPayments.length, succeeded, failed });

  return {
    processed: failedPayments.length,
    succeeded,
    failed,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get sync status for a payment
 */
export async function getPaymentSyncStatus(payment_id: string): Promise<{
  synced: boolean;
  zoho_payment_id: string | null;
  sync_status: PaymentSyncStatus;
  last_synced_at: string | null;
  error: string | null;
} | null> {
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from('payment_transactions')
    .select('zoho_payment_id, zoho_sync_status, zoho_last_synced_at, zoho_last_sync_error')
    .eq('id', payment_id)
    .single();

  if (!payment) {
    return null;
  }

  return {
    synced: !!payment.zoho_payment_id,
    zoho_payment_id: payment.zoho_payment_id,
    sync_status: payment.zoho_sync_status as PaymentSyncStatus,
    last_synced_at: payment.zoho_last_synced_at,
    error: payment.zoho_last_sync_error,
  };
}

/**
 * Find payments that need syncing
 */
export async function findPaymentsNeedingSync(limit: number = 100): Promise<string[]> {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from('payment_transactions')
    .select('id')
    .eq('status', 'completed')
    .eq('zoho_sync_status', 'pending')
    .not('invoice_id', 'is', null)
    .limit(limit);

  return payments?.map(p => p.id) || [];
}

/**
 * Get count of payments by sync status
 */
export async function getPaymentSyncStats(): Promise<Record<PaymentSyncStatus, number>> {
  const supabase = await createClient();

  const statuses: PaymentSyncStatus[] = ['pending', 'syncing', 'synced', 'failed', 'skipped'];
  const stats: Record<PaymentSyncStatus, number> = {
    pending: 0,
    syncing: 0,
    synced: 0,
    failed: 0,
    skipped: 0,
  };

  for (const status of statuses) {
    const { count } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('zoho_sync_status', status);

    stats[status] = count || 0;
  }

  return stats;
}

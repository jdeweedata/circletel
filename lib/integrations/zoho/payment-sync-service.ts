/**
 * ZOHO Billing Payment Sync Service
 *
 * Syncs CircleTel payments to ZOHO Billing
 * Records payments and marks invoices as paid in ZOHO for reconciliation
 *
 * Prerequisites:
 * - Customer must be synced to ZOHO first
 * - Invoice must be synced to ZOHO (if payment is for an invoice)
 *
 * @see docs/architecture/ADMIN_SUPABASE_ZOHO_INTEGRATION.md
 */

import { createClient } from '@/lib/supabase/server';
import { ZohoBillingClient } from './billing-client';
import { syncCustomerToZohoBilling } from './customer-sync-service';
import { syncInvoiceToZohoBilling } from './invoice-sync-service';
import { logZohoSync } from './sync-service';

export interface PaymentSyncResult {
  success: boolean;
  zoho_payment_id?: string;
  error?: string;
}

/**
 * Sync a CircleTel payment to ZOHO Billing
 *
 * @param payment_id - CircleTel payment_transactions UUID
 * @returns Sync result with ZOHO payment ID or error
 */
export async function syncPaymentToZohoBilling(
  payment_id: string
): Promise<PaymentSyncResult> {
  const supabase = await createClient();

  try {
    console.log('[PaymentSync] Starting sync for payment:', payment_id);

    // Update sync status to 'syncing'
    await supabase
      .from('payment_transactions')
      .update({ zoho_sync_status: 'syncing' })
      .eq('id', payment_id);

    // Get payment data from Supabase
    const { data: payment, error: fetchError } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        customer:customers(*),
        invoice:customer_invoices(*)
      `)
      .eq('id', payment_id)
      .single();

    if (fetchError || !payment) {
      throw new Error(`Payment not found: ${payment_id}`);
    }

    // Check if payment is completed
    if (payment.status !== 'completed') {
      throw new Error(`Payment is not completed: ${payment.status}`);
    }

    // Check if already synced
    if (payment.zoho_payment_id) {
      console.log('[PaymentSync] Payment already synced:', payment.zoho_payment_id);
      return {
        success: true,
        zoho_payment_id: payment.zoho_payment_id
      };
    }

    // Prerequisite 1: Ensure customer is synced to ZOHO
    console.log('[PaymentSync] Checking customer sync status...');
    if (!payment.customer?.zoho_billing_customer_id) {
      console.log('[PaymentSync] Customer not synced, syncing now...');
      const customerSyncResult = await syncCustomerToZohoBilling(payment.customer_id);
      if (!customerSyncResult.success || !customerSyncResult.zoho_customer_id) {
        throw new Error(`Failed to sync customer: ${customerSyncResult.error}`);
      }
      // Refresh customer data
      const { data: updatedCustomer } = await supabase
        .from('customers')
        .select('zoho_billing_customer_id')
        .eq('id', payment.customer_id)
        .single();
      payment.customer.zoho_billing_customer_id = updatedCustomer?.zoho_billing_customer_id;
    }

    // Prerequisite 2: If payment is for an invoice, ensure invoice is synced
    let zoho_invoice_id: string | undefined = undefined;
    if (payment.invoice_id && payment.invoice) {
      console.log('[PaymentSync] Checking invoice sync status...');
      if (!payment.invoice.zoho_billing_invoice_id) {
        console.log('[PaymentSync] Invoice not synced, syncing now...');
        const invoiceSyncResult = await syncInvoiceToZohoBilling(payment.invoice_id);
        if (!invoiceSyncResult.success || !invoiceSyncResult.zoho_invoice_id) {
          throw new Error(`Failed to sync invoice: ${invoiceSyncResult.error}`);
        }
        // Refresh invoice data
        const { data: updatedInvoice } = await supabase
          .from('customer_invoices')
          .select('zoho_billing_invoice_id')
          .eq('id', payment.invoice_id)
          .single();
        payment.invoice.zoho_billing_invoice_id = updatedInvoice?.zoho_billing_invoice_id;
      }
      zoho_invoice_id = payment.invoice.zoho_billing_invoice_id;
    }

    console.log('[PaymentSync] Prerequisites met:', {
      customer_id: payment.customer.zoho_billing_customer_id,
      invoice_id: zoho_invoice_id || 'none'
    });

    // Build ZOHO Billing payment payload
    const zohoPayload = {
      customer_id: payment.customer.zoho_billing_customer_id,
      payment_mode: mapPaymentMethod(payment.payment_method || 'other'),
      amount: parseFloat(payment.amount || 0),
      date: payment.processed_at
        ? new Date(payment.processed_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      reference_number: payment.transaction_reference || payment.id.substring(0, 8),
      description: payment.description || `Payment via ${payment.payment_method}`,

      // Link to invoice if available
      invoices: zoho_invoice_id
        ? [
            {
              invoice_id: zoho_invoice_id,
              amount_applied: parseFloat(payment.amount || 0)
            }
          ]
        : undefined,

      // Custom fields for CircleTel reference
      cf_circletel_payment_id: payment.id,
      cf_payment_method: payment.payment_method || undefined,
      cf_transaction_reference: payment.transaction_reference || undefined,
    };

    // Remove undefined fields
    Object.keys(zohoPayload).forEach(key => {
      if (zohoPayload[key as keyof typeof zohoPayload] === undefined) {
        delete zohoPayload[key as keyof typeof zohoPayload];
      }
    });

    console.log('[PaymentSync] Recording ZOHO payment:', {
      payment_id,
      customer_email: payment.customer.email,
      amount: payment.amount,
      invoice_id: zoho_invoice_id || 'none'
    });

    // Record payment in ZOHO Billing
    const billingClient = new ZohoBillingClient();
    const zohoPayment = await billingClient.recordPayment(zohoPayload);

    const zoho_payment_id = zohoPayment.payment_id;

    console.log('[PaymentSync] Successfully recorded ZOHO payment:', {
      payment_id: zoho_payment_id,
      payment_number: zohoPayment.payment_number,
      amount: zohoPayment.amount
    });

    // Update payment with ZOHO payment ID
    await supabase
      .from('payment_transactions')
      .update({
        zoho_payment_id,
        zoho_sync_status: 'synced',
        zoho_last_synced_at: new Date().toISOString(),
        zoho_last_sync_error: null
      })
      .eq('id', payment_id);

    // Log successful sync
    await logZohoSync({
      entity_type: 'payment',
      entity_id: payment_id,
      zoho_entity_type: 'Payment',
      zoho_entity_id: zoho_payment_id,
      status: 'success',
      attempt_number: 1,
      request_payload: zohoPayload,
      response_payload: zohoPayment
    });

    return {
      success: true,
      zoho_payment_id
    };

  } catch (error) {
    console.error('[PaymentSync] Error syncing payment:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update payment with error status
    await supabase
      .from('payment_transactions')
      .update({
        zoho_sync_status: 'failed',
        zoho_last_sync_error: errorMessage
      })
      .eq('id', payment_id);

    // Log failed sync
    await logZohoSync({
      entity_type: 'payment',
      entity_id: payment_id,
      zoho_entity_type: 'Payment',
      zoho_entity_id: null,
      status: 'failed',
      attempt_number: 1,
      error_message: errorMessage,
      request_payload: null,
      response_payload: null
    });

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get sync status for a payment
 *
 * @param payment_id - CircleTel payment_transactions UUID
 * @returns Sync status details
 */
export async function getPaymentSyncStatus(payment_id: string) {
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
    sync_status: payment.zoho_sync_status,
    last_synced_at: payment.zoho_last_synced_at,
    error: payment.zoho_last_sync_error
  };
}

/**
 * Find completed payments that need syncing
 *
 * @param limit - Maximum number of payments to return
 * @returns Array of payment IDs needing sync
 */
export async function findPaymentsNeedingSync(limit: number = 100): Promise<string[]> {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from('payment_transactions')
    .select('id')
    .eq('status', 'completed')
    .is('zoho_payment_id', null)
    .eq('zoho_sync_status', 'pending')
    .limit(limit);

  return payments?.map(p => p.id) || [];
}

/**
 * Helper: Map CircleTel payment method to ZOHO payment mode
 */
function mapPaymentMethod(method: string): string {
  const methodMap: Record<string, string> = {
    'netcash': 'Bank Transfer',
    'eft': 'Bank Transfer',
    'bank_transfer': 'Bank Transfer',
    'credit_card': 'Credit Card',
    'debit_card': 'Debit Card',
    'cash': 'Cash',
    'check': 'Check',
    'other': 'Other'
  };

  const normalized = method.toLowerCase().replace(/[\s-_]/g, '_');
  return methodMap[normalized] || 'Other';
}

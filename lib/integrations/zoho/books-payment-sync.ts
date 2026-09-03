/**
 * Post a completed platform payment onto Zoho Books (the 3-way ledger).
 * Separate from Zoho Billing sync.
 */

import { createClient } from '@/lib/supabase/server';
import { getZohoBooksClient } from './books-api-client';
import { zohoLogger } from '@/lib/logging';

export interface BooksPaymentSyncResult {
  success: boolean;
  zoho_books_payment_id?: string;
  error?: string;
}

function mapPaymentMethod(method: string): string {
  const methodMap: Record<string, string> = {
    netcash: 'Bank Transfer',
    paynow: 'Bank Transfer',
    eft: 'Bank Transfer',
    bank_transfer: 'Bank Transfer',
    credit_card: 'Credit Card',
    debit_card: 'Debit Card',
    debit_order: 'Debit Order',
    cash: 'Cash',
    check: 'Check',
    other: 'Other',
  };
  const normalized = method.toLowerCase().replace(/[\s-]/g, '_');
  return methodMap[normalized] || 'Other';
}

export async function syncPaymentToZohoBooks(
  paymentId: string
): Promise<BooksPaymentSyncResult> {
  const supabase = await createClient();

  try {
    const { data: payment, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return { success: false, error: `Payment not found: ${paymentId}` };
    }

    if (payment.status !== 'completed') {
      return { success: false, error: `Payment is not completed: ${payment.status}` };
    }

    if (payment.zoho_books_payment_id) {
      return { success: true, zoho_books_payment_id: payment.zoho_books_payment_id };
    }

    const invoiceId = payment.customer_invoice_id || payment.invoice_id || null;
    let booksInvoiceId: string | null = null;
    let customerId: string | null = payment.customer_id || null;

    if (invoiceId) {
      const { data: invoice } = await supabase
        .from('customer_invoices')
        .select('id, zoho_books_invoice_id, customer_id')
        .eq('id', invoiceId)
        .maybeSingle();
      booksInvoiceId = invoice?.zoho_books_invoice_id ?? null;
      customerId = customerId || invoice?.customer_id || null;
    }

    if (!customerId) {
      return { success: false, error: 'Payment has no customer' };
    }

    const { data: customer } = await supabase
      .from('customers')
      .select('id, zoho_books_contact_id')
      .eq('id', customerId)
      .maybeSingle();

    if (!customer?.zoho_books_contact_id) {
      return { success: false, error: 'Customer not synced to Zoho Books' };
    }

    const payload = {
      customer_id: customer.zoho_books_contact_id,
      payment_mode: mapPaymentMethod(payment.payment_method || payment.provider || 'other'),
      amount: parseFloat(String(payment.amount || 0)),
      date: payment.completed_at
        ? new Date(payment.completed_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      reference_number:
        payment.reference ||
        payment.transaction_id ||
        paymentId.substring(0, 8),
      description: `Payment via ${payment.payment_method || payment.provider}`,
      invoices: booksInvoiceId
        ? [{ invoice_id: booksInvoiceId, amount_applied: parseFloat(String(payment.amount || 0)) }]
        : undefined,
    };

    const zohoPayment = await getZohoBooksClient().recordPayment(payload);

    await supabase
      .from('payment_transactions')
      .update({
        zoho_books_payment_id: zohoPayment.payment_id,
        zoho_sync_status: 'synced',
        zoho_last_synced_at: new Date().toISOString(),
        zoho_last_sync_error: null,
      })
      .eq('id', paymentId);

    zohoLogger.info('[BooksPaymentSync] Recorded Books payment', {
      paymentId,
      zohoPaymentId: zohoPayment.payment_id,
    });

    return { success: true, zoho_books_payment_id: zohoPayment.payment_id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    zohoLogger.error('[BooksPaymentSync] Failed', { paymentId, error: message });
    await supabase
      .from('payment_transactions')
      .update({
        zoho_sync_status: 'failed',
        zoho_last_sync_error: message,
      })
      .eq('id', paymentId);
    return { success: false, error: message };
  }
}

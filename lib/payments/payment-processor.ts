/**
 * Payment Processor
 * Handles NetCash payment webhook processing and invoice updates
 * Task Group 10: Invoice Generation & NetCash Payments
 */

import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { paymentLogger } from '@/lib/logging';
import type {
  NetcashPaymentWebhookPayload,
  PaymentTransactionRecord,
  PaymentStatus,
  isValidNetcashPayload,
  parseAmountFromCents,
  determinePaymentStatus,
} from './webhook-types';

const NETCASH_WEBHOOK_SECRET = process.env.NETCASH_WEBHOOK_SECRET;

/**
 * Verify NetCash webhook signature using HMAC-SHA256
 *
 * @param payload - Raw webhook payload string
 * @param signature - Signature from webhook headers
 * @returns true if signature is valid, false otherwise
 */
export function verifyNetCashWebhook(payload: string, signature: string): boolean {
  if (!NETCASH_WEBHOOK_SECRET) {
    paymentLogger.error('NETCASH_WEBHOOK_SECRET is not configured');
    throw new Error('NETCASH_WEBHOOK_SECRET is not configured');
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', NETCASH_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    paymentLogger.error('Webhook signature validation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Process NetCash payment webhook
 * Updates invoice status and creates payment transaction record
 *
 * @param payload - Webhook payload from NetCash
 */
export async function processPaymentWebhook(payload: NetcashPaymentWebhookPayload): Promise<void> {
  const supabase = await createClient();

  const {
    TransactionAccepted,
    Amount,
    Reference, // Invoice number
    Extra1, // Invoice ID
    RequestTrace
  } = payload;

  paymentLogger.info('Processing payment webhook', {
    invoiceId: Extra1,
    invoiceNumber: Reference,
    amount: Amount,
    accepted: TransactionAccepted,
    trace: RequestTrace,
  });

  // Validate required fields
  if (!Extra1 || !Amount || !RequestTrace) {
    paymentLogger.error('Missing required fields in webhook payload', { payload });
    throw new Error('Invalid webhook payload: missing required fields');
  }

  // Convert amount from cents to Rands
  const amountInRands = parseFloat(Amount) / 100;

  // Determine payment status
  const isAccepted = TransactionAccepted === 'true';
  const transactionStatus: PaymentStatus = isAccepted ? 'completed' : 'failed';

  // 1. Create payment_transactions record
  const { data: transaction, error: transactionError } = await supabase
    .from('payment_transactions')
    .insert({
      invoice_id: Extra1,
      transaction_id: RequestTrace,
      amount: amountInRands,
      currency: 'ZAR',
      payment_method: 'card', // Can be determined from payload if available
      status: transactionStatus,
      netcash_reference: Reference,
      netcash_response: payload,
      webhook_received_at: new Date().toISOString(),
      completed_at: isAccepted ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (transactionError) {
    paymentLogger.error('Failed to create transaction record', { error: transactionError.message });
    throw new Error(`Failed to create transaction record: ${transactionError.message}`);
  }

  paymentLogger.info('Transaction record created', { transactionId: transaction.id });

  // 2. Update invoice status
  if (isAccepted) {
    // Payment successful - mark invoice as paid
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        amount_paid: amountInRands,
        paid_date: new Date().toISOString().split('T')[0],
        payment_reference: RequestTrace,
        payment_method: 'card'
      })
      .eq('id', Extra1);

    if (invoiceError) {
      paymentLogger.error('Failed to update invoice', { error: invoiceError.message, invoiceId: Extra1 });
      throw new Error(`Failed to update invoice: ${invoiceError.message}`);
    }

    paymentLogger.info('Invoice marked as paid', { invoiceId: Extra1 });

    // 3. TODO: Trigger order fulfillment (Task Group 12)
    // This will be implemented in a future task group
    // await triggerOrderFulfillment(Extra1);

  } else {
    // Payment failed - mark invoice as unpaid
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        status: 'unpaid'
      })
      .eq('id', Extra1);

    if (invoiceError) {
      paymentLogger.error('Failed to update invoice status', { error: invoiceError.message, invoiceId: Extra1 });
      throw new Error(`Failed to update invoice status: ${invoiceError.message}`);
    }

    paymentLogger.info('Invoice marked as unpaid (payment failed)', { invoiceId: Extra1 });
  }
}

/**
 * Validate webhook payload structure
 * Ensures all required fields are present
 */
export function validateWebhookPayload(payload: unknown): payload is NetcashPaymentWebhookPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const p = payload as Record<string, unknown>;
  const requiredFields = [
    'TransactionAccepted',
    'Amount',
    'Reference',
    'Extra1', // Invoice ID
    'RequestTrace'
  ];

  return requiredFields.every(field => p[field] !== undefined);
}

/**
 * Get transaction status from NetCash payload
 */
export function getTransactionStatus(payload: NetcashPaymentWebhookPayload): PaymentStatus {
  return payload.TransactionAccepted === 'true' ? 'completed' : 'failed';
}

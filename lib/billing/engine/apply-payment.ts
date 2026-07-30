/**
 * Inbound payment application (ledger) — not CollectionRail.
 */

import { createClient } from '@/lib/supabase/server';
import { billingLogger } from '@/lib/logging';
import { assertTransition, type InvoiceDbStatus } from './state-machine';
import type { EngineAuditContext } from './types';

export interface ApplyPaymentParams {
  invoiceId: string;
  /** Absolute amount paid after this payment (or increment — see amountIsAbsolute) */
  amount: number;
  /** When true (default), `amount` is the new total amount_paid */
  amountIsAbsolute?: boolean;
  paymentReference?: string;
  paymentMethod?: string;
  paidAt?: string; // ISO
}

export function nextStatusAfterPayment(params: {
  current: InvoiceDbStatus;
  totalAmount: number;
  amountPaidAfter: number;
}): InvoiceDbStatus {
  const { current, totalAmount, amountPaidAfter } = params;

  // Terminal / non-collectable — refuse to reopen via payment helper
  if (current === 'voided' || current === 'cancelled') {
    throw new Error(`Cannot apply payment to invoice in status: ${current}`);
  }

  if (amountPaidAfter <= 0) {
    return current === 'draft' ? 'draft' : current;
  }

  if (amountPaidAfter + 0.001 >= totalAmount) {
    return 'paid';
  }

  // Partial payment from draft is illegal — must issue first
  if (current === 'draft') {
    throw new Error('Cannot apply partial payment to draft invoice; issue first');
  }

  return 'partial';
}

export async function applyPayment(
  params: ApplyPaymentParams,
  audit: EngineAuditContext = { source: 'webhook' }
): Promise<{ invoiceId: string; status: InvoiceDbStatus; amountPaid: number }> {
  const {
    invoiceId,
    amount,
    amountIsAbsolute = true,
    paymentReference,
    paymentMethod,
    paidAt,
  } = params;

  const supabase = await createClient();
  const { data: invoice, error } = await supabase
    .from('customer_invoices')
    .select('id, status, total_amount, amount_paid')
    .eq('id', invoiceId)
    .single();

  if (error || !invoice) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }

  const from = invoice.status as InvoiceDbStatus;
  const prevPaid = Number(invoice.amount_paid) || 0;
  const totalAmount = Number(invoice.total_amount) || 0;
  const amountPaidAfter = amountIsAbsolute ? amount : prevPaid + amount;

  const to = nextStatusAfterPayment({
    current: from,
    totalAmount,
    amountPaidAfter,
  });

  assertTransition(from, to);

  const now = paidAt || new Date().toISOString();
  const patch: Record<string, unknown> = {
    amount_paid: amountPaidAfter,
    updated_at: now,
  };
  if (to === 'paid') {
    patch.paid_at = now;
  }
  if (paymentReference) patch.payment_reference = paymentReference;
  if (paymentMethod) patch.payment_method = paymentMethod;

  const { error: updateError } = await supabase
    .from('customer_invoices')
    .update({
      status: to,
      ...patch,
    })
    .eq('id', invoiceId)
    .eq('status', from);

  if (updateError) {
    billingLogger.error('billingEngine.applyPayment failed', {
      invoiceId,
      error: updateError.message,
      source: audit.source,
    });
    throw new Error(`Failed to apply payment: ${updateError.message}`);
  }

  billingLogger.info('billingEngine.applyPayment', {
    invoiceId,
    from,
    to,
    amountPaidAfter,
    source: audit.source,
  });

  return { invoiceId, status: to, amountPaid: amountPaidAfter };
}

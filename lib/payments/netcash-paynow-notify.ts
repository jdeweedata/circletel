/**
 * Pure helpers for Netcash Pay Now server-notify classification.
 * Used by POST /api/payments/netcash/webhook so Success→Declined cannot leave invoices paid.
 */

export type PayNowNotifyStatus = 'completed' | 'failed' | 'cancelled' | 'pending';

/**
 * Parse TransactionAccepted without `||` collapsing boolean false.
 */
export function parseTransactionAccepted(
  body: Record<string, unknown>
): boolean | undefined {
  const raw = body.TransactionAccepted ?? body.transaction_accepted;
  if (raw === true || raw === 'true') return true;
  if (raw === false || raw === 'false') return false;
  return undefined;
}

export function parseNotifyAmount(body: Record<string, unknown>): number {
  const raw = body.Amount ?? body.amount ?? '0';
  const n = parseFloat(String(raw));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Classify a Pay Now notify payload into a payment status.
 */
export function classifyPayNowNotify(
  body: Record<string, unknown>
): PayNowNotifyStatus {
  const accepted = parseTransactionAccepted(body);
  const reason = String(body.Reason ?? body.reason ?? '');
  const responseCode = body.ResponseCode ?? body.response_code;

  if (accepted === true) return 'completed';
  if (accepted === false) {
    return reason.toLowerCase().includes('cancel') ? 'cancelled' : 'failed';
  }

  if (responseCode !== undefined && responseCode !== null && responseCode !== '') {
    if (responseCode === 0 || responseCode === '0') return 'completed';
    if (responseCode === 1 || responseCode === '1') return 'failed';
    if (responseCode === 2 || responseCode === '2') return 'cancelled';
  }

  if (reason.toLowerCase() === 'success') return 'completed';
  return 'pending';
}

/**
 * Invoice may be marked paid only on completed notifies with a positive amount.
 * R0 / Auth-only must never settle an invoice.
 */
export function shouldMarkInvoicePaid(
  status: PayNowNotifyStatus,
  amount: number
): boolean {
  return status === 'completed' && amount > 0;
}

/**
 * Declined/cancelled notifies for a prior Success on the same reference should reverse paid.
 */
export function shouldReverseInvoicePaid(
  status: PayNowNotifyStatus
): boolean {
  return status === 'failed' || status === 'cancelled';
}

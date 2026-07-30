import type {
  BuildExceptionRowsInput,
  ExceptionFilter,
  OpenArLike,
  PaymentLike,
  PaynowUnmatchedLike,
  ReconExceptionRow,
  ZohoStatus,
} from './types';

const INVOICE_HREF_PREFIX = '/admin/billing/invoices/';
const UNMATCHED_HREF = '/admin/finance/reconciliation';

const REASON_LABELS: Record<ReconExceptionRow['reasonCode'], string> = {
  no_ct_invoice: 'Cash received — no CircleTel invoice',
  paynow_unmatched: 'PayNow cash unmatched to invoice',
  zoho_payment_pending: 'Zoho payment sync pending',
  zoho_payment_failed: 'Zoho payment sync failed',
  open_ar: 'Open accounts receivable',
};

function normalizeZohoStatus(raw: string | null | undefined): ZohoStatus {
  switch (raw) {
    case 'synced':
    case 'pending':
    case 'failed':
    case 'skipped':
      return raw;
    default:
      return 'n/a';
  }
}

function invoiceHref(invoiceId: string | null): string | null {
  return invoiceId ? `${INVOICE_HREF_PREFIX}${invoiceId}` : UNMATCHED_HREF;
}

function paymentDate(p: PaymentLike): string {
  return p.completed_at ?? '';
}

function rowFromUnlinkedPayment(p: PaymentLike): ReconExceptionRow {
  return {
    id: p.id,
    kind: 'payment',
    date: paymentDate(p),
    netcashRef: p.reference,
    amount: p.amount,
    invoiceId: null,
    invoiceNumber: p.invoice_number ?? null,
    invoiceStatus: p.invoice_status ?? null,
    zohoStatus: normalizeZohoStatus(p.zoho_sync_status),
    reasonCode: 'no_ct_invoice',
    reasonLabel: REASON_LABELS.no_ct_invoice,
    severity: 'red',
    href: invoiceHref(null),
  };
}

function rowFromZohoLagPayment(p: PaymentLike): ReconExceptionRow | null {
  const zoho = normalizeZohoStatus(p.zoho_sync_status);
  if (zoho !== 'pending' && zoho !== 'failed') {
    return null;
  }

  const reasonCode = zoho === 'failed' ? 'zoho_payment_failed' : 'zoho_payment_pending';

  return {
    id: p.id,
    kind: 'payment',
    date: paymentDate(p),
    netcashRef: p.reference,
    amount: p.amount,
    invoiceId: p.customer_invoice_id,
    invoiceNumber: p.invoice_number ?? null,
    invoiceStatus: p.invoice_status ?? null,
    zohoStatus: zoho,
    reasonCode,
    reasonLabel: REASON_LABELS[reasonCode],
    severity: 'amber',
    href: invoiceHref(p.customer_invoice_id),
  };
}

function rowFromPaynowUnmatched(u: PaynowUnmatchedLike): ReconExceptionRow {
  return {
    id: u.id,
    kind: 'paynow_unmatched',
    date: u.date,
    netcashRef: u.netcashRef,
    amount: u.amount,
    invoiceId: null,
    invoiceNumber: null,
    invoiceStatus: null,
    zohoStatus: 'n/a',
    reasonCode: 'paynow_unmatched',
    reasonLabel: REASON_LABELS.paynow_unmatched,
    severity: 'red',
    href: UNMATCHED_HREF,
  };
}

function rowFromOpenAr(inv: OpenArLike): ReconExceptionRow {
  return {
    id: inv.id,
    kind: 'invoice_ar',
    date: inv.date,
    netcashRef: null,
    amount: inv.amount,
    invoiceId: inv.id,
    invoiceNumber: inv.invoice_number,
    invoiceStatus: inv.status,
    zohoStatus: 'n/a',
    reasonCode: 'open_ar',
    reasonLabel: REASON_LABELS.open_ar,
    severity: 'neutral',
    href: invoiceHref(inv.id),
  };
}

/**
 * Classify payments, unmatched PayNow cash, and open AR into exception rows.
 *
 * Red  = unmatched cash (day-done blocker)
 * Amber = Zoho lag on linked payments (secondary)
 * Neutral = open AR (optional queue)
 */
export function buildExceptionRows(input: BuildExceptionRowsInput): ReconExceptionRow[] {
  const rows: ReconExceptionRow[] = [];

  for (const payment of input.payments) {
    if (payment.status !== 'completed') {
      continue;
    }

    if (!payment.customer_invoice_id) {
      rows.push(rowFromUnlinkedPayment(payment));
      continue;
    }

    const zohoRow = rowFromZohoLagPayment(payment);
    if (zohoRow) {
      rows.push(zohoRow);
    }
  }

  for (const unmatched of input.paynowUnmatched) {
    rows.push(rowFromPaynowUnmatched(unmatched));
  }

  for (const inv of input.openArInvoices) {
    rows.push(rowFromOpenAr(inv));
  }

  return rows;
}

/** Day-done metric: count of red (unmatched cash) exception rows. */
export function countUnmatchedCash(rows: ReconExceptionRow[]): number {
  return rows.filter((r) => r.severity === 'red').length;
}

export function filterExceptions(
  rows: ReconExceptionRow[],
  filter: ExceptionFilter
): ReconExceptionRow[] {
  switch (filter) {
    case 'unmatched_cash':
      return rows.filter((r) => r.severity === 'red');
    case 'zoho_lag':
      return rows.filter((r) => r.severity === 'amber');
    case 'open_ar':
      return rows.filter((r) => r.reasonCode === 'open_ar');
    case 'all':
    default:
      return rows;
  }
}

import type {
  BuildExceptionRowsInput,
  ExceptionFilter,
  OpenArLike,
  PaymentLike,
  PaynowUnmatchedLike,
  ReconExceptionRow,
  ZohoStatus,
} from './types';
import { threeWayToExceptionHints } from './build-three-way';

const INVOICE_HREF_PREFIX = '/admin/billing/invoices/';
const UNMATCHED_HREF = '/admin/finance/reconciliation';

const REASON_LABELS: Record<ReconExceptionRow['reasonCode'], string> = {
  no_ct_invoice: 'Cash received — no CircleTel invoice',
  paynow_unmatched: 'PayNow cash unmatched to invoice',
  zoho_payment_pending: 'Zoho payment sync pending',
  zoho_payment_failed: 'Zoho payment sync failed',
  open_ar: 'Open accounts receivable',
  ct_paid_books_open: 'CT paid — Books still open / unlinked',
  amount_mismatch: 'CT vs Books amount mismatch',
  books_unlinked: 'Issued CT invoice not mirrored to Books',
  bank_netcash_no_books: 'Netcash settled — no Zoho bank/payment match',
  bank_books_no_netcash: 'Zoho bank deposit — no Netcash line',
  bank_amount_drift: 'Netcash ↔ Books bank amount/date drift',
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
 * Classify payments, unmatched PayNow cash, open AR, three-way flags, and bank mismatches.
 *
 * Red  = unmatched cash (day-done blocker) + hard bank gaps
 * Amber = Zoho lag / CT paid Books open / amount mismatch / unlinked issued
 * Neutral = open AR
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

  if (input.threeWayRows?.length) {
    for (const hint of threeWayToExceptionHints(input.threeWayRows)) {
      rows.push({
        id: hint.id,
        kind: 'three_way',
        date: hint.date,
        netcashRef: null,
        amount: hint.amount,
        invoiceId: hint.invoiceId,
        invoiceNumber: hint.invoiceNumber,
        invoiceStatus: hint.invoiceStatus,
        zohoStatus: hint.zohoStatus,
        reasonCode: hint.reasonCode,
        reasonLabel: REASON_LABELS[hint.reasonCode],
        severity: hint.severity,
        href: hint.href,
        booksInvoiceId: hint.booksInvoiceId,
        booksStatus: hint.booksStatus,
        booksBalance: hint.booksBalance,
        netcashState: hint.netcashState,
        serviceName: hint.serviceName,
        accountNumber: hint.accountNumber,
      });
    }
  }

  if (input.bankMismatchRows?.length) {
    rows.push(...input.bankMismatchRows);
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
    case 'netcash_unmatched':
      return rows.filter(
        (r) =>
          r.severity === 'red' ||
          r.reasonCode === 'no_ct_invoice' ||
          r.reasonCode === 'paynow_unmatched'
      );
    case 'zoho_lag':
      return rows.filter(
        (r) =>
          r.severity === 'amber' ||
          r.reasonCode === 'zoho_payment_pending' ||
          r.reasonCode === 'zoho_payment_failed' ||
          r.reasonCode === 'ct_paid_books_open' ||
          r.reasonCode === 'books_unlinked'
      );
    case 'open_ar':
      return rows.filter((r) => r.reasonCode === 'open_ar');
    case 'issued':
      return rows.filter((r) =>
        ['sent', 'overdue', 'partial', 'open'].includes(
          (r.invoiceStatus || '').toLowerCase()
        )
      );
    case 'paid':
      return rows.filter((r) => (r.invoiceStatus || '').toLowerCase() === 'paid');
    case 'voided':
      return rows.filter((r) =>
        ['voided', 'cancelled', 'void'].includes(
          (r.invoiceStatus || '').toLowerCase()
        )
      );
    case 'ct_paid_books_open':
      return rows.filter((r) => r.reasonCode === 'ct_paid_books_open');
    case 'amount_mismatch':
      return rows.filter((r) => r.reasonCode === 'amount_mismatch');
    case 'bank_mismatch':
      return rows.filter(
        (r) =>
          r.reasonCode === 'bank_netcash_no_books' ||
          r.reasonCode === 'bank_books_no_netcash' ||
          r.reasonCode === 'bank_amount_drift'
      );
    case 'all':
    default:
      return rows;
  }
}

/**
 * Pure builders for CircleTel ↔ Zoho Books ↔ Netcash invoice rows.
 */

import type {
  NetcashMatchState,
  ThreeWayInvoiceLike,
  ThreeWayInvoiceRow,
  ThreeWayMatchFilter,
  ZohoStatus,
} from './types';

const INVOICE_HREF_PREFIX = '/admin/billing/invoices/';

const AMOUNT_TOLERANCE = 0.05;

function normalizeZohoStatus(raw: string | null | undefined): ZohoStatus {
  switch (raw) {
    case 'synced':
    case 'pending':
    case 'failed':
    case 'skipped':
      return raw;
    case 'skipped_waived':
    case 'skipped_closed_period':
      return 'skipped';
    default:
      return 'n/a';
  }
}

function money(n: number | null | undefined): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function resolveNetcashState(inv: ThreeWayInvoiceLike): NetcashMatchState {
  if (inv.netcash_matched || inv.netcash_ref || inv.paynow_transaction_ref) {
    return 'matched';
  }
  const status = (inv.status || '').toLowerCase();
  if (status === 'paid' || status === 'partial') {
    return 'unmatched';
  }
  return 'none';
}

/**
 * Build a three-way invoice row from CT + optional Books/Netcash enrichment.
 */
export function buildThreeWayInvoiceRow(inv: ThreeWayInvoiceLike): ThreeWayInvoiceRow {
  const ctStatus = (inv.status || '').toLowerCase();
  const ctTotal = money(inv.total_amount);
  const booksTotal =
    inv.books_total != null ? money(inv.books_total) : null;
  const booksBalance =
    inv.books_balance != null ? money(inv.books_balance) : null;
  const booksStatus = inv.books_status ?? null;
  const booksOpen =
    booksBalance != null
      ? booksBalance > AMOUNT_TOLERANCE
      : booksStatus != null
        ? !['paid', 'void', 'voided'].includes(booksStatus.toLowerCase())
        : false;

  const ctPaid = ctStatus === 'paid';
  const ctPaidBooksOpen =
    ctPaid &&
    (Boolean(inv.zoho_books_invoice_id)
      ? booksOpen ||
        ['overdue', 'sent', 'partially_paid', 'draft'].includes(
          (booksStatus || '').toLowerCase()
        )
      : true);

  const amountMismatch =
    booksTotal != null && Math.abs(booksTotal - ctTotal) > AMOUNT_TOLERANCE;

  const booksUnlinked =
    !inv.zoho_books_invoice_id &&
    !['voided', 'cancelled', 'draft'].includes(ctStatus);

  const netcashState = resolveNetcashState(inv);
  const netcashUnmatchedPaid =
    (ctStatus === 'paid' || ctStatus === 'partial') &&
    netcashState === 'unmatched';

  return {
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    invoiceDate: inv.invoice_date,
    ctStatus,
    ctTotal,
    ctDue: money(inv.amount_due),
    accountNumber: inv.account_number ?? null,
    serviceName: inv.service_name ?? null,
    monthlyPrice:
      inv.monthly_price != null ? money(inv.monthly_price) : null,
    booksInvoiceId: inv.zoho_books_invoice_id,
    booksSyncStatus: normalizeZohoStatus(inv.zoho_sync_status),
    booksStatus,
    booksTotal,
    booksBalance,
    netcashState,
    netcashRef: inv.netcash_ref ?? inv.paynow_transaction_ref ?? null,
    matchFlags: {
      ctPaidBooksOpen,
      amountMismatch,
      booksUnlinked,
      netcashUnmatchedPaid,
    },
    href: `${INVOICE_HREF_PREFIX}${inv.id}`,
  };
}

export function buildThreeWayInvoiceRows(
  invoices: ThreeWayInvoiceLike[]
): ThreeWayInvoiceRow[] {
  return invoices.map(buildThreeWayInvoiceRow);
}

export function countCtPaidBooksOpen(rows: ThreeWayInvoiceRow[]): number {
  return rows.filter((r) => r.matchFlags.ctPaidBooksOpen).length;
}

export function filterThreeWayInvoices(
  rows: ThreeWayInvoiceRow[],
  filter: ThreeWayMatchFilter
): ThreeWayInvoiceRow[] {
  switch (filter) {
    case 'issued':
      return rows.filter((r) =>
        ['sent', 'overdue', 'partial', 'open'].includes(r.ctStatus)
      );
    case 'paid':
      return rows.filter((r) => r.ctStatus === 'paid');
    case 'voided':
      return rows.filter((r) =>
        ['voided', 'cancelled', 'void'].includes(r.ctStatus)
      );
    case 'ct_paid_books_open':
      return rows.filter((r) => r.matchFlags.ctPaidBooksOpen);
    case 'netcash_unmatched':
      return rows.filter((r) => r.matchFlags.netcashUnmatchedPaid);
    case 'amount_mismatch':
      return rows.filter((r) => r.matchFlags.amountMismatch);
    case 'bank_mismatch':
      return [];
    case 'all':
    default:
      return rows;
  }
}

/** Convert three-way mismatch flags into exception-shaped rows for the shared table. */
export function threeWayToExceptionHints(
  rows: ThreeWayInvoiceRow[]
): Array<{
  id: string;
  date: string;
  amount: number;
  invoiceId: string;
  invoiceNumber: string | null;
  invoiceStatus: string;
  zohoStatus: ZohoStatus;
  reasonCode:
    | 'ct_paid_books_open'
    | 'amount_mismatch'
    | 'books_unlinked';
  severity: 'red' | 'amber' | 'neutral';
  href: string;
  booksInvoiceId: string | null;
  booksStatus: string | null;
  booksBalance: number | null;
  netcashState: NetcashMatchState;
  serviceName: string | null;
  accountNumber: string | null;
}> {
  const out: ReturnType<typeof threeWayToExceptionHints> = [];

  for (const r of rows) {
    if (r.matchFlags.ctPaidBooksOpen) {
      out.push({
        id: `tw-paid-books-${r.id}`,
        date: r.invoiceDate || '',
        amount: r.ctTotal,
        invoiceId: r.id,
        invoiceNumber: r.invoiceNumber,
        invoiceStatus: r.ctStatus,
        zohoStatus: r.booksSyncStatus,
        reasonCode: 'ct_paid_books_open',
        severity: 'amber',
        href: r.href,
        booksInvoiceId: r.booksInvoiceId,
        booksStatus: r.booksStatus,
        booksBalance: r.booksBalance,
        netcashState: r.netcashState,
        serviceName: r.serviceName,
        accountNumber: r.accountNumber,
      });
    } else if (r.matchFlags.amountMismatch) {
      out.push({
        id: `tw-amt-${r.id}`,
        date: r.invoiceDate || '',
        amount: r.ctTotal,
        invoiceId: r.id,
        invoiceNumber: r.invoiceNumber,
        invoiceStatus: r.ctStatus,
        zohoStatus: r.booksSyncStatus,
        reasonCode: 'amount_mismatch',
        severity: 'amber',
        href: r.href,
        booksInvoiceId: r.booksInvoiceId,
        booksStatus: r.booksStatus,
        booksBalance: r.booksBalance,
        netcashState: r.netcashState,
        serviceName: r.serviceName,
        accountNumber: r.accountNumber,
      });
    } else if (r.matchFlags.booksUnlinked && r.ctStatus === 'sent') {
      out.push({
        id: `tw-unlink-${r.id}`,
        date: r.invoiceDate || '',
        amount: r.ctTotal,
        invoiceId: r.id,
        invoiceNumber: r.invoiceNumber,
        invoiceStatus: r.ctStatus,
        zohoStatus: r.booksSyncStatus,
        reasonCode: 'books_unlinked',
        severity: 'amber',
        href: r.href,
        booksInvoiceId: r.booksInvoiceId,
        booksStatus: r.booksStatus,
        booksBalance: r.booksBalance,
        netcashState: r.netcashState,
        serviceName: r.serviceName,
        accountNumber: r.accountNumber,
      });
    }
  }

  return out;
}

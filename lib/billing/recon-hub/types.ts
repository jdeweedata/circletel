/**
 * Pure types for the admin billing recon hub (cash-match + three-way day board).
 * No runtime deps — safe for client or server imports.
 */

export type ReconWindow = 'today' | 'yesterday' | '48h';

export type ExceptionFilter =
  | 'unmatched_cash'
  | 'zoho_lag'
  | 'open_ar'
  | 'issued'
  | 'paid'
  | 'voided'
  | 'ct_paid_books_open'
  | 'netcash_unmatched'
  | 'amount_mismatch'
  | 'bank_mismatch'
  | 'name_mismatch'
  | 'all';

export type ExceptionReasonCode =
  | 'no_ct_invoice'
  | 'paynow_unmatched'
  | 'zoho_payment_pending'
  | 'zoho_payment_failed'
  | 'open_ar'
  | 'ct_paid_books_open'
  | 'amount_mismatch'
  | 'books_unlinked'
  | 'bank_netcash_no_books'
  | 'bank_books_no_netcash'
  | 'bank_amount_drift'
  | 'name_mismatch';

export type ExceptionSeverity = 'red' | 'amber' | 'neutral';

export type ExceptionKind =
  | 'payment'
  | 'paynow_unmatched'
  | 'invoice_ar'
  | 'three_way'
  | 'bank_match';

export type ZohoStatus = 'n/a' | 'synced' | 'pending' | 'failed' | 'skipped';

export type NetcashMatchState =
  | 'matched'
  | 'unmatched'
  | 'none'
  | 'pending_queue';

export type ThreeWayMatchFilter =
  | 'issued'
  | 'paid'
  | 'voided'
  | 'ct_paid_books_open'
  | 'netcash_unmatched'
  | 'amount_mismatch'
  | 'bank_mismatch'
  | 'name_mismatch'
  | 'all';

export interface ReconExceptionRow {
  id: string;
  kind: ExceptionKind;
  date: string;
  netcashRef: string | null;
  amount: number;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceStatus: string | null;
  zohoStatus: ZohoStatus;
  reasonCode: ExceptionReasonCode;
  reasonLabel: string;
  severity: ExceptionSeverity;
  href: string | null;
  /** Optional three-way enrichment */
  booksInvoiceId?: string | null;
  booksStatus?: string | null;
  booksBalance?: number | null;
  netcashState?: NetcashMatchState;
  serviceName?: string | null;
  accountNumber?: string | null;
}

/** Payment-shaped input (subset of payment_transactions + optional invoice join). */
export interface PaymentLike {
  id: string;
  status: string;
  amount: number;
  /** NetCash / provider reference */
  reference: string | null;
  completed_at: string | null;
  customer_invoice_id: string | null;
  invoice_number?: string | null;
  invoice_status?: string | null;
  zoho_sync_status?: string | null;
}

/** Unmatched PayNow / NetCash cash detail that never linked to a CT invoice. */
export interface PaynowUnmatchedLike {
  id: string;
  amount: number;
  date: string;
  netcashRef: string | null;
}

/** Open accounts-receivable invoice (optional secondary queue). */
export interface OpenArLike {
  id: string;
  invoice_number: string | null;
  amount: number;
  status: string | null;
  date: string;
}

export interface BuildExceptionRowsInput {
  payments: PaymentLike[];
  paynowUnmatched: PaynowUnmatchedLike[];
  openArInvoices: OpenArLike[];
  threeWayRows?: ThreeWayInvoiceRow[];
  bankMismatchRows?: ReconExceptionRow[];
}

/** Platform invoice row enriched for three-way match. */
export interface ThreeWayInvoiceLike {
  id: string;
  invoice_number: string | null;
  status: string;
  invoice_date: string | null;
  due_date: string | null;
  total_amount: number;
  amount_due: number;
  amount_paid: number;
  zoho_books_invoice_id: string | null;
  zoho_sync_status: string | null;
  paynow_transaction_ref: string | null;
  customer_id: string;
  account_number?: string | null;
  customer_display_name?: string | null;
  books_customer_name?: string | null;
  service_name?: string | null;
  monthly_price?: number | null;
  /** Cached/live Books status when linked */
  books_status?: string | null;
  books_total?: number | null;
  books_balance?: number | null;
  /** Netcash settlement */
  netcash_matched?: boolean;
  netcash_ref?: string | null;
  payment_zoho_sync_status?: string | null;
}

export interface ThreeWayInvoiceRow {
  id: string;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  ctStatus: string;
  ctTotal: number;
  ctDue: number;
  accountNumber: string | null;
  customerDisplayName: string | null;
  serviceName: string | null;
  monthlyPrice: number | null;
  booksInvoiceId: string | null;
  booksSyncStatus: ZohoStatus;
  booksStatus: string | null;
  booksTotal: number | null;
  booksBalance: number | null;
  netcashState: NetcashMatchState;
  netcashRef: string | null;
  matchFlags: {
    ctPaidBooksOpen: boolean;
    amountMismatch: boolean;
    booksUnlinked: boolean;
    netcashUnmatchedPaid: boolean;
    nameMismatch: boolean;
  };
  href: string;
}

export interface ReconWindowBounds {
  from: string;
  to: string;
}

/** Summary KPI block for GET /api/admin/billing/recon-hub */
export interface ReconHubSummary {
  window: ReconWindow;
  windowFrom: string;
  windowTo: string;
  unmatchedNetcashToCt: number;
  netcashCompletedInWindow: number;
  netcashMatchedInWindow: number;
  zohoPaymentLagCount: number;
  /** CT paid but Books still open / lagging */
  ctPaidBooksOpenCount: number;
  dayDone: boolean;
  paynowRecon: {
    lastRunAt: string | null;
    status: 'success' | 'partial' | 'failed' | null;
    durationMs: number;
    unmatchedFromLastRun: number;
  };
  zohoBooks: {
    healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    failedEntityCount: number;
  };
  bankMatch?: {
    netcashOnlyCount: number;
    booksOnlyCount: number;
    driftCount: number;
  };
  secondary: {
    openAr: number;
    collectedLast30Days: number;
    activeServices: number;
  };
}

export interface ReconHubResponse {
  summary: ReconHubSummary;
  exceptions: ReconExceptionRow[];
  threeWayInvoices: ThreeWayInvoiceRow[];
}

/**
 * Pure types for the admin billing recon hub (cash-match day board).
 * No runtime deps — safe for client or server imports.
 */

export type ReconWindow = 'today' | 'yesterday' | '48h';

export type ExceptionFilter = 'unmatched_cash' | 'zoho_lag' | 'open_ar' | 'all';

export type ExceptionReasonCode =
  | 'no_ct_invoice'
  | 'paynow_unmatched'
  | 'zoho_payment_pending'
  | 'zoho_payment_failed'
  | 'open_ar';

export type ExceptionSeverity = 'red' | 'amber' | 'neutral';

export type ExceptionKind = 'payment' | 'paynow_unmatched' | 'invoice_ar';

export type ZohoStatus = 'n/a' | 'synced' | 'pending' | 'failed' | 'skipped';

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
  secondary: {
    openAr: number;
    collectedLast30Days: number;
    activeServices: number;
  };
}

export interface ReconHubResponse {
  summary: ReconHubSummary;
  exceptions: ReconExceptionRow[];
}

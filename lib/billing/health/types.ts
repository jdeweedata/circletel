/**
 * Shared types for the Billing Health dashboard
 * (`/admin/billing` + `GET /api/admin/billing/health`).
 */

export type AgingBucketKey = 'current' | '1-7d' | '8-30d' | '31-60d' | '61d+';

export interface AgingBuckets {
  current: number;
  '1-7d': number;
  '8-30d': number;
  '31-60d': number;
  '61d+': number;
}

export interface BillingHealthTrendPoint {
  /** Short label, e.g. "Jan 2026" */
  month: string;
  invoiced: number;
  collected: number;
  /** MRR reference line (current active-services MRR) */
  mrr: number;
}

export interface SuspensionWatchlistEntry {
  customerId: string;
  customerName: string;
  /** Max days past due across the customer's unpaid invoices */
  daysPastDue: number;
  agingBucket: AgingBucketKey;
  overdueInvoiceCount: number;
  overdueAmount: number;
  /** Active service ids — used by the Suspend action */
  activeServiceIds: string[];
  href: string;
}

export interface OverdueInvoiceRow {
  id: string;
  invoiceNumber: string;
  customerName: string;
  packageName: string | null;
  dueDate: string;
  daysOverdue: number;
  agingBucket: AgingBucketKey;
  amountDue: number;
  href: string;
}

export interface BillingHealthResponse {
  generatedAt: string;
  mrr: {
    current: number;
    /** Approximation: active services created before the 1st of this month */
    previous: number;
    momChangePct: number | null;
    /** e.g. "Delta vs Jun" */
    deltaLabel: string;
  };
  pastDue: {
    /** Sum of amount_due across all unpaid invoices (includes current bucket) */
    totalAmount: number;
    customerCount: number;
  };
  suspension: {
    candidates: number;
    /** Customers with max days past due >= 31 */
    urgent: number;
    policyDays: number;
  };
  unpaid: {
    total: number;
    overdue: number;
  };
  trend: BillingHealthTrendPoint[];
  aging: AgingBuckets;
  watchlist: SuspensionWatchlistEntry[];
  overdueInvoices: OverdueInvoiceRow[];
}

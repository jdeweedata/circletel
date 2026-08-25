/**
 * Pure helpers for the Billing Health dashboard — aging buckets,
 * days-past-due math, watchlist and register builders. Unit-tested.
 */

import type {
  AgingBucketKey,
  AgingBuckets,
  OverdueInvoiceRow,
  SuspensionWatchlistEntry,
} from './types';

/** Days between a due date and "today" (positive = past due). */
export function daysPastDue(dueDateISO: string, todayISO: string): number {
  const due = Date.parse(`${dueDateISO.slice(0, 10)}T00:00:00Z`);
  const today = Date.parse(`${todayISO.slice(0, 10)}T00:00:00Z`);
  return Math.round((today - due) / 86_400_000);
}

/** Map days past due (<= 0 = not yet due) to an aging bucket. */
export function agingBucketForDays(days: number): AgingBucketKey {
  if (days <= 0) return 'current';
  if (days <= 7) return '1-7d';
  if (days <= 30) return '8-30d';
  if (days <= 60) return '31-60d';
  return '61d+';
}

export const AGING_BUCKET_LABELS: Record<AgingBucketKey, string> = {
  current: 'Current',
  '1-7d': '1-7d',
  '8-30d': '8-30d',
  '31-60d': '31-60d',
  '61d+': '61d+',
};

export interface UnpaidInvoiceInput {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  packageName: string | null;
  dueDate: string; // ISO date
  amountDue: number;
}

export function buildAgingBuckets(
  invoices: UnpaidInvoiceInput[],
  todayISO: string
): AgingBuckets {
  const buckets: AgingBuckets = {
    current: 0,
    '1-7d': 0,
    '8-30d': 0,
    '31-60d': 0,
    '61d+': 0,
  };
  for (const inv of invoices) {
    const bucket = agingBucketForDays(daysPastDue(inv.dueDate, todayISO));
    buckets[bucket] += inv.amountDue;
  }
  return buckets;
}

/**
 * Suspension watchlist — one row per customer with at least one invoice
 * past its due date, sorted by max days past due (desc).
 */
export function buildWatchlist(
  invoices: UnpaidInvoiceInput[],
  todayISO: string,
  activeServiceIdsByCustomer: Map<string, string[]>
): SuspensionWatchlistEntry[] {
  const byCustomer = new Map<string, SuspensionWatchlistEntry>();

  for (const inv of invoices) {
    const days = daysPastDue(inv.dueDate, todayISO);
    if (days <= 0) continue; // watchlist = past due only

    const existing = byCustomer.get(inv.customerId);
    if (existing) {
      existing.overdueInvoiceCount += 1;
      existing.overdueAmount += inv.amountDue;
      if (days > existing.daysPastDue) {
        existing.daysPastDue = days;
        existing.agingBucket = agingBucketForDays(days);
      }
    } else {
      byCustomer.set(inv.customerId, {
        customerId: inv.customerId,
        customerName: inv.customerName,
        daysPastDue: days,
        agingBucket: agingBucketForDays(days),
        overdueInvoiceCount: 1,
        overdueAmount: inv.amountDue,
        activeServiceIds: activeServiceIdsByCustomer.get(inv.customerId) ?? [],
        href: `/admin/customers/${inv.customerId}`,
      });
    }
  }

  return Array.from(byCustomer.values()).sort(
    (a, b) => b.daysPastDue - a.daysPastDue
  );
}

/**
 * Overdue invoice register — unpaid invoices past due date,
 * sorted by days overdue (desc).
 */
export function buildOverdueRegister(
  invoices: UnpaidInvoiceInput[],
  todayISO: string
): OverdueInvoiceRow[] {
  return invoices
    .map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      packageName: inv.packageName,
      dueDate: inv.dueDate,
      daysOverdue: daysPastDue(inv.dueDate, todayISO),
      agingBucket: agingBucketForDays(daysPastDue(inv.dueDate, todayISO)),
      amountDue: inv.amountDue,
      href: `/admin/billing/invoices/${inv.id}`,
    }))
    .filter((row) => row.daysOverdue > 0)
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}

/** Distinct customer count across unpaid invoices. */
export function countUnpaidCustomers(invoices: UnpaidInvoiceInput[]): number {
  return new Set(invoices.map((inv) => inv.customerId)).size;
}

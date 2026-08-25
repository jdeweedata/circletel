/**
 * Service ↔ invoice coverage (entitlement leakage).
 * Wayfinder: .scratch/revenue-leakage-service-invoice/
 *
 * Ticket 03: billable = active + past start + clinic delay; voided-only ≠ covered.
 * Ticket 04: period hybrid range-first; SAST calendar months.
 * Deferrals: five Unjani sites first bill 2026-10-01 (or cancel).
 */

import { isBeforeBillingStart } from '@/lib/billing/billing-eligibility';
import {
  isClinicBillingCategory,
  shouldEmitRecurringInvoice,
} from '@/lib/billing/new-clinic-billing-helper';

export const QUALIFYING_INVOICE_STATUSES = [
  'sent',
  'partial',
  'paid',
  'overdue',
] as const;

export type QualifyingInvoiceStatus = (typeof QUALIFYING_INVOICE_STATUSES)[number];

/** Sites whose first bill is deferred to this ISO date (inclusive). */
export const BILLING_EFFECTIVE_FROM: Array<{
  businessNameIncludes: string;
  effectiveFrom: string; // YYYY-MM-DD
}> = [
  { businessNameIncludes: 'Alexandra', effectiveFrom: '2026-10-01' },
  { businessNameIncludes: 'Chloorkop', effectiveFrom: '2026-10-01' },
  { businessNameIncludes: 'Oukasie', effectiveFrom: '2026-10-01' },
  { businessNameIncludes: 'Phoenix', effectiveFrom: '2026-10-01' },
  { businessNameIncludes: 'Sicelo', effectiveFrom: '2026-10-01' },
];

export type GapReason =
  | 'covered'
  | 'deferred_effective_date'
  | 'not_yet_due_billing_start'
  | 'not_yet_due_clinic_delay'
  | 'void_only'
  | 'no_invoice'
  | 'excluded_inactive';

export interface ServiceRow {
  id: string;
  customer_id: string;
  package_name: string | null;
  monthly_price: number | null;
  status: string | null;
  active: boolean | null;
  billing_day: number | null;
  last_invoice_date: string | null;
  activation_date: string | null;
  billing_start_date: string | null;
  product_category: string | null;
  customer_name?: string | null;
  customer_business_name?: string | null;
}

export interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  service_id: string | null;
  status: string | null;
  period_start: string | null;
  period_end: string | null;
  invoice_date: string | null;
  total_amount: number | null;
}

export interface CoverageLine {
  serviceId: string;
  customerId: string;
  customerName: string;
  packageName: string | null;
  monthlyPrice: number;
  billingDay: number | null;
  activationDate: string | null;
  lastInvoiceDate: string | null;
  reason: GapReason;
  invoiceNumber: string | null;
  invoiceStatus: string | null;
  matchHow: string | null;
}

export interface CoverageReport {
  period: string; // YYYY-MM
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  summary: {
    activeServices: number;
    billable: number;
    covered: number;
    deferred: number;
    notYetDue: number;
    gaps: number;
    gapCatalogMrr: number;
    coveredCatalogMrr: number;
  };
  lines: CoverageLine[];
}

function parseDateOnly(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = s.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  return new Date(`${d}T00:00:00.000Z`);
}

/** First/last calendar day of YYYY-MM as UTC date-only anchors (SAST business months stored as dates). */
export function periodBounds(period: string): { start: string; end: string; y: number; m: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) throw new Error(`Invalid period ${period}; expected YYYY-MM`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) throw new Error(`Invalid month in period ${period}`);
  const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const start = `${y}-${String(mo).padStart(2, '0')}-01`;
  const end = `${y}-${String(mo).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end, y, m: mo };
}

/**
 * Ticket 04: invoice covers period month if range overlaps, else period_start month,
 * else invoice_date month (flagged).
 */
export function invoiceCoversPeriod(
  inv: InvoiceRow,
  period: string
): { covers: boolean; how: string | null } {
  const status = (inv.status || '').toLowerCase();
  if (!QUALIFYING_INVOICE_STATUSES.includes(status as QualifyingInvoiceStatus)) {
    return { covers: false, how: null };
  }

  const { start, end } = periodBounds(period);
  const ps = inv.period_start?.slice(0, 10) ?? null;
  const pe = inv.period_end?.slice(0, 10) ?? null;

  if (ps && pe) {
    // overlap: ps <= periodEnd && pe >= periodStart
    if (ps <= end && pe >= start) {
      return { covers: true, how: 'range_overlap' };
    }
    return { covers: false, how: null };
  }

  if (ps) {
    if (ps.slice(0, 7) === period) {
      return { covers: true, how: 'period_start_month' };
    }
    return { covers: false, how: null };
  }

  const idt = inv.invoice_date?.slice(0, 10) ?? null;
  if (idt && idt.slice(0, 7) === period) {
    return { covers: true, how: 'invoice_date_fallback' };
  }
  return { covers: false, how: null };
}

export function isDeferredForPeriod(
  customerBusinessName: string | null | undefined,
  period: string
): boolean {
  const name = customerBusinessName || '';
  const { end } = periodBounds(period);
  for (const rule of BILLING_EFFECTIVE_FROM) {
    if (!name.includes(rule.businessNameIncludes)) continue;
    // Period is before effective month if period end < effectiveFrom
    if (end < rule.effectiveFrom) return true;
  }
  return false;
}

/**
 * Whether the service is expected to have a bill for period M (ticket 03).
 * Returns reason when not due yet; null when billable for coverage check.
 */
export function notYetDueReason(
  service: ServiceRow,
  period: string
): 'not_yet_due_billing_start' | 'not_yet_due_clinic_delay' | null {
  const { end, start } = periodBounds(period);
  const endDate = new Date(`${end}T12:00:00.000Z`);
  const startDate = new Date(`${start}T12:00:00.000Z`);

  if (isBeforeBillingStart(service.billing_start_date, endDate)) {
    return 'not_yet_due_billing_start';
  }

  // Effective start: billing_start else activation — if activation after period end, not due
  const act = service.activation_date?.slice(0, 10);
  if (act && act > end) {
    return 'not_yet_due_billing_start';
  }

  // New-clinic recurring delay: only suppresses full recurring when NOT first invoice.
  // First invoice path: no last_invoice_date → still billable (pro-rata).
  const isFirst = !service.last_invoice_date;
  if (
    !isFirst &&
    !shouldEmitRecurringInvoice(service.activation_date, startDate, service.product_category)
  ) {
    // For period M, also check end of month as run date
    if (!shouldEmitRecurringInvoice(service.activation_date, endDate, service.product_category)) {
      return 'not_yet_due_clinic_delay';
    }
  }

  return null;
}

function displayName(s: ServiceRow): string {
  return (
    s.customer_business_name ||
    s.customer_name ||
    s.customer_id.slice(0, 8)
  );
}

export function classifyService(
  service: ServiceRow,
  invoices: InvoiceRow[],
  period: string
): CoverageLine {
  const base = {
    serviceId: service.id,
    customerId: service.customer_id,
    customerName: displayName(service),
    packageName: service.package_name,
    monthlyPrice: Number(service.monthly_price || 0),
    billingDay: service.billing_day,
    activationDate: service.activation_date,
    lastInvoiceDate: service.last_invoice_date,
  };

  if (service.active !== true || service.status !== 'active') {
    return {
      ...base,
      reason: 'excluded_inactive',
      invoiceNumber: null,
      invoiceStatus: null,
      matchHow: null,
    };
  }

  if (isDeferredForPeriod(service.customer_business_name, period)) {
    return {
      ...base,
      reason: 'deferred_effective_date',
      invoiceNumber: null,
      invoiceStatus: null,
      matchHow: null,
    };
  }

  const due = notYetDueReason(service, period);
  if (due) {
    return {
      ...base,
      reason: due,
      invoiceNumber: null,
      invoiceStatus: null,
      matchHow: null,
    };
  }

  const forService = invoices.filter((i) => i.service_id === service.id);
  for (const inv of forService) {
    const { covers, how } = invoiceCoversPeriod(inv, period);
    if (covers) {
      return {
        ...base,
        reason: 'covered',
        invoiceNumber: inv.invoice_number,
        invoiceStatus: inv.status,
        matchHow: how,
      };
    }
  }

  const voidOnly = forService.some((inv) => {
    if ((inv.status || '').toLowerCase() !== 'voided') return false;
    const ps = inv.period_start?.slice(0, 7);
    const idt = inv.invoice_date?.slice(0, 7);
    return ps === period || idt === period;
  });

  return {
    ...base,
    reason: voidOnly ? 'void_only' : 'no_invoice',
    invoiceNumber: null,
    invoiceStatus: null,
    matchHow: null,
  };
}

export function buildCoverageReport(
  services: ServiceRow[],
  invoices: InvoiceRow[],
  period: string,
  generatedAt = new Date().toISOString()
): CoverageReport {
  const { start, end } = periodBounds(period);
  const lines = services.map((s) => classifyService(s, invoices, period));

  const billable = lines.filter(
    (l) =>
      l.reason !== 'excluded_inactive' &&
      l.reason !== 'deferred_effective_date' &&
      l.reason !== 'not_yet_due_billing_start' &&
      l.reason !== 'not_yet_due_clinic_delay'
  );
  const covered = lines.filter((l) => l.reason === 'covered');
  const deferred = lines.filter((l) => l.reason === 'deferred_effective_date');
  const notYetDue = lines.filter(
    (l) =>
      l.reason === 'not_yet_due_billing_start' ||
      l.reason === 'not_yet_due_clinic_delay'
  );
  const gaps = lines.filter(
    (l) => l.reason === 'void_only' || l.reason === 'no_invoice'
  );

  return {
    period,
    periodStart: start,
    periodEnd: end,
    generatedAt,
    summary: {
      activeServices: services.filter((s) => s.active && s.status === 'active')
        .length,
      billable: billable.length,
      covered: covered.length,
      deferred: deferred.length,
      notYetDue: notYetDue.length,
      gaps: gaps.length,
      gapCatalogMrr: gaps.reduce((s, l) => s + l.monthlyPrice, 0),
      coveredCatalogMrr: covered.reduce((s, l) => s + l.monthlyPrice, 0),
    },
    lines: lines.sort((a, b) => {
      const order = (r: GapReason) =>
        r === 'no_invoice' || r === 'void_only'
          ? 0
          : r === 'deferred_effective_date'
            ? 1
            : r === 'covered'
              ? 3
              : 2;
      return order(a.reason) - order(b.reason) || a.customerName.localeCompare(b.customerName);
    }),
  };
}

export function reportToCsv(report: CoverageReport): string {
  const headers = [
    'reason',
    'customer_name',
    'package_name',
    'monthly_price',
    'billing_day',
    'activation_date',
    'last_invoice_date',
    'invoice_number',
    'invoice_status',
    'match_how',
    'service_id',
    'customer_id',
  ];
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = report.lines.map((l) =>
    [
      l.reason,
      l.customerName,
      l.packageName,
      l.monthlyPrice,
      l.billingDay,
      l.activationDate,
      l.lastInvoiceDate,
      l.invoiceNumber,
      l.invoiceStatus,
      l.matchHow,
      l.serviceId,
      l.customerId,
    ]
      .map(esc)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n') + '\n';
}

// re-export for scripts that want clinic category check
export { isClinicBillingCategory };

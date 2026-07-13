import {
  OPERATIONS_PREVIEW_TIME_ZONE,
  type ActiveServiceRow,
  type IncidentRow,
  type InvoiceRow,
  type MoneyValue,
  type OperationsPreviewData,
} from './types';

const JOHANNESBURG_UTC_OFFSET_MS = 2 * 60 * 60 * 1_000;
const MONTH_COUNT = 12;
const EXCLUDED_INVOICE_STATUSES = new Set(['voided', 'cancelled']);
const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('en-ZA', {
  month: 'short',
  timeZone: OPERATIONS_PREVIEW_TIME_ZONE,
});

export interface AggregateInput {
  activeServices: ActiveServiceRow[];
  unresolvedIncidents: IncidentRow[];
  invoices: InvoiceRow[];
  customerCounts: number[];
  openTickets: number;
  needsAttention: number;
  scheduledInstalls: number;
  ordersInProgress: number;
  availableTechnicians: number;
}

export interface JohannesburgMonthWindow {
  key: string;
  label: string;
  start: Date;
  endExclusive: Date;
}

function assertValidDate(value: Date, name: string): void {
  if (!Number.isFinite(value.getTime())) {
    throw new Error(`Invalid ${name}`);
  }
}

function padTwo(value: number): string {
  return String(value).padStart(2, '0');
}

function localCalendarParts(value: Date): { year: number; monthIndex: number } {
  const shifted = new Date(value.getTime() + JOHANNESBURG_UTC_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    monthIndex: shifted.getUTCMonth(),
  };
}

function monthKey(year: number, monthIndex: number): string {
  return `${year}-${padTwo(monthIndex + 1)}`;
}

function monthStartUtc(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex, 1) - JOHANNESBURG_UTC_OFFSET_MS);
}

function monthKeyForInvoiceDate(value: string): string {
  const normalized = value.trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  let parsed: Date;

  if (dateOnly) {
    parsed = new Date(`${normalized}T00:00:00+02:00`);
  } else if (
    /^\d{4}-\d{2}-\d{2}[T ]/.test(normalized) &&
    !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
  ) {
    parsed = new Date(`${normalized.replace(' ', 'T')}+02:00`);
  } else {
    parsed = new Date(normalized);
  }

  assertValidDate(parsed, 'invoice date');

  const { year, monthIndex } = localCalendarParts(parsed);
  return monthKey(year, monthIndex);
}

function assertCount(value: number, name: string): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative finite integer`);
  }
}

function assertCustomerCounts(customerCounts: number[]): void {
  if (customerCounts.length !== MONTH_COUNT) {
    throw new Error(`customerCounts must contain exactly ${MONTH_COUNT} values`);
  }

  customerCounts.forEach((value, index) => {
    assertCount(value, `customerCounts[${index}]`);
  });
}

function addCents(left: number, right: number): number {
  const total = left + right;
  if (!Number.isSafeInteger(total)) {
    throw new Error('Invalid monetary value: aggregate exceeds safe integer cents');
  }
  return total;
}

export function buildJohannesburgMonthWindows(now: Date): JohannesburgMonthWindow[] {
  assertValidDate(now, 'date');
  const current = localCalendarParts(now);

  return Array.from({ length: MONTH_COUNT }, (_, index) => {
    const relativeMonth = current.monthIndex - (MONTH_COUNT - 1 - index);
    const start = monthStartUtc(current.year, relativeMonth);
    const endExclusive = monthStartUtc(current.year, relativeMonth + 1);
    const localStart = localCalendarParts(start);

    return {
      key: monthKey(localStart.year, localStart.monthIndex),
      label: MONTH_LABEL_FORMATTER.format(start),
      start,
      endExclusive,
    };
  });
}

export function moneyToCents(value: MoneyValue): number {
  const parsed = typeof value === 'string' && value.trim() === '' ? Number.NaN : Number(value);
  const cents = Math.round(parsed * 100);

  if (!Number.isFinite(parsed) || !Number.isSafeInteger(cents)) {
    throw new Error(`Invalid monetary value: ${String(value)}`);
  }

  return cents;
}

export function aggregateOperationsPreview(
  input: AggregateInput,
  now: Date
): OperationsPreviewData {
  assertValidDate(now, 'date');
  assertCustomerCounts(input.customerCounts);
  assertCount(input.openTickets, 'openTickets');
  assertCount(input.needsAttention, 'needsAttention');
  assertCount(input.scheduledInstalls, 'scheduledInstalls');
  assertCount(input.ordersInProgress, 'ordersInProgress');
  assertCount(input.availableTechnicians, 'availableTechnicians');

  const activeCustomers = new Set<string>();
  let activeMrrCents = 0;
  for (const service of input.activeServices) {
    activeCustomers.add(service.customer_id);
    activeMrrCents = addCents(activeMrrCents, moneyToCents(service.monthly_price));
  }

  let servicesImpacted = 0;
  for (const incident of input.unresolvedIncidents) {
    if (incident.affected_customer_count !== null) {
      assertCount(incident.affected_customer_count, 'affected_customer_count');
      servicesImpacted += incident.affected_customer_count;
    }
  }

  const windows = buildJohannesburgMonthWindows(now);
  const growth: OperationsPreviewData['growth'] = windows.map((window, index) => ({
    month: window.key,
    label: window.label,
    totalCustomers: input.customerCounts[index],
    billedCents: 0,
  }));
  const growthByMonth = new Map(growth.map((bucket) => [bucket.month, bucket]));
  const currentWindow = windows[windows.length - 1];
  let billedCents = 0;
  let collectedCents = 0;
  let outstandingCents = 0;
  let paidInvoices = 0;

  for (const invoice of input.invoices) {
    const status = invoice.status.trim().toLowerCase();
    if (EXCLUDED_INVOICE_STATUSES.has(status)) continue;

    const invoiceBilledCents = moneyToCents(invoice.total_amount);
    const invoiceCollectedCents = moneyToCents(invoice.amount_paid);
    const invoiceOutstandingCents = moneyToCents(invoice.amount_due);
    const invoiceMonth = monthKeyForInvoiceDate(invoice.invoice_date);
    const growthBucket = growthByMonth.get(invoiceMonth);

    if (growthBucket) {
      growthBucket.billedCents = addCents(growthBucket.billedCents, invoiceBilledCents);
    }

    if (invoiceMonth === currentWindow.key) {
      billedCents = addCents(billedCents, invoiceBilledCents);
      collectedCents = addCents(collectedCents, invoiceCollectedCents);
      outstandingCents = addCents(outstandingCents, invoiceOutstandingCents);
      if (status === 'paid') paidInvoices += 1;
    }
  }

  const current = localCalendarParts(now);
  const finalDay = new Date(Date.UTC(current.year, current.monthIndex + 1, 0)).getUTCDate();
  const currentMonth = monthKey(current.year, current.monthIndex);

  return {
    generatedAt: now.toISOString(),
    source: 'production',
    timeZone: OPERATIONS_PREVIEW_TIME_ZONE,
    kpis: {
      activeCustomers: activeCustomers.size,
      activeMrrCents,
      openTickets: input.openTickets,
      needsAttention: input.needsAttention,
      networkIncidents: input.unresolvedIncidents.length,
      servicesImpacted,
    },
    growth,
    operations: {
      scheduledInstalls: input.scheduledInstalls,
      ordersInProgress: input.ordersInProgress,
      priorityTickets: input.needsAttention,
      availableTechnicians: input.availableTechnicians,
    },
    finance: {
      periodStart: `${currentMonth}-01`,
      periodEnd: `${currentMonth}-${padTwo(finalDay)}`,
      billedCents,
      collectedCents,
      outstandingCents,
      paidInvoices,
    },
  };
}

import { isCustomerServiceBilledNow } from '@/lib/billing/billing-eligibility';

export type InvoiceBucket = 'paid' | 'unpaid' | 'excluded';

const EXCLUDED = new Set(['voided', 'cancelled', 'refunded', 'draft']);
const PAID = new Set(['paid']);

export function invoiceBucket(status: string | null | undefined): InvoiceBucket {
  const value = (status ?? '').toLowerCase();
  if (EXCLUDED.has(value)) return 'excluded';
  if (PAID.has(value)) return 'paid';
  return 'unpaid';
}

export interface LiveServiceInput {
  name: string;
  monthlyFee: number;
  billingStartDate?: string | null;
  status?: string | null;
  active?: boolean | null;
  siteId?: string | null;
  customerId?: string | null;
}

export interface LiveServiceRow extends LiveServiceInput {
  billed: boolean;
}

export function splitLiveServices(
  services: LiveServiceInput[],
  now: Date = new Date()
): {
  billedNow: LiveServiceRow[];
  deferredLive: LiveServiceRow[];
  monthlySpend: number;
} {
  const billedNow: LiveServiceRow[] = [];
  const deferredLive: LiveServiceRow[] = [];

  for (const service of services) {
    const billed = isCustomerServiceBilledNow(
      {
        billing_start_date: service.billingStartDate,
        status: service.status,
        active: service.active,
      },
      now
    );
    const row = { ...service, billed };
    if (billed) billedNow.push(row);
    else deferredLive.push(row);
  }

  return {
    billedNow,
    deferredLive,
    monthlySpend: billedNow.reduce((sum, row) => sum + Number(row.monthlyFee || 0), 0),
  };
}

export function buildPortalBillingSummary(input: {
  invoices: Array<{
    status?: string | null;
    total_amount?: number | string | null;
    amount_due?: number | string | null;
    amount_paid?: number | string | null;
  }>;
  billedNow: Array<{ monthlyFee: number }>;
}): {
  billedCount: number;
  monthlySpend: number;
  unpaidCount: number;
  unpaidTotal: number;
  paidCount: number;
  paidTotal: number;
} {
  let unpaidCount = 0;
  let unpaidTotal = 0;
  let paidCount = 0;
  let paidTotal = 0;

  for (const invoice of input.invoices) {
    const bucket = invoiceBucket(invoice.status);
    if (bucket === 'unpaid') {
      unpaidCount += 1;
      unpaidTotal += Number(invoice.amount_due ?? invoice.total_amount ?? 0);
    } else if (bucket === 'paid') {
      paidCount += 1;
      paidTotal += Number(invoice.amount_paid ?? invoice.total_amount ?? 0);
    }
  }

  const monthlySpend = input.billedNow.reduce(
    (sum, row) => sum + Number(row.monthlyFee || 0),
    0
  );

  return {
    billedCount: input.billedNow.length,
    monthlySpend,
    unpaidCount,
    unpaidTotal,
    paidCount,
    paidTotal,
  };
}

/**
 * Statement Data Assembly
 * Shared library for building StatementData from the database.
 * Used by both admin and customer-dashboard API routes.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  StatementData,
  StatementTransaction,
  StatementCustomer,
  AgingBuckets,
} from './statement-pdf-generator';

export interface StatementOptions {
  period?: '3m' | '6m' | '12m' | 'all';
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

// --------------------------------------------------------------------------
// Internal helpers
// --------------------------------------------------------------------------

function toYMD(date: Date): string {
  return date.toISOString().split('T')[0];
}

function subtractMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
}

function formatMonthYear(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
}

function buildDescription(invoice: {
  period_start?: string | null;
  period_end?: string | null;
}): string {
  if (invoice.period_start && invoice.period_end) {
    return `Monthly Service - ${formatMonthYear(invoice.period_start)}`;
  }
  return 'Service Invoice';
}

function computeAgingBuckets(invoices: InvoiceRow[], today: Date): AgingBuckets {
  const buckets: AgingBuckets = {
    over120Days: 0,
    days90: 0,
    days60: 0,
    days30: 0,
    current: 0,
  };

  for (const inv of invoices) {
    if (['paid', 'cancelled', 'refunded'].includes(inv.status ?? '')) continue;

    const dueDate = new Date(inv.due_date);
    const daysOverdue = Math.floor(
      (today.getTime() - dueDate.getTime()) / 86400000
    );
    const outstanding = parseFloat(String(inv.amount_due ?? '0'));

    if (daysOverdue > 120) {
      buckets.over120Days += outstanding;
    } else if (daysOverdue > 90) {
      buckets.days90 += outstanding;
    } else if (daysOverdue > 60) {
      buckets.days60 += outstanding;
    } else if (daysOverdue > 30) {
      buckets.days30 += outstanding;
    } else {
      buckets.current += outstanding;
    }
  }

  return buckets;
}

// --------------------------------------------------------------------------
// Internal row types (narrow DB return shape)
// --------------------------------------------------------------------------

interface CustomerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  account_number: string | null;
}

interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  invoice_date: string;
  due_date: string;
  total_amount: string | number | null;
  amount_paid: string | number | null;
  amount_due: string | number | null;
  status: string | null;
  period_start: string | null;
  period_end: string | null;
  payment_reference: string | null;
}

// --------------------------------------------------------------------------
// Main export
// --------------------------------------------------------------------------

export async function assembleStatementData(
  supabase: SupabaseClient,
  customerId: string,
  options: StatementOptions = {}
): Promise<{ statement: StatementData; customerRecord: CustomerRow }> {
  const today = new Date();

  // 1. Resolve date range
  let fromDate: string | null = null;
  let toDate: string | null = null;

  if (options.from && options.to) {
    fromDate = options.from;
    toDate = options.to;
  } else if (options.period && options.period !== 'all') {
    const monthsMap: Record<'3m' | '6m' | '12m', number> = {
      '3m': 3,
      '6m': 6,
      '12m': 12,
    };
    fromDate = toYMD(subtractMonths(today, monthsMap[options.period]));
    toDate = toYMD(today);
  }
  // 'all' or no options → no date filter (fromDate/toDate stay null)

  // 2. Fetch customer
  const { data: rawCustomer, error: customerError } = await supabase
    .from('customers')
    .select('id, first_name, last_name, email, phone, account_number')
    .eq('id', customerId)
    .single();

  if (customerError || !rawCustomer) {
    console.error(`[statement-data] Customer lookup failed for ${customerId}:`, customerError?.message ?? 'no data returned');
    throw new Error(`Customer ${customerId} not found`);
  }

  const customer = rawCustomer as CustomerRow;

  const customerData: StatementCustomer = {
    name: `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim(),
    accountNumber:
      customer.account_number ?? `CT-${customer.id.slice(0, 8)}`,
    email: customer.email ?? undefined,
    phone: customer.phone ?? undefined,
    address: undefined,
  };

  // 3. Fetch invoices
  let query = supabase
    .from('customer_invoices')
    .select(
      'id, invoice_number, invoice_date, due_date, total_amount, amount_paid, amount_due, status, period_start, period_end, payment_reference'
    )
    .eq('customer_id', customerId)
    .order('invoice_date', { ascending: true });

  if (fromDate !== null && toDate !== null) {
    query = query.gte('invoice_date', fromDate).lte('invoice_date', toDate);
  }

  const { data: invoicesRaw, error: invoicesError } = await query;

  if (invoicesError) {
    throw new Error(
      `Failed to fetch invoices for customer ${customerId}: ${invoicesError.message}`
    );
  }

  const invoices: InvoiceRow[] = (invoicesRaw ?? []) as InvoiceRow[];

  // 4. Build transactions
  const transactions: StatementTransaction[] = [];

  for (const inv of invoices) {
    // Debit row: the invoice amount
    transactions.push({
      date: inv.invoice_date,
      reference: inv.invoice_number ?? inv.id,
      description: buildDescription(inv),
      debit: parseFloat(String(inv.total_amount ?? '0')),
    });

    // Credit row: only if payment exists and invoice is paid/partial
    const amountPaid = parseFloat(String(inv.amount_paid ?? '0'));
    if (
      amountPaid > 0 &&
      (inv.status === 'paid' || inv.status === 'partial')
    ) {
      transactions.push({
        date: inv.due_date,
        reference: `PMT-${inv.invoice_number ?? inv.id}`,
        description: 'Payment received - thank you',
        credit: amountPaid,
      });
    }
  }

  // 5. Compute aging buckets
  const aging = computeAgingBuckets(invoices, today);

  // 6. Compute totals
  const unpaidStatuses = new Set(['unpaid', 'partial', 'overdue']);

  let totalDue = 0;
  let totalPaid = 0;

  for (const inv of invoices) {
    if (unpaidStatuses.has(inv.status ?? '')) {
      totalDue += parseFloat(String(inv.amount_due ?? '0'));
    }
    totalPaid += parseFloat(String(inv.amount_paid ?? '0'));
  }

  // 7. Return
  return {
    statement: {
      statementDate: toYMD(today),
      customer: customerData,
      transactions,
      aging,
      totalDue,
      totalPaid,
    },
    customerRecord: customer,
  };
}

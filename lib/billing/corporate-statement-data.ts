/**
 * Assemble account statement data for a B2B corporate organisation
 * (scoped by corporate_account_id, not consumer customer_id).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  StatementData,
  StatementTransaction,
  AgingBuckets,
} from './statement-pdf-generator';
import type { StatementOptions } from './statement-data';
import { UNJANI_CORPORATE_CODE, UNJANI_NPC_BILL_TO } from './unjani-connect-rules';

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

function computeAging(
  invoices: Array<{
    due_date: string;
    amount_due: string | number | null;
    status: string | null;
  }>,
  today: Date
): AgingBuckets {
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

    if (daysOverdue > 120) buckets.over120Days += outstanding;
    else if (daysOverdue > 90) buckets.days90 += outstanding;
    else if (daysOverdue > 60) buckets.days60 += outstanding;
    else if (daysOverdue > 30) buckets.days30 += outstanding;
    else buckets.current += outstanding;
  }

  return buckets;
}

export async function assembleCorporateStatementData(
  supabase: SupabaseClient,
  organisationId: string,
  options: StatementOptions = {}
): Promise<{ statement: StatementData; organisationName: string }> {
  const today = new Date();

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

  const { data: account, error: accountError } = await supabase
    .from('corporate_accounts')
    .select(
      'id, company_name, corporate_code, primary_contact_email, primary_contact_phone, billing_contact_email, vat_number, registration_number, physical_address'
    )
    .eq('id', organisationId)
    .single();

  if (accountError || !account) {
    throw new Error(`Organisation ${organisationId} not found`);
  }

  let query = supabase
    .from('customer_invoices')
    .select(
      'id, invoice_number, invoice_date, due_date, total_amount, amount_paid, amount_due, status, period_start, period_end, paynow_transaction_ref'
    )
    .eq('corporate_account_id', organisationId)
    .order('invoice_date', { ascending: true });

  if (fromDate !== null && toDate !== null) {
    query = query.gte('invoice_date', fromDate).lte('invoice_date', toDate);
  }

  const { data: invoicesRaw, error: invoicesError } = await query;
  if (invoicesError) {
    throw new Error(`Failed to fetch invoices: ${invoicesError.message}`);
  }

  const invoices = invoicesRaw ?? [];
  const transactions: StatementTransaction[] = [];

  for (const inv of invoices) {
    const periodLabel =
      inv.period_start && inv.period_end
        ? `Unjani Connect — ${formatMonthYear(inv.period_start)}`
        : 'Service Invoice';

    transactions.push({
      date: inv.invoice_date,
      reference: inv.invoice_number ?? inv.id,
      description: periodLabel,
      debit: parseFloat(String(inv.total_amount ?? 0)),
    });

    const paid = parseFloat(String(inv.amount_paid ?? 0));
    if (paid > 0) {
      transactions.push({
        date: inv.invoice_date,
        reference: inv.paynow_transaction_ref ?? inv.invoice_number ?? inv.id,
        description: `Payment — ${inv.invoice_number ?? ''}`,
        credit: paid,
      });
    }
  }

  const aging = computeAging(invoices, today);
  const totalDue = Object.values(aging).reduce((a, b) => a + b, 0);
  const totalPaid = invoices.reduce(
    (sum, inv) => sum + parseFloat(String(inv.amount_paid ?? 0)),
    0
  );

  const npcBillTo =
    account.corporate_code === UNJANI_CORPORATE_CODE ? UNJANI_NPC_BILL_TO : null;
  const physical =
    account.physical_address && typeof account.physical_address === 'object'
      ? (account.physical_address as Record<string, string | undefined>)
      : null;

  const statement: StatementData = {
    statementDate: toYMD(today),
    customer: npcBillTo
      ? {
          name: npcBillTo.legalName,
          accountNumber: npcBillTo.accountCode,
          email: npcBillTo.billingEmail,
          vatNumber: npcBillTo.vatNumber,
          registrationNumber: npcBillTo.registrationNumber,
          address: { ...npcBillTo.address },
        }
      : {
          name: account.company_name,
          accountNumber: account.corporate_code ?? `ORG-${organisationId.slice(0, 8)}`,
          email:
            account.billing_contact_email ??
            account.primary_contact_email ??
            undefined,
          phone: account.primary_contact_phone ?? undefined,
          vatNumber: account.vat_number ?? undefined,
          registrationNumber: account.registration_number ?? undefined,
          address: physical
            ? {
                line1: physical.line1 ?? physical.street,
                line2: physical.line2,
                city: physical.city,
                province: physical.province,
                postalCode: physical.postalCode ?? physical.postal_code,
              }
            : undefined,
        },
    transactions,
    aging,
    totalDue,
    totalPaid,
  };

  return { statement, organisationName: account.company_name };
}

/**
 * Soft July 2026 entitlement catch-up for 4 gap clinics.
 *
 * Policy (finance, 2026-07-30):
 * - Full MSA month: R450 excl + R67.50 VAT = R517.50 incl
 * - No late fees; clear "July 2026" line + soft notes
 * - Sweetwaters: paynow only (mandate pending)
 * - Others: debit_order when mandate active, else paynow
 * - Cosmo: leave open June INV-2026-00017 as-is; this is July only
 * - Due date: +14 days (gentle)
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *   npx tsx scripts/billing/issue-july-2026-gap-catchup.ts           # dry-run
 *   npx tsx scripts/billing/issue-july-2026-gap-catchup.ts --execute  # write
 */

import { createClient } from '@supabase/supabase-js';
import {
  formatInvoiceNumber,
  nextInvoiceSequence,
} from '../../lib/billing/invoice-amounts';

const PERIOD_START = '2026-07-01';
const PERIOD_END = '2026-07-31';
const SUBTOTAL = 450;
const VAT = 67.5;
const TOTAL = 517.5;
const VAT_RATE = 15;
const DUE_DAYS = 14;

const NOTE =
  'July 2026 connectivity was not billed on the usual cycle and is included here so your account is up to date. There are no late fees or penalties. If anything looks wrong, please contact us before the due date.';

/** Gap service IDs verified 2026-07-30 */
const GAPS: Array<{
  key: string;
  serviceId: string;
  customerId: string;
  preferredCollection: 'paynow' | 'debit_order';
}> = [
  {
    key: 'Sweetwaters',
    serviceId: 'db25e328-2ab1-492f-8ae7-f15f1da695d7',
    customerId: '919f3d6d-f11d-432d-ba17-b7f0d418ae9e',
    preferredCollection: 'paynow',
  },
  {
    key: 'Nokaneng',
    serviceId: 'b7d8195f-cf78-4295-a9f7-e6701ca26ae6',
    customerId: 'e42fb00f-6791-4bd0-97f3-391222016c67',
    preferredCollection: 'debit_order',
  },
  {
    key: 'Cosmo City',
    serviceId: '219095e1-9e04-46f1-bfb6-c0698770b053',
    customerId: '807231d9-6edb-4d5c-aa78-0129d4a0539e',
    preferredCollection: 'debit_order',
  },
  {
    key: 'Bhekilanga',
    serviceId: '43c1baaa-c08e-45cc-b5e3-7149059f6a69',
    customerId: 'ec792fcb-e421-4037-b5f4-75546ba09dfd',
    preferredCollection: 'debit_order',
  },
];

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const execute = process.argv.includes('--execute');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing Supabase env — source .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const invoiceDate = ymd(new Date());
  const due = new Date();
  due.setDate(due.getDate() + DUE_DAYS);
  const dueDate = ymd(due);

  const { data: yearInvoices } = await supabase
    .from('customer_invoices')
    .select('invoice_number')
    .like('invoice_number', `INV-2026-%`);
  let nextSeq = nextInvoiceSequence(
    (yearInvoices || []).map((r) => r.invoice_number as string),
    2026
  );

  console.log(execute ? 'EXECUTE mode' : 'DRY-RUN mode (pass --execute to write)');
  console.log(`invoice_date=${invoiceDate} due_date=${dueDate} (+${DUE_DAYS}d)`);
  console.log('');

  const results: Array<Record<string, unknown>> = [];

  for (const gap of GAPS) {
    const { data: service, error: sErr } = await supabase
      .from('customer_services')
      .select(
        'id, customer_id, package_name, monthly_price, active, status, billing_day'
      )
      .eq('id', gap.serviceId)
      .single();

    if (sErr || !service) {
      console.error(`SKIP ${gap.key}: service not found`, sErr?.message);
      continue;
    }

    const { data: customer } = await supabase
      .from('customers')
      .select('id, business_name, email, phone')
      .eq('id', gap.customerId)
      .single();

    // Idempotency: non-void July period invoice already exists?
    const { data: existing } = await supabase
      .from('customer_invoices')
      .select('id, invoice_number, status, total_amount')
      .eq('service_id', gap.serviceId)
      .eq('period_start', PERIOD_START)
      .not('status', 'in', '(voided,cancelled,draft)');

    if (existing && existing.length > 0) {
      console.log(
        `SKIP ${gap.key}: already has ${existing.map((e) => e.invoice_number).join(', ')}`
      );
      results.push({ key: gap.key, action: 'skip_existing', existing });
      continue;
    }

    // Collection method
    let collection = gap.preferredCollection;
    if (collection === 'debit_order') {
      const { data: pms } = await supabase
        .from('customer_payment_methods')
        .select('mandate_status, is_active, method_type')
        .eq('customer_id', gap.customerId)
        .eq('method_type', 'debit_order')
        .eq('is_active', true);
      const ok = (pms || []).some((p) => p.mandate_status === 'active');
      if (!ok) {
        collection = 'paynow';
        console.log(`  ${gap.key}: debit not ready → paynow`);
      }
    }

    const packageName = (service.package_name as string) || 'Unjani Managed Connectivity';
    const invoiceNumber = formatInvoiceNumber(2026, nextSeq);
    nextSeq += 1;

    const lineItems = [
      {
        description: `${packageName} — July 2026 (catch-up; no late fees)`,
        quantity: 1,
        unit_price: SUBTOTAL,
        amount: SUBTOTAL,
        type: 'recurring',
      },
    ];

    const payload = {
      invoice_number: invoiceNumber,
      customer_id: gap.customerId,
      service_id: gap.serviceId,
      invoice_date: invoiceDate,
      due_date: dueDate,
      period_start: PERIOD_START,
      period_end: PERIOD_END,
      subtotal: SUBTOTAL,
      vat_rate: VAT_RATE,
      tax_amount: VAT,
      total_amount: TOTAL,
      amount_due: TOTAL,
      amount_paid: 0,
      line_items: lineItems,
      invoice_type: 'recurring',
      status: 'sent',
      notes: NOTE,
      payment_collection_method: collection,
    };

    console.log(
      `${execute ? 'CREATE' : 'WOULD CREATE'} ${invoiceNumber} | ${gap.key} | ${customer?.business_name} | R${TOTAL} | ${collection} | due ${dueDate}`
    );

    if (!execute) {
      results.push({ key: gap.key, action: 'dry_run', payload });
      continue;
    }

    const { data: invoice, error: iErr } = await supabase
      .from('customer_invoices')
      .insert(payload)
      .select('id, invoice_number, total_amount, status, due_date')
      .single();

    if (iErr || !invoice) {
      console.error(`FAIL ${gap.key}: ${iErr?.message}`);
      results.push({ key: gap.key, action: 'error', error: iErr?.message });
      continue;
    }

    await supabase
      .from('customer_services')
      .update({ last_invoice_date: invoiceDate })
      .eq('id', gap.serviceId);

    console.log(`  OK ${invoice.invoice_number} id=${invoice.id}`);
    results.push({
      key: gap.key,
      action: 'created',
      invoice,
      email: customer?.email,
      collection,
    });
  }

  console.log('\n--- Summary ---');
  console.log(JSON.stringify(results, null, 2));

  if (!execute) {
    console.log('\nDry-run only. Re-run with --execute to create invoices.');
  } else {
    console.log(
      '\nNext: notify clinics (template in ops note); do NOT debit Sweetwaters; wait 7–14d before debit batch for others.'
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

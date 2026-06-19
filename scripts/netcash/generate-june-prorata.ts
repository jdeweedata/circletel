/**
 * Generate the June pro-rata invoice for the pilot clinics and notify them.
 *
 * Pro-rata: billing-start 2026-06-15 → 16/30 days of R450 = R240.00 ex VAT → R276.00 incl.
 * Mirrors MonthlyInvoiceGenerator's insert (app-supplied INV-YYYY-NNNNN; status='sent';
 * amount_due; payment_collection_method='debit_order'). generateCustomerInvoice() is NOT
 * used — it relies on a DB trigger that does not exist (would null-violate invoice_number).
 * Fires billing/invoice.generated for the email+SMS. Collection (debit) is a SEPARATE step.
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/netcash/generate-june-prorata.ts
 */
import { createClient } from '@/lib/supabase/server';
import { formatInvoiceNumber, nextInvoiceSequence } from '@/lib/billing/invoice-amounts';
import { inngest } from '@/lib/inngest/client';

const REFS = ['CT-2026-00016', 'CT-2026-00017'];
const SUBTOTAL = 240.0;       // 16/30 × R450, ex VAT
const VAT_RATE = 15;
const VAT = Math.round(SUBTOTAL * (VAT_RATE / 100) * 100) / 100; // 36.00
const TOTAL = Math.round((SUBTOTAL + VAT) * 100) / 100;          // 276.00
const PERIOD_START = '2026-06-15';
const PERIOD_END = '2026-06-30';
const INVOICE_DATE = '2026-06-19';
const DUE_DATE = '2026-06-24'; // = the debit action date

async function main() {
  const sb = await createClient();
  const year = 2026;

  for (const ref of REFS) {
    const { data: c } = await sb.from('customers').select('id, business_name').eq('account_number', ref).single();
    if (!c) { console.log(`${ref}: customer not found`); continue; }

    // Dedup: skip if a June pro-rata already exists
    const { data: existing } = await sb.from('customer_invoices')
      .select('invoice_number').eq('customer_id', c.id).eq('invoice_type', 'pro_rata')
      .gte('period_start', '2026-06-01').lte('period_end', '2026-06-30').limit(1);
    if (existing && existing.length) {
      console.log(`${ref}: pro-rata already exists (${existing[0].invoice_number}) — skipping`);
      continue;
    }

    const { data: svc } = await sb.from('customer_services')
      .select('id').eq('customer_id', c.id).eq('status', 'active').limit(1).single();

    // App-supplied invoice number (no DB trigger/sequence exists)
    const { data: yearInvoices } = await sb.from('customer_invoices')
      .select('invoice_number').like('invoice_number', `INV-${year}-%`);
    const invoiceNumber = formatInvoiceNumber(
      year, nextInvoiceSequence((yearInvoices || []).map((r) => r.invoice_number as string), year)
    );

    const { data: invoice, error } = await sb.from('customer_invoices').insert({
      invoice_number: invoiceNumber,
      customer_id: c.id,
      service_id: svc?.id ?? null,
      invoice_type: 'pro_rata',
      invoice_date: INVOICE_DATE,
      due_date: DUE_DATE,
      period_start: PERIOD_START,
      period_end: PERIOD_END,
      subtotal: SUBTOTAL,
      vat_rate: VAT_RATE,
      tax_amount: VAT,
      total_amount: TOTAL,
      amount_due: TOTAL,
      amount_paid: 0,
      line_items: [{
        description: `Pro-rata: ${c.business_name} — 16/30 days (${PERIOD_START} to ${PERIOD_END})`,
        quantity: 1, unit_price: SUBTOTAL, amount: SUBTOTAL, type: 'pro_rata',
      }],
      status: 'sent',
      payment_collection_method: 'debit_order',
    }).select('id, invoice_number, total_amount, due_date').single();

    if (error) { console.log(`${ref}: insert FAILED — ${error.message}`); continue; }
    console.log(`${ref}: ${invoice.invoice_number} total R${invoice.total_amount} (VAT R${VAT}) due ${invoice.due_date}`);

    await inngest.send({ name: 'billing/invoice.generated', data: { invoice_id: invoice.id, customer_id: c.id } });
    console.log(`${ref}: billing/invoice.generated fired`);
  }
  console.log('\nDone. Expect total R276.00 each.');
}
main().catch((e) => { console.error(e); process.exit(1); });

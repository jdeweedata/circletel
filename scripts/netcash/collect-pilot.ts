/**
 * Collect the pilot clinics' June pro-rata invoices via TwoDay debit (REAL MONEY).
 * Matching principle: accountReference = invoice_number, amount = invoice.total_amount.
 * Bank details sourced from customer_payment_methods.encrypted_details.
 * Action date = nextValidActionDate (>= 3 business days). Prod profile (from .env.local).
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/netcash/collect-pilot.ts
 */
import { createClient } from '@/lib/supabase/server';
import { netcashDebitBatchService, type DebitOrderItem } from '@/lib/payments/netcash-debit-batch-service';

const INVOICE_NUMBERS = ['INV-2026-00014', 'INV-2026-00015'];

async function main() {
  const sb = await createClient();
  const actionDate = netcashDebitBatchService.nextValidActionDate(new Date());
  const items: DebitOrderItem[] = [];

  for (const num of INVOICE_NUMBERS) {
    const { data: inv } = await sb.from('customer_invoices')
      .select('id, invoice_number, total_amount, customer_id, status, payment_collection_method')
      .eq('invoice_number', num).single();
    if (!inv) { console.log(`${num}: invoice not found`); continue; }
    if (inv.status === 'paid') { console.log(`${num}: already paid — skipping`); continue; }
    if (inv.payment_collection_method !== 'debit_order') { console.log(`${num}: not debit_order — skipping`); continue; }

    const { data: pm } = await sb.from('customer_payment_methods')
      .select('encrypted_details').eq('customer_id', inv.customer_id)
      .eq('method_type', 'debit_order').eq('is_active', true).maybeSingle();
    const d = pm?.encrypted_details as any;
    if (!d?.account_number || !d?.branch_code) { console.log(`${num}: missing bank details — skipping`); continue; }

    items.push({
      accountReference: inv.invoice_number,        // matching principle
      amount: inv.total_amount,                     // = R276.00
      actionDate,
      customerId: inv.customer_id,
      invoiceId: inv.id,
      accountName: d.account_holder_name,
      accountType: String(d.account_type).toLowerCase().startsWith('savings') ? 'savings' : 'current',
      branchCode: d.branch_code,
      accountNumber: d.account_number,
    });
  }

  console.log('Collecting:', items.map((i) => ({ ref: i.accountReference, amount: i.amount, last4: i.accountNumber.slice(-4), date: i.actionDate.toISOString().slice(0, 10) })));
  if (!items.length) return console.log('Nothing to collect.');

  // Unique batch name per invoice — NetCash overwrites same-named unauthorised batches.
  const res = await netcashDebitBatchService.submitBatch(items, `UNJANI-${INVOICE_NUMBERS.join('-')}`);
  console.log('submitBatch:', res);
  if (!res.success || !res.fileToken) return console.log('SUBMIT FAILED — no debit lodged.');

  console.log('Polling load report (~30s)...');
  await new Promise((r) => setTimeout(r, 30_000));
  const report = await netcashDebitBatchService.requestLoadReport(res.fileToken);
  console.log('load report:', JSON.stringify(report, null, 2));
  console.log(report.result === 'SUCCESSFUL'
    ? `\n=== LODGED: R${items.reduce((s, i) => s + i.amount, 0)} for ${items.map((i) => i.accountReference).join(', ')}, action ${items[0].actionDate.toISOString().slice(0, 10)}. ===`
    : `\n=== Review load report: ${report.result} ===`);
}
main().catch((e) => { console.error(e); process.exit(1); });

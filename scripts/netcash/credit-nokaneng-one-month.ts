/**
 * Nokaneng (Helping Hands) CT-2026-00021:
 * Credit June back-bill INV-49 (one month, CircleTel error).
 * Leave August INV-61 paid/standing. Keep July INV-42 for the 18 Aug debit.
 *
 *   set -a && source .env.local && set +a && npx tsx scripts/netcash/credit-nokaneng-one-month.ts
 */
import { createClient } from '@supabase/supabase-js';
import { CompliantBillingService } from '../../lib/billing/compliant-billing-service';
import { netcashStatementService } from '../../lib/payments/netcash-statement-service';

const CUSTOMER_ID = 'e42fb00f-6791-4bd0-97f3-391222016c67';
const INV_49_JUNE = '4e72ff79-d2b3-425e-a933-69c9e5462134';
const INV_49_ITEM = 'cbb73fd5-daf4-4013-b0aa-f144c9197030';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env');

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: existing } = await sb
    .from('credit_notes')
    .select('id, credit_note_number, status, total_amount, original_invoice_id')
    .eq('original_invoice_id', INV_49_JUNE);
  if (existing?.length) {
    console.log('Credit note already exists — not creating a second one:', existing);
  } else {
    const cn = await CompliantBillingService.createCreditNote(
      {
        original_invoice_id: INV_49_JUNE,
        line_items: [
          {
            type: 'adjustment',
            quantity: 1,
            unit_price: 517.5,
            amount: 517.5,
            description:
              'Credit one month (June 2026 back-bill INV-2026-00049). CircleTel billing error: PayNow reminder plus two-month 18 Aug debit after August INV-61 already collected. August remains due/payable (collected 5 Aug TDD). July INV-42 remains on the 18 Aug debit.',
          },
        ],
        reason:
          'CircleTel error — credit one month on Nokaneng / Helping Hands. August 2026 INV-61 remains due and payable. 18 Aug debit must collect July INV-42 only.',
        reason_category: 'billing_error',
        notes:
          'Ticket 893 / Phindi Motebu. Do not credit INV-61. Unauthorise Netcash batch 2523842 and resubmit INV-42 only.',
        auto_apply: true,
      },
      {
        user_email: 'billing@circletel.co.za',
        user_role: 'super_admin',
        reason: 'Unjani Nokaneng one-month goodwill credit; keep August payable',
      }
    );
    console.log('Credit note:', {
      id: cn.id,
      number: cn.credit_note_number,
      status: cn.status,
      total: cn.total_amount,
    });
  }

  const { data: inv49 } = await sb
    .from('customer_invoices')
    .select('invoice_number, status, total_amount, amount_paid, amount_due')
    .eq('id', INV_49_JUNE)
    .single();
  const { data: inv42 } = await sb
    .from('customer_invoices')
    .select('invoice_number, status, total_amount, amount_paid, amount_due, period_start')
    .eq('invoice_number', 'INV-2026-00042')
    .eq('customer_id', CUSTOMER_ID)
    .single();
  const { data: inv61 } = await sb
    .from('customer_invoices')
    .select('invoice_number, status, total_amount, amount_paid, amount_due, period_start')
    .eq('invoice_number', 'INV-2026-00061')
    .eq('customer_id', CUSTOMER_ID)
    .single();

  const { error: itemErr } = await sb
    .from('debit_order_batch_items')
    .update({ status: 'cancelled', unpaid_reason: 'Credited INV-49 — 18 Aug must collect INV-42 only' })
    .eq('id', INV_49_ITEM);
  if (itemErr) console.error('Failed to cancel debit item INV-49:', itemErr.message);

  let netcash: unknown = null;
  try {
    const batches = await netcashStatementService.getBatchStatus();
    netcash = batches.filter(
      (b) =>
        b.batchId === '2523842' ||
        b.batchId === '2056197.726081306000880.1832.108788.011' ||
        b.value === 1035 ||
        b.batchName?.includes('2026-08-13')
    );
  } catch (e) {
    netcash = { error: e instanceof Error ? e.message : String(e) };
  }

  console.log(
    JSON.stringify(
      { inv49, inv42, inv61, netcashBatchesMatching1035or18Aug: netcash },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

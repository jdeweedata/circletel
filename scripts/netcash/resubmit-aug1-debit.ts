/**
 * Resubmit Aug 1 2026 debit invoices after Netcash rejected the original batch
 * (INV-2026-00062 Unknown branch). Skips already-paid invoices.
 *
 * Run:
 *   set -a && source .env.local && set +a && npx tsx scripts/netcash/resubmit-aug1-debit.ts
 */
import { createClient } from '@supabase/supabase-js';
import {
  netcashDebitBatchService,
  type DebitOrderItem,
} from '@/lib/payments/netcash-debit-batch-service';

const INVOICE_NUMBERS = [
  'INV-2026-00053',
  'INV-2026-00057',
  'INV-2026-00061',
  'INV-2026-00062',
  'INV-2026-00064',
  'INV-2026-00065',
  'INV-2026-00066',
  'INV-2026-00067',
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env');
  if (!netcashDebitBatchService.isConfigured()) {
    throw new Error('NETCASH_DEBIT_ORDER_SERVICE_KEY not configured');
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const actionDate = netcashDebitBatchService.nextValidActionDate(new Date());
  const items: DebitOrderItem[] = [];

  for (const num of INVOICE_NUMBERS) {
    const { data: inv, error } = await sb
      .from('customer_invoices')
      .select(
        'id, invoice_number, total_amount, customer_id, status, payment_collection_method'
      )
      .eq('invoice_number', num)
      .single();
    if (error || !inv) {
      console.log(`${num}: invoice not found`);
      continue;
    }
    if (inv.status === 'paid') {
      console.log(`${num}: already paid — skipping`);
      continue;
    }
    if (
      inv.payment_collection_method !== 'debit_order' &&
      inv.payment_collection_method !== 'Debit Order'
    ) {
      console.log(`${num}: not debit_order — skipping`);
      continue;
    }

    const { data: pm } = await sb
      .from('customer_payment_methods')
      .select('encrypted_details, mandate_status, is_active')
      .eq('customer_id', inv.customer_id)
      .eq('method_type', 'debit_order')
      .eq('is_active', true)
      .maybeSingle();

    const d = (pm?.encrypted_details || {}) as Record<string, unknown>;
    const accountNumber = String(d.account_number || '');
    const branchCode = String(d.branch_code || '');
    const accountName = String(
      d.account_holder_name || d.account_holder || d.accountName || ''
    ).trim();

    if (!accountNumber || !branchCode || !accountName) {
      console.log(`${num}: missing bank details — skipping`, {
        hasAcct: !!accountNumber,
        branch: branchCode,
        holder: accountName,
      });
      continue;
    }

    if (pm?.mandate_status !== 'active') {
      console.log(`${num}: mandate not active (${pm?.mandate_status}) — skipping`);
      continue;
    }

    items.push({
      accountReference: inv.invoice_number,
      amount: Number(inv.total_amount),
      actionDate,
      customerId: inv.customer_id,
      invoiceId: inv.id,
      accountName,
      accountType: String(d.account_type || '')
        .toLowerCase()
        .startsWith('savings')
        ? 'savings'
        : 'current',
      branchCode,
      accountNumber,
    });
  }

  console.log(
    'Collecting:',
    items.map((i) => ({
      ref: i.accountReference,
      amount: i.amount,
      branch: i.branchCode,
      last4: i.accountNumber.slice(-4),
      date: i.actionDate.toISOString().slice(0, 10),
    }))
  );
  console.log(
    `Total: R${items.reduce((s, i) => s + i.amount, 0).toFixed(2)} (${items.length} items)`
  );
  if (!items.length) {
    console.log('Nothing to collect.');
    return;
  }

  const batchName = `CircleTel-2026-08-01-resubmit-${Date.now()}`;
  const res = await netcashDebitBatchService.submitBatch(items, batchName);
  console.log('submitBatch:', res);
  if (!res.success || !res.fileToken) {
    console.log('SUBMIT FAILED — no debit lodged.');
    process.exit(1);
  }

  // Record batch so future crons do not double-submit
  const submittedAt = new Date().toISOString();
  const { error: batchErr } = await sb.from('debit_order_batches').upsert(
    {
      batch_id: res.fileToken,
      batch_name: batchName,
      item_count: items.length,
      total_amount: items.reduce((s, i) => s + i.amount, 0),
      status: 'submitted',
      submitted_at: submittedAt,
      created_at: submittedAt,
    },
    { onConflict: 'batch_id' }
  );
  if (batchErr) console.error('Failed to record batch:', batchErr.message);

  const { error: itemsErr } = await sb.from('debit_order_batch_items').insert(
    items.map((item) => ({
      batch_id: res.fileToken,
      account_reference: item.accountReference,
      customer_id: item.customerId,
      invoice_id: item.invoiceId,
      amount: item.amount,
      action_date: item.actionDate.toISOString().slice(0, 10),
      status: 'pending',
    }))
  );
  if (itemsErr) console.error('Failed to record batch items:', itemsErr.message);

  console.log('Polling load report (~35s)...');
  await new Promise((r) => setTimeout(r, 35_000));
  const report = await netcashDebitBatchService.requestLoadReport(res.fileToken);
  console.log('load report:', JSON.stringify(report, null, 2));

  // Try programmatic authorise (may return 322 if Auto Auth disabled)
  try {
    const auth = await netcashDebitBatchService.authoriseBatchByName(batchName);
    console.log('authoriseBatchByName:', auth);
    if (auth.success) {
      await sb
        .from('debit_order_batches')
        .update({ status: 'authorised', authorised_at: new Date().toISOString() })
        .eq('batch_id', res.fileToken);
    }
  } catch (e) {
    console.warn(
      'Authorise step skipped/failed:',
      e instanceof Error ? e.message : e
    );
  }

  if (report.result === 'SUCCESSFUL') {
    console.log(
      `\n=== LODGED: R${items.reduce((s, i) => s + i.amount, 0).toFixed(2)} for ${items
        .map((i) => i.accountReference)
        .join(', ')}, action ${items[0].actionDate.toISOString().slice(0, 10)}. ===`
    );
  } else {
    console.log(`\n=== Review load report: ${report.result} ===`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

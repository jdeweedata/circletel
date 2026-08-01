/**
 * One-off debit for INV-2026-00061 (Zandile) after false-paid revert.
 *
 * Run:
 *   set -a && source .env.local && set +a && npx tsx scripts/netcash/collect-inv-00061.ts
 */
import { createClient } from '@supabase/supabase-js';
import {
  netcashDebitBatchService,
  type DebitOrderItem,
} from '@/lib/payments/netcash-debit-batch-service';

const INVOICE_NUMBER = 'INV-2026-00061';

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

  const { data: inv, error } = await sb
    .from('customer_invoices')
    .select(
      'id, invoice_number, total_amount, customer_id, status, payment_collection_method'
    )
    .eq('invoice_number', INVOICE_NUMBER)
    .single();
  if (error || !inv) throw new Error(`Invoice not found: ${error?.message}`);
  if (inv.status === 'paid') {
    console.log(`${INVOICE_NUMBER} already paid — abort`);
    process.exit(1);
  }

  const { data: pm } = await sb
    .from('customer_payment_methods')
    .select('encrypted_details, mandate_status, is_active')
    .eq('customer_id', inv.customer_id)
    .eq('method_type', 'debit_order')
    .eq('is_active', true)
    .maybeSingle();

  if (!pm || pm.mandate_status !== 'active') {
    throw new Error(`Mandate not active (${pm?.mandate_status ?? 'missing'})`);
  }

  const d = (pm.encrypted_details || {}) as Record<string, unknown>;
  const accountNumber = String(d.account_number || '');
  const branchCode = String(d.branch_code || '');
  const accountName = String(
    d.account_holder_name || d.account_holder || d.accountName || ''
  ).trim();
  if (!accountNumber || !branchCode || !accountName) {
    throw new Error('Missing bank details');
  }

  const actionDate = netcashDebitBatchService.nextValidActionDate(new Date());
  const item: DebitOrderItem = {
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
  };

  console.log('Collecting:', {
    ref: item.accountReference,
    amount: item.amount,
    branch: item.branchCode,
    last4: item.accountNumber.slice(-4),
    date: item.actionDate.toISOString().slice(0, 10),
  });

  const batchName = `CircleTel-2026-08-01-INV-00061-${Date.now()}`;
  const res = await netcashDebitBatchService.submitBatch([item], batchName);
  console.log('submitBatch:', res);
  if (!res.success || !res.fileToken) {
    process.exit(1);
  }

  const submittedAt = new Date().toISOString();
  await sb.from('debit_order_batches').upsert(
    {
      batch_id: res.fileToken,
      batch_name: batchName,
      item_count: 1,
      total_amount: item.amount,
      status: 'submitted',
      submitted_at: submittedAt,
      created_at: submittedAt,
    },
    { onConflict: 'batch_id' }
  );
  await sb.from('debit_order_batch_items').insert({
    batch_id: res.fileToken,
    account_reference: item.accountReference,
    customer_id: item.customerId,
    invoice_id: item.invoiceId,
    amount: item.amount,
    action_date: item.actionDate.toISOString().slice(0, 10),
    status: 'pending',
  });

  console.log('Polling load report (~35s)...');
  await new Promise((r) => setTimeout(r, 35_000));
  const report = await netcashDebitBatchService.requestLoadReport(res.fileToken);
  console.log('load report:', JSON.stringify(report, null, 2));

  try {
    const auth = await netcashDebitBatchService.authoriseBatchByName(batchName);
    console.log('authoriseBatchByName:', auth);
    if (auth.success) {
      await sb
        .from('debit_order_batches')
        .update({
          status: 'authorised',
          authorised_at: new Date().toISOString(),
        })
        .eq('batch_id', res.fileToken);
    }
  } catch (e) {
    console.warn('Authorise step:', e instanceof Error ? e.message : e);
  }

  await sb
    .from('customer_invoices')
    .update({
      notes:
        `Debit submitted 2026-08-01: ${batchName} (action ${item.actionDate
          .toISOString()
          .slice(0, 10)}, R${item.amount.toFixed(2)}, fileToken ${res.fileToken})`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', inv.id);

  if (report.result !== 'SUCCESSFUL') {
    console.log(`Load report not SUCCESSFUL: ${report.result}`);
    process.exit(1);
  }
  console.log(
    `\n=== LODGED: ${INVOICE_NUMBER} R${item.amount.toFixed(2)}, action ${item.actionDate
      .toISOString()
      .slice(0, 10)}, token ${res.fileToken} ===`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

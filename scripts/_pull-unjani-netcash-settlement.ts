import { readFileSync, writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fetchMandateStatuses } from '../lib/payments/netcash-mandate-status';
import { NetCashStatementService } from '../lib/payments/netcash-statement-service';

// Load .env.local
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#') || !t.includes('=')) continue;
  const i = t.indexOf('=');
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[k] = v; // force fresh
}

function fnum(x: unknown): number | null {
  if (x === null || x === undefined || x === '') return null;
  const n = typeof x === 'number' ? x : parseFloat(String(x));
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('Keys:', {
    debit: !!process.env.NETCASH_DEBIT_ORDER_SERVICE_KEY,
    account: !!process.env.NETCASH_ACCOUNT_SERVICE_KEY,
    ws: process.env.NETCASH_WS_URL || '(default)',
  });

  // --- Unjani cohort from Supabase ---
  const { data: custs, error: cErr } = await supabase
    .from('customers')
    .select('id, account_number, business_name, email')
    .or('business_name.ilike.%Unjani%');
  if (cErr) throw cErr;

  const { data: services } = await supabase
    .from('customer_services')
    .select('customer_id, package_name')
    .or('package_name.ilike.%Unjani%,package_name.ilike.%Managed Connectivity%');

  const unjaniIds = new Set([
    ...(custs || []).map((c) => c.id),
    ...(services || []).map((s) => s.customer_id),
  ]);

  const { data: allCusts } = await supabase
    .from('customers')
    .select('id, account_number, business_name, email')
    .in('id', [...unjaniIds]);

  const customers = (allCusts || []).filter((c) => c.account_number !== 'CT-2026-09999');
  const custById = Object.fromEntries(customers.map((c) => [c.id, c]));
  const accounts = customers.map((c) => c.account_number).filter(Boolean) as string[];
  console.log('Unjani customers:', customers.length);

  const { data: invoices, error: iErr } = await supabase
    .from('customer_invoices')
    .select(
      'id, invoice_number, invoice_type, status, invoice_date, period_start, period_end, subtotal, tax_amount, total_amount, amount_paid, amount_due, payment_collection_method, customer_id, service_id'
    )
    .in('customer_id', customers.map((c) => c.id))
    .order('invoice_date', { ascending: true });
  if (iErr) throw iErr;
  console.log('Invoices:', (invoices || []).length);

  const invIds = (invoices || []).map((i) => i.id);
  const invNums = (invoices || []).map((i) => i.invoice_number).filter(Boolean) as string[];

  const { data: txs } = await supabase
    .from('payment_transactions')
    .select(
      'id, reference, amount, status, payment_method, provider, provider_reference, customer_id, customer_invoice_id, invoice_id, completed_at, initiated_at'
    )
    .eq('provider', 'netcash')
    .in('customer_id', customers.map((c) => c.id));

  const { data: pms } = await supabase
    .from('customer_payment_methods')
    .select('customer_id, method_type, is_active, mandate_status, mandate_id, max_debit_amount, last_four')
    .in('customer_id', customers.map((c) => c.id))
    .eq('is_active', true);

  // --- Fresh NetCash mandate pull ---
  console.log('\n=== FRESH RequestMandateData / RetrieveMandateData ===');
  let mandates: Awaited<ReturnType<typeof fetchMandateStatuses>> = [];
  try {
    mandates = await fetchMandateStatuses({ maxWaitMs: 200_000 });
    console.log('Mandate rows:', mandates.length);
  } catch (e: any) {
    console.error('Mandate FAILED:', e?.message || e);
  }
  const mandateByRef = new Map(mandates.map((m) => [m.accountRef, m]));

  // --- Fresh statements: broader date range covering known collections ---
  const stmtSvc = new NetCashStatementService();
  const dateStrs = [
    '2026-06-19', '2026-06-20', '2026-06-24', '2026-06-25', '2026-06-26', '2026-06-27',
    '2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-07', '2026-07-08',
    '2026-07-10', '2026-07-11', '2026-07-14', '2026-07-15',
  ];

  type StmtTx = {
    date: string;
    transactionCode: string;
    description: string;
    amount: number;
    effect: string;
    reference?: string;
    accountReference?: string;
    statementDate: string;
    raw?: string;
  };

  const allStmt: StmtTx[] = [];
  console.log('\n=== FRESH merchant statements ===');
  for (const ds of dateStrs) {
    const d = new Date(ds + 'T12:00:00Z');
    try {
      const res = await stmtSvc.getStatement(d, 10, 2500);
      if (!res.success) {
        console.log(ds, 'fail:', res.error);
        continue;
      }
      console.log(ds, 'txs:', res.transactions.length);
      for (const t of res.transactions) {
        allStmt.push({
          date: t.date,
          transactionCode: t.transactionCode,
          description: t.description,
          amount: t.amount,
          effect: t.effect,
          reference: t.reference,
          accountReference: t.accountReference,
          statementDate: ds,
        });
      }
    } catch (e: any) {
      console.log(ds, 'error:', e?.message || e);
    }
  }
  console.log('Total statement lines:', allStmt.length);

  // Index statement lines by invoice number mention
  function stmtHitsForInvoice(invNo: string): StmtTx[] {
    return allStmt.filter((t) => {
      const blob = `${t.description || ''}|${t.reference || ''}|${t.accountReference || ''}`;
      return blob.includes(invNo);
    });
  }

  // Settlement codes that indicate money in
  const SETTLE_CODES = new Set(['TDD', 'SDD', 'PNC', 'PIF', 'DCS', 'TDC', 'SDC']);

  function classifyInv(inv: any): string {
    const total = fnum(inv.total_amount) || 0;
    const sub = fnum(inv.subtotal) || 0;
    const st = (inv.status || '').toLowerCase();
    if (st === 'voided' || st === 'cancelled') {
      if (Math.abs(total - 450) < 0.02 && sub >= 391 && sub <= 392) return 'voided_wrong_full_month';
      return 'voided_other';
    }
    if (Math.abs(total - 450) < 0.02 && sub >= 391 && sub <= 392) return 'wrong_full_month';
    if (Math.abs(total - 517.5) < 0.02 && Math.abs(sub - 450) < 0.02) return 'correct_full_month';
    if (Math.abs(total - 276) < 0.02 && Math.abs(sub - 240) < 0.02) return 'correct_prorata';
    return 'other';
  }

  type Out = Record<string, string | number | boolean>;
  const out: Out[] = [];
  const pulledAt = new Date().toISOString();

  for (const inv of invoices || []) {
    const cust = custById[inv.customer_id];
    if (!cust) continue;
    const invNo = inv.invoice_number || '';
    const invClass = classifyInv(inv);
    const invTotal = fnum(inv.total_amount) || 0;
    const invPaid = fnum(inv.amount_paid) || 0;

    const pm =
      (pms || []).find((p) => p.customer_id === inv.customer_id && p.method_type === 'debit_order') ||
      (pms || []).find((p) => p.customer_id === inv.customer_id);

    const m =
      mandateByRef.get(cust.account_number || '') ||
      [...mandateByRef.entries()].find(([k]) => k === invNo)?.[1];

    const relatedTx = (txs || []).filter(
      (t) =>
        t.customer_invoice_id === inv.id ||
        t.invoice_id === inv.id ||
        t.reference === invNo ||
        t.provider_reference === invNo
    );

    const hits = stmtHitsForInvoice(invNo);
    const settleHits = hits.filter(
      (h) => SETTLE_CODES.has(h.transactionCode) && h.amount > 0 && h.effect === '+'
    );

    // Prefer merchant statement settlement sum; else payment_transactions completed
    let settledAmt = 0;
    let settledSource = 'none';
    let settledDetail = 'No NetCash settlement found';
    let settled = false;

    if (settleHits.length) {
      settledAmt = settleHits.reduce((s, h) => s + h.amount, 0);
      settledSource = 'merchant_statement_live';
      settledDetail = settleHits
        .map((h) => `${h.statementDate} ${h.transactionCode} R${h.amount.toFixed(2)} (${h.description})`)
        .join('; ');
      settled = true;
    } else {
      const done = relatedTx.filter((t) => t.status === 'completed' && fnum(t.amount));
      if (done.length) {
        settledAmt = done.reduce((s, t) => s + (fnum(t.amount) || 0), 0);
        settledSource = 'payment_transactions';
        settledDetail = done
          .map(
            (t) =>
              `R${fnum(t.amount)!.toFixed(2)} ${t.status} ${t.payment_method || 'netcash'} @ ${(t.completed_at || '').toString().slice(0, 10)} ref=${t.reference || t.provider_reference || ''}`
          )
          .join('; ');
        settled = true;
      } else if ((inv.status || '').toLowerCase() === 'voided') {
        settledDetail = 'Invoice voided — no settlement expected';
        settledSource = 'n/a';
      } else if ((inv.status || '').toLowerCase() === 'paid' && invPaid > 0) {
        settledAmt = invPaid;
        settledSource = 'invoice_amount_paid_only';
        settledDetail = 'Supabase paid but no NetCash statement/tx match';
        settled = true;
      }
    }

    let match = 'NO_SETTLEMENT';
    if ((inv.status || '').toLowerCase() === 'voided') match = 'VOIDED';
    else if (settled && Math.abs(settledAmt - invTotal) < 0.02) match = 'MATCHES_INVOICE_TOTAL';
    else if (settled && Math.abs(settledAmt - invPaid) < 0.02) match = 'MATCHES_AMOUNT_PAID';
    else if (settled) match = `MISMATCH (settled ${settledAmt.toFixed(2)} vs inv ${invTotal.toFixed(2)})`;
    else if (['sent', 'overdue', 'partial'].includes((inv.status || '').toLowerCase()))
      match = 'UNPAID_OR_NO_NETCASH_SETTLEMENT';

    const shortfall =
      invClass === 'wrong_full_month' ? Math.max(0, 517.5 - invPaid).toFixed(2) : '';

    out.push({
      pulled_at_utc: pulledAt,
      account_number: cust.account_number || '',
      clinic: cust.business_name || '',
      invoice_number: invNo,
      invoice_type: inv.invoice_type || '',
      period: `${inv.period_start || ''} → ${inv.period_end || ''}`,
      invoice_class: invClass,
      invoice_status: inv.status || '',
      invoice_total: invTotal.toFixed(2),
      invoice_amount_paid_supabase: invPaid.toFixed(2),
      collection_method: inv.payment_collection_method || '',
      netcash_settled: settled ? 'YES' : 'NO',
      netcash_settled_amount: settledAmt.toFixed(2),
      netcash_settlement_source: settledSource,
      netcash_settlement_detail: settledDetail,
      settlement_vs_invoice: match,
      debit_method_db: pm?.method_type || '',
      mandate_status_db: pm?.mandate_status || '',
      max_debit_amount_db: pm?.max_debit_amount != null ? String(pm.max_debit_amount) : '',
      netcash_mandate_status_code: m?.statusCode || '',
      netcash_mandate_label: m?.label || 'NOT_IN_MANDATE_FILE',
      netcash_mandate_outcome: m?.outcome || 'missing',
      netcash_mandate_verified: m ? String(m.verified) : '',
      shortfall_vs_msa_if_wrong_full_month: shortfall,
      statement_lines_for_invoice: hits.length,
    });
  }

  // Clinics with no invoices
  const invCustIds = new Set((invoices || []).map((i) => i.customer_id));
  for (const c of customers) {
    if (invCustIds.has(c.id)) continue;
    const pm =
      (pms || []).find((p) => p.customer_id === c.id && p.method_type === 'debit_order') ||
      (pms || []).find((p) => p.customer_id === c.id);
    const m = mandateByRef.get(c.account_number || '');
    out.push({
      pulled_at_utc: pulledAt,
      account_number: c.account_number || '',
      clinic: c.business_name || '',
      invoice_number: '',
      invoice_type: '',
      period: '',
      invoice_class: '',
      invoice_status: 'no_invoice',
      invoice_total: '',
      invoice_amount_paid_supabase: '',
      collection_method: '',
      netcash_settled: 'NO',
      netcash_settled_amount: '0.00',
      netcash_settlement_source: 'none',
      netcash_settlement_detail: 'No invoice issued',
      settlement_vs_invoice: 'NO_INVOICE',
      debit_method_db: pm?.method_type || '',
      mandate_status_db: pm?.mandate_status || '',
      max_debit_amount_db: pm?.max_debit_amount != null ? String(pm.max_debit_amount) : '',
      netcash_mandate_status_code: m?.statusCode || '',
      netcash_mandate_label: m?.label || 'NOT_IN_MANDATE_FILE',
      netcash_mandate_outcome: m?.outcome || 'missing',
      netcash_mandate_verified: m ? String(m.verified) : '',
      shortfall_vs_msa_if_wrong_full_month: '',
      statement_lines_for_invoice: 0,
    });
  }

  out.sort((a, b) =>
    String(a.account_number).localeCompare(String(b.account_number)) ||
    String(a.invoice_number).localeCompare(String(b.invoice_number))
  );

  const fields = Object.keys(out[0] || {});
  const esc = (v: any) => {
    const s = String(v ?? '');
    return /["\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csvPath = 'docs/clients/unjani-clinics/2026-07-15-unjani-billing-netcash-settlement-status-LIVE.csv';
  writeFileSync(csvPath, [fields.join(','), ...out.map((r) => fields.map((f) => esc(r[f])).join(','))].join('\n'));

  // Also overwrite the main settlement status file with live data
  const csvPathMain = 'docs/clients/unjani-clinics/2026-07-15-unjani-billing-netcash-settlement-status.csv';
  writeFileSync(csvPathMain, [fields.join(','), ...out.map((r) => fields.map((f) => esc(r[f])).join(','))].join('\n'));

  const short = (n: string) =>
    n.replace('Unjani Clinic - ', '').replace('Unjani Clinic ', '');

  const settledMatch = out.filter(
    (r) => r.netcash_settled === 'YES' && r.settlement_vs_invoice === 'MATCHES_INVOICE_TOTAL'
  );
  const wrongPaid = out.filter(
    (r) => r.invoice_class === 'wrong_full_month' && r.netcash_settled === 'YES'
  );
  const unpaid = out.filter(
    (r) =>
      r.invoice_number &&
      ['sent', 'overdue', 'partial'].includes(String(r.invoice_status)) &&
      r.netcash_settled === 'NO'
  );

  const md: string[] = [];
  md.push('# Unjani billing + NetCash settlement (LIVE API pull)');
  md.push('');
  md.push(`**Pulled at (UTC):** ${pulledAt}`);
  md.push('**Auth:** live `NETCASH_DEBIT_ORDER_SERVICE_KEY` + `NETCASH_ACCOUNT_SERVICE_KEY` (read-only)');
  md.push(`**Mandate file rows:** ${mandates.length}`);
  md.push(`**Statement lines loaded:** ${allStmt.length} across ${dateStrs.length} dates`);
  md.push(`**CSV:** \`${csvPathMain}\``);
  md.push('');
  md.push('## Invoice + NetCash settlement');
  md.push('');
  md.push(
    '| Account | Clinic | Invoice | Class | Status | Inv total | Supabase paid | NetCash settled? | Settled amt | Evidence | Match | MSA shortfall |'
  );
  md.push(
    '|---------|--------|---------|-------|--------|----------:|--------------:|:----------------:|------------:|----------|-------|--------------:|'
  );

  for (const r of out) {
    if (!r.invoice_number) continue;
    let ev = String(r.netcash_settlement_detail);
    if (ev.length > 60) ev = ev.slice(0, 57) + '…';
    md.push(
      `| ${r.account_number} | ${short(String(r.clinic))} | ${r.invoice_number} | ${r.invoice_class} | ${r.invoice_status} | R${r.invoice_total} | R${r.invoice_amount_paid_supabase} | **${r.netcash_settled}** | R${r.netcash_settled_amount} | ${ev} | ${r.settlement_vs_invoice} | ${r.shortfall_vs_msa_if_wrong_full_month ? 'R' + r.shortfall_vs_msa_if_wrong_full_month : '—'} |`
    );
  }

  md.push('');
  md.push('## No invoice yet');
  md.push('');
  md.push('| Account | Clinic | Debit method | Mandate DB | NetCash mandate file |');
  md.push('|---------|--------|--------------|------------|----------------------|');
  for (const r of out) {
    if (r.invoice_number) continue;
    md.push(
      `| ${r.account_number} | ${short(String(r.clinic))} | ${r.debit_method_db || '—'} | ${r.mandate_status_db || '—'} | ${r.netcash_mandate_label} |`
    );
  }

  md.push('');
  md.push('## Snapshot');
  md.push(`- Settled & matches invoice face total: **${settledMatch.length}**`);
  md.push(`- Wrong full-month settled at R450 on NetCash: **${wrongPaid.length}**`);
  md.push(`- Issued but no NetCash settlement: **${unpaid.length}**`);
  md.push(`- Mandate outcomes on invoice rows: active=${out.filter((r) => r.invoice_number && r.netcash_mandate_outcome === 'active').length}, pending=${out.filter((r) => r.invoice_number && r.netcash_mandate_outcome === 'pending').length}, missing=${out.filter((r) => r.invoice_number && r.netcash_mandate_outcome === 'missing').length}`);
  md.push('');
  md.push('### Settlement channel codes');
  md.push('- **TDD** = two-day bank debit order');
  md.push('- **PNC** = PayNow completed');
  md.push('- Preference: merchant statement hit on invoice number, else payment_transactions');

  const mdPath = 'docs/clients/unjani-clinics/2026-07-15-unjani-billing-netcash-settlement-status.md';
  writeFileSync(mdPath, md.join('\n'));
  writeFileSync(
    'docs/clients/unjani-clinics/2026-07-15-unjani-billing-netcash-settlement-status-LIVE.md',
    md.join('\n')
  );

  console.log('\nWrote', csvPathMain);
  console.log('Wrote', mdPath);
  console.log('settled match', settledMatch.length);
  console.log(
    'wrong paid',
    wrongPaid.map((r) => `${r.invoice_number}=R${r.netcash_settled_amount}`)
  );
  console.log(
    'unpaid',
    unpaid.map((r) => `${r.invoice_number} R${r.invoice_total}`)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

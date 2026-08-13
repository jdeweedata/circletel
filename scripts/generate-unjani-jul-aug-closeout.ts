/**
 * Unjani Connect Jul–Aug 2026 close-out workbook.
 * Invoices issued vs payments recorded in CircleTel from Netcash.
 *
 * Usage:
 *   npx tsx scripts/generate-unjani-jul-aug-closeout.ts
 *   (reads docs/clients/unjani-clinics/billing/closeouts/UNJANI_CONNECT_JUL_AUG_2026_CLOSEOUT_EXTRACT.json when present)
 *   set -a && source .env.local && set +a && npx tsx scripts/generate-unjani-jul-aug-closeout.ts
 *   (live Supabase refresh when the extract file is absent)
 */

import { mkdirSync, existsSync, readFileSync } from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';

const ORG = '9b6b601f-9b51-42e7-8b97-af7ae9d3486e';
const FROM = '2026-07-01';
const TO = '2026-08-31';
const OUT_DIR = path.join(
  process.cwd(),
  'docs/clients/unjani-clinics/billing/closeouts'
);
const OUT_XLSX = path.join(
  OUT_DIR,
  'UNJANI_CONNECT_JUL_AUG_2026_CLOSEOUT.xlsx'
);
const DUMP = path.join(
  OUT_DIR,
  'UNJANI_CONNECT_JUL_AUG_2026_CLOSEOUT_EXTRACT.json'
);

const ZAR = (n: number) =>
  Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;

type InvoiceRow = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  period_start: string | null;
  period_end: string | null;
  status: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  subtotal: number;
  tax_amount: number;
  payment_collection_method: string | null;
  paynow_transaction_ref: string | null;
  paid_at: string | null;
  invoice_type: string | null;
  customer_id: string;
  corporate_site_id: string | null;
  business_name: string | null;
  account_number: string | null;
  site_name: string | null;
};

function num(v: unknown): number {
  return ZAR(Number(v ?? 0));
}

function money(n: number): string {
  return ZAR(n).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type SiteRow = {
  id: string;
  site_name: string;
  status: string;
  installed_at: string | null;
  monthly_fee?: number | string | null;
};

type CustomerRow = {
  id: string;
  business_name: string | null;
  account_number: string | null;
  corporate_site_id: string | null;
};

type PaymentRow = {
  customer_invoice_id: string | null;
  invoice_id: string | null;
  customer_id: string | null;
  amount: number | string;
  status: string;
  provider: string | null;
  payment_method: string | null;
  reference: string | null;
  provider_reference: string | null;
  transaction_id: string | null;
  reconciliation_source: string | null;
  completed_at: string | null;
  created_at: string | null;
  business_name?: string | null;
  account_number?: string | null;
  invoice_number?: string | null;
};

type DebitRow = {
  account_reference: string | null;
  amount: number | string;
  action_date: string;
  status: string;
  transaction_code: string | null;
  unpaid_code?: string | null;
  unpaid_reason: string | null;
  processed_at: string | null;
  invoice_id: string | null;
  customer_id: string;
  batch_id: string | null;
};

type BatchRow = {
  batch_id: string;
  batch_name: string | null;
  status: string | null;
  submitted_at?: string | null;
  total_amount?: number | string | null;
  successful_count?: number | null;
  failed_count?: number | null;
};

function hydrateInvoices(
  invoicesRaw: InvoiceRow[],
  customerById: Map<string, CustomerRow>,
  siteById: Map<string, SiteRow>
): InvoiceRow[] {
  return invoicesRaw.map((i) => {
    const c = customerById.get(i.customer_id);
    const site =
      (i.corporate_site_id && siteById.get(i.corporate_site_id)) ||
      (c?.corporate_site_id && siteById.get(c.corporate_site_id)) ||
      undefined;
    return {
      ...i,
      total_amount: num(i.total_amount),
      amount_paid: num(i.amount_paid),
      amount_due: num(i.amount_due),
      subtotal: num(i.subtotal),
      tax_amount: num(i.tax_amount),
      business_name: i.business_name ?? c?.business_name ?? null,
      account_number: i.account_number ?? c?.account_number ?? null,
      site_name: i.site_name ?? site?.site_name ?? c?.business_name ?? null,
    };
  });
}

async function loadLive(): Promise<{
  sites: SiteRow[];
  customers: CustomerRow[];
  invoicesRaw: InvoiceRow[];
  paymentsA: PaymentRow[];
  debitItems: DebitRow[];
  batches: BatchRow[];
}> {
  if (existsSync(DUMP)) {
    const dump = JSON.parse(readFileSync(DUMP, 'utf8')) as {
      sites: SiteRow[];
      customers: CustomerRow[];
      invoices: InvoiceRow[];
      payments: PaymentRow[];
      debitItems: DebitRow[];
      batches: BatchRow[];
    };
    return {
      sites: dump.sites,
      customers: dump.customers,
      invoicesRaw: dump.invoices,
      paymentsA: dump.payments,
      debitItems: dump.debitItems,
      batches: dump.batches,
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing extract JSON and NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: sites, error: sitesErr } = await sb
    .from('corporate_sites')
    .select('id, site_name, status, installed_at, monthly_fee')
    .eq('corporate_id', ORG)
    .order('site_name');
  if (sitesErr) throw sitesErr;

  const siteIds = (sites ?? []).map((s) => s.id);

  const { data: customers, error: custErr } = await sb
    .from('customers')
    .select('id, business_name, account_number, corporate_site_id')
    .or(
      `corporate_site_id.in.(${siteIds.join(',')}),business_name.ilike.%unjani%,business_name.ilike.%Bhekilanga%,business_name.ilike.%Mbali Zwakele%`
    );
  if (custErr) throw custErr;

  const customerIds = [...new Set((customers ?? []).map((c) => c.id))];

  const { data: invoicesRaw, error: invErr } = await sb
    .from('customer_invoices')
    .select(
      'id, invoice_number, invoice_date, due_date, period_start, period_end, status, total_amount, amount_paid, amount_due, subtotal, tax_amount, payment_collection_method, paynow_transaction_ref, paid_at, invoice_type, customer_id, corporate_site_id'
    )
    .in('customer_id', customerIds)
    .gte('invoice_date', FROM)
    .lte('invoice_date', TO)
    .order('invoice_date');
  if (invErr) throw invErr;

  const { data: paymentsA, error: payErrA } = await sb
    .from('payment_transactions')
    .select(
      'id, customer_invoice_id, invoice_id, customer_id, amount, status, provider, payment_method, reference, provider_reference, transaction_id, reconciliation_source, completed_at, initiated_at, created_at, error_message'
    )
    .or(
      `customer_id.in.(${customerIds.join(',')}),invoice_id.in.(${(invoicesRaw ?? []).map((i) => i.id).join(',')}),customer_invoice_id.in.(${(invoicesRaw ?? []).map((i) => i.id).join(',')})`
    )
    .eq('status', 'completed');
  if (payErrA) throw payErrA;

  const { data: debitItems, error: dErr } = await sb
    .from('debit_order_batch_items')
    .select(
      'account_reference, amount, action_date, status, transaction_code, unpaid_code, unpaid_reason, processed_at, invoice_id, customer_id, batch_id'
    )
    .in('customer_id', customerIds)
    .gte('action_date', FROM)
    .lte('action_date', TO);
  if (dErr) throw dErr;

  const batchIds = [...new Set((debitItems ?? []).map((d) => d.batch_id).filter(Boolean))];
  const { data: batches } = batchIds.length
    ? await sb
        .from('debit_order_batches')
        .select('batch_id, batch_name, status, submitted_at, total_amount, successful_count, failed_count')
        .in('batch_id', batchIds)
    : { data: [] };

  return {
    sites: (sites ?? []) as SiteRow[],
    customers: (customers ?? []) as CustomerRow[],
    invoicesRaw: (invoicesRaw ?? []) as InvoiceRow[],
    paymentsA: (paymentsA ?? []) as PaymentRow[],
    debitItems: (debitItems ?? []) as DebitRow[],
    batches: (batches ?? []) as BatchRow[],
  };
}

async function main() {
  const loaded = await loadLive();
  const sites = loaded.sites;
  const customers = loaded.customers;
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const siteById = new Map(sites.map((s) => [s.id, s]));

  const invoices: InvoiceRow[] = hydrateInvoices(loaded.invoicesRaw, customerById, siteById);

  const invoiceIds = invoices.map((i) => i.id);
  const invoiceNumbers = invoices.map((i) => i.invoice_number);

  const payments = loaded.paymentsA.filter((p) => {
    const ref = String(p.reference || p.provider_reference || p.invoice_number || '');
    const linked =
      (p.customer_invoice_id && invoiceIds.includes(p.customer_invoice_id)) ||
      (p.invoice_id && invoiceIds.includes(p.invoice_id)) ||
      invoiceNumbers.includes(ref);
    const when = String(p.completed_at || p.created_at || '').slice(0, 10);
    const inWindow = when >= FROM && when <= '2026-08-31';
    return linked || inWindow;
  });

  const debitItems = loaded.debitItems;
  const batchById = new Map(loaded.batches.map((b) => [b.batch_id, b]));

  const findInvoiceForPayment = (p: PaymentRow) =>
    invoices.find(
      (i) =>
        i.id === p.customer_invoice_id ||
        i.id === p.invoice_id ||
        i.invoice_number === p.reference ||
        i.invoice_number === p.provider_reference ||
        i.invoice_number === p.invoice_number
    ) || null;

  const netcashByInvoice = new Map<string, number>();
  for (const p of payments) {
    const inv = findInvoiceForPayment(p);
    if (!inv) continue;
    netcashByInvoice.set(inv.id, ZAR((netcashByInvoice.get(inv.id) || 0) + num(p.amount)));
  }

  const debitSuccessByInvoice = new Map<string, number>();
  for (const d of debitItems) {
    if (d.status !== 'successful') continue;
    const inv =
      invoices.find((i) => i.id === d.invoice_id || i.invoice_number === d.account_reference) ||
      null;
    if (!inv) continue;
    debitSuccessByInvoice.set(
      inv.id,
      ZAR((debitSuccessByInvoice.get(inv.id) || 0) + num(d.amount))
    );
  }

  function classify(inv: InvoiceRow) {
    const netcash = netcashByInvoice.get(inv.id) || 0;
    const debitOk = debitSuccessByInvoice.get(inv.id) || 0;
    const vatUnder = inv.status !== 'voided' && inv.total_amount > 0 && inv.total_amount < 500;
    if (inv.status === 'voided') return { match: 'VOIDED', vatUnder };
    if (inv.status === 'paid' && Math.abs(netcash - inv.total_amount) <= 0.05)
      return { match: 'PAID_MATCHED', vatUnder };
    if (inv.status === 'paid' && (inv.amount_paid > inv.total_amount + 0.05 || netcash > inv.total_amount + 0.05))
      return { match: 'PAID_OVERCOLLECT', vatUnder };
    if (inv.status === 'paid' && netcash + 0.05 < inv.total_amount)
      return { match: 'PAID_NETCASH_SHORT', vatUnder };
    if (inv.status === 'paid') return { match: 'PAID_NO_NETCASH_TX', vatUnder };
    const pendingDebit = debitItems.some(
      (d) =>
        d.status === 'pending' &&
        (d.invoice_id === inv.id || d.account_reference === inv.invoice_number)
    );
    if (pendingDebit) return { match: 'OPEN_DEBIT_PENDING', vatUnder };
    return { match: 'OPEN_UNPAID', vatUnder };
  }

  const live = invoices.filter((i) => i.status !== 'voided');
  const voided = invoices.filter((i) => i.status === 'voided');
  const paid = live.filter((i) => i.status === 'paid');
  const open = live.filter((i) => i.status !== 'paid');

  const issuedIncl = ZAR(live.reduce((s, i) => s + i.total_amount, 0));
  const booksPaid = ZAR(live.reduce((s, i) => s + i.amount_paid, 0));
  const booksDue = ZAR(live.reduce((s, i) => s + i.amount_due, 0));
  const netcashOnInvoices = ZAR(
    invoices.reduce((s, i) => s + (netcashByInvoice.get(i.id) || 0), 0)
  );
  const netcashAllWindow = ZAR(payments.reduce((s, p) => s + num(p.amount), 0));

  mkdirSync(OUT_DIR, { recursive: true });
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CircleTel billing close-out';
  wb.created = new Date();

  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF13274A' },
  };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' } };

  function styleHeader(ws: ExcelJS.Worksheet, cols: number) {
    const row = ws.getRow(1);
    row.font = headerFont;
    row.fill = headerFill;
    row.alignment = { vertical: 'middle', wrapText: true };
    row.height = 22;
    for (let i = 1; i <= cols; i++) {
      ws.getCell(1, i).fill = headerFill;
      ws.getCell(1, i).font = headerFont;
    }
  }

  function addSheet(name: string, headers: string[], rows: (string | number | null)[][]) {
    const ws = wb.addWorksheet(name);
    ws.addRow(headers);
    styleHeader(ws, headers.length);
    for (const r of rows) ws.addRow(r);
    ws.columns = headers.map((h, i) => ({
      header: h,
      width: Math.min(
        42,
        Math.max(
          12,
          h.length + 2,
          ...rows.map((row) => String(row[i] ?? '').length + 2)
        )
      ),
    }));
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, rows.length + 1), column: headers.length },
    };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    return ws;
  }

  const cover = wb.addWorksheet('00_Cover');
  cover.getColumn(1).width = 28;
  cover.getColumn(2).width = 72;
  const coverRows: [string, string][] = [
    ['Report', 'Unjani Connect — July & August 2026 billing close-out'],
    ['Bill-to from 1 Sep 2026', 'Unjani Clinics NPC (corporate_code UNJ)'],
    ['Period', 'Invoice date 1 Jul 2026 – 31 Aug 2026'],
    ['Generated', new Date().toISOString()],
    ['Source', 'Supabase customer_invoices + payment_transactions (Netcash) + debit_order_batch_items'],
    ['Purpose', 'Close clinic-level DebiCheck/PayNow before NPC pack billing starts 1 September 2026'],
    ['', ''],
    ['Invoices issued (excl voided)', String(live.length)],
    ['Invoices voided', String(voided.length)],
    ['Invoices marked paid', String(paid.length)],
    ['Invoices still open', String(open.length)],
    ['Issued incl VAT (excl voided)', `R ${money(issuedIncl)}`],
    ['Amount paid on invoices (books)', `R ${money(booksPaid)}`],
    ['Amount still due (books)', `R ${money(booksDue)}`],
    ['Netcash completed txs linked to these invoices', `R ${money(netcashOnInvoices)}`],
    ['Netcash completed txs in Jul–Aug for Unjani customers (incl June-invoice collections)', `R ${money(netcashAllWindow)}`],
    ['Active Unjani sites', String(sites.filter((s) => s.status === 'active').length)],
    ['Extract', existsSync(DUMP) ? DUMP : 'Live Supabase query'],
  ];
  coverRows.forEach(([k, v], idx) => {
    cover.getCell(idx + 1, 1).value = k;
    cover.getCell(idx + 1, 2).value = v;
    cover.getCell(idx + 1, 1).font = { bold: true };
  });

  addSheet(
    '01_Summary_by_status',
    ['Status', 'Count', 'Issued incl VAT', 'Paid on books', 'Due on books', 'Netcash recorded'],
    ['paid', 'sent', 'voided', 'other'].map((st) => {
      const set = invoices.filter((i) =>
        st === 'other' ? !['paid', 'sent', 'voided'].includes(i.status) : i.status === st
      );
      return [
        st,
        set.length,
        ZAR(set.reduce((s, i) => s + i.total_amount, 0)),
        ZAR(set.reduce((s, i) => s + i.amount_paid, 0)),
        ZAR(set.reduce((s, i) => s + i.amount_due, 0)),
        ZAR(set.reduce((s, i) => s + (netcashByInvoice.get(i.id) || 0), 0)),
      ];
    })
  );

  addSheet(
    '02_Invoices',
    [
      'Invoice',
      'Invoice date',
      'Due date',
      'Period start',
      'Period end',
      'Clinic',
      'Account',
      'Type',
      'Collection rail',
      'Status',
      'Match',
      'Issued incl VAT',
      'Paid on books',
      'Due on books',
      'Netcash recorded',
      'Debit-order successful',
      'VAT flag',
      'Paid at',
      'Netcash / PayNow ref',
    ],
    invoices.map((i) => {
      const { match, vatUnder } = classify(i);
      return [
        i.invoice_number,
        i.invoice_date,
        i.due_date,
        i.period_start,
        i.period_end,
        i.site_name,
        i.account_number,
        i.invoice_type,
        i.payment_collection_method,
        i.status,
        match,
        i.total_amount,
        i.amount_paid,
        i.amount_due,
        netcashByInvoice.get(i.id) || 0,
        debitSuccessByInvoice.get(i.id) || 0,
        vatUnder ? 'UNDERBILLED — total R450 incl instead of R517.50' : '',
        i.paid_at,
        i.paynow_transaction_ref,
      ];
    })
  );

  addSheet(
    '03_Netcash_payments',
    [
      'Completed at',
      'Clinic',
      'Account',
      'Invoice',
      'Amount',
      'Status',
      'Provider',
      'Method',
      'Recon source',
      'Transaction id',
      'Reference',
    ],
    payments
      .sort((a, b) =>
        String(a.completed_at || a.created_at).localeCompare(String(b.completed_at || b.created_at))
      )
      .map((p) => {
        const inv = findInvoiceForPayment(p);
        const c = p.customer_id ? customerById.get(p.customer_id) : undefined;
        return [
          p.completed_at || p.created_at,
          c?.business_name || p.business_name || '',
          c?.account_number || p.account_number || '',
          inv?.invoice_number || p.invoice_number || p.reference || '',
          num(p.amount),
          p.status,
          p.provider,
          p.payment_method,
          p.reconciliation_source,
          p.transaction_id,
          p.reference,
        ];
      })
  );

  addSheet(
    '04_Debit_order_items',
    [
      'Action date',
      'Clinic',
      'Account',
      'Invoice',
      'Amount',
      'Item status',
      'Txn code',
      'Batch status',
      'Batch name',
      'Unpaid reason',
      'Processed at',
    ],
    debitItems
      .sort((a, b) => String(a.action_date).localeCompare(String(b.action_date)))
      .map((d) => {
        const c = customerById.get(d.customer_id);
        const b = d.batch_id ? batchById.get(d.batch_id) : undefined;
        const inv =
          invoices.find((i) => i.id === d.invoice_id || i.invoice_number === d.account_reference);
        return [
          d.action_date,
          c?.business_name || '',
          c?.account_number || '',
          inv?.invoice_number || d.account_reference,
          num(d.amount),
          d.status,
          d.transaction_code,
          b?.status || '',
          b?.batch_name || '',
          d.unpaid_reason,
          d.processed_at,
        ];
      })
  );

  const activeSites = sites.filter((s) => s.status === 'active');
  addSheet(
    '05_Site_closeout',
    [
      'Site',
      'Account',
      'Installed',
      'Jul invoices',
      'Jul issued',
      'Jul paid books',
      'Jul due',
      'Aug invoices',
      'Aug issued',
      'Aug paid books',
      'Aug due',
      'Open at 31 Aug',
      'Close-out action',
    ],
    activeSites.map((s) => {
      const c = customers.find((x) => x.corporate_site_id === s.id);
      const siteInvs = invoices.filter(
        (i) =>
          i.corporate_site_id === s.id ||
          i.customer_id === c?.id ||
          i.site_name === s.site_name
      );
      const jul = siteInvs.filter((i) => i.invoice_date.startsWith('2026-07') && i.status !== 'voided');
      const aug = siteInvs.filter((i) => i.invoice_date.startsWith('2026-08') && i.status !== 'voided');
      const julDue = ZAR(jul.reduce((n, i) => n + i.amount_due, 0));
      const augDue = ZAR(aug.reduce((n, i) => n + i.amount_due, 0));
      const openAmt = ZAR(julDue + augDue);
      let action = 'Clear — no open AR';
      if (jul.length === 0 && aug.length === 0) action = 'No Jul/Aug invoice issued — include on NPC opening statement';
      else if (openAmt > 0.05) action = 'Carry unpaid clinic AR into NPC statement / write-off decision';
      return [
        s.site_name,
        c?.account_number || '',
        s.installed_at ? String(s.installed_at).slice(0, 10) : '',
        jul.map((i) => i.invoice_number).join(', '),
        ZAR(jul.reduce((n, i) => n + i.total_amount, 0)),
        ZAR(jul.reduce((n, i) => n + i.amount_paid, 0)),
        julDue,
        aug.map((i) => i.invoice_number).join(', '),
        ZAR(aug.reduce((n, i) => n + i.total_amount, 0)),
        ZAR(aug.reduce((n, i) => n + i.amount_paid, 0)),
        augDue,
        openAmt,
        action,
      ];
    })
  );

  const exceptions: (string | number | null)[][] = [];
  for (const i of invoices) {
    const { match, vatUnder } = classify(i);
    if (match === 'PAID_MATCHED' && !vatUnder) continue;
    if (match === 'VOIDED') {
      exceptions.push([
        i.invoice_number,
        i.site_name,
        match,
        'Voided — excluded from collectable AR',
        i.total_amount,
        i.amount_paid,
        netcashByInvoice.get(i.id) || 0,
      ]);
      continue;
    }
    exceptions.push([
      i.invoice_number,
      i.site_name,
      match,
      vatUnder
        ? 'Early July invoice billed R450 incl VAT (correct monthly is R517.50).'
        : match === 'PAID_OVERCOLLECT'
          ? 'Books/Netcash collected more than invoice total.'
          : match === 'PAID_NETCASH_SHORT'
            ? 'Invoice marked paid but Netcash recorded less than invoice total.'
            : match === 'OPEN_DEBIT_PENDING'
              ? 'Debit-order batch still pending at close-out — cancel before NPC cutover.'
              : 'Unpaid at 31 Aug — do not collect from the clinic after 31 Aug.',
      i.total_amount,
      i.amount_paid,
      netcashByInvoice.get(i.id) || 0,
    ]);
  }

  addSheet(
    '06_Exceptions',
    [
      'Invoice',
      'Clinic',
      'Match',
      'Close-out note',
      'Issued',
      'Paid on books',
      'Netcash recorded',
    ],
    exceptions
  );

  addSheet(
    '07_Notes',
    ['Topic', 'Detail'],
    [
      [
        'Cutover',
        'From 1 Sep 2026 CircleTel bills Unjani NPC. Do not collect remaining clinic DebiCheck/PayNow after 31 Aug unless already in flight and successful.',
      ],
      [
        'VAT',
        'Catalogue price is R450 ex VAT = R517.50 incl. Several 1 Jul invoices were issued at R450 incl (subtotal R391.30). Flagged UNDERBILLED.',
      ],
      [
        'Kayamandi INV-2026-00027',
        'Invoice R450 paid on books; Netcash debit success was R174 (TDD 15 Jul). Difference needs a credit/write-off or remaining collection decision before NPC takes over.',
      ],
      [
        'Cosmo City INV-2026-00043',
        'Invoice R517.50; books paid R793.50 (over-collect). Credit the excess against NPC opening balance or refund.',
      ],
      [
        'Pending debit batches',
        'Sweetwaters INV-41 (action 10 Aug) and Nokaneng INV-42 / INV-49 (action 18 Aug) were still pending in debit_order_batch_items. Confirm with Netcash whether they collected; if not, cancel so the clinic is not double-collected after NPC billing starts.',
      ],
      [
        'Voided July invoices',
        'Alexandra, Chloorkop, Sicelo, Oukasie, Phoenix 1 Jul invoices were voided. August invoices exist for Sicelo/Oukasie/Phoenix and remain unpaid.',
      ],
      [
        'Alexandra / Chloorkop',
        'Active sites with voided July invoices and no August replacement in this extract — confirm whether they should appear on the September NPC pack as full months.',
      ],
      [
        'Netcash source',
        'payment_transactions.provider = netcash. reconciliation_source = netcash_statement means CircleTel matched the merchant statement after the fact; PayNow rows are webhook completions.',
      ],
    ]
  );

  await wb.xlsx.writeFile(OUT_XLSX);
  console.log(JSON.stringify({
    out: OUT_XLSX,
    invoices: invoices.length,
    live: live.length,
    paid: paid.length,
    open: open.length,
    issuedIncl,
    booksPaid,
    booksDue,
    netcashOnInvoices,
    netcashAllWindow,
    payments: payments.length,
    debitItems: debitItems.length,
    exceptions: exceptions.length,
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

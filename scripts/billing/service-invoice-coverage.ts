/**
 * Post-generate service ↔ invoice coverage (entitlement leakage).
 *
 * Usage:
 *   set -a && source .env.local && set +a && npx tsx scripts/billing/service-invoice-coverage.ts --period=2026-07
 *   ... --format=csv --out=/tmp/coverage-2026-07.csv
 *
 * Rules: wayfinder revenue-leakage-service-invoice (tickets 03–06).
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import {
  buildCoverageReport,
  reportToCsv,
  type InvoiceRow,
  type ServiceRow,
} from '../../lib/billing/service-invoice-coverage';

function parseArgs(argv: string[]) {
  let period = '';
  let format: 'json' | 'csv' = 'json';
  let out: string | null = null;
  for (const a of argv) {
    if (a.startsWith('--period=')) period = a.slice('--period='.length);
    else if (a.startsWith('--format=')) {
      const f = a.slice('--format='.length);
      if (f === 'json' || f === 'csv') format = f;
      else throw new Error(`Invalid --format=${f}`);
    } else if (a.startsWith('--out=')) out = a.slice('--out='.length);
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: npx tsx scripts/billing/service-invoice-coverage.ts --period=YYYY-MM [--format=json|csv] [--out=path]
Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (source .env.local)`);
      process.exit(0);
    }
  }
  if (!period) {
    // default: previous calendar month UTC (document; finance often runs after month)
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - 1);
    period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  return { period, format, out };
}

async function main() {
  const { period, format, out } = parseArgs(process.argv.slice(2));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run: set -a && source .env.local && set +a'
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: servicesRaw, error: svcErr } = await supabase
    .from('customer_services')
    .select(
      'id, customer_id, package_name, monthly_price, status, active, billing_day, last_invoice_date, activation_date, billing_start_date, product_category'
    )
    .eq('active', true)
    .eq('status', 'active');

  if (svcErr) throw new Error(`customer_services: ${svcErr.message}`);

  const services = servicesRaw ?? [];
  const customerIds = [...new Set(services.map((s) => s.customer_id as string))];

  const customers = new Map<
    string,
    { business_name: string | null; first_name: string | null; last_name: string | null; email: string | null }
  >();

  // batch customers
  for (let i = 0; i < customerIds.length; i += 50) {
    const batch = customerIds.slice(i, i + 50);
    const { data, error } = await supabase
      .from('customers')
      .select('id, business_name, first_name, last_name, email')
      .in('id', batch);
    if (error) throw new Error(`customers: ${error.message}`);
    for (const c of data ?? []) {
      customers.set(c.id as string, {
        business_name: (c.business_name as string | null) ?? null,
        first_name: (c.first_name as string | null) ?? null,
        last_name: (c.last_name as string | null) ?? null,
        email: (c.email as string | null) ?? null,
      });
    }
  }

  const serviceRows: ServiceRow[] = services.map((s) => {
    const c = customers.get(s.customer_id as string);
    const name =
      c?.business_name ||
      [c?.first_name, c?.last_name].filter(Boolean).join(' ') ||
      c?.email ||
      null;
    return {
      id: s.id as string,
      customer_id: s.customer_id as string,
      package_name: (s.package_name as string | null) ?? null,
      monthly_price: s.monthly_price != null ? Number(s.monthly_price) : null,
      status: (s.status as string | null) ?? null,
      active: s.active as boolean | null,
      billing_day: s.billing_day != null ? Number(s.billing_day) : null,
      last_invoice_date: (s.last_invoice_date as string | null) ?? null,
      activation_date: (s.activation_date as string | null) ?? null,
      billing_start_date: (s.billing_start_date as string | null) ?? null,
      product_category: (s.product_category as string | null) ?? null,
      customer_business_name: c?.business_name ?? name,
      customer_name: name,
    };
  });

  // Invoices: load from ~6 months before period start for safety
  const [py, pm] = period.split('-').map(Number);
  const fromDate = new Date(Date.UTC(py, pm - 4, 1)); // 3 months before period month
  const fromIso = fromDate.toISOString();

  const { data: invRaw, error: invErr } = await supabase
    .from('customer_invoices')
    .select(
      'id, invoice_number, service_id, status, period_start, period_end, invoice_date, total_amount'
    )
    .gte('created_at', fromIso)
    .limit(5000);

  if (invErr) throw new Error(`customer_invoices: ${invErr.message}`);

  const invoices: InvoiceRow[] = (invRaw ?? []).map((i) => ({
    id: i.id as string,
    invoice_number: (i.invoice_number as string | null) ?? null,
    service_id: (i.service_id as string | null) ?? null,
    status: (i.status as string | null) ?? null,
    period_start: (i.period_start as string | null) ?? null,
    period_end: (i.period_end as string | null) ?? null,
    invoice_date: (i.invoice_date as string | null) ?? null,
    total_amount: i.total_amount != null ? Number(i.total_amount) : null,
  }));

  const report = buildCoverageReport(serviceRows, invoices, period);

  // Human summary on stderr so JSON stdout is clean when piping
  const s = report.summary;
  console.error(`Service↔invoice coverage ${period}`);
  console.error(
    `  active=${s.activeServices} billable=${s.billable} covered=${s.covered} deferred=${s.deferred} notYetDue=${s.notYetDue} gaps=${s.gaps}`
  );
  console.error(
    `  coveredCatalogMrr=R${s.coveredCatalogMrr.toFixed(2)} gapCatalogMrr=R${s.gapCatalogMrr.toFixed(2)}`
  );
  if (s.gaps > 0) {
    console.error('  GAPS:');
    for (const l of report.lines.filter(
      (x) => x.reason === 'no_invoice' || x.reason === 'void_only'
    )) {
      console.error(
        `    [${l.reason}] day=${l.billingDay} R${l.monthlyPrice} | ${l.customerName} | ${l.packageName}`
      );
    }
  }

  const body =
    format === 'csv' ? reportToCsv(report) : JSON.stringify(report, null, 2);

  if (out) {
    writeFileSync(out, body, 'utf8');
    console.error(`Wrote ${out}`);
  } else {
    process.stdout.write(body.endsWith('\n') ? body : body + '\n');
  }

  // Exit 1 if gaps (useful in CI after generate) — still write full report
  if (s.gaps > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(2);
});

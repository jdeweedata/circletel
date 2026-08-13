/**
 * Unjani Connect — one row per active (and pending) service per clinic.
 * Live from corporate_sites + customer_services.
 *
 *   set -a && source .env.local && set +a && npx tsx scripts/generate-unjani-active-services.ts
 */
import { mkdirSync } from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';

const ORG = '9b6b601f-9b51-42e7-8b97-af7ae9d3486e';
const OUT = path.join(
  process.cwd(),
  'docs/clients/unjani-clinics/billing/closeouts/UNJANI_CONNECT_ACTIVE_SERVICES_2026-08-13.xlsx'
);

const ZAR = (n: number) => Math.round(n * 100) / 100;

type Row = {
  site_name: string;
  site_status: string;
  site_account: string | null;
  province: string | null;
  installed_at: string | null;
  site_monthly_fee: number | null;
  technology: string | null;
  network_path: string | null;
  customer_account: string | null;
  business_name: string | null;
  business_registration: string | null;
  service_id: string | null;
  service_status: string | null;
  service_active_flag: boolean | null;
  package_name: string | null;
  service_type: string | null;
  product_category: string | null;
  monthly_price: number | null;
  setup_fee: number | null;
  speed_down: number | null;
  speed_up: number | null;
  contract_months: number | null;
  contract_start_date: string | null;
  activation_date: string | null;
  billing_start_date: string | null;
  last_invoice_date: string | null;
  billing_day: number | null;
  package_sku: string | null;
};

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? ZAR(n) : null;
}

function d(v: unknown): string {
  if (!v) return '';
  return String(v).slice(0, 10);
}

/** Service type for the report comes from corporate_sites.technology, not
 *  customer_services.service_type (which is stored as fibre on every Unjani
 *  Connect row and is wrong for Tarana FWB / LTE-5G sites). */
const TECHNOLOGY_LABEL: Record<string, string> = {
  tarana_fwb: 'Tarana FWB',
  lte_5g: 'LTE/5G',
  ftth: 'Fibre (FTTH)',
  fwa: 'FWA',
};

const NETWORK_PATH_LABEL: Record<string, string> = {
  circletel_bng: 'CircleTel BNG',
  mtn_breakout: 'MTN breakout',
};

function serviceTypeFromTechnology(technology: string | null): string {
  if (!technology) return '';
  return TECHNOLOGY_LABEL[technology] ?? technology;
}

async function load(): Promise<Row[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: sites, error: sErr } = await sb
    .from('corporate_sites')
    .select(
      'id, site_name, status, account_number, province, installed_at, monthly_fee, technology, network_path'
    )
    .eq('corporate_id', ORG)
    .order('site_name');
  if (sErr) throw sErr;

  const siteIds = (sites ?? []).map((s) => s.id);
  const { data: customers, error: cErr } = await sb
    .from('customers')
    .select('id, account_number, business_name, business_registration, corporate_site_id')
    .in('corporate_site_id', siteIds);
  if (cErr) throw cErr;

  const customerIds = (customers ?? []).map((c) => c.id);
  const { data: services, error: vErr } = customerIds.length
    ? await sb
        .from('customer_services')
        .select(
          'id, customer_id, package_id, package_name, service_type, product_category, monthly_price, setup_fee, status, active, speed_down, speed_up, contract_months, contract_start_date, activation_date, billing_start_date, last_invoice_date, billing_day'
        )
        .in('customer_id', customerIds)
    : { data: [], error: null };
  if (vErr) throw vErr;

  const packageIds = [
    ...new Set((services ?? []).map((s) => s.package_id).filter(Boolean)),
  ] as string[];
  const { data: packages } = packageIds.length
    ? await sb.from('service_packages').select('id, sku').in('id', packageIds)
    : { data: [] };
  const skuById = new Map((packages ?? []).map((p) => [p.id, p.sku as string]));

  const custBySite = new Map((customers ?? []).map((c) => [c.corporate_site_id, c]));
  const svcByCustomer = new Map<string, typeof services>();
  for (const svc of services ?? []) {
    const list = svcByCustomer.get(svc.customer_id) ?? [];
    list.push(svc);
    svcByCustomer.set(svc.customer_id, list);
  }

  const rows: Row[] = [];
  for (const site of sites ?? []) {
    const cust = custBySite.get(site.id);
    const svcs = cust ? svcByCustomer.get(cust.id) ?? [] : [];
    if (svcs.length === 0) {
      rows.push({
        site_name: site.site_name,
        site_status: site.status,
        site_account: site.account_number,
        province: site.province,
        installed_at: d(site.installed_at),
        site_monthly_fee: num(site.monthly_fee),
        technology: site.technology,
        network_path: site.network_path,
        customer_account: cust?.account_number ?? null,
        business_name: cust?.business_name ?? null,
        business_registration: cust?.business_registration ?? null,
        service_id: null,
        service_status: null,
        service_active_flag: null,
        package_name: null,
        service_type: null,
        product_category: null,
        monthly_price: null,
        setup_fee: null,
        speed_down: null,
        speed_up: null,
        contract_months: null,
        contract_start_date: null,
        activation_date: null,
        billing_start_date: null,
        last_invoice_date: null,
        billing_day: null,
        package_sku: null,
      });
      continue;
    }
    for (const svc of svcs) {
      rows.push({
        site_name: site.site_name,
        site_status: site.status,
        site_account: site.account_number,
        province: site.province,
        installed_at: d(site.installed_at),
        site_monthly_fee: num(site.monthly_fee),
        technology: site.technology,
        network_path: site.network_path,
        customer_account: cust?.account_number ?? null,
        business_name: cust?.business_name ?? null,
        business_registration: (cust?.business_registration ?? '').trim() || null,
        service_id: svc.id,
        service_status: svc.status,
        service_active_flag: svc.active,
        package_name: svc.package_name,
        service_type: svc.service_type,
        product_category: svc.product_category,
        monthly_price: num(svc.monthly_price),
        setup_fee: num(svc.setup_fee),
        speed_down: svc.speed_down,
        speed_up: svc.speed_up,
        contract_months: svc.contract_months,
        contract_start_date: d(svc.contract_start_date),
        activation_date: d(svc.activation_date),
        billing_start_date: d(svc.billing_start_date),
        last_invoice_date: d(svc.last_invoice_date),
        billing_day: svc.billing_day,
        package_sku: svc.package_id ? skuById.get(svc.package_id) ?? null : null,
      });
    }
  }
  return rows;
}

function serviceRow(r: Row): (string | number)[] {
  const ex = r.monthly_price ?? 0;
  const flags: string[] = [];
  if (r.contract_months === 0) flags.push('contract_months=0 should be 24');
  if (r.billing_start_date === '2026-09-01') flags.push('billing start already 1 Sep');
  if ((r.business_name || '').includes('T/A') || r.business_name === 'Bhekilanga Health Care') {
    flags.push('registered name differs from site');
  }
  return [
    r.site_name.replace(/^Unjani Clinic - /, ''),
    r.site_status,
    r.province ?? '',
    r.customer_account ?? '',
    r.site_account ?? '',
    r.business_name ?? '',
    r.business_registration ?? '',
    r.installed_at ?? '',
    r.technology ? serviceTypeFromTechnology(r.technology) : '',
    r.network_path ? NETWORK_PATH_LABEL[r.network_path] ?? r.network_path : '',
    r.package_sku ?? '',
    r.package_name ?? '',
    serviceTypeFromTechnology(r.technology),
    r.service_status ?? 'none',
    r.service_active_flag === true ? 'yes' : r.service_active_flag === false ? 'no' : '',
    ex,
    ZAR(ex * 1.15),
    r.speed_down && r.speed_up ? `${r.speed_down}/${r.speed_up}` : '',
    r.contract_months ?? '',
    r.activation_date ?? '',
    r.billing_start_date ?? '',
    r.last_invoice_date ?? '',
    r.billing_day ?? '',
    flags.join(' · '),
  ];
}

const HEADERS = [
  'Clinic',
  'Site status',
  'Province',
  'Customer account',
  'Site account',
  'Registered business name',
  'Registration',
  'Installed',
  'Technology',
  'Network path',
  'SKU',
  'Package',
  'Service type',
  'Service status',
  'Active flag',
  'Monthly ex VAT',
  'Monthly incl VAT',
  'Speed',
  'Contract months',
  'Activation',
  'Billing start',
  'Last invoice',
  'Billing day',
  'Flag',
];

async function main() {
  const rows = await load();
  const active = rows.filter((r) => r.site_status === 'active' && r.service_status === 'active');
  const pending = rows.filter((r) => r.site_status !== 'active' || r.service_status !== 'active');
  const monthlyEx = ZAR(active.reduce((s, r) => s + (r.monthly_price ?? 0), 0));

  mkdirSync(path.dirname(OUT), { recursive: true });
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CircleTel Unjani services';
  wb.created = new Date();

  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF13274A' },
  };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' } };

  function addSheet(name: string, headers: string[], data: (string | number)[][]) {
    const ws = wb.addWorksheet(name);
    ws.addRow(headers);
    for (let i = 1; i <= headers.length; i++) {
      ws.getCell(1, i).fill = headerFill;
      ws.getCell(1, i).font = headerFont;
    }
    for (const row of data) ws.addRow(row);
    ws.columns = headers.map((h, i) => ({
      width: Math.min(
        42,
        Math.max(12, h.length + 2, ...data.map((row) => String(row[i] ?? '').length + 2))
      ),
    }));
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, data.length + 1), column: headers.length },
    };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    return ws;
  }

  const cover = wb.addWorksheet('00_Cover');
  cover.getColumn(1).width = 36;
  cover.getColumn(2).width = 88;
  const coverRows: [string, string][] = [
    ['Report', 'Unjani Connect — active services per clinic'],
    ['As at', '13 August 2026 17:40 SAST · live corporate_sites + customer_services'],
    ['Org', 'Unjani Clinics NPC · corporate_code UNJ'],
    ['Product', 'Unjani Managed Connectivity · SKU UNJ-MC-001 · R450 ex / R517.50 incl'],
    ['', ''],
    ['Active sites with active service', String(new Set(active.map((r) => r.site_name)).size)],
    ['Active service rows', String(active.length)],
    ['Monthly ex VAT (active)', `R ${monthlyEx.toFixed(2)}`],
    ['Monthly incl VAT (active)', `R ${ZAR(monthlyEx * 1.15).toFixed(2)}`],
    ['Pending sites / non-active services', String(pending.length)],
    ['', ''],
    ['September NPC pack', `21 × R517.50 incl = R ${(21 * 517.5).toFixed(2)}`],
    ['Service type', 'From corporate_sites.technology (Tarana FWB / LTE/5G). Not customer_services.service_type, which is incorrectly fibre on these rows.'],
    ['Sweetwaters', 'contract_months is 0 and should be 24'],
    ['Alexandra / Chloorkop', 'billing_start_date already 2026-09-01'],
    ['Delmas', 'Pending site · two pending services (ClinicConnect + UNJ-MC-001)'],
    ['Khayelitsha / Mamelodi / Soweto Diepkloof / Umlazi', 'Pending sites · no customer · no service'],
  ];
  coverRows.forEach(([k, v], i) => {
    cover.getCell(i + 1, 1).value = k;
    cover.getCell(i + 1, 2).value = v;
    cover.getCell(i + 1, 1).font = { bold: true };
  });

  addSheet('01_Active_services', HEADERS, active.map(serviceRow));
  addSheet('02_Pending_or_no_service', HEADERS, pending.map(serviceRow));

  const byTech = new Map<string, { n: number; ex: number }>();
  for (const r of active) {
    const k = `${serviceTypeFromTechnology(r.technology) || 'unknown'} · ${NETWORK_PATH_LABEL[r.network_path ?? ''] ?? r.network_path ?? 'unknown'}`;
    const cur = byTech.get(k) ?? { n: 0, ex: 0 };
    cur.n += 1;
    cur.ex += r.monthly_price ?? 0;
    byTech.set(k, cur);
  }
  addSheet(
    '03_By_technology',
    ['Technology · network path', 'Active clinics', 'Monthly ex VAT', 'Monthly incl VAT'],
    [...byTech.entries()].map(([k, v]) => [k, v.n, ZAR(v.ex), ZAR(v.ex * 1.15)])
  );

  await wb.xlsx.writeFile(OUT);
  console.log(
    JSON.stringify(
      {
        out: OUT,
        activeClinics: new Set(active.map((r) => r.site_name)).size,
        activeServices: active.length,
        pendingRows: pending.length,
        monthlyEx,
        monthlyIncl: ZAR(monthlyEx * 1.15),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

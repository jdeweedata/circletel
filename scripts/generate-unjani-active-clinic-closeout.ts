/**
 * Unjani Connect — per-active-clinic close-out workbook.
 * Active corporate_sites + customer_services UNJ-MC-001 vs Jul/Aug invoices and Netcash.
 *
 *   npx tsx scripts/generate-unjani-active-clinic-closeout.ts
 */
import { mkdirSync } from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

const OUT = path.join(
  process.cwd(),
  'docs/clients/unjani-clinics/billing/closeouts/UNJANI_CONNECT_ACTIVE_CLINIC_CLOSEOUT_2026-08-13.xlsx'
);

const ZAR = (n: number) => Math.round(n * 100) / 100;

type Clinic = {
  clinic: string;
  account: string;
  installed: string;
  activation: string;
  billingStart: string;
  lastInvoice: string;
  contractMonths: number;
  sku: string;
  service: string;
  monthlyEx: number;
  jul: string;
  aug: string;
  issued: number;
  booksPaid: number;
  due: number;
  netcash: number;
  npcSep: string;
  verdict: string;
  action: string;
};

/** customers.business_name + customers.business_registration as at 13 Aug 2026 */
const REGISTERED: Record<
  string,
  { businessName: string; registration: string; nameFlag: string }
> = {
  'CT-2026-00009': {
    businessName: 'Unjani Clinic - Alexandra',
    registration: '',
    nameFlag: 'MATCH · CIPC blank',
  },
  'CT-2026-00017': {
    businessName: 'Unjani Clinic - Barcelona',
    registration: '2017/468955/07',
    nameFlag: 'MATCH · same CIPC as Durban · stored with leading space',
  },
  'CT-2026-00010': {
    businessName: 'Unjani Clinic - Chloorkop',
    registration: '',
    nameFlag: 'MATCH · CIPC blank',
  },
  'CT-2026-00011': {
    businessName: 'Mbali Zwakele Gumbi T/A Unjani Clinic - Cosmo City',
    registration: '2016/37347/07',
    nameFlag: 'DIFFERS from site name',
  },
  'CT-2026-00039': {
    businessName: 'Unjani Clinic - Durban',
    registration: '2017/468955/07',
    nameFlag: 'MATCH · same CIPC as Barcelona',
  },
  'CT-2026-00012': {
    businessName: 'Bhekilanga Health Care',
    registration: '2024/349220/07',
    nameFlag: 'DIFFERS from site name',
  },
  'CT-2026-00016': {
    businessName: 'Unjani Clinic - Heidelberg',
    registration: '2021/436093/07',
    nameFlag: 'MATCH',
  },
  'CT-2026-00019': {
    businessName: 'Unjani Clinic - Jabulani',
    registration: '',
    nameFlag: 'MATCH · CIPC blank',
  },
  'CT-2026-00022': {
    businessName: 'Unjani Clinic - Kayamandi',
    registration: '2023/547010/10',
    nameFlag: 'MATCH',
  },
  'CT-2026-00020': {
    businessName: 'Unjani Clinic - Lens ext 10',
    registration: '2020/090909/07',
    nameFlag: 'MATCH',
  },
  'CT-2026-00026': {
    businessName: 'Unjani Clinic - New Hanover',
    registration: '',
    nameFlag: 'MATCH · CIPC blank',
  },
  'CT-2026-00021': {
    businessName: 'Unjani Clinic - Nokaneng',
    registration: '2024/377138/07',
    nameFlag: 'MATCH',
  },
  'CT-2026-00018': {
    businessName: 'Unjani Clinic - Oukasie',
    registration: '',
    nameFlag: 'MATCH · CIPC blank',
  },
  'CT-2026-00025': {
    businessName: 'Unjani Clinic - Phoenix',
    registration: '',
    nameFlag: 'MATCH · CIPC blank',
  },
  'CT-2026-00015': {
    businessName: 'Unjani Clinic - Sicelo',
    registration: '',
    nameFlag: 'MATCH · CIPC blank',
  },
  'CT-2026-00013': {
    businessName: 'Unjani Clinic - Sky City',
    registration: '',
    nameFlag: 'MATCH · CIPC blank',
  },
  'CT-2026-00028': {
    businessName: 'Unjani Clinic - Soshanguve (Block P)',
    registration: '2022/580726/07',
    nameFlag: 'MATCH',
  },
  'CT-2026-00024': {
    businessName: 'Unjani Clinic - Sweetwaters',
    registration: '7403100396083',
    nameFlag: 'MATCH · ID number stored, not CIPC',
  },
  'CT-2026-00014': {
    businessName: 'Unjani Clinic - Tokoza',
    registration: '',
    nameFlag: 'MATCH · CIPC blank',
  },
  'CT-2026-00027': {
    businessName: 'Unjani Clinic - Umsinga',
    registration: '',
    nameFlag: 'MATCH · CIPC blank',
  },
  'CT-2026-00023': {
    businessName: 'Unjani Clinic - Zamdela',
    registration: '2021/599225/07',
    nameFlag: 'MATCH',
  },
};

const CLINICS: Clinic[] = [
  {
    clinic: 'Alexandra',
    account: 'CT-2026-00009',
    installed: '2026-02-11',
    activation: '2026-06-01',
    billingStart: '2026-09-01',
    lastInvoice: '2026-07-01 voided',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-21 voided',
    aug: 'None',
    issued: 0,
    booksPaid: 0,
    due: 0,
    netcash: 0,
    npcSep: 'Yes — full R517.50',
    verdict: 'SERVICE_LIVE_NO_JUL_AUG_AR',
    action: 'Include on 1 Sep NPC pack. billing_start_date is already 1 Sep.',
  },
  {
    clinic: 'Barcelona',
    account: 'CT-2026-00017',
    installed: '2026-02-26',
    activation: '2026-06-01',
    billingStart: '',
    lastInvoice: '2026-08-01',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-25 paid R450 TDD 15 Jul',
    aug: 'INV-65 paid R517.50 TDD 5 Aug',
    issued: 967.5,
    booksPaid: 967.5,
    due: 0,
    netcash: 967.5,
    npcSep: 'Yes — full R517.50',
    verdict: 'CLEAR',
    action: 'No clinic AR. NPC Sep pack only.',
  },
  {
    clinic: 'Chloorkop',
    account: 'CT-2026-00010',
    installed: '2026-02-11',
    activation: '2026-06-01',
    billingStart: '2026-09-01',
    lastInvoice: '2026-07-01 voided',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-22 voided',
    aug: 'None',
    issued: 0,
    booksPaid: 0,
    due: 0,
    netcash: 0,
    npcSep: 'Yes — full R517.50',
    verdict: 'SERVICE_LIVE_NO_JUL_AUG_AR',
    action: 'Include on 1 Sep NPC pack. billing_start_date is already 1 Sep.',
  },
  {
    clinic: 'Cosmo City',
    account: 'CT-2026-00011',
    installed: '2026-02-12',
    activation: '2026-06-01',
    billingStart: '',
    lastInvoice: '2026-07-30',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-17 R276 TDD 15 Jul (June pro-rata); INV-43 EFT R793.50 on R517.50',
    aug: 'None issued',
    issued: 517.5,
    booksPaid: 793.5,
    due: 0,
    netcash: 1069.5,
    npcSep: 'Yes — full R517.50',
    verdict: 'CLEAR_WITH_SURPLUS',
    action: 'R276 surplus on INV-43. Credit Nokaneng or NPC — do not cash-refund. No August invoice; still bill Sep NPC.',
  },
  {
    clinic: 'Durban',
    account: 'CT-2026-00039',
    installed: '2026-03-07',
    activation: '2026-03-07',
    billingStart: '',
    lastInvoice: '2026-08-01',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-74 sent R517.50 PayNow',
    aug: 'INV-75 sent R517.50 PayNow',
    issued: 1035,
    booksPaid: 0,
    due: 1035,
    netcash: 0,
    npcSep: 'Yes — full R517.50 + carry AR',
    verdict: 'OPEN_AR',
    action: 'Carry R1,035 to NPC statement. Stop clinic PayNow.',
  },
  {
    clinic: 'Fleurhof',
    account: 'CT-2026-00012',
    installed: '2026-02-12',
    activation: '2026-06-01',
    billingStart: '',
    lastInvoice: '2026-07-30',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-44 paid R517.50 card 5 Aug',
    aug: 'None issued',
    issued: 517.5,
    booksPaid: 517.5,
    due: 0,
    netcash: 517.5,
    npcSep: 'Yes — full R517.50',
    verdict: 'CLEAR_MISSING_AUG_INVOICE',
    action: 'July collected. No August invoice on an active service — include Sep NPC only, do not raise a clinic Aug debit.',
  },
  {
    clinic: 'Heidelberg',
    account: 'CT-2026-00016',
    installed: '2026-02-16',
    activation: '2026-06-01',
    billingStart: '',
    lastInvoice: '2026-08-01',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-26 paid R450 TDD 15 Jul',
    aug: 'INV-66 paid R517.50 TDD 5 Aug',
    issued: 967.5,
    booksPaid: 967.5,
    due: 0,
    netcash: 967.5,
    npcSep: 'Yes — full R517.50',
    verdict: 'CLEAR',
    action: 'No clinic AR. NPC Sep pack only.',
  },
  {
    clinic: 'Jabulani',
    account: 'CT-2026-00019',
    installed: '2026-03-06',
    activation: '2026-06-01',
    billingStart: '',
    lastInvoice: '2026-08-01',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-30 sent R450; INV-50 sent R517.50 (June back-bill)',
    aug: 'INV-63 sent R517.50',
    issued: 1485,
    booksPaid: 0,
    due: 1485,
    netcash: 0,
    npcSep: 'Yes — full R517.50 + carry AR',
    verdict: 'OPEN_AR',
    action: 'Carry R1,485 to NPC. Stop clinic PayNow.',
  },
  {
    clinic: 'Kayamandi',
    account: 'CT-2026-00022',
    installed: '2026-03-13',
    activation: '2026-06-01',
    billingStart: '',
    lastInvoice: '2026-08-01',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-27 paid R450 = CN-2026-00002 R276 + TDD R174',
    aug: 'INV-67 paid R517.50 TDD 5 Aug',
    issued: 967.5,
    booksPaid: 967.5,
    due: 0,
    netcash: 691.5,
    npcSep: 'Yes — full R517.50',
    verdict: 'CLEAR',
    action: 'Books match (credit note + TDD). No clinic AR.',
  },
  {
    clinic: 'Lens ext 10',
    account: 'CT-2026-00020',
    installed: '2026-02-26',
    activation: '2026-06-01',
    billingStart: '',
    lastInvoice: '2026-08-01',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-34 paid R450 PayNow 7 Jul; INV-51 sent R517.50 June back-bill',
    aug: 'INV-68 paid R517.50 card 4 Aug',
    issued: 1485,
    booksPaid: 967.5,
    due: 517.5,
    netcash: 967.5,
    npcSep: 'Yes — full R517.50 + carry AR',
    verdict: 'OPEN_AR',
    action: 'Carry INV-51 R517.50 to NPC. Jul+Aug recurring collected.',
  },
  {
    clinic: 'New Hanover',
    account: 'CT-2026-00026',
    installed: '2026-03-04',
    activation: '2026-06-01',
    billingStart: '',
    lastInvoice: '2026-08-01',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-32 sent R450; INV-47 sent R517.50 (June back-bill)',
    aug: 'INV-59 sent R517.50',
    issued: 1485,
    booksPaid: 0,
    due: 1485,
    netcash: 0,
    npcSep: 'Yes — full R517.50 + carry AR',
    verdict: 'OPEN_AR',
    action: 'Carry R1,485 to NPC. Stop clinic PayNow.',
  },
  {
    clinic: 'Nokaneng',
    account: 'CT-2026-00021',
    installed: '2026-03-02',
    activation: '2026-06-01',
    billingStart: '',
    lastInvoice: '2026-08-01',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-42 sent R517.50 (18 Aug debit); INV-49 paid via CN-2026-00003',
    aug: 'INV-61 paid R517.50 TDD 5 Aug — August stands',
    issued: 1552.5,
    booksPaid: 1035,
    due: 517.5,
    netcash: 517.5,
    npcSep: 'Yes — full R517.50 + carry INV-42 if 18 Aug misses',
    verdict: 'DEBIT_IN_FLIGHT',
    action: '18 Aug batch 2523842 authorised R517.50 INV-42 only. INV-49 credited CN-00003. INV-61 not credited. Ozow did not settle. Cosmo R276 still held — not applied to INV-42.',
  },
  {
    clinic: 'Oukasie',
    account: 'CT-2026-00018',
    installed: '2026-02-27',
    activation: '2026-06-01',
    billingStart: '2026-08-05',
    lastInvoice: '2026-08-05',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-29 voided',
    aug: 'INV-71 sent R517.50 PayNow',
    issued: 517.5,
    booksPaid: 0,
    due: 517.5,
    netcash: 0,
    npcSep: 'Yes — full R517.50 + carry AR',
    verdict: 'OPEN_AR',
    action: 'Carry INV-71 R517.50 to NPC.',
  },
  {
    clinic: 'Phoenix',
    account: 'CT-2026-00025',
    installed: '2026-03-03',
    activation: '2026-06-01',
    billingStart: '2026-08-05',
    lastInvoice: '2026-08-05',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-31 voided',
    aug: 'INV-73 sent R517.50 PayNow',
    issued: 517.5,
    booksPaid: 0,
    due: 517.5,
    netcash: 0,
    npcSep: 'Yes — full R517.50 + carry AR',
    verdict: 'OPEN_AR',
    action: 'Carry INV-73 R517.50 to NPC.',
  },
  {
    clinic: 'Sicelo',
    account: 'CT-2026-00015',
    installed: '2026-02-16',
    activation: '2026-06-01',
    billingStart: '2026-08-05',
    lastInvoice: '2026-08-05',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-28 voided',
    aug: 'INV-72 sent R517.50 PayNow',
    issued: 517.5,
    booksPaid: 0,
    due: 517.5,
    netcash: 0,
    npcSep: 'Yes — full R517.50 + carry AR',
    verdict: 'OPEN_AR',
    action: 'Carry INV-72 R517.50 to NPC.',
  },
  {
    clinic: 'Sky City',
    account: 'CT-2026-00013',
    installed: '2026-02-13',
    activation: '2026-06-01',
    billingStart: '',
    lastInvoice: '2026-08-01',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-23 paid R450 PayNow 2 Jul; INV-45 sent R517.50 June back-bill',
    aug: 'INV-55 sent R517.50',
    issued: 1485,
    booksPaid: 450,
    due: 1035,
    netcash: 450,
    npcSep: 'Yes — full R517.50 + carry AR',
    verdict: 'OPEN_AR',
    action: 'Carry R1,035 to NPC.',
  },
  {
    clinic: 'Soshanguve (Block P)',
    account: 'CT-2026-00028',
    installed: '2026-02-25',
    activation: '2026-06-01',
    billingStart: '',
    lastInvoice: '2026-08-01',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-37 sent R276 pro-rata; INV-38 sent R517.50',
    aug: 'INV-64 paid R517.50 TDD 5 Aug',
    issued: 1311,
    booksPaid: 517.5,
    due: 793.5,
    netcash: 517.5,
    npcSep: 'Yes — full R517.50 + carry AR',
    verdict: 'OPEN_AR',
    action: 'Carry INV-37+38 R793.50 to NPC. August collected.',
  },
  {
    clinic: 'Sweetwaters',
    account: 'CT-2026-00024',
    installed: '2026-03-03',
    activation: '2026-07-01',
    billingStart: '',
    lastInvoice: '2026-08-01',
    contractMonths: 0,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-41 sent R517.50 — 10 Aug debit never authorised',
    aug: 'INV-57 paid R517.50 TDD 5 Aug',
    issued: 1035,
    booksPaid: 517.5,
    due: 517.5,
    netcash: 517.5,
    npcSep: 'Yes — full R517.50 + carry AR',
    verdict: 'OPEN_AR',
    action: 'Carry INV-41 R517.50 to NPC. Do not resubmit clinic debit. contract_months is 0 — set 24 on NPC cutover.',
  },
  {
    clinic: 'Tokoza',
    account: 'CT-2026-00014',
    installed: '2026-02-18',
    activation: '2026-06-01',
    billingStart: '',
    lastInvoice: '2026-08-01',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-24 paid R450 PayNow 2 Jul; INV-46 sent R517.50 June back-bill',
    aug: 'INV-54 sent R517.50',
    issued: 1485,
    booksPaid: 450,
    due: 1035,
    netcash: 450,
    npcSep: 'Yes — full R517.50 + carry AR',
    verdict: 'OPEN_AR',
    action: 'Carry R1,035 to NPC.',
  },
  {
    clinic: 'Umsinga',
    account: 'CT-2026-00027',
    installed: '2026-03-11',
    activation: '2026-06-01',
    billingStart: '',
    lastInvoice: '2026-08-01',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-33 sent R450; INV-48 sent R517.50 June back-bill',
    aug: 'INV-60 sent R517.50',
    issued: 1485,
    booksPaid: 0,
    due: 1485,
    netcash: 0,
    npcSep: 'Yes — full R517.50 + carry AR',
    verdict: 'OPEN_AR',
    action: 'Carry R1,485 to NPC. Stop clinic PayNow.',
  },
  {
    clinic: 'Zamdela',
    account: 'CT-2026-00023',
    installed: '2026-03-09',
    activation: '2026-06-01',
    billingStart: '',
    lastInvoice: '2026-08-01',
    contractMonths: 24,
    sku: 'UNJ-MC-001',
    service: 'active',
    monthlyEx: 450,
    jul: 'INV-39 paid R276 Ozow; INV-40 paid R517.50 Ozow',
    aug: 'INV-62 paid R517.50 TDD 5 Aug',
    issued: 1311,
    booksPaid: 1311,
    due: 0,
    netcash: 1311,
    npcSep: 'Yes — full R517.50',
    verdict: 'CLEAR',
    action: 'No clinic AR. NPC Sep pack only.',
  },
];

async function main() {
  mkdirSync(path.dirname(OUT), { recursive: true });
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CircleTel Unjani close-out';
  wb.created = new Date();

  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF13274A' },
  };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' } };

  function addSheet(name: string, headers: string[], rows: (string | number)[][]) {
    const ws = wb.addWorksheet(name);
    ws.addRow(headers);
    const r1 = ws.getRow(1);
    r1.font = headerFont;
    r1.fill = headerFill;
    for (let i = 1; i <= headers.length; i++) {
      ws.getCell(1, i).fill = headerFill;
      ws.getCell(1, i).font = headerFont;
    }
    for (const row of rows) ws.addRow(row);
    ws.columns = headers.map((h, i) => ({
      header: h,
      width: Math.min(
        48,
        Math.max(12, h.length + 2, ...rows.map((row) => String(row[i] ?? '').length + 2))
      ),
    }));
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, rows.length + 1), column: headers.length },
    };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    return ws;
  }

  const issued = ZAR(CLINICS.reduce((s, c) => s + c.issued, 0));
  const paid = ZAR(CLINICS.reduce((s, c) => s + c.booksPaid, 0));
  const due = ZAR(CLINICS.reduce((s, c) => s + c.due, 0));
  const netcash = ZAR(CLINICS.reduce((s, c) => s + c.netcash, 0));
  const clear = CLINICS.filter((c) => c.verdict.startsWith('CLEAR') || c.verdict === 'SERVICE_LIVE_NO_JUL_AUG_AR');
  const open = CLINICS.filter((c) => c.due > 0);

  const cover = wb.addWorksheet('00_Cover');
  cover.getColumn(1).width = 32;
  cover.getColumn(2).width = 78;
  const coverRows: [string, string][] = [
    ['Report', 'Unjani Connect — active clinic close-out vs services'],
    ['As at', '13 August 2026 17:25 SAST · after CN-2026-00003 and reduced 18 Aug debit'],
    ['Population', '21 active corporate_sites with active customer_services SKU UNJ-MC-001'],
    ['Excluded', 'Pending sites: Delmas, Khayelitsha, Mamelodi, Soweto Diepkloof, Umlazi'],
    ['Product', 'Unjani Managed Connectivity · R450 ex VAT / R517.50 incl per site per month'],
    ['Bill-to from 1 Sep 2026', 'Unjani Clinics NPC — do not collect remaining clinic DebiCheck/PayNow'],
    ['', ''],
    ['Active clinics', String(CLINICS.length)],
    ['Clear / no Jul-Aug AR', String(clear.length)],
    ['Clinics with open AR', String(open.length)],
    ['Jul–Aug issued (live invoices)', `R ${issued.toFixed(2)}`],
    ['Paid on books', `R ${paid.toFixed(2)}`],
    ['Open AR to NPC', `R ${due.toFixed(2)}`],
    ['Netcash posted to these clinics (Jul–Aug window cash)', `R ${netcash.toFixed(2)}`],
    ['September NPC pack', '21 × R517.50 incl = R10,867.50 (before transferred AR)'],
    ['NPC pack + transferred AR', `R ${(10867.5 + due).toFixed(2)}`],
    ['NPC registered name', 'Unjani Clinics NPC · trading Unjani Clinics · 2013/105073/08'],
    [
      'Clinic names that differ from site',
      'Cosmo = Mbali Zwakele Gumbi T/A Unjani Clinic - Cosmo City · Fleurhof = Bhekilanga Health Care',
    ],
  ];
  coverRows.forEach(([k, v], i) => {
    cover.getCell(i + 1, 1).value = k;
    cover.getCell(i + 1, 2).value = v;
    cover.getCell(i + 1, 1).font = { bold: true };
  });

  addSheet(
    '01_Active_clinics',
    [
      'Clinic',
      'Account',
      'Registered business name',
      'Registration / CIPC',
      'Name flag',
      'Installed',
      'Service activation',
      'SKU',
      'Service',
      'Monthly ex VAT',
      'Monthly incl VAT',
      'Contract months',
      'Billing start',
      'Last invoice date',
      'July',
      'August',
      'Issued',
      'Paid on books',
      'Due',
      'Netcash',
      'Verdict',
      'NPC September',
      'Close-out action',
    ],
    CLINICS.map((c) => [
      c.clinic,
      c.account,
      REGISTERED[c.account]?.businessName ?? '',
      REGISTERED[c.account]?.registration || 'blank',
      REGISTERED[c.account]?.nameFlag ?? '',
      c.installed,
      c.activation,
      c.sku,
      c.service,
      c.monthlyEx,
      ZAR(c.monthlyEx * 1.15),
      c.contractMonths,
      c.billingStart,
      c.lastInvoice,
      c.jul,
      c.aug,
      c.issued,
      c.booksPaid,
      c.due,
      c.netcash,
      c.verdict,
      c.npcSep,
      c.action,
    ])
  );

  addSheet(
    '02_Open_AR',
    ['Clinic', 'Account', 'Due', 'Open invoices', 'Action'],
    open.map((c) => [c.clinic, c.account, c.due, `${c.jul} | ${c.aug}`, c.action])
  );

  addSheet(
    '03_Clear_or_no_AR',
    ['Clinic', 'Account', 'Verdict', 'Netcash', 'NPC September'],
    clear.map((c) => [c.clinic, c.account, c.verdict, c.netcash, c.npcSep])
  );

  addSheet(
    '04_NPC_Sep_pack',
    ['Clinic', 'Account', 'Service', 'Sep line incl VAT', 'Plus transferred AR', 'Opening amount'],
    CLINICS.map((c) => [
      c.clinic,
      c.account,
      'UNJ-MC-001 active',
      517.5,
      c.due,
      ZAR(517.5 + c.due),
    ])
  );

  addSheet(
    '05_Notes',
    ['Topic', 'Detail'],
    [
      ['Active service gate', 'Every row is corporate_sites.status=active AND customer_services.status=active SKU UNJ-MC-001 10/10.'],
      ['Alexandra / Chloorkop', 'billing_start_date already 2026-09-01. Jul invoices voided. No Aug invoice. Live service — bill NPC from 1 Sep.'],
      ['Cosmo / Fleurhof', 'Active services with no August invoice. July collected. Bill NPC from 1 Sep; do not raise a late clinic August debit.'],
      ['Sweetwaters', 'July debit INV-41 never authorised. August collected. contract_months=0 should be 24.'],
      ['Nokaneng 18 Aug', 'Batch 2523842 authorised 1 item R517.50 INV-42 July. INV-49 credited CN-2026-00003. August INV-61 stays paid (TDD 5 Aug). Ozow P2CE1A7B did not settle. Durban INV-74+75 still unpaid PayNow R1,035 with no mandate.'],
      ['Cosmo surplus', 'INV-43 EFT R793.50 vs invoice R517.50. Still held. Not credited to Nokaneng. Optional NPC opening credit — do not cash-refund.'],
      ['Registered names', 'customers.business_name is the invoice bill-to. Cosmo = Mbali Zwakele Gumbi T/A Unjani Clinic - Cosmo City (2016/37347/07). Fleurhof = Bhekilanga Health Care (2024/349220/07). All other active clinics store the site name as business_name.'],
      ['Shared CIPC', 'Barcelona and Durban both store 2017/468955/07. Barcelona value has a leading space.'],
      ['Sweetwaters registration', 'business_registration is SA ID 7403100396083, not a company number.'],
      ['Pending sites', 'Delmas (pending service, business_name Unjani Clinic Delmas 2022/868822/07), Khayelitsha, Mamelodi, Soweto Diepkloof, Umlazi — off this pack until RFS.'],
    ]
  );

  addSheet(
    '06_Registered_names',
    [
      'Clinic',
      'Account',
      'Site name',
      'customers.business_name',
      'customers.business_registration',
      'Flag',
    ],
    [
      ...CLINICS.map((c) => {
        const r = REGISTERED[c.account];
        return [
          c.clinic,
          c.account,
          `Unjani Clinic - ${c.clinic}`,
          r?.businessName ?? '',
          r?.registration || 'blank',
          r?.nameFlag ?? '',
        ];
      }),
      [
        'Delmas (pending)',
        'CT-2026-00033',
        'Unjani Clinic - Delmas',
        'Unjani Clinic Delmas',
        '2022/868822/07',
        'Pending · site has hyphen, account name does not',
      ],
      [
        'Unjani Clinics NPC',
        'corporate UNJ',
        'n/a',
        'Unjani Clinics NPC (company_name) / Unjani Clinics (trading_name)',
        '2013/105073/08',
        'Bill-to from 1 Sep 2026',
      ],
    ]
  );

  await wb.xlsx.writeFile(OUT);
  console.log(
    JSON.stringify(
      {
        out: OUT,
        clinics: CLINICS.length,
        clear: clear.length,
        open: open.length,
        issued,
        paid,
        due,
        netcash,
        npcSep: 10867.5,
        npcSepPlusAr: ZAR(10867.5 + due),
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

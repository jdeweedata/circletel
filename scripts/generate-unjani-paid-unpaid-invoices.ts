/**
 * Unjani Connect — all paid and unpaid invoices (live 13 Aug 2026).
 * 18 Aug debit is Nokaneng INV-42 only (R517.50). INV-49 credited CN-2026-00003.
 *
 *   npx tsx scripts/generate-unjani-paid-unpaid-invoices.ts
 */
import { mkdirSync } from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

const OUT = path.join(
  process.cwd(),
  'docs/clients/unjani-clinics/billing/closeouts/UNJANI_CONNECT_PAID_UNPAID_INVOICES_2026-08-13.xlsx'
);

type Inv = [
  string, // clinic
  string, // account
  string, // invoice
  string, // invoice date
  string, // period
  string, // method
  number, // total
  number, // paid
  number, // due
  string, // paid on / note
];

const UNPAID: Inv[] = [
  ['Durban', 'CT-2026-00039', 'INV-2026-00074', '2026-07-01', 'Jul', 'paynow', 517.5, 0, 517.5, 'No DebiCheck on this account'],
  ['Durban', 'CT-2026-00039', 'INV-2026-00075', '2026-08-01', 'Aug', 'paynow', 517.5, 0, 517.5, 'No DebiCheck on this account'],
  ['Jabulani', 'CT-2026-00019', 'INV-2026-00030', '2026-07-01', 'Jul', 'paynow', 450, 0, 450, ''],
  ['Jabulani', 'CT-2026-00019', 'INV-2026-00050', '2026-07-30', 'Jun back-bill', 'paynow', 517.5, 0, 517.5, ''],
  ['Jabulani', 'CT-2026-00019', 'INV-2026-00063', '2026-08-01', 'Aug', 'paynow', 517.5, 0, 517.5, ''],
  ['Lens ext 10', 'CT-2026-00020', 'INV-2026-00051', '2026-07-30', 'Jun back-bill', 'paynow', 517.5, 0, 517.5, 'Jul+Aug recurring already paid'],
  ['New Hanover', 'CT-2026-00026', 'INV-2026-00032', '2026-07-01', 'Jul', 'paynow', 450, 0, 450, ''],
  ['New Hanover', 'CT-2026-00026', 'INV-2026-00047', '2026-07-30', 'Jun back-bill', 'paynow', 517.5, 0, 517.5, ''],
  ['New Hanover', 'CT-2026-00026', 'INV-2026-00059', '2026-08-01', 'Aug', 'paynow', 517.5, 0, 517.5, ''],
  ['Nokaneng', 'CT-2026-00021', 'INV-2026-00042', '2026-07-30', 'Jul', 'debit_order', 517.5, 0, 517.5, '18 Aug batch 2523842 · 1 item authorised'],
  ['Sky City', 'CT-2026-00013', 'INV-2026-00045', '2026-07-30', 'Jun back-bill', 'paynow', 517.5, 0, 517.5, ''],
  ['Sky City', 'CT-2026-00013', 'INV-2026-00055', '2026-08-01', 'Aug', 'paynow', 517.5, 0, 517.5, ''],
  ['Soshanguve (Block P)', 'CT-2026-00028', 'INV-2026-00037', '2026-07-10', 'Jun pro-rata', 'paynow', 276, 0, 276, 'Aug INV-64 paid'],
  ['Soshanguve (Block P)', 'CT-2026-00028', 'INV-2026-00038', '2026-07-10', 'Jul', 'paynow', 517.5, 0, 517.5, 'Aug INV-64 paid'],
  ['Sweetwaters', 'CT-2026-00024', 'INV-2026-00041', '2026-07-30', 'Jul', 'debit_order', 517.5, 0, 517.5, '10 Aug debit never authorised'],
  ['Tokoza', 'CT-2026-00014', 'INV-2026-00046', '2026-07-30', 'Jun back-bill', 'paynow', 517.5, 0, 517.5, ''],
  ['Tokoza', 'CT-2026-00014', 'INV-2026-00054', '2026-08-01', 'Aug', 'paynow', 517.5, 0, 517.5, ''],
  ['Umsinga', 'CT-2026-00027', 'INV-2026-00033', '2026-07-01', 'Jul', 'paynow', 450, 0, 450, ''],
  ['Umsinga', 'CT-2026-00027', 'INV-2026-00048', '2026-07-30', 'Jun back-bill', 'paynow', 517.5, 0, 517.5, ''],
  ['Umsinga', 'CT-2026-00027', 'INV-2026-00060', '2026-08-01', 'Aug', 'paynow', 517.5, 0, 517.5, ''],
];

const PAID: Inv[] = [
  ['Barcelona', 'CT-2026-00017', 'INV-2026-00015', '2026-06-19', 'Jun pro-rata', 'paynow', 276, 276, 0, '2026-06-26'],
  ['Barcelona', 'CT-2026-00017', 'INV-2026-00025', '2026-07-01', 'Jul', 'debit_order', 450, 450, 0, '2026-07-15 TDD'],
  ['Barcelona', 'CT-2026-00017', 'INV-2026-00065', '2026-08-01', 'Aug', 'debit_order', 517.5, 517.5, 0, '2026-08-05 TDD'],
  ['Cosmo City', 'CT-2026-00011', 'INV-2026-00017', '2026-06-19', 'Jun pro-rata', 'debit_order', 276, 276, 0, '2026-07-15 TDD'],
  ['Cosmo City', 'CT-2026-00011', 'INV-2026-00043', '2026-07-30', 'Jul', 'debit_order', 517.5, 793.5, 0, '2026-08-12 EFT · surplus R276'],
  ['Fleurhof', 'CT-2026-00012', 'INV-2026-00018', '2026-06-19', 'Jun pro-rata', 'debit_order', 276, 276, 0, '2026-07-01 TDD'],
  ['Fleurhof', 'CT-2026-00012', 'INV-2026-00044', '2026-07-30', 'Jul', 'debit_order', 517.5, 517.5, 0, '2026-08-05 card'],
  ['Heidelberg', 'CT-2026-00016', 'INV-2026-00014', '2026-06-19', 'Jun pro-rata', 'paynow', 276, 276, 0, '2026-06-26'],
  ['Heidelberg', 'CT-2026-00016', 'INV-2026-00026', '2026-07-01', 'Jul', 'debit_order', 450, 450, 0, '2026-07-15 TDD'],
  ['Heidelberg', 'CT-2026-00016', 'INV-2026-00066', '2026-08-01', 'Aug', 'debit_order', 517.5, 517.5, 0, '2026-08-05 TDD'],
  ['Kayamandi', 'CT-2026-00022', 'INV-2026-00016', '2026-06-19', 'Jun pro-rata', 'debit_order', 276, 276, 0, '2026-07-01 TDD'],
  ['Kayamandi', 'CT-2026-00022', 'INV-2026-00027', '2026-07-01', 'Jul', 'debit_order', 450, 450, 0, '2026-07-15 TDD+CN'],
  ['Kayamandi', 'CT-2026-00022', 'INV-2026-00067', '2026-08-01', 'Aug', 'debit_order', 517.5, 517.5, 0, '2026-08-05 TDD'],
  ['Lens ext 10', 'CT-2026-00020', 'INV-2026-00034', '2026-07-01', 'Jul', 'paynow', 450, 450, 0, '2026-07-07'],
  ['Lens ext 10', 'CT-2026-00020', 'INV-2026-00068', '2026-08-01', 'Aug', 'paynow', 517.5, 517.5, 0, '2026-08-04 card'],
  ['Nokaneng', 'CT-2026-00021', 'INV-2026-00049', '2026-07-30', 'Jun back-bill', 'debit_order', 517.5, 517.5, 0, 'CN-2026-00003 applied 13 Aug · CircleTel billing error · no cash'],
  ['Nokaneng', 'CT-2026-00021', 'INV-2026-00061', '2026-08-01', 'Aug', 'debit_order', 517.5, 517.5, 0, '2026-08-05 TDD · August remains payable'],
  ['Sky City', 'CT-2026-00013', 'INV-2026-00023', '2026-07-01', 'Jul', 'paynow', 450, 450, 0, '2026-07-02'],
  ['Soshanguve (Block P)', 'CT-2026-00028', 'INV-2026-00064', '2026-08-01', 'Aug', 'debit_order', 517.5, 517.5, 0, '2026-08-05 TDD'],
  ['Sweetwaters', 'CT-2026-00024', 'INV-2026-00057', '2026-08-01', 'Aug', 'debit_order', 517.5, 517.5, 0, '2026-08-05 TDD'],
  ['Tokoza', 'CT-2026-00014', 'INV-2026-00024', '2026-07-01', 'Jul', 'paynow', 450, 450, 0, '2026-07-02'],
  ['Zamdela', 'CT-2026-00023', 'INV-2026-00039', '2026-07-10', 'Jun pro-rata', 'paynow', 276, 276, 0, '2026-07-17 Ozow'],
  ['Zamdela', 'CT-2026-00023', 'INV-2026-00040', '2026-07-10', 'Jul', 'paynow', 517.5, 517.5, 0, '2026-07-17 Ozow'],
  ['Zamdela', 'CT-2026-00023', 'INV-2026-00062', '2026-08-01', 'Aug', 'debit_order', 517.5, 517.5, 0, '2026-08-05 TDD'],
];

const VOIDED: [string, string, string, string, string, number, string][] = [
  ['Alexandra', 'CT-2026-00009', 'INV-2026-00021', '2026-07-01', 'Jul', 450, 'July extension · billing start 1 Sep'],
  ['Chloorkop', 'CT-2026-00010', 'INV-2026-00022', '2026-07-01', 'Jul', 450, 'July extension · billing start 1 Sep'],
  ['Oukasie', 'CT-2026-00018', 'INV-2026-00029', '2026-07-01', 'Jul', 450, 'July extension'],
  ['Oukasie', 'CT-2026-00018', 'INV-2026-00071', '2026-08-05', 'Aug', 517.5, 'Billing moved to 1 Sep NPC · voided 13 Aug'],
  ['Phoenix', 'CT-2026-00025', 'INV-2026-00031', '2026-07-01', 'Jul', 450, 'July extension'],
  ['Phoenix', 'CT-2026-00025', 'INV-2026-00073', '2026-08-05', 'Aug', 517.5, 'Billing moved to 1 Sep NPC · voided 13 Aug'],
  ['Sicelo', 'CT-2026-00015', 'INV-2026-00028', '2026-07-01', 'Jul', 450, 'July extension'],
  ['Sicelo', 'CT-2026-00015', 'INV-2026-00072', '2026-08-05', 'Aug', 517.5, 'Billing moved to 1 Sep NPC · voided 13 Aug'],
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
    for (let i = 1; i <= headers.length; i++) {
      ws.getCell(1, i).fill = headerFill;
      ws.getCell(1, i).font = headerFont;
    }
    for (const row of rows) ws.addRow(row);
    ws.columns = headers.map((h, i) => ({
      width: Math.min(
        42,
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

  const unpaidDue = UNPAID.reduce((s, r) => s + r[8], 0);
  const paidIssued = PAID.reduce((s, r) => s + r[6], 0);
  const paidCash = PAID.reduce((s, r) => s + r[7], 0);
  const voidedIssued = VOIDED.reduce((s, r) => s + r[5], 0);

  const cover = wb.addWorksheet('00_Cover');
  cover.getColumn(1).width = 36;
  cover.getColumn(2).width = 88;
  const coverRows: [string, string][] = [
    ['Report', 'Unjani Connect — all paid and unpaid invoices'],
    ['As at', '13 August 2026 18:22 SAST · live customer_invoices after CN-00003 and five-site Sep billing move'],
    ['Population', 'All Unjani clinic accounts (21 active sites)'],
    ['', ''],
    ['Unpaid invoices (status=sent)', `${UNPAID.length} · R ${unpaidDue.toFixed(2)}`],
    ['Paid invoices (status=paid)', `${PAID.length} · issued R ${paidIssued.toFixed(2)} · paid on books R ${paidCash.toFixed(2)}`],
    ['Voided (not collectable)', `${VOIDED.length} · R ${voidedIssued.toFixed(2)}`],
    ['Cosmo surplus inside paid cash', 'R 276.00 on INV-2026-00043 (still cash, not credited)'],
    ['Nokaneng credit', 'CN-2026-00003 R517.50 on INV-49 June back-bill. August INV-61 stays paid (TDD 5 Aug).'],
    ['Five sites to 1 Sep NPC', 'Alexandra, Chloorkop, Oukasie, Phoenix, Sicelo. Aug INV-71/72/73 voided. Do not collect at clinic level.'],
    ['', ''],
    ['18 Aug debit', 'Netcash batch 2523842 AUTHORISED · 1 item · R517.50 · INV-42 July only. Action 18 Aug. Leave authorised.'],
    ['Why it looked like Durban', 'Durban INV-74 + INV-75 also total R1,035, but those are PayNow. Durban has no DebiCheck mandate.'],
    ['Nokaneng mandate', 'DebiCheck FNB ****9687 · HLADI A MOLATSWANA HELPING HANDS(PTY)LTD · already collected INV-61 on 5 Aug.'],
    ['Durban invoices', 'INV-74 (Jul) + INV-75 (Aug) · paynow · still unpaid · carry to NPC.'],
    ['Ozow P2CE1A7B', 'Did not settle (no PNC). Do not apply. Do not credit INV-61.'],
  ];
  coverRows.forEach(([k, v], i) => {
    cover.getCell(i + 1, 1).value = k;
    cover.getCell(i + 1, 2).value = v;
    cover.getCell(i + 1, 1).font = { bold: true };
  });

  const invHeaders = [
    'Clinic',
    'Account',
    'Invoice',
    'Invoice date',
    'Period',
    'Collection method',
    'Total',
    'Paid on books',
    'Due',
    'Note',
  ];

  addSheet('01_Unpaid', invHeaders, UNPAID);
  addSheet('02_Paid', invHeaders, PAID);
  addSheet(
    '03_Voided',
    ['Clinic', 'Account', 'Invoice', 'Invoice date', 'Period', 'Total', 'Note'],
    VOIDED
  );
  addSheet(
    '04_18_Aug_vs_Durban',
    ['Bucket', 'Clinic', 'Account', 'Invoices', 'Method', 'Amount', 'Will collect 18 Aug?'],
    [
      [
        'A — authorised debit (reduced)',
        'Nokaneng',
        'CT-2026-00021',
        'INV-42 July only (INV-49 credited CN-00003)',
        'debit_order · FNB ****9687',
        517.5,
        'Yes — authorised 13 Aug 17:23 · leave it',
      ],
      [
        'B — unpaid PayNow (not in the debit batch)',
        'Durban',
        'CT-2026-00039',
        'INV-74 Jul + INV-75 Aug',
        'paynow · no mandate',
        1035,
        'No',
      ],
    ]
  );

  await wb.xlsx.writeFile(OUT);
  console.log(
    JSON.stringify(
      {
        out: OUT,
        unpaid: UNPAID.length,
        unpaidDue,
        paid: PAID.length,
        paidIssued,
        paidCash,
        voided: VOIDED.length,
        voidedIssued,
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

/**
 * Sample Unjani NPC itemized tax invoice PDF (September 2026).
 * Uses the same generateInvoicePDF as the live pack.
 *
 *   npx tsx scripts/generate-unjani-npc-invoice-example.ts
 */
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import {
  buildInvoiceData,
  generateInvoicePDFBuffer,
} from '@/lib/invoices/invoice-pdf-generator';
import { UNJANI_NPC_BILL_TO } from '@/lib/billing/unjani-connect-rules';

const SITES: Array<{ siteId: string; name: string }> = [
  { siteId: 'CT-UNJ-002', name: 'Alexandra' },
  { siteId: 'CT-UNJ-013', name: 'Barcelona' },
  { siteId: 'CT-UNJ-006', name: 'Chloorkop' },
  { siteId: 'CT-UNJ-007', name: 'Cosmo City' },
  { siteId: 'CT-UNJ-022', name: 'Durban' },
  { siteId: 'CT-UNJ-008', name: 'Fleurhof' },
  { siteId: 'CT-UNJ-012', name: 'Heidelberg' },
  { siteId: 'CT-UNJ-015', name: 'Jabulani' },
  { siteId: 'CT-UNJ-018', name: 'Kayamandi' },
  { siteId: 'CT-UNJ-016', name: 'Lens ext 10' },
  { siteId: 'CT-UNJ-023', name: 'New Hanover' },
  { siteId: 'CT-UNJ-017', name: 'Nokaneng' },
  { siteId: 'CT-UNJ-014', name: 'Oukasie' },
  { siteId: 'CT-UNJ-021', name: 'Phoenix' },
  { siteId: 'CT-UNJ-011', name: 'Sicelo' },
  { siteId: 'CT-UNJ-009', name: 'Sky City' },
  { siteId: 'CT-UNJ-025', name: 'Soshanguve (Block P)' },
  { siteId: 'CT-UNJ-020', name: 'Sweetwaters' },
  { siteId: 'CT-UNJ-010', name: 'Tokoza' },
  { siteId: 'CT-UNJ-024', name: 'Umsinga' },
  { siteId: 'CT-UNJ-019', name: 'Zamdela' },
];

const UNIT = 450;
const lineItems = SITES.map((site) => ({
  description: `Unjani Connect — ${site.name}`,
  site_name: site.name,
  site_code: site.siteId,
  sku: 'UNJ-MC-001',
  quantity: 1,
  unit_price: UNIT,
  amount: UNIT,
  type: 'recurring',
}));

const subtotal = UNIT * SITES.length;
const tax = Math.round(subtotal * 0.15 * 100) / 100;
const total = Math.round((subtotal + tax) * 100) / 100;

const invoiceData = buildInvoiceData({
  invoice: {
    id: 'example-npc-sep-2026',
    invoice_number: 'INV-2026-NPC-SEP',
    invoice_date: '2026-09-28',
    due_date: '2026-10-02',
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    subtotal,
    tax_amount: tax,
    total_amount: total,
    line_items: lineItems,
    notes:
      'Consolidated Unjani Connect invoice for Unjani Clinics NPC — 21 active clinic(s). Queries on line items should be raised before the due date. If there are no queries the invoice is payable by EFT. Please use payment reference UNJ.',
    status: 'unpaid',
  },
  customer: {
    first_name: 'Unjani',
    last_name: 'Clinics NPC',
    email: UNJANI_NPC_BILL_TO.billingEmail,
    account_number: UNJANI_NPC_BILL_TO.accountCode,
    business_name: UNJANI_NPC_BILL_TO.legalName,
    business_registration: UNJANI_NPC_BILL_TO.registrationNumber,
    tax_number: UNJANI_NPC_BILL_TO.vatNumber,
    address: { ...UNJANI_NPC_BILL_TO.address },
  },
});

invoiceData.amountPaid = 0;
invoiceData.amountDue = total;

const outDir = path.join(
  process.cwd(),
  'docs/clients/unjani-clinics/billing/examples'
);
mkdirSync(outDir, { recursive: true });
const out = path.join(
  outDir,
  'UNJANI_CONNECT_NPC_INVOICE_EXAMPLE_SEP_2026.pdf'
);
writeFileSync(out, Buffer.from(generateInvoicePDFBuffer(invoiceData)));
console.log(JSON.stringify({ out, lines: SITES.length, subtotal, tax, total }, null, 2));

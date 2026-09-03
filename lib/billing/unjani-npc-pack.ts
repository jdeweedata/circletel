/**
 * Assemble and share the Unjani NPC monthly pack:
 * itemized tax invoice PDF + statement of account PDF.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { generateCorporateConsolidatedInvoice } from './generate-corporate-consolidated-invoice';
import { assembleCorporateStatementData } from './corporate-statement-data';
import { generateStatementPDFBuffer } from './statement-pdf-generator';
import {
  buildInvoiceData,
  generateInvoicePDFBuffer,
} from '@/lib/invoices/invoice-pdf-generator';
import {
  UNJANI_CORPORATE_CODE,
  UNJANI_NPC_BILL_TO,
  UNJANI_NPC_BILLING_START,
  isLastMondayOfMonth,
  npcPackDates,
} from './unjani-connect-rules';

export interface UnjaniNpcPackResult {
  skipped: boolean;
  reason?: string;
  invoice_id?: string;
  invoice_number?: string;
  total_amount?: number;
  line_count?: number;
  emailed?: boolean;
}

/** Email body amount from the same invoice row as the PDF — never generate's missing total. */
export function npcPackEmailAmountFromInvoice(invoice: {
  amount_due?: string | number | null;
  total_amount?: string | number | null;
}): number {
  return Number(invoice.amount_due ?? invoice.total_amount ?? 0);
}

function bufferToBase64(buf: ArrayBuffer | Buffer): string {
  return Buffer.from(buf).toString('base64');
}

export function packDatesFor(now: Date = new Date()) {
  return npcPackDates(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

export async function findUnjaniNpcAccount(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('corporate_accounts')
    .select(
      'id, company_name, corporate_code, primary_contact_email, billing_contact_email, primary_contact_name'
    )
    .eq('corporate_code', UNJANI_CORPORATE_CODE)
    .maybeSingle();

  if (error) throw new Error(`Failed to load Unjani NPC account: ${error.message}`);
  return data;
}

export async function buildNpcInvoicePdf(
  supabase: SupabaseClient,
  invoiceId: string
): Promise<{ filename: string; bytes: ArrayBuffer; totalAmount: number }> {
  const { data: invoice, error } = await supabase
    .from('customer_invoices')
    .select(
      'id, invoice_number, invoice_date, due_date, period_start, period_end, subtotal, tax_amount, total_amount, amount_due, amount_paid, line_items, notes, status, customer_id'
    )
    .eq('id', invoiceId)
    .single();

  if (error || !invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  const invoiceData = buildInvoiceData({
    invoice: {
      ...invoice,
      vat_amount: invoice.tax_amount,
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
  const totalAmount = npcPackEmailAmountFromInvoice(invoice);
  invoiceData.amountPaid = Number(invoice.amount_paid ?? 0);
  invoiceData.amountDue = totalAmount;

  return {
    filename: `${invoice.invoice_number}.pdf`,
    bytes: generateInvoicePDFBuffer(invoiceData),
    totalAmount,
  };
}

export async function buildNpcStatementPdf(
  supabase: SupabaseClient,
  organisationId: string
): Promise<{ filename: string; bytes: ArrayBuffer }> {
  const { statement, organisationName } = await assembleCorporateStatementData(
    supabase,
    organisationId,
    { period: '12m' }
  );
  const safeName = organisationName.replace(/\s+/g, '-').toLowerCase();
  return {
    filename: `statement-${safeName}-${statement.statementDate}.pdf`,
    bytes: generateStatementPDFBuffer(statement),
  };
}

export function npcPackRecipients(): { to: string[]; cc: string[] } {
  return {
    to: [UNJANI_NPC_BILL_TO.packTo],
    cc: [...UNJANI_NPC_BILL_TO.packCc],
  };
}

async function emailNpcPack(params: {
  to: string[];
  cc: string[];
  invoiceNumber: string;
  dueDate: string;
  totalAmount: number;
  invoicePdf: { filename: string; bytes: ArrayBuffer };
  statementPdf: { filename: string; bytes: ArrayBuffer };
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Unjani NPC pack] RESEND_API_KEY not configured');
    return false;
  }

  const from =
    process.env.RESEND_FROM_EMAIL || 'billing@notify.circletel.co.za';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `CircleTel Billing <${from}>`,
      to: params.to,
      cc: params.cc,
      reply_to: 'billing@circletel.co.za',
      subject: `Unjani Connect — ${params.invoiceNumber} itemized invoice and statement`,
      text: [
        'Dear Unjani Clinics NPC,',
        '',
        `Please find attached this month's Unjani Connect itemized tax invoice (${params.invoiceNumber}) and statement of account.`,
        '',
        `Amount due: R${params.totalAmount.toFixed(2)} (incl VAT)`,
        `Due date: ${params.dueDate} (30 days from invoice date).`,
        '',
        'Queries on line items should be raised before the due date. If there are no queries the invoice is payable by EFT.',
        '',
        'Kind regards,',
        'CircleTel Billing',
      ].join('\n'),
      attachments: [
        {
          filename: params.invoicePdf.filename,
          content: bufferToBase64(params.invoicePdf.bytes),
        },
        {
          filename: params.statementPdf.filename,
          content: bufferToBase64(params.statementPdf.bytes),
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('[Unjani NPC pack] email failed', err);
    return false;
  }
  return true;
}

export async function issueUnjaniNpcMonthlyPack(
  supabase: SupabaseClient,
  options: { now?: Date; force?: boolean; dryRun?: boolean } = {}
): Promise<UnjaniNpcPackResult> {
  const now = options.now ?? new Date();
  const today = now.toISOString().slice(0, 10);

  if (!options.force && !isLastMondayOfMonth(today)) {
    return { skipped: true, reason: 'not_last_monday' };
  }

  // Last Monday of month M bills month M+1 in advance. NPC service months
  // start September 2026, so the last Monday of July (August service) is
  // still per-clinic and must not email NPC. Deliberately NOT bypassed by
  // `force`: force exists to re-run off-schedule, not to cross a commercial
  // cutover. To bill an earlier month, move UNJANI_NPC_BILLING_START.
  const dates = packDatesFor(now);
  if (dates.periodStart < UNJANI_NPC_BILLING_START) {
    return { skipped: true, reason: 'before_npc_billing_start' };
  }

  const account = await findUnjaniNpcAccount(supabase);
  if (!account) {
    return { skipped: true, reason: 'unjani_account_not_found' };
  }

  const generated = await generateCorporateConsolidatedInvoice(supabase, {
    organisationId: account.id,
    periodStart: dates.periodStart,
    periodEnd: dates.periodEnd,
    invoiceDate: dates.invoiceDate,
    dueDate: dates.dueDate,
    invoiceType: 'recurring',
  });

  if (generated.skipped && generated.reason === 'no_active_sites') {
    return { skipped: true, reason: 'no_active_sites' };
  }

  const invoiceId = generated.invoice_id;
  const invoiceNumber = generated.invoice_number;
  if (!invoiceId || !invoiceNumber) {
    return { skipped: true, reason: generated.reason ?? 'invoice_missing' };
  }

  if (options.dryRun) {
    return {
      skipped: false,
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      total_amount: generated.total_amount,
      line_count: generated.line_count,
      emailed: false,
    };
  }

  const [invoicePdf, statementPdf] = await Promise.all([
    buildNpcInvoicePdf(supabase, invoiceId),
    buildNpcStatementPdf(supabase, account.id),
  ]);

  const { to, cc } = npcPackRecipients();

  const emailed = await emailNpcPack({
    to,
    cc,
    invoiceNumber,
    dueDate: dates.dueDate,
    totalAmount: invoicePdf.totalAmount,
    invoicePdf,
    statementPdf,
  });

  return {
    skipped: false,
    invoice_id: invoiceId,
    invoice_number: invoiceNumber,
    total_amount: generated.total_amount,
    line_count: generated.line_count,
    emailed,
  };
}

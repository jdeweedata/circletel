/**
 * Generate a consolidated corporate invoice with one line per active clinic.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { buildActiveClinicLineItems } from './corporate-clinic-line-items';
import { allocateNextInvoiceNumber } from './allocate-invoice-number';

const VAT_RATE = 0.15;

export interface GenerateCorporateInvoiceOptions {
  organisationId: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;
  invoiceDate?: string;
  dueDate?: string;
  invoiceType?: string;
}

export async function generateCorporateConsolidatedInvoice(
  supabase: SupabaseClient,
  options: GenerateCorporateInvoiceOptions
) {
  const {
    organisationId,
    periodStart,
    periodEnd,
    invoiceType = 'recurring',
  } = options;

  const lineItems = await buildActiveClinicLineItems(supabase, organisationId, {
    periodEnd,
  });

  if (lineItems.length === 0) {
    return { skipped: true as const, reason: 'no_active_sites' };
  }

  const subtotal =
    Math.round(lineItems.reduce((sum, li) => sum + li.amount, 0) * 100) / 100;
  const vatAmount = Math.round(subtotal * VAT_RATE * 100) / 100;
  const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;

  const { data: account, error: accountError } = await supabase
    .from('corporate_accounts')
    .select(
      'id, company_name, primary_contact_name, primary_contact_email, primary_contact_phone'
    )
    .eq('id', organisationId)
    .single();

  if (accountError || !account) {
    throw new Error(`Corporate account ${organisationId} not found`);
  }

  const email =
    account.primary_contact_email ||
    `billing@${account.company_name.toLowerCase().replace(/\s+/g, '')}.co.za`;

  let customerId: string;
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('email', email)
    .limit(1);

  if (existing && existing.length > 0) {
    customerId = existing[0].id;
  } else {
    const nameParts = (
      account.primary_contact_name || account.company_name
    ).split(' ');
    const { data: created, error: createError } = await supabase
      .from('customers')
      .insert({
        first_name: nameParts[0] || account.company_name,
        last_name: nameParts.slice(1).join(' ') || 'B2B',
        email,
        phone: account.primary_contact_phone || '0000000000',
      })
      .select('id')
      .single();

    if (createError || !created) {
      throw new Error(
        `Failed to create customer: ${createError?.message ?? 'unknown'}`
      );
    }
    customerId = created.id;
  }

  // Idempotency: one recurring consolidated invoice per org per period
  const { data: dup } = await supabase
    .from('customer_invoices')
    .select('id, invoice_number')
    .eq('corporate_account_id', organisationId)
    .eq('invoice_type', invoiceType)
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .is('corporate_site_id', null)
    .limit(1);

  if (dup && dup.length > 0) {
    return {
      skipped: true as const,
      reason: 'duplicate',
      invoice_id: dup[0].id,
      invoice_number: dup[0].invoice_number,
    };
  }

  const invoiceDate = options.invoiceDate ?? periodStart;
  const dueDate =
    options.dueDate ??
    (() => {
      const d = new Date(periodEnd);
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    })();

  // customer_invoices has no DB sequence — app must supply INV-YYYY-NNNNN (max+1).
  const year = new Date(invoiceDate).getFullYear();
  const invoiceNumber = await allocateNextInvoiceNumber(supabase, year);

  const { data: invoice, error } = await supabase
    .from('customer_invoices')
    .insert({
      customer_id: customerId,
      corporate_account_id: organisationId,
      corporate_site_id: null,
      invoice_number: invoiceNumber,
      invoice_type: invoiceType,
      invoice_date: invoiceDate,
      due_date: dueDate,
      period_start: periodStart,
      period_end: periodEnd,
      subtotal,
      vat_rate: VAT_RATE,
      tax_amount: vatAmount,
      total_amount: totalAmount,
      amount_due: totalAmount,
      amount_paid: 0,
      line_items: lineItems,
      status: 'sent',
      notes: `Consolidated Unjani Connect invoice for ${account.company_name} — ${lineItems.length} active clinic(s)`,
    })
    .select('id, invoice_number, total_amount, line_items')
    .single();

  if (error) {
    throw new Error(`Failed to create consolidated invoice: ${error.message}`);
  }

  return {
    skipped: false as const,
    invoice_id: invoice.id,
    invoice_number: invoice.invoice_number,
    total_amount: invoice.total_amount,
    line_count: lineItems.length,
  };
}

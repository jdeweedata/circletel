/**
 * Invoice Preview Data Assembly
 * Shared library for building InvoicePreviewData from the database.
 * Used by admin and customer-dashboard preview API routes.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildInvoiceData,
  type InvoiceData,
} from './invoice-pdf-generator';

export interface InvoicePreviewData extends InvoiceData {
  amountPaid: number;
  amountDue: number;
}

export interface InvoicePreviewOptions {
  /**
   * When set, validates invoice.customer_id === customerId.
   * Throws 'FORBIDDEN' if mismatch — used by dashboard route.
   */
  customerId?: string;
}

export async function assembleInvoicePreviewData(
  supabase: SupabaseClient,
  invoiceId: string,
  options: InvoicePreviewOptions = {}
): Promise<{ invoice: InvoicePreviewData }> {
  // 1. Fetch invoice
  const { data: rawInvoice, error: invoiceError } = await supabase
    .from('customer_invoices')
    .select(
      'id, invoice_number, invoice_date, due_date, subtotal, tax_amount, total_amount, amount_paid, amount_due, status, period_start, period_end, line_items, notes, customer_id'
    )
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !rawInvoice) {
    console.error(
      '[invoice-preview-data] Invoice lookup failed:',
      invoiceError?.message ?? 'no data returned'
    );
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  // 2. Ownership check (dashboard context)
  if (options.customerId && rawInvoice.customer_id !== options.customerId) {
    throw new Error('FORBIDDEN');
  }

  // 3. Fetch customer
  const { data: rawCustomer, error: customerError } = await supabase
    .from('customers')
    .select('id, first_name, last_name, email, phone, account_number')
    .eq('id', rawInvoice.customer_id)
    .single();

  if (customerError || !rawCustomer) {
    console.error(
      '[invoice-preview-data] Customer lookup failed:',
      customerError?.message ?? 'no data returned'
    );
    throw new Error(`Customer for invoice ${invoiceId} not found`);
  }

  // 4. Build InvoiceData using existing helper (pass empty line_items — we recalculate below)
  const invoiceData = buildInvoiceData({
    invoice: {
      id: rawInvoice.id,
      invoice_number: rawInvoice.invoice_number,
      invoice_date: rawInvoice.invoice_date,
      due_date: rawInvoice.due_date,
      period_start: rawInvoice.period_start ?? undefined,
      period_end: rawInvoice.period_end ?? undefined,
      subtotal: parseFloat(String(rawInvoice.subtotal ?? 0)),
      tax_amount: parseFloat(String(rawInvoice.tax_amount ?? 0)),
      total_amount: parseFloat(String(rawInvoice.total_amount ?? 0)),
      line_items: [], // recalculated below with correct excl-VAT logic
      notes: rawInvoice.notes ?? undefined,
      status: rawInvoice.status ?? undefined,
    },
    customer: {
      first_name: rawCustomer.first_name ?? '',
      last_name: rawCustomer.last_name ?? '',
      email: rawCustomer.email ?? '',
      phone: rawCustomer.phone ?? undefined,
      account_number: rawCustomer.account_number ?? undefined,
    },
  });

  // 4b. Recalculate line items treating stored unit_price as EXCL VAT.
  //     buildInvoiceData assumes unit_price is VAT-inclusive and reverse-divides,
  //     but CircleTel invoices store excl-VAT prices — causing double-division.
  const VAT_RATE = 0.15;
  const rawItems = Array.isArray(rawInvoice.line_items) ? rawInvoice.line_items : [];
  invoiceData.lineItems = rawItems.map((item: Record<string, unknown>) => {
    const exclUnitPrice = parseFloat(String(item.unit_price ?? item.amount ?? 0));
    const quantity = Number(item.quantity ?? 1);
    const discountPercent = Number(item.discount_percent ?? 0);
    const exclTotal = Math.round(exclUnitPrice * quantity * (1 - discountPercent / 100) * 100) / 100;
    const inclTotal = Math.round(exclTotal * (1 + VAT_RATE) * 100) / 100;
    return {
      description: String(item.description ?? 'Service'),
      quantity,
      unit_price: exclUnitPrice,
      discount_percent: discountPercent,
      vat_percent: 15,
      excl_total: exclTotal,
      incl_total: inclTotal,
    };
  });

  // 5. Extend with payment fields
  const invoice: InvoicePreviewData = {
    ...invoiceData,
    amountPaid: parseFloat(String(rawInvoice.amount_paid ?? 0)),
    amountDue: parseFloat(String(rawInvoice.amount_due ?? 0)),
  };

  return { invoice };
}

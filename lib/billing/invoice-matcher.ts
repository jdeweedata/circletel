// lib/billing/invoice-matcher.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { parsePayNowReference } from './invoice-reference-parser';
import {
  displayName,
  extractAccountNumber,
  namesEqual,
} from './recon-hub/party-identity';

const PGRST_NO_ROWS = 'PGRST116';

const OPEN_INVOICE_STATUSES = ['sent', 'partial', 'overdue', 'unpaid'];

const billingLogger = {
  debug: (msg: string, data?: unknown) => console.debug(msg, data),
  info: (msg: string, data?: unknown) => console.info(msg, data),
  warn: (msg: string, data?: unknown) => console.warn(msg, data),
  error: (msg: string, data?: unknown) => console.error(msg, data),
};

export interface InvoiceMatchResult {
  matched: boolean;
  invoice?: {
    id: string;
    invoice_number: string;
    customer_id?: string;
    status: string;
    total_amount?: number;
    amount_paid?: number;
    amount_due?: number;
    [key: string]: unknown;
  };
  matchMethod?: 'invoice_number' | 'paynow_transaction_ref' | 'account_number';
  /** high = account + exact name, or invoice-number / paynow ref */
  matchConfidence?: 'high' | 'low';
  error?: string;
}

export interface InvoiceMatchOptions {
  payerName?: string;
}

function isDbError(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && error.code !== PGRST_NO_ROWS);
}

async function findOldestOpenInvoice(
  supabase: SupabaseClient,
  customerId: string
) {
  return supabase
    .from('customer_invoices')
    .select('*')
    .eq('customer_id', customerId)
    .in('status', OPEN_INVOICE_STATUSES)
    .order('due_date', { ascending: true })
    .limit(1)
    .single();
}

async function matchByAccountNumber(
  supabase: SupabaseClient,
  accountNumber: string,
  payerName?: string
): Promise<InvoiceMatchResult> {
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, first_name, last_name, business_name, account_number')
    .eq('account_number', accountNumber)
    .single();

  if (isDbError(customerError)) {
    billingLogger.error('[InvoiceMatcher] Database error on customer lookup by account_number', {
      error: customerError?.message,
      accountNumber,
    });
    return {
      matched: false,
      error: `Database error: ${customerError?.message}`,
    };
  }

  if (!customer) {
    return { matched: false };
  }

  if (payerName && !namesEqual(displayName(customer), payerName)) {
    billingLogger.warn('[InvoiceMatcher] Account matched but name mismatch', {
      accountNumber,
      expected: displayName(customer),
    });
    return {
      matched: false,
      error: 'name_mismatch',
      matchMethod: 'account_number',
    };
  }

  const { data: invoice, error: invoiceError } = await findOldestOpenInvoice(
    supabase,
    customer.id
  );

  if (isDbError(invoiceError)) {
    billingLogger.error('[InvoiceMatcher] Database error on open invoice lookup', {
      error: invoiceError?.message,
      customerId: customer.id,
    });
    return {
      matched: false,
      error: `Database error: ${invoiceError?.message}`,
    };
  }

  if (!invoice) {
    return { matched: false };
  }

  const matchConfidence: 'high' | 'low' = payerName ? 'high' : 'low';
  billingLogger.info('[InvoiceMatcher] Matched by account_number', {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoice_number,
    customerId: customer.id,
    accountNumber,
    matchConfidence,
  });

  return {
    matched: true,
    invoice,
    matchMethod: 'account_number',
    matchConfidence,
  };
}

/**
 * Match a payment reference to an invoice.
 *
 * Strategy chain:
 * 1. Account number (CT-YYYY-NNNNN) anywhere in the reference — primary key
 * 2. Invoice number parsed from the reference
 * 3. paynow_transaction_ref fallback
 *
 * When payerName is supplied, account matches require an exact normalized name.
 * Account-only matches (no payer name) return matchConfidence 'low' so EFT
 * can queue instead of auto-applying.
 */
export async function matchInvoiceByReference(
  reference: string,
  supabase: SupabaseClient,
  options: InvoiceMatchOptions = {}
): Promise<InvoiceMatchResult> {
  const parsed = parsePayNowReference(reference);
  const accountNumber =
    extractAccountNumber(reference) || parsed.accountNumber || null;

  billingLogger.debug('[InvoiceMatcher] Parsing reference', {
    reference,
    type: parsed.type,
    invoiceNumber: parsed.invoiceNumber,
    accountNumber,
  });

  if (accountNumber) {
    const accountResult = await matchByAccountNumber(
      supabase,
      accountNumber,
      options.payerName
    );
    if (accountResult.matched || accountResult.error) {
      return accountResult;
    }
  }

  {
    const { data: invoice, error } = await supabase
      .from('customer_invoices')
      .select('*')
      .eq('invoice_number', parsed.invoiceNumber ?? null)
      .single();

    if (isDbError(error)) {
      billingLogger.error('[InvoiceMatcher] Database error on invoice_number lookup', {
        error: error?.message,
        invoiceNumber: parsed.invoiceNumber,
      });
      return {
        matched: false,
        error: `Database error: ${error?.message}`,
      };
    }

    if (invoice) {
      billingLogger.info('[InvoiceMatcher] Matched by invoice_number', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
      });
      return {
        matched: true,
        invoice,
        matchMethod: 'invoice_number',
        matchConfidence: 'high',
      };
    }
  }

  const { data: invoiceByRef, error: refError } = await supabase
    .from('customer_invoices')
    .select('*')
    .eq('paynow_transaction_ref', reference)
    .single();

  if (isDbError(refError)) {
    billingLogger.error('[InvoiceMatcher] Database error on paynow_transaction_ref lookup', {
      error: refError?.message,
      reference,
    });
    return {
      matched: false,
      error: `Database error: ${refError?.message}`,
    };
  }

  if (invoiceByRef) {
    billingLogger.info('[InvoiceMatcher] Matched by paynow_transaction_ref', {
      invoiceId: invoiceByRef.id,
      invoiceNumber: invoiceByRef.invoice_number,
    });
    return {
      matched: true,
      invoice: invoiceByRef,
      matchMethod: 'paynow_transaction_ref',
      matchConfidence: 'high',
    };
  }

  billingLogger.warn('[InvoiceMatcher] No invoice match found', {
    reference,
    parsedType: parsed.type,
    parsedInvoiceNumber: parsed.invoiceNumber,
    accountNumber,
  });

  return { matched: false };
}

// lib/billing/invoice-matcher.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { parsePayNowReference } from './invoice-reference-parser';

// Postgres error code for "no rows returned"
const PGRST_NO_ROWS = 'PGRST116';

// Simple logger (no shared billingLogger exists in this codebase)
const billingLogger = {
  debug: (msg: string, data?: unknown) => console.debug(msg, data),
  info: (msg: string, data?: unknown) => console.info(msg, data),
  warn: (msg: string, data?: unknown) => console.warn(msg, data),
  error: (msg: string, data?: unknown) => console.error(msg, data),
};

/**
 * Result of invoice matching attempt
 */
export interface InvoiceMatchResult {
  /** Whether an invoice was found */
  matched: boolean;
  /** The matched invoice (if found) */
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
  /** How the invoice was matched */
  matchMethod?: 'invoice_number' | 'paynow_transaction_ref';
  /** Error message if matching failed */
  error?: string;
}

/**
 * Match a PayNow reference to an invoice using multiple strategies
 *
 * Strategy chain:
 * 1. Parse reference to extract invoice number (CT-INV... → INV-...)
 * 2. If invoice number found, query by invoice_number
 * 3. Fallback: query by paynow_transaction_ref
 *
 * @param reference - The PayNow reference string
 * @param supabase - Supabase client instance
 * @returns Match result with invoice data or error
 */
export async function matchInvoiceByReference(
  reference: string,
  supabase: SupabaseClient
): Promise<InvoiceMatchResult> {
  const parsed = parsePayNowReference(reference);

  billingLogger.debug('[InvoiceMatcher] Parsing reference', {
    reference,
    type: parsed.type,
    invoiceNumber: parsed.invoiceNumber,
  });

  // Strategy 1: Try by extracted invoice number (always attempt; returns no rows when null)
  {
    const { data: invoice, error } = await supabase
      .from('customer_invoices')
      .select('*')
      .eq('invoice_number', parsed.invoiceNumber ?? null)
      .single();

    if (error && error.code !== PGRST_NO_ROWS) {
      billingLogger.error('[InvoiceMatcher] Database error on invoice_number lookup', {
        error: error.message,
        invoiceNumber: parsed.invoiceNumber,
      });
      return {
        matched: false,
        error: `Database error: ${error.message}`,
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
      };
    }
  }

  // Strategy 2: Fallback to paynow_transaction_ref
  const { data: invoiceByRef, error: refError } = await supabase
    .from('customer_invoices')
    .select('*')
    .eq('paynow_transaction_ref', reference)
    .single();

  if (refError && refError.code !== PGRST_NO_ROWS) {
    billingLogger.error('[InvoiceMatcher] Database error on paynow_transaction_ref lookup', {
      error: refError.message,
      reference,
    });
    return {
      matched: false,
      error: `Database error: ${refError.message}`,
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
    };
  }

  // No match found
  billingLogger.warn('[InvoiceMatcher] No invoice match found', {
    reference,
    parsedType: parsed.type,
    parsedInvoiceNumber: parsed.invoiceNumber,
  });

  return {
    matched: false,
  };
}

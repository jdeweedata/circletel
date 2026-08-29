/**
 * Allocate the next INV-YYYY-NNNNN from existing numbers (max+1).
 * customer_invoices has no DB sequence — callers must supply the number.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { formatInvoiceNumber, nextInvoiceSequence } from './invoice-amounts';

export async function allocateNextInvoiceNumber(
  supabase: SupabaseClient,
  year: number
): Promise<string> {
  const { data: yearInvoices } = await supabase
    .from('customer_invoices')
    .select('invoice_number')
    .like('invoice_number', `INV-${year}-%`);

  return formatInvoiceNumber(
    year,
    nextInvoiceSequence(
      (yearInvoices || []).map((r) => r.invoice_number as string),
      year
    )
  );
}

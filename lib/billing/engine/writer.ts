/**
 * Internal ledger writer for the billing engine.
 * After full cutover, this is the only module that mutates customer_invoices status.
 */

import { createClient } from '@/lib/supabase/server';
import { billingLogger } from '@/lib/logging';
import { assertTransition, type InvoiceDbStatus } from './state-machine';
import type { EngineAuditContext } from './types';

export async function updateInvoiceStatus(params: {
  invoiceId: string;
  from: InvoiceDbStatus;
  to: InvoiceDbStatus;
  audit: EngineAuditContext;
  patch?: Record<string, unknown>;
}): Promise<void> {
  assertTransition(params.from, params.to);
  if (params.from === params.to && !params.patch) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from('customer_invoices')
    .update({
      status: params.to,
      ...params.patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.invoiceId)
    .eq('status', params.from); // optimistic concurrency on status

  if (error) {
    billingLogger.error('engine.writer.updateInvoiceStatus failed', {
      error: error.message,
      invoiceId: params.invoiceId,
      from: params.from,
      to: params.to,
      source: params.audit.source,
    });
    throw new Error(`Failed to update invoice status: ${error.message}`);
  }
}

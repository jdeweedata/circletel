/**
 * Internal ledger writer for the billing engine.
 * After full cutover, this is the only module that mutates customer_invoices status.
 */

import { createClient } from '@/lib/supabase/server';
import { billingLogger } from '@/lib/logging';
import { assertTransition, type InvoiceDbStatus } from './state-machine';
import type { EngineAuditContext } from './types';

/** Fields callers may never override via patch (machine-owned). */
const PROTECTED_PATCH_KEYS = new Set([
  'status',
  'id',
  'invoice_number',
  'customer_id',
]);

/**
 * Strip protected keys from a caller patch so assertTransition cannot be bypassed.
 */
export function sanitizeInvoicePatch(
  patch?: Record<string, unknown>
): Record<string, unknown> {
  if (!patch) return {};
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (PROTECTED_PATCH_KEYS.has(k)) continue;
    clean[k] = v;
  }
  return clean;
}

export async function updateInvoiceStatus(params: {
  invoiceId: string;
  from: InvoiceDbStatus;
  to: InvoiceDbStatus;
  audit: EngineAuditContext;
  patch?: Record<string, unknown>;
}): Promise<void> {
  assertTransition(params.from, params.to);
  if (params.from === params.to && !params.patch) return;

  const safePatch = sanitizeInvoicePatch(params.patch);
  const supabase = await createClient();
  // status MUST win over any residual patch keys; optimistic lock on `from`
  const { data, error } = await supabase
    .from('customer_invoices')
    .update({
      ...safePatch,
      status: params.to,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.invoiceId)
    .eq('status', params.from)
    .select('id');

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

  // PostgREST returns error:null for 0-row updates — detect lost races
  if (!data || data.length === 0) {
    billingLogger.error('engine.writer.updateInvoiceStatus concurrent conflict', {
      invoiceId: params.invoiceId,
      from: params.from,
      to: params.to,
      source: params.audit.source,
    });
    throw new Error(
      `Concurrent status change detected for invoice ${params.invoiceId} (expected status '${params.from}')`
    );
  }

  billingLogger.info('engine.writer.updateInvoiceStatus', {
    invoiceId: params.invoiceId,
    from: params.from,
    to: params.to,
    source: params.audit.source,
    user_id: params.audit.user_id,
    user_role: params.audit.user_role,
  });
}

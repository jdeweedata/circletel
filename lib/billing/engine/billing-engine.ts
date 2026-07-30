/**
 * Billing engine public façade (Phase 1a skeleton).
 * Delegate-first implementations land in Tasks 3–6; stubs throw until then.
 */

import { createClient } from '@/lib/supabase/server';
import type {
  MonthlyBillingOptions,
  MonthlyBillingResult,
} from '@/lib/billing/monthly-invoice-generator';
import type { InvoiceDbStatus } from './state-machine';
import type { EngineAuditContext } from './types';
import { updateInvoiceStatus } from './writer';

export const billingEngine = {
  async transitionStatus(
    invoiceId: string,
    to: InvoiceDbStatus,
    audit: EngineAuditContext,
    patch?: Record<string, unknown>
  ): Promise<void> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('customer_invoices')
      .select('id, status')
      .eq('id', invoiceId)
      .single();
    if (error || !data) throw new Error(`Invoice not found: ${invoiceId}`);
    await updateInvoiceStatus({
      invoiceId,
      from: data.status as InvoiceDbStatus,
      to,
      audit,
      patch,
    });
  },

  async generateRecurring(
    _options: MonthlyBillingOptions = {}
  ): Promise<MonthlyBillingResult> {
    throw new Error('billingEngine.generateRecurring not implemented — Task 3');
  },

  async generateInvoice(
    _params: unknown,
    _audit?: EngineAuditContext
  ): Promise<unknown> {
    throw new Error('billingEngine.generateInvoice not implemented — Task 3');
  },

  async issueInvoice(
    _invoiceId: string,
    _audit?: EngineAuditContext
  ): Promise<unknown> {
    throw new Error('billingEngine.issueInvoice not implemented — Task 4');
  },

  async createCreditNote(
    _params: unknown,
    _audit?: EngineAuditContext
  ): Promise<unknown> {
    throw new Error('billingEngine.createCreditNote not implemented — Task 4');
  },

  async submitDebitCollection(
    _params: unknown,
    _audit?: EngineAuditContext
  ): Promise<unknown> {
    throw new Error('billingEngine.submitDebitCollection not implemented — Task 5');
  },

  async applyPayment(
    _params: unknown,
    _audit?: EngineAuditContext
  ): Promise<unknown> {
    throw new Error('billingEngine.applyPayment not implemented — Task 6');
  },

  async recordCollectionFailure(
    _params: unknown,
    _audit?: EngineAuditContext
  ): Promise<unknown> {
    throw new Error(
      'billingEngine.recordCollectionFailure not implemented — Task 6'
    );
  },
};

/**
 * Billing engine public façade.
 * Phase 1b: generate / issue / credit wired (delegate-first).
 */

import { createClient } from '@/lib/supabase/server';
import type {
  MonthlyBillingOptions,
  MonthlyBillingResult,
} from '@/lib/billing/monthly-invoice-generator';
import type {
  CreateCreditNoteParams,
  GenerateInvoiceParams,
} from '@/lib/billing/compliant-billing-service';
import type { InvoiceDbStatus } from './state-machine';
import type { EngineAuditContext } from './types';
import { updateInvoiceStatus } from './writer';
import {
  generateInvoice as doGenerateInvoice,
  generateRecurring as doGenerateRecurring,
} from './generate';
import { issueInvoice as doIssueInvoice, voidInvoice as doVoidInvoice } from './issue';
import { createCreditNote as doCreateCreditNote } from './credit';

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
    options: MonthlyBillingOptions = {},
    audit?: EngineAuditContext
  ): Promise<MonthlyBillingResult> {
    return doGenerateRecurring(options, audit);
  },

  /** Convenience: bill one customer via sole generate path */
  async generateForCustomer(
    customerId: string,
    options: Omit<MonthlyBillingOptions, 'customerId'> = {},
    audit?: EngineAuditContext
  ): Promise<MonthlyBillingResult> {
    return doGenerateRecurring({ ...options, customerId }, audit);
  },

  async generateInvoice(
    params: GenerateInvoiceParams,
    audit?: EngineAuditContext
  ): Promise<unknown> {
    return doGenerateInvoice(params, audit);
  },

  async issueInvoice(
    invoiceId: string,
    audit: EngineAuditContext = { source: 'admin' }
  ): Promise<unknown> {
    return doIssueInvoice(invoiceId, audit);
  },

  async voidInvoice(
    invoiceId: string,
    reason: string,
    audit: EngineAuditContext = { source: 'admin' }
  ): Promise<unknown> {
    return doVoidInvoice(invoiceId, reason, audit);
  },

  async createCreditNote(
    params: CreateCreditNoteParams,
    audit: EngineAuditContext = { source: 'admin' }
  ): Promise<unknown> {
    return doCreateCreditNote(params, audit);
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

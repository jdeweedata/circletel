/**
 * Billing engine public façade.
 * Phase 1c: collection rails + applyPayment wired (delegate-first).
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
import type { DebitOrderItem } from '@/lib/payments/netcash-debit-batch-service';
import type { CreditCardDebitItem } from '@/lib/payments/netcash-cc-debit-batch-service';
import type { DebitFailureDetails } from '@/lib/billing/failed-debit-handler';
import type { InvoiceDbStatus } from './state-machine';
import type { EngineAuditContext } from './types';
import { updateInvoiceStatus } from './writer';
import {
  generateInvoice as doGenerateInvoice,
  generateRecurring as doGenerateRecurring,
} from './generate';
import { issueInvoice as doIssueInvoice, voidInvoice as doVoidInvoice } from './issue';
import { createCreditNote as doCreateCreditNote } from './credit';
import {
  recordCollectionFailure as doRecordCollectionFailure,
  sendPayLink as doSendPayLink,
  submitCCDebitCollection as doSubmitCCDebitCollection,
  submitDebitCollection as doSubmitDebitCollection,
} from './collect';
import {
  applyPayment as doApplyPayment,
  type ApplyPaymentParams,
} from './apply-payment';

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
    items: DebitOrderItem[],
    audit: EngineAuditContext = { source: 'cron' },
    batchName?: string
  ) {
    return doSubmitDebitCollection(items, audit, batchName);
  },

  async submitCCDebitCollection(
    items: CreditCardDebitItem[],
    audit: EngineAuditContext = { source: 'cron' },
    batchName?: string
  ) {
    return doSubmitCCDebitCollection(items, audit, batchName);
  },

  async sendPayLink(
    invoiceId: string,
    options: Record<string, unknown> = {},
    audit: EngineAuditContext = { source: 'system' }
  ) {
    return doSendPayLink(invoiceId, options, audit);
  },

  async applyPayment(
    params: ApplyPaymentParams,
    audit: EngineAuditContext = { source: 'webhook' }
  ) {
    return doApplyPayment(params, audit);
  },

  async recordCollectionFailure(
    details: DebitFailureDetails,
    audit: EngineAuditContext = { source: 'webhook' }
  ) {
    return doRecordCollectionFailure(details, audit);
  },
};

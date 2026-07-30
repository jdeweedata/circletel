/**
 * Recurring + ad-hoc invoice generation (delegate-first).
 */

import { billingLogger } from '@/lib/logging';
import type {
  MonthlyBillingOptions,
  MonthlyBillingResult,
} from '@/lib/billing/monthly-invoice-generator';
import type {
  AuditContext,
  GenerateInvoiceParams,
} from '@/lib/billing/compliant-billing-service';
import type { EngineAuditContext } from './types';

function toAudit(audit?: EngineAuditContext): AuditContext | undefined {
  if (!audit) return undefined;
  return {
    user_id: audit.user_id,
    user_email: audit.user_email,
    reason: audit.reason,
  };
}

export async function generateRecurring(
  options: MonthlyBillingOptions = {},
  audit?: EngineAuditContext
): Promise<MonthlyBillingResult> {
  billingLogger.info('billingEngine.generateRecurring', {
    source: audit?.source ?? 'system',
    dryRun: options.dryRun ?? false,
    billingDay: options.billingDay ?? 'today',
    customerId: options.customerId ?? 'all',
  });

  const { MonthlyInvoiceGenerator } = await import(
    '@/lib/billing/monthly-invoice-generator'
  );
  const generator = new MonthlyInvoiceGenerator();
  return generator.generateMonthlyInvoices(options);
}

export async function generateInvoice(
  params: GenerateInvoiceParams,
  audit?: EngineAuditContext
) {
  billingLogger.info('billingEngine.generateInvoice', {
    source: audit?.source ?? 'system',
    customer_id: params.customer_id,
    invoice_type: params.invoice_type,
  });

  const { CompliantBillingService } = await import(
    '@/lib/billing/compliant-billing-service'
  );
  return CompliantBillingService.generateInvoice(params, toAudit(audit));
}

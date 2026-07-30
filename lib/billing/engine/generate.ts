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
    user_role: audit.user_role,
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
  const result = await generator.generateMonthlyInvoices(options);

  // Restore BillingService behaviour: debit customer_billing.account_balance
  // for each successfully generated invoice (skip dry-run).
  if (!result.dryRun) {
    const { BillingService } = await import('@/lib/billing/billing-service');
    for (const r of result.results) {
      if (!r.success || r.skipped || !r.customerId || !r.amount || !r.invoiceNumber) {
        continue;
      }
      try {
        await BillingService.updateAccountBalance(
          r.customerId,
          r.amount,
          `Invoice ${r.invoiceNumber} generated`
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        billingLogger.error('billingEngine.generateRecurring balance update failed', {
          customerId: r.customerId,
          invoiceNumber: r.invoiceNumber,
          error: message,
        });
        // Do not fail the whole run — invoice already exists; balance can be repaired
      }
    }
  }

  return result;
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

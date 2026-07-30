/**
 * Issue (send) and void invoices — delegate-first to CompliantBillingService.
 * Service already enforces draft → sent and void rules.
 */

import { billingLogger } from '@/lib/logging';
import type { AuditContext } from '@/lib/billing/compliant-billing-service';
import type { EngineAuditContext } from './types';

function toAudit(audit?: EngineAuditContext): AuditContext | undefined {
  if (!audit) return undefined;
  return {
    user_id: audit.user_id,
    user_email: audit.user_email,
    reason: audit.reason,
  };
}

export async function issueInvoice(
  invoiceId: string,
  audit: EngineAuditContext = { source: 'admin' }
) {
  billingLogger.info('billingEngine.issueInvoice', {
    invoiceId,
    source: audit.source,
  });
  const { CompliantBillingService } = await import(
    '@/lib/billing/compliant-billing-service'
  );
  return CompliantBillingService.sendInvoice(invoiceId, toAudit(audit));
}

export async function voidInvoice(
  invoiceId: string,
  reason: string,
  audit: EngineAuditContext = { source: 'admin' }
) {
  billingLogger.info('billingEngine.voidInvoice', {
    invoiceId,
    source: audit.source,
  });
  const { CompliantBillingService } = await import(
    '@/lib/billing/compliant-billing-service'
  );
  return CompliantBillingService.voidInvoice(invoiceId, reason, {
    ...toAudit(audit),
    reason,
  });
}

/**
 * Credit notes — delegate-first to CompliantBillingService.
 */

import { billingLogger } from '@/lib/logging';
import type {
  AuditContext,
  CreateCreditNoteParams,
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

export async function createCreditNote(
  params: CreateCreditNoteParams,
  audit: EngineAuditContext = { source: 'admin' }
) {
  billingLogger.info('billingEngine.createCreditNote', {
    original_invoice_id: params.original_invoice_id,
    source: audit.source,
  });
  const { CompliantBillingService } = await import(
    '@/lib/billing/compliant-billing-service'
  );
  return CompliantBillingService.createCreditNote(params, toAudit(audit));
}

/**
 * Collection orchestration via CollectionRail adapters.
 */

import { billingLogger } from '@/lib/logging';
import type { DebitOrderItem } from '@/lib/payments/netcash-debit-batch-service';
import type { CreditCardDebitItem } from '@/lib/payments/netcash-cc-debit-batch-service';
import type { CollectionSubmitResult, PayLinkResult } from '@/lib/billing/rails/collection-rail';
import type { EngineAuditContext } from './types';
import type { DebitFailureDetails } from '@/lib/billing/failed-debit-handler';

export async function submitDebitCollection(
  items: DebitOrderItem[],
  audit: EngineAuditContext = { source: 'cron' },
  batchName?: string
): Promise<CollectionSubmitResult> {
  billingLogger.info('billingEngine.submitDebitCollection', {
    source: audit.source,
    itemCount: items.length,
    batchName,
  });

  const { createNetcashDebitRail } = await import(
    '@/lib/billing/rails/netcash-debit-rail'
  );
  const rail = createNetcashDebitRail();
  // DebitOrderItem is a structural subtype of DebitCollectionItem (+ index signature)
  return rail.submitDebitBatch!(
    items as unknown as import('@/lib/billing/rails/collection-rail').DebitCollectionItem[],
    batchName
  );
}

export async function submitCCDebitCollection(
  items: CreditCardDebitItem[],
  audit: EngineAuditContext = { source: 'cron' },
  batchName?: string
): Promise<CollectionSubmitResult> {
  billingLogger.info('billingEngine.submitCCDebitCollection', {
    source: audit.source,
    itemCount: items.length,
    batchName,
  });

  const { createNetcashCcDebitRail } = await import(
    '@/lib/billing/rails/netcash-cc-debit-rail'
  );
  const rail = createNetcashCcDebitRail();
  return rail.submitDebitBatch!(items as unknown as Parameters<NonNullable<typeof rail.submitDebitBatch>>[0], batchName);
}

export async function sendPayLink(
  invoiceId: string,
  options: Record<string, unknown> = {},
  audit: EngineAuditContext = { source: 'system' }
): Promise<PayLinkResult> {
  billingLogger.info('billingEngine.sendPayLink', {
    source: audit.source,
    invoiceId,
  });

  const { createNetcashPaynowRail } = await import(
    '@/lib/billing/rails/netcash-paynow-rail'
  );
  const rail = createNetcashPaynowRail();
  return rail.sendPayLink!(invoiceId, options);
}

export async function recordCollectionFailure(
  details: DebitFailureDetails,
  audit: EngineAuditContext = { source: 'webhook' }
) {
  billingLogger.info('billingEngine.recordCollectionFailure', {
    source: audit.source,
    invoiceId: details.invoiceId,
  });

  const { FailedDebitHandler } = await import(
    '@/lib/billing/failed-debit-handler'
  );
  return FailedDebitHandler.handleFailedDebit(details);
}

/**
 * NetCash credit-card debit CollectionRail adapter.
 */

import {
  netcashCCDebitBatchService,
  type CreditCardDebitItem,
} from '@/lib/payments/netcash-cc-debit-batch-service';
import type {
  CollectionRail,
  CollectionSubmitResult,
  DebitCollectionItem,
} from './collection-rail';

function toCCItems(items: DebitCollectionItem[]): CreditCardDebitItem[] {
  return items.map((item) => {
    if (
      typeof item.accountReference === 'string' &&
      typeof item.cardToken === 'string' &&
      typeof item.cardHolderName === 'string'
    ) {
      return item as unknown as CreditCardDebitItem;
    }
    throw new Error(
      'netcash_cc_debit rail requires CreditCardDebitItem fields (accountReference, cardToken, cardHolderName, …)'
    );
  });
}

export function createNetcashCcDebitRail(): CollectionRail {
  return {
    id: 'netcash_cc_debit',

    async submitDebitBatch(
      items: DebitCollectionItem[],
      batchName?: string
    ): Promise<CollectionSubmitResult> {
      if (!netcashCCDebitBatchService.isConfigured()) {
        return {
          success: false,
          errors: ['NetCash CC Debit Service not configured'],
        };
      }

      const ccItems = toCCItems(items);
      const batchResult = await netcashCCDebitBatchService.submitBatch(
        ccItems,
        batchName
      );

      return {
        success: batchResult.success,
        batchId: batchResult.batchId,
        fileToken: batchResult.batchId,
        itemsSubmitted: batchResult.itemsSubmitted,
        errors: batchResult.errors,
        warnings: batchResult.warnings,
        raw: batchResult,
      };
    },
  };
}

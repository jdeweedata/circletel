/**
 * NetCash bank-debit CollectionRail adapter.
 * Reuses NetCashDebitBatchService + LINE/DAILY limit constants (no re-hardcode).
 */

import {
  netcashDebitBatchService,
  partitionByLimits,
  type DebitOrderItem,
  LINE_LIMIT_RANDS,
  DAILY_LIMIT_RANDS,
} from '@/lib/payments/netcash-debit-batch-service';
import type {
  CollectionRail,
  CollectionSubmitResult,
  DebitCollectionItem,
} from './collection-rail';

export { LINE_LIMIT_RANDS, DAILY_LIMIT_RANDS };

function toDebitOrderItems(items: DebitCollectionItem[]): DebitOrderItem[] {
  return items.map((item) => {
    // Prefer full DebitOrderItem when already shaped correctly
    if (
      typeof item.accountReference === 'string' &&
      typeof item.accountName === 'string' &&
      typeof item.branchCode === 'string' &&
      typeof item.accountNumber === 'string'
    ) {
      return item as unknown as DebitOrderItem;
    }
    throw new Error(
      'netcash_debit rail requires DebitOrderItem fields (accountReference, accountName, branchCode, accountNumber, actionDate, accountType)'
    );
  });
}

export function createNetcashDebitRail(): CollectionRail {
  return {
    id: 'netcash_debit',

    async submitDebitBatch(
      items: DebitCollectionItem[],
      batchName?: string
    ): Promise<CollectionSubmitResult> {
      if (!netcashDebitBatchService.isConfigured()) {
        return {
          success: false,
          errors: ['NetCash Debit Order Service Key not configured'],
        };
      }

      const debitItems = toDebitOrderItems(items);
      const limits = partitionByLimits(debitItems);

      if (limits.dailyExceeded) {
        return {
          success: false,
          errors: [
            `Submittable batch total R${limits.totalRands.toFixed(2)} exceeds NetCash daily limit R${DAILY_LIMIT_RANDS.toFixed(2)}`,
          ],
          warnings: limits.warning ? [limits.warning] : undefined,
        };
      }

      if (limits.submittable.length === 0) {
        return {
          success: true,
          itemsSubmitted: 0,
          errors: [],
          warnings: [
            ...(limits.overLine.length
              ? [
                  `${limits.overLine.length} item(s) over line limit R${LINE_LIMIT_RANDS} skipped`,
                ]
              : []),
            'No submittable debit orders after applying collection limits',
          ],
        };
      }

      const batchResult = await netcashDebitBatchService.submitBatch(
        limits.submittable,
        batchName
      );

      return {
        success: batchResult.success,
        fileToken: batchResult.fileToken,
        batchId: batchResult.fileToken,
        itemsSubmitted: batchResult.itemsSubmitted,
        errors: batchResult.errors,
        warnings: [
          ...batchResult.warnings,
          ...(limits.warning ? [limits.warning] : []),
          ...(limits.overLine.length
            ? [
                `${limits.overLine.length} item(s) over line limit R${LINE_LIMIT_RANDS} not submitted`,
              ]
            : []),
        ],
        raw: batchResult,
      };
    },
  };
}

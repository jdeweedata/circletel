/**
 * CollectionRail — outbound collection mechanisms for the billing engine.
 * applyPayment (inbound ledger) is NOT on this interface.
 *
 * Wayfinder lock: netcash_debit | netcash_paynow | netcash_cc_debit
 */

export type CollectionRailId = 'netcash_debit' | 'netcash_paynow' | 'netcash_cc_debit';

/**
 * Generic collection line for bank debit.
 * Callers should pass full DebitOrderItem fields via the index signature /
 * by spreading the real DebitOrderItem into this shape.
 */
export interface DebitCollectionItem {
  invoiceId?: string;
  customerId: string;
  amount: number; // ZAR rands, 2dp
  reference?: string;
  [key: string]: unknown;
}

export interface CollectionSubmitResult {
  success: boolean;
  batchId?: string;
  fileToken?: string;
  itemsSubmitted?: number;
  errors: string[];
  warnings?: string[];
  raw?: unknown;
}

export interface PayLinkResult {
  success: boolean;
  paymentUrl?: string;
  error?: string;
  errors?: string[];
}

export interface CollectionRail {
  readonly id: CollectionRailId;
  submitDebitBatch?(
    items: DebitCollectionItem[],
    batchName?: string
  ): Promise<CollectionSubmitResult>;
  sendPayLink?(
    invoiceId: string,
    options?: Record<string, unknown>
  ): Promise<PayLinkResult>;
}

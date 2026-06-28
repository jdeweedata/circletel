/**
 * Authoritative, server-side payment amounts (in Rands).
 *
 * SECURITY: payment initiation must NEVER trust a client-supplied amount.
 * The order's `payment_amount` column is the source of truth, stamped at order
 * creation from the constants here. The initiate route derives the NetCash
 * charge from the order, not from the request body.
 *
 * LEGACY_VALIDATION_CHARGE_AMOUNT — the old R1.00 card-validation charge used
 * by the previous consumer order flow and still used by dedicated payment-method
 * validation screens. The NetCash webhook treats any payment <= R1.01 as legacy
 * validation: it stores the payment method for recurring debit and does NOT
 * activate the order (see lib/payment/netcash-webhook-processor.ts).
 *
 * ORDER_PROCESSING_FEE_AMOUNT — the once-off checkout fee stamped onto new
 * consumer orders. This follows the Vox-style "Order processing fee" pattern
 * instead of presenting the checkout charge as a refundable validation.
 */
export const LEGACY_VALIDATION_CHARGE_AMOUNT = 1.0;
export const ORDER_PROCESSING_FEE_AMOUNT = 149.0;
export const ORDER_PROCESSING_FEE_LABEL = 'Order processing fee';
export const ORDER_PROCESSING_FEE_DESCRIPTION = 'Once-off admin and transaction fee';

// Backwards-compatible alias for existing payment-method validation code.
export const VALIDATION_CHARGE_AMOUNT = LEGACY_VALIDATION_CHARGE_AMOUNT;

export function isLegacyValidationChargeAmount(amount: number): boolean {
  return amount <= LEGACY_VALIDATION_CHARGE_AMOUNT + 0.01;
}

export function isOrderProcessingFeeAmount(amount: number): boolean {
  return Math.abs(amount - ORDER_PROCESSING_FEE_AMOUNT) <= 0.01;
}

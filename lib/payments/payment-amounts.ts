/**
 * Authoritative, server-side payment amounts (in Rands).
 *
 * SECURITY: payment initiation must NEVER trust a client-supplied amount.
 * The order's `payment_amount` column is the source of truth, stamped at order
 * creation from the constants here. The initiate route derives the NetCash
 * charge from the order, not from the request body.
 *
 * VALIDATION_CHARGE_AMOUNT — the R1.00 card-validation charge used by the
 * current consumer order flow. The NetCash webhook treats any payment <= R1.01
 * as a validation: it stores the payment method for recurring debit and does
 * NOT activate the order (see lib/payment/netcash-webhook-processor.ts).
 *
 * Phase 5 (in-app payment parity) replaces this with the once-off processing
 * fee — at that point set the order's `payment_amount` to the fee instead.
 */
export const VALIDATION_CHARGE_AMOUNT = 1.0;

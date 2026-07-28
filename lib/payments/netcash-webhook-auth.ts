/**
 * Pure authorization-decision helpers for the NetCash Pay Now webhook.
 *
 * NetCash Pay Now does NOT sign its notify webhooks, so we cannot verify a
 * signature. Instead we fail safe: only mutate financial state when the webhook
 * resolves to an entity we created AND the amount is sane for that entity.
 * No DB or I/O here so this stays unit-testable in isolation.
 */

const CENT = 0.01;

/**
 * An amount is "sane" for a target entity when it is a positive value that does
 * not exceed what is owed (allowing a 1-cent rounding tolerance, and allowing
 * partials / R1 card-authorisations which are < owed).
 */
export function amountIsSane(receivedAmount: number, owedAmount: number | null | undefined): boolean {
  if (owedAmount == null || Number.isNaN(receivedAmount)) return false;
  if (receivedAmount <= 0) return false;
  return receivedAmount <= owedAmount + CENT;
}

export type WebhookAction = 'authorize' | 'manual_review';

export interface DecideInput {
  entityMatched: boolean;
  owedAmount: number | null;
  receivedAmount: number;
}

export function decideWebhookAction(input: DecideInput): { action: WebhookAction; reason: string } {
  if (!input.entityMatched) {
    return { action: 'manual_review', reason: 'reference did not resolve to a known invoice or order' };
  }
  if (!amountIsSane(input.receivedAmount, input.owedAmount)) {
    return {
      action: 'manual_review',
      reason: `amount failed sanity check: received ${input.receivedAmount}, owed ${input.owedAmount}`,
    };
  }
  return { action: 'authorize', reason: 'reference resolved and amount sane' };
}

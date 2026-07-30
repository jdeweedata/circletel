/**
 * Pure invoice status state machine for the billing engine.
 * Design "issued" maps to DB `sent`; collecting is operational (not a status).
 */

import type { InvoiceDbStatus } from './types';

export type { InvoiceDbStatus };

/**
 * from → allowed to[]
 *
 * Void is draft-only (matches CompliantBillingService.voidInvoice).
 * Issued / partial / overdue / paid → credit notes, not void.
 * Paid has no outbound transitions (refunds via credit_notes).
 */
export const TRANSITION_TABLE: Record<InvoiceDbStatus, readonly InvoiceDbStatus[]> = {
  draft: ['sent', 'cancelled', 'voided'],
  sent: ['paid', 'partial', 'overdue', 'cancelled'],
  partial: ['paid', 'partial', 'overdue', 'cancelled'],
  overdue: ['paid', 'partial', 'overdue', 'cancelled'],
  paid: [],
  cancelled: [],
  voided: [],
} as const;

export function canTransition(from: InvoiceDbStatus, to: InvoiceDbStatus): boolean {
  if (from === to) return true; // idempotent no-op allowed at call sites
  return (TRANSITION_TABLE[from] ?? []).includes(to);
}

export function assertTransition(from: InvoiceDbStatus, to: InvoiceDbStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal invoice transition: ${from} -> ${to}`);
  }
}

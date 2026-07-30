/**
 * Pure invoice status state machine for the billing engine.
 * Design "issued" maps to DB `sent`; collecting is operational (not a status).
 */

import type { InvoiceDbStatus } from './types';

export type { InvoiceDbStatus };

/** from → allowed to[] */
export const TRANSITION_TABLE: Record<InvoiceDbStatus, readonly InvoiceDbStatus[]> = {
  draft: ['sent', 'cancelled', 'voided'],
  sent: ['paid', 'partial', 'overdue', 'cancelled', 'voided'],
  partial: ['paid', 'partial', 'overdue', 'cancelled', 'voided'],
  overdue: ['paid', 'partial', 'overdue', 'cancelled', 'voided'],
  paid: ['voided'], // refunds/credits via credit_notes, not re-open
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

/**
 * Pure-domain month-cycle runner.
 * Uses engine state machine + nextStatusAfterPayment — no Supabase.
 */

import { assertTransition, type InvoiceDbStatus } from '../state-machine';
import { nextStatusAfterPayment } from '../apply-payment';
import type { ArSnapshot, MonthScenario, SimInvoice, SimInvoiceType } from './scenario';

function nowIso(): string {
  return new Date().toISOString();
}

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

export function resetSimIds(): void {
  seq = 0;
}

export function createScenario(name: string, period: string): MonthScenario {
  return { name, period, invoices: [] };
}

export function createInvoice(
  scenario: MonthScenario,
  opts: {
    serviceId: string;
    type: SimInvoiceType;
    totalAmount: number;
    status?: InvoiceDbStatus;
  }
): SimInvoice {
  const inv: SimInvoice = {
    id: nextId('inv'),
    serviceId: opts.serviceId,
    type: opts.type,
    status: opts.status ?? 'draft',
    totalAmount: opts.totalAmount,
    amountPaid: 0,
    creditsApplied: 0,
    events: [
      {
        kind: 'created',
        at: nowIso(),
        type: opts.type,
      },
    ],
  };
  scenario.invoices.push(inv);
  return inv;
}

/** draft → sent */
export function issueInvoice(inv: SimInvoice): void {
  const from = inv.status;
  const to: InvoiceDbStatus = 'sent';
  assertTransition(from, to);
  inv.status = to;
  inv.events.push({ kind: 'issued', at: nowIso() });
  inv.events.push({ kind: 'status', at: nowIso(), from, to });
}

/**
 * Apply a payment increment (not absolute total).
 * Mirrors billingEngine.applyPayment with amountIsAbsolute=false semantics.
 */
export function applyPaymentIncrement(inv: SimInvoice, amount: number, method = 'simulation'): void {
  if (amount <= 0) {
    throw new Error('Payment amount must be positive');
  }
  const from = inv.status;
  const amountPaidAfter = inv.amountPaid + amount;
  const to = nextStatusAfterPayment({
    current: from,
    totalAmount: inv.totalAmount,
    amountPaidAfter,
  });
  assertTransition(from, to);
  inv.amountPaid = amountPaidAfter;
  inv.status = to;
  inv.events.push({ kind: 'payment', at: nowIso(), amount, method });
  if (from !== to) {
    inv.events.push({ kind: 'status', at: nowIso(), from, to });
  }
}

/** Record collection failure + optional pay-link path (mocked rail). */
export function recordCollectionFailure(
  inv: SimInvoice,
  reason: string,
  opts: { invokePayLink?: boolean } = {}
): void {
  const invokePayLink = opts.invokePayLink ?? true;
  inv.events.push({
    kind: 'collection_failed',
    at: nowIso(),
    reason,
    payLinkInvoked: invokePayLink,
  });
  // Status stays sent/overdue — failure is operational, not a status flip
}

/**
 * Credit note against invoice. Reduces AR; does not reopen paid→sent.
 * Full credit on open invoice leaves status (caller may void separately).
 */
export function applyCredit(inv: SimInvoice, amount: number): string {
  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }
  const remaining = outstandingFor(inv);
  if (amount - remaining > 0.001) {
    throw new Error(
      `Credit ${amount} exceeds outstanding ${remaining} on invoice ${inv.id}`
    );
  }
  const noteId = nextId('cn');
  inv.creditsApplied += amount;
  inv.events.push({ kind: 'credit', at: nowIso(), amount, noteId });

  // If credits + payments cover total, treat as paid when was open
  const net = inv.totalAmount - inv.creditsApplied;
  if (inv.amountPaid + 0.001 >= net && inv.status !== 'voided' && inv.status !== 'cancelled') {
    if (inv.status !== 'paid' && inv.status !== 'draft') {
      const from = inv.status;
      const to: InvoiceDbStatus = 'paid';
      assertTransition(from, to);
      inv.status = to;
      inv.events.push({ kind: 'status', at: nowIso(), from, to });
    }
  }
  return noteId;
}

export function outstandingFor(inv: SimInvoice): number {
  return Math.max(0, inv.totalAmount - inv.creditsApplied - inv.amountPaid);
}

export function computeAr(scenario: MonthScenario): ArSnapshot {
  let invoiceTotals = 0;
  let credits = 0;
  let payments = 0;
  for (const inv of scenario.invoices) {
    invoiceTotals += inv.totalAmount;
    credits += inv.creditsApplied;
    payments += inv.amountPaid;
  }
  const outstanding = invoiceTotals - credits - payments;
  return {
    invoiceTotals: round2(invoiceTotals),
    credits: round2(credits),
    payments: round2(payments),
    outstanding: round2(outstanding),
  };
}

/** Sum of per-invoice outstanding must equal AR snapshot outstanding. */
export function assertArInvariant(scenario: MonthScenario): void {
  const ar = computeAr(scenario);
  const perInv = round2(scenario.invoices.reduce((s, inv) => s + outstandingFor(inv), 0));
  if (Math.abs(ar.outstanding - perInv) > 0.01) {
    throw new Error(
      `AR invariant broken: snapshot outstanding ${ar.outstanding} != sum(per-invoice) ${perInv}`
    );
  }
  if (ar.outstanding < -0.01) {
    throw new Error(`AR cannot be negative: ${ar.outstanding}`);
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

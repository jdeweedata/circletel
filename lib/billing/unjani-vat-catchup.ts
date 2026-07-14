/**
 * Deferred Unjani VAT undercharge catch-up for the *next* invoice run.
 *
 * Finance decision (2026-07): do not amend/void historical invoices now.
 * On the next monthly invoice for Unjani (exclusive) services, include
 * adjustment line(s) so statements show current period at MSA rates plus
 * any remaining shortfall from wrong full-month invoices that used the
 * consumer incl-VAT model (total R450 instead of R517.50).
 *
 * Wrong full-month pattern (detectable in DB):
 *   total_amount ≈ 450 AND subtotal ≈ 391.30
 * Correct full-month MSA:
 *   subtotal 450 + tax 67.50 = total 517.50
 */

import { roundMoney } from '@/lib/billing/invoice-vat-contract';

/** MSA full-month collectible when monthly_price is R450 excl VAT. */
export const UNJANI_FULL_MONTH_TARGET_INCL = 517.5;
export const UNJANI_FULL_MONTH_TARGET_EXCL = 450;
export const UNJANI_FULL_MONTH_TARGET_VAT = 67.5;

export interface PriorInvoiceForCatchup {
  id: string;
  invoice_number: string | null;
  status: string | null;
  subtotal: number | string | null;
  tax_amount: number | string | null;
  total_amount: number | string | null;
  amount_paid: number | string | null;
  period_start?: string | null;
  period_end?: string | null;
}

export interface CatchupLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  type: 'adjustment';
  /** Prior invoice id absorbed into this catch-up (for audit). */
  prior_invoice_id?: string;
  prior_invoice_number?: string | null;
}

export interface CatchupPlan {
  /** Excl-VAT sum of adjustment lines. */
  subtotalExcl: number;
  vatAmount: number;
  totalIncl: number;
  lineItems: CatchupLineItem[];
  /** Unpaid open wrong invoices: void after new invoice absorbs full period. */
  priorInvoiceIdsToVoid: string[];
  /** Wrong invoices with partial/full payment: zero remaining due (shortfall on new invoice). */
  priorInvoiceIdsToCloseDue: string[];
  notes: string[];
}

function num(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Detect full-month invoices that used the wrong incl-VAT decomposition of R450.
 */
export function isWrongUnjaniFullMonthInvoice(inv: PriorInvoiceForCatchup): boolean {
  const total = num(inv.total_amount);
  const sub = num(inv.subtotal);
  const status = (inv.status || '').toLowerCase();
  if (status === 'voided' || status === 'cancelled') return false;
  // Wrong model: total 450 with net ~391.30 (consumer-style back-out of 450)
  return Math.abs(total - 450) < 0.02 && sub >= 391 && sub <= 392;
}

/**
 * Shortfall still collectable for a wrong full-month invoice vs MSA R517.50.
 * Uses amount_paid so partials/open/paid are handled uniformly.
 */
export function shortfallInclVsMsa(inv: PriorInvoiceForCatchup): number {
  if (!isWrongUnjaniFullMonthInvoice(inv)) return 0;
  const paid = num(inv.amount_paid);
  return roundMoney(Math.max(0, UNJANI_FULL_MONTH_TARGET_INCL - paid));
}

/**
 * Build catch-up plan for a service's next invoice from prior wrong invoices.
 */
export function buildUnjaniVatCatchupPlan(
  priorInvoices: PriorInvoiceForCatchup[]
): CatchupPlan {
  const lineItems: CatchupLineItem[] = [];
  const priorInvoiceIdsToVoid: string[] = [];
  const priorInvoiceIdsToCloseDue: string[] = [];
  const notes: string[] = [];
  let totalIncl = 0;

  for (const inv of priorInvoices) {
    if (!isWrongUnjaniFullMonthInvoice(inv)) continue;
    const shortfallIncl = shortfallInclVsMsa(inv);
    if (shortfallIncl <= 0) continue;

    const shortfallExcl = roundMoney(shortfallIncl / 1.15);
    // Ensure excl + vat = shortfallIncl exactly
    const shortfallVat = roundMoney(shortfallIncl - shortfallExcl);

    const period =
      inv.period_start && inv.period_end
        ? ` (${inv.period_start} → ${inv.period_end})`
        : '';
    const invLabel = inv.invoice_number || inv.id.slice(0, 8);
    const paid = num(inv.amount_paid);

    lineItems.push({
      description: `Prior period billing correction ${invLabel}${period}: MSA R450 excl VAT (was under-billed; paid R${paid.toFixed(2)})`,
      quantity: 1,
      unit_price: shortfallExcl,
      amount: shortfallExcl,
      type: 'adjustment',
      prior_invoice_id: inv.id,
      prior_invoice_number: inv.invoice_number,
    });

    totalIncl = roundMoney(totalIncl + shortfallIncl);
    notes.push(
      `${invLabel}: shortfall R${shortfallIncl.toFixed(2)} incl (excl R${shortfallExcl.toFixed(2)} + VAT R${shortfallVat.toFixed(2)})`
    );

    // Prevent double collection of residual due on prior wrong invoices.
    if (paid < 0.01) {
      priorInvoiceIdsToVoid.push(inv.id);
    } else {
      // Paid/partial: keep payment history, clear remaining due (shortfall is on new invoice)
      priorInvoiceIdsToCloseDue.push(inv.id);
    }
  }

  const subtotalExcl = roundMoney(
    lineItems.reduce((s, l) => s + l.amount, 0)
  );
  const vatAmount = roundMoney(totalIncl - subtotalExcl);

  return {
    subtotalExcl,
    vatAmount,
    totalIncl,
    lineItems,
    priorInvoiceIdsToVoid,
    priorInvoiceIdsToCloseDue,
    notes,
  };
}

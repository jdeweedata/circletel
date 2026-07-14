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
 *
 * Idempotency: a prior is absorbed once if either
 *   (a) its notes contain UNJANI_MSA_CATCHUP_ABSORBED_MARKER, or
 *   (b) any sibling invoice line_items[].prior_invoice_id references it.
 */

import { roundMoney } from '@/lib/billing/invoice-vat-contract';

/** MSA full-month collectible when monthly_price is R450 excl VAT. */
export const UNJANI_FULL_MONTH_TARGET_INCL = 517.5;
export const UNJANI_FULL_MONTH_TARGET_EXCL = 450;
export const UNJANI_FULL_MONTH_TARGET_VAT = 67.5;

/**
 * Stable marker written into prior invoice notes after catch-up is applied.
 * Detected on later runs so paid/partial wrong invoices are not re-billed.
 */
export const UNJANI_MSA_CATCHUP_ABSORBED_MARKER = '[UNJANI_MSA_CATCHUP_ABSORBED]';

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
  /** Prior notes (checked for absorption marker). */
  notes?: string | null;
  /** Line items — used to discover already-absorbed prior_invoice_id refs. */
  line_items?: unknown;
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

/** True when notes record that MSA catch-up already absorbed this prior. */
export function isUnjaniCatchupAbsorbed(notes: string | null | undefined): boolean {
  if (!notes) return false;
  return notes.includes(UNJANI_MSA_CATCHUP_ABSORBED_MARKER);
}

/**
 * Note body written onto a prior invoice after its shortfall is folded into
 * a later invoice. Always includes the absorption marker for idempotency.
 */
export function formatUnjaniCatchupAbsorbedNote(
  newInvoiceNumber: string,
  mode: 'void' | 'close_due',
  existingNotes?: string | null
): string {
  const action =
    mode === 'void'
      ? `Superseded by ${newInvoiceNumber}: deferred Unjani MSA catch-up on next invoice run`
      : `Remaining balance moved to ${newInvoiceNumber} (Unjani MSA catch-up on next invoice run)`;
  const markerLine = `${UNJANI_MSA_CATCHUP_ABSORBED_MARKER} via ${newInvoiceNumber}`;
  const prior = (existingNotes || '').trim();
  // Drop any previous absorption stanza so we don't stack duplicates; keep other notes.
  const cleaned = prior
    .split('\n')
    .filter((line) => !line.includes(UNJANI_MSA_CATCHUP_ABSORBED_MARKER))
    .join('\n')
    .trim();
  return [cleaned, action, markerLine].filter(Boolean).join('\n');
}

/**
 * Collect prior invoice ids already referenced by adjustment lines on any
 * invoice in the set (sibling invoices that already applied catch-up).
 */
export function collectAbsorbedPriorInvoiceIds(
  invoices: Array<{ line_items?: unknown; notes?: string | null; id?: string }>
): Set<string> {
  const ids = new Set<string>();
  for (const inv of invoices) {
    // Priors themselves marked absorbed via notes
    if (inv.id && isUnjaniCatchupAbsorbed(inv.notes)) {
      ids.add(inv.id);
    }
    const lines = Array.isArray(inv.line_items) ? inv.line_items : [];
    for (const raw of lines) {
      if (!raw || typeof raw !== 'object') continue;
      const line = raw as { prior_invoice_id?: unknown; type?: unknown };
      const priorId = line.prior_invoice_id;
      if (priorId != null && String(priorId).length > 0) {
        ids.add(String(priorId));
      }
    }
  }
  return ids;
}

/**
 * Detect full-month invoices that used the wrong incl-VAT decomposition of R450.
 * Does not consider absorption — use shortfallInclVsMsa / buildUnjaniVatCatchupPlan
 * for collectable shortfall (those skip already-absorbed priors).
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
 * Returns 0 when already absorbed (notes marker).
 */
export function shortfallInclVsMsa(
  inv: PriorInvoiceForCatchup,
  alreadyAbsorbedIds?: Set<string>
): number {
  if (!isWrongUnjaniFullMonthInvoice(inv)) return 0;
  if (isUnjaniCatchupAbsorbed(inv.notes)) return 0;
  if (alreadyAbsorbedIds?.has(inv.id)) return 0;
  const paid = num(inv.amount_paid);
  return roundMoney(Math.max(0, UNJANI_FULL_MONTH_TARGET_INCL - paid));
}

/**
 * Build catch-up plan for a service's next invoice from prior wrong invoices.
 * Idempotent: skips priors already absorbed via notes marker or prior_invoice_id
 * references on any invoice in the same batch.
 */
export function buildUnjaniVatCatchupPlan(
  priorInvoices: PriorInvoiceForCatchup[]
): CatchupPlan {
  const lineItems: CatchupLineItem[] = [];
  const priorInvoiceIdsToVoid: string[] = [];
  const priorInvoiceIdsToCloseDue: string[] = [];
  const notes: string[] = [];
  let totalIncl = 0;

  const alreadyAbsorbed = collectAbsorbedPriorInvoiceIds(priorInvoices);

  for (const inv of priorInvoices) {
    if (!isWrongUnjaniFullMonthInvoice(inv)) continue;
    const shortfallIncl = shortfallInclVsMsa(inv, alreadyAbsorbed);
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

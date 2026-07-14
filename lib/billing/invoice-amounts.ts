/**
 * Pure helpers for recurring-invoice amounts and numbering.
 *
 * Consumer `customer_services.monthly_price` is VAT-INCLUSIVE (gross) —
 * e.g. SkyFibre R899 → invoice total 899 with VAT backed out.
 *
 * Unjani / clinic Managed Connectivity is the opposite: monthly_price is
 * VAT-EXCLUSIVE (MSA R450) — use `computeMonthlyInvoiceAmounts(..., 'exclusive')`
 * in `invoice-vat-contract.ts` (R450 → total R517.50).
 *
 * See also `lib/billing/invoice-vat-contract.ts` for product basis resolution
 * and Zoho Books/Billing mapping.
 *
 * Kept pure (no DB/IO) so the money math is unit-testable in isolation.
 */

const VAT_RATE = 0.15;

/** Round to 2 decimals, avoiding binary float drift. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface InvoiceAmounts {
  subtotal: number; // net (excl VAT)
  vatAmount: number; // VAT portion
  totalAmount: number; // gross (= the VAT-inclusive monthly_price for consumer basis)
}

/**
 * Decompose a VAT-inclusive (gross) price into net + VAT, where total === gross.
 * VAT is derived as (gross - net) so net + VAT always reconciles to the gross exactly.
 */
export function computeVatInclusiveAmounts(grossPrice: number): InvoiceAmounts {
  const totalAmount = round2(grossPrice);
  const subtotal = round2(totalAmount / (1 + VAT_RATE));
  const vatAmount = round2(totalAmount - subtotal);
  return { subtotal, vatAmount, totalAmount };
}

/** Format a customer-invoice number as INV-YYYY-NNNNN (5-digit, zero-padded). */
export function formatInvoiceNumber(year: number, sequence: number): string {
  return `INV-${year}-${String(sequence).padStart(5, '0')}`;
}

/**
 * Given existing invoice numbers, return the next sequence for `year`.
 * Considers only numbers matching INV-{year}-NNNNN; returns maxForYear + 1 (or 1 if none).
 */
export function nextInvoiceSequence(existingNumbers: string[], year: number): number {
  const prefix = `INV-${year}-`;
  let max = 0;
  for (const num of existingNumbers) {
    if (!num || !num.startsWith(prefix)) continue;
    const seq = parseInt(num.slice(prefix.length), 10);
    if (!Number.isNaN(seq) && seq > max) max = seq;
  }
  return max + 1;
}

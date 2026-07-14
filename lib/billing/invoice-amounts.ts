/**
 * Pure helpers for recurring-invoice amounts and numbering.
 *
 * CircleTel consumer **and Unjani clinic** `customer_services.monthly_price` is
 * VAT-INCLUSIVE (gross) — the all-in amount collected (e.g. R899 / R450).
 * Invoice total equals that price; VAT is backed OUT for subtotal/tax_amount.
 * Matches existing paid invoices (e.g. INV-2026-00008: 781.74 + 117.26 = 899;
 * Unjani: 391.30 + 58.70 = 450).
 *
 * See also `lib/billing/invoice-vat-contract.ts` for the full header/line contract
 * and Zoho Books/Billing mapping (`is_inclusive_tax` + gross rates).
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
  totalAmount: number; // gross (= the VAT-inclusive monthly_price)
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

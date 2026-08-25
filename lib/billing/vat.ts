/**
 * SA VAT helpers.
 *
 * For invoice headers and Zoho sync contracts see `invoice-vat-contract.ts`.
 * Recurring `monthly_price` is VAT-inclusive — use `computeVatInclusiveAmounts`
 * (`invoice-amounts.ts`) to back VAT out; use `addVat` only when the base is
 * known to be exclusive (e.g. some B2B wholesale/manual lines).
 */
export const VAT_RATE = 0.15;

/** Gross an ex-VAT ZAR amount up to VAT-inclusive, rounded to 2 decimals. */
export function addVat(excl: number): number {
  return Math.round(excl * (1 + VAT_RATE) * 100) / 100;
}

/** Net an incl-VAT ZAR amount down to exclusive, rounded to 2 decimals. */
export function removeVat(incl: number): number {
  return Math.round((incl / (1 + VAT_RATE)) * 100) / 100;
}

/** Helios / CircleConnect catalogue rows stamp this on service_packages.metadata. */
export function packagePriceIncludesVat(
  metadata?: Record<string, unknown> | null
): boolean {
  return metadata?.price_includes_vat === true;
}

/**
 * Customer-facing monthly price (incl. VAT).
 * Helios pass-through SKUs are already incl-VAT — do not add 15% again.
 * Other catalogue prices are ex-VAT and round to the nearest rand.
 */
export function customerInclVat(
  price: number,
  priceIncludesVat?: boolean | null
): number {
  if (priceIncludesVat) return Math.round(price);
  return Math.round(price * (1 + VAT_RATE));
}

/** Customer-facing monthly price (excl. VAT) for checkout breakdowns. */
export function customerExclVat(
  price: number,
  priceIncludesVat?: boolean | null
): number {
  if (priceIncludesVat) return removeVat(price);
  return price;
}

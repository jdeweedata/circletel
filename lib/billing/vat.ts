export const VAT_RATE = 0.15;

/** Gross an ex-VAT ZAR amount up to VAT-inclusive, rounded to 2 decimals. */
export function addVat(excl: number): number {
  return Math.round(excl * (1 + VAT_RATE) * 100) / 100;
}

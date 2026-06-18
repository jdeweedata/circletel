/**
 * New Clinic Billing Helper
 *
 * Task F: New clinics get their first FULL recurring bill ~1 month after activation.
 *
 * Cohort Rules:
 * - ORIGINAL: activation_date <= 2026-06-01 → billing per existing pro-rata logic (no change)
 * - NEW: activation_date > 2026-06-01 → first recurring invoice delayed ~1 month after activation
 *
 * The monthly generator emits a pro-rata FIRST invoice immediately after activation
 * (for the partial activation month). For new clinics, it should SUPPRESS full recurring
 * invoices until billing_day >= activation_date + 1 calendar month.
 */

/**
 * Check if a recurring invoice should be emitted on a given billing day.
 *
 * @param activationDate - ISO string (YYYY-MM-DD) of service activation
 * @param billingDay - Date object of the current billing cycle
 * @returns true if invoice should be emitted, false if it should be skipped
 *
 * Logic:
 * - If activation <= 2026-06-01: return true (original cohort, bill normally)
 * - If activation > 2026-06-01: return true only if billingDay >= activation + 1 month
 */
export function shouldEmitRecurringInvoice(activationDate: string | null, billingDay: Date): boolean {
  if (!activationDate) {
    // No activation date; treat as original cohort (allow billing)
    return true;
  }

  // Parse activation date
  const activation = new Date(activationDate + 'T00:00:00Z');

  // Cohort boundary: 2026-06-01
  const cohortBoundary = new Date('2026-06-01T00:00:00Z');

  // If activation is on or before cohort boundary, it's the original cohort
  if (activation <= cohortBoundary) {
    return true;
  }

  // New clinic: activation > 2026-06-01
  // Suppress until billingDay >= activation + 1 calendar month
  const firstFullBillDate = new Date(activation);
  firstFullBillDate.setMonth(firstFullBillDate.getMonth() + 1);

  return billingDay >= firstFullBillDate;
}

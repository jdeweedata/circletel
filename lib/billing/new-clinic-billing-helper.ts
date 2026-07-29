/**
 * New Clinic Billing Helper
 *
 * Task F: New clinics get their first FULL recurring bill ~1 month after activation.
 *
 * Scope: this delay is CLINIC/CORPORATE-ONLY. Consumer/residential services always
 * bill on their normal monthly cycle — see isClinicBillingCategory below. (Applying
 * the delay to consumers silently skipped a full month of billing for 5G/fixed-wireless
 * customers activated mid-month — the regression this scoping fixes.)
 *
 * Cohort Rules (clinic/corporate services only):
 * - ORIGINAL: activation_date <= 2026-06-01 → billing per existing pro-rata logic (no change)
 * - NEW: activation_date > 2026-06-01 → first recurring invoice delayed ~1 month after activation
 *
 * The monthly generator emits a pro-rata FIRST invoice immediately after activation
 * (for the partial activation month). For new clinics, it should SUPPRESS full recurring
 * invoices until billing_day >= activation_date + 1 calendar month.
 */

/**
 * Product categories that receive the new-clinic billing delay.
 * Unjani clinics use these; consumer/residential services do not.
 */
const CLINIC_BILLING_CATEGORIES = new Set(['corporate', 'business_connectivity']);

/**
 * True when a service's product_category is a clinic/corporate category subject to
 * the new-clinic billing delay. Consumer categories (residential, null, etc.) → false.
 *
 * @param productCategory - customer_services.product_category value
 */
export function isClinicBillingCategory(productCategory: string | null | undefined): boolean {
  return productCategory != null && CLINIC_BILLING_CATEGORIES.has(productCategory);
}

/**
 * Add one calendar month to a UTC date, clamping to the last day of the target month
 * if the target month is shorter than the source month.
 *
 * @param d - Date to increment (treated as UTC)
 * @returns New Date with one calendar month added, clamped to last day if needed
 *
 * Example:
 * - 2026-08-31 + 1 month = 2026-09-30 (Sept has 30 days, clamp from 31)
 * - 2026-07-31 + 1 month = 2026-08-31 (Aug has 31 days, no clamp)
 */
function addOneMonthUTC(d: Date): Date {
  const r = new Date(d);
  const day = r.getUTCDate();
  r.setUTCMonth(r.getUTCMonth() + 1);
  // If the day rolled over (target month is shorter), clamp to last day of target month
  if (r.getUTCDate() < day) {
    r.setUTCDate(0);
  }
  return r;
}

/**
 * Check if a recurring invoice should be emitted on a given billing day.
 *
 * @param activationDate - ISO string (YYYY-MM-DD) of service activation
 * @param billingDay - Date object of the current billing cycle
 * @param productCategory - customer_services.product_category; the delay applies
 *   ONLY to clinic/corporate categories. Consumer/residential services always bill.
 * @returns true if invoice should be emitted, false if it should be skipped
 *
 * Logic:
 * - If not a clinic/corporate service: return true (consumers always bill monthly)
 * - If activation <= 2026-06-01: return true (original cohort, bill normally)
 * - If activation > 2026-06-01: return true only if billingDay >= activation + 1 month
 */
export function shouldEmitRecurringInvoice(
  activationDate: string | null,
  billingDay: Date,
  productCategory: string | null = null
): boolean {
  // The new-clinic delay is clinic/corporate-only. Consumer services always bill.
  if (!isClinicBillingCategory(productCategory)) {
    return true;
  }

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
  const firstFullBillDate = addOneMonthUTC(activation);

  return billingDay >= firstFullBillDate;
}

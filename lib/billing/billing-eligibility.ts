/**
 * Billing Eligibility Helper
 *
 * Guards recurring invoice generation against an explicit billing-start / deferral
 * date on the service (customer_services.billing_start_date).
 *
 * Context: the monthly-invoice cron bills every active service on its billing_day.
 * A clinic can be live but in an agreed free/extension period, which `onboarding_status`
 * cannot express (it sits at 'pending' both when a clinic should pay and when its billing
 * has been deferred). `billing_start_date` is that missing signal — see the migration
 * 20260702130000_customer_services_add_billing_start_date.sql.
 */

/**
 * True when a service's billing has been deferred to a future date and the current
 * run is before it — i.e. the service must NOT be invoiced yet.
 *
 * @param billingStartDate - ISO date string (YYYY-MM-DD) or null. NULL = no deferral.
 * @param runDate - the billing run date (typically `new Date()` in the cron).
 * @returns true if billing should be suppressed (run is before billingStartDate).
 *
 * Notes:
 * - NULL billingStartDate → false (bill normally). This keeps legacy consumers and
 *   already-billing clinics unaffected.
 * - Comparison is a lexical compare of YYYY-MM-DD strings, which is correct for ISO
 *   dates. The service bills ON the start date (start === run → not before → billable).
 */
export function isBeforeBillingStart(
  billingStartDate: string | null | undefined,
  runDate: Date
): boolean {
  if (!billingStartDate) return false;

  // Normalise both sides to YYYY-MM-DD for a date-only comparison.
  const start = billingStartDate.slice(0, 10);
  const run = runDate.toISOString().slice(0, 10);

  return start > run;
}

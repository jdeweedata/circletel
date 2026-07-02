-- Add an explicit billing-start / deferral date to customer services.
--
-- Why: the monthly-invoice cron (lib/billing/monthly-invoice-generator.ts) bills
-- every active service on its billing_day. It had no way to represent a clinic that
-- is live but in a free/extension period, so on 2026-07-01 it auto-invoiced 11
-- not-yet-onboarded Unjani clinics (some in an agreed extension). `onboarding_status`
-- could not distinguish "should pay now" from "extension granted" because both sat at
-- 'pending'. This column is that missing signal.
--
-- Semantics: NULL = bill normally (default; legacy consumers + already-billing clinics
-- are unaffected). A date in the future = suppress recurring invoices until that date.
-- The cron compares it to the run date; see lib/billing/billing-eligibility.ts.

ALTER TABLE customer_services
  ADD COLUMN IF NOT EXISTS billing_start_date date;

COMMENT ON COLUMN customer_services.billing_start_date IS
  'Optional date from which recurring billing may begin. NULL = bill normally. A future date suppresses monthly invoices until reached (used for approved free/extension periods). Honoured by lib/billing/monthly-invoice-generator.ts via isBeforeBillingStart().';

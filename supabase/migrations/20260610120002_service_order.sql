-- Service Order PDF record tracking
-- Additive + idempotent. Safe to run multiple times.

-- Add service order tracking columns to onboarding_submissions
ALTER TABLE onboarding_submissions ADD COLUMN IF NOT EXISTS service_order_pdf_path text;
ALTER TABLE onboarding_submissions ADD COLUMN IF NOT EXISTS service_order_issued_at timestamptz;

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_service_order
  ON onboarding_submissions(customer_id, service_order_issued_at);

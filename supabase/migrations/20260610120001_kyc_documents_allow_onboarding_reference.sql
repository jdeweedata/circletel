-- Allow kyc_documents to reference either a consumer_order, business_quote, or onboarding_submission
-- Idempotent: checks and drops existing constraint before re-creating.

ALTER TABLE kyc_documents DROP CONSTRAINT IF EXISTS kyc_order_reference_check;
ALTER TABLE kyc_documents ADD CONSTRAINT kyc_order_reference_check CHECK (
  (consumer_order_id IS NOT NULL AND business_quote_id IS NULL)
  OR (consumer_order_id IS NULL AND business_quote_id IS NOT NULL)
  OR (consumer_order_id IS NULL AND business_quote_id IS NULL
      AND (customer_id IS NOT NULL OR onboarding_submission_id IS NOT NULL))
);

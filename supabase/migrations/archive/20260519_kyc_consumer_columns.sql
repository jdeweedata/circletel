-- Add columns needed for consumer KYC sessions
-- Consumer sessions link to auth.users via customer_id (not quote_id like B2B sessions)

ALTER TABLE kyc_sessions ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE kyc_sessions ADD COLUMN IF NOT EXISTS verification_url TEXT;

CREATE INDEX IF NOT EXISTS idx_kyc_customer ON kyc_sessions(customer_id);

-- Update flow_type constraint to include consumer_light_kyc
ALTER TABLE kyc_sessions DROP CONSTRAINT kyc_sessions_flow_type_check;
ALTER TABLE kyc_sessions ADD CONSTRAINT kyc_sessions_flow_type_check
  CHECK (flow_type = ANY (ARRAY['sme_light'::text, 'consumer_light'::text, 'consumer_light_kyc'::text, 'full_kyc'::text]));

-- B2B / Unjani self-service onboarding: tokens, submissions, document vetting.
-- Additive + idempotent. Safe to run multiple times.

-- Onboarding state on existing customers (Unjani clinics live in `customers`)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS onboarding_status text
  DEFAULT 'pending'
  CHECK (onboarding_status IN ('pending','in_progress','submitted','billing_ready','failed'));
ALTER TABLE customers ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS clinic_details jsonb DEFAULT '{}'::jsonb;

-- Magic-link tokens (store only the hash; single-use; 7-day expiry)
CREATE TABLE IF NOT EXISTS onboarding_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  sent_via text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_tokens_customer ON onboarding_tokens(customer_id);

-- Submission audit + per-account document-vetting rollup
CREATE TABLE IF NOT EXISTS onboarding_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  segment text NOT NULL DEFAULT 'unjani',
  submission_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  netcash_file_token text,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('draft','submitted','approved','rejected')),
  document_vetting_status text NOT NULL DEFAULT 'documents_pending'
    CHECK (document_vetting_status IN ('not_started','documents_pending','under_review','approved','rejected','expired')),
  admin_reviewed_at timestamptz,
  admin_reviewed_by uuid,
  admin_notes text,
  rejection_reason text,
  submitted_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_customer ON onboarding_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_vetting ON onboarding_submissions(document_vetting_status);

-- Generalize kyc_documents so docs can attach to a customer-scoped onboarding (all B2B)
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);
ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS onboarding_submission_id uuid REFERENCES onboarding_submissions(id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_onboarding_submission ON kyc_documents(onboarding_submission_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_customer ON kyc_documents(customer_id);

-- Link a payment method back to the onboarding submission that created it
ALTER TABLE customer_payment_methods ADD COLUMN IF NOT EXISTS onboarding_submission_id uuid REFERENCES onboarding_submissions(id);

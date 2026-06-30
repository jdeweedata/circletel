-- Purpose-scope onboarding tokens so signoff links cannot be used as wizard links.

ALTER TABLE onboarding_tokens
  ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'onboarding';

ALTER TABLE onboarding_tokens
  ADD COLUMN IF NOT EXISTS onboarding_submission_id uuid REFERENCES onboarding_submissions(id) ON DELETE SET NULL;

ALTER TABLE onboarding_tokens
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  ALTER TABLE onboarding_tokens
    ADD CONSTRAINT onboarding_tokens_purpose_check
    CHECK (purpose IN ('onboarding', 'service_order_signoff'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_onboarding_tokens_purpose_hash
  ON onboarding_tokens(purpose, token_hash);

CREATE INDEX IF NOT EXISTS idx_onboarding_tokens_submission
  ON onboarding_tokens(onboarding_submission_id)
  WHERE onboarding_submission_id IS NOT NULL;

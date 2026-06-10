-- Onboarding Pipeline: Add vetting SLA tracking
-- Additive + idempotent. Safe to run multiple times.

ALTER TABLE onboarding_submissions
ADD COLUMN IF NOT EXISTS vetting_due_date timestamptz;

CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_vetting_due_date
ON onboarding_submissions(vetting_due_date)
WHERE status = 'submitted' AND document_vetting_status IN ('documents_pending', 'under_review');

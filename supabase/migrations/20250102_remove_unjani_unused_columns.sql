-- Remove unused columns from unjani_contract_audits table
-- Keeping only sections 1, 2, and 3 (Clinic Info, Service Provider, Contract Details)

-- Drop columns from Section 4 (Migration Planning)
ALTER TABLE unjani_contract_audits
  DROP COLUMN IF EXISTS preferred_migration_date,
  DROP COLUMN IF EXISTS additional_notes;

-- Drop columns from Section 5 (Contact Information)
ALTER TABLE unjani_contract_audits
  DROP COLUMN IF EXISTS contact_name,
  DROP COLUMN IF EXISTS contact_position,
  DROP COLUMN IF EXISTS contact_phone,
  DROP COLUMN IF EXISTS contact_email,
  DROP COLUMN IF EXISTS alternative_contact,
  DROP COLUMN IF EXISTS alternative_phone,
  DROP COLUMN IF EXISTS best_contact_time,
  DROP COLUMN IF EXISTS site_access_notes;

-- Update table comment
COMMENT ON TABLE unjani_contract_audits IS 'Stores simplified contract audit form submissions for Unjani clinic network - Sections 1-3 only (Clinic Info, Service Provider, Contract Details)';

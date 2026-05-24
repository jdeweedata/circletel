-- Migration: Rename KYC to Compliance Status
-- Description: Updates partner system to use FICA/CIPC compliance terminology
-- Date: 2027-10-27
-- Author: Claude Code

-- ============================================
-- RENAME COLUMNS IN PARTNERS TABLE
-- ============================================

-- Rename kyc_status to compliance_status
ALTER TABLE partners
RENAME COLUMN kyc_status TO compliance_status;

-- Rename kyc_verified_at to compliance_verified_at
ALTER TABLE partners
RENAME COLUMN kyc_verified_at TO compliance_verified_at;

-- Add compliance_notes column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'compliance_notes'
  ) THEN
    ALTER TABLE partners ADD COLUMN compliance_notes TEXT;
  END IF;
END $$;

-- Update compliance_status constraint to include new statuses
ALTER TABLE partners
DROP CONSTRAINT IF EXISTS partners_kyc_status_check;

ALTER TABLE partners
DROP CONSTRAINT IF EXISTS partners_compliance_status_check;

ALTER TABLE partners
ADD CONSTRAINT partners_compliance_status_check
CHECK (compliance_status IN ('incomplete', 'submitted', 'under_review', 'verified', 'rejected'));

-- ============================================
-- ADD PARTNER NUMBER AND COMMISSION FIELDS
-- ============================================

-- Add partner_number field if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'partner_number'
  ) THEN
    ALTER TABLE partners ADD COLUMN partner_number TEXT UNIQUE;
  END IF;
END $$;

-- Add commission_rate field if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE partners ADD COLUMN commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add tier field if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'tier'
  ) THEN
    ALTER TABLE partners ADD COLUMN tier TEXT NOT NULL DEFAULT 'bronze';
  END IF;
END $$;

-- Add tier constraint
ALTER TABLE partners
DROP CONSTRAINT IF EXISTS partners_tier_check;

ALTER TABLE partners
ADD CONSTRAINT partners_tier_check
CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum'));

-- ============================================
-- RENAME TABLE: KYC DOCUMENTS → COMPLIANCE DOCUMENTS
-- ============================================

-- Rename table
ALTER TABLE IF EXISTS partner_kyc_documents
RENAME TO partner_compliance_documents;

-- Update document_category column constraint
ALTER TABLE partner_compliance_documents
DROP CONSTRAINT IF EXISTS partner_kyc_documents_document_type_check;

ALTER TABLE partner_compliance_documents
DROP CONSTRAINT IF EXISTS partner_compliance_documents_document_category_check;

ALTER TABLE partner_compliance_documents
ADD CONSTRAINT partner_compliance_documents_document_category_check
CHECK (document_category IN (
  'fica_identity',
  'fica_address',
  'cipc_registration',
  'cipc_profile',
  'cipc_directors',
  'cipc_founding',
  'tax_clearance',
  'vat_registration',
  'bank_confirmation',
  'bank_statement',
  'business_address',
  'authorization',
  'other'
));

-- Rename document_type to document_category if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_compliance_documents' AND column_name = 'document_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_compliance_documents' AND column_name = 'document_category'
  ) THEN
    ALTER TABLE partner_compliance_documents
    RENAME COLUMN document_type TO document_category;
  END IF;
END $$;

-- Add new metadata columns if not exists
DO $$
BEGIN
  -- Add document_type (specific type within category)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_compliance_documents' AND column_name = 'document_type'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'partner_compliance_documents' AND column_name = 'document_category'
    )
  ) THEN
    ALTER TABLE partner_compliance_documents ADD COLUMN document_type TEXT NOT NULL DEFAULT 'Unknown';
  END IF;

  -- Add document_number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_compliance_documents' AND column_name = 'document_number'
  ) THEN
    ALTER TABLE partner_compliance_documents ADD COLUMN document_number TEXT;
  END IF;

  -- Add issue_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_compliance_documents' AND column_name = 'issue_date'
  ) THEN
    ALTER TABLE partner_compliance_documents ADD COLUMN issue_date DATE;
  END IF;

  -- Add expiry_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_compliance_documents' AND column_name = 'expiry_date'
  ) THEN
    ALTER TABLE partner_compliance_documents ADD COLUMN expiry_date DATE;
  END IF;

  -- Add is_required
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_compliance_documents' AND column_name = 'is_required'
  ) THEN
    ALTER TABLE partner_compliance_documents ADD COLUMN is_required BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Add is_sensitive
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_compliance_documents' AND column_name = 'is_sensitive'
  ) THEN
    ALTER TABLE partner_compliance_documents ADD COLUMN is_sensitive BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- Add updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_compliance_documents' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE partner_compliance_documents ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Update verification_status constraint to include 'expired'
ALTER TABLE partner_compliance_documents
DROP CONSTRAINT IF EXISTS partner_kyc_documents_verification_status_check;

ALTER TABLE partner_compliance_documents
DROP CONSTRAINT IF EXISTS partner_compliance_documents_verification_status_check;

ALTER TABLE partner_compliance_documents
ADD CONSTRAINT partner_compliance_documents_verification_status_check
CHECK (verification_status IN ('pending', 'approved', 'rejected', 'expired'));

-- Remove expires_at column if it exists (replaced by expiry_date)
ALTER TABLE partner_compliance_documents
DROP COLUMN IF EXISTS expires_at;

-- ============================================
-- UPDATE INDEXES
-- ============================================

-- Drop old indexes
DROP INDEX IF EXISTS idx_partners_kyc_status;
DROP INDEX IF EXISTS idx_partner_kyc_partner_id;
DROP INDEX IF EXISTS idx_partner_kyc_verification_status;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_partners_compliance_status ON partners(compliance_status);
CREATE INDEX IF NOT EXISTS idx_partners_partner_number ON partners(partner_number);
CREATE INDEX IF NOT EXISTS idx_partners_tier ON partners(tier);

CREATE INDEX IF NOT EXISTS idx_partner_compliance_docs_partner_id ON partner_compliance_documents(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_compliance_docs_category ON partner_compliance_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_partner_compliance_docs_verification_status ON partner_compliance_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_partner_compliance_docs_expiry ON partner_compliance_documents(expiry_date);

-- ============================================
-- UPDATE RLS POLICIES
-- ============================================

-- Drop old KYC policies
DROP POLICY IF EXISTS "partners_view_own_documents" ON partner_compliance_documents;
DROP POLICY IF EXISTS "partners_upload_documents" ON partner_compliance_documents;
DROP POLICY IF EXISTS "partners_delete_own_unverified_documents" ON partner_compliance_documents;
DROP POLICY IF EXISTS "admins_view_all_documents" ON partner_compliance_documents;
DROP POLICY IF EXISTS "admins_manage_documents" ON partner_compliance_documents;

-- Create new compliance policies
CREATE POLICY "partners_view_own_compliance_documents"
  ON partner_compliance_documents FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "partners_upload_compliance_documents"
  ON partner_compliance_documents FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "partners_delete_own_unverified_compliance_documents"
  ON partner_compliance_documents FOR DELETE
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
    AND verification_status = 'pending'
  );

CREATE POLICY "admins_view_all_compliance_documents"
  ON partner_compliance_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Sales Manager')
      )
    )
  );

CREATE POLICY "admins_manage_compliance_documents"
  ON partner_compliance_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Sales Manager')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Sales Manager')
      )
    )
  );

-- ============================================
-- UPDATE COMMENTS
-- ============================================

COMMENT ON TABLE partner_compliance_documents IS 'FICA/CIPC compliance documents for partner onboarding - includes identity verification, company registration, tax compliance, and banking verification (BRS 5.3.1)';
COMMENT ON COLUMN partners.compliance_status IS 'FICA/CIPC compliance status: incomplete, submitted, under_review, verified, rejected';
COMMENT ON COLUMN partners.partner_number IS 'Unique partner identifier (e.g., CTPL-2025-001) - Generated on approval';
COMMENT ON COLUMN partners.commission_rate IS 'Commission percentage (e.g., 10.50 for 10.5%)';
COMMENT ON COLUMN partners.tier IS 'Partner tier: bronze, silver, gold, platinum';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully';
  RAISE NOTICE '- Renamed kyc_status to compliance_status';
  RAISE NOTICE '- Renamed partner_kyc_documents to partner_compliance_documents';
  RAISE NOTICE '- Added partner_number, commission_rate, tier fields';
  RAISE NOTICE '- Added document metadata fields';
  RAISE NOTICE '- Updated indexes and RLS policies';
END $$;

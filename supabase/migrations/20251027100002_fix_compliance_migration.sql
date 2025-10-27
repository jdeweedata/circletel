-- Migration: Fix Compliance Status Migration
-- Description: Ensures all KYC → Compliance changes are applied correctly
-- Date: 2027-10-27
-- Author: Claude Code
-- This is a robust version that handles partial application scenarios

-- ============================================
-- STEP 1: RENAME COLUMNS IN PARTNERS TABLE
-- ============================================

-- Rename kyc_status to compliance_status (if not already done)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'kyc_status'
  ) THEN
    ALTER TABLE partners RENAME COLUMN kyc_status TO compliance_status;
    RAISE NOTICE 'Renamed kyc_status to compliance_status';
  ELSE
    RAISE NOTICE 'Column kyc_status already renamed or does not exist';
  END IF;
END $$;

-- Rename kyc_verified_at to compliance_verified_at (if not already done)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'kyc_verified_at'
  ) THEN
    ALTER TABLE partners RENAME COLUMN kyc_verified_at TO compliance_verified_at;
    RAISE NOTICE 'Renamed kyc_verified_at to compliance_verified_at';
  ELSE
    RAISE NOTICE 'Column kyc_verified_at already renamed or does not exist';
  END IF;
END $$;

-- Add compliance_notes column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'compliance_notes'
  ) THEN
    ALTER TABLE partners ADD COLUMN compliance_notes TEXT;
    RAISE NOTICE 'Added compliance_notes column';
  ELSE
    RAISE NOTICE 'Column compliance_notes already exists';
  END IF;
END $$;

-- Update compliance_status constraint
DO $$
BEGIN
  ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_kyc_status_check;
  ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_compliance_status_check;

  ALTER TABLE partners ADD CONSTRAINT partners_compliance_status_check
  CHECK (compliance_status IN ('incomplete', 'submitted', 'under_review', 'verified', 'rejected'));

  RAISE NOTICE 'Updated compliance_status constraint';
END $$;

-- ============================================
-- STEP 2: ADD NEW PARTNER FIELDS
-- ============================================

-- Add partner_number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'partner_number'
  ) THEN
    ALTER TABLE partners ADD COLUMN partner_number TEXT UNIQUE;
    RAISE NOTICE 'Added partner_number column';
  ELSE
    RAISE NOTICE 'Column partner_number already exists';
  END IF;
END $$;

-- Add commission_rate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE partners ADD COLUMN commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0;
    RAISE NOTICE 'Added commission_rate column';
  ELSE
    RAISE NOTICE 'Column commission_rate already exists';
  END IF;
END $$;

-- Add tier
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'tier'
  ) THEN
    ALTER TABLE partners ADD COLUMN tier TEXT NOT NULL DEFAULT 'bronze';
    RAISE NOTICE 'Added tier column';
  ELSE
    RAISE NOTICE 'Column tier already exists';
  END IF;
END $$;

-- Add tier constraint
DO $$
BEGIN
  ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_tier_check;
  ALTER TABLE partners ADD CONSTRAINT partners_tier_check
  CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum'));
  RAISE NOTICE 'Added tier constraint';
END $$;

-- ============================================
-- STEP 3: UPDATE INDEXES
-- ============================================

-- Update partner indexes
DO $$
BEGIN
  -- Drop old kyc_status index
  DROP INDEX IF EXISTS idx_partners_kyc_status;

  -- Create new compliance_status index
  CREATE INDEX IF NOT EXISTS idx_partners_compliance_status ON partners(compliance_status);

  -- Create partner_number index
  CREATE INDEX IF NOT EXISTS idx_partners_partner_number ON partners(partner_number);

  -- Create tier index
  CREATE INDEX IF NOT EXISTS idx_partners_tier ON partners(tier);

  RAISE NOTICE 'Updated partner indexes';
END $$;

-- ============================================
-- STEP 4: RENAME TABLE
-- ============================================

-- Rename partner_kyc_documents to partner_compliance_documents
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'partner_kyc_documents'
  ) THEN
    ALTER TABLE partner_kyc_documents RENAME TO partner_compliance_documents;
    RAISE NOTICE 'Renamed partner_kyc_documents to partner_compliance_documents';
  ELSE
    RAISE NOTICE 'Table partner_kyc_documents already renamed or does not exist';
  END IF;
END $$;

-- ============================================
-- STEP 5: UPDATE COMPLIANCE DOCUMENTS TABLE
-- ============================================

-- Rename document_type column to document_category if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_compliance_documents' AND column_name = 'document_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_compliance_documents' AND column_name = 'document_category'
  ) THEN
    ALTER TABLE partner_compliance_documents RENAME COLUMN document_type TO document_category;
    RAISE NOTICE 'Renamed document_type to document_category';
  END IF;
END $$;

-- Now add document_type as a new column (specific type within category)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_compliance_documents' AND column_name = 'document_type'
  ) THEN
    ALTER TABLE partner_compliance_documents ADD COLUMN document_type TEXT NOT NULL DEFAULT 'Unknown';
    RAISE NOTICE 'Added new document_type column';
  END IF;
END $$;

-- Add document metadata columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_compliance_documents' AND column_name = 'document_number') THEN
    ALTER TABLE partner_compliance_documents ADD COLUMN document_number TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_compliance_documents' AND column_name = 'issue_date') THEN
    ALTER TABLE partner_compliance_documents ADD COLUMN issue_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_compliance_documents' AND column_name = 'expiry_date') THEN
    ALTER TABLE partner_compliance_documents ADD COLUMN expiry_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_compliance_documents' AND column_name = 'is_required') THEN
    ALTER TABLE partner_compliance_documents ADD COLUMN is_required BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_compliance_documents' AND column_name = 'is_sensitive') THEN
    ALTER TABLE partner_compliance_documents ADD COLUMN is_sensitive BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_compliance_documents' AND column_name = 'updated_at') THEN
    ALTER TABLE partner_compliance_documents ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;

  RAISE NOTICE 'Added document metadata columns';
END $$;

-- Update document_category constraint with new categories
DO $$
BEGIN
  ALTER TABLE partner_compliance_documents DROP CONSTRAINT IF EXISTS partner_kyc_documents_document_type_check;
  ALTER TABLE partner_compliance_documents DROP CONSTRAINT IF EXISTS partner_compliance_documents_document_category_check;

  ALTER TABLE partner_compliance_documents ADD CONSTRAINT partner_compliance_documents_document_category_check
  CHECK (document_category IN (
    'fica_identity', 'fica_address', 'cipc_registration', 'cipc_profile',
    'cipc_directors', 'cipc_founding', 'tax_clearance', 'vat_registration',
    'bank_confirmation', 'bank_statement', 'business_address', 'authorization', 'other'
  ));

  RAISE NOTICE 'Updated document_category constraint';
END $$;

-- Update verification_status constraint
DO $$
BEGIN
  ALTER TABLE partner_compliance_documents DROP CONSTRAINT IF EXISTS partner_kyc_documents_verification_status_check;
  ALTER TABLE partner_compliance_documents DROP CONSTRAINT IF EXISTS partner_compliance_documents_verification_status_check;

  ALTER TABLE partner_compliance_documents ADD CONSTRAINT partner_compliance_documents_verification_status_check
  CHECK (verification_status IN ('pending', 'approved', 'rejected', 'expired'));

  RAISE NOTICE 'Updated verification_status constraint';
END $$;

-- ============================================
-- STEP 6: UPDATE DOCUMENT INDEXES
-- ============================================

-- Update document indexes
DO $$
BEGIN
  -- Drop old indexes
  DROP INDEX IF EXISTS idx_partner_kyc_partner_id;
  DROP INDEX IF EXISTS idx_partner_kyc_verification_status;

  -- Create new indexes
  CREATE INDEX IF NOT EXISTS idx_partner_compliance_docs_partner_id ON partner_compliance_documents(partner_id);
  CREATE INDEX IF NOT EXISTS idx_partner_compliance_docs_category ON partner_compliance_documents(document_category);
  CREATE INDEX IF NOT EXISTS idx_partner_compliance_docs_verification_status ON partner_compliance_documents(verification_status);
  CREATE INDEX IF NOT EXISTS idx_partner_compliance_docs_expiry ON partner_compliance_documents(expiry_date);

  RAISE NOTICE 'Updated document indexes';
END $$;

-- ============================================
-- STEP 7: UPDATE RLS POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "partners_view_own_documents" ON partner_compliance_documents;
DROP POLICY IF EXISTS "partners_upload_documents" ON partner_compliance_documents;
DROP POLICY IF EXISTS "partners_delete_own_unverified_documents" ON partner_compliance_documents;
DROP POLICY IF EXISTS "admins_view_all_documents" ON partner_compliance_documents;
DROP POLICY IF EXISTS "admins_manage_documents" ON partner_compliance_documents;

-- Create new policies
CREATE POLICY "partners_view_own_compliance_documents"
  ON partner_compliance_documents FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

CREATE POLICY "partners_upload_compliance_documents"
  ON partner_compliance_documents FOR INSERT
  WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

CREATE POLICY "partners_delete_own_unverified_compliance_documents"
  ON partner_compliance_documents FOR DELETE
  USING (
    partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
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
  );

DO $$
BEGIN
  RAISE NOTICE 'Updated RLS policies';
END $$;

-- ============================================
-- STEP 8: UPDATE COMMENTS
-- ============================================

COMMENT ON TABLE partner_compliance_documents IS 'FICA/CIPC compliance documents for partner onboarding - includes identity verification, company registration, tax compliance, and banking verification (BRS 5.3.1)';
COMMENT ON COLUMN partners.compliance_status IS 'FICA/CIPC compliance status: incomplete, submitted, under_review, verified, rejected';
COMMENT ON COLUMN partners.partner_number IS 'Unique partner identifier (e.g., CTPL-2025-001) - Generated on approval';
COMMENT ON COLUMN partners.commission_rate IS 'Commission percentage (e.g., 10.50 for 10.5%)';
COMMENT ON COLUMN partners.tier IS 'Partner tier: bronze, silver, gold, platinum';

-- ============================================
-- SUCCESS SUMMARY
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '- Renamed kyc columns to compliance';
  RAISE NOTICE '- Renamed partner_kyc_documents table';
  RAISE NOTICE '- Added partner_number, commission_rate, tier';
  RAISE NOTICE '- Added document metadata fields';
  RAISE NOTICE '- Updated all indexes';
  RAISE NOTICE '- Updated all RLS policies';
  RAISE NOTICE '- Updated all constraints';
  RAISE NOTICE '========================================';
END $$;

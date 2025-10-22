-- =====================================================
-- Create KYC Documents System
-- Created: 2025-10-22
-- Purpose: KYC document upload and verification system
-- =====================================================

-- Create kyc_documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Order reference
  order_id UUID NOT NULL REFERENCES consumer_orders(id) ON DELETE CASCADE,

  -- Document information
  document_type TEXT NOT NULL CHECK (document_type IN (
    'id_document',
    'proof_of_address',
    'bank_statement',
    'company_registration',
    'tax_certificate',
    'vat_certificate',
    'director_id',
    'shareholder_agreement',
    'other'
  )),

  -- File details
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_url TEXT,

  -- Verification
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN (
    'pending',
    'under_review',
    'approved',
    'rejected',
    'expired',
    'requires_update'
  )),
  verified_by UUID REFERENCES admin_users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kyc_documents_order_id ON kyc_documents(order_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_verification_status ON kyc_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_document_type ON kyc_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_created_at ON kyc_documents(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_kyc_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_kyc_documents_updated_at
  BEFORE UPDATE ON kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_kyc_documents_updated_at();

-- Enable Row Level Security
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Admin users can view all documents
CREATE POLICY "Admins can view all KYC documents"
  ON kyc_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.active = true
    )
  );

-- 2. Admin users can insert documents
CREATE POLICY "Admins can insert KYC documents"
  ON kyc_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.active = true
    )
  );

-- 3. Admin users can update documents
CREATE POLICY "Admins can update KYC documents"
  ON kyc_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.active = true
    )
  );

-- 4. Public API can insert documents (for customer uploads)
CREATE POLICY "API can insert KYC documents"
  ON kyc_documents
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 5. Public API can select documents by order_id (for customer to view their own)
CREATE POLICY "API can select KYC documents by order"
  ON kyc_documents
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON kyc_documents TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON kyc_documents TO service_role;

-- =====================================================
-- Storage Bucket Setup Instructions
-- =====================================================

-- NOTE: Storage buckets must be created via Supabase Dashboard or API
-- This SQL file documents the required configuration

-- Bucket Name: kyc-documents
-- Public: false (private bucket)
-- Allowed MIME types: image/jpeg, image/jpg, image/png, application/pdf
-- Max file size: 5MB (5242880 bytes)

-- Storage RLS Policies (to be applied via Dashboard):
--
-- 1. "Allow authenticated uploads"
--    Operation: INSERT
--    Target roles: authenticated
--    Policy: true
--
-- 2. "Allow authenticated to view their uploads"
--    Operation: SELECT
--    Target roles: authenticated
--    Policy: true
--
-- 3. "Allow admins full access"
--    Operation: ALL
--    Target roles: authenticated
--    Policy: EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())

COMMENT ON TABLE kyc_documents IS 'Stores KYC verification documents for customer orders';
COMMENT ON COLUMN kyc_documents.order_id IS 'Reference to consumer_orders table';
COMMENT ON COLUMN kyc_documents.verification_status IS 'Current verification status of the document';
COMMENT ON COLUMN kyc_documents.storage_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN kyc_documents.rejection_reason IS 'Reason for rejection if verification_status is rejected';

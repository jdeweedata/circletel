-- =====================================================
-- Add Installation Document Storage Support
-- Created: 2025-11-22
-- Purpose: Support installation document upload and storage
-- =====================================================

-- Add installation document fields to consumer_orders
ALTER TABLE consumer_orders
  ADD COLUMN IF NOT EXISTS installation_document_url TEXT,
  ADD COLUMN IF NOT EXISTS installation_document_name TEXT,
  ADD COLUMN IF NOT EXISTS installation_document_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS installation_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS billing_activated_at TIMESTAMPTZ;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_consumer_orders_billing_active ON consumer_orders(billing_active) WHERE billing_active = true;
CREATE INDEX IF NOT EXISTS idx_consumer_orders_installation_completed_at ON consumer_orders(installation_completed_at);

-- Add comments
COMMENT ON COLUMN consumer_orders.installation_document_url IS 'URL/path to installation completion document in storage';
COMMENT ON COLUMN consumer_orders.installation_document_name IS 'Original filename of installation document';
COMMENT ON COLUMN consumer_orders.installation_document_uploaded_at IS 'Timestamp when installation document was uploaded';
COMMENT ON COLUMN consumer_orders.installation_completed_at IS 'Timestamp when installation was marked as completed';
COMMENT ON COLUMN consumer_orders.billing_active IS 'Whether billing has been activated for this order';
COMMENT ON COLUMN consumer_orders.billing_activated_at IS 'Timestamp when billing was activated';

-- Create storage bucket for installation documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'installation-documents',
  'installation-documents',
  false, -- private bucket
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for installation documents bucket
-- Service role (admin) has full access
DROP POLICY IF EXISTS "Admin users can upload installation documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can view installation documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can update installation documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete installation documents" ON storage.objects;
DROP POLICY IF EXISTS "Customers can view their installation documents" ON storage.objects;

CREATE POLICY "Service role can manage installation documents"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'installation-documents' AND
    auth.jwt()->>'role' = 'service_role'
  );

CREATE POLICY "Authenticated users can view installation documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'installation-documents');

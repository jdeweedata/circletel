-- =====================================================
-- Add RLS Policies for kyc_documents Table
-- Created: 2025-10-22
-- Purpose: Allow public API access for customer KYC uploads
-- =====================================================

-- Policy 1: Allow anyone to insert KYC documents (for customer uploads during order flow)
CREATE POLICY "Allow public to insert KYC documents"
  ON kyc_documents
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy 2: Allow anyone to select KYC documents (for viewing uploaded documents)
CREATE POLICY "Allow public to select KYC documents"
  ON kyc_documents
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy 3: Allow admins to update KYC documents (for verification workflow)
CREATE POLICY "Allow admins to update KYC documents"
  ON kyc_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Policy 4: Allow admins to delete KYC documents
CREATE POLICY "Allow admins to delete KYC documents"
  ON kyc_documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "Allow public to insert KYC documents" ON kyc_documents IS
  'Allows customers to upload KYC documents during order flow via public API';

COMMENT ON POLICY "Allow public to select KYC documents" ON kyc_documents IS
  'Allows customers to view their uploaded KYC documents';

COMMENT ON POLICY "Allow admins to update KYC documents" ON kyc_documents IS
  'Allows admin users to update document verification status and notes';

COMMENT ON POLICY "Allow admins to delete KYC documents" ON kyc_documents IS
  'Allows admin users to delete KYC documents if needed';

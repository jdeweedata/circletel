-- ==================================================
-- SUPABASE STORAGE: PARTNER COMPLIANCE DOCUMENTS
-- ==================================================
-- Purpose: Create storage bucket and RLS policies for partner document uploads
-- Date: 2025-10-27
-- Note: Run this in Supabase SQL Editor as project owner
-- ==================================================

-- ============================================
-- STEP 1: CREATE STORAGE BUCKET
-- ============================================

-- Insert bucket configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-compliance-documents',
  'partner-compliance-documents',
  false, -- Private bucket with RLS
  20971520, -- 20MB in bytes
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/zip',
    'application/x-zip-compressed'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STEP 2: ENABLE RLS ON STORAGE.OBJECTS
-- ============================================

-- Ensure RLS is enabled (should already be enabled by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: DROP EXISTING POLICIES (IF ANY)
-- ============================================

-- Clean slate - drop any existing policies for this bucket
DROP POLICY IF EXISTS "partners_upload_own_compliance_documents" ON storage.objects;
DROP POLICY IF EXISTS "partners_view_own_compliance_documents" ON storage.objects;
DROP POLICY IF EXISTS "partners_delete_own_unverified_compliance_documents" ON storage.objects;
DROP POLICY IF EXISTS "admins_access_all_compliance_documents" ON storage.objects;

-- ============================================
-- STEP 4: CREATE RLS POLICIES
-- ============================================

-- Policy 1: Partners can upload documents to their own folder
-- Folder structure: {partner_id}/{category}/{filename}
-- First segment of path must match partner's ID
CREATE POLICY "partners_upload_own_compliance_documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-compliance-documents'
  AND auth.uid() IN (
    SELECT user_id FROM public.partners
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Policy 2: Partners can view/download their own documents
CREATE POLICY "partners_view_own_compliance_documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'partner-compliance-documents'
  AND auth.uid() IN (
    SELECT user_id FROM public.partners
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Policy 3: Partners can delete their own documents if not yet verified
-- Prevents deletion of approved/rejected documents (audit trail)
CREATE POLICY "partners_delete_own_unverified_compliance_documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'partner-compliance-documents'
  AND auth.uid() IN (
    SELECT user_id FROM public.partners
    WHERE id::text = (storage.foldername(name))[1]
  )
  AND EXISTS (
    SELECT 1 FROM public.partner_compliance_documents
    WHERE file_path = name
    AND verification_status = 'pending'
  )
);

-- Policy 4: Admins can access all compliance documents
-- Roles: Super Administrator, Sales Manager, Compliance Officer
CREATE POLICY "admins_access_all_compliance_documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'partner-compliance-documents'
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
    AND role_template_id IN (
      SELECT id FROM public.role_templates
      WHERE name IN ('Super Administrator', 'Sales Manager', 'Compliance Officer')
    )
  )
)
WITH CHECK (
  bucket_id = 'partner-compliance-documents'
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
    AND role_template_id IN (
      SELECT id FROM public.role_templates
      WHERE name IN ('Super Administrator', 'Sales Manager', 'Compliance Officer')
    )
  )
);

-- ============================================
-- STEP 5: VERIFICATION
-- ============================================

-- Verify bucket was created
DO $$
DECLARE
  bucket_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Check bucket exists
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets
  WHERE id = 'partner-compliance-documents';

  IF bucket_count > 0 THEN
    RAISE NOTICE '✅ Bucket "partner-compliance-documents" created successfully';
  ELSE
    RAISE WARNING '⚠️  Bucket creation may have failed';
  END IF;

  -- Check policies exist
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%compliance_documents%';

  IF policy_count = 4 THEN
    RAISE NOTICE '✅ All 4 RLS policies created successfully';
  ELSE
    RAISE WARNING '⚠️  Expected 4 policies, found %', policy_count;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Storage setup completed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Bucket: partner-compliance-documents';
  RAISE NOTICE 'Privacy: Private (RLS enforced)';
  RAISE NOTICE 'File limit: 20MB';
  RAISE NOTICE 'Policies: % created', policy_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these manually to verify setup:

-- 1. Check bucket configuration
-- SELECT * FROM storage.buckets WHERE id = 'partner-compliance-documents';

-- 2. Check RLS policies
-- SELECT policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'storage'
-- AND tablename = 'objects'
-- AND policyname LIKE '%compliance_documents%'
-- ORDER BY policyname;

-- 3. Check folder structure (after first upload)
-- SELECT name, created_at
-- FROM storage.objects
-- WHERE bucket_id = 'partner-compliance-documents'
-- ORDER BY created_at DESC
-- LIMIT 10;

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If you get "must be owner of table objects" error:
-- This script requires OWNER/SUPERUSER permissions on storage.objects table.
-- Solution 1: Run as database owner (usually 'postgres' user)
-- Solution 2: Use Supabase Dashboard → Storage → Policies (visual builder)
-- Solution 3: Contact Supabase support to verify permissions

-- If policies aren't working:
-- 1. Verify auth.uid() returns correct user ID
-- 2. Check partners table has correct user_id mapping
-- 3. Check admin_users table has correct role assignments
-- 4. Test with: SELECT auth.uid(); (should return UUID)

-- ============================================
-- FOLDER STRUCTURE EXAMPLE
-- ============================================

-- After partners upload documents, folder structure will be:
--
-- partner-compliance-documents/
-- ├── {partner_id_1}/
-- │   ├── fica_identity/
-- │   │   └── 1698765432123_id_document.pdf
-- │   ├── cipc_registration/
-- │   │   └── 1698765555444_ck1_certificate.pdf
-- │   ├── tax_clearance/
-- │   │   └── 1698765666777_tax_clearance.pdf
-- │   └── bank_statement/
-- │       └── 1698765777888_statement.pdf
-- ├── {partner_id_2}/
-- │   └── ...

-- Path format: {partner_id}/{category}/{timestamp}_{filename}

-- ============================================
-- SUCCESS
-- ============================================

-- If you see "Storage setup completed!" above, you're done!
--
-- Next steps:
-- 1. Run verification: node scripts/test-storage-bucket.js
-- 2. Test upload: http://localhost:3000/partners/onboarding/verify
-- 3. Check storage: Supabase Dashboard → Storage → partner-compliance-documents
--
-- Documentation:
-- - Dashboard guide: docs/partners/SUPABASE_STORAGE_SETUP_DASHBOARD.md
-- - SQL guide: docs/partners/SUPABASE_STORAGE_SETUP.md
-- - Quick start: docs/partners/COMPLIANCE_SYSTEM_QUICK_START.md

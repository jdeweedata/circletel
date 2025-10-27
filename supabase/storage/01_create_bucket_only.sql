-- ==================================================
-- STEP 1: CREATE STORAGE BUCKET ONLY
-- ==================================================
-- Purpose: Create bucket via SQL (no policies - those require Dashboard)
-- Date: 2025-10-27
-- Note: Run this first, then create policies via Dashboard
-- ==================================================

-- Create or update bucket
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

-- Verify bucket was created
DO $$
DECLARE
  bucket_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets
  WHERE id = 'partner-compliance-documents';

  IF bucket_count > 0 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SUCCESS: Bucket created!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Bucket: partner-compliance-documents';
    RAISE NOTICE 'Privacy: Private (RLS enforced)';
    RAISE NOTICE 'File limit: 20MB';
    RAISE NOTICE 'MIME types: PDF, JPG, PNG, ZIP';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NEXT STEP: Create RLS policies via Dashboard';
    RAISE NOTICE 'See: docs/partners/STORAGE_POLICIES_DASHBOARD.md';
    RAISE NOTICE '========================================';
  ELSE
    RAISE WARNING '⚠️  Bucket creation may have failed';
  END IF;
END $$;

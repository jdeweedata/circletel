-- =====================================================
-- CREATE INSTALLATION DOCUMENTS STORAGE BUCKET
-- Run this in Supabase Dashboard > SQL Editor
-- Date: 2025-11-25
-- Purpose: Fix missing installation-documents bucket
-- =====================================================

-- Step 1: Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'installation-documents',
  'installation-documents',
  true, -- PUBLIC bucket for direct URL access
  20971520, -- 20MB limit
  ARRAY[
    'application/pdf', 
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY[
    'application/pdf', 
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

-- Step 2: Create RLS policy for public read access
CREATE POLICY "Public read access for installation documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'installation-documents');

-- Step 3: Create RLS policy for authenticated uploads
CREATE POLICY "Authenticated users can upload installation documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'installation-documents');

-- Step 4: Create RLS policy for authenticated updates
CREATE POLICY "Authenticated users can update installation documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'installation-documents');

-- Step 5: Create RLS policy for authenticated deletes
CREATE POLICY "Authenticated users can delete installation documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'installation-documents');

-- Verify bucket was created
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'installation-documents';

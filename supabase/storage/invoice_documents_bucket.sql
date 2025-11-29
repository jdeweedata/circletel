-- =============================================================================
-- Invoice Documents Storage Bucket
-- =============================================================================
-- Stores immutable invoice and credit note PDFs for SARS compliance
-- Run this in Supabase Dashboard > SQL Editor
-- =============================================================================

-- Create the bucket for invoice documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'invoice-documents',
    'invoice-documents',
    false,  -- Private bucket - requires signed URLs
    5242880,  -- 5MB max file size
    ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- Storage Policies
-- =============================================================================

-- Policy: Service role can do everything
CREATE POLICY "Service role full access to invoice documents"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'invoice-documents')
WITH CHECK (bucket_id = 'invoice-documents');

-- Policy: Customers can view their own invoice PDFs
CREATE POLICY "Customers can view own invoice documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'invoice-documents'
    AND (
        -- Extract customer_id from path: invoices/{customer_id}/INV-YYYY-NNNNN.pdf
        -- or credit-notes/{customer_id}/CN-YYYY-NNNNN.pdf
        (storage.foldername(name))[2]::uuid IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    )
);

-- Policy: Admins can view all invoice documents
CREATE POLICY "Admins can view all invoice documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'invoice-documents'
    AND EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE email = auth.jwt() ->> 'email'
    )
);

-- Policy: Prevent deletion (immutability)
-- Only service_role can delete, and only for cleanup of failed uploads
CREATE POLICY "Prevent public deletion of invoice documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (false);  -- No one except service_role can delete

-- =============================================================================
-- Folder Structure
-- =============================================================================
-- invoice-documents/
--   ├── invoices/
--   │   └── {customer_id}/
--   │       ├── INV-2025-00001.pdf
--   │       ├── INV-2025-00002.pdf
--   │       └── ...
--   └── credit-notes/
--       └── {customer_id}/
--           ├── CN-2025-00001.pdf
--           └── ...
-- =============================================================================

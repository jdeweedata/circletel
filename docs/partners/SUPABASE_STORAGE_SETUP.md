# Supabase Storage Setup for Partner Compliance Documents

**Date**: 2025-10-27
**Purpose**: Configure Supabase Storage bucket for FICA/CIPC document uploads
**Security**: RLS-protected, partner-scoped access

---

## Overview

Partner compliance documents (FICA/CIPC) are stored in Supabase Storage with Row Level Security (RLS) policies ensuring partners can only access their own documents while admins have full access.

---

## Step 1: Create Storage Bucket

### Via Supabase Dashboard

1. Navigate to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Configure bucket:
   ```
   Name: partner-compliance-documents
   Public: No (Private bucket with RLS)
   File size limit: 20MB
   Allowed MIME types:
     - application/pdf
     - image/jpeg
     - image/jpg
     - image/png
     - application/zip
     - application/x-zip-compressed
   ```
4. Click **"Create bucket"**

### Via SQL (Alternative)

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-compliance-documents',
  'partner-compliance-documents',
  false,
  20971520, -- 20MB in bytes
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/zip',
    'application/x-zip-compressed'
  ]::text[]
);
```

---

## Step 2: Configure RLS Policies

Apply these policies to the `partner-compliance-documents` bucket:

### Policy 1: Partners Can Upload Own Documents

```sql
-- Partners can upload documents to their own folder
CREATE POLICY "partners_upload_own_compliance_documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-compliance-documents'
  AND auth.uid() IN (
    SELECT user_id FROM partners
    WHERE id::text = (storage.foldername(name))[1]
  )
);
```

**Explanation**:
- Partners can only upload to folders matching their `partner_id`
- Folder structure: `{partner_id}/{category}/{filename}`
- First segment of path must match partner's ID

### Policy 2: Partners Can View Own Documents

```sql
-- Partners can view/download their own documents
CREATE POLICY "partners_view_own_compliance_documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'partner-compliance-documents'
  AND auth.uid() IN (
    SELECT user_id FROM partners
    WHERE id::text = (storage.foldername(name))[1]
  )
);
```

**Explanation**:
- Partners can only SELECT (view/download) documents in their folder
- Prevents partners from accessing other partners' documents

### Policy 3: Partners Can Delete Own Unverified Documents

```sql
-- Partners can delete their own documents if not yet verified
CREATE POLICY "partners_delete_own_unverified_compliance_documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'partner-compliance-documents'
  AND auth.uid() IN (
    SELECT user_id FROM partners
    WHERE id::text = (storage.foldername(name))[1]
  )
  AND EXISTS (
    SELECT 1 FROM partner_compliance_documents
    WHERE file_path = name
    AND verification_status = 'pending'
  )
);
```

**Explanation**:
- Partners can delete documents only if verification_status = 'pending'
- Prevents deletion of approved/rejected documents
- Ensures audit trail integrity

### Policy 4: Admins Can Access All Documents

```sql
-- Admins can view all compliance documents
CREATE POLICY "admins_access_all_compliance_documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'partner-compliance-documents'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role_template_id IN (
      SELECT id FROM role_templates
      WHERE name IN ('Super Administrator', 'Sales Manager', 'Compliance Officer')
    )
  )
);
```

**Explanation**:
- Admins with appropriate roles can SELECT, INSERT, UPDATE, DELETE
- Roles: Super Administrator, Sales Manager, Compliance Officer
- Full access for verification and management

---

## Step 3: Apply Policies (Complete SQL)

Run this complete SQL script in **Supabase SQL Editor**:

```sql
-- ==================================================
-- SUPABASE STORAGE SETUP: PARTNER COMPLIANCE DOCUMENTS
-- ==================================================

-- Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partner-compliance-documents',
  'partner-compliance-documents',
  false,
  20971520, -- 20MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/zip',
    'application/x-zip-compressed'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean re-run)
DROP POLICY IF EXISTS "partners_upload_own_compliance_documents" ON storage.objects;
DROP POLICY IF EXISTS "partners_view_own_compliance_documents" ON storage.objects;
DROP POLICY IF EXISTS "partners_delete_own_unverified_compliance_documents" ON storage.objects;
DROP POLICY IF EXISTS "admins_access_all_compliance_documents" ON storage.objects;

-- Policy 1: Partners can upload to own folder
CREATE POLICY "partners_upload_own_compliance_documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-compliance-documents'
  AND auth.uid() IN (
    SELECT user_id FROM partners
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Policy 2: Partners can view own documents
CREATE POLICY "partners_view_own_compliance_documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'partner-compliance-documents'
  AND auth.uid() IN (
    SELECT user_id FROM partners
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Policy 3: Partners can delete own unverified documents
CREATE POLICY "partners_delete_own_unverified_compliance_documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'partner-compliance-documents'
  AND auth.uid() IN (
    SELECT user_id FROM partners
    WHERE id::text = (storage.foldername(name))[1]
  )
  AND EXISTS (
    SELECT 1 FROM partner_compliance_documents
    WHERE file_path = name
    AND verification_status = 'pending'
  )
);

-- Policy 4: Admins can access all documents
CREATE POLICY "admins_access_all_compliance_documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'partner-compliance-documents'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role_template_id IN (
      SELECT id FROM role_templates
      WHERE name IN ('Super Administrator', 'Sales Manager', 'Compliance Officer')
    )
  )
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Storage bucket "partner-compliance-documents" configured successfully';
  RAISE NOTICE 'RLS policies applied: 4 policies';
END $$;
```

---

## Step 4: Verify Setup

### Test 1: Check Bucket Exists

```sql
SELECT * FROM storage.buckets
WHERE id = 'partner-compliance-documents';
```

**Expected Result**:
```
id: partner-compliance-documents
name: partner-compliance-documents
public: false
file_size_limit: 20971520
allowed_mime_types: {application/pdf, image/jpeg, ...}
```

### Test 2: Check RLS Policies

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%compliance_documents%'
ORDER BY policyname;
```

**Expected Result**: 4 policies listed

### Test 3: Test Partner Upload (Via Application)

1. Register as a partner
2. Navigate to `/partners/onboarding/verify`
3. Upload a test PDF document
4. Check Supabase Storage → partner-compliance-documents
5. Verify file appears in: `{partner_id}/{category}/{timestamp}_{filename}`

### Test 4: Test Admin Access (Via Supabase Dashboard)

1. Log in as admin user
2. Navigate to Storage → partner-compliance-documents
3. Verify you can see all partner folders
4. Verify you can download/delete files

---

## File Structure

Documents are organized by partner and category:

```
partner-compliance-documents/
├── {partner_id_1}/
│   ├── fica_identity/
│   │   ├── 1698765432123_south_african_id.pdf
│   │   └── 1698765555444_passport.jpg
│   ├── cipc_registration/
│   │   └── 1698765666777_ck1_certificate.pdf
│   ├── tax_clearance/
│   │   └── 1698765777888_tax_clearance.pdf
│   └── bank_statement/
│       └── 1698765888999_bank_statement.pdf
├── {partner_id_2}/
│   ├── fica_identity/
│   └── ...
└── ...
```

---

## Security Considerations

### Encryption
- All files encrypted at rest by Supabase
- Files transmitted over HTTPS
- No client-side access to raw storage URLs without proper auth

### Access Control
- RLS enforced on all operations
- Partners isolated to own folders
- Admins require specific role templates
- File paths validated before storage

### Audit Trail
- All uploads logged in `partner_compliance_documents` table
- Verification status tracked
- Upload timestamps recorded
- Admin actions logged (verification, rejection)

### Data Retention
- Documents retained for compliance period (7 years recommended)
- Soft delete (mark as deleted, don't remove from storage)
- Future: Implement automated archival policy

---

## Troubleshooting

### Issue: "Policy check violation" on upload

**Cause**: Partner folder doesn't match authenticated user's partner_id

**Solution**:
```sql
-- Check partner record
SELECT id, user_id, business_name
FROM partners
WHERE user_id = auth.uid();

-- Verify auth user
SELECT auth.uid();
```

### Issue: "File size limit exceeded"

**Cause**: File larger than 20MB

**Solution**: Increase bucket file_size_limit if needed:
```sql
UPDATE storage.buckets
SET file_size_limit = 52428800  -- 50MB
WHERE id = 'partner-compliance-documents';
```

### Issue: "MIME type not allowed"

**Cause**: File type not in allowed_mime_types

**Solution**: Add MIME type to bucket:
```sql
UPDATE storage.buckets
SET allowed_mime_types = array_append(allowed_mime_types, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
WHERE id = 'partner-compliance-documents';
```

### Issue: Can't delete approved document

**Cause**: RLS policy prevents deletion of non-pending documents

**Solution**: This is by design. Admin must reject document first, then partner can re-upload.

---

## Monitoring

### Check Storage Usage

```sql
SELECT
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint / 1024 / 1024 as total_size_mb
FROM storage.objects
WHERE bucket_id = 'partner-compliance-documents'
GROUP BY bucket_id;
```

### Check Recent Uploads

```sql
SELECT
  (storage.foldername(name))[1] as partner_id,
  (storage.foldername(name))[2] as category,
  name,
  created_at
FROM storage.objects
WHERE bucket_id = 'partner-compliance-documents'
ORDER BY created_at DESC
LIMIT 20;
```

### Check Verification Status

```sql
SELECT
  verification_status,
  COUNT(*) as document_count
FROM partner_compliance_documents
GROUP BY verification_status;
```

---

## Next Steps

After storage is configured:

1. **Test Upload Flow**: Upload test documents for each category
2. **Admin Verification Interface**: Build admin panel to review documents
3. **Email Notifications**: Notify partners of verification status changes
4. **Document Preview**: Add inline PDF/image viewer
5. **Bulk Operations**: Admin tools for batch approval/rejection

---

**Status**: Ready for implementation
**Last Updated**: 2025-10-27
**Related Files**:
- `app/api/partners/compliance/upload/route.ts`
- `supabase/migrations/20251027000001_create_partners_system.sql`

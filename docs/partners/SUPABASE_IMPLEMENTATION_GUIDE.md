# Supabase Storage Implementation Guide
## Partner Compliance Documents Storage Setup

**Last Updated**: October 27, 2025  
**Status**: Ready to implement  
**Estimated Time**: 15 minutes

---

## Overview

This guide walks you through implementing the `partner-compliance-documents` storage bucket with proper RLS (Row Level Security) policies in Supabase.

### What You'll Create

- ✅ Private storage bucket for partner compliance documents
- ✅ 20MB file size limit
- ✅ Restricted MIME types (PDF, JPG, PNG, ZIP)
- ✅ 4 RLS policies for secure access control

---

## Prerequisites

- [ ] Supabase project access (Dashboard + SQL Editor)
- [ ] Service role key configured in `.env.local`
- [ ] Node.js installed (for verification script)

---

## Step 1: Create the Storage Bucket

### Option A: Via SQL Editor (Recommended)

1. **Open Supabase Dashboard** → Your Project
2. **Navigate to**: SQL Editor (left sidebar)
3. **Create new query**
4. **Copy and paste** the following SQL:

```sql
-- ==================================================
-- CREATE PARTNER COMPLIANCE DOCUMENTS BUCKET
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
  ELSE
    RAISE WARNING '⚠️  Bucket creation may have failed';
  END IF;
END $$;
```

5. **Click "Run"**
6. **Verify output** shows success message

### Option B: Via Dashboard UI

1. **Navigate to**: Storage (left sidebar)
2. **Click**: "New bucket"
3. **Configure**:
   - Name: `partner-compliance-documents`
   - Public: **OFF** (must be private)
   - File size limit: `20971520` (20MB)
   - Allowed MIME types: Add each type:
     - `application/pdf`
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `application/zip`
     - `application/x-zip-compressed`
4. **Click**: "Create bucket"

---

## Step 2: Create RLS Policies

**Important**: Policies MUST be created via Dashboard (SQL policies don't work for storage)

### Navigate to Policies

1. **Go to**: Storage → `partner-compliance-documents` bucket
2. **Click**: "Policies" tab
3. **Click**: "New policy"

---

### Policy 1: Partners Upload Own Documents

**Purpose**: Allow partners to upload documents to their own folder

1. **Click**: "New policy" → "For full customization"
2. **Configure**:
   - **Policy name**: `partners_upload_own_compliance_documents`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
3. **WITH CHECK expression**:
```sql
bucket_id = 'partner-compliance-documents' AND auth.uid() IN (SELECT user_id FROM partners WHERE id::text = (storage.foldername(name))[1])
```
4. **Click**: "Review" → "Save policy"

---

### Policy 2: Partners View Own Documents

**Purpose**: Allow partners to view/download their own documents

1. **Click**: "New policy" → "For full customization"
2. **Configure**:
   - **Policy name**: `partners_view_own_compliance_documents`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `authenticated`
3. **USING expression**:
```sql
bucket_id = 'partner-compliance-documents' AND auth.uid() IN (SELECT user_id FROM partners WHERE id::text = (storage.foldername(name))[1])
```
4. **Click**: "Review" → "Save policy"

---

### Policy 3: Partners Delete Own Unverified Documents

**Purpose**: Allow partners to delete only pending (unverified) documents

1. **Click**: "New policy" → "For full customization"
2. **Configure**:
   - **Policy name**: `partners_delete_own_unverified_compliance_documents`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
3. **USING expression**:
```sql
bucket_id = 'partner-compliance-documents' AND auth.uid() IN (SELECT user_id FROM partners WHERE id::text = (storage.foldername(name))[1]) AND EXISTS (SELECT 1 FROM partner_compliance_documents WHERE file_path = name AND verification_status = 'pending')
```
4. **Click**: "Review" → "Save policy"

---

### Policy 4: Admins Access All Documents

**Purpose**: Allow authorized admins to access all partner documents

1. **Click**: "New policy" → "For full customization"
2. **Configure**:
   - **Policy name**: `admins_access_all_compliance_documents`
   - **Allowed operation**: `ALL`
   - **Target roles**: `authenticated`
3. **USING expression**:
```sql
bucket_id = 'partner-compliance-documents' AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role_template_id IN (SELECT id FROM role_templates WHERE name IN ('Super Administrator', 'Sales Manager', 'Compliance Officer')))
```
4. **WITH CHECK expression** (same as USING):
```sql
bucket_id = 'partner-compliance-documents' AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role_template_id IN (SELECT id FROM role_templates WHERE name IN ('Super Administrator', 'Sales Manager', 'Compliance Officer')))
```
5. **Click**: "Review" → "Save policy"

---

## Step 3: Verify Configuration

### Run Verification Script

```bash
node scripts/test-storage-bucket.js
```

### Expected Output

```
🔍 Testing Storage Bucket Configuration...

📋 Test 1: Bucket exists
   ✅ PASS: Bucket exists
      - Name: partner-compliance-documents
      - Public: No ✅
      - File size limit: 20MB

📋 Test 2: Bucket RLS configuration
   ✅ PASS: Bucket accessible via service role
      - Files found: 0

📋 Test 3: Allowed file types
   ✅ PASS: All required MIME types configured
      - Allowed: application/pdf, image/jpeg, image/jpg, image/png, application/zip, application/x-zip-compressed

📋 Test 4: Storage policies
   ℹ️  Policies must be created via Supabase Dashboard
   ℹ️  Required policies:
      1. partners_upload_own_compliance_documents (INSERT)
      2. partners_view_own_compliance_documents (SELECT)
      3. partners_delete_own_unverified_compliance_documents (DELETE)
      4. admins_access_all_compliance_documents (ALL)

============================================================
✅ BUCKET CONFIGURATION LOOKS GOOD!

📋 Next Steps:
1. Create 4 storage policies (via Dashboard)
2. Test document upload at /partners/onboarding/verify
3. Verify RLS isolation (partners can only see own files)
============================================================
```

---

## Step 4: Test in Application

### Test Partner Upload

1. **Navigate to**: `/partners/onboarding/verify`
2. **Login as**: Test partner account
3. **Upload**: Sample PDF or image
4. **Verify**: Document appears in partner's list

### Test Admin Access

1. **Login as**: Admin user (Super Administrator, Sales Manager, or Compliance Officer)
2. **Navigate to**: Admin dashboard → Partners → Compliance Documents
3. **Verify**: Can view all partner documents

### Test RLS Isolation

1. **Login as**: Partner A
2. **Upload**: Document
3. **Logout** → **Login as**: Partner B
4. **Verify**: Partner B cannot see Partner A's documents

---

## Troubleshooting

### Issue: "Bucket not found"

**Solution**: Re-run Step 1 SQL script or create bucket via Dashboard

### Issue: "Permission denied" when uploading

**Causes**:
- Policies not created correctly
- User not authenticated
- Partner record missing `user_id`

**Solution**:
1. Verify all 4 policies exist in Dashboard
2. Check policy expressions match exactly (no typos)
3. Verify partner has valid `user_id` linked to auth user

### Issue: "File type not allowed"

**Solution**: Add missing MIME type to bucket configuration:
1. Storage → `partner-compliance-documents` → Configuration
2. Add MIME type to allowed list
3. Save changes

### Issue: Admin cannot access documents

**Causes**:
- Admin user not in correct role
- Role template name mismatch

**Solution**:
1. Verify admin has one of: Super Administrator, Sales Manager, Compliance Officer
2. Check `role_templates` table for exact role names
3. Update Policy 4 if role names differ

---

## Security Notes

### RLS Enforcement

- ✅ Bucket is **private** (public = false)
- ✅ All access controlled by RLS policies
- ✅ Partners can only access their own folder
- ✅ Admins require specific role templates

### File Path Structure

Documents are stored with this path structure:
```
{partner_id}/{document_type}_{timestamp}.{extension}
```

Example: `123e4567-e89b-12d3-a456-426614174000/cipc_1698420000000.pdf`

### Folder Isolation

The `storage.foldername(name)[1]` function extracts the partner ID from the file path, ensuring partners can only access files in their own folder.

---

## Related Files

- **SQL Script**: `supabase/storage/01_create_bucket_only.sql`
- **Dashboard Guide**: `docs/partners/STORAGE_POLICIES_DASHBOARD.md`
- **Test Script**: `scripts/test-storage-bucket.js`
- **Partner Onboarding**: `app/partners/onboarding/verify/page.tsx`

---

## Checklist

Use this checklist to track your progress:

- [ ] Step 1: Bucket created (via SQL or Dashboard)
- [ ] Step 2.1: Policy 1 created (partners upload)
- [ ] Step 2.2: Policy 2 created (partners view)
- [ ] Step 2.3: Policy 3 created (partners delete unverified)
- [ ] Step 2.4: Policy 4 created (admins access all)
- [ ] Step 3: Verification script passed
- [ ] Step 4.1: Partner upload test passed
- [ ] Step 4.2: Admin access test passed
- [ ] Step 4.3: RLS isolation test passed

---

## Support

If you encounter issues:

1. **Check logs**: Supabase Dashboard → Logs → Storage
2. **Verify policies**: Storage → Policies tab
3. **Test with service role**: Use `test-storage-bucket.js`
4. **Review documentation**: Supabase Storage RLS docs

---

**Status**: ✅ Ready to implement  
**Next**: Run Step 1 in Supabase SQL Editor

# Supabase Storage Setup - Dashboard Method

**Date**: 2025-10-27
**Purpose**: Configure partner compliance document storage via Supabase Dashboard
**Why Dashboard**: Avoids permission issues with SQL-based policy creation

---

## Overview

Setting up storage via the Dashboard is **recommended** because:
- ✅ No superuser permissions required
- ✅ Visual policy builder
- ✅ Automatic syntax validation
- ✅ Easier to troubleshoot

---

## Step 1: Create Storage Bucket

1. Open **Supabase Dashboard** → **Storage**
2. Click **"New bucket"** button
3. Fill in bucket details:

```
Name: partner-compliance-documents
Public bucket: OFF (keep private)
File size limit: 20 MB
Allowed MIME types:
  - application/pdf
  - image/jpeg
  - image/jpg
  - image/png
  - application/zip
  - application/x-zip-compressed
```

4. Click **"Create bucket"**

---

## Step 2: Enable RLS on Bucket

1. In Storage, click on `partner-compliance-documents` bucket
2. Click **"Policies"** tab
3. You should see "Row Level Security is enabled for this bucket"
4. If not, click **"Enable RLS"**

---

## Step 3: Create Storage Policies (4 Total)

### Policy 1: Partners Upload Own Documents

**Policy Name**: `partners_upload_own_compliance_documents`

1. Click **"New Policy"**
2. Select **"For full customization"** (not template)
3. Fill in:

```
Policy name: partners_upload_own_compliance_documents
Allowed operation: INSERT
Target roles: authenticated

USING expression (leave empty)

WITH CHECK expression:
bucket_id = 'partner-compliance-documents'
AND auth.uid() IN (
  SELECT user_id FROM partners
  WHERE id::text = (storage.foldername(name))[1]
)
```

4. Click **"Review"** → **"Save policy"**

---

### Policy 2: Partners View Own Documents

**Policy Name**: `partners_view_own_compliance_documents`

1. Click **"New Policy"**
2. Select **"For full customization"**
3. Fill in:

```
Policy name: partners_view_own_compliance_documents
Allowed operation: SELECT
Target roles: authenticated

USING expression:
bucket_id = 'partner-compliance-documents'
AND auth.uid() IN (
  SELECT user_id FROM partners
  WHERE id::text = (storage.foldername(name))[1]
)

WITH CHECK expression (leave empty)
```

4. Click **"Review"** → **"Save policy"**

---

### Policy 3: Partners Delete Own Unverified Documents

**Policy Name**: `partners_delete_own_unverified_compliance_documents`

1. Click **"New Policy"**
2. Select **"For full customization"**
3. Fill in:

```
Policy name: partners_delete_own_unverified_compliance_documents
Allowed operation: DELETE
Target roles: authenticated

USING expression:
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

WITH CHECK expression (leave empty)
```

4. Click **"Review"** → **"Save policy"**

---

### Policy 4: Admins Access All Documents

**Policy Name**: `admins_access_all_compliance_documents`

1. Click **"New Policy"**
2. Select **"For full customization"**
3. Fill in:

```
Policy name: admins_access_all_compliance_documents
Allowed operation: ALL
Target roles: authenticated

USING expression:
bucket_id = 'partner-compliance-documents'
AND EXISTS (
  SELECT 1 FROM admin_users
  WHERE id = auth.uid()
  AND role_template_id IN (
    SELECT id FROM role_templates
    WHERE name IN ('Super Administrator', 'Sales Manager', 'Compliance Officer')
  )
)

WITH CHECK expression: (same as USING expression)
bucket_id = 'partner-compliance-documents'
AND EXISTS (
  SELECT 1 FROM admin_users
  WHERE id = auth.uid()
  AND role_template_id IN (
    SELECT id FROM role_templates
    WHERE name IN ('Super Administrator', 'Sales Manager', 'Compliance Officer')
  )
)
```

4. Click **"Review"** → **"Save policy"**

---

## Step 4: Verify Policies

1. Go to **Storage** → `partner-compliance-documents` → **Policies** tab
2. You should see **4 policies**:
   - ✅ `partners_upload_own_compliance_documents` (INSERT)
   - ✅ `partners_view_own_compliance_documents` (SELECT)
   - ✅ `partners_delete_own_unverified_compliance_documents` (DELETE)
   - ✅ `admins_access_all_compliance_documents` (ALL)

---

## Step 5: Test Storage Setup

### Test 1: Check Bucket Exists

Run this script:

```bash
node scripts/test-storage-bucket.js
```

### Test 2: Test Partner Upload (Manual)

1. Start dev server: `npm run dev:memory`
2. Register partner: `http://localhost:3000/partners/onboarding/register`
3. Go to document upload: `http://localhost:3000/partners/onboarding/verify`
4. Upload a test PDF (< 20MB)
5. Check Supabase Dashboard → Storage → `partner-compliance-documents`
6. Verify file appears in: `{partner_id}/{category}/{timestamp}_{filename}`

### Test 3: Verify RLS Protection

Try to access another partner's folder:
- Should fail with RLS policy violation
- Partners can only see their own folder

---

## Troubleshooting

### "Policy check violation" on upload

**Cause**: Partner folder doesn't match authenticated user's partner_id

**Check**:
1. Partner record exists for logged-in user
2. File path starts with correct partner_id
3. User is authenticated

**SQL Check**:
```sql
-- Find partner_id for current user
SELECT id, user_id, business_name
FROM partners
WHERE user_id = auth.uid();
```

### "Row Level Security is disabled"

**Fix**:
1. Go to Storage → Policies
2. Click "Enable RLS"
3. Re-create policies

### "Bucket not found"

**Fix**:
1. Verify bucket name is exactly: `partner-compliance-documents`
2. Check Storage → Buckets list
3. Re-create bucket if needed

### "File size limit exceeded"

**Current Limit**: 20MB

**To Increase**:
1. Go to Storage → `partner-compliance-documents`
2. Click **"Settings"** (gear icon)
3. Update "File size limit"
4. Save

### "MIME type not allowed"

**Current Allowed**:
- application/pdf
- image/jpeg
- image/jpg
- image/png
- application/zip
- application/x-zip-compressed

**To Add More**:
1. Go to Storage → `partner-compliance-documents` → Settings
2. Add MIME type to "Allowed MIME types"
3. Save

---

## Folder Structure

After uploads, your bucket will look like:

```
partner-compliance-documents/
├── {partner_id_1}/
│   ├── fica_identity/
│   │   └── 1698765432123_id_document.pdf
│   ├── cipc_registration/
│   │   └── 1698765555444_ck1_certificate.pdf
│   ├── tax_clearance/
│   │   └── 1698765666777_tax_clearance.pdf
│   └── bank_statement/
│       └── 1698765777888_statement.pdf
├── {partner_id_2}/
│   └── ...
```

**Path Format**: `{partner_id}/{category}/{timestamp}_{filename}`

---

## Security Features

### Encryption
- ✅ Files encrypted at rest by Supabase
- ✅ Files transmitted over HTTPS
- ✅ No direct URL access without auth

### Access Control
- ✅ RLS enforced on all operations
- ✅ Partners isolated to own folders
- ✅ Admins require specific role templates
- ✅ File paths validated before storage

### Audit Trail
- ✅ All uploads logged in `partner_compliance_documents` table
- ✅ Verification status tracked
- ✅ Upload timestamps recorded
- ✅ Admin actions logged

---

## Quick Verification Checklist

After completing setup:

- [ ] Bucket `partner-compliance-documents` exists
- [ ] Bucket is private (not public)
- [ ] File size limit is 20MB
- [ ] Allowed MIME types include PDF, JPG, PNG, ZIP
- [ ] RLS is enabled on bucket
- [ ] 4 storage policies exist
- [ ] Policy names match exactly
- [ ] Test upload succeeds
- [ ] Test RLS isolation (partner can't see other's files)
- [ ] Admin can access all files

---

## Next Steps After Setup

1. **Test Document Upload**
   - Register test partner
   - Upload documents for all categories
   - Verify progress tracking works

2. **Create Partner Approval Workflow**
   - Admin API endpoints
   - Partner number generation
   - Email notifications

3. **Build Admin Compliance Review UI**
   - View uploaded documents
   - Approve/reject with notes
   - Bulk operations

---

## Support Resources

| Resource | Location |
|----------|----------|
| Upload Component | `app/partners/onboarding/verify/page.tsx` |
| Upload API | `app/api/partners/compliance/upload/route.ts` |
| Requirements Logic | `lib/partners/compliance-requirements.ts` |
| Test Script | `scripts/test-storage-bucket.js` (create this next) |

---

**Status**: Ready to configure
**Time Required**: ~10 minutes
**Permissions Needed**: Supabase project admin/owner

---

**Questions?** Check the original SQL-based guide: `SUPABASE_STORAGE_SETUP.md`

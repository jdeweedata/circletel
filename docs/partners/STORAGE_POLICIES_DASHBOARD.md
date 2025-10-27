# Storage Policies - Quick Dashboard Guide

**Run this AFTER** creating the bucket with `supabase/storage/01_create_bucket_only.sql`

---

## Create 4 Policies in Supabase Dashboard

Go to: **Storage** → `partner-compliance-documents` → **Policies** tab

---

### Policy 1: Partners Upload Own Documents

```
Name: partners_upload_own_compliance_documents
Operation: INSERT
Target roles: authenticated
```

**WITH CHECK expression**:
```sql
bucket_id = 'partner-compliance-documents' AND auth.uid() IN (SELECT user_id FROM partners WHERE id::text = (storage.foldername(name))[1])
```

---

### Policy 2: Partners View Own Documents

```
Name: partners_view_own_compliance_documents
Operation: SELECT
Target roles: authenticated
```

**USING expression**:
```sql
bucket_id = 'partner-compliance-documents' AND auth.uid() IN (SELECT user_id FROM partners WHERE id::text = (storage.foldername(name))[1])
```

---

### Policy 3: Partners Delete Own Unverified Documents

```
Name: partners_delete_own_unverified_compliance_documents
Operation: DELETE
Target roles: authenticated
```

**USING expression**:
```sql
bucket_id = 'partner-compliance-documents' AND auth.uid() IN (SELECT user_id FROM partners WHERE id::text = (storage.foldername(name))[1]) AND EXISTS (SELECT 1 FROM partner_compliance_documents WHERE file_path = name AND verification_status = 'pending')
```

---

### Policy 4: Admins Access All Documents

```
Name: admins_access_all_compliance_documents
Operation: ALL
Target roles: authenticated
```

**USING expression**:
```sql
bucket_id = 'partner-compliance-documents' AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role_template_id IN (SELECT id FROM role_templates WHERE name IN ('Super Administrator', 'Sales Manager', 'Compliance Officer')))
```

**WITH CHECK expression** (same as USING):
```sql
bucket_id = 'partner-compliance-documents' AND EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role_template_id IN (SELECT id FROM role_templates WHERE name IN ('Super Administrator', 'Sales Manager', 'Compliance Officer')))
```

---

## Quick Steps

1. **Run SQL**: `supabase/storage/01_create_bucket_only.sql` in SQL Editor
2. **Go to Dashboard**: Storage → partner-compliance-documents → Policies
3. **Create 4 policies** (copy expressions above)
4. **Verify**: `node scripts/test-storage-bucket.js`
5. **Test**: Upload document at `/partners/onboarding/verify`

---

## Verification

After creating policies, run:
```bash
node scripts/test-storage-bucket.js
```

Should show:
- ✅ Bucket exists
- ✅ Bucket is private
- ✅ 4 policies created

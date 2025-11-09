# Supabase Storage Bucket Setup for FICA/RICA Documents

**Created:** 2025-11-08
**Purpose:** Configure secure storage for customer compliance documents

---

## 📦 Storage Bucket Configuration

### **1. Create Storage Bucket**

Navigate to Supabase Dashboard:
```
https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/storage/buckets
```

**Bucket Settings:**
- **Name:** `compliance-documents`
- **Public:** `false` (Private bucket - requires authentication)
- **File Size Limit:** `5MB` (5,242,880 bytes)
- **Allowed MIME Types:** `application/pdf`, `image/jpeg`, `image/jpg`, `image/png`

**Create Bucket SQL:**
```sql
-- This is done via Supabase Dashboard UI
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'compliance-documents',
  'compliance-documents',
  false, -- Private
  5242880, -- 5MB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
);
```

---

## 🔐 Storage Policies (RLS)

### **Policy 1: Customers can upload to their own folder**

```sql
CREATE POLICY "Customers can upload own compliance docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'compliance-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Explanation:**
- Customers can only upload to folders starting with their customer ID
- Path format: `{customer_id}/{order_id}/...`

---

### **Policy 2: Customers can view their own documents**

```sql
CREATE POLICY "Customers can view own compliance docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

### **Policy 3: Customers can delete their own pending documents**

```sql
CREATE POLICY "Customers can delete own pending compliance docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Note:** Additional check in API ensures only `pending` documents can be deleted

---

### **Policy 4: Admins can access all documents**

```sql
CREATE POLICY "Admins can access all compliance docs"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'compliance-documents'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.role IN ('super_admin', 'admin', 'compliance_officer')
  )
);
```

---

## 📁 Storage Path Structure

### **Path Format:**
```
{customer_id}/{order_id}/{category}/{document_type}/{filename}
```

### **Example Paths:**

#### FICA Documents:
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890/
  ├─ order-uuid-1/
  │  ├─ fica/
  │  │  ├─ id_document/
  │  │  │  └─ south_african_id_1699999999.pdf
  │  │  └─ proof_of_address/
  │  │     └─ utility_bill_1699999999.pdf
```

#### RICA Documents:
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890/
  ├─ order-uuid-1/
  │  ├─ rica/
  │  │  ├─ id_document/
  │  │  │  └─ south_african_id_1699999999.pdf
  │  │  └─ proof_of_residence/
  │  │     └─ lease_agreement_1699999999.pdf
```

---

## 🛡️ Security Features

### **1. Authentication Required**
- All access requires valid Supabase authentication token
- No anonymous access allowed (public: false)

### **2. Customer Isolation**
- Customers can only access files in their own folder
- Enforced via RLS policies using `auth.uid()`

### **3. File Type Validation**
- Only PDF, JPG, and PNG files allowed
- Enforced at bucket level

### **4. File Size Limits**
- Maximum 5MB per file (configurable)
- Prevents storage abuse

### **5. Audit Trail**
- All uploads tracked in `compliance_documents` table
- Includes upload timestamp, customer ID, order ID

---

## 📊 Storage Monitoring

### **Query: Storage Usage by Customer**

```sql
SELECT
  (storage.foldername(name))[1] AS customer_id,
  COUNT(*) AS file_count,
  SUM(metadata->>'size')::BIGINT AS total_bytes,
  ROUND(SUM(metadata->>'size')::BIGINT / 1024.0 / 1024.0, 2) AS total_mb
FROM storage.objects
WHERE bucket_id = 'compliance-documents'
GROUP BY customer_id
ORDER BY total_bytes DESC;
```

### **Query: Storage Usage by Document Type**

```sql
SELECT
  (storage.foldername(name))[3] AS category,
  (storage.foldername(name))[4] AS document_type,
  COUNT(*) AS file_count,
  ROUND(SUM(metadata->>'size')::BIGINT / 1024.0 / 1024.0, 2) AS total_mb
FROM storage.objects
WHERE bucket_id = 'compliance-documents'
GROUP BY category, document_type
ORDER BY total_mb DESC;
```

### **Query: Recent Uploads**

```sql
SELECT
  name,
  created_at,
  metadata->>'size' AS file_size,
  metadata->>'mimetype' AS mime_type
FROM storage.objects
WHERE bucket_id = 'compliance-documents'
ORDER BY created_at DESC
LIMIT 50;
```

---

## 🧹 Cleanup / Maintenance

### **Delete Old Rejected Documents (>90 days)**

```sql
-- First, delete from storage
DELETE FROM storage.objects
WHERE bucket_id = 'compliance-documents'
AND name IN (
  SELECT file_path
  FROM compliance_documents
  WHERE status = 'rejected'
  AND reviewed_at < NOW() - INTERVAL '90 days'
);

-- Then, delete database records
DELETE FROM compliance_documents
WHERE status = 'rejected'
AND reviewed_at < NOW() - INTERVAL '90 days';
```

### **Delete Orphaned Files (no database record)**

```sql
-- Find orphaned files
SELECT name, created_at
FROM storage.objects
WHERE bucket_id = 'compliance-documents'
AND name NOT IN (
  SELECT file_path FROM compliance_documents
)
AND created_at < NOW() - INTERVAL '7 days';

-- Delete orphaned files (be careful!)
DELETE FROM storage.objects
WHERE bucket_id = 'compliance-documents'
AND name NOT IN (
  SELECT file_path FROM compliance_documents
)
AND created_at < NOW() - INTERVAL '7 days';
```

---

## 🚀 Setup Checklist

- [ ] **1. Create `compliance-documents` bucket** (via Supabase Dashboard or SQL)
- [ ] **2. Set bucket to private** (`public: false`)
- [ ] **3. Set file size limit** (5MB)
- [ ] **4. Set allowed MIME types** (PDF, JPG, PNG)
- [ ] **5. Create RLS policy:** Customers upload own docs
- [ ] **6. Create RLS policy:** Customers view own docs
- [ ] **7. Create RLS policy:** Customers delete own pending docs
- [ ] **8. Create RLS policy:** Admins access all docs
- [ ] **9. Test upload** (via customer dashboard)
- [ ] **10. Test download** (via admin panel)
- [ ] **11. Verify RLS** (customer cannot access other customer's files)
- [ ] **12. Set up monitoring** (storage usage dashboard)

---

## 🧪 Testing

### **Test 1: Customer Upload**

```bash
# Log in as customer
# Navigate to /dashboard/compliance
# Upload FICA ID document
# Verify file appears in storage:
# compliance-documents/{customer_id}/{order_id}/fica/id_document/filename.pdf
```

### **Test 2: RLS Enforcement**

```sql
-- Log in as Customer A
-- Try to access Customer B's file
SELECT * FROM storage.objects
WHERE bucket_id = 'compliance-documents'
AND (storage.foldername(name))[1] = 'customer-b-id';

-- Should return 0 rows (blocked by RLS)
```

### **Test 3: File Type Validation**

```bash
# Try to upload .exe file
# Should be rejected: "Invalid file type"

# Try to upload 10MB PDF
# Should be rejected: "File size exceeds 5MB limit"
```

### **Test 4: Admin Access**

```sql
-- Log in as admin user
-- Should be able to access all files
SELECT * FROM storage.objects
WHERE bucket_id = 'compliance-documents';

-- Should return all files
```

---

## 📞 Troubleshooting

### **Issue: "Storage bucket not found"**

**Solution:** Create bucket via Supabase Dashboard:
```
Settings > Storage > New Bucket
```

### **Issue: "Permission denied" when uploading**

**Solution:** Check RLS policies are created:
```sql
SELECT * FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';
```

### **Issue: Files not appearing after upload**

**Solution:** Check:
1. Bucket name is `compliance-documents`
2. Path format: `{customer_id}/{order_id}/{category}/{document_type}/{filename}`
3. Customer is authenticated

### **Issue: Customer can see other customers' files**

**Solution:** Verify RLS policy uses `auth.uid()`:
```sql
-- Policy should have:
(storage.foldername(name))[1] = auth.uid()::text
```

---

## 🔗 Related Documentation

- **Database Migration:** `supabase/migrations/20251108090000_create_compliance_documents_table.sql`
- **File Upload Utility:** `lib/utils/file-upload.ts`
- **Upload Component:** `components/dashboard/ComplianceUploadForm.tsx`
- **API Endpoint:** `app/api/compliance/upload/route.ts`

---

**Last Updated:** 2025-11-08
**Version:** 1.0
**Status:** Ready for Implementation

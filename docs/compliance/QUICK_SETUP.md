# FICA/RICA Quick Setup Guide

**Using Existing `kyc-documents` Bucket**

---

## ✅ **Step 1: Apply Database Migration**

```bash
psql $DATABASE_URL -f supabase/migrations/20251108090000_create_compliance_documents_table.sql
```

**What this creates:**
- `compliance_documents` table
- 6 indexes for performance
- 2 views: `v_order_compliance_summary`, `v_pending_compliance_reviews`
- 2 functions: `get_order_compliance_status()`, `has_required_compliance_documents()`
- RLS policies for customers and admins

---

## ✅ **Step 2: Verify Storage Bucket Policies**

Your existing `kyc-documents` bucket needs these RLS policies. Let's check if they exist:

```sql
-- Check existing policies on storage.objects
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND qual LIKE '%kyc-documents%';
```

### **Required Policies:**

Run these SQL commands to add the necessary policies (skip any that already exist):

#### **Policy 1: Customers can upload to their own folder**
```sql
CREATE POLICY "Customers can upload own kyc docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### **Policy 2: Customers can view their own documents**
```sql
CREATE POLICY "Customers can view own kyc docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### **Policy 3: Customers can delete their own pending documents**
```sql
CREATE POLICY "Customers can delete own pending kyc docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### **Policy 4: Admins can access all documents**
```sql
CREATE POLICY "Admins can access all kyc docs"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.role IN ('super_admin', 'admin', 'compliance_officer')
  )
);
```

---

## ✅ **Step 3: Verify Bucket Settings**

Check your bucket configuration:

1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/storage/buckets/kyc-documents
2. Click the "..." menu → "Edit bucket"
3. Verify:
   - **Public:** `false` (private bucket) ✅
   - **File size limit:** `5MB` or higher ✅
   - **Allowed MIME types:** `application/pdf`, `image/jpeg`, `image/jpg`, `image/png` ✅

---

## ✅ **Step 4: Test Upload**

### **Test 1: Set Shaun's Order to KYC Pending**

```sql
UPDATE consumer_orders
SET status = 'kyc_pending'
WHERE order_number = 'ORD-20251108-9841';
```

### **Test 2: Upload Documents**

1. Log in as Shaun: `shaunr07@gmail.com`
2. Navigate to: `http://localhost:3000/dashboard/compliance`
3. Upload FICA ID document (PDF, < 5MB)
4. Verify file appears in "Uploaded FICA Documents"

### **Test 3: Verify in Database**

```sql
-- Check document was saved
SELECT
  category,
  document_type,
  file_name,
  status,
  uploaded_at
FROM compliance_documents
WHERE order_id = (
  SELECT id FROM consumer_orders
  WHERE order_number = 'ORD-20251108-9841'
);
```

### **Test 4: Verify in Storage**

1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/storage/buckets/kyc-documents
2. Navigate to: `{customer_id}/{order_id}/fica/id_document/`
3. Verify file is there

---

## ✅ **Step 5: Test Complete Flow**

```sql
-- 1. Upload all 4 required documents via UI:
--    - FICA: ID document + proof of address
--    - RICA: ID document + proof of residence

-- 2. Check compliance status
SELECT * FROM get_order_compliance_status(
  (SELECT id FROM consumer_orders WHERE order_number = 'ORD-20251108-9841')
);

-- Expected result:
-- fica_complete: true (if 2 FICA docs uploaded and approved)
-- rica_complete: true (if 2 RICA docs uploaded and approved)
-- overall_complete: true (if all 4 docs approved)
-- pending_count: 4 (if all docs are pending review)
-- rejected_count: 0
```

---

## 🚀 **That's It!**

Your FICA/RICA upload system is now ready to use with your existing `kyc-documents` bucket.

**Next Steps:**
1. ✅ Apply migration
2. ✅ Add RLS policies (if not already there)
3. ✅ Test with Shaun's order
4. ⏳ Build admin review interface
5. ⏳ Test complete workflow

---

## 📝 **Storage Path Structure**

Files will be organized as:
```
kyc-documents/
  {customer_id}/
    {order_id}/
      fica/
        id_document/
          filename_timestamp.pdf
        proof_of_address/
          filename_timestamp.pdf
      rica/
        id_document/
          filename_timestamp.pdf
        proof_of_residence/
          filename_timestamp.pdf
```

---

## 🔗 **Related Documentation**

- Full setup: `docs/compliance/STORAGE_BUCKET_SETUP.md` (adapt bucket name to `kyc-documents`)
- Implementation summary: `docs/compliance/FICA_RICA_IMPLEMENTATION_SUMMARY.md`
- Workflow spec: `docs/workflows/NEW_ORDER_WORKFLOW_PRORATA.md`

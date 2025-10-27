# Supabase Storage Setup for Partner KYC Documents

**Document Version**: 1.0
**Date**: 2025-10-27
**Related**: Sales Partner Implementation (Phase 1)

---

## Overview

This document provides instructions for setting up Supabase Storage bucket for partner KYC documents. This is required for the Sales Partner portal onboarding flow.

---

## Bucket Configuration

### Step 1: Create Storage Bucket

1. Log into Supabase Dashboard: https://supabase.com/dashboard
2. Select project: `agyjovdugmtopasyvlng`
3. Navigate to **Storage** in left sidebar
4. Click **Create a new bucket**
5. Configure bucket:

```
Bucket Name: partner-kyc-documents
Public: No (Private bucket)
File Size Limit: 10 MB
Allowed MIME types:
  - application/pdf
  - image/jpeg
  - image/jpg
  - image/png
```

### Step 2: Configure RLS Policies

After creating the bucket, set up Row Level Security policies:

```sql
-- Allow partners to upload documents to their own folder
CREATE POLICY "Partners can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-kyc-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM partners WHERE user_id = auth.uid()
  )
);

-- Allow partners to view own documents
CREATE POLICY "Partners can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'partner-kyc-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM partners WHERE user_id = auth.uid()
  )
);

-- Allow partners to delete own unverified documents
CREATE POLICY "Partners can delete own unverified documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'partner-kyc-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM partners p
    LEFT JOIN partner_kyc_documents d ON d.partner_id = p.id AND d.file_path = name
    WHERE p.user_id = auth.uid()
    AND (d.verification_status IS NULL OR d.verification_status = 'pending')
  )
);

-- Allow admins to view all documents
CREATE POLICY "Admins can view all partner documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'partner-kyc-documents'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role_template_id IN (
      SELECT id FROM role_templates
      WHERE name IN ('Super Administrator', 'Sales Manager')
    )
  )
);

-- Allow admins to manage all documents
CREATE POLICY "Admins can manage all partner documents"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'partner-kyc-documents'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role_template_id IN (
      SELECT id FROM role_templates
      WHERE name IN ('Super Administrator', 'Sales Manager')
    )
  )
)
WITH CHECK (
  bucket_id = 'partner-kyc-documents'
  AND EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role_template_id IN (
      SELECT id FROM role_templates
      WHERE name IN ('Super Administrator', 'Sales Manager')
    )
  )
);
```

---

## File Structure

Documents are organized by partner ID:

```
partner-kyc-documents/
  ├── {partner-id-1}/
  │   ├── id_document_1730000000000_passport.pdf
  │   ├── proof_of_address_1730000000000_utility_bill.pdf
  │   └── business_registration_1730000000000_certificate.pdf
  ├── {partner-id-2}/
  │   ├── id_document_1730000000001_id_card.jpg
  │   └── proof_of_address_1730000000001_bank_statement.pdf
  └── ...
```

### File Naming Convention

```
{document_type}_{timestamp}_{original_filename}
```

Example:
```
id_document_1730025600000_passport_scan.pdf
proof_of_address_1730025601000_utility_bill.pdf
```

---

## Security Considerations

### Encryption
- All files stored in Supabase Storage are encrypted at rest
- Banking details in `partners` table should use database-level encryption (future enhancement)

### Access Control
- Partners can only access their own documents
- Admins (Super Admin, Sales Manager) can access all documents
- RLS policies enforce access at database level
- Additional permission checks in API routes

### File Validation
API routes should validate:
- File size (max 10MB)
- File type (PDF, JPG, PNG only)
- Document type is required
- Partner ownership

Example validation:
```typescript
// In upload API route
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

if (file.size > MAX_FILE_SIZE) {
  return NextResponse.json({ error: 'File too large' }, { status: 400 })
}

if (!ALLOWED_TYPES.includes(file.type)) {
  return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
}
```

---

## Testing Checklist

After setup, verify the following:

### Partner Upload Test
- [ ] Partner can upload ID document
- [ ] Partner can upload proof of address
- [ ] Partner can view own uploaded documents
- [ ] Partner cannot view other partners' documents
- [ ] Partner can delete own unverified documents
- [ ] Partner cannot delete verified documents
- [ ] File size limit (10MB) is enforced
- [ ] Invalid file types are rejected

### Admin Access Test
- [ ] Admin can view all partner documents
- [ ] Admin can download partner documents
- [ ] Admin can delete documents if needed
- [ ] RLS policies prevent unauthorized access

### Security Test
- [ ] Direct URL access without auth token fails
- [ ] Authenticated user without permission cannot access
- [ ] File URLs expire (time-limited signed URLs)

---

## API Usage Examples

### Upload Document (Client-side)

```typescript
const uploadDocument = async (partnerId: string, file: File, documentType: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('document_type', documentType)

  const response = await fetch('/api/partners/kyc/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Upload failed')
  }

  return await response.json()
}
```

### Get Signed URL for Download

```typescript
import { createClient } from '@/lib/supabase/client'

const getDocumentUrl = async (filePath: string) => {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from('partner-kyc-documents')
    .createSignedUrl(filePath, 60 * 60) // 1 hour expiry

  if (error) throw error
  return data.signedUrl
}
```

---

## Troubleshooting

### Common Issues

**Issue**: "New row violates row-level security policy"
**Solution**: Verify RLS policies are created correctly and user has proper auth token

**Issue**: "File upload fails silently"
**Solution**: Check browser console for CORS errors, verify bucket is created

**Issue**: "403 Forbidden when accessing files"
**Solution**: Ensure signed URLs are used, check RLS policies match user permissions

---

## Monitoring

### Storage Usage
Monitor storage usage in Supabase Dashboard:
- Storage > Usage
- Set up alerts for approaching limits
- Review file count and total size regularly

### Audit Trail
Track document uploads and verifications:
```sql
-- Query recent uploads
SELECT
  d.*,
  p.business_name,
  p.email
FROM partner_kyc_documents d
JOIN partners p ON p.id = d.partner_id
WHERE d.uploaded_at > NOW() - INTERVAL '7 days'
ORDER BY d.uploaded_at DESC;

-- Query verification status
SELECT
  verification_status,
  COUNT(*) as count
FROM partner_kyc_documents
GROUP BY verification_status;
```

---

## Maintenance

### Regular Tasks
- **Weekly**: Review pending verifications
- **Monthly**: Archive verified documents older than 2 years
- **Quarterly**: Security audit of RLS policies
- **Annually**: Review storage costs and optimize

### Cleanup Script
```sql
-- Delete rejected documents older than 90 days
DELETE FROM partner_kyc_documents
WHERE verification_status = 'rejected'
  AND uploaded_at < NOW() - INTERVAL '90 days';
```

---

## Next Steps

After completing storage setup:

1. Apply database migration: `20251027000001_create_partners_system.sql`
2. Test storage policies with test partner account
3. Implement upload API route: `/api/partners/kyc/upload`
4. Build upload UI component: `components/partners/onboarding/KYCUpload.tsx`
5. Configure file validation and virus scanning (future enhancement)

---

## Support

For issues or questions:
- Supabase Docs: https://supabase.com/docs/guides/storage
- Supabase Support: https://supabase.com/support
- CircleTel Dev Team: [internal contact]

---

**Status**: ✅ Ready for Implementation
**Last Updated**: 2025-10-27
**Maintained By**: Development Team

# Partner Compliance Migration Instructions

**Date**: 2025-10-27
**Migration Files**:
- `supabase/migrations/20251027100001_rename_kyc_to_compliance.sql`
- `supabase/migrations/20251027100002_fix_compliance_migration.sql`

---

## Overview

This migration renames all "KYC" terminology to "Compliance" (FICA/CIPC) and adds new fields for partner management:

**Changes**:
- ✅ `partners.kyc_status` → `partners.compliance_status`
- ✅ `partners.kyc_verified_at` → `partners.compliance_verified_at`
- ✅ `partner_kyc_documents` → `partner_compliance_documents`
- ✅ Added `partner_number` (unique identifier for partners)
- ✅ Added `commission_rate` and `tier` fields
- ✅ Added document metadata fields (document_number, issue_date, expiry_date, etc.)
- ✅ Updated all indexes, constraints, and RLS policies

---

## Prerequisites

- Access to Supabase Dashboard
- Service role or admin access to the database
- Backup of current data (optional but recommended)

---

## Step 1: Run the Migration

### Option A: Via Supabase Dashboard (Recommended)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase/migrations/20251027100002_fix_compliance_migration.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

### Option B: Via Supabase CLI

```bash
# If you have Supabase CLI installed and linked
supabase db push

# Or apply specific migration
supabase migration up --db-url postgresql://postgres:password@host:5432/postgres
```

---

## Step 2: Verify Migration Success

### Check for Success Messages

After running the migration, you should see output similar to:

```
NOTICE:  Renamed kyc_status to compliance_status
NOTICE:  Renamed kyc_verified_at to compliance_verified_at
NOTICE:  Added compliance_notes column
NOTICE:  Updated compliance_status constraint
NOTICE:  Added partner_number column
NOTICE:  Added commission_rate column
NOTICE:  Added tier column
NOTICE:  Added tier constraint
NOTICE:  Renamed partner_kyc_documents to partner_compliance_documents
NOTICE:  Renamed document_type to document_category
NOTICE:  Added new document_type column
NOTICE:  Added document metadata columns
NOTICE:  Updated document_category constraint
NOTICE:  Updated verification_status constraint
NOTICE:  Updated partner indexes
NOTICE:  Updated document indexes
NOTICE:  Updated RLS policies
NOTICE:  ========================================
NOTICE:  Migration completed successfully!
NOTICE:  ========================================
```

### Run Verification Script

Run the automated verification script:

```bash
node scripts/verify-compliance-migration.js
```

This will check:
- ✅ Partners table has new compliance columns
- ✅ Old KYC columns are removed
- ✅ `partner_compliance_documents` table exists
- ✅ New indexes are created
- ✅ Old indexes are removed
- ✅ RLS policies are updated
- ✅ Constraints are correct

---

## Step 3: Manual Verification Queries

If the script doesn't work, manually verify with these SQL queries:

### Test 1: Check Partners Columns

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'partners'
AND column_name IN (
  'compliance_status',
  'compliance_verified_at',
  'compliance_notes',
  'partner_number',
  'commission_rate',
  'tier'
)
ORDER BY column_name;
```

**Expected**: 6 rows showing all new columns

### Test 2: Verify Old Columns Are Gone

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'partners'
AND column_name IN ('kyc_status', 'kyc_verified_at');
```

**Expected**: 0 rows (columns should be removed)

### Test 3: Check Compliance Documents Table

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'partner_compliance_documents'
ORDER BY column_name;
```

**Expected**: See columns including `document_category`, `document_type`, `document_number`, `expiry_date`, etc.

### Test 4: Check Indexes

```sql
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('partners', 'partner_compliance_documents')
ORDER BY indexname;
```

**Expected** (should include):
- `idx_partners_compliance_status` ✅
- `idx_partners_partner_number` ✅
- `idx_partners_tier` ✅
- `idx_partner_compliance_docs_partner_id` ✅
- `idx_partner_compliance_docs_category` ✅
- `idx_partner_compliance_docs_verification_status` ✅
- `idx_partner_compliance_docs_expiry` ✅

**Should NOT include**:
- `idx_partners_kyc_status` ❌
- `idx_partner_kyc_partner_id` ❌
- `idx_partner_kyc_verification_status` ❌

### Test 5: Check RLS Policies

```sql
SELECT policyname
FROM pg_policies
WHERE tablename = 'partner_compliance_documents'
ORDER BY policyname;
```

**Expected** (5 policies):
1. `admins_manage_compliance_documents`
2. `admins_view_all_compliance_documents`
3. `partners_delete_own_unverified_compliance_documents`
4. `partners_upload_compliance_documents`
5. `partners_view_own_compliance_documents`

---

## Troubleshooting

### Error: "column 'compliance_status' does not exist"

**Cause**: Migration not fully applied

**Solution**: Run the migration again. The migration is idempotent (safe to re-run).

### Error: "syntax error at or near 'RAISE'"

**Cause**: Using old migration file with syntax error

**Solution**: Use `20251027100002_fix_compliance_migration.sql` (not `20251027100001_*`)

### Error: "relation 'partner_kyc_documents' does not exist"

**Cause**: Original partners system migration was never run

**Solution**:
1. First run: `supabase/migrations/20251027000001_create_partners_system.sql`
2. Then run: `supabase/migrations/20251027100002_fix_compliance_migration.sql`

### Old indexes still present

**Query**:
```sql
SELECT indexname
FROM pg_indexes
WHERE indexname LIKE '%kyc%'
OR indexname LIKE '%partner_kyc%';
```

**If rows returned**: Re-run the migration. It includes DROP INDEX IF EXISTS for all old indexes.

---

## Post-Migration Tasks

After successful migration:

### 1. Configure Supabase Storage Bucket

Follow the guide in `docs/partners/SUPABASE_STORAGE_SETUP.md` to:
- Create `partner-compliance-documents` bucket
- Apply RLS policies for partner-scoped access
- Set file size limits and allowed MIME types

### 2. Test Document Upload

1. Register a test partner account
2. Navigate to `/partners/onboarding/verify`
3. Upload test documents for each category
4. Verify documents appear in Supabase Storage
5. Check `partner_compliance_documents` table records

### 3. Update Application Code (if needed)

Check these files use new terminology:
- `app/api/partners/compliance/upload/route.ts`
- `app/api/partners/compliance/documents/route.ts`
- `app/api/partners/compliance/submit/route.ts`
- `app/partners/onboarding/verify/page.tsx`
- `lib/partners/compliance-requirements.ts`

All these files should already be updated.

---

## Rollback (Emergency Only)

If you need to rollback the migration:

```sql
-- ⚠️ WARNING: This will revert changes and may cause data loss
-- Only use if migration caused critical issues

-- Rename back to KYC
ALTER TABLE partners RENAME COLUMN compliance_status TO kyc_status;
ALTER TABLE partners RENAME COLUMN compliance_verified_at TO kyc_verified_at;
ALTER TABLE partners DROP COLUMN compliance_notes;

ALTER TABLE partner_compliance_documents RENAME TO partner_kyc_documents;

-- Drop new fields
ALTER TABLE partners DROP COLUMN partner_number;
ALTER TABLE partners DROP COLUMN commission_rate;
ALTER TABLE partners DROP COLUMN tier;

-- Recreate old indexes
CREATE INDEX idx_partners_kyc_status ON partners(kyc_status);
```

**⚠️ Note**: This is a destructive operation. Only use if absolutely necessary.

---

## Migration Timeline

| Time | Action | Status |
|------|--------|--------|
| 2025-10-27 | Created initial migration with compliance terminology | ✅ |
| 2025-10-27 | Fixed migration for existing databases | ✅ |
| 2025-10-27 | Fixed PostgreSQL syntax error (RAISE NOTICE in DO block) | ✅ |
| Next | Run migration in production | ⏳ |
| Next | Configure Supabase Storage bucket | ⏳ |
| Next | Test document upload flow | ⏳ |

---

## Success Criteria

Migration is successful when:

- ✅ All verification queries pass
- ✅ `node scripts/verify-compliance-migration.js` shows all tests passing
- ✅ No errors in Supabase logs
- ✅ Partner registration still works at `/partners/onboarding/register`
- ✅ Document upload page loads at `/partners/onboarding/verify`
- ✅ No TypeScript errors in application code

---

## Support

If you encounter issues:

1. Check Supabase Dashboard → **Database** → **Logs** for error details
2. Run verification queries above to identify which step failed
3. Re-run the migration (it's safe to re-run)
4. Check application logs for any RLS policy errors

---

**Status**: Ready to apply
**Last Updated**: 2025-10-27
**Related Files**:
- Migration: `supabase/migrations/20251027100002_fix_compliance_migration.sql`
- Verification: `scripts/verify-compliance-migration.js`
- Storage Setup: `docs/partners/SUPABASE_STORAGE_SETUP.md`
- Compliance Requirements: `lib/partners/compliance-requirements.ts`

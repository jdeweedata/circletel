# Partner Compliance System - Quick Start Guide

**Last Updated**: 2025-10-27
**Status**: Ready for testing

---

## 🚀 What's Been Built

A complete FICA/CIPC compliance document upload system for South African partner onboarding.

### Features
- ✅ **13 SA-specific document categories** (FICA identity, CIPC registration, tax clearance, etc.)
- ✅ **Business-type specific requirements** (Sole Proprietor: 5 required | Company: 11 required | Partnership: 7 required)
- ✅ **Real-time progress tracking** with visual progress bar
- ✅ **Supabase Storage integration** with RLS policies
- ✅ **Document metadata** (document number, issue date, expiry date)
- ✅ **Partner number generation** (CTPL-YYYY-NNN format)
- ✅ **Commission rate & tier tracking**

---

## 📋 Quick Start Steps

### Step 1: Run Database Migration

```bash
# Open Supabase Dashboard → SQL Editor
# Copy contents of: supabase/migrations/20251027100002_fix_compliance_migration.sql
# Paste and Run

# Or via CLI:
supabase db push
```

### Step 2: Verify Migration

```bash
# Automated verification
node scripts/verify-compliance-migration.js

# Should show:
# ✅ All compliance migration checks passed!
```

### Step 3: Configure Storage

Follow `docs/partners/SUPABASE_STORAGE_SETUP.md`:

1. Create bucket: `partner-compliance-documents`
2. Set as private with RLS
3. Apply 4 RLS policies (provided in doc)
4. Set file size limit: 20MB
5. Set allowed types: PDF, JPG, PNG, ZIP

### Step 4: Test Document Upload

```bash
# Start dev server
npm run dev:memory

# Navigate to:
http://localhost:3000/partners/onboarding/register

# Register a test partner account
# Then visit:
http://localhost:3000/partners/onboarding/verify

# Upload test documents
```

---

## 🗂️ File Structure Reference

### Frontend Pages
```
app/partners/onboarding/
├── register/page.tsx          # Partner registration form
├── verify/page.tsx            # Document upload (NEW - 525 lines)
└── pending/page.tsx           # Pending approval message
```

### API Endpoints
```
app/api/partners/
├── onboarding/route.ts              # GET partner data
├── register/route.ts                # POST create partner
└── compliance/
    ├── upload/route.ts              # POST upload document (NEW)
    ├── documents/route.ts           # GET list documents (NEW)
    └── submit/route.ts              # POST submit for review (NEW)
```

### Business Logic
```
lib/partners/
└── compliance-requirements.ts       # FICA/CIPC requirements (NEW - 452 lines)
```

### Database
```
supabase/migrations/
├── 20251027000001_create_partners_system.sql          # Original (modified)
├── 20251027100001_rename_kyc_to_compliance.sql        # KYC → Compliance rename
└── 20251027100002_fix_compliance_migration.sql        # Robust version (USE THIS)
```

### Documentation
```
docs/partners/
├── SUPABASE_STORAGE_SETUP.md        # Storage bucket config (474 lines)
├── MIGRATION_INSTRUCTIONS.md        # Step-by-step migration guide (NEW)
└── COMPLIANCE_SYSTEM_QUICK_START.md # This file
```

### Scripts
```
scripts/
└── verify-compliance-migration.js    # Automated verification (NEW)
```

---

## 🎯 Document Categories (13 Total)

### FICA Requirements (2)
1. **fica_identity** - ID/Passport (Required for all)
2. **fica_address** - Proof of residential address (Required for all)

### CIPC Requirements (4)
3. **cipc_registration** - CK1, CoR 14.3 (Required for companies)
4. **cipc_profile** - Company profile (Required for companies)
5. **cipc_directors** - CM1, Directors list (Optional for companies)
6. **cipc_founding** - MOI, Founding Statement (Optional for companies)

### SARS Requirements (2)
7. **tax_clearance** - Tax clearance certificate (Required for all)
8. **vat_registration** - VAT registration (Optional if applicable)

### Banking Requirements (2)
9. **bank_confirmation** - Bank confirmation letter (Required for all)
10. **bank_statement** - 3-month bank statement (Required for all)

### Business Requirements (3)
11. **business_address** - Proof of business address (Required for companies)
12. **authorization** - Resolution/POA (Required for companies)
13. **other** - Additional documents (Optional)

---

## 🔐 Partner Number Format

Generated automatically on approval:

```
CTPL-YYYY-NNN

Example: CTPL-2025-001

CTPL = CircleTel Partner License
YYYY = Year of approval
NNN  = Sequential number (001, 002, 003...)
```

**Implementation**: Will be added to approval workflow API (Phase 2.4)

---

## 📊 Database Schema Changes

### Partners Table (New Columns)

| Column | Type | Description |
|--------|------|-------------|
| `compliance_status` | TEXT | Was `kyc_status` - Status: incomplete, submitted, under_review, verified, rejected |
| `compliance_verified_at` | TIMESTAMPTZ | Was `kyc_verified_at` - Timestamp of verification |
| `compliance_notes` | TEXT | Admin notes on compliance review |
| `partner_number` | TEXT | Unique partner identifier (CTPL-YYYY-NNN) |
| `commission_rate` | DECIMAL(5,2) | Commission percentage (e.g., 10.50) |
| `tier` | TEXT | Partner tier: bronze, silver, gold, platinum |

### Partner Compliance Documents Table (Renamed)

**Old Name**: `partner_kyc_documents`
**New Name**: `partner_compliance_documents`

**New Columns**:
- `document_category` (was `document_type`) - 13 SA-specific categories
- `document_type` (new) - Specific document name within category
- `document_number` - Document ID/number
- `issue_date` - Document issue date
- `expiry_date` - Document expiry date
- `is_required` - Whether document is required for business type
- `is_sensitive` - Whether document contains sensitive data
- `updated_at` - Last update timestamp

---

## 🧪 Testing Checklist

### Pre-Migration Tests
- [ ] Backup current database (optional)
- [ ] Note current partners count
- [ ] Note current documents count

### Migration Tests
- [ ] Run migration SQL
- [ ] Check for NOTICE messages (should see "Migration completed successfully!")
- [ ] Run `node scripts/verify-compliance-migration.js`
- [ ] All 6 tests should pass

### Storage Tests
- [ ] Create `partner-compliance-documents` bucket
- [ ] Apply RLS policies
- [ ] Test partner upload (should succeed)
- [ ] Test partner viewing own documents (should succeed)
- [ ] Test partner viewing other's documents (should fail)
- [ ] Test admin viewing all documents (should succeed)

### Application Tests
- [ ] Registration page loads: `/partners/onboarding/register`
- [ ] Can register new partner
- [ ] Document upload page loads: `/partners/onboarding/verify`
- [ ] Can see business-type specific requirements
- [ ] Can upload document (< 20MB, PDF/JPG/PNG/ZIP)
- [ ] Progress bar updates after upload
- [ ] Can delete pending document
- [ ] Cannot delete approved document
- [ ] Can submit for review when all required docs uploaded
- [ ] Cannot submit if missing required docs

---

## 🛠️ Troubleshooting

### "Column 'compliance_status' does not exist"
**Fix**: Run `20251027100002_fix_compliance_migration.sql` in Supabase SQL Editor

### "Syntax error at or near 'RAISE'"
**Fix**: Make sure you're using `20251027100002` (not `20251027100001`)

### "Policy check violation on upload"
**Fix**:
1. Check storage bucket exists: `partner-compliance-documents`
2. Check RLS policies applied (see `SUPABASE_STORAGE_SETUP.md`)
3. Verify partner record exists for logged-in user

### "File size limit exceeded"
**Fix**:
- Bucket limit is 20MB
- Increase if needed: `UPDATE storage.buckets SET file_size_limit = 52428800 WHERE id = 'partner-compliance-documents';`

### Old indexes still showing
**Fix**: Re-run migration - it's safe to run multiple times

---

## 📞 Support Resources

| Resource | Location |
|----------|----------|
| Migration Guide | `docs/partners/MIGRATION_INSTRUCTIONS.md` |
| Storage Setup | `docs/partners/SUPABASE_STORAGE_SETUP.md` |
| Compliance Requirements | `lib/partners/compliance-requirements.ts` |
| Upload Component | `app/partners/onboarding/verify/page.tsx` |
| Verification Script | `scripts/verify-compliance-migration.js` |

---

## ✅ Success Criteria

Migration and implementation are complete when:

- ✅ Migration verification script passes all 6 tests
- ✅ Storage bucket configured with RLS policies
- ✅ Partner can register at `/partners/onboarding/register`
- ✅ Partner can upload documents at `/partners/onboarding/verify`
- ✅ Progress bar shows correct percentage
- ✅ Required vs optional documents clearly marked
- ✅ Can submit for review when complete
- ✅ Documents appear in Supabase Storage with correct folder structure
- ✅ `partner_compliance_documents` table has records for uploads

---

## 🚦 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database Migration | ✅ Ready | `20251027100002_fix_compliance_migration.sql` |
| Verification Script | ✅ Ready | `scripts/verify-compliance-migration.js` |
| Storage Setup Docs | ✅ Ready | Manual step required |
| Frontend UI | ✅ Ready | `/partners/onboarding/verify` |
| API Endpoints | ✅ Ready | Upload, list, submit |
| Compliance Logic | ✅ Ready | 13 categories, 3 business types |
| Partner Number | ⏳ Pending | Will be added in approval workflow |
| Testing | ⏳ Pending | User to test after migration |

---

## 🎯 Next Steps

After successful migration and testing:

1. **Add Partner Number Generation**
   - Create trigger/function for auto-generation on approval
   - Format: CTPL-YYYY-NNN

2. **Phase 2.4: Partner Approval Workflow API**
   - `POST /api/admin/partners/[id]/approve` - Approve partner
   - `POST /api/admin/partners/[id]/reject` - Reject partner
   - Generate partner number on approval

3. **Phase 2.5: Partner Profile Page**
   - View/edit partner details
   - View compliance documents
   - View assigned leads

4. **Phase 3: Lead Management**
   - Lead dashboard for partners
   - Lead assignment system
   - Activity tracking

---

**Ready to Start?**

```bash
# 1. Run migration
# (Copy 20251027100002_fix_compliance_migration.sql to Supabase SQL Editor)

# 2. Verify
node scripts/verify-compliance-migration.js

# 3. Configure storage
# (Follow docs/partners/SUPABASE_STORAGE_SETUP.md)

# 4. Test
npm run dev:memory
# Visit: http://localhost:3000/partners/onboarding/verify
```

---

**Questions?** Check `docs/partners/MIGRATION_INSTRUCTIONS.md` for detailed troubleshooting.

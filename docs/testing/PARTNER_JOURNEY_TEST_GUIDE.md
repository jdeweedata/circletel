# Sales Partner Journey - Complete Testing Guide

## Overview

The CircleTel Sales Partner Portal provides a complete onboarding and management system for external sales partners. This guide walks through the entire partner journey from registration to earning commissions.

---

## 🎯 Complete Partner Journey Map

```
1. Registration           → /partners/onboarding
2. Document Verification  → /partners/onboarding/verify
3. Admin Review          → (Admin approves in backend)
4. Partner Dashboard     → /partners
5. Lead Management       → /partners/leads
6. Commission Tracking   → /partners/commissions
7. Resources Library     → /partners/resources
8. Profile Management    → /partners/profile
```

---

## 📋 Test Scenarios

### Scenario 1: New Partner Registration (End-to-End)

**Duration:** ~15 minutes
**Requirements:** Admin access for approval step

#### Step 1: Register as New Partner

**URL:** `/partners/onboarding`

**Test Data:**
```json
{
  "businessName": "Test Sales Agency",
  "registrationNumber": "2024/123456/07",
  "vatNumber": "4567890123",
  "businessType": "company",

  "contactPerson": "John Smith",
  "email": "john.smith@testsales.co.za",
  "phone": "0821234567",
  "alternativePhone": "0217654321",

  "streetAddress": "123 Main Street",
  "suburb": "Gardens",
  "city": "Cape Town",
  "province": "Western Cape",
  "postalCode": "8001",

  "bankName": "FNB",
  "accountHolder": "Test Sales Agency",
  "accountNumber": "62123456789",
  "accountType": "cheque",
  "branchCode": "250655"
}
```

**Expected Results:**
- ✅ Form validates all fields
- ✅ Success toast appears
- ✅ Redirects to `/partners/onboarding/verify`

**Database Check:**
```sql
SELECT
  business_name,
  email,
  compliance_status,
  created_at
FROM partners
WHERE email = 'john.smith@testsales.co.za';
```

Expected: `compliance_status = 'incomplete'`

---

#### Step 2: Upload Compliance Documents

**URL:** `/partners/onboarding/verify`

**Required Documents by Business Type:**

**For Company (11 required, 1 optional):**
1. ✅ **ID Document** (FICA) - Director's ID copy
2. ✅ **Proof of Address** (FICA) - Recent utility bill
3. ✅ **CIPC Registration** - CK1 certificate
4. ✅ **Company Profile** - CIPC company report
5. ✅ **Directors Report** - CM1 document
6. ✅ **MOI** - Memorandum of Incorporation
7. ✅ **Tax Clearance** (SARS) - Valid tax certificate
8. ✅ **VAT Certificate** (SARS) - VAT registration
9. ✅ **Bank Confirmation** - Bank letter
10. ✅ **Bank Statement** - Recent 3 months
11. ✅ **Business Address Proof** - Lease or utility bill
12. ⭕ **Authorization Letter** (Optional) - If applicable

**Test Upload:**
- Upload at least 11 documents (use PDF/JPG/PNG files < 20MB)
- Progress bar should update after each upload
- Documents should display in "Uploaded Documents" section

**Expected Results:**
- ✅ Files upload successfully
- ✅ Progress bar shows: "11/11 required documents (100%)"
- ✅ Green checkmarks appear on uploaded categories
- ✅ "Submit for Review" button becomes enabled
- ✅ Success toast after submission
- ✅ Status updates to `submitted`

**Storage Check (Supabase Dashboard):**
```
Bucket: partner-compliance-documents
Path: {partner_id}/id_document/1699564800_id_front.pdf
      {partner_id}/proof_of_address/1699564801_utility_bill.pdf
      ...
```

**Database Check:**
```sql
SELECT
  document_category,
  file_name,
  verification_status,
  uploaded_at
FROM partner_compliance_documents
WHERE partner_id = '{partner_id}'
ORDER BY uploaded_at DESC;
```

Expected: 11-12 records with `verification_status = 'pending'`

---

#### Step 3: Admin Review & Approval

**URL:** `/admin/partners` (Admin Portal - To Be Implemented)

**Admin Actions:**
1. Review submitted documents
2. Verify business details
3. Check CIPC registration number
4. Approve/reject documents individually
5. Assign partner number (format: `CTPL-2025-001`)
6. Set commission tier (Bronze/Silver/Gold/Platinum)
7. Update partner status to `verified`

**SQL Command (Manual for now):**
```sql
UPDATE partners
SET
  compliance_status = 'verified',
  compliance_verified_at = NOW(),
  partner_number = 'CTPL-2025-001',
  tier = 'silver',
  commission_rate = 30.00,
  status = 'active'
WHERE email = 'john.smith@testsales.co.za';
```

**Expected Results:**
- ✅ Partner can now access full portal
- ✅ Partner number appears in profile
- ✅ Status badge shows "Active Partner"

---

#### Step 4: Access Partner Dashboard

**URL:** `/partners`

**Expected UI Elements:**
- 🏠 Partner Dashboard header
- 📊 4 stat cards:
  - Total Leads: 0
  - Active Leads: 0
  - Converted: 0
  - Commission: R0.00
- 🧭 Sidebar navigation with 6 menu items:
  - Dashboard
  - My Leads
  - Commissions
  - Resources
  - Profile
  - Sign Out

**Test Navigation:**
- Click each menu item
- Verify page loads without errors
- Check all pages are accessible

---

#### Step 5: Lead Management

**URL:** `/partners/leads`

**Test: Create Test Lead (Manual SQL for now)**
```sql
-- Insert test lead assigned to partner
INSERT INTO coverage_leads (
  id,
  address,
  latitude,
  longitude,
  customer_name,
  customer_email,
  customer_phone,
  assigned_partner_id,
  status,
  created_at
) VALUES (
  gen_random_uuid(),
  '456 Test Street, Sandton, 2196',
  -26.1076,
  28.0567,
  'Jane Doe',
  'jane.doe@example.com',
  '0821112222',
  '{partner_id}',
  'new',
  NOW()
);
```

**Test Actions:**
1. **View Leads List:**
   - Lead appears in table
   - Status badge shows "New"
   - Can search by name/email/phone

2. **View Lead Details:**
   - Click on lead to open detail page
   - See customer information
   - See service requirements

3. **Add Activity:**
   - Click "Add Activity"
   - Select activity type: "Call"
   - Enter notes: "Discussed 100Mbps fibre package"
   - Select outcome: "Interested"
   - Set follow-up date: Tomorrow
   - Save activity

4. **Track Activities:**
   - Activity appears in timeline
   - Follow-up counter updates
   - Last contact date updates

**Expected Results:**
- ✅ All CRUD operations work
- ✅ Activity timeline displays correctly
- ✅ Lead status can be updated
- ✅ Statistics update on leads page

---

#### Step 6: Commission Tracking

**URL:** `/partners/commissions`

**Test: Create Commission Transaction**

**Option A: Via SQL (Direct testing)**
```sql
-- Tiered commission (MTN package)
SELECT create_tiered_commission(
  '{partner_id}'::UUID,
  '{order_id}'::UUID,
  799.00,  -- R799/month package
  24,      -- 24-month contract
  'lead_conversion'
);

-- Margin commission (BizFibre package)
SELECT create_margin_commission(
  '{partner_id}'::UUID,
  '{order_id}'::UUID,
  'bizfibre_plus_50',
  24,
  'lead_conversion'
);
```

**Option B: Via Order Creation (Future integration)**
```
When customer order is created:
1. System detects lead was assigned to partner
2. Auto-creates commission transaction
3. Sets status to 'pending_approval'
4. Admin reviews and approves
```

**Test Commission Page:**
1. View transaction history
2. Check summary cards update:
   - Total Earned
   - Pending Payment
   - Pending Approval
   - Total Transactions
3. Filter by status
4. Verify tier badge displays
5. Click "View Commission Tiers"

**Expected Results:**
- ✅ Transaction appears in history
- ✅ Amount calculated correctly
- ✅ Status shows "Pending Approval"
- ✅ Summary stats update

---

#### Step 7: Interactive Commission Calculator

**URL:** `/partners/commissions/tiers`

**Test Scenarios:**

**Test 1: MTN Tier Calculation**
- Monthly Package Value: R799
- Contract Term: 24 months
- Expected Results:
  - Tier Applied: Tier 4 (Premium)
  - Total Contract Value: R19,176
  - Commission Rate: 2.63%
  - Total Commission: R498.24
  - Monthly Equivalent: R20.76/month
  - 5-Year LTV: R1,245.60

**Test 2: High-Value Package**
- Monthly Package Value: R2,199
- Contract Term: 36 months
- Expected Results:
  - Tier Applied: Tier 7 (Enterprise)
  - Total Contract Value: R79,164
  - Commission Rate: 4.13%
  - Total Commission: R3,268.47
  - Monthly Equivalent: R90.79/month
  - 5-Year LTV: R5,447.45

**UI Elements to Verify:**
- ✅ Real-time calculation as you type
- ✅ Tier name and rate display
- ✅ Commission breakdown (excl VAT, incl VAT)
- ✅ 5-year lifetime value projection
- ✅ Tier breakdown table with all 7 tiers
- ✅ 6 benefit cards
- ✅ Strategy tips section

---

#### Step 8: Resources Library

**URL:** `/partners/resources`

**Expected Content:**
- 9 sample resources across 4 categories:
  - Marketing Materials (3)
  - Training Resources (3)
  - Product Information (2)
  - Sales Tools (1)

**Test Actions:**
1. Browse resources by category
2. Click download buttons
3. Verify file type icons display
4. Check statistics counters

**Expected Results:**
- ✅ Resources display in grid layout
- ✅ Category filtering works
- ✅ Download buttons clickable
- ✅ Stats show correct counts

---

#### Step 9: Profile Management

**URL:** `/partners/profile`

**Test: View Profile**
- 6 information sections display:
  1. Business Information
  2. Contact Information
  3. Business Address
  4. Banking Details (masked)
  5. Partner Stats
  6. Account Information

**Test: Edit Profile (Only for 'pending' partners)**
- Click "Edit Profile" button
- Modify contact person name
- Update phone number
- Save changes

**Expected Results:**
- ✅ All data displays correctly
- ✅ Banking details are masked (***1234)
- ✅ Edit mode only available for pending partners
- ✅ Active partners see "Contact admin to update"
- ✅ Partner tier and number display
- ✅ Commission rate visible

---

## 🔍 Verification Queries

### Check Partner Record
```sql
SELECT
  partner_number,
  business_name,
  email,
  compliance_status,
  status,
  tier,
  commission_rate,
  created_at,
  compliance_verified_at
FROM partners
WHERE email = 'john.smith@testsales.co.za';
```

### Check Documents Uploaded
```sql
SELECT
  document_category,
  verification_status,
  COUNT(*) as count
FROM partner_compliance_documents
WHERE partner_id = '{partner_id}'
GROUP BY document_category, verification_status;
```

### Check Lead Assignment
```sql
SELECT
  customer_name,
  status,
  partner_last_contact,
  follow_up_count
FROM coverage_leads
WHERE assigned_partner_id = '{partner_id}';
```

### Check Commission Transactions
```sql
SELECT
  transaction_type,
  amount,
  status,
  tier_name,
  created_at
FROM partner_commission_transactions
WHERE partner_id = '{partner_id}'
ORDER BY created_at DESC;
```

### Check Commission Summary
```sql
SELECT
  COUNT(*) as total_transactions,
  SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total_earned,
  SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_approval,
  SUM(CASE WHEN status IN ('approved', 'pending') THEN amount ELSE 0 END) as total_commission
FROM partner_commission_transactions
WHERE partner_id = '{partner_id}';
```

---

## 🧪 API Testing (Postman/cURL)

### 1. Register Partner
```bash
curl -X POST http://localhost:3000/api/partners/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Agency",
    "email": "test@agency.co.za",
    "phone": "0821234567",
    "businessType": "company",
    "contactPerson": "John Doe",
    "streetAddress": "123 Main St",
    "city": "Cape Town",
    "province": "Western Cape",
    "postalCode": "8001",
    "bankName": "FNB",
    "accountHolder": "Test Agency",
    "accountNumber": "62123456789",
    "accountType": "cheque",
    "branchCode": "250655"
  }'
```

### 2. Get Partner Profile
```bash
curl http://localhost:3000/api/partners/profile \
  -H "Authorization: Bearer {supabase_jwt_token}"
```

### 3. List Leads
```bash
curl "http://localhost:3000/api/partners/leads?page=1&limit=10" \
  -H "Authorization: Bearer {supabase_jwt_token}"
```

### 4. Get Commission History
```bash
curl http://localhost:3000/api/partners/commissions \
  -H "Authorization: Bearer {supabase_jwt_token}"
```

---

## 🎭 Test User Personas

### Persona 1: Sole Proprietor
```json
{
  "businessName": "Smith Telecom Services",
  "businessType": "sole_proprietor",
  "registrationNumber": "",
  "vatNumber": "",
  "requiredDocuments": 5,
  "tier": "bronze",
  "commissionRate": 25.0
}
```

### Persona 2: Small Company
```json
{
  "businessName": "TechConnect Solutions (Pty) Ltd",
  "businessType": "company",
  "registrationNumber": "2023/456789/07",
  "vatNumber": "4567890123",
  "requiredDocuments": 11,
  "tier": "silver",
  "commissionRate": 30.0
}
```

### Persona 3: Partnership
```json
{
  "businessName": "Digital Sales Partners",
  "businessType": "partnership",
  "registrationNumber": "2022/987654/23",
  "vatNumber": "",
  "requiredDocuments": 7,
  "tier": "gold",
  "commissionRate": 35.0
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Permission Denied" on Partner Portal
**Cause:** User doesn't have `PERMISSIONS.PARTNERS.VIEW`
**Solution:** Grant permission via admin panel or SQL:
```sql
-- Grant partner view permission to user
INSERT INTO user_permissions (user_id, permission)
VALUES ('{user_id}', 'partners:view');
```

### Issue 2: Documents Not Uploading
**Cause:** File size > 20MB or unsupported format
**Solution:**
- Check file size (max 20MB)
- Supported formats: PDF, JPG, PNG, ZIP only

### Issue 3: Commission Calculator Shows NaN
**Cause:** SQL function not returning numeric value
**Solution:** Check migration was applied correctly:
```sql
SELECT calculate_tiered_commission(799.00, 24);
```

### Issue 4: Partner Number Not Generated
**Cause:** Auto-generation trigger not implemented
**Solution:** Manually assign via SQL:
```sql
UPDATE partners
SET partner_number = 'CTPL-2025-' || LPAD(NEXTVAL('partner_number_seq')::TEXT, 3, '0')
WHERE partner_number IS NULL;
```

---

## 📊 Success Metrics

After completing all tests, verify:

- ✅ Partner can register successfully
- ✅ All 11-12 compliance documents can be uploaded
- ✅ Admin can review and approve
- ✅ Partner dashboard loads with correct data
- ✅ Lead management works end-to-end
- ✅ Commission calculations are accurate
- ✅ Commission tiers display correctly
- ✅ Resources library is accessible
- ✅ Profile displays all information
- ✅ All API endpoints return expected data

---

## 🚀 Production Readiness Checklist

Before launching partner portal:

- [ ] Admin approval workflow implemented
- [ ] Email notifications configured
- [ ] Partner agreement acceptance added
- [ ] Commission payout schedule defined
- [ ] Partner training materials prepared
- [ ] Help documentation created
- [ ] Support contact information added
- [ ] Analytics tracking implemented
- [ ] Security audit completed
- [ ] Load testing performed

---

## 📞 Support & Documentation

**For Developers:**
- API Documentation: `/docs/api/PARTNER_API.md`
- Database Schema: `/docs/database/PARTNER_SCHEMA.md`
- Commission Models: `/docs/products/Commission_Structure_Multi_Model_Analysis_v1.0.md`

**For Partners:**
- Partner Handbook: TBD
- Commission Guide: Available at `/partners/commissions/tiers`
- FAQ: TBD

---

**Created:** 2025-11-06
**Version:** 1.0
**Status:** ✅ Ready for Testing
**Last Updated:** 2025-11-06

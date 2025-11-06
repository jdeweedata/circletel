# Partner Portal - Quick Start Testing Guide

> **TL;DR:** Complete sales partner portal with onboarding, KYC compliance, lead management, commission tracking, and resources library. Ready for testing!

---

## 🎯 What's Available to Test

### ✅ Fully Functional Features

| Feature | URL | Status | Test Time |
|---------|-----|--------|-----------|
| **Registration** | `/partners/onboarding` | ✅ Ready | 5 min |
| **Document Upload** | `/partners/onboarding/verify` | ✅ Ready | 10 min |
| **Partner Dashboard** | `/partners` | ✅ Ready | 2 min |
| **Lead Management** | `/partners/leads` | ✅ Ready | 5 min |
| **Commission History** | `/partners/commissions` | ✅ Ready | 3 min |
| **Commission Calculator** | `/partners/commissions/tiers` | ✅ Ready | 5 min |
| **Resources Library** | `/partners/resources` | ✅ Ready | 2 min |
| **Profile Management** | `/partners/profile` | ✅ Ready | 3 min |

**Total Testing Time:** ~35 minutes for complete journey

---

## 🚀 Quick Setup (5 Minutes)

### Option 1: Automated Setup (Recommended)

```bash
# Run the test partner creation script
node -r dotenv/config scripts/create-test-partner.js dotenv_config_path=.env.local
```

**This Creates:**
- ✅ Pre-approved test partner account
- ✅ 3 sample leads assigned
- ✅ 2 commission transactions
- ✅ Partner number: `CTPL-2025-TEST`
- ✅ Email: `test.partner@circletel.co.za`

### Option 2: Manual Registration

1. Go to `/partners/onboarding`
2. Fill registration form (use test data from guide)
3. Upload 11 documents at `/partners/onboarding/verify`
4. Admin approves via SQL (manual for now)

---

## 📱 Partner Portal Pages Overview

### 1. Dashboard (`/partners`)
**What You'll See:**
- 4 stat cards (Leads, Active, Converted, Commission)
- Welcome message
- Quick navigation sidebar

**Test:** Navigate to all menu items

---

### 2. Lead Management (`/partners/leads`)
**What You'll See:**
- Stats cards (Total, New, Interested, Converted)
- Search and filter functionality
- Leads table with customer info

**Test Actions:**
- Click on a lead to view details
- Add an activity (call, email, meeting)
- Update lead status
- Search for lead by name

---

### 3. Lead Details (`/partners/leads/[id]`)
**What You'll See:**
- Customer profile card
- Service requirements
- Activity timeline
- Add activity form

**Test Actions:**
- Add activity: "Call" → "Discussed 100Mbps package" → "Interested"
- Set follow-up date
- View activity in timeline

---

### 4. Commission History (`/partners/commissions`)
**What You'll See:**
- 4 summary cards:
  - Total Earned
  - Pending Payment
  - Pending Approval
  - Total Transactions
- Partner tier badge with rate
- Transaction history table
- "How Commissions Work" info card

**Test Actions:**
- Filter by status (all, pending, approved, paid)
- View transaction details
- Click "View Commission Tiers"

---

### 5. Commission Calculator (`/partners/commissions/tiers`)
**What You'll See:**
- Interactive calculator
- Real-time calculations
- 7-tier breakdown table
- 6 benefit cards
- Strategy tips

**Test Actions:**
1. Enter monthly value: **R799**
2. Enter contract term: **24 months**
3. See results:
   - Tier 4 (Premium) applies
   - Total commission: **R498.24**
   - Monthly equivalent: **R20.76**
   - 5-year lifetime: **R1,245.60**

---

### 6. Resources Library (`/partners/resources`)
**What You'll See:**
- 9 sample resources in 4 categories
- Quick stats (total by category)
- Download/view buttons

**Categories:**
- Marketing Materials (3)
- Training Resources (3)
- Product Information (2)
- Sales Tools (1)

**Test:** Browse and download resources

---

### 7. Profile Management (`/partners/profile`)
**What You'll See:**
- 6 information sections:
  1. Business Information
  2. Contact Information
  3. Business Address
  4. Banking Details (masked)
  5. Partner Stats (leads, earnings)
  6. Account Information

**Test Actions:**
- View all sections
- Check banking details are masked
- View partner tier and number
- Edit profile (if status = pending)

---

## 🧪 Quick Test Scenarios

### Scenario 1: Calculate Commission (2 minutes)

1. Go to `/partners/commissions/tiers`
2. **Test Case 1:** Standard Package
   - Monthly Value: R799
   - Term: 24 months
   - Expected: R498.24 total commission
3. **Test Case 2:** Premium Package
   - Monthly Value: R2,199
   - Term: 36 months
   - Expected: R3,268.47 total commission

---

### Scenario 2: Manage a Lead (3 minutes)

1. Go to `/partners/leads`
2. Click on first lead
3. Add activity:
   - Type: **Call**
   - Notes: **"Customer interested in 100Mbps fibre. Sending quote."**
   - Outcome: **Interested**
   - Follow-up: **Tomorrow**
4. Save and verify activity appears in timeline

---

### Scenario 3: Check Commission History (2 minutes)

1. Go to `/partners/commissions`
2. Verify summary cards show:
   - Total Earned > R0
   - Transactions > 0
3. Check transaction table displays correctly
4. Filter by status "Pending"

---

## 📊 Commission Models Explained

### Model 1: Tiered Revenue (MTN Packages)

**7 Tiers Based on Monthly Value:**

| Tier | Monthly Value | Effective Rate | Example |
|------|---------------|----------------|---------|
| 1 | R0 - R99 | 1.43% | R50 × 24 = R17.16 |
| 2 | R100 - R199 | 1.73% | R150 × 24 = R62.28 |
| 3 | R250 - R349 | 2.18% | R299 × 24 = R156.38 |
| 4 | R350 - R999 | 2.63% | R799 × 24 = **R498.24** |
| 5 | R1,000 - R1,499 | 2.93% | R1,299 × 24 = R913.30 |
| 6 | R1,500 - R1,999 | 3.53% | R1,699 × 24 = R1,438.78 |
| 7 | R2,000+ | 4.13% | R2,199 × 24 = **R2,178.98** |

**Commission Calculation:**
```
Total Contract Value = Monthly Value × Contract Months
Commission = Total Contract Value × Effective Rate
```

---

### Model 2: Margin-Share (BizFibre/SkyFibre)

**20% of Gross Margin:**

| Product | Monthly Price | Margin | Commission/Month | 24-Month Total |
|---------|--------------|--------|------------------|----------------|
| **BizFibre Lite 10** | R1,699 | R560 | R112.00 | R2,688.00 |
| **BizFibre Plus 50** | R2,499 | R934 | **R186.80** | **R4,483.20** |
| **BizFibre Pro 100** | R2,999 | R1,146 | R229.20 | R5,500.80 |
| **SkyFibre 100** | R2,999 | R1,567 | **R313.40** | **R7,521.60** |
| **SkyFibre 200** | R4,499 | R2,667 | R533.40 | R12,801.60 |

**Commission Calculation:**
```
Monthly Commission = Gross Margin × 20%
Total Commission = Monthly Commission × Contract Months
```

---

## 🛠️ Database Quick Checks

### Check Partner Exists
```sql
SELECT
  partner_number,
  business_name,
  email,
  status,
  tier,
  commission_rate
FROM partners
WHERE partner_number = 'CTPL-2025-TEST';
```

### Check Commission Transactions
```sql
SELECT
  transaction_type,
  amount,
  status,
  tier_name,
  product_name,
  created_at
FROM partner_commission_transactions
WHERE partner_id = (
  SELECT id FROM partners WHERE partner_number = 'CTPL-2025-TEST'
)
ORDER BY created_at DESC;
```

### Check Assigned Leads
```sql
SELECT
  customer_name,
  customer_email,
  status,
  follow_up_count,
  partner_last_contact
FROM coverage_leads
WHERE assigned_partner_id = (
  SELECT id FROM partners WHERE partner_number = 'CTPL-2025-TEST'
);
```

### Calculate Total Earnings
```sql
SELECT
  SUM(amount) FILTER (WHERE status = 'paid') as total_paid,
  SUM(amount) FILTER (WHERE status = 'approved') as approved_pending,
  SUM(amount) FILTER (WHERE status = 'pending') as pending_approval,
  COUNT(*) as total_transactions
FROM partner_commission_transactions
WHERE partner_id = (
  SELECT id FROM partners WHERE partner_number = 'CTPL-2025-TEST'
);
```

---

## 🎨 Visual Testing Checklist

### Design Elements to Verify

- [ ] CircleTel orange (#F5831F) used for primary actions
- [ ] Sidebar navigation collapses on mobile
- [ ] All stat cards have icons and hover effects
- [ ] Tier badges use correct colors:
  - Bronze: Brown
  - Silver: Gray
  - Gold: Yellow
  - Platinum: Purple
- [ ] Status badges color-coded:
  - New: Blue
  - Interested: Purple
  - Contacted: Yellow
  - Converted: Green
  - Lost: Red
- [ ] Tables responsive on mobile (stack/scroll)
- [ ] Forms have proper validation and error messages
- [ ] Loading states show spinners
- [ ] Success/error toasts appear correctly

---

## 🐛 Common Issues & Quick Fixes

### Issue: "Permission Denied"
**Fix:** Grant partner permission:
```sql
INSERT INTO user_permissions (user_id, permission)
VALUES ('{auth_user_id}', 'partners:view');
```

### Issue: No Leads Showing
**Fix:** Assign test lead:
```sql
UPDATE coverage_leads
SET assigned_partner_id = '{partner_id}'
WHERE id = '{lead_id}';
```

### Issue: Commission Calculator Shows NaN
**Fix:** Verify migration applied:
```sql
SELECT calculate_tiered_commission(799.00, 24);
-- Should return: 498.24
```

### Issue: Documents Not Uploading
**Check:**
- File size < 20MB
- Format is PDF, JPG, PNG, or ZIP
- Supabase storage bucket exists: `partner-compliance-documents`

---

## 📚 Additional Resources

**Full Testing Guide:**
- `docs/testing/PARTNER_JOURNEY_TEST_GUIDE.md` - Complete 35-page guide

**Technical Documentation:**
- Commission Models: `docs/products/Commission_Structure_Multi_Model_Analysis_v1.0.md`
- Compliance Requirements: `lib/partners/compliance-requirements.ts`
- Database Schema: See migration files in `supabase/migrations/2025110400000*`

**Scripts:**
- Create Test Partner: `scripts/create-test-partner.js`
- Verify System: `scripts/verify-commission-system.js`

---

## ✅ Testing Checklist

### Quick Test (10 minutes)
- [ ] Access partner dashboard
- [ ] View leads list
- [ ] Calculate commission for R799 package
- [ ] Check commission history
- [ ] Browse resources library

### Full Test (35 minutes)
- [ ] Complete registration flow
- [ ] Upload all compliance documents
- [ ] View and manage leads
- [ ] Add lead activities
- [ ] Test commission calculator (multiple scenarios)
- [ ] Review commission transactions
- [ ] Update profile information
- [ ] Download resources

### Production Readiness
- [ ] Admin approval workflow functional
- [ ] Email notifications working
- [ ] All permissions properly configured
- [ ] RLS policies tested
- [ ] Performance tested with 100+ records
- [ ] Mobile responsive verified
- [ ] Cross-browser tested (Chrome, Safari, Firefox)
- [ ] Security audit completed

---

## 🎉 Summary

**The Partner Portal is fully functional and ready for testing!**

**8 Complete Features:**
1. ✅ Registration & Onboarding
2. ✅ KYC Document Upload (13 categories)
3. ✅ Partner Dashboard
4. ✅ Lead Management (with activity tracking)
5. ✅ Commission History
6. ✅ Interactive Commission Calculator (2 models)
7. ✅ Resources Library
8. ✅ Profile Management

**2 Commission Models:**
1. ✅ Tiered Revenue (MTN - 7 tiers)
2. ✅ Margin-Share (BizFibre/SkyFibre - 10 products)

**Next Steps:**
1. Run `scripts/create-test-partner.js` to create test account
2. Create Supabase auth user for `test.partner@circletel.co.za`
3. Grant partner permissions
4. Start testing at `/partners`

**Need Help?**
- Full Guide: `docs/testing/PARTNER_JOURNEY_TEST_GUIDE.md`
- Commission Analysis: `docs/products/Commission_Structure_Multi_Model_Analysis_v1.0.md`

---

**Created:** 2025-11-06
**Version:** 1.0
**Ready to Test:** ✅ YES!

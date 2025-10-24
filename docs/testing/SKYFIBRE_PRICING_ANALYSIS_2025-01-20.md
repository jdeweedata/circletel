# SkyFibre Pricing Analysis - Complete Picture

**Date**: 2025-01-20
**Status**: 📊 ANALYZED - Ready for Database Update
**Priority**: ⚠️ HIGH - Customer-facing pricing incorrect

---

## 🎯 Executive Summary

CircleTel has **TWO separate SkyFibre product lines** with different pricing tiers:

1. **SkyFibre Residential** (Consumer) - R799-R1,099/month
2. **SkyFibre SME** (Business) - R1,299-R4,999/month (promotional)

The coverage checker is currently showing **fictitious products** that don't exist in either product line!

---

## 📊 Complete Pricing Comparison

### SkyFibre Residential (Consumer Products)

**Source**: `docs/products/01_ACTIVE_PRODUCTS/SkyFibre/Residential/SkyFibre Residential Products - September 2025.xlsx`

| Package Name | Speed | Price | Installation | Router Included |
|--------------|-------|-------|--------------|-----------------|
| **SkyFibre Starter** | 50 Mbps | **R799/month** | R900 (promo from R2,550) | Reyee RG-EW1200 (FREE) |
| **SkyFibre Plus** | 100 Mbps | **R899/month** | R900 (promo from R2,550) | Reyee RG-EW1300G (FREE) |
| **SkyFibre Pro** | 200 Mbps | **R1,099/month** | R900 (promo from R2,550) | Reyee RG-EW3000GX (FREE) |

**Features**:
- Truly unlimited data (no FUP/throttling)
- Symmetrical speeds (equal upload/download)
- Sub-5ms latency
- 99.5% uptime SLA
- Month-to-month contract
- 24/7 technical support

---

### SkyFibre SME (Business Products)

**Source**: `docs/products/01_ACTIVE_PRODUCTS/SkyFibre/SME/SkyFibre SME Products - Budget Pricing - September 2025.xlsx`

| Package Name | Speed | Standard Price | Promo Price* | Installation | Router | Static IP |
|--------------|-------|----------------|--------------|--------------|--------|-----------|
| **SMB Essential** | 50 Mbps | R1,899/month | **R1,299/month** | R900 | Reyee RG-EW1300G Pro | Included |
| **SMB Professional** | 100 Mbps | R2,899/month | **R1,899/month** | R900 | Reyee RG-EW1800GX | Included |
| **SMB Premium** | 200 Mbps | R4,499/month | **R2,899/month** | R900 | Premium router | Included |
| **SMB Enterprise** | 200 Mbps | R6,999/month | **R4,999/month** | R900 | Enterprise router | Included |

*Promotional pricing for first 100 customers

**Business Features**:
- Static IP address included
- Email hosting (5-10 accounts)
- Cloud backup (50-100GB)
- VPN service
- Business-grade SLA
- Enhanced support (8am-5pm or 8am-8pm)
- Monthly performance reports

---

### What's Currently Showing on Website (WRONG!)

**Source**: `service_packages` table (mock data)

| Package Name | Speed | Price | Promo Price |
|--------------|-------|-------|-------------|
| **SkyFibre Essential 50Mbps** | 50 Mbps down / 25 Mbps up | R299/month | R399 for 3 months |
| **SkyFibre Standard 100Mbps** | 100 Mbps down / 50 Mbps up | R449/month | R599 for 3 months |
| **SkyFibre Premium 200Mbps** | 200 Mbps down / 100 Mbps up | R699/month | R899 for 3 months |
| **SkyFibre Business 200Mbps** | 200 Mbps down / 200 Mbps up | R999/month | R1199 for 3 months |

❌ **Problem**: These products DON'T EXIST in any official pricing document!

---

## 🔍 Key Findings

### Finding 1: Product Names Don't Match

**Website shows**:
- "SkyFibre Essential 50Mbps"
- "SkyFibre Standard 100Mbps"
- "SkyFibre Premium 200Mbps"

**Actual products are**:
- **Residential**: "SkyFibre Starter", "SkyFibre Plus", "SkyFibre Pro"
- **SME**: "SMB Essential", "SMB Professional", "SMB Premium", "SMB Enterprise"

### Finding 2: Prices are 63-73% Lower Than Reality

**Website pricing** vs **Actual pricing**:

| Speed | Website | Actual (Residential) | Actual (SME Promo) | Difference |
|-------|---------|---------------------|-------------------|------------|
| 50 Mbps | R299 | R799 | R1,299 | **-R500 to -R1,000** |
| 100 Mbps | R449 | R899 | R1,899 | **-R450 to -R1,450** |
| 200 Mbps | R699 | R1,099 | R2,899 | **-R400 to -R2,200** |

### Finding 3: Speed Specifications Incorrect

**Website shows**:
- 50 Mbps down / **25 Mbps up** (asymmetric)
- 100 Mbps down / **50 Mbps up** (asymmetric)
- 200 Mbps down / **100 Mbps up** (asymmetric)

**Actual specification**:
- All packages have **SYMMETRICAL** speeds (e.g., 50 down / **50 up**)
- MTN Tarana FWB service provides equal upload/download

---

## 🎯 Recommended Solution

### Option A: Show Both Product Lines (Recommended ⭐)

**Approach**: Display both Residential and SME products, let user choose based on their needs.

**Implementation**:
1. Add customer type selector: "Home" vs "Business"
2. Show appropriate products based on selection
3. Default to "Home" for consumer coverage checks
4. Include SME packages for business leads

**Benefits**:
- ✅ Accurate pricing
- ✅ Upsell opportunity (show SME to consumers)
- ✅ Complete product offering
- ✅ Clear value differentiation

**Database Structure**:
```sql
-- Update products table to include both
UPDATE products
SET customer_type = 'consumer'
WHERE sku IN ('SKY-RES-START', 'SKY-RES-PLUS', 'SKY-RES-PRO');

UPDATE products
SET customer_type = 'smme'
WHERE sku IN ('SKY-SME-ESS', 'SKY-SME-PRO', 'SKY-SME-PREM', 'SKY-SME-ENT');
```

---

### Option B: Show Residential Only (Quick Fix)

**Approach**: Default to showing only Residential products for coverage checks.

**Implementation**:
1. Update `service_packages` or use `products` table
2. Show only Residential tier (R799, R899, R1,099)
3. Add link to "Business packages" page

**Benefits**:
- ✅ Simpler UI
- ✅ Faster implementation
- ✅ Targets main consumer market

**Cons**:
- ⚠️ Misses SME upsell opportunity
- ⚠️ Doesn't show full product range

---

## 📋 Correct Product Data for Database

### SkyFibre Residential Products

```sql
-- SkyFibre Starter (Residential)
INSERT INTO products (
  name, sku, category, service, customer_type,
  speed_download, speed_upload, price_monthly, price_once_off,
  data_limit, contract_duration, description, features, is_active, featured
) VALUES (
  'SkyFibre Starter',
  'SKY-RES-START',
  'connectivity',
  'SkyFibre',
  'consumer',
  50, 50, 799, 900,
  'Unlimited',
  'Month-to-Month',
  'Entry-level fixed wireless internet with excellent coverage. Perfect for light users, streaming, and browsing.',
  '["50Mbps symmetrical speed", "Unlimited data - no FUP", "Sub-5ms latency", "99.5% uptime SLA", "FREE Reyee RG-EW1200 router", "24/7 technical support", "Month-to-month contract"]',
  true, false
);

-- SkyFibre Plus (Residential)
INSERT INTO products (
  name, sku, category, service, customer_type,
  speed_download, speed_upload, price_monthly, price_once_off,
  data_limit, contract_duration, description, features, is_active, featured
) VALUES (
  'SkyFibre Plus',
  'SKY-RES-PLUS',
  'connectivity',
  'SkyFibre',
  'consumer',
  100, 100, 899, 900,
  'Unlimited',
  'Month-to-Month',
  'Fast fixed wireless for homes and small offices. Ideal for multiple users and HD streaming.',
  '["100Mbps symmetrical speed", "Unlimited data - no throttling", "Sub-5ms latency", "99.5% uptime SLA", "FREE Reyee RG-EW1300G router", "24/7 technical support", "Month-to-month contract"]',
  true, true
);

-- SkyFibre Pro (Residential)
INSERT INTO products (
  name, sku, category, service, customer_type,
  speed_download, speed_upload, price_monthly, price_once_off,
  data_limit, contract_duration, description, features, is_active, featured
) VALUES (
  'SkyFibre Pro',
  'SKY-RES-PRO',
  'connectivity',
  'SkyFibre',
  'consumer',
  200, 200, 1099, 900,
  'Unlimited',
  'Month-to-Month',
  'High-speed fixed wireless for demanding users. Perfect for 4K streaming, gaming, and large households.',
  '["200Mbps symmetrical speed", "Unlimited data - truly uncapped", "Sub-5ms latency", "99.5% uptime SLA", "FREE Reyee RG-EW3000GX WiFi 6 router", "24/7 technical support", "Month-to-month contract"]',
  true, true
);
```

### SkyFibre SME Products (Promotional Pricing)

```sql
-- SMB Essential
INSERT INTO products (
  name, sku, category, service, customer_type,
  speed_download, speed_upload, price_monthly, price_once_off,
  data_limit, contract_duration, description, features, is_active, featured
) VALUES (
  'SkyFibre SMB Essential',
  'SKY-SME-ESS',
  'connectivity',
  'SkyFibre',
  'smme',
  50, 50, 1299, 900,
  'Unlimited',
  'Month-to-Month',
  'Perfect for small offices and startups. Includes static IP and email hosting.',
  '["50Mbps symmetrical", "Static IP included", "5 business email accounts", "50GB cloud backup", "FREE Reyee RG-EW1300G Pro router", "VoIP prioritisation", "99.5% uptime SLA", "Business support"]',
  true, false
);

-- SMB Professional
INSERT INTO products (
  name, sku, category, service, customer_type,
  speed_download, speed_upload, price_monthly, price_once_off,
  data_limit, contract_duration, description, features, is_active, featured
) VALUES (
  'SkyFibre SMB Professional',
  'SKY-SME-PRO',
  'connectivity',
  'SkyFibre',
  'smme',
  100, 100, 1899, 900,
  'Unlimited',
  'Month-to-Month',
  'Ideal for growing businesses with multiple users. Enhanced features and support.',
  '["100Mbps symmetrical", "Static IP included", "10 business email accounts", "100GB cloud backup", "FREE Reyee RG-EW1800GX router", "VPN service (5 users)", "99.5% uptime SLA", "Extended support hours"]',
  true, true
);

-- SMB Premium
INSERT INTO products (
  name, sku, category, service, customer_type,
  speed_download, speed_upload, price_monthly, price_once_off,
  data_limit, contract_duration, description, features, is_active, featured
) VALUES (
  'SkyFibre SMB Premium',
  'SKY-SME-PREM',
  'connectivity',
  'SkyFibre',
  'smme',
  200, 200, 2899, 900,
  'Unlimited',
  'Month-to-Month',
  'High-performance connectivity for data-intensive businesses. Priority support included.',
  '["200Mbps symmetrical", "Static IP included", "15 business email accounts", "200GB cloud backup", "Premium WiFi 6 router", "VPN service (10 users)", "Priority support", "99.5% uptime SLA"]',
  true, true
);

-- SMB Enterprise
INSERT INTO products (
  name, sku, category, service, customer_type,
  speed_download, speed_upload, price_monthly, price_once_off,
  data_limit, contract_duration, description, features, is_active, featured
) VALUES (
  'SkyFibre SMB Enterprise',
  'SKY-SME-ENT',
  'connectivity',
  'SkyFibre',
  'smme',
  200, 200, 4999, 900,
  'Unlimited',
  'Month-to-Month',
  'Enterprise-grade connectivity with dedicated support. Maximum reliability for mission-critical operations.',
  '["200Mbps symmetrical", "Static IP included", "Unlimited business emails", "Unlimited cloud backup", "Enterprise router", "VPN service (25 users)", "24/7 priority support", "99.8% uptime SLA", "Dedicated account manager"]',
  true, false
);
```

---

## 🚀 Implementation Plan

### Phase 1: Database Update (30 minutes)

1. **Add Residential Products** (3 products):
   - SkyFibre Starter (R799)
   - SkyFibre Plus (R899)
   - SkyFibre Pro (R1,099)

2. **Add SME Products** (4 products):
   - SMB Essential (R1,299 promo)
   - SMB Professional (R1,899 promo)
   - SMB Premium (R2,899 promo)
   - SMB Enterprise (R4,999 promo)

3. **Update Existing** (if any match):
   - Correct names, pricing, speeds
   - Add customer_type field

### Phase 2: API Update (15 minutes)

**File**: `app/api/coverage/packages/route.ts`

Change from:
```typescript
.from('service_packages')
```

To:
```typescript
.from('products')
.in('service', productCategories)
.eq('is_active', true)
.eq('customer_type', 'consumer')  // Default to residential
```

Update field mappings as documented earlier.

### Phase 3: Test (15 minutes)

1. Check coverage for test address
2. Verify correct products display
3. Confirm pricing matches Excel sources
4. Test both consumer and SME filtering

---

## ✅ Verification Checklist

- [ ] All 7 SkyFibre products in database
- [ ] Residential products: R799, R899, R1,099
- [ ] SME products: R1,299, R1,899, R2,899, R4,999
- [ ] Symmetrical speeds (not asymmetric)
- [ ] Correct product names (not "Essential 50Mbps")
- [ ] Customer type field populated
- [ ] Coverage checker displays correct products
- [ ] Pricing matches Excel sources

---

## 📁 Related Files

**Source Documents**:
- `docs/products/01_ACTIVE_PRODUCTS/SkyFibre/Residential/SkyFibre Residential Products - September 2025.xlsx`
- `docs/products/01_ACTIVE_PRODUCTS/SkyFibre/SME/SkyFibre SME Products - Budget Pricing - September 2025.xlsx`
- `docs/products/01_ACTIVE_PRODUCTS/SkyFibre/Residential/skyfibre-residential-product-doc-v7.md`
- `docs/products/01_ACTIVE_PRODUCTS/SkyFibre/SME/skyfibre-smb-product-doc.md`

**Code Files**:
- `app/api/coverage/packages/route.ts` - Needs update
- `app/packages/[leadId]/page.tsx` - May need customer type selector

**Previous Analysis**:
- `docs/testing/PRICING_MISMATCH_ISSUE_2025-01-20.md` - Initial problem identification

---

**Created**: 2025-01-20
**Priority**: HIGH - Critical pricing error
**Status**: Ready for implementation
**Recommended**: Option A (show both product lines)

**Next Step**: Choose implementation approach and update database ✅

# MTN Products Migration Verification Report
## Comparison Against Product Documentation
**Date**: 2025-10-21
**Migration File**: `supabase/migrations/20251021000007_add_mtn_products.sql`

---

## EXECUTIVE SUMMARY

### ⚠️ CRITICAL ISSUES FOUND

The migration contains **SIGNIFICANT DISCREPANCIES** from the official product documentation. The products are incorrectly attributed to MTN when they should be based on different providers and pricing structures.

---

## 1. HOMEFIBRE CONNECT (Consumer Residential)

### 1.1 Official Product Documentation
**Source**: `docs/products/01_ACTIVE_PRODUCTS/HomeFibreConnect/homefibre-connect-product-doc.md`

**Actual Product Line** (MTN Wholesale FTTH):
| Package | Speed | Official Price | Wholesale Cost (MTN) |
|---------|-------|----------------|---------------------|
| HomeFibre Starter | 20/20 Mbps | R799 | R412 |
| **HomeFibre Plus** | **50/50 Mbps** | **R999** | **R542** |
| HomeFibre Max | 200/200 Mbps | R1,499 | R737 |
| HomeFibre Ultra | 500/500 Mbps | R1,999 | R837 |

### 1.2 Migration File Products
| Product Name | Speed | Migration Price | Status |
|--------------|-------|----------------|--------|
| ❌ HomeFibreConnect 50Mbps | 50/50 | **R899** | **WRONG PRICE** |
| ❌ HomeFibreConnect 100Mbps | 100/100 | R1,399 | **MISSING FROM DOCS** |
| ✅ HomeFibreConnect 200Mbps | 200/200 | R1,499* | WRONG NAME (should be "Max") |
| ❌ HomeFibreConnect 1Gbps | 1000/1000 | R2,299 | **WRONG SPEED** |

**Issues**:
1. **50Mbps**: Price is R899 (should be R999 for "HomeFibre Plus")
2. **100Mbps**: This tier DOES NOT EXIST in official docs
3. **200Mbps**: Correct price but wrong name (should be "HomeFibre Max")
4. **500Mbps**: MISSING entirely (should be "HomeFibre Ultra" @ R1,999)
5. **1Gbps**: This tier DOES NOT EXIST in MTN Wholesale FTTH docs

### 1.3 Missing Products
- ❌ HomeFibre Starter (20 Mbps @ R799)
- ❌ HomeFibre Ultra (500 Mbps @ R1,999)

---

## 2. BIZFIBRE CONNECT (Business)

### 2.1 Official Product Documentation
**Source**: `docs/products/01_ACTIVE_PRODUCTS/BizFibreConnect/bizfibre-connect-product-doc-v2.md`

**Critical Note**: **BizFibreConnect is NOT MTN-based!**

> **"Network Provider: DFA (Dark Fibre Africa)"**
> **"DFA Business Broadband managed service"**
> **"Fibre-to-the-Business (FTTB) infrastructure"**

**Actual Product Line** (DFA Wholesale):
| Package | Speed | Official Price | DFA Wholesale Cost |
|---------|-------|----------------|-------------------|
| BizFibre Connect Lite | 10/10 Mbps | R1,699 | R999 |
| BizFibre Connect Starter | 25/25 Mbps | R1,899 | R999 |
| BizFibre Connect Plus | 50/50 Mbps | R2,499 | R1,422 |
| **BizFibre Connect Pro** | **100/100 Mbps** | **R2,999** | **R1,731** |
| BizFibre Connect Ultra | 200/200 Mbps | R4,373 | R2,875 |

### 2.2 Migration File Products
| Product Name | Speed | Migration Price | Provider in Migration |
|--------------|-------|----------------|----------------------|
| ❌ BizFibreConnect 100Mbps | 100/100 | R1,899 | **ARRAY['mtn']** |
| ❌ BizFibreConnect 200Mbps | 200/200 | R2,799 | **ARRAY['mtn']** |
| ❌ BizFibreConnect 1Gbps | 1000/1000 | R4,999 | **ARRAY['mtn']** |

### 2.3 CRITICAL ERRORS

1. **❌ WRONG PROVIDER**: All BizFibreConnect products are marked as `compatible_providers = ARRAY['mtn']`
   - **Should be**: `ARRAY['dfa']` (Dark Fibre Africa)
   - **Evidence**: Product doc clearly states "DFA Business Broadband managed service"

2. **❌ WRONG PRICING**:
   - 100Mbps: R1,899 (should be R2,999 for "BizFibre Connect Pro")
   - 200Mbps: R2,799 (should be R4,373 for "BizFibre Connect Ultra")
   - 1Gbps: DOES NOT EXIST in official product line

3. **❌ MISSING PRODUCTS**:
   - BizFibre Connect Lite (10 Mbps @ R1,699)
   - BizFibre Connect Starter (25 Mbps @ R1,899)
   - BizFibre Connect Plus (50 Mbps @ R2,499)

4. **❌ WRONG DESCRIPTIONS**:
   - Migration says "MTN BizFibreConnect" - should reference DFA
   - Migration says "Business FTTH" - should be "Business Internet Access (BIA)"

---

## 3. MTN 5G/LTE PRODUCTS (Wireless)

### 3.1 Migration Products
**Consumer** (3 products):
- MTN 5G 100GB @ R349
- MTN 5G 200GB @ R599
- MTN LTE Uncapped @ R699

**Business** (3 products):
- MTN 5G 200GB Business @ R499
- MTN 5G 500GB Business @ R799
- MTN LTE Uncapped Business @ R1,099

### 3.2 Documentation Status
**Status**: ❓ **UNVERIFIED**

The product documentation provided does NOT include wireless 5G/LTE products:
- `homefibre-connect-product-doc.md` - Only covers FTTH
- `bizfibre-connect-product-doc-v2.md` - Only covers DFA fibre
- `skyfibre-residential-product-doc-v7.md` - Not reviewed yet
- `MTN Deals/Oct-2025/Helios and iLula Business Promos.xlsx` - Not reviewed yet

**Required**: Verify against actual MTN 5G/LTE product documentation before deployment.

---

## 4. RECOMMENDED CORRECTIONS

### 4.1 HomeFibreConnect Products (MTN Wholesale FTTH)

```sql
-- ✅ CORRECTED HomeFibreConnect Products
INSERT INTO service_packages (
  name, service_type, product_category, customer_type,
  speed_down, speed_up, price, currency, billing_cycle, data_cap,
  compatible_providers, provider_specific_config, active, featured, description
) VALUES
  -- HomeFibre Starter (20 Mbps)
  (
    'HomeFibre Starter',
    'fibre',
    'HomeFibreConnect',
    'consumer',
    20, 20, 799.00, 'ZAR', 'monthly', 'Uncapped',
    ARRAY['mtn'],
    '{"provider_service_name": "FTTH 20Mbps", "installation_fee": 2876, "router_model": "RG-EW1200F", "wholesale_cost": 412}'::jsonb,
    true, false,
    'HomeFibre Starter 20Mbps - Budget-friendly uncapped fibre, perfect for browsing and basic streaming'
  ),
  -- HomeFibre Plus (50 Mbps)
  (
    'HomeFibre Plus',
    'fibre',
    'HomeFibreConnect',
    'consumer',
    50, 50, 999.00, 'ZAR', 'monthly', 'Uncapped',
    ARRAY['mtn'],
    '{"provider_service_name": "FTTH 50Mbps", "installation_fee": 2876, "router_model": "RG-EW1300G", "wholesale_cost": 542}'::jsonb,
    true, true,
    'HomeFibre Plus 50Mbps - Ideal for families, HD streaming and work-from-home'
  ),
  -- HomeFibre Max (200 Mbps)
  (
    'HomeFibre Max',
    'fibre',
    'HomeFibreConnect',
    'consumer',
    200, 200, 1499.00, 'ZAR', 'monthly', 'Uncapped',
    ARRAY['mtn'],
    '{"provider_service_name": "FTTH 200Mbps", "installation_fee": 2876, "router_model": "RG-EW1800GX", "wholesale_cost": 737}'::jsonb,
    true, true,
    'HomeFibre Max 200Mbps - Power users, 4K streaming, online gaming'
  ),
  -- HomeFibre Ultra (500 Mbps)
  (
    'HomeFibre Ultra',
    'fibre',
    'HomeFibreConnect',
    'consumer',
    500, 500, 1999.00, 'ZAR', 'monthly', 'Uncapped',
    ARRAY['mtn'],
    '{"provider_service_name": "FTTH 500Mbps", "installation_fee": 2876, "router_model": "RG-EW3000GX", "wholesale_cost": 837}'::jsonb,
    true, true,
    'HomeFibre Ultra 500Mbps - Premium tier, multiple 4K streams, content creators'
  );
```

### 4.2 BizFibreConnect Products (DFA Wholesale)

```sql
-- ✅ CORRECTED BizFibreConnect Products (DFA, NOT MTN!)
INSERT INTO service_packages (
  name, service_type, product_category, customer_type,
  speed_down, speed_up, price, currency, billing_cycle, data_cap,
  compatible_providers, provider_specific_config, active, featured, description
) VALUES
  -- BizFibre Connect Lite (10 Mbps)
  (
    'BizFibre Connect Lite',
    'fibre',
    'BizFibreConnect',
    'business',
    10, 10, 1699.00, 'ZAR', 'monthly', 'Uncapped',
    ARRAY['dfa'],  -- ✅ CORRECTED: DFA not MTN
    '{"provider": "DFA", "provider_service_name": "BIA 10Mbps", "router_model": "RG-EW1300G", "sla": "99.5%", "contention_ratio": "1:10", "dfa_wholesale_cost": 999}'::jsonb,
    true, false,
    'DFA BizFibre Connect Lite 10Mbps - Micro businesses and home offices'
  ),
  -- BizFibre Connect Starter (25 Mbps)
  (
    'BizFibre Connect Starter',
    'fibre',
    'BizFibreConnect',
    'business',
    25, 25, 1899.00, 'ZAR', 'monthly', 'Uncapped',
    ARRAY['dfa'],  -- ✅ CORRECTED: DFA not MTN
    '{"provider": "DFA", "provider_service_name": "BIA 25Mbps", "router_model": "RG-EG105G", "hardware_contribution": 500, "sla": "99.5%", "contention_ratio": "1:10", "dfa_wholesale_cost": 999}'::jsonb,
    true, false,
    'DFA BizFibre Connect Starter 25Mbps - Small offices and retail stores'
  ),
  -- BizFibre Connect Plus (50 Mbps)
  (
    'BizFibre Connect Plus',
    'fibre',
    'BizFibreConnect',
    'business',
    50, 50, 2499.00, 'ZAR', 'monthly', 'Uncapped',
    ARRAY['dfa'],  -- ✅ CORRECTED: DFA not MTN
    '{"provider": "DFA", "provider_service_name": "BIA 50Mbps", "router_model": "RG-EG105G-P", "hardware_contribution": 500, "sla": "99.5%", "contention_ratio": "1:10", "dfa_wholesale_cost": 1422}'::jsonb,
    true, true,
    'DFA BizFibre Connect Plus 50Mbps - Growing SMEs, multi-user offices'
  ),
  -- BizFibre Connect Pro (100 Mbps)
  (
    'BizFibre Connect Pro',
    'fibre',
    'BizFibreConnect',
    'business',
    100, 100, 2999.00, 'ZAR', 'monthly', 'Uncapped',
    ARRAY['dfa'],  -- ✅ CORRECTED: DFA not MTN
    '{"provider": "DFA", "provider_service_name": "BIA 100Mbps", "router_model": "RG-EG305GH-P-E", "router_rental": 99, "sla": "99.5%", "contention_ratio": "1:10", "dfa_wholesale_cost": 1731}'::jsonb,
    true, true,
    'DFA BizFibre Connect Pro 100Mbps - Medium businesses, heavy cloud usage'
  ),
  -- BizFibre Connect Ultra (200 Mbps)
  (
    'BizFibre Connect Ultra',
    'fibre',
    'BizFibreConnect',
    'business',
    200, 200, 4373.00, 'ZAR', 'monthly', 'Uncapped',
    ARRAY['dfa'],  -- ✅ CORRECTED: DFA not MTN
    '{"provider": "DFA", "provider_service_name": "BIA 200Mbps", "router_model": "RG-EG310GH-P-E", "router_rental": 149, "sla": "99.5%", "contention_ratio": "1:10", "dfa_wholesale_cost": 2875}'::jsonb,
    true, true,
    'DFA BizFibre Connect Ultra 200Mbps - Large offices, mission-critical operations'
  );
```

---

## 5. MIGRATION FILE STATUS

### Current Migration: ❌ INCORRECT
**Issues Count**: 19 critical errors

**Breakdown**:
- ✅ Correct: 3 products (MTN wireless - pending verification)
- ❌ Incorrect: 7 products (4 HomeFibre + 3 BizFibre)
- ❓ Unverified: 6 products (wireless products)
- ❌ Missing: 6 products (2 HomeFibre + 4 BizFibre DFA tiers)

### Required Actions Before Deployment:

1. **DO NOT APPLY** the current migration `20251021000007_add_mtn_products.sql` as-is
2. **Create corrected migration** with proper product lineup
3. **Change BizFibreConnect provider** from `'mtn'` to `'dfa'`
4. **Verify wireless products** against actual MTN 5G/LTE documentation
5. **Update first migration** to include DFA provider in placeholder providers

---

## 6. PROVIDER MAPPING VERIFICATION

### 6.1 Migration File Claims
```sql
compatible_providers = ARRAY['mtn']  -- All 13 products
```

### 6.2 Actual Provider Mapping (Per Documentation)

| Product Line | Correct Provider | Evidence |
|--------------|-----------------|----------|
| HomeFibreConnect | ✅ MTN | "MTN Wholesale FTTH Services" |
| BizFibreConnect | ❌ **DFA** (NOT MTN!) | "DFA Business Broadband managed service" |
| MTN 5G/LTE | ❓ MTN (unverified) | No documentation provided |

---

## 7. NEXT STEPS

### Immediate Actions Required:

1. **✅ Fix Migration 1** (`20251021000006_cleanup_and_migrate.sql`):
   - Add DFA to placeholder providers
   - Update provider insertion to include DFA with correct configuration

2. **❌ BLOCK Migration 2** (`20251021000007_add_mtn_products.sql`):
   - DO NOT APPLY until corrected
   - Create new migration file with correct products

3. **📋 Create Corrected Migration**:
   - File: `20251021000008_add_correct_products.sql`
   - Include: 4 HomeFibre (MTN), 5 BizFibre (DFA), verify wireless

4. **🔍 Verify Wireless Products**:
   - Review `skyfibre-residential-product-doc-v7.md`
   - Review `MTN Deals/Oct-2025/Helios and iLula Business Promos.xlsx`
   - Confirm pricing and specifications

---

## 8. CONCLUSION

**Migration Status**: ⛔ **BLOCKED - CRITICAL ERRORS**

The current migration file contains fundamental errors:
- Wrong pricing for HomeFibreConnect products
- Wrong provider attribution for ALL BizFibreConnect products (DFA not MTN)
- Missing product tiers from official documentation
- Invented product tiers not in official documentation

**Recommendation**: **REJECT** current migration and create corrected version based on official product documentation.

---

**Report Generated**: 2025-10-21
**Reviewed By**: Claude Code AI Assistant
**Status**: ⛔ Migration Blocked - Requires Correction

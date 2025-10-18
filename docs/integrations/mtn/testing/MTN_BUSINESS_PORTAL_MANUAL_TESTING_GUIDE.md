# MTN Business Portal - Manual Testing Guide

**Portal URL**: https://asp-feasibility.mtnbusiness.co.za/wholesale_customers/map
**Purpose**: Map CircleTel products to MTN wholesale products for accurate coverage checking
**Date Created**: 2025-10-04

---

## Authentication Status

**Login Credentials**:
- Username: `Lindokuhle.mdake@circletel.co.za`
- Password: `Lwandle@1992*`

**Access Issues**:
- Automated testing with Playwright unable to successfully authenticate
- Login form redirects back to login page without error message
- Possible causes:
  - Additional authentication steps required (2FA, email verification)
  - Account access restrictions preventing automated login
  - reCAPTCHA advanced verification needed
  - Credentials may need manual verification/reset

**Recommendation**: Manual login required to test MTN Business Portal products

---

## Testing Objectives

### Primary Goal
Map CircleTel products to MTN Business wholesale products to understand:
1. Which MTN wholesale products correspond to our CircleTel offerings
2. Coverage availability for each product type
3. Service limitations and geographical restrictions

### CircleTel Products to Test

| CircleTel Product | Expected MTN Wholesale Product | Purpose |
|------------------|-------------------------------|---------|
| **Uncapped Wireless** | Fixed Wireless Broadband | LTE/5G wireless internet packages |
| **SkyFibre** | TBD (Fibre product or Wireless?) | Determine if SkyFibre maps to MTN wholesale offering |
| **Fixed LTE** | Fixed Wireless Broadband | Fixed wireless installations |
| **5G Packages** | Fixed Wireless Broadband (5G) | 5G-specific offerings |
| **Business LTE** | Enterprise Fixed Wireless | Business-grade wireless services |

---

## MTN Business Portal Testing Procedure

### Step 1: Login to Portal

1. Navigate to https://asp-feasibility.mtnbusiness.co.za/wholesale_customers/map
2. Enter credentials:
   - Username: `Lindokuhle.mdake@circletel.co.za`
   - Password: `Lwandle@1992*`
3. Complete reCAPTCHA verification
4. Click **LOGIN**
5. Handle any 2FA or additional authentication steps

### Step 2: Test Address Selection

**Test Address**: `1 Commissioner Street, Johannesburg CBD`
- **Reason**: Already tested with other MTN APIs for comparison
- **Coordinates**: -26.2028787, 28.0657856
- **Known Results**:
  - MTN Consumer: Uncapped Home Internet AVAILABLE
  - MTN Fibre: NO coverage
  - MTN Business (previous test): Fixed Wireless Broadband NOT FEASIBLE

### Step 3: Product Testing Checklist

For EACH product below, test with the Johannesburg CBD address:

#### 3.1 Fixed Wireless Broadband (LTE)
**Settings**:
- Product: Fixed Wireless Broadband
- SLA: 99%
- Capacity: 10 Mbps, 20 Mbps, 50 Mbps (test multiple)
- Technology: LTE

**Record**:
- [ ] Feasible? (Yes/No)
- [ ] Number of feasible sites
- [ ] Site IDs returned
- [ ] Processing time
- [ ] Error messages (if any)

**Expected Result**: Based on previous testing - NOT FEASIBLE at JHB CBD

**CircleTel Mapping**:
- Maps to: Uncapped Wireless packages
- Maps to: Fixed LTE service type

---

#### 3.2 Fixed Wireless Broadband (5G)
**Settings**:
- Product: Fixed Wireless Broadband
- SLA: 99%
- Capacity: 50 Mbps, 100 Mbps (test multiple)
- Technology: 5G (if selectable)

**Record**:
- [ ] Feasible? (Yes/No)
- [ ] Number of feasible sites
- [ ] Site IDs returned
- [ ] Processing time
- [ ] Available speeds

**Expected Result**: Unknown - test to determine 5G availability

**CircleTel Mapping**:
- Maps to: 5G packages
- Maps to: High-speed wireless offerings

---

#### 3.3 Business/Enterprise Wireless
**Settings**:
- Look for business-specific wireless products
- SLA: Higher tier (99.5%, 99.9%)
- Capacity: Various speeds

**Record**:
- [ ] Product name available
- [ ] Feasible? (Yes/No)
- [ ] Pricing differences vs consumer
- [ ] SLA options

**CircleTel Mapping**:
- Maps to: Business LTE packages
- Maps to: Enterprise wireless solutions

---

#### 3.4 Fibre Products (if available)
**Settings**:
- Search for any fibre-related wholesale products
- Various speed tiers

**Record**:
- [ ] Product name
- [ ] Feasible? (Yes/No)
- [ ] Speed options
- [ ] Installation requirements

**Expected Result**: Likely NOT available (MTN Fibre site showed no coverage)

**CircleTel Mapping**:
- Determine if "SkyFibre" is actually MTN fibre or wireless product

---

#### 3.5 Other Wholesale Products
**Check for**:
- Voice services
- SMS services
- Data-only products
- IoT/M2M services

**Record any products that may be relevant to CircleTel offerings**

---

## Step 4: Compare Results Across All MTN APIs

### Five-Way Comparison for JHB CBD

| Product/Service | Our Project | MTN WMS | MTN Consumer | MTN Fibre | MTN Business | Match? |
|----------------|-------------|---------|-------------|-----------|-------------|--------|
| **Fibre** | ✅ YES | ❓ Unknown | ➡️ Check link | ❌ NO | TBD | ❌ FALSE POSITIVE |
| **Fixed LTE/Wireless** | ✅ YES | ❓ Unknown | ✅ YES (Home Internet) | N/A | ❌ NO (previous) | ⚠️ INCONSISTENT |
| **LTE** | ✅ YES | ✅ YES | ✅ YES (4G) | N/A | TBD | ✅ MATCH |
| **5G** | ✅ YES | ✅ YES | ✅ YES | N/A | TBD | ✅ MATCH |

**Goal**: Fill in TBD cells with actual MTN Business Portal results

---

## Step 5: Test Additional Addresses

After completing JHB CBD testing, test these additional addresses from Phase 3 Gauteng testing:

### 5.1 Heritage Hill, Centurion
**Address**: `Heritage Hill, Centurion`
**Known Results**: Our project shows 4/4 services

**Test**:
- [ ] Fixed Wireless Broadband (LTE)
- [ ] Fixed Wireless Broadband (5G)
- [ ] Any fibre products

---

### 5.2 Simonsvlei Winery, Paarl
**Address**: `Simonsvlei Winery, Old Paarl Rd, R101, Paarl, 7624`
**Known Results**: Our project shows 4/4 services

**Test**:
- [ ] Fixed Wireless Broadband (LTE)
- [ ] Fixed Wireless Broadband (5G)
- [ ] Any fibre products

---

### 5.3 Lambert's Bay
**Address**: `102 Voortrekker St, Lambert's Bay, 8130`
**Known Results**: Our project shows 4/4 services

**Test**:
- [ ] Fixed Wireless Broadband (LTE)
- [ ] Fixed Wireless Broadband (5G)
- [ ] Any fibre products

---

## Step 6: Document Product Mappings

### CircleTel → MTN Wholesale Product Mapping

Based on test results, create definitive mapping:

```
CircleTel Product                → MTN Wholesale Product
=====================================================================================================
Uncapped Wireless (LTE)         → [FILL IN FROM TESTING]
Uncapped Wireless (5G)          → [FILL IN FROM TESTING]
Fixed LTE                       → [FILL IN FROM TESTING]
5G Packages                     → [FILL IN FROM TESTING]
SkyFibre                        → [FILL IN FROM TESTING - Determine if fibre or wireless]
Business LTE                    → [FILL IN FROM TESTING]
```

### Service Type Definitions

Update `/lib/coverage/mtn/types.ts` with accurate service type mappings:

```typescript
export type MTNServiceType =
  | 'fibre'           // [VERIFY: Does MTN actually provide fibre wholesale?]
  | 'fixed_lte'       // Maps to: [FILL IN]
  | 'LTE'             // Maps to: [FILL IN]
  | '5G'              // Maps to: [FILL IN]
  | 'fixed_wireless'  // Maps to: [FILL IN]
```

---

## Expected Outcomes

### 1. Product Mapping Clarity
After manual testing, we should have clear answers to:
- ✅ What MTN wholesale product equals our "Uncapped Wireless"?
- ✅ What MTN wholesale product equals our "SkyFibre"?
- ✅ Does MTN Business sell fibre wholesale, or is it only wireless?
- ✅ What is the difference between consumer "Uncapped Home Internet" and wholesale "Fixed Wireless Broadband"?

### 2. Coverage Accuracy
Understand why our project shows different results:
- ✅ Is PostGIS fallback using outdated product definitions?
- ✅ Are we mapping service types incorrectly?
- ✅ Should we use MTN Consumer API instead of Business API for certain products?

### 3. Service Type Corrections
Fix our coverage checking logic:
- Remove "fibre" from MTN service types if MTN doesn't sell fibre wholesale
- Update "fixed_lte" to map correctly to wholesale product names
- Clarify when to show LTE vs 5G vs Fixed Wireless

---

## Screenshots to Capture

For each product tested, capture screenshots:

1. **Product Selection Screen** - Showing all available wholesale products
2. **Feasibility Results** - For both feasible and infeasible results
3. **Site Details** - If feasible sites are returned
4. **Error Messages** - If any occur
5. **Capacity/Speed Options** - Available tiers for each product

**Save to**: `.playwright-mcp/coverage/mtn-business-[product-name]-[result].png`

---

## Known Issues to Investigate

### Issue 1: B2B vs B2C Product Availability
**Question**: Why does MTN Consumer site show "Uncapped Home Internet" available at JHB CBD, but MTN Business shows "Fixed Wireless Broadband" NOT FEASIBLE?

**Possible Explanations**:
1. Different products (consumer vs wholesale)
2. Different coverage areas
3. Wholesale has stricter requirements (SLA, capacity)
4. Business portal uses different API/data source

**Test**: Compare results across all capacity/SLA combinations

---

### Issue 2: SkyFibre Product Identification
**Question**: Is CircleTel "SkyFibre" actually a fibre product or a wireless product branded as "fibre"?

**Test**:
1. Check MTN Business portal for any fibre wholesale products
2. If no fibre found, SkyFibre is likely wireless (fixed LTE/5G)
3. Update product naming to avoid customer confusion

---

### Issue 3: Service Count Discrepancy
**Question**: Why does our project show 4/4 services for ALL addresses?

**Hypothesis**: PostGIS fallback returns cached "full coverage" data

**Test**: After manual testing, compare actual MTN Business results with our project results to confirm PostGIS is the issue

---

## Next Steps After Manual Testing

### Immediate Actions
1. ✅ Update `MTN_BUSINESS_PORTAL_MANUAL_TESTING_GUIDE.md` with actual results
2. ✅ Create product mapping documentation based on findings
3. ✅ Fix service type definitions in codebase
4. ✅ Update coverage disclaimers with accuracy information

### Code Changes Required
1. Update `/lib/coverage/mtn/types.ts` with correct service type mappings
2. Update `/lib/coverage/aggregation-service.ts` to use correct product names
3. Fix PostGIS fallback logic to prevent false positives
4. Add data source logging to track which API is being used

### Documentation Updates
1. Update `MTN_FIVE_WAY_VALIDATION_COMPLETE.md` with Business Portal results
2. Update `MTN_FINAL_VALIDATION_COMPARISON.md` with complete five-way comparison
3. Create `MTN_PRODUCT_MAPPING_GUIDE.md` for CircleTel → MTN product reference

---

## Testing Checklist Summary

**Before Testing**:
- [ ] Verify MTN Business Portal credentials work
- [ ] Handle any 2FA or additional authentication
- [ ] Prepare screenshot capture tool

**During Testing**:
- [ ] Test Fixed Wireless Broadband (LTE) - Multiple capacity levels
- [ ] Test Fixed Wireless Broadband (5G) - If available
- [ ] Test Business/Enterprise wireless products - If available
- [ ] Test Fibre products - If available
- [ ] Test at minimum 3 addresses (JHB CBD, Heritage Hill, Lambert's Bay)
- [ ] Capture screenshots of all results
- [ ] Document processing times and site IDs

**After Testing**:
- [ ] Create comprehensive product mapping document
- [ ] Update MTN validation comparison documents
- [ ] Identify code changes needed
- [ ] Update service type definitions
- [ ] Fix PostGIS fallback logic

---

## Contact Information

**MTN Business Support**:
- Portal issues: Contact MTN Business support for portal access problems
- API questions: Contact MTN Business technical support

**CircleTel Internal**:
- Product mapping questions: [Product team]
- Coverage accuracy issues: [Technical team]
- Customer impact: [Support team]

---

## Appendix: Previous Test Results

### Fixed Wireless Broadband Test (2025-10-04)
**Address**: 1 Commissioner Street, central, Johannesburg
**Product**: Fixed Wireless Broadband
**SLA**: 99%
**Capacity**: 10 Mbps
**Result**: ❌ NOT FEASIBLE (Infeasible Sites: 1, Feasible Sites: 0)
**Processing Time**: 0.353 seconds
**Site ID**: FS014517917

**Conclusion**: MTN Business wholesale does NOT offer Fixed Wireless Broadband at Johannesburg CBD, contradicting MTN Consumer site which shows "Uncapped Home Internet" available.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-04
**Status**: AWAITING MANUAL TESTING

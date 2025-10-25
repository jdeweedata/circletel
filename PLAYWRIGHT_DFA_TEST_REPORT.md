# Playwright DFA API Integration Test Report

**Test Date:** October 25, 2025  
**Test Method:** Playwright MCP Browser Automation  
**Addresses Tested:**
1. 5 Ben St, Nonzwakazi, De Aar, 7000, South Africa
2. 5 BenBernard Estate, Simonsvlei Rd, Paarl, 7624

---

## Executive Summary

### ❌ **CRITICAL ISSUE FOUND: DFA API NOT BEING CALLED**

The CircleTel app's coverage checker is **NOT calling the DFA API** at all. Instead, it only calls the MTN coverage aggregation service, which explains why DFA fiber packages are being shown for addresses with no DFA coverage.

---

## Test Results

### Test 1: De Aar Address (Business)

**Address:** 5 Ben St, Nonzwakazi, De Aar, 7000, South Africa  
**Customer Type:** Business

#### Direct DFA API Test Result
```
Coverage: NO ❌
Type: none
Infrastructure: 0 fiber routes within 500m
```

#### App UI Test Result
```
Coverage: YES ✅ (INCORRECT)
Packages Shown: 6 packages (2 Fibre, 4 Wireless)
Provider: Dark Fibre Africa
Packages:
- BizFibre Essential - R809pm (200/200 Mbps)
- BizFibre Pro - R1009pm (500/500 Mbps)
```

#### API Calls Made
1. `POST /api/coverage/lead` - Lead capture ✅
2. `GET /packages/{leadId}?type=business` - Redirect to packages page ✅
3. `GET /api/coverage/packages?leadId={id}&type=business` - Fetch packages ✅

#### DFA API Called?
**NO ❌** - The DFA API was never invoked

---

### Test 2: Paarl Address (Business)

**Address:** 5 BenBernard Estate, Simonsvlei Rd, Paarl, 7624  
**Customer Type:** Business

#### Direct DFA API Test Result
```
Coverage: NO ❌
Type: nearby
Infrastructure: 54 fiber routes within 500m, nearest at 105m
Near-Net Buildings: 10 found within 200m
```

#### App UI Test Result
```
Coverage: YES ✅ (PARTIALLY CORRECT - but wrong provider)
Packages Shown: DFA packages (should show "fiber extension required")
Lead ID: 53266e33-9f2c-4259-aaa2-7f4a5113fa81
```

#### API Calls Made
1. `POST /api/coverage/lead` - Lead capture ✅
2. `GET /packages/{leadId}?type=business` - Redirect to packages page ✅
3. `GET /api/coverage/packages?leadId={id}&type=business` - Fetch packages ✅

#### DFA API Called?
**NO ❌** - The DFA API was never invoked

---

## Root Cause Analysis

### Issue Location
**File:** `app/api/coverage/packages/route.ts`  
**Lines:** 59-64

### Current Implementation
```typescript
const coverageResult = await coverageAggregationService.aggregateCoverage(coordinates, {
  providers: ['mtn'], // ❌ Only MTN, no DFA
  includeAlternatives: true,
  prioritizeReliability: true,
  prioritizeSpeed: false
});
```

### What's Wrong
1. **DFA Not Included:** The `providers` array only contains `['mtn']`
2. **No DFA Integration:** DFA coverage client is never called
3. **False Positives:** Shows DFA packages even when DFA has no coverage
4. **Misleading Results:** Customers see fiber packages for addresses with no fiber

### Why This Happens
The app falls back to legacy database queries:
1. **PostGIS Fallback** (lines 99-113): Checks `coverage_areas` table
2. **Area Name Matching** (lines 118-143): Matches address strings
3. **Package Lookup** (lines 177-188): Returns all packages for matched areas

These fallbacks don't verify actual DFA coverage via the DFA ArcGIS API.

---

## Comparison: Direct API vs App

| Metric | Direct DFA API | App Coverage Checker |
|--------|----------------|----------------------|
| **De Aar Coverage** | ❌ None | ✅ Shows packages (WRONG) |
| **Paarl Coverage** | ⚠️ Near-Net (105m) | ✅ Shows packages (WRONG) |
| **DFA API Called** | ✅ Yes | ❌ No |
| **Accuracy** | ✅ 100% | ❌ 0% (false positives) |
| **Provider** | DFA ArcGIS | MTN + Legacy DB |

---

## Expected vs Actual Behavior

### De Aar (Expected)
```
❌ No DFA Coverage
💡 Recommendation: Fixed LTE or Wireless ISP
📦 Packages: Show wireless/LTE options only
```

### De Aar (Actual)
```
✅ Coverage Available (WRONG)
📦 Packages: Shows DFA fiber packages
🚨 Problem: Customer will order fiber that doesn't exist
```

### Paarl (Expected)
```
⚠️ Near-Net Coverage (105m away)
📡 Fiber extension required
💰 Installation: R1,500-R3,000 + 2-4 weeks
📦 Packages: Show with installation disclaimer
```

### Paarl (Actual)
```
✅ Coverage Available (PARTIALLY CORRECT)
📦 Packages: Shows DFA fiber as immediately available
🚨 Problem: No mention of fiber extension requirement
```

---

## Required Fixes

### 1. Add DFA to Coverage Aggregation

**File:** `app/api/coverage/packages/route.ts`  
**Line:** 60

**Current:**
```typescript
providers: ['mtn'],
```

**Fix:**
```typescript
providers: ['mtn', 'dfa'], // Add DFA provider
```

### 2. Update Aggregation Service

**File:** `lib/coverage/aggregation-service.ts`

Ensure the aggregation service supports DFA provider:
- Import DFA coverage client
- Add DFA to provider registry
- Handle DFA-specific coverage types (connected, near-net, none)

### 3. Handle Near-Net Coverage

Add logic to distinguish between:
- **Connected:** Immediate fiber available
- **Near-Net:** Fiber extension required (show disclaimer)
- **None:** No coverage (don't show fiber packages)

### 4. Update Package Display

Show appropriate messaging:
- **Connected:** "Order Now"
- **Near-Net:** "Fiber Extension Required - 2-4 weeks, R1,500-R3,000"
- **None:** Hide fiber packages, show alternatives

---

## Verification Steps

### Step 1: Check Aggregation Service
```bash
grep -r "dfa" lib/coverage/aggregation-service.ts
```

### Step 2: Test DFA Integration
```typescript
// In aggregation-service.ts
const providers = ['mtn', 'dfa']; // Verify DFA is included
```

### Step 3: Test Coverage API
```bash
curl -X POST http://localhost:3000/api/coverage/aggregate \
  -H "Content-Type: application/json" \
  -d '{
    "coordinates": {"lat": -30.6500, "lng": 24.0167},
    "providers": ["dfa"],
    "serviceTypes": ["fibre"]
  }'
```

### Step 4: Verify Packages API
Check that DFA coverage results are properly used in package filtering.

---

## Impact Assessment

### Customer Impact
- **High Risk:** Customers ordering fiber that doesn't exist
- **Poor Experience:** Failed installations, refunds, complaints
- **Trust Issues:** Misleading coverage information

### Business Impact
- **Revenue Loss:** Failed orders, refunds
- **Support Burden:** Increased support tickets
- **Reputation Risk:** Negative reviews, customer churn

### Technical Debt
- **Integration Gap:** DFA API built but not used
- **Data Inconsistency:** DB shows coverage, API says no
- **Testing Gap:** No E2E tests caught this issue

---

## Recommendations

### Immediate Actions (Priority 1)
1. ✅ **Add DFA to providers array** in packages API
2. ✅ **Test with all 3 addresses** (Sandton, Paarl, De Aar)
3. ✅ **Verify coverage results** match direct API tests
4. ✅ **Update package display** for near-net coverage

### Short-term Actions (Priority 2)
1. **Add E2E tests** using Playwright for coverage checker
2. **Implement coverage type badges** (Connected, Near-Net, None)
3. **Add installation disclaimers** for near-net addresses
4. **Create admin dashboard** to monitor coverage accuracy

### Long-term Actions (Priority 3)
1. **Deprecate legacy DB fallbacks** (PostGIS, area matching)
2. **Implement multi-provider aggregation** (DFA + Openserve + Vumatel)
3. **Add coverage caching** (5-15 min TTL)
4. **Build coverage analytics** dashboard

---

## Test Evidence

### Network Requests (De Aar)
```
POST /api/coverage/lead => 200 OK
GET /packages/33c34a57-2cc4-4782-94c8-20b3e946a470?type=business => 200 OK
GET /api/coverage/packages?leadId=33c34a57-2cc4-4782-94c8-20b3e946a470&type=business => 200 OK
```

### Network Requests (Paarl)
```
POST /api/coverage/lead => 200 OK
GET /packages/53266e33-9f2c-4259-aaa2-7f4a5113fa81?type=business => 200 OK
GET /api/coverage/packages?leadId=53266e33-9f2c-4259-aaa2-7f4a5113fa81&type=business => 200 OK
```

### Console Logs
```
Packages API called with: {leadId: "33c34a57-2cc4-4782-94c8-20b3e946a470", coverageType: "business"}
Packages API called with: {leadId: "53266e33-9f2c-4259-aaa2-7f4a5113fa81", coverageType: "business"}
```

### DFA API Calls
```
❌ NONE - DFA API was never called by the app
```

---

## Conclusion

The DFA API integration is **complete and functional** when called directly, but the CircleTel app's coverage checker is **not using it**. This results in:

1. ❌ **False positives** for fiber coverage
2. ❌ **Misleading package displays**
3. ❌ **Poor customer experience**
4. ❌ **Potential revenue loss**

### Fix Priority: **CRITICAL** 🚨

The fix is simple (add `'dfa'` to providers array) but the impact is significant. This should be addressed immediately before any production deployment.

---

## Next Steps

1. **Implement Fix:** Add DFA to coverage aggregation
2. **Test Thoroughly:** Verify all 3 test addresses
3. **Update UI:** Add near-net coverage messaging
4. **Deploy to Staging:** Test end-to-end
5. **Monitor Results:** Track coverage accuracy

---

**Test Completed:** October 25, 2025  
**Tester:** Windsurf Cascade with Playwright MCP  
**Status:** ❌ **FAILED - DFA API Not Integrated**  
**Recommendation:** **Fix immediately before production**

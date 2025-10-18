# Supersonic API Investigation Results

**Date**: January 16, 2025
**Status**: ⚠️ Issue Discovered - Empty Packages Response
**Investigation**: Direct API testing completed

---

## Executive Summary

✅ **Lead Creation**: WORKING (200 OK)
❌ **Package Retrieval**: EMPTY ARRAYS (0 packages returned)
⚠️ **Issue**: Packages endpoint returns successfully but with no package data

---

## Test Results

### Test 1: Centurion (Heritage Hill) - 5G Expected

**Lead Creation** `/api/lead`:
```json
POST https://supersonic.agilitygis.com/api/lead
Status: 200 OK

Request:
{
  "address": "18 Rasmus Erasmus Boulevard, Heritage Hill, Centurion",
  "latitude": -25.903104,
  "longitude": 28.1706496,
  "source": "circletel_test"
}

Response:
{
  "LeadEntityID": 72856616,
  "LeadNumber": "SSL05880043",
  "LeadOwnerEntityID": 5122336,
  "LeadOwnerEntityDescription": "Supersonic",
  "Latitude": -25.903104,
  "Longitude": 28.1706496,
  "FeasibilityStatus": "Pending",  ⚠️
  "Feasibility": "None",            ⚠️
  "PublicSiteInstanceID": 45,
  ...
}
```

**Package Retrieval** `/api/availablepackages`:
```json
GET https://supersonic.agilitygis.com/api/availablepackages?LeadEntityID=72856616
Status: 200 OK

Response: []  ❌ EMPTY ARRAY
```

### Test 2: Cape Town CBD - Fibre Expected
- ✅ Lead Created: `LeadEntityID: 72856618`
- ❌ Packages: Empty array `[]`

### Test 3: Johannesburg CBD - Fibre Expected
- ✅ Lead Created: `LeadEntityID: 72856619`
- ❌ Packages: Empty array `[]`

---

## Root Cause Analysis

### Hypothesis 1: Asynchronous Feasibility Check ⭐ LIKELY
**Evidence**:
- Lead response shows `"FeasibilityStatus": "Pending"`
- Lead response shows `"Feasibility": "None"`
- Package retrieval happens immediately after lead creation

**Theory**: The Supersonic backend performs asynchronous feasibility checks. Packages become available only after feasibility check completes (could take 5-30 seconds).

**Test**:
```typescript
// Create lead
const lead = await createLead(address, lat, lng);

// Wait for feasibility check
await sleep(30000); // 30 seconds

// Retry packages
const packages = await getPackages(lead.LeadEntityID);
```

### Hypothesis 2: PublicSiteInstanceID Mismatch
**Evidence**:
- Response shows `"PublicSiteInstanceID": 45` (Supersonic)
- CircleTel customer portal uses `PublicSiteInstanceID: 85`

**Theory**: Packages might be configured per site instance. We're creating leads under Supersonic instance (45) instead of CircleTel instance (85).

**Test**:
```typescript
// Try creating lead with CircleTel site instance
POST https://circletel-customer.agilitygis.com/api/lead
```

### Hypothesis 3: Session/Cookie Requirement
**Evidence**:
- Browser-based testing on supersonic.co.za shows packages
- Direct API calls return empty arrays

**Theory**: Package retrieval requires browser session cookies or specific headers that establish user session context.

**Test**:
```typescript
// Capture cookies from successful browser session
// Replay with same cookies in API call
```

### Hypothesis 4: Different Endpoint for Packages
**Evidence**:
- Documentation shows `/api/availablepackages?LeadEntityID=X`
- May be different for CircleTel tenant

**Theory**: CircleTel might use a different packages endpoint.

**Test**:
- Monitor CircleTel customer portal network traffic during full flow
- Capture actual packages endpoint used

---

## Recommended Solutions

### Solution 1: Implement Retry with Delay ⭐ RECOMMENDED
```typescript
async function getPackagesWithRetry(leadEntityID: number, maxRetries = 3, delayMs = 10000) {
  for (let i = 0; i < maxRetries; i++) {
    const packages = await fetch(`/api/availablepackages?LeadEntityID=${leadEntityID}`);

    if (packages.length > 0) {
      return packages;
    }

    // Wait for feasibility check to complete
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  throw new Error('No packages available after feasibility check timeout');
}
```

**Pros**:
- ✅ Simple implementation
- ✅ Handles async feasibility checks
- ✅ No infrastructure changes needed

**Cons**:
- ⚠️ Adds latency (10-30 seconds)
- ⚠️ May still return empty if feasibility fails

### Solution 2: Use CircleTel Customer Portal API
```typescript
// Create leads via CircleTel portal domain
POST https://circletel-customer.agilitygis.com/api/lead

// With PublicSiteInstanceID: 85
```

**Pros**:
- ✅ Uses CircleTel-specific configuration
- ✅ May have pre-configured packages

**Cons**:
- ❌ Requires authentication (401 on `/api/auth/validate`)
- ❌ More complex integration
- ❌ Need to reverse-engineer auth flow

### Solution 3: Fallback to Existing MTN API ⭐ PRACTICAL
```typescript
// Try Supersonic first
const supersonicPackages = await trySupersonic(address, lat, lng);

if (supersonicPackages.length === 0) {
  // Fallback to MTN Consumer API
  const mtnCoverage = await coverageAggregationService.aggregateCoverage(...);
  return getPackagesFromMTNCoverage(mtnCoverage);
}
```

**Pros**:
- ✅ Reliable fallback
- ✅ Already implemented and working
- ✅ No dependency on Supersonic API issues

**Cons**:
- ⚠️ Doesn't use Supersonic pricing
- ⚠️ Manual package mapping required

### Solution 4: Contact AgilityGIS for Support
**Action Items**:
1. Email support@supersonic.co.za or support@agilitygs.co.za
2. Explain the empty packages issue
3. Request:
   - Official API documentation
   - API key for authenticated access
   - CircleTel-specific endpoint guidance
   - Explanation of feasibility check timing

**Pros**:
- ✅ Official guidance
- ✅ May reveal proper integration method
- ✅ Potential API key for better access

**Cons**:
- ⏳ Requires waiting for response
- ⚠️ May not get enterprise support

---

## Immediate Next Steps

### Priority 1: Test Retry with Delay
```bash
# Create script to test delayed package retrieval
npx tsx scripts/test-supersonic-with-delay.ts
```

### Priority 2: Browser Session Analysis
Use Playwright to:
1. Navigate to supersonic.co.za
2. Complete full coverage check flow
3. Capture cookies and session tokens
4. Replay with same cookies

### Priority 3: Implement Hybrid Approach
```typescript
// lib/coverage/supersonic/client-with-fallback.ts
export async function checkCoverageWithFallback(address, lat, lng) {
  // Try Supersonic with retry
  try {
    const lead = await createLead(address, lat, lng);

    // Retry packages with exponential backoff
    const packages = await retryPackages(lead.LeadEntityID, {
      maxRetries: 3,
      initialDelay: 5000,
      maxDelay: 30000
    });

    if (packages.length > 0) {
      return { source: 'supersonic', packages };
    }
  } catch (error) {
    console.warn('Supersonic API failed, using fallback');
  }

  // Fallback to MTN API
  return { source: 'mtn', packages: await getMTNPackages(lat, lng) };
}
```

---

## Updated Integration Plan

### Phase 1: Investigate Timing (Day 1) ⭐ IN PROGRESS
- [x] Test direct API calls
- [ ] Test with 10-second delay
- [ ] Test with 30-second delay
- [ ] Identify optimal retry strategy

### Phase 2: Browser Session Analysis (Day 2)
- [ ] Capture successful browser flow
- [ ] Identify required cookies/headers
- [ ] Test with captured session data
- [ ] Document findings

### Phase 3: Implement Solution (Day 3-4)
**If retry works**:
- Implement retry logic with exponential backoff
- Add caching layer
- Update SupersonicProvider

**If session required**:
- Implement Playwright-based session manager
- Create server-side proxy with session handling
- Add session refresh logic

**If neither works**:
- Implement pure fallback approach
- Use MTN API as primary
- Consider Supersonic for pricing reference only

### Phase 4: Production Deployment (Day 5-6)
- Test with real user addresses
- Monitor success rates
- Implement analytics
- Document workarounds

---

## Success Criteria (Revised)

| Criteria | Original | Revised |
|----------|----------|---------|
| API Response Time | < 2s | < 35s (including retry wait) |
| Package Accuracy | 100% match | 90%+ (with fallback) |
| Supersonic Success Rate | 100% | 70%+ (acceptable with fallback) |
| Overall Coverage Check Success | 100% | 99%+ (including all fallback layers) |

---

## Related Documentation

- [Production Coverage API Endpoints](./PRODUCTION_COVERAGE_API_ENDPOINTS.md)
- [CircleTel Customer API Findings](./CIRCLETEL_CUSTOMER_API_FINDINGS.md)
- [Supersonic Integration Spec](./SUPERSONIC_INTEGRATION_SPEC.md)

---

**Status**: ⚠️ Issue Identified - Requires Further Investigation
**Blocker**: Empty packages response
**Recommendation**: Test retry-with-delay approach, implement robust fallback chain
**Next Action**: Create delayed retry test script

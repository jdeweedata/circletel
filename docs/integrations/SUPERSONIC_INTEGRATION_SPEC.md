# Supersonic API Integration Specification

**Date**: October 15, 2025
**Status**: Ready for Development
**Version**: 1.0

---

## 1. Overview & Objectives

### Problem Statement
CircleTel's current coverage checker returns generic package lists without:
- Real-time pricing information
- Location-specific technology recommendations
- Actual package availability validation
- Competitive market insights

### Solution
Integrate Supersonic AgilityGIS API (production-ready, MTN-backed) to provide:
- ✅ Real-time, location-specific package recommendations
- ✅ Actual pricing (both promotional and standard rates)
- ✅ Technology detection (5G vs Fibre based on infrastructure)
- ✅ Validated coverage with fallback layers

### Success Criteria
1. 100% accuracy match with Supersonic results
2. API response time < 2 seconds
3. Cache hit rate > 80%
4. Fallback reliability 99.9%
5. Zero authentication required (unlike MTN Business FAPI)

---

## 2. Functional Requirements

### FR-1: Coverage Lead Creation
**Requirement**: Create a coverage lead at Supersonic to initiate package lookup

**Inputs**:
- `address`: Full address string (e.g., "18 Rasmus Erasmus, Centurion")
- `latitude`: Coordinate (-25.903104)
- `longitude`: Coordinate (28.1706496)
- `source`: Origin identifier ("circletel_web")

**Expected Output**:
```json
{
  "LeadEntityID": 72849626,
  "success": true
}
```

**Error Handling**:
- Invalid coordinates → Return 400 with validation error
- API timeout → Fallback to PostGIS after 3 seconds
- Network error → Return cached result if available

---

### FR-2: Technology Detection
**Requirement**: Determine available technology (5G or Fibre) based on location

**Logic**:
```
IF coordinates in CBD area AND fibre infrastructure exists
  → PRIMARY: Fibre, ALTERNATIVES: [5G]
ELSE IF 5G coverage exists
  → PRIMARY: 5G, ALTERNATIVES: [AirFibre, LTE]
ELSE
  → PRIMARY: AirFibre, ALTERNATIVES: [LTE]
```

**CBD Detection**: Use geographic boundaries for major cities:
- Cape Town: -33.9249, 18.4241 (±2km radius)
- Johannesburg: -26.2023, 28.0436 (±2km radius)
- Durban: -29.8587, 31.0292 (±2km radius)

---

### FR-3: Package Retrieval
**Requirement**: Fetch available packages from Supersonic based on LeadEntityID

**Inputs**:
- `LeadEntityID`: ID from lead creation (72849626)

**Expected Output**:
```json
{
  "packages": [
    {
      "id": 1,
      "name": "5G Capped 60GB",
      "type": "5G",
      "price": 279,
      "promo_price": 279,
      "data_day": "60GB",
      "data_night": "60GB",
      "router_charge": 399,
      "contract": "Month-to-Month"
    }
  ]
}
```

---

### FR-4: Package Mapping
**Requirement**: Map Supersonic packages to CircleTel schema

**Mapping Logic**:

| Supersonic Field | CircleTel Field | Transform |
|------------------|-----------------|-----------|
| name | name | Direct |
| type | technology_type | "5G" → "5g-lte" |
| price | regular_price | Direct (R value) |
| promo_price | promo_price | Direct if < 3 months old |
| data_day + data_night | data_limit | Combine: "{day}GB day + {night}GB night" |
| contract | billing_cycle | Direct |

---

## 3. Technical Requirements

### TR-1: API Architecture

**Layers (Priority Order)**:
1. Supersonic AgilityGIS API (primary)
2. MTN Consumer API (current, keeps working)
3. PostGIS geographic query (fallback)
4. Coverage areas lookup (legacy)

**Implementation**:
```typescript
// Layer 1: Try Supersonic
const supersonicPackages = await checkSupersonicCoverage(lat, lng, address);
if (supersonicPackages?.length > 0) {
  return mapToCircleTelSchema(supersonicPackages);
}

// Layer 2: Try MTN Consumer API (existing)
const mtnCoverage = await coverageAggregationService.aggregateCoverage(...);
if (mtnCoverage?.overallCoverage) {
  return mtnPackages;
}

// Layer 3: Try PostGIS
const postgisResults = await supabase.rpc('check_coverage_at_point', ...);
if (postgisResults?.length > 0) {
  return postgisPackages;
}

// Layer 4: Fallback to coverage areas
return await getCoverageAreaPackages(address);
```

### TR-2: Error Handling

| Error | Status | Fallback | Log Level |
|-------|--------|----------|-----------|
| Supersonic timeout | 408 | Try next layer | WARN |
| Supersonic 500 | 502 | Try next layer | WARN |
| Invalid coordinates | 400 | Return error | ERROR |
| All layers fail | 503 | Return cached | ERROR |

### TR-3: Caching Strategy

**Cache Key**: `packages:{latitude}:{longitude}`
**TTL**: 5 minutes
**Storage**: Redis (primary) or in-memory (fallback)
**Hit Rate Target**: > 80%

**Invalidation Triggers**:
- Manual cache clear admin command
- Nightly cache refresh (00:00 UTC)
- On infrastructure change (provider maintenance)

### TR-4: Performance Requirements

| Metric | Target | Acceptable |
|--------|--------|-----------|
| Response Time | < 1.5s | < 2s |
| Cache Hit Response | < 100ms | < 200ms |
| API Timeout | 3s | 5s max |
| Throughput | 1000 req/min | 500 req/min min |

---

## 4. Data Model

### Supersonic Package Schema (Input)
```typescript
interface SupersonicPackage {
  id: number;
  name: string;
  type: '5G' | 'Fibre' | 'AirFibre';
  price: number;
  promo_price?: number;
  data_day?: string;
  data_night?: string;
  router_charge?: number;
  fair_usage?: string;
  contract: string;
  tier?: string;
}
```

### CircleTel Package Schema (Output)
```typescript
interface CircleTelPackage {
  id: string;
  name: string;
  technology_type: 'fibre' | '5g-lte' | 'airfibre';
  regular_price: number;
  promo_price: number | null;
  data_limit: string;
  speed_download: string;
  speed_upload: string;
  billing_cycle: 'monthly' | 'prepaid';
  router_included: boolean;
  features: string[];
}
```

### Cache Schema
```typescript
interface CachedPackage {
  leadEntityID: number;
  latitude: number;
  longitude: number;
  packages: SupersonicPackage[];
  technology: string;
  cached_at: timestamp;
  expires_at: timestamp;
}
```

---

## 5. API Specifications

### Endpoint 1: Create Supersonic Lead
```
POST /api/coverage/supersonic/lead

Request:
{
  "address": "18 Rasmus Erasmus, Centurion",
  "latitude": -25.903104,
  "longitude": 28.1706496
}

Response (200):
{
  "success": true,
  "leadEntityID": 72849626,
  "technology": "5g",
  "packageCount": 6,
  "cached": false
}

Response (502):
{
  "success": false,
  "error": "Supersonic API unavailable",
  "fallback": "using_postgis"
}
```

### Endpoint 2: Get Available Packages
```
GET /api/coverage/supersonic/packages?leadEntityID=72849626

Response (200):
{
  "success": true,
  "packages": [
    {
      "id": 1,
      "name": "5G Capped 60GB",
      "price": 279,
      "type": "5g-lte",
      "data": "60GB day + 60GB night"
    }
  ],
  "source": "supersonic",
  "cached": false
}
```

### Endpoint 3: Detect Technology
```
GET /api/coverage/technology-detect?lat=-25.903104&lng=28.1706496

Response (200):
{
  "primary": "5g",
  "alternatives": ["airfibre"],
  "confidence": 0.95,
  "reasoning": "Suburban area with 5G coverage"
}
```

---

## 6. Implementation Details

### Step 1: Server-Side Proxy (Day 1-2)
1. Create `app/api/coverage/supersonic/route.ts`
2. Implement POST /api/coverage/supersonic/lead
3. Add error handling and fallback logic
4. Test with 5 known locations

### Step 2: Package Fetching (Day 3)
1. Extend proxy to handle GET /api/coverage/supersonic/packages
2. Implement Supersonic → CircleTel schema mapping
3. Add response validation
4. Test package accuracy

### Step 3: Technology Detection (Day 4-5)
1. Create `lib/coverage/technology-detector.ts`
2. Implement CBD detection logic
3. Add infrastructure checks
4. Test with regional data

### Step 4: Caching Layer (Day 5-6)
1. Set up Redis client
2. Implement cache get/set logic
3. Add cache invalidation
4. Monitor cache hit rates

### Step 5: UI Integration (Day 7-8)
1. Update `components/coverage/AvailablePackages.tsx`
2. Add technology badges
3. Show promotional pricing
4. Display package counts

### Step 6: Testing (Day 9-10)
1. Unit tests for technology detection
2. Integration tests for full flow
3. E2E tests across 5 locations
4. Performance testing under load

---

## 7. Risk Assessment & Mitigation

### Risk 1: Supersonic API Downtime (Medium)
**Impact**: Users can't check coverage
**Likelihood**: Low (MTN-backed, production API)
**Mitigation**:
- Automatic fallback to PostGIS
- Cache results aggressively
- Monitor API availability with alerts

### Risk 2: CORS Issues (Low)
**Impact**: Browser blocks API calls
**Likelihood**: Low (using server proxy)
**Mitigation**:
- Server-side proxy handles all Supersonic calls
- No direct browser-to-Supersonic calls

### Risk 3: Rate Limiting (Medium)
**Impact**: API rejects requests after quota exceeded
**Likelihood**: Medium (shared API, high traffic possible)
**Mitigation**:
- Aggressive caching (5-minute TTL)
- Request queue with backoff
- Contact Supersonic for higher limits

### Risk 4: Pricing Inconsistency (Low)
**Impact**: CircleTel prices differ from Supersonic display
**Likelihood**: Low (both MTN ecosystem)
**Mitigation**:
- Use Supersonic for validation
- Override with CircleTel pricing in UI
- Clear disclosure of pricing source

---

## 8. Deployment Strategy

### Staging Deployment
1. Deploy to staging environment
2. Test with production-like data volume
3. Monitor for 24 hours
4. Validate cache hit rates > 80%

### Production Deployment (Phased)
**Phase 1 (10% users)**:
- Deploy server proxy
- Monitor error rates
- Validate fallback logic

**Phase 2 (50% users)**:
- Enable technology detection
- Monitor package accuracy
- Validate regional recommendations

**Phase 3 (100% users)**:
- Full rollout
- Monitor all metrics
- Enable analytics tracking

### Monitoring & Alerts
```
- API response time > 2s → WARN
- Cache hit rate < 70% → INFO
- Fallback rate > 10% → WARN
- Package accuracy < 99% → ALERT
- Supersonic API down → CRITICAL
```

### Rollback Procedure
1. If error rate > 5%:
   - Disable Supersonic layer
   - Route all traffic to PostGIS
   - Investigate root cause
   - Redeploy after fix

2. If pricing incorrect:
   - Enable pricing override flag
   - Use legacy CircleTel prices
   - Verify accuracy with QA
   - Redeploy with corrections

---

## 9. Acceptance Criteria

### Development Complete When:
- [ ] All 5 API endpoints implemented and tested
- [ ] Package mapping 100% accurate for 5 test locations
- [ ] Cache hit rate > 80% under load test
- [ ] All error scenarios handled with fallbacks
- [ ] Performance meets requirements (< 2s response)
- [ ] Unit test coverage > 90%
- [ ] Integration tests pass all scenarios

### QA Sign-Off When:
- [ ] E2E tests pass for Cape Town, Johannesburg, Durban, Centurion, Pretoria
- [ ] Regional package counts match Supersonic website
- [ ] Pricing accuracy verified (100% match)
- [ ] Fallback behavior tested (API down, timeout, error)
- [ ] Cache invalidation works correctly
- [ ] Performance benchmarks met under load

### Production Ready When:
- [ ] Staging deployment stable for 24+ hours
- [ ] Analytics capturing usage patterns
- [ ] Runbook created for operations
- [ ] On-call alert procedures tested
- [ ] Monitoring dashboards active
- [ ] Customer feedback positive in beta

---

## 10. References

- **API Endpoints**: `PRODUCTION_COVERAGE_API_ENDPOINTS.md`
- **Regional Analysis**: `SUPERSONIC_REGIONAL_COVERAGE_ANALYSIS.md`
- **Integration Plan**: `INTEGRATION_PLAN.md`
- **Current Implementation**: `app/api/coverage/packages/route.ts`

---

**Document Version**: 1.0
**Created**: October 15, 2025
**Status**: ✅ Ready for Development
**Owner**: Development Team

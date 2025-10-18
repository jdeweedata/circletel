# CircleTel Supersonic API Integration Plan

**Date**: October 15, 2025
**Status**: 🎯 Ready for Implementation
**Priority**: HIGH - Immediate Business Impact
**Estimated Effort**: 3-5 days

---

## 📋 Executive Summary

Integrate the production-ready **Supersonic AgilityGIS API** into CircleTel's coverage checker to replace or augment the current PostGIS-based approach. This will provide:

✅ **Real-time, location-specific package recommendations** (proven across 5 SA locations)
✅ **Actual pricing and availability** (no stale data)
✅ **MTN-backed reliability** (Supersonic is MTN-owned)
✅ **Zero authentication barriers** (unlike MTN Business FAPI)
✅ **Technology-aware recommendations** (5G vs Fibre based on infrastructure)

---

## 🏗️ Current State Analysis

### Current Implementation (`app/api/coverage/packages/route.ts`)
**Layers** (in order):
1. **Real-time MTN Consumer API** ✅ (Phase 2 - already enabled)
2. **PostGIS fallback** (legacy coordinate-based queries)
3. **Coverage areas lookup** (area name matching)
4. **Legacy service_packages table** (database fallback)

**Gaps**:
- ❌ No pricing information returned
- ❌ No location-specific package filtering
- ❌ Returns all packages regardless of location
- ❌ No "competitive intelligence" (what else is available)

---

## 🎯 Integration Strategy

### Phase 1: Add Supersonic as Coverage Validator (1-2 days)
**Goal**: Use Supersonic to validate coverage and get real package offerings

**Implementation**:
```typescript
// In app/api/coverage/packages/route.ts

// NEW: Add Supersonic API layer BEFORE PostGIS fallback
async function checkSupersonicCoverage(
  latitude: number,
  longitude: number,
  address: string
) {
  // 1. Create lead at Supersonic
  const leadResponse = await fetch(
    'https://supersonic.agilitygis.com/api/lead',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        latitude,
        longitude,
        source: 'circletel_web'
      })
    }
  );

  const { LeadEntityID } = await leadResponse.json();

  // 2. Get available packages
  const packagesResponse = await fetch(
    `https://supersonic.agilitygis.com/api/availablepackages?LeadEntityID=${LeadEntityID}`
  );

  const packages = await packagesResponse.json();

  // 3. Map to CircleTel schema
  return mapSupersonicPackages(packages);
}
```

**Layer Ordering**:
1. Real-time MTN Consumer API (current)
2. **NEW: Supersonic API** ← Add here
3. PostGIS fallback
4. Coverage areas lookup

---

### Phase 2: Package Pricing & Technology Detection (2-3 days)
**Goal**: Implement Supersonic-like technology recommendation logic

**Key Features**:
- ✅ Show only available technologies (no false promises)
- ✅ Detect CBD vs suburban areas
- ✅ Recommend Fibre for CBDs, 5G for others
- ✅ Display pricing with promotional info

**Implementation**:
```typescript
// lib/coverage/technology-detector.ts
interface TechnologyRecommendation {
  primary: 'fibre' | '5g' | 'airfibre';
  alternatives: string[];
  reasoning: string;
}

async function detectTechnology(
  lat: number,
  lng: number,
  address: string
): Promise<TechnologyRecommendation> {
  // Check if in CBD (using geographic boundaries)
  const inCBD = checkIfCBD(lat, lng);

  // Check actual infrastructure availability
  const hasFibre = await checkFibreInfrastructure(lat, lng);
  const has5G = await check5GCoverage(lat, lng);

  // Recommend based on Supersonic's logic
  if (hasFibre && inCBD) {
    return {
      primary: 'fibre',
      alternatives: has5G ? ['5g'] : [],
      reasoning: 'CBD with fibre infrastructure'
    };
  }

  if (has5G) {
    return {
      primary: '5g',
      alternatives: ['airfibre'],
      reasoning: 'Suburban area with 5G coverage'
    };
  }

  return {
    primary: 'airfibre',
    alternatives: ['lte'],
    reasoning: 'Area without fibre/5G - fallback to AirFibre'
  };
}
```

---

### Phase 3: Enhanced UX & Analytics (2-3 days)
**Goal**: Show Supersonic-level package experience

**Features to Add**:
1. **Package cards with pricing** (promotional vs standard)
2. **Technology badges** (5G, Fibre, AirFibre)
3. **"Show me my deals" CTA** (mimic Supersonic UX)
4. **Regional package availability info** ("This area has X packages")

---

## 🔄 Integration Points

### 1. API Route Enhancement
**File**: `app/api/coverage/packages/route.ts`

**Changes**:
```typescript
// Add Supersonic as primary source
const supersonicPackages = await checkSupersonicCoverage(lat, lng, address);

if (supersonicPackages.length > 0) {
  return NextResponse.json({
    source: 'supersonic',
    packages: supersonicPackages,
    technology: 'location-specific'
  });
}
```

### 2. Package Component Update
**File**: `components/coverage/AvailablePackages.tsx`

**Changes**:
- Add technology icons (5G, Fibre badges)
- Show promotional pricing with countdown
- Display "XX packages available in this area"

### 3. Database Schema (Optional)
**File**: `supabase/migrations/`

**New Table**: `supersonic_package_cache`
```sql
CREATE TABLE supersonic_package_cache (
  id BIGINT PRIMARY KEY,
  latitude DECIMAL,
  longitude DECIMAL,
  packages JSONB,
  technology_type VARCHAR,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

**Purpose**: Cache Supersonic results to reduce API calls

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// tests/coverage-detection.test.ts
describe('Technology Detection', () => {
  it('should detect Fibre for CBDs', async () => {
    const result = await detectTechnology(
      -33.9249, // Cape Town CBD lat
      18.4241   // Cape Town CBD lng
    );
    expect(result.primary).toBe('fibre');
  });

  it('should detect 5G for suburban areas', async () => {
    const result = await detectTechnology(
      -25.903104, // Centurion lat
      28.1706496  // Centurion lng
    );
    expect(result.primary).toBe('5g');
  });
});
```

### Integration Tests
```typescript
// tests/supersonic-integration.test.ts
describe('Supersonic API Integration', () => {
  it('should create lead and fetch packages', async () => {
    const packages = await checkSupersonicCoverage(
      -25.903104,
      28.1706496,
      '18 Rasmus Erasmus, Centurion'
    );

    expect(packages).toHaveLength(6);
    expect(packages[0].type).toBe('5G');
    expect(packages[0].price).toBe(279);
  });
});
```

### Manual E2E Tests
- Test all 5 known locations (Cape Town, Johannesburg, Durban, Centurion, Pretoria)
- Compare results with Supersonic website
- Verify pricing accuracy
- Check fallback behavior if Supersonic API is unavailable

---

## 📊 Success Metrics

### Quantitative
- ✅ Coverage accuracy: 100% match with Supersonic results
- ✅ API response time: < 2 seconds
- ✅ Cache hit rate: > 80% (for repeated queries)
- ✅ Fallback reliability: 99.9%

### Qualitative
- ✅ Users see location-specific packages (not generic list)
- ✅ Pricing displayed prominently
- ✅ Technology recommendations make sense
- ✅ UX matches Supersonic experience (proven winner)

---

## ⚠️ Risks & Mitigations

### Risk 1: Supersonic API Downtime
**Impact**: Can't check coverage
**Mitigation**: Fallback to PostGIS (already in place)
```typescript
try {
  return await checkSupersonicCoverage();
} catch (error) {
  return await checkPostGIScoverage(); // Fallback
}
```

### Risk 2: CORS Issues
**Impact**: API calls blocked by browser
**Mitigation**: Implement server-side proxy
```typescript
// app/api/coverage/supersonic/route.ts
export async function POST(req: NextRequest) {
  // Server makes the call, no CORS issues
  const response = await fetch('https://supersonic.agilitygis.com/api/lead', {
    // Full control from server
  });
}
```

### Risk 3: Rate Limiting
**Impact**: Too many requests rejected
**Mitigation**: Implement aggressive caching + queue
```typescript
const cache = new Map();
const cacheKey = `${lat}-${lng}`;

if (cache.has(cacheKey)) {
  return cache.get(cacheKey); // 5-minute cache
}
```

### Risk 4: Pricing Changes
**Impact**: CircleTel prices different from Supersonic
**Mitigation**: Use Supersonic for validation, override with CircleTel prices
```typescript
const supersonicPackages = await checkSupersonicCoverage();
const withCircleTelPricing = supersonicPackages.map(pkg => ({
  ...pkg,
  circletelPrice: getCircleTelPrice(pkg) // Override
}));
```

---

## 📅 Implementation Timeline

### Week 1 (Days 1-2): Phase 1 - API Integration
- [ ] Create Supersonic proxy API route
- [ ] Add error handling & fallback logic
- [ ] Write unit tests
- [ ] Test on dev environment

### Week 1 (Days 3-4): Phase 2 - Technology Detection
- [ ] Implement CBD detection (lat/lng boundaries)
- [ ] Add technology recommendation logic
- [ ] Create technology-detector service
- [ ] Write integration tests

### Week 1-2 (Days 5-7): Phase 3 - UX Enhancement
- [ ] Update package component with technology badges
- [ ] Add promotional pricing display
- [ ] Implement package count display
- [ ] Add regional package availability info

### Week 2 (Days 8-10): Testing & Deployment
- [ ] Full E2E testing across 5 locations
- [ ] Performance testing & caching optimization
- [ ] Security review (no sensitive data leaks)
- [ ] Deploy to staging
- [ ] Deploy to production

---

## 💻 Code Examples

### Example 1: Server-Side Proxy
```typescript
// app/api/coverage/supersonic/route.ts
export async function POST(req: NextRequest) {
  const { address, latitude, longitude } = await req.json();

  try {
    const response = await fetch(
      'https://supersonic.agilitygis.com/api/lead',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          latitude,
          longitude,
          source: 'circletel_web'
        })
      }
    );

    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json(
      { error: 'Supersonic API failed' },
      { status: 500 }
    );
  }
}
```

### Example 2: Caching with Redis
```typescript
// lib/coverage/package-cache.ts
import { redis } from '@/lib/redis';

export async function getCachedPackages(
  latitude: number,
  longitude: number
) {
  const key = `packages:${latitude}:${longitude}`;

  // Try cache first
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Fetch from Supersonic
  const packages = await checkSupersonicCoverage(latitude, longitude);

  // Cache for 5 minutes
  await redis.setex(key, 300, JSON.stringify(packages));

  return packages;
}
```

### Example 3: Enhanced Package Component
```typescript
// components/coverage/SupersonicPackages.tsx
export function SupersonicPackages({ packages, technology }) {
  return (
    <div className="packages-grid">
      {packages.map(pkg => (
        <div className="package-card">
          <div className="tech-badge">{technology}</div>

          <h3>{pkg.name}</h3>

          <div className="pricing">
            <span className="promo">R{pkg.promo_price}/pm</span>
            <span className="standard">from R{pkg.price}</span>
          </div>

          <div className="features">
            {pkg.data && <span>💾 {pkg.data}</span>}
            {pkg.speed && <span>⚡ {pkg.speed}</span>}
          </div>

          <button>Sign Up Now</button>
        </div>
      ))}
    </div>
  );
}
```

---

## 📚 Documentation References

- **API Endpoints**: `PRODUCTION_COVERAGE_API_ENDPOINTS.md`
- **Regional Analysis**: `SUPERSONIC_REGIONAL_COVERAGE_ANALYSIS.md`
- **Current Implementation**: `app/api/coverage/packages/route.ts`
- **Coverage Service**: `lib/coverage/aggregation-service.ts`

---

## ✅ Approval Checklist

- [ ] Product owner approves integration scope
- [ ] Design team approves new package card UX
- [ ] Backend team reviews API proxy implementation
- [ ] Security team approves CORS handling
- [ ] QA team has testing plan
- [ ] DevOps confirms deployment readiness

---

## 📞 Contact & Support

**Questions?**
- Technical: Review `PRODUCTION_COVERAGE_API_ENDPOINTS.md`
- Regional Data: Review `SUPERSONIC_REGIONAL_COVERAGE_ANALYSIS.md`
- Implementation: Check code examples above

**Escalation**:
- API issues: contact@supersonic.co.za
- CircleTel tech: tech@circletel.co.za

---

**Document Version**: 1.0
**Created**: October 15, 2025
**Status**: ✅ Ready for Implementation
**Priority**: 🔴 HIGH - High Business Impact, Low Implementation Risk

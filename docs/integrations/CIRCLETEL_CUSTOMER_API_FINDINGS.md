# CircleTel Customer Portal API Discovery Findings

**Date**: January 2025
**Source**: Playwright browser automation testing
**Portal URL**: https://circletel-customer.agilitygis.com/#/

---

## Key Findings

### 1. API Base Domains

| Domain | Purpose |
|--------|---------|
| `https://integration.agilitygis.com` | Primary API base for assets and site configuration |
| `https://circletel-customer.agilitygis.com` | Customer portal frontend + some API endpoints |
| `https://supersonic.agilitygis.com` | Supersonic public API (documented separately) |

### 2. Site Configuration

**Site Instance ID**: `85`
**Site Name**: CircleTel
**Currency**: ZAR (South African Rand)

### 3. Discovered API Endpoints

#### Asset/Configuration Endpoints (integration.agilitygis.com)
```
GET /api/publicsiteinstance/85/image/background-image-global/
GET /api/publicsiteinstance/85/image/navbar-logo/
GET /api/publicsiteinstance/85/image/favicon/
```

#### Auth Endpoints (circletel-customer.agilitygis.com)
```
GET /api/auth/validate
Response: 401 Unauthorized (expected for non-logged-in users)
```

####Coverage Endpoints (circletel-customer.agilitygis.com)
```
GET /api/service?url=gis%2Fcoverage%2Ffibre%2Furl
GET /api/service?url=gis%2Fcoverage%2Fwireless%2Furl
GET /api/coverage/external
GET /api/coverage/fibre
GET /api/coverage/wireless
```

### 4. Google Maps Integration

**API Key**: `AIzaSyCByaRqvfmwTKp6Ja3TWeIj3PCL-bCaR_U`

**Services Used**:
- Places API (Autocomplete)
- Geocoding API
- Maps JavaScript API

**Address Autocomplete Pattern**:
```
GET /maps/api/place/js/AutocompletionService.GetPredictions
Parameters:
  - 1s: Search query (e.g., "18 Rasmus Erasmus, Centurion")
  - 4s: Language (en-US)
  - 7s: Country restriction (country:za)
  - 9s: Type filters (geocode, establishment)
```

---

## Analysis

### Lead Creation Flow (Not Yet Captured)

The discovery script **did not capture lead creation endpoints** because:
1. Portal requires authentication (`/api/auth/validate` returned 401)
2. User likely needs to complete full form submission flow
3. May require selecting address from Google Places dropdown

### Coverage Checking Architecture

The portal appears to use:
1. **Google Places API** for address autocomplete
2. **Internal coverage APIs** (`/api/coverage/*`) for checking availability
3. **External provider APIs** (`/api/coverage/external`) possibly for DFA, Openserve, etc.

### Differences from Supersonic Public API

| Feature | Supersonic Public API | CircleTel Customer Portal |
|---------|----------------------|---------------------------|
| **Authentication** | Session cookies (public access) | Requires login (`401` on `/api/auth/validate`) |
| **Lead Creation** | `/api/lead` (documented) | Not discovered (requires auth) |
| **Packages** | `/api/availablepackages?LeadEntityID=X` | Not discovered (requires auth) |
| **Coverage Check** | Direct API calls | Proxy through `/api/service` and `/api/coverage/*` |
| **Base Domain** | `supersonic.agilitygis.com` | `circletel-customer.agilitygis.com` + `integration.agilitygis.com` |

---

## Recommended Integration Approach

### Option 1: Use Supersonic Public API ⭐ RECOMMENDED
**Rationale**: No authentication required, well-documented, production-ready

**Implementation**:
```typescript
// Use existing documentation from PRODUCTION_COVERAGE_API_ENDPOINTS.md
const leadResponse = await fetch('https://supersonic.agilitygis.com/api/lead', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address,
    latitude,
    longitude,
    source: 'circletel_web'
  })
});

const { LeadEntityID } = await leadResponse.json();

const packagesResponse = await fetch(
  `https://supersonic.agilitygis.com/api/availablepackages?LeadEntityID=${LeadEntityID}`
);
```

**Advantages**:
- ✅ No authentication required
- ✅ Publicly accessible
- ✅ Well-documented
- ✅ Production-tested
- ✅ Returns actual packages with pricing

**Disadvantages**:
- ⚠️ May have CORS restrictions (use server-side proxy)
- ⚠️ Session cookies may be required (handle server-side)
- ⚠️ No official API key (contact Supersonic for enterprise access)

### Option 2: Use CircleTel Customer Portal API
**Rationale**: Direct access to CircleTel's own infrastructure

**Challenges**:
- ❌ Requires authentication
- ❌ Lead creation endpoints not discovered
- ❌ Package fetching endpoints not discovered
- ❌ Would need to reverse-engineer auth flow
- ❌ More complex to maintain

### Option 3: Hybrid Approach
**Rationale**: Use best of both APIs

**Implementation**:
1. **Primary**: Supersonic Public API for lead creation + packages
2. **Fallback**: CircleTel coverage endpoints for provider-specific checks
3. **Supplementary**: Google Maps API for address validation

---

## Next Steps

### Immediate Actions

1. **Test Supersonic Public API Directly**
   ```bash
   npx tsx scripts/test-supersonic-direct-api.ts
   ```

2. **Implement Server-Side Proxy**
   ```
   app/api/coverage/supersonic/lead/route.ts
   app/api/coverage/supersonic/packages/route.ts
   ```

3. **Update SupersonicClient**
   ```typescript
   // lib/coverage/supersonic/client.ts
   baseUrl: 'https://supersonic.agilitygis.com'
   ```

4. **Test Multi-Location Scenarios**
   - Centurion (5G)
   - Cape Town CBD (Fibre)
   - Johannesburg CBD (Fibre)

### Future Enhancements

1. **Contact AgilityGIS for API Access**
   - Request official API key
   - Inquire about CircleTel-specific tenant API
   - Discuss rate limits and SLAs

2. **Implement Caching Layer**
   - 5-minute TTL for lead + packages
   - Cache key: `supersonic:{lat}:{lng}`

3. **Add Monitoring**
   - API availability checks
   - Response time tracking
   - Error rate alerts

---

## Related Documentation

- [Production Coverage API Endpoints](./PRODUCTION_COVERAGE_API_ENDPOINTS.md)
- [Supersonic Integration Spec](./SUPERSONIC_INTEGRATION_SPEC.md)
- [Supersonic Regional Coverage Analysis](./SUPERSONIC_REGIONAL_COVERAGE_ANALYSIS.md)

---

**Status**: ✅ Discovery Complete
**Recommendation**: Proceed with Supersonic Public API integration (Option 1)
**Next Action**: Test direct API calls to Supersonic endpoints

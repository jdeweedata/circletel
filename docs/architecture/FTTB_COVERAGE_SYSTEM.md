# FTTB (Fibre-to-the-Business) Coverage System

## Overview

The FTTB Coverage System is a multi-provider architecture that checks business fibre availability and displays appropriate packages based on coverage at the customer's location.

**Status**: ✅ Production Ready (October 5, 2025)

## Architecture

### Database Schema

#### Network Providers Table
```sql
CREATE TABLE fttb_network_providers (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  provider_type VARCHAR(50) CHECK (provider_type IN ('wholesale', 'retail', 'hybrid')),
  technology VARCHAR(50) CHECK (technology IN ('FTTB', 'FTTH', 'FTTC', 'Ethernet', 'Mixed')),
  coverage_api_url TEXT,
  coverage_api_type VARCHAR(50) CHECK (coverage_api_type IN ('arcgis', 'rest', 'graphql', 'manual')),
  service_areas TEXT[],
  active BOOLEAN DEFAULT true,
  average_activation_days INTEGER DEFAULT 7,
  sla_uptime_percentage DECIMAL(5, 2) DEFAULT 99.5
);
```

**Current Providers**:
- ✅ **DFA (Dark Fibre Africa)** - Active, using ArcGIS REST API
- ⏳ **Openserve** - Placeholder (future integration)
- ⏳ **Vumatel Business** - Placeholder (future integration)
- ⏳ **Frogfoot** - Placeholder (future integration)

#### Coverage Areas Table (Caching Layer)
```sql
CREATE TABLE fttb_coverage_areas (
  id UUID PRIMARY KEY,
  provider_id UUID REFERENCES fttb_network_providers(id),
  building_id VARCHAR(100),
  building_name VARCHAR(255),
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  geolocation GEOGRAPHY(POINT, 4326), -- PostGIS spatial index
  connection_type VARCHAR(50) CHECK (connection_type IN ('Direct', 'Third Party', 'Planned', 'Unavailable')),
  technology VARCHAR(50),
  max_speed_down INTEGER,
  max_speed_up INTEGER,
  requires_third_party BOOLEAN DEFAULT false,
  estimated_activation_days INTEGER DEFAULT 7
);
```

#### Service Packages Enhancement
```sql
ALTER TABLE service_packages
ADD COLUMN network_provider_id UUID REFERENCES fttb_network_providers(id),
ADD COLUMN requires_fttb_coverage BOOLEAN DEFAULT false,
ADD COLUMN product_category VARCHAR(50) CHECK (
  product_category IN ('wireless', 'fibre_consumer', 'fibre_business', 'lte', '5g')
);
```

**Product Categories**:
- `fibre_business` - BizFibreConnect packages (requires FTTB coverage)
- `fibre_consumer` - HomeFibreConnect packages (no FTTB requirement)
- `wireless` - SkyFibre packages
- `lte` / `5g` - MTN business wireless packages

## API Integration

### DFA Coverage Check

**Endpoint**: `/api/coverage/fttb`

**Method**: `POST`

**Request Body**:
```json
{
  "latitude": -26.1076,
  "longitude": 28.0567,
  "address": "1 Sandton Drive, Sandton, Johannesburg"
}
```

**Response (Coverage Available)**:
```json
{
  "success": true,
  "hasCoverage": true,
  "connectionType": "FTTB",
  "buildingId": "DFA12345",
  "buildingName": "Sandton City Office Tower",
  "message": "FTTB coverage available! High-speed business fiber ready for installation.",
  "coordinates": {
    "latitude": -26.1076,
    "longitude": 28.0567
  }
}
```

**Response (No Coverage)**:
```json
{
  "success": true,
  "hasCoverage": false,
  "connectionType": "None",
  "message": "No FTTB coverage available in this area.",
  "coordinates": {
    "latitude": -26.1076,
    "longitude": 28.0567
  }
}
```

### DFA ArcGIS REST API

**Supabase Edge Function**: `check-fttb-coverage`

**DFA API Endpoint**:
```
https://gisportal.dfafrica.co.za/server/rest/services/API/DFA_Connected_Buildings/MapServer/0/query
```

**Query Parameters**:
- `where`: `DFA_Connected='Yes' AND Broadband='Yes'` (FTTB only)
- `geometry`: `{longitude},{latitude}`
- `geometryType`: `esriGeometryPoint`
- `distance`: `1000` (1km radius)
- `units`: `esriSRUnit_Meter`
- `outFields`: `OBJECTID,Building_ID,Longitude,Latitude,DFA_Connected,Third_Party_Dependant_For_Connection_Access,Broadband,FTTH,Precinct,Promotion`

**Coverage Logic**:
1. Query DFA API for buildings within 1km radius
2. Calculate distance to nearest FTTB-enabled building using Haversine formula
3. Coverage available if distance ≤ 100m
4. Distinguish between Direct and Third Party connections
5. Return nearest building info if no direct coverage

## Business Packages Flow

### 1. Lead Submission
```
User fills business lead form → POST /api/coverage/lead
{
  "company_name": "Acme Corporation",
  "company_size": "11-50 employees",
  "industry": "technology",
  "address": "1 Sandton Drive, Sandton, Johannesburg",
  "contact_name": "John Smith",
  "email": "john@acme.com",
  "phone": "+27 11 123 4567"
}
```

### 2. Geocoding
- Address converted to coordinates using Google Maps Geocoding API
- Coordinates stored in `coverage_leads` table

### 3. Coverage Check & Package Filtering

**API Endpoint**: `GET /api/coverage/packages?leadId={id}&customerType=business`

**Processing Steps**:
1. Fetch lead details from database
2. Check MTN coverage for wireless/LTE packages
3. **For business customers only**:
   - Call `/functions/v1/check-fttb-coverage` with lead coordinates
   - Determine `fttbCoverageAvailable` boolean
4. Filter packages:
   ```javascript
   if (customerType === 'business') {
     if (fttbCoverageAvailable) {
       // Show BizFibreConnect + wireless/LTE fallbacks
       query.or('requires_fttb_coverage.eq.true,requires_fttb_coverage.eq.false');
     } else {
       // No FTTB - only wireless/LTE packages
       query.eq('requires_fttb_coverage', false);
     }
   }
   ```

### 4. Package Display

**With FTTB Coverage**:
- BizFibreConnect packages (5 tiers: Lite, Starter, Plus, Pro, Ultra)
- MTN 5G/LTE packages (fallback options)
- SkyFibre packages (wireless fallback)

**Without FTTB Coverage**:
- MTN 5G/LTE packages only
- SkyFibre packages only
- Display "Custom Quote Required" if no packages available

## Product Specifications

### BizFibreConnect Packages (DFA FTTB)

| Package | Speed | Monthly Price | Router | SLA | Target Market |
|---------|-------|---------------|--------|-----|---------------|
| **BizFibre Connect Lite** | 10/10 Mbps | R1,699 | Reyee RG-EW1300G (included) | 99.5% | Micro businesses, home offices |
| **BizFibre Connect Starter** | 25/25 Mbps | R1,899 | Reyee RG-EG105G (R500 upfront) | 99.5% | Small offices, retail |
| **BizFibre Connect Plus** | 50/50 Mbps | R2,499 | Reyee RG-EG105G-P (R500 upfront) | 99.5% | Growing SMEs |
| **BizFibre Connect Pro** | 100/100 Mbps | R2,999 | Reyee RG-EG305GH-P-E (R99/month rental) | 99.5% | Medium businesses |
| **BizFibre Connect Ultra** | 200/200 Mbps | R4,373 | Reyee RG-EG310GH-P-E (R149/month rental) | 99.5% | Large offices |

**Features**:
- Symmetrical speeds (upload = download)
- Uncapped data
- FREE Ruijie Cloud management
- Professional installation (FREE promo: first 100 customers)
- 24/7 local support
- Static IP available (R99/month add-on)

## File Structure

### Database Migrations
- `supabase/migrations/20251005000002_create_fttb_providers_system.sql` - FTTB infrastructure

### API Routes
- `app/api/coverage/fttb/route.ts` - Next.js wrapper for DFA coverage check
- `app/api/coverage/packages/route.ts` - Package filtering with FTTB logic (lines 163-222)

### Supabase Edge Functions
- `supabase/functions/check-fttb-coverage/index.ts` - DFA ArcGIS integration

### Frontend Components
- `app/business/packages/page.tsx` - Business packages display (updated lines 46-83)
- `components/business/BusinessPackageCard.tsx` - Package card component

### Coverage Clients
- `lib/coverage/dfa/client.ts` - DFA coverage client (stub for future enhancement)

## Testing

### Test Scenarios

1. **FTTB Coverage Available** (Sandton CBD, CBD areas)
   - ✅ Shows BizFibreConnect packages
   - ✅ Shows wireless/LTE fallback options
   - ✅ Displays "99.5% SLA" badges

2. **No FTTB Coverage** (Residential areas, remote locations)
   - ✅ Shows "Custom Quote Required" message
   - ✅ Only displays MTN LTE/5G packages (if available)
   - ✅ Hides all BizFibreConnect packages

3. **Third Party Required** (Buildings needing access permission)
   - ✅ Shows coverage with "Third Party" flag
   - ✅ Message: "FTTB available through third-party provider"

### Test Lead Example
```bash
curl -X POST http://localhost:3001/api/coverage/lead \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Corp",
    "company_size": "11-50 employees",
    "industry": "technology",
    "address": "1 Sandton Drive, Sandton",
    "contact_name": "Test User",
    "email": "test@example.com",
    "phone": "+27111234567"
  }'
```

### Verify Coverage Check
```bash
# Check packages for business customer
curl "http://localhost:3001/api/coverage/packages?leadId={LEAD_ID}&customerType=business"
```

## Future Enhancements

### Phase 1: Additional Providers
- [ ] Integrate Openserve Business API
- [ ] Add Vumatel Business coverage (Western Cape focus)
- [ ] Add Frogfoot for residential business areas

### Phase 2: Advanced Features
- [ ] Coverage prediction based on nearby buildings
- [ ] Automated coverage area caching
- [ ] Multi-provider comparison and recommendation
- [ ] Installation timeline estimation

### Phase 3: Admin Tools
- [ ] Coverage map visualization in admin panel
- [ ] Provider performance monitoring
- [ ] Manual coverage override for edge cases
- [ ] Bulk address validation

## Troubleshooting

### Issue: No packages showing for business lead
**Diagnosis**:
1. Check if lead has coordinates: `SELECT latitude, longitude FROM coverage_leads WHERE id = '{leadId}'`
2. Test FTTB coverage manually: `POST /api/coverage/fttb` with lead coordinates
3. Verify package configuration: `SELECT * FROM service_packages WHERE requires_fttb_coverage = true AND active = true`

### Issue: FTTB check failing
**Diagnosis**:
1. Check Supabase Edge Function logs: `supabase functions logs check-fttb-coverage`
2. Verify DFA API accessibility: `curl "https://gisportal.dfafrica.co.za/server/rest/services/API/DFA_Connected_Buildings/MapServer/0/query?where=1=1&f=json"`
3. Check service role key: `echo $SUPABASE_SERVICE_ROLE_KEY`

### Issue: Wrong packages displayed
**Diagnosis**:
1. Check package categories: `SELECT name, product_category, requires_fttb_coverage FROM service_packages`
2. Verify customerType parameter: Check browser console for API request
3. Review filtering logic in `app/api/coverage/packages/route.ts` lines 207-220

## Monitoring

### Key Metrics
- FTTB coverage check success rate
- Average coverage check latency
- Package availability by region
- Third-party connection ratio

### Logs to Monitor
```bash
# FTTB coverage checks
grep "FTTB coverage check:" logs/app.log

# Package filtering
grep "Coverage check:" logs/app.log | grep "packagesFound: 0"

# DFA API errors
grep "DFA API error" logs/edge-functions.log
```

## Related Documentation

- [BizFibreConnect Product Specification](../products/active/BizFibreConnect/bizfibre-connect-product-doc-v2.md)
- [DFA API Investigation](../integrations/DFA_API_INVESTIGATION.md)
- [Coverage System Architecture](./coverage-system-architecture.md)
- [Business Journey Flow](../customer-journeys/BUSINESS_JOURNEY.md)

---

**Last Updated**: October 5, 2025
**Implemented By**: Claude Code
**Status**: Production Ready ✅

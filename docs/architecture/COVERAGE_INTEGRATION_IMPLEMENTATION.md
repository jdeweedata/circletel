---
type: architecture
domain: [coverage, products]
tags: [mtn, dfa, coverage-check, service-types, provider-mapping, packages]
status: current
last_updated: 2025-10-20
dependencies: [SYSTEM_OVERVIEW.md, FTTB_COVERAGE_SYSTEM.md]
priority: medium
description: Coverage integration mapping MTN/DFA coverage to CircleTel products
---

# Coverage Integration Implementation

## Overview

This document details the comprehensive coverage integration system implemented for CircleTel, mapping provider coverage (MTN, DFA) to CircleTel products with proper service type translations.

## Problem Statement

The original system had critical gaps:

1. **No Product Filtering**: All products displayed regardless of actual coverage
2. **Service Type Mismatch**: Database used product names (`SkyFibre`, `HomeFibreConnect`) instead of technical service types (`uncapped_wireless`, `fibre`)
3. **Missing Provider Mapping**: No connection between MTN/DFA coverage results and CircleTel packages
4. **DFA Not Integrated**: Fibre coverage checks not connected to actual DFA API

## Solution Architecture

### 1. Service Type Mapping System

**Database Table**: `service_type_mapping`

Maps technical coverage types to CircleTel product categories:

```sql
-- Migration: supabase/migrations/20250131000002_create_service_type_mapping.sql

CREATE TABLE service_type_mapping (
  technical_type VARCHAR(50),  -- From coverage API: 'uncapped_wireless', 'fibre', '5g', etc.
  provider VARCHAR(50),         -- 'mtn', 'dfa', 'openserve'
  product_category VARCHAR(100),-- CircleTel category: 'SkyFibre', 'HomeFibreConnect', etc.
  priority INTEGER,             -- Selection priority
  active BOOLEAN
);
```

**Default Mappings**:
- MTN `uncapped_wireless` → `SkyFibre` (Tarana Wireless G1)
- MTN `5g`, `lte`, `fixed_lte` → `LTE`, `5G` products
- DFA/Openserve `fibre` → `HomeFibreConnect`, `BizFibreConnect`

### 2. MTN Coverage Map Integration

**Consumer Map**: https://mtnsi.mtn.co.za/coverage/dev/v3/map3.html
**Business Map**: https://mtnsi.mtn.co.za/coverage/dev/v3/map3.html?mc=busr-407a787d7e9949dbb2d8fc9a3d073976

#### Components Created:

1. **[lib/coverage/mtn/map-client.ts](../../lib/coverage/mtn/map-client.ts)**
   - MTN map configuration
   - Layer to service type mapping
   - Signal strength inference
   - Dual-map result combination

2. **[lib/coverage/mtn/map-scraper.ts](../../lib/coverage/mtn/map-scraper.ts)**
   - Playwright-based map interaction (template)
   - Server-side scraping for automated coverage checks
   - Screenshot capture for debugging

3. **[app/api/coverage/mtn/map-check/route.ts](../../app/api/coverage/mtn/map-check/route.ts)**
   - API endpoint for map-based coverage checking
   - Accepts coordinates and map type (consumer/business)
   - Returns structured coverage data

4. **[app/admin/coverage/mtn-maps/page.tsx](../../app/admin/coverage/mtn-maps/page.tsx)**
   - Admin UI for viewing both MTN maps
   - Testing tool for coordinate-based checks
   - Visual display of coverage results

### 3. DFA Provider Integration

**File**: [lib/coverage/dfa/client.ts](../../lib/coverage/dfa/client.ts)

Currently a stub implementation that returns `available: false`. Ready for DFA API integration.

**Integration Points**:
- `/api/coverage/dfa/check` (to be created)
- Integrated into `CoverageAggregationService`
- Maps fibre coverage to HomeFibreConnect/BizFibreConnect

**TODO for DFA Integration**:
1. Obtain DFA API credentials
2. Implement API authentication
3. Map DFA response to CoverageResponse type
4. Add fallback to Openserve, Vumatel, Frogfoot

### 4. Updated Package Filtering Logic

**File**: [app/api/coverage/packages/route.ts](../../app/api/coverage/packages/route.ts)

**Before** (Lines 80-102):
```typescript
// Old: Direct matching that doesn't work
const packages = await supabase
  .from('service_packages')
  .in('service_type', availableServices)  // ❌ Fails - different naming
```

**After** (Lines 80-128):
```typescript
// New: Use service_type_mapping to translate
const mappings = await supabase
  .from('service_type_mapping')
  .in('technical_type', availableServices)  // Technical types from MTN/DFA
  .eq('active', true)

const productCategories = [...new Set(mappings.map(m => m.product_category))]

const packages = await supabase
  .from('service_packages')
  .or(`product_category.in.(${productCategories})`)  // ✅ Matches!
```

### 5. Coverage Aggregation Service

**File**: [lib/coverage/aggregation-service.ts](../../lib/coverage/aggregation-service.ts)

**Changes**:
- Import DFA client: `import { checkDFACoverage } from './dfa/client'`
- Added DFA case to provider switch (Lines 149-151)
- New `getDFACoverage()` method (Lines 245-255)

## Customer Journey Implementation Status

### ✅ Implemented:

1. **Address Entry & Geolocation** ([components/coverage/CoverageChecker.tsx](../../components/coverage/CoverageChecker.tsx))
   - Address autocomplete with Google Maps
   - Geocoding to coordinates
   - Location button for current position

2. **Lead Creation** ([app/api/coverage/lead/route.ts](../../app/api/coverage/lead/route.ts))
   - Creates `coverage_leads` entry
   - Captures address, coordinates, session ID
   - Tracks coverage check status

3. **Coverage Checking** ([app/api/coverage/packages/route.ts](../../app/api/coverage/packages/route.ts))
   - PostGIS spatial queries
   - Address-based fallback
   - Service type mapping
   - Returns filtered packages

4. **Package Display** ([components/coverage/CoverageChecker.tsx](../../components/coverage/CoverageChecker.tsx))
   - Shows only available packages for location
   - Displays service types
   - Activation time estimates

### ⚠️ Partially Implemented:

1. **MTN Coverage Integration**
   - ✅ Map viewers in admin panel
   - ✅ API structure ready
   - ⚠️ Playwright automation needs completion
   - ⚠️ Real-time coverage data capture pending

2. **DFA Fibre Coverage**
   - ✅ Database mapping ready
   - ✅ Integration points created
   - ❌ Actual API integration not started
   - ❌ Fibre products show as unavailable

### ❌ Not Yet Implemented:

1. **No Coverage Handling**
   - Lead notification system
   - Sales team alerts
   - Coverage expansion tracking

2. **Order Flow Integration**
   - Package selection → Order creation
   - Payment processing
   - Service activation workflow

## Database Schema Changes

### New Tables:

1. **service_type_mapping** - Links technical types to products
2. Product category column added to **service_packages**

### Modified Tables:

1. **service_packages** - Added `product_category` column
2. **coverage_areas** - Extended with city, province, status fields

## API Endpoints

### New:
- `POST /api/coverage/mtn/map-check` - Check coverage via MTN maps
- `GET /api/coverage/mtn/map-check?lat=X&lng=Y` - Same as POST

### Modified:
- `GET /api/coverage/packages?leadId=X` - Now uses service type mapping

## Admin Panel Features

### New Pages:

1. **[/admin/coverage/mtn-maps](../../app/admin/coverage/mtn-maps/page.tsx)**
   - Embedded MTN consumer map
   - Embedded MTN business map
   - Coverage testing tool
   - Result visualization

### Navigation:

Coverage submenu updated:
```
Coverage
├── Dashboard
├── Analytics
├── Testing
├── Providers
└── Maps (NEW - MTN Maps)
```

## Testing Recommendations

### 1. Service Type Mapping

```sql
-- Verify mappings exist
SELECT * FROM service_type_mapping WHERE active = true;

-- Test mapping query
SELECT * FROM get_product_categories_from_services(
  ARRAY['uncapped_wireless', 'lte']::TEXT[],
  'mtn'
);
```

### 2. Package Filtering

Test coordinates in known coverage areas:
- **Centurion**: `-25.9000, 28.1800` (SkyFibre + HomeFibre)
- **Sandton**: `-26.1000, 28.0500` (All services)
- **Out of coverage**: `-25.0000, 29.0000` (No coverage)

### 3. MTN Maps Admin Panel

1. Navigate to `/admin/coverage/mtn-maps`
2. Enter test coordinates
3. Click "Test Consumer Map" and "Test Business Map"
4. Verify results match map visual display

## Next Steps

### Priority 1: Complete MTN Integration

1. **Playwright Automation**
   ```typescript
   // In map-scraper.ts, implement:
   async checkCoverage(coordinates, mapType) {
     // Use mcp__playwright__browser_navigate
     // Use mcp__playwright__browser_evaluate to extract layers
     // Return structured coverage data
   }
   ```

2. **Connect to Live API**
   - Test with real coordinates
   - Verify layer extraction
   - Validate service type mapping

### Priority 2: DFA API Integration

1. **Obtain API Access**
   - Contact DFA for API credentials
   - Review API documentation
   - Set up authentication

2. **Implement Client**
   ```typescript
   // In dfa/client.ts, replace stub:
   async checkCoverage(request) {
     const response = await fetch(DFA_API_URL, {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${DFA_API_KEY}` },
       body: JSON.stringify({ coordinates })
     });
     return parseDFAResponse(await response.json());
   }
   ```

### Priority 3: Customer Journey Completion

1. **No Coverage Flow**
   - Email notifications
   - CRM integration (Zoho)
   - Sales team dashboard

2. **Order Processing**
   - Package selection → Cart
   - Payment integration (Netcash)
   - Service activation workflow

## Migration Instructions

### 1. Apply Database Migration

```bash
# This creates service_type_mapping table and default mappings
npx supabase db push
```

### 2. Verify Data

```sql
-- Check that mappings were created
SELECT COUNT(*) FROM service_type_mapping;  -- Should be > 6

-- Verify product categories are set
SELECT COUNT(*) FROM service_packages WHERE product_category IS NOT NULL;
```

### 3. Test Coverage Flow

1. Go to `/coverage` on frontend
2. Enter address: "18 Rasmus Erasmus, Centurion"
3. Click "Show me my deals"
4. Verify:
   - SkyFibre packages appear
   - HomeFibre packages may appear
   - Correct pricing and features

## Troubleshooting

### Issue: No packages returned

```sql
-- Debug query
SELECT
  ca.service_type,
  stm.product_category,
  sp.name
FROM coverage_areas ca
LEFT JOIN service_type_mapping stm ON stm.technical_type = ca.service_type
LEFT JOIN service_packages sp ON sp.product_category = stm.product_category
WHERE ca.status = 'active' AND sp.active = true;
```

### Issue: Map viewer not loading

- Check browser console for iframe errors
- Verify URLs are accessible
- Check CORS/sandbox settings

### Issue: Playwright errors

- Ensure Playwright is installed: `npx playwright install`
- Check MCP server is running
- Verify browser permissions

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Customer Frontend                      │
│              /coverage → CoverageChecker                │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  API Layer                               │
│  POST /api/coverage/lead        (Create lead)           │
│  GET  /api/coverage/packages    (Get available pkgs)    │
│  POST /api/coverage/mtn/map-check (Check MTN maps)      │
└────────┬────────────────────────────────┬───────────────┘
         │                                 │
         ▼                                 ▼
┌────────────────────┐          ┌─────────────────────────┐
│  Coverage System   │          │  Service Type Mapping   │
│                    │          │                         │
│  MTN WMS Client    │◄────────►│  technical_type →      │
│  DFA Client (stub) │          │  product_category       │
│  Aggregation       │          │                         │
└────────┬───────────┘          └──────────┬──────────────┘
         │                                  │
         ▼                                  ▼
┌────────────────────────────────────────────────────────┐
│              Database (Supabase)                        │
│  • coverage_areas (PostGIS polygons)                    │
│  • service_type_mapping (provider → product)            │
│  • service_packages (filtered by product_category)      │
│  • coverage_leads (tracking & CRM)                      │
└────────────────────────────────────────────────────────┘
```

## References

- MTN Consumer Map: https://mtnsi.mtn.co.za/coverage/dev/v3/map3.html
- MTN Business Map: https://mtnsi.mtn.co.za/coverage/dev/v3/map3.html?mc=busr-407a787d7e9949dbb2d8fc9a3d073976
- Playwright MCP: `.mcp.json` configuration
- Admin Panel: `/admin/coverage/mtn-maps`

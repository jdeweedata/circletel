# Playwright MTN Map Integration Guide

## Overview

This document provides complete instructions for integrating Playwright-based MTN coverage map scraping into the CircleTel platform. The implementation extracts real coverage data from MTN's interactive coverage maps.

## What Was Implemented

### 1. MTN Map Scraper ([lib/coverage/mtn/map-scraper.ts](../../lib/coverage/mtn/map-scraper.ts))

Complete Playwright automation system that:
- Navigates to MTN consumer/business coverage maps
- Pans to specific coordinates
- Extracts visible WMS layer information
- Maps layers to CircleTel service types
- Returns structured coverage data

**Key Features**:
- Layer mapping: `_5gCoverage` → `5g`, `lteCoverage` → `lte`, etc.
- Browser-side JavaScript extraction scripts
- Support for both consumer and business maps
- Coordinate validation for South Africa

### 2. API Route ([app/api/coverage/mtn/map-check/route.ts](../../app/api/coverage/mtn/map-check/route.ts))

Two operating modes:
1. **Mock Mode** (default) - Returns location-based mock data for development
2. **Playwright Mode** - Real browser automation (requires setup)

### 3. Admin Panel Integration ([app/admin/coverage/mtn-maps/page.tsx](../../app/admin/coverage/mtn-maps/page.tsx))

- Embedded MTN consumer map
- Embedded MTN business map
- Coverage testing tool
- Visual results display

## Playwright Testing Results

### Successfully Tested

✅ **Map Navigation**: Confirmed navigation to both consumer and business maps
✅ **Map Loading**: Maps load correctly with all WMS layers
✅ **Layer Extraction**: Successfully extracted 7 layers:
- `_5gCoverage` (5G)
- `fixCoverage` (Fixed LTE)
- `lteCoverage` (LTE)
- `umts900Coverage` (3G 900MHz)
- `umts2100Coverage` (3G 2100MHz)
- `gsmCoverage` (2G)
- `mtnStores` (MTN Stores - excluded from coverage)

✅ **Coordinate Panning**: Successfully panned map to Centurion (-25.9, 28.18)
✅ **Coverage Data Extraction**: Confirmed all layers visible at Centurion location
✅ **Browser Scripts**: Validated all extraction scripts work correctly

### Coverage Data Example

Centurion (-25.9, 28.18) coverage check returned:
```json
{
  "coordinates": { "lat": -25.9, "lng": 28.18 },
  "mapType": "consumer",
  "services": [
    { "type": "5g", "available": true, "signal": "good", "technology": "5G" },
    { "type": "fixed_lte", "available": true, "signal": "good", "technology": "Fixed LTE" },
    { "type": "lte", "available": true, "signal": "good", "technology": "LTE" },
    { "type": "3g_900", "available": true, "signal": "good", "technology": "3G 900MHz" },
    { "type": "3g_2100", "available": true, "signal": "good", "technology": "3G 2100MHz" },
    { "type": "2g", "available": true, "signal": "good", "technology": "2G GSM" }
  ],
  "metadata": {
    "capturedAt": "2025-09-30T20:16:47.761Z",
    "mapVersion": "v3",
    "zoomLevel": 15
  }
}
```

## Browser Automation Scripts

### 1. Complete Coverage Extraction

```javascript
MTNMapScraper.getBrowserExtractionScript(coordinates)
```

This script:
- Pans map to coordinates
- Extracts visible WMS layers
- Maps layer IDs to service types
- Returns complete coverage result

### 2. Layer Information Extraction

```javascript
MTNMapScraper.getLayerExtractionScript()
```

Returns all layers with visibility status.

### 3. Map Load Check

```javascript
MTNMapScraper.getMapLoadCheckScript()
```

Checks if map and WMS layers are loaded.

### 4. Pan To Coordinates

```javascript
MTNMapScraper.getPanToCoordinatesScript(coordinates, zoom)
```

Pans map to specific location.

## Implementation Options

### Option 1: Playwright MCP Integration (Recommended for Development)

Use Playwright MCP tools directly in your workflow:

```typescript
// 1. Navigate to map
await mcp__playwright__browser_navigate(MTN_CONSUMER_URL);

// 2. Wait for map load
await mcp__playwright__browser_wait_for({ time: 5 });

// 3. Extract coverage data
const result = await mcp__playwright__browser_evaluate({
  function: MTNMapScraper.getBrowserExtractionScript(coordinates)
});
```

### Option 2: Server-Side Playwright (Production)

For production API routes, install Playwright server-side:

```bash
npm install playwright
npx playwright install chromium
```

Then implement in API route:

```typescript
import { chromium } from 'playwright';

export async function POST(request: NextRequest) {
  const { coordinates, mapType } = await request.json();

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate
    const url = mapType === 'business'
      ? MTNMapScraper.BUSINESS_URL
      : MTNMapScraper.CONSUMER_URL;
    await page.goto(url);

    // Wait for map
    await page.waitForTimeout(5000);

    // Extract coverage
    const result = await page.evaluate(
      MTNMapScraper.getBrowserExtractionScript(coordinates)
    );

    return NextResponse.json({ success: true, data: result });
  } finally {
    await browser.close();
  }
}
```

### Option 3: Puppeteer Alternative

If using Puppeteer instead of Playwright:

```typescript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();

await page.goto(MTNMapScraper.CONSUMER_URL);
await page.waitForTimeout(5000);

const result = await page.evaluate(
  MTNMapScraper.getBrowserExtractionScript(coordinates)
);
```

## Current Mock Mode

The API currently runs in mock mode by default, returning coverage data based on coordinate ranges:

**Centurion Area** (-26.0 to -25.8, 28.0 to 28.3):
- 5G, LTE, Fixed LTE, 3G, 2G (all available)

**Johannesburg Area** (-26.3 to -26.1, 27.9 to 28.1):
- 5G, LTE, Fixed LTE, 3G, 2G (all available)

**Other Areas**:
- LTE, 3G, 2G (limited coverage)

To use mock mode:
```typescript
POST /api/coverage/mtn/map-check
Body: { coordinates: { lat: -25.9, lng: 28.18 }, useMock: true }
```

## Service Type Mapping

The system maps MTN layers to CircleTel service types via the database:

| MTN Layer ID | Service Type | CircleTel Product |
|--------------|--------------|-------------------|
| `_5gCoverage` | `5g` | 5G packages |
| `fixCoverage` | `fixed_lte` | SkyFibre (Tarana Wireless) |
| `lteCoverage` | `lte` | LTE packages |
| `umts900Coverage` | `3g_900` | 3G packages |
| `umts2100Coverage` | `3g_2100` | 3G packages |
| `gsmCoverage` | `2g` | 2G fallback |

This mapping is defined in:
1. `lib/coverage/mtn/map-scraper.ts` (LAYER_MAPPING)
2. `supabase/migrations/20250131000002_create_service_type_mapping.sql` (database)

## Integration with Product Filtering

Once coverage data is obtained from the MTN map, it flows through:

1. **MTN Map** → `MTNMapCoverageResult` with service types
2. **Service Type Mapping** → Translates to product categories
3. **Package Filtering** → Shows only available packages

Example flow:
```
Coordinates: -25.9, 28.18
  ↓
MTN Map Check: Returns ['5g', 'lte', 'fixed_lte']
  ↓
Service Mapping: ['5G', 'LTE', 'SkyFibre']
  ↓
Package Filter: Shows 5G packages, LTE packages, SkyFibre packages
```

## Admin Panel Usage

### View MTN Maps

1. Navigate to `/admin/coverage/mtn-maps`
2. View embedded consumer or business map
3. Maps are fully interactive

### Test Coverage at Coordinates

1. Enter latitude and longitude (e.g., -25.9, 28.18)
2. Click "Test Consumer Map" or "Test Business Map"
3. View results with available services
4. See service types, signal strength, and technology

### Screenshot Captures

All screenshots are saved to `.playwright-mcp/` directory:
- `mtn-consumer-map-initial.png` - Consumer map default view
- `centurion-coverage-check.png` - Centurion coverage test

## Deployment Considerations

### Development Environment
- Use Playwright MCP for interactive testing
- Mock mode for rapid development
- Screenshots for visual verification

### Staging Environment
- Install Playwright server-side
- Switch to real browser automation
- Keep mock mode as fallback

### Production Environment
- Use headless browser mode
- Implement caching (5-15 minute TTL)
- Add error handling and retries
- Monitor performance

## Performance Optimization

### Caching Strategy

```typescript
// Cache coverage results for 15 minutes
const cacheKey = `mtn-coverage-${lat}-${lng}-${mapType}`;
const cached = await cache.get(cacheKey);

if (cached) {
  return cached;
}

const result = await checkMTNMapCoverage(coordinates, mapType);
await cache.set(cacheKey, result, 900); // 15 minutes
```

### Batch Processing

For multiple coordinates, batch requests:

```typescript
const results = await Promise.all(
  coordinates.map(coord => checkMTNMapCoverage(coord, 'consumer'))
);
```

### Browser Pooling

Reuse browser instances for better performance:

```typescript
let browserInstance: Browser | null = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await chromium.launch();
  }
  return browserInstance;
}
```

## Error Handling

The implementation includes comprehensive error handling:

1. **Invalid Coordinates**: Returns 400 with clear error message
2. **Out of Bounds**: Validates South African coordinates
3. **Browser Failures**: Falls back to mock mode
4. **Timeout Issues**: Configurable timeouts (default 30s)
5. **Map Load Failures**: Retry logic with exponential backoff

## Testing Checklist

- [x] Navigate to MTN consumer map
- [x] Navigate to MTN business map
- [x] Extract WMS layer information
- [x] Pan to Centurion coordinates
- [x] Verify coverage data structure
- [x] Test service type mapping
- [ ] Implement production Playwright setup
- [ ] Add caching layer
- [ ] Test with multiple coordinates
- [ ] Benchmark performance
- [ ] Add monitoring and alerts

## Next Steps

1. **Enable Playwright in Production**
   - Install Playwright in Docker/server environment
   - Configure headless browser
   - Update API route to use real automation

2. **Add Caching**
   - Implement Redis or in-memory cache
   - 15-minute TTL for coverage results
   - Cache invalidation strategy

3. **Monitoring**
   - Track API response times
   - Monitor browser automation failures
   - Alert on coverage check errors

4. **DFA Integration**
   - Similar Playwright approach for DFA fibre maps
   - Combine MTN + DFA results
   - Update service type mapping

## Resources

- MTN Consumer Map: https://mtnsi.mtn.co.za/coverage/dev/v3/map3.html
- MTN Business Map: https://mtnsi.mtn.co.za/coverage/dev/v3/map3.html?mc=busr-407a787d7e9949dbb2d8fc9a3d073976
- Playwright Docs: https://playwright.dev/
- Implementation: `lib/coverage/mtn/map-scraper.ts`
- API Route: `app/api/coverage/mtn/map-check/route.ts`
- Admin Panel: `app/admin/coverage/mtn-maps/page.tsx`

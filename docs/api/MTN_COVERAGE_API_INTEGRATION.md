# MTN Coverage API Integration

> **Version**: 1.0
> **Last Updated**: 2025-12-09
> **Status**: Production Ready

## Overview

This document describes CircleTel's integration with MTN's coverage checking systems for South Africa. The integration uses MTN's WMS (Web Map Service) GeoServer API to provide real-time coverage verification for wireless broadband services.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CircleTel Coverage Flow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Address Input                                              │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │ Google Maps  │ ─── Geocoding ──► Coordinates (lat/lng)       │
│  │   API        │     ~466m variance possible                    │
│  └──────────────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────┐       │
│  │        Multi-Point Buffer Query (500m radius)         │       │
│  │  ┌─────────────────────────────────────────────────┐ │       │
│  │  │              N (500m)                            │ │       │
│  │  │                •                                 │ │       │
│  │  │                │                                 │ │       │
│  │  │      W •───────C───────• E (500m)               │ │       │
│  │  │                │                                 │ │       │
│  │  │                •                                 │ │       │
│  │  │              S (500m)                            │ │       │
│  │  └─────────────────────────────────────────────────┘ │       │
│  │  Compensates for Google Maps geocoding variance       │       │
│  └──────────────────────────────────────────────────────┘       │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │   MTN WMS    │     │ MTN Wholesale│     │     DFA      │     │
│  │  GeoServer   │     │     API      │     │   Fibre API  │     │
│  └──────────────┘     └──────────────┘     └──────────────┘     │
│         │                    │                    │              │
│         └────────────────────┼────────────────────┘              │
│                              ▼                                   │
│                    Coverage Aggregation                          │
│                              │                                   │
│                              ▼                                   │
│                    Available Packages                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. WMS Realtime Client
**File**: `lib/coverage/mtn/wms-realtime-client.ts`

Queries MTN's GeoServer WMS for coverage at specific coordinates.

```typescript
import { mtnWMSRealtimeClient } from '@/lib/coverage/mtn/wms-realtime-client';

const result = await mtnWMSRealtimeClient.checkCoverage(
  { lat: -26.7115, lng: 27.8375 },
  ['uncapped_wireless', '5g', 'fixed_lte']
);
```

#### WMS Layer Configuration

| Service Type | WMS Layer | Description |
|--------------|-----------|-------------|
| `uncapped_wireless` | `mtnsi:MTNSA-Coverage-Tarana` | SkyFibre/Fixed Wireless Broadband |
| `5g` | `mtnsi:MTNSA-Coverage-5G-5G` | 5G Cellular Coverage |
| `fixed_lte` | `mtnsi:MTNSA-Coverage-FIXLTE-EBU-0` | Fixed LTE Coverage |
| `fibre` | `mtnsi:MTN-FTTB-Feasible` | Fibre to the Building |
| `licensed_wireless` | `mtnsi:MTN-PMP-Feasible-Integrated` | P2P Microwave |

#### Multi-Point Buffer Query

For `uncapped_wireless` (SkyFibre), the client uses a 5-point query pattern to compensate for geocoding variance:

```typescript
// Internal implementation
private static generateCardinalPoints(center: Coordinates, radiusMeters: number = 500) {
  const latOffset = radiusMeters / 111000;
  const lngOffset = radiusMeters / (111000 * Math.cos(center.lat * Math.PI / 180));

  return [
    center,                                              // Center
    { lat: center.lat + latOffset, lng: center.lng },   // North
    { lat: center.lat - latOffset, lng: center.lng },   // South
    { lat: center.lat, lng: center.lng - lngOffset },   // West
    { lat: center.lat, lng: center.lng + lngOffset },   // East
  ];
}
```

**Why 500m?** MTN's NAD (National Address Database) shows Google Maps geocoding can be ~466m off from actual locations in South Africa. The 500m buffer ensures we catch coverage even with geocoding errors.

### 2. NAD Coordinate Correction Client (Optional)
**File**: `lib/coverage/mtn/nad-client.ts`

Attempts to correct Google Maps coordinates using MTN's NAD lookup.

```typescript
import { mtnNADClient } from '@/lib/coverage/mtn/nad-client';

const correction = await mtnNADClient.correctCoordinates(
  { lat: -26.7949714, lng: 27.7671094 }
);

// Result:
// {
//   original: { lat: -26.7949714, lng: 27.7671094 },
//   corrected: { lat: -26.790816, lng: 27.766569 },
//   distance: 466, // meters difference
//   confidence: 'high',
//   source: 'nad'
// }
```

**Note**: The NAD API requires browser authentication. Server-side calls gracefully fall back to original coordinates. The multi-point buffer query compensates for this.

### 3. Wholesale API Client
**File**: `lib/coverage/mtn/wholesale-client.ts`

Queries MTN's B2B Wholesale Feasibility API for business products.

```typescript
import { getMTNWholesaleClient } from '@/lib/coverage/mtn/wholesale-client';

const client = getMTNWholesaleClient();
const result = await client.checkFeasibility(
  { lat: -26.7115, lng: 27.8375 },
  ['Fixed Wireless Broadband', 'FTTH'],
  'Customer Name'
);
```

### 4. Coverage Aggregation Service
**File**: `lib/coverage/aggregation-service.ts`

Orchestrates multiple coverage providers and returns unified results.

```typescript
import { coverageAggregationService } from '@/lib/coverage/aggregation-service';

const result = await coverageAggregationService.aggregateCoverage(
  { lat: -26.7115, lng: 27.8375 },
  {
    providers: ['mtn', 'dfa'],
    includeAlternatives: true,
    prioritizeReliability: true
  }
);
```

## API Endpoints

### POST /api/coverage/check
Creates a coverage lead and returns initial coverage status.

**Request:**
```json
{
  "address": "18 Rasmus Erasmus, Heritage Hill, Vanderbijlpark",
  "coordinates": {
    "lat": -26.7115,
    "lng": 27.8375
  }
}
```

**Response:**
```json
{
  "success": true,
  "available": true,
  "lead_id": "098d6b83-f835-46f8-827d-0baad568eb10",
  "formatted_address": "18 Rasmus Erasmus, Heritage Hill, Vanderbijlpark",
  "coordinates": {
    "type": "Point",
    "coordinates": [27.8375, -26.7115]
  },
  "packages": [...]
}
```

### GET /api/coverage/packages
Returns available packages based on real-time coverage check.

**Request:**
```
GET /api/coverage/packages?leadId=098d6b83-f835-46f8-827d-0baad568eb10&type=residential
```

**Response:**
```json
{
  "available": true,
  "services": ["5g", "fixed_lte", "uncapped_wireless", "licensed_wireless"],
  "packages": [
    {
      "id": "1d959a98-1e66-4b26-ad2b-b850028a652c",
      "name": "SkyFibre Home Lite",
      "service_type": "SkyFibre",
      "speed_down": 50,
      "speed_up": 10,
      "price": 781.74,
      "provider": {
        "code": "mtn",
        "name": "MTN",
        "logo_url": "/images/providers/mtn.png"
      }
    }
  ],
  "leadId": "098d6b83-f835-46f8-827d-0baad568eb10",
  "address": "18 Rasmus Erasmus, Heritage Hill, Vanderbijlpark",
  "coordinates": {
    "lat": -26.7115,
    "lng": 27.8375
  },
  "metadata": {
    "providers": {
      "mtn": { "confidence": "high", "servicesFound": 5 },
      "dfa": { "confidence": "high", "servicesFound": 0 }
    },
    "lastUpdated": "2025-12-09T18:43:42.415Z"
  },
  "hasLicensedWireless": false,
  "requiresQuote": false
}
```

## Service Type Mapping

| Technical Type | Product Category | Display Name |
|----------------|------------------|--------------|
| `uncapped_wireless` | `connectivity` | SkyFibre |
| `5g` | `5g` or `connectivity` | 5G Home |
| `fixed_lte` | `connectivity` | Fixed LTE |
| `fibre` | `fibre_business` | BizFibre Connect |
| `licensed_wireless` | `connectivity` | Licensed Wireless (P2P) |

## WMS API Reference

### Base URL
```
https://mtnsi.mtn.co.za/cache/geoserver/wms
```

### GetFeatureInfo Request
```
GET /cache/geoserver/wms?
  service=WMS
  &version=1.3.0
  &request=GetFeatureInfo
  &layers={wmsLayer}
  &query_layers={wmsLayer}
  &feature_count=100
  &srs=EPSG:900913
  &bbox={minx},{miny},{maxx},{maxy}
  &width=256
  &height=256
  &i=128
  &j=128
  &info_format=application/json
```

### Coordinate Transformation
The WMS API uses EPSG:900913 (Web Mercator). Convert from WGS84 (lat/lng):

```typescript
// Lat/Lng to Web Mercator
const x = lng * 20037508.34 / 180;
const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180) * 20037508.34 / 180;
```

### Response Format
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "MTNSA-Coverage-Tarana.fid-xxx",
      "geometry": { "type": "MultiPolygon", "coordinates": [...] },
      "properties": {
        "technology": "Tarana",
        "status": "active"
      }
    }
  ],
  "totalFeatures": 1,
  "numberMatched": 1,
  "numberReturned": 1
}
```

## Error Handling

### Timeout Handling
```typescript
// 8-second timeout per WMS query
const queryWithTimeout = async (layer, coord) => {
  return Promise.race([
    this.queryLayer(coord, layer.wmsLayer),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 8000)
    )
  ]);
};
```

### Fallback Chain
1. **Primary**: MTN WMS Real-time Check
2. **Secondary**: MTN Wholesale API
3. **Tertiary**: PostGIS RPC (`check_coverage_at_point`)
4. **Fallback**: Area name matching (legacy)

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Empty features | Outside coverage area | No action - correct result |
| HTTP 403 | CORS/Authentication | Use browser headers |
| Timeout | Network latency | Retry with exponential backoff |
| Invalid BBOX | Coordinate transformation error | Verify lat/lng bounds |

## Testing

### Test Addresses

| Address | Expected Result |
|---------|-----------------|
| 28 Worcester Ave, Vanderbijlpark | SkyFibre available |
| 18 Rasmus Erasmus, Heritage Hill | SkyFibre + 5G available |
| 16 Sabie Street, Sasolburg | NO SkyFibre (5G/LTE only) |

### Manual API Test
```bash
# Create lead
curl -X POST "http://localhost:3000/api/coverage/check" \
  -H "Content-Type: application/json" \
  -d '{"address":"18 Rasmus Erasmus, Heritage Hill","coordinates":{"lat":-26.7115,"lng":27.8375}}'

# Get packages
curl "http://localhost:3000/api/coverage/packages?leadId={LEAD_ID}"
```

### Direct WMS Test
```bash
# Check SkyFibre coverage at coordinates
curl "https://mtnsi.mtn.co.za/cache/geoserver/wms?\
service=WMS&version=1.3.0&request=GetFeatureInfo\
&layers=mtnsi:MTNSA-Coverage-Tarana\
&query_layers=mtnsi:MTNSA-Coverage-Tarana\
&feature_count=100&srs=EPSG:900913\
&bbox=3095000,-3105000,3100000,-3100000\
&width=256&height=256&i=128&j=128\
&info_format=application/json"
```

## Configuration

### Environment Variables
```env
# MTN Wholesale API (optional - for B2B products)
MTN_WHOLESALE_API_KEY=bdaacbcae8ab77672e545649df54d0df
MTN_WHOLESALE_API_URL=https://asp-feasibility.mtnbusiness.co.za

# Google Maps (required for geocoding)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

### Tuning Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `GEOCODING_BUFFER_METERS` | 500 | Buffer radius for multi-point query |
| `DEFAULT_ZOOM` | 14 | WMS tile zoom level |
| `TIMEOUT` | 8000 | Query timeout in milliseconds |
| `CACHE_TTL` | 3600000 | NAD cache TTL (1 hour) |

## Troubleshooting

### SkyFibre Not Showing When Expected

1. **Check coordinates**: Verify Google Maps returned correct location
2. **Check WMS directly**: Use curl to query WMS at the coordinates
3. **Check buffer query**: Ensure multi-point query is enabled for `uncapped_wireless`
4. **Check logs**: Look for `[WMS]` entries in server logs

### False Positives

1. **Disable area name matching**: This legacy fallback can cause false positives
2. **Verify GeoJSON parsing**: Ensure coordinates are extracted correctly
3. **Check coverage_areas table**: Remove outdated entries

## Files Reference

| File | Purpose |
|------|---------|
| `lib/coverage/mtn/wms-realtime-client.ts` | WMS GetFeatureInfo queries |
| `lib/coverage/mtn/nad-client.ts` | NAD coordinate correction |
| `lib/coverage/mtn/wholesale-client.ts` | B2B Wholesale API |
| `lib/coverage/aggregation-service.ts` | Multi-provider orchestration |
| `app/api/coverage/check/route.ts` | Coverage check endpoint |
| `app/api/coverage/packages/route.ts` | Packages endpoint |

## Changelog

### v1.0 (2025-12-09)
- Initial release
- Multi-point buffer query for SkyFibre (500m radius)
- GeoJSON coordinate parsing fix
- NAD client with graceful fallback
- Comprehensive WMS layer configuration

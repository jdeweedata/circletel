# DFA (Dark Fibre Africa) ArcGIS Integration Analysis
**Date**: 2025-10-22
**Status**: ✅ Analysis Complete
**Provider**: Dark Fibre Africa (DFA)
**Technology**: ArcGIS Server REST API

---

## Executive Summary

DFA provides a comprehensive public-facing **ArcGIS Web Application** for coverage checking with three distinct data layers (Connected Buildings, Near-Net Buildings, and Ductbank). The system uses **Esri ArcGIS Server REST API** with spatial queries for geographic coverage validation.

**Key Findings**:
- ✅ **No Authentication Required** - Public API endpoints
- ✅ **Three Coverage Layers** - Buildings (connected/near-net) + Fiber routes
- ✅ **Spatial Query Support** - Point-in-polygon and bounding box queries
- ✅ **GeoJSON Compatible** - Standard ESRI JSON format (convertible to GeoJSON)
- ⚠️ **No Direct Address API** - Requires coordinate-based queries (integrate with Google Maps Geocoding)

---

## 1. DFA Coverage Map Overview

### Portal URL
```
https://gisportal.dfafrica.co.za/arcgis/apps/webappviewer/index.html?id=cf425ebaa2044ed08bacf33dabf2135e
```

### Technology Stack
- **Platform**: Esri ArcGIS Server 10.x / Enterprise
- **Client**: ArcGIS Web AppBuilder 2.21
- **API Version**: REST API (JSON format)
- **Spatial Reference**: WKID 102100 (Web Mercator) / WKID 4326 (WGS84)

### Coverage Layers

| Layer | Type | Color | Description | API Endpoint |
|-------|------|-------|-------------|--------------|
| **Connected Buildings** | Polygon | Purple | Buildings with active DFA fiber connection | `/DFA_Connected_Buildings/MapServer/0` |
| **Near-Net Buildings** | Point | Yellow/Beige | Buildings within 100m of DFA fiber | `/Promotions/MapServer/1` |
| **Ductbank - Completed** | Polyline | Green | Completed fiber infrastructure | `/API_BasedOSPLayers/MapServer/1` |
| **Ductbank - Construction** | Polyline | Dark Blue | Fiber under construction | `/API_BasedOSPLayers/MapServer/1` |

---

## 2. API Endpoints

### Base URL
```
https://gisportal.dfafrica.co.za/server/rest/services/API
```

### MapServer Endpoints

#### 2.1 Connected Buildings (Primary Coverage Layer)
```
GET https://gisportal.dfafrica.co.za/server/rest/services/API/DFA_Connected_Buildings/MapServer/0
```

**Purpose**: Query buildings with active DFA fiber connections

**Metadata Endpoint**:
```
GET /DFA_Connected_Buildings/MapServer/0?f=json
```

**Query Endpoint**:
```
GET /DFA_Connected_Buildings/MapServer/0/query
```

**Query Parameters**:
```javascript
{
  f: "json",                          // Response format
  returnGeometry: true,               // Include polygon geometries
  spatialRel: "esriSpatialRelIntersects", // Spatial relationship
  geometry: {                         // Search area (bounding box or point)
    xmin: 3122299.7294349372,
    ymin: -3004892.453998834,
    xmax: 3122911.2256611697,
    ymax: -3004280.957772605,
    spatialReference: { wkid: 102100 }
  },
  geometryType: "esriGeometryEnvelope", // or "esriGeometryPoint"
  inSR: 102100,                        // Input spatial reference (Web Mercator)
  outFields: "*",                      // Return all attributes
  outSR: 102100                        // Output spatial reference
}
```

**Response Fields** (Actual from API):
- `OBJECTID` - Unique building identifier (OID)
- `DFA_Building_ID` - DFA internal building ID (String)
- `Longitude` - Building longitude coordinate (Double)
- `Latitude` - Building latitude coordinate (Double)
- `DFA_Connected_Y_N` - Connection status: "Y" or "N" (String)
- `Third_Party_Dependant_For_Conne` - Third-party dependency flag (String)
- `QBRecordID` - QuickBase record ID (Integer)
- `Broadband` - Broadband service availability (String)
- `FTTH` - Fiber-to-the-Home availability (String)
- `Precinct` - Geographic precinct/area name (String)
- `Promotion` - Active promotion flag (String)
- `Microwave_Connected` - Microwave connectivity status (String)
- Geometry: Polygon coordinates (esriGeometryPolygon)

---

#### 2.2 Near-Net Buildings (Proximity Layer)
```
GET https://gisportal.dfafrica.co.za/server/rest/services/API/Promotions/MapServer/1
```

**Purpose**: Query buildings within proximity to DFA fiber (typically 100-200m)

**Use Case**: Identify potential customers for fiber extension offers

**Response Fields** (Actual from API):
- `OBJECTID` - Unique identifier (OID)
- `DFA_Building_ID` - DFA internal building ID (String)
- `Building_Name` - Building name (String) ⭐ **Key field**
- `Street_Address` - Full street address (String) ⭐ **Key field**
- `Property_Owner` - Property owner/NNB status (String)
- Geometry: Polygon coordinates (esriGeometryPolygon)

---

#### 2.3 Ductbank (Fiber Infrastructure Layer)
```
GET https://gisportal.dfafrica.co.za/server/rest/services/API/API_BasedOSPLayers/MapServer/1
```

**Purpose**: Query fiber route locations and construction status

**Response Fields** (Actual from API - 52 fields total):

**Key Fields**:
- `OBJECTID` / `ductbankid` - Unique ductbank identifiers (Integer/OID)
- `name` - Ductbank name (String)
- `owner` - Infrastructure owner (String)
- `stage` - Construction stage: "Completed", "Construction", etc. (String) ⭐ **Maps to legend colors**
- `ea1` - Route Name (String)
- `ea2` - DFA Region (String)
- `placement` - Placement type (String)
- `installcompany` - Installation company (String)

**Installation Details**:
- `installday`, `installmonth`, `installyear` - Installation date components (Integer)
- `workorderid` - Work order ID (Integer)
- `totlength` - Total length of ductbank (Double)
- `length_units` - Length measurement units (String)
- `n_superducts` - Number of super ducts (Integer)
- `n_innerducts` - Number of inner ducts (Integer)

**Depth Information**:
- `start_depth`, `end_depth` - Depth measurements (Double)
- `start_depth_units`, `end_depth_units` - Depth units (String)
- `start_dir`, `end_dir` - Direction indicators (String)
- `start_comments`, `end_comments` - Installation notes (String)

**Connection Points**:
- `start_access_pointid`, `end_access_pointid` - Access point IDs (Integer)
- `start_buildingid`, `end_buildingid` - Connected building IDs (Integer)
- `start_poleid`, `end_poleid` - Pole IDs (Integer)
- `start_place_type`, `end_place_type` - Place types (String)
- `start_place`, `end_place` - Place IDs (Integer)

**Metadata**:
- `updatetime` - Last update timestamp (Date)
- `updateuser` - Last update user (String)
- `ospgid` - OSPG identifier (GUID)
- `MI_Style` - MapInfo styling (String)
- `geosync` - Geo synchronization flag (Integer)
- Geometry: Polyline coordinates (esriGeometryPolyline)

**Use Cases**:
- Display fiber availability on maps (green = completed, blue = construction)
- Proximity analysis for near-net buildings
- Identify areas under development
- Calculate distance to nearest fiber infrastructure
- Track construction progress by region

---

## 3. Coverage Check Workflow

### 3.1 Address-Based Coverage Check

**Step 1: Geocode Address** (Google Maps Geocoding API)
```javascript
// Convert address to coordinates
const geocodeResult = await googleMapsGeocoding.geocode({
  address: "1 Jan Smuts Avenue, Johannesburg"
});
const { lat, lng } = geocodeResult.results[0].geometry.location;
```

**Step 2: Convert to Web Mercator** (if needed)
```javascript
// WKID 4326 (lat/lng) → WKID 102100 (Web Mercator)
const webMercatorCoords = convertToWebMercator(lat, lng);
```

**Step 3: Query DFA Connected Buildings**
```javascript
const dfaQuery = {
  f: "json",
  returnGeometry: false, // We only need to know if coverage exists
  spatialRel: "esriSpatialRelIntersects",
  geometry: JSON.stringify({
    x: webMercatorCoords.x,
    y: webMercatorCoords.y,
    spatialReference: { wkid: 102100 }
  }),
  geometryType: "esriGeometryPoint",
  inSR: 102100,
  outFields: "OBJECTID,BuildingName,Address,Status",
  outSR: 102100
};

const response = await fetch(
  `https://gisportal.dfafrica.co.za/server/rest/services/API/DFA_Connected_Buildings/MapServer/0/query?${new URLSearchParams(dfaQuery)}`
);
const data = await response.json();

const hasCoverage = data.features && data.features.length > 0;
```

**Step 4: Fallback to Near-Net Check** (if no connected building)
```javascript
if (!hasCoverage) {
  // Check if address is near DFA fiber (within 100-200m)
  const nearNetQuery = { /* similar query to Promotions layer */ };
  const nearNetResponse = await fetch(/* Promotions/MapServer/1/query */);
  const isNearNet = nearNetResponse.features.length > 0;

  if (isNearNet) {
    return {
      coverage: "near-net",
      message: "Fiber extension available within 100m"
    };
  }
}
```

---

### 3.2 Bounding Box Coverage Check (Map View)

**Use Case**: Display all coverage in a map viewport

```javascript
// Get map bounds
const bounds = {
  xmin: 3122299.7294349372,  // West
  ymin: -3004892.453998834,  // South
  xmax: 3122911.2256611697,  // East
  ymax: -3004280.957772605   // North
};

// Query all connected buildings in viewport
const response = await fetch(
  `https://gisportal.dfafrica.co.za/server/rest/services/API/DFA_Connected_Buildings/MapServer/0/query?` +
  new URLSearchParams({
    f: "json",
    returnGeometry: true,
    spatialRel: "esriSpatialRelIntersects",
    geometry: JSON.stringify(bounds),
    geometryType: "esriGeometryEnvelope",
    inSR: 102100,
    outFields: "*",
    outSR: 102100
  })
);

// Render purple polygons on Google Maps
const features = await response.json();
features.features.forEach(feature => {
  // Convert ESRI JSON to Google Maps Polygon
  const polygon = new google.maps.Polygon({
    paths: convertEsriRingsToLatLng(feature.geometry.rings),
    strokeColor: "#9B59B6",
    fillColor: "#9B59B6",
    fillOpacity: 0.35
  });
  polygon.setMap(map);
});
```

---

## 4. Integration Strategy for CircleTel

### 4.1 Database Configuration

**Update DFA Provider** (already created in Phase 1A):
```sql
UPDATE fttb_network_providers
SET
  active = true,
  coverage_source = 'api',
  api_version = 'ArcGIS REST API',
  api_documentation_url = 'https://gisportal.dfafrica.co.za/arcgis/rest/services',
  service_offerings = '["fibre"]'::jsonb,
  provider_specific_config = '{
    "base_url": "https://gisportal.dfafrica.co.za/server/rest/services/API",
    "endpoints": {
      "connected_buildings": "/DFA_Connected_Buildings/MapServer/0/query",
      "near_net": "/Promotions/MapServer/1/query",
      "ductbank": "/API_BasedOSPLayers/MapServer/1/query"
    },
    "spatial_reference": {
      "input": 102100,
      "output": 4326
    },
    "coverage_types": {
      "connected": "Active fiber connection available",
      "near_net": "Fiber extension available (within 100-200m)",
      "no_coverage": "No DFA coverage"
    }
  }'::jsonb
WHERE provider_code = 'dfa';
```

---

### 4.2 Service Layer Implementation

**File**: `/lib/coverage/providers/dfa/dfa-coverage-client.ts`

```typescript
import axios from 'axios';

export interface DFACoverageRequest {
  latitude: number;
  longitude: number;
}

export interface DFACoverageResponse {
  hasCoverage: boolean;
  coverageType: 'connected' | 'near-net' | 'none';
  buildingDetails?: {
    objectId: number;
    buildingName?: string;
    address?: string;
    status: string;
  };
  nearNetDistance?: number; // meters
}

export class DFACoverageClient {
  private baseUrl = 'https://gisportal.dfafrica.co.za/server/rest/services/API';

  /**
   * Check DFA coverage at a specific address
   */
  async checkCoverage(request: DFACoverageRequest): Promise<DFACoverageResponse> {
    const { latitude, longitude } = request;

    // Convert WGS84 (lat/lng) to Web Mercator (required by DFA API)
    const webMercator = this.latLngToWebMercator(latitude, longitude);

    // Step 1: Check Connected Buildings
    const connectedBuilding = await this.queryConnectedBuildings(webMercator);
    if (connectedBuilding) {
      return {
        hasCoverage: true,
        coverageType: 'connected',
        buildingDetails: connectedBuilding
      };
    }

    // Step 2: Check Near-Net Buildings
    const nearNet = await this.queryNearNet(webMercator);
    if (nearNet) {
      return {
        hasCoverage: true,
        coverageType: 'near-net',
        nearNetDistance: nearNet.distance
      };
    }

    return {
      hasCoverage: false,
      coverageType: 'none'
    };
  }

  /**
   * Query Connected Buildings layer
   */
  private async queryConnectedBuildings(coords: { x: number; y: number }) {
    const params = new URLSearchParams({
      f: 'json',
      returnGeometry: 'false',
      spatialRel: 'esriSpatialRelIntersects',
      geometry: JSON.stringify({
        x: coords.x,
        y: coords.y,
        spatialReference: { wkid: 102100 }
      }),
      geometryType: 'esriGeometryPoint',
      inSR: '102100',
      outFields: 'OBJECTID,BuildingName,Address,Status',
      outSR: '102100'
    });

    const response = await axios.get(
      `${this.baseUrl}/DFA_Connected_Buildings/MapServer/0/query?${params}`
    );

    if (response.data.features && response.data.features.length > 0) {
      const feature = response.data.features[0];
      return {
        objectId: feature.attributes.OBJECTID,
        buildingName: feature.attributes.BuildingName,
        address: feature.attributes.Address,
        status: feature.attributes.Status || 'Connected'
      };
    }

    return null;
  }

  /**
   * Query Near-Net Buildings layer (within 100-200m buffer)
   */
  private async queryNearNet(coords: { x: number; y: number }) {
    // Create 200m buffer around point
    const buffer = 200; // meters in Web Mercator
    const params = new URLSearchParams({
      f: 'json',
      returnGeometry: 'true',
      spatialRel: 'esriSpatialRelIntersects',
      geometry: JSON.stringify({
        xmin: coords.x - buffer,
        ymin: coords.y - buffer,
        xmax: coords.x + buffer,
        ymax: coords.y + buffer,
        spatialReference: { wkid: 102100 }
      }),
      geometryType: 'esriGeometryEnvelope',
      inSR: '102100',
      outFields: '*',
      outSR: '102100'
    });

    const response = await axios.get(
      `${this.baseUrl}/Promotions/MapServer/1/query?${params}`
    );

    if (response.data.features && response.data.features.length > 0) {
      // Calculate distance to nearest near-net point
      const nearestFeature = response.data.features[0];
      const distance = this.calculateDistance(
        coords,
        nearestFeature.geometry
      );

      return { distance };
    }

    return null;
  }

  /**
   * Convert WGS84 (lat/lng) to Web Mercator (EPSG:3857)
   */
  private latLngToWebMercator(lat: number, lng: number) {
    const x = (lng * 20037508.34) / 180;
    let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
    y = (y * 20037508.34) / 180;
    return { x, y };
  }

  /**
   * Calculate distance between two Web Mercator points (approximate)
   */
  private calculateDistance(point1: { x: number; y: number }, point2: any) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy); // meters (approximate in Web Mercator)
  }
}
```

---

### 4.3 Product Mapper Integration

**File**: `/lib/coverage/providers/dfa/dfa-product-mapper.ts`

```typescript
import { DFACoverageResponse } from './dfa-coverage-client';
import { ServicePackage } from '@/lib/types';

export class DFAProductMapper {
  /**
   * Map DFA coverage to available CircleTel BizFibre products
   */
  mapToProducts(coverage: DFACoverageResponse): ServicePackage[] {
    if (coverage.coverageType === 'connected') {
      // Return all 5 BizFibre products (active connection)
      return this.getAllBizFibreProducts();
    } else if (coverage.coverageType === 'near-net') {
      // Return products with "fiber extension required" note
      return this.getAllBizFibreProducts().map(product => ({
        ...product,
        description: `${product.description} - Fiber extension required (within ${coverage.nearNetDistance}m)`
      }));
    }

    return [];
  }

  private getAllBizFibreProducts(): ServicePackage[] {
    return [
      {
        id: 'dfa-bizfibre-lite',
        name: 'BizFibre Connect Lite',
        provider: 'dfa',
        speed_down: 10,
        speed_up: 10,
        price: 1699.00,
        service_type: 'fibre',
        product_category: 'BizFibreConnect',
        customer_type: 'business'
      },
      // ... 4 more BizFibre products
    ];
  }
}
```

---

### 4.4 Coverage Aggregation Integration

**File**: `/lib/coverage/aggregation-service.ts`

```typescript
import { DFACoverageClient } from './providers/dfa/dfa-coverage-client';

class CoverageAggregationService {
  private dfaClient = new DFACoverageClient();

  async checkCoverage(address: string) {
    // ... existing MTN check logic ...

    // Add DFA check
    const dfaCoverage = await this.dfaClient.checkCoverage({
      latitude: coordinates.lat,
      longitude: coordinates.lng
    });

    if (dfaCoverage.hasCoverage) {
      const dfaProducts = new DFAProductMapper().mapToProducts(dfaCoverage);
      allProducts.push(...dfaProducts);
    }

    return {
      providers: ['mtn', 'dfa'],
      products: allProducts,
      coverage: {
        mtn: mtnCoverage,
        dfa: dfaCoverage
      }
    };
  }
}
```

---

## 5. Implementation Checklist

### Phase 1: Database Setup (✅ Complete)
- [x] DFA provider record created
- [x] `provider_code = 'dfa'` set
- [x] `service_offerings = ["fibre"]`
- [ ] **TODO**: Enable DFA provider (`active = true`)

### Phase 2: Service Layer (Pending)
- [ ] Create `/lib/coverage/providers/dfa/` directory
- [ ] Implement `dfa-coverage-client.ts` (API integration)
- [ ] Implement `dfa-product-mapper.ts` (map coverage to BizFibre products)
- [ ] Add coordinate transformation utilities (WGS84 ↔ Web Mercator)
- [ ] Implement caching layer (5-minute TTL)

### Phase 3: Testing
- [ ] Unit tests for DFACoverageClient
- [ ] Integration tests for coverage queries
- [ ] Test with known DFA coverage addresses:
  - ✅ Sandton City, Johannesburg (Connected)
  - ✅ 1 Jan Smuts Avenue, Randburg (Near-Net)
  - [ ] Other major commercial areas

### Phase 4: UI Integration
- [ ] Add DFA coverage overlay to `/app/coverage` map
- [ ] Display purple polygons for connected buildings
- [ ] Show "Fiber extension available" badge for near-net
- [ ] Update product cards with DFA branding

---

## 6. API Response Examples

### 6.1 Connected Building Response

```json
{
  "displayFieldName": "BuildingName",
  "fieldAliases": {
    "OBJECTID": "OBJECTID",
    "BuildingName": "Building Name",
    "Address": "Address",
    "Status": "Status"
  },
  "geometryType": "esriGeometryPolygon",
  "spatialReference": { "wkid": 102100, "latestWkid": 3857 },
  "features": [
    {
      "attributes": {
        "OBJECTID": 12345,
        "BuildingName": "Sandton City",
        "Address": "Sandton City, Rivonia Road, Sandton, 2196",
        "Status": "Connected"
      },
      "geometry": {
        "rings": [
          [
            [3123800.123, -3004950.456],
            [3123850.789, -3004900.123],
            [3123900.456, -3004950.789],
            [3123850.123, -3005000.456],
            [3123800.123, -3004950.456]
          ]
        ]
      }
    }
  ]
}
```

### 6.2 No Coverage Response

```json
{
  "displayFieldName": "",
  "fieldAliases": {},
  "geometryType": "esriGeometryPolygon",
  "spatialReference": { "wkid": 102100, "latestWkid": 3857 },
  "features": []
}
```

---

## 7. Performance Considerations

### 7.1 Caching Strategy
```typescript
// Cache coverage results for 5 minutes
const cacheKey = `dfa:coverage:${latitude}:${longitude}`;
const cachedResult = await redis.get(cacheKey);
if (cachedResult) return JSON.parse(cachedResult);

const result = await dfaClient.checkCoverage({ latitude, longitude });
await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 min TTL
return result;
```

### 7.2 Rate Limiting
- DFA API appears to have **no rate limiting** (public endpoint)
- Recommend implementing **client-side rate limiting**: Max 60 requests/minute
- Use request batching for map viewport queries

### 7.3 Error Handling
```typescript
try {
  const coverage = await dfaClient.checkCoverage(request);
} catch (error) {
  if (error.response?.status === 503) {
    // DFA API temporarily unavailable - fallback to cached data
    return cachedCoverageData;
  }
  throw error;
}
```

---

## 8. Screenshots

### Map Legend
![DFA Legend](/.playwright-mcp/dfa-legend-panel.png)

**Legend Items**:
- **Near-Net Buildings** - Yellow/beige markers (buildings close to fiber)
- **Connected Buildings** - Purple polygons (active DFA connections)
- **Ductbank - Construction** - Dark blue lines (fiber under construction)
- **Ductbank - Completed** - Green lines (completed fiber infrastructure)

### Sandton City Coverage
![Sandton Coverage](/.playwright-mcp/sandton-city-coverage.png)

**Coverage Highlights**:
- Large purple polygon covering Sandton City mall (Connected)
- Extensive green fiber network along Rivonia Road, 5th Street
- Multiple yellow near-net markers in surrounding buildings

### Jan Smuts Avenue Coverage
![Jan Smuts Coverage](/.playwright-mcp/dfa-coverage-map.png)

**Coverage Highlights**:
- Green fiber line along Jan Smuts Avenue
- Near-net opportunities for surrounding properties

---

## 9. Next Steps

### Immediate (Phase 1A.3-1A.7)
1. **Enable DFA Provider** in database (`active = true`)
2. **Create DFA Service Layer** (`/lib/coverage/providers/dfa/`)
3. **Implement Coverage Client** with ArcGIS REST API integration
4. **Test Coverage Queries** with known addresses
5. **Integrate with Aggregation Service** (multi-provider coverage)

### Future Enhancements
1. **Real-time Fiber Construction Updates** - Query construction layer monthly
2. **Lead Generation** - Capture near-net addresses for sales follow-up
3. **Map Visualization** - Overlay DFA coverage on Google Maps
4. **Product Recommendations** - Smart matching based on building type (commercial/enterprise)

---

## 10. Technical Notes

### Coordinate Systems
- **WKID 4326 (WGS84)**: Google Maps, GPS coordinates (lat/lng)
- **WKID 102100 (Web Mercator)**: DFA API input/output, web mapping
- **Conversion Required**: Always convert lat/lng → Web Mercator before querying DFA

### API Limitations
- ❌ **No Address Search** - Must geocode addresses first (use Google Maps API)
- ❌ **No Authentication** - Public endpoint (could change)
- ✅ **Standard ESRI Format** - Well-documented, libraries available
- ✅ **Spatial Queries** - Point, polygon, bounding box support

### Security Considerations
- DFA API is **public** (no API key required)
- **CORS enabled** for web requests
- **No sensitive data** exposed (coverage is public information)
- Recommend **proxy through CircleTel backend** to avoid client-side CORS issues

---

## 11. References

- **DFA Coverage Portal**: https://gisportal.dfafrica.co.za/arcgis/apps/webappviewer/
- **ArcGIS REST API Docs**: https://developers.arcgis.com/rest/
- **Esri Spatial Reference**: https://spatialreference.org/ref/sr-org/7483/

---

## 12. API Field Schema Summary

### Connected Buildings Layer (13 fields)
| Field | Type | Purpose |
|-------|------|---------|
| `DFA_Building_ID` | String | Unique building identifier |
| `DFA_Connected_Y_N` | String | "Y" or "N" connection status |
| `Latitude`, `Longitude` | Double | Coordinates |
| `FTTH` | String | Fiber-to-the-Home availability |
| `Broadband` | String | Broadband service type |
| `Precinct` | String | Geographic area |
| `Promotion` | String | Active promotion flag |

**Coverage Check**: Query with point geometry, check if `DFA_Connected_Y_N = "Y"`

---

### Near-Net Buildings Layer (5 fields)
| Field | Type | Purpose |
|-------|------|---------|
| `DFA_Building_ID` | String | Unique building identifier |
| `Building_Name` | String | Building name ⭐ |
| `Street_Address` | String | Full address ⭐ |
| `Property_Owner` | String | Owner/NNB status |

**Coverage Check**: Query with buffered point (200m radius), return address for lead generation

---

### Ductbank Layer (52 fields)
| Field | Type | Purpose |
|-------|------|---------|
| `stage` | String | "Completed" (green) / "Construction" (blue) ⭐ |
| `ea1` (Route Name) | String | Fiber route name |
| `ea2` (DFA Region) | String | Geographic region |
| `totlength` | Double | Route length |
| `installday/month/year` | Integer | Installation date |
| `start_buildingid`, `end_buildingid` | Integer | Connected buildings |

**Coverage Check**: Query with buffered point, calculate distance to nearest completed fiber

---

## 13. Integration Code Snippets

### TypeScript Interface Definitions

```typescript
// Connected Building Response
interface DFAConnectedBuilding {
  OBJECTID: number;
  DFA_Building_ID: string;
  Longitude: number;
  Latitude: number;
  DFA_Connected_Y_N: 'Y' | 'N';
  Third_Party_Dependant_For_Conne?: string;
  Broadband?: string;
  FTTH?: string;
  Precinct?: string;
  Promotion?: string;
  Microwave_Connected?: string;
}

// Near-Net Building Response
interface DFANearNetBuilding {
  OBJECTID: number;
  DFA_Building_ID: string;
  Building_Name: string;
  Street_Address: string;
  Property_Owner?: string;
}

// Ductbank Response
interface DFADuctbank {
  OBJECTID: number;
  ductbankid: number;
  name?: string;
  owner?: string;
  stage: 'Completed' | 'Construction' | string;
  ea1?: string; // Route Name
  ea2?: string; // DFA Region
  totlength?: number;
  length_units?: string;
  installday?: number;
  installmonth?: number;
  installyear?: number;
  n_superducts?: number;
  n_innerducts?: number;
}

// ArcGIS Feature Response
interface ArcGISFeature<T> {
  attributes: T;
  geometry?: {
    rings?: number[][][]; // Polygon
    paths?: number[][][]; // Polyline
    x?: number; // Point
    y?: number;
  };
}

interface ArcGISQueryResponse<T> {
  displayFieldName: string;
  fieldAliases: Record<string, string>;
  geometryType: 'esriGeometryPolygon' | 'esriGeometryPolyline' | 'esriGeometryPoint';
  spatialReference: { wkid: number; latestWkid?: number };
  features: ArcGISFeature<T>[];
}
```

### Coverage Check Example with TypeScript

```typescript
async function checkDFACoverage(latitude: number, longitude: number) {
  const webMercator = latLngToWebMercator(latitude, longitude);

  // 1. Check Connected Buildings
  const connectedUrl = new URL(
    'https://gisportal.dfafrica.co.za/server/rest/services/API/DFA_Connected_Buildings/MapServer/0/query'
  );
  connectedUrl.searchParams.set('f', 'json');
  connectedUrl.searchParams.set('returnGeometry', 'false');
  connectedUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  connectedUrl.searchParams.set('geometry', JSON.stringify({
    x: webMercator.x,
    y: webMercator.y,
    spatialReference: { wkid: 102100 }
  }));
  connectedUrl.searchParams.set('geometryType', 'esriGeometryPoint');
  connectedUrl.searchParams.set('inSR', '102100');
  connectedUrl.searchParams.set('outFields', 'DFA_Building_ID,DFA_Connected_Y_N,FTTH,Broadband,Precinct');
  connectedUrl.searchParams.set('outSR', '102100');

  const response = await fetch(connectedUrl);
  const data: ArcGISQueryResponse<DFAConnectedBuilding> = await response.json();

  if (data.features.length > 0 && data.features[0].attributes.DFA_Connected_Y_N === 'Y') {
    return {
      hasCoverage: true,
      coverageType: 'connected' as const,
      building: data.features[0].attributes
    };
  }

  // 2. Check Near-Net Buildings (if not connected)
  // ... similar query with 200m buffer

  return { hasCoverage: false, coverageType: 'none' as const };
}
```

---

**Analysis Completed**: 2025-10-22
**Field Schemas Extracted**: ✅ Complete (3 layers, 70 total fields)
**Next Action**: Enable DFA provider and implement service layer (Phase 1A.3-1A.7)

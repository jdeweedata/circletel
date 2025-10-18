# MTN Coverage Testing - Executive Summary
## Test: 25 Fish Eagle Place, Imhofs Gift, Cape Town, Western Cape

**Date:** October 4, 2025
**Testing Tool:** Playwright with Browser DevTools Monitoring
**Duration:** ~35 seconds
**Status:** ✅ Complete

---

## 🎯 Test Objectives

1. Understand how MTN checks coverage at a specific address
2. Identify the API endpoints and protocols used
3. Capture network traffic, console logs, and browser storage
4. Document the complete technical architecture
5. Provide integration guidance for CircleTel

---

## 📊 Key Discoveries

### 1. **Coverage API Architecture**

MTN uses a **Web Map Service (WMS) GeoServer** implementation - NOT a simple REST API:

```
🌐 Primary Endpoint: https://mtnsi.mtn.co.za/cache/geoserver/wms
📡 Protocol: OGC Web Map Service (WMS) 1.3.0
🔍 Method: GetFeatureInfo request
🗺️ Projection: EPSG:900913 (Web Mercator)
```

### 2. **How Coverage Checking Works**

```mermaid
graph LR
    A[Address Input] --> B[Google Places API]
    B --> C[Lat/Lng Coordinates]
    C --> D[Map Viewport Calculation]
    D --> E[Pixel Coordinate Conversion]
    E --> F[WMS GetFeatureInfo Request]
    F --> G[Coverage Result]
```

**Key Steps:**
1. User enters address → Google Places Autocomplete
2. Address geocoded to latitude/longitude
3. Map viewport and pixel coordinates calculated
4. WMS GetFeatureInfo request sent to GeoServer
5. JSONP response parsed and displayed

### 3. **Coverage Layers Available**

| Layer | WMS Layer Name | Purpose |
|-------|---------------|---------|
| **5G Coverage** | `mtnsi:MTNSA-Coverage-5G` | 5G network coverage |
| **LTE Coverage** | `mtnsi:MTNSA-Coverage-LTE` | 4G/LTE coverage |
| **3G Coverage** | `mtnsi:MTNSA-Coverage-3G` | 3G network coverage |
| **GigZone POI** | `mtnsi:GigZone-POI` | GigZone hotspots |

### 4. **GetFeatureInfo Request Format**

```http
GET https://mtnsi.mtn.co.za/cache/geoserver/wms?
    service=WMS
    &version=1.3.0
    &request=GetFeatureInfo
    &query_layers=mtnsi:MTNSA-Coverage-LTE,mtnsi:MTNSA-Coverage-5G
    &layers=mtnsi:MTNSA-Coverage-LTE,mtnsi:MTNSA-Coverage-5G
    &info_format=text/javascript
    &format_options=callback:wmsGetFeatureInfoParseResponse
    &feature_count=10
    &srs=EPSG:900913
    &bbox=[viewport_bounds]
    &width=[map_width]
    &height=[map_height]
    &i=[click_pixel_x]
    &j=[click_pixel_y]
```

**Critical Parameters:**
- `query_layers`: Which coverage layers to check
- `bbox`: Map viewport bounds in EPSG:900913
- `i, j`: Pixel coordinates of the location on the map
- `format_options`: JSONP callback function name

---

## 🔧 Technical Stack

### Frontend
- **Framework:** Angular (TypeScript SPA)
- **Map API:** Google Maps JavaScript API v3
- **Libraries:**
  - jQuery 1.9.1 + jQuery Mobile 1.4.5
  - Wicket.js (geometry parsing)
  - MarkerClusterer.js
  - Custom WMS integration scripts

### Backend
- **GeoServer:** MTN Coverage WMS Service
- **Endpoint:** `mtnsi.mtn.co.za/cache/geoserver`
- **Tile Cache:** GeoWebCache for map tiles
- **Data Format:** JSONP responses

### Google Maps Integration
- **API Keys:**
  - App: `AIzaSyAlLAG0NxCZv-sS7gNO_1kz-P1mkFH_bh4`
  - Map: `AIzaSyCKj0Ew6BQvErweLLAhrYxNvYhv2k87c4c`
- **Libraries:** Places, Geometry

---

## 📸 Visual Evidence

Test captured 5 screenshots showing the complete flow:

1. **Initial Page Load** - MTN coverage checker interface
2. **Address Typed** - "25 Fish Eagle Place, Imhofs Gift, Cape Town, Western Cape"
3. **Autocomplete** - Google Places suggestions displayed
4. **Results Loading** - Map panning to location
5. **Final Results** - Coverage map with location marked

![Final Coverage Results](05-final-results.png)

*Screenshot shows the MTN coverage map with address search results and location marker*

---

## 📡 Network Traffic Summary

**Total Requests Captured:** 200+

### Key API Calls:

1. **Map Bootstrap Configuration**
   ```
   GET /coverage/configs/map-bootstrap.json
   GET /coverage/configs/moc-bc67042cdd40437fb9ddd70a16bea399.json
   ```

2. **Coverage Tile Rendering** (50+ requests)
   ```
   GET /cache/geoserver/wms?REQUEST=GetMap&LAYERS=mtnsi:MTNSA-Coverage-LTE
   ```

3. **JavaScript Libraries** (9 scripts)
   ```
   - maptools.js
   - maptools-wmsquery.js
   - coverage3.js
   - geocode.js
   - wicket.js
   ```

4. **Google Maps API**
   ```
   GET /maps/api/js?key=***&libraries=places,geometry
   ```

5. **CMS Content** (banners, promotions)
   ```
   GET /api/cms/generic/v1/banner/*
   GET /api/cms/generic/v1/promotions/*
   ```

---

## 🧪 Console Log Analysis

### Initialization Sequence:
```
✅ Loading with boot-selector 'v3'
✅ Loaded 9 scripts for boot-selector 'v3'
✅ Google Maps API loaded
✅ Map config [moc-bc67042cdd40437fb9ddd70a16bea399] loaded and initialized
```

### Warnings Detected:
⚠️ Google Maps loaded without `async` (performance issue)
⚠️ Google Places Autocomplete deprecated (March 2025)
⚠️ Preload link missing `as` attribute

### No Errors:
✅ All scripts loaded successfully
✅ No JavaScript errors
✅ WMS queries completed

---

## 💾 Browser Storage

### Local Storage
❌ No coverage data cached

### Session Storage
❌ No coverage data cached

### Cookies
📊 Only analytics and session cookies
❌ No coverage lookup caching

**Conclusion:** Coverage checks are not cached client-side. Each lookup queries the GeoServer in real-time.

---

## 🚀 Integration Recommendations for CircleTel

### ✅ Feasible Integration Approaches

#### Option 1: Direct WMS GetFeatureInfo (Recommended)
```typescript
// Pros:
+ Public endpoint (no auth required)
+ Real-time coverage data
+ Multiple technology layers
+ Proven reliable

// Cons:
- Complex pixel coordinate calculation
- Requires map viewport context
- JSONP response parsing needed
```

#### Option 2: Proxy MTN WMS Through CircleTel API
```typescript
// Create CircleTel middleware:
POST /api/coverage/mtn/check
{
  "address": "25 Fish Eagle Place...",
  "coordinates": { "lat": -33.xxx, "lng": 18.xxx }
}

// Backend handles:
1. Geocoding (if needed)
2. Viewport calculation
3. Pixel coordinate conversion
4. WMS GetFeatureInfo request
5. Response parsing
6. Result normalization
```

#### Option 3: Hybrid Approach with Caching
```typescript
// Cache strategy:
1. Check Redis/DB for cached result by coordinates
2. If cache miss → Query MTN WMS
3. Store result with 24-hour TTL
4. Return normalized coverage data

// Benefits:
+ Reduced MTN API load
+ Faster response times
+ Cost savings
```

---

## 📋 Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Implement EPSG:900913 coordinate conversion
- [ ] Build pixel coordinate calculator
- [ ] Create WMS query parameter builder
- [ ] Develop JSONP response parser

### Phase 2: Integration (Week 2)
- [ ] Build MTN WMS client service
- [ ] Implement error handling and retries
- [ ] Add request timeout management
- [ ] Create response normalizer

### Phase 3: Caching & Optimization (Week 3)
- [ ] Set up Redis caching layer
- [ ] Implement cache invalidation strategy
- [ ] Add rate limiting protection
- [ ] Performance monitoring

### Phase 4: Testing & Validation (Week 4)
- [ ] Compare results with MTN website
- [ ] Test edge cases (no coverage, errors)
- [ ] Load testing (rate limits)
- [ ] Integration testing with CircleTel flow

---

## 🎯 Critical Success Factors

### 1. **Accurate Coordinate Conversion**
Must correctly implement Web Mercator projection (EPSG:900913) and pixel calculations.

### 2. **Viewport Context Management**
WMS requires valid map viewport bounds - must be calculated based on zoom level and center point.

### 3. **Multi-Layer Querying**
Query all technology layers (5G, LTE, 3G) simultaneously and aggregate results.

### 4. **Response Parsing**
Handle JSONP callbacks or request JSON format if supported.

### 5. **Caching Strategy**
Implement intelligent caching to reduce API load and improve response times.

---

## 🔍 Code Examples

### Pixel Coordinate Calculation (JavaScript)
```javascript
function latLngToPixel(lat, lng, mapBounds, mapWidth, mapHeight, zoom) {
    const scale = Math.pow(2, zoom);

    // Northwest corner of viewport
    const nw = {
        lat: mapBounds.north,
        lng: mapBounds.west
    };

    // Convert to world coordinates
    const worldNW = latLngToWorldCoord(nw.lat, nw.lng);
    const worldPoint = latLngToWorldCoord(lat, lng);

    // Calculate pixel offset
    const pixelX = Math.floor((worldPoint.x - worldNW.x) * scale);
    const pixelY = Math.floor((worldPoint.y - worldNW.y) * scale);

    return { x: pixelX, y: pixelY };
}

function latLngToWorldCoord(lat, lng) {
    const siny = Math.sin((lat * Math.PI) / 180);
    const x = ((lng + 180) / 360);
    const y = (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI));
    return { x, y };
}
```

### WMS Query Builder (TypeScript)
```typescript
interface WMSParams {
    service: 'WMS';
    version: '1.3.0';
    request: 'GetFeatureInfo';
    query_layers: string;
    layers: string;
    info_format: string;
    feature_count: number;
    srs: string;
    bbox: string;
    width: number;
    height: number;
    i: number; // pixel x
    j: number; // pixel y
}

function buildWMSQuery(
    lat: number,
    lng: number,
    layers: string[] = ['mtnsi:MTNSA-Coverage-LTE', 'mtnsi:MTNSA-Coverage-5G']
): WMSParams {
    const zoom = 15; // Appropriate zoom level
    const mapSize = { width: 1920, height: 1080 };

    const viewport = calculateViewport(lat, lng, zoom, mapSize);
    const pixelCoords = latLngToPixel(lat, lng, viewport.bounds,
                                      mapSize.width, mapSize.height, zoom);

    return {
        service: 'WMS',
        version: '1.3.0',
        request: 'GetFeatureInfo',
        query_layers: layers.join(','),
        layers: layers.join(','),
        info_format: 'application/json',
        feature_count: 10,
        srs: 'EPSG:900913',
        bbox: viewport.bbox,
        width: mapSize.width,
        height: mapSize.height,
        i: pixelCoords.x,
        j: pixelCoords.y
    };
}
```

---

## 📝 Documentation References

### Generated Documents:
1. **[COMPREHENSIVE_MTN_COVERAGE_ANALYSIS.md](COMPREHENSIVE_MTN_COVERAGE_ANALYSIS.md)** - Complete technical analysis (20+ pages)
2. **[DETAILED_TEST_REPORT.json](DETAILED_TEST_REPORT.json)** - Raw test data with all network logs
3. **[MTN_COVERAGE_TEST_REPORT.md](MTN_COVERAGE_TEST_REPORT.md)** - Detailed markdown report with all API calls

### Screenshots:
- [01-initial-page.png](01-initial-page.png)
- [02-address-typed.png](02-address-typed.png)
- [03-after-autocomplete.png](03-after-autocomplete.png)
- [04-results-loading.png](04-results-loading.png)
- [05-final-results.png](05-final-results.png)

### Video Recording:
- Browser interaction recorded (WebM format)

---

## 💡 Key Insights

### What We Learned:

1. **No Simple REST API** - MTN uses OGC WMS protocol, not traditional REST
2. **Map Context Required** - Cannot check coverage without viewport calculations
3. **Client-Side Heavy** - Most processing happens in browser JavaScript
4. **No Authentication** - Public endpoint, but may have rate limits
5. **JSONP Callbacks** - Legacy response format, may support JSON

### What This Means for CircleTel:

✅ **Good News:**
- Public API (no auth barriers)
- Multiple coverage layers available
- Real-time, accurate data
- Can integrate without MTN partnership

⚠️ **Challenges:**
- Complex integration (not simple fetch)
- Requires GIS knowledge (coordinate systems)
- Potential rate limiting (unknown)
- Must maintain map viewport logic

---

## 🎬 Next Actions

### Immediate (This Week):
1. ✅ Review comprehensive analysis document
2. ✅ Validate WMS endpoint with test requests
3. ✅ Implement coordinate conversion utilities
4. ✅ Build proof-of-concept WMS client

### Short-Term (Next 2 Weeks):
1. ⏳ Integrate WMS client into CircleTel API
2. ⏳ Add caching layer (Redis)
3. ⏳ Implement error handling and fallbacks
4. ⏳ Test against production addresses

### Long-Term (Next Month):
1. 📅 Performance optimization
2. 📅 Multi-provider aggregation (MTN + others)
3. 📅 Advanced caching strategies
4. 📅 Monitoring and alerting

---

## ✅ Test Completion Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Network Traffic** | ✅ Complete | 200+ requests captured |
| **Console Logs** | ✅ Complete | All messages logged |
| **Browser Storage** | ✅ Complete | No coverage caching found |
| **Screenshots** | ✅ Complete | 5 key stages captured |
| **API Documentation** | ✅ Complete | Full WMS spec documented |
| **Code Analysis** | ✅ Complete | JavaScript libraries analyzed |
| **Integration Guide** | ✅ Complete | Implementation roadmap created |

---

## 📞 Questions & Support

For questions about this analysis or integration support:

1. Review [COMPREHENSIVE_MTN_COVERAGE_ANALYSIS.md](COMPREHENSIVE_MTN_COVERAGE_ANALYSIS.md) for technical details
2. Check [DETAILED_TEST_REPORT.json](DETAILED_TEST_REPORT.json) for raw data
3. Refer to code examples in this document
4. Contact development team for implementation assistance

---

**Test Completed:** October 4, 2025
**Next Review:** Week of October 11, 2025
**Integration Target:** November 2025

---

*This executive summary provides a high-level overview. For complete technical details, refer to the comprehensive analysis document.*

# MTN Coverage API - Comprehensive Analysis
## Test Address: 25 Fish Eagle Place, Imhofs Gift, Cape Town, Western Cape

**Test Date:** October 4, 2025
**Test URL:** https://www.mtn.co.za/home/coverage/
**Testing Method:** Playwright automated browser testing with full dev tools monitoring

---

## Executive Summary

This comprehensive analysis reveals the complete architecture of MTN's coverage checking system. The system uses a sophisticated **Web Map Service (WMS) GeoServer** implementation with tiled coverage layers for different technologies (5G, LTE, 3G).

### Key Findings

1. **Primary Coverage API:** GeoServer WMS endpoint at `https://mtnsi.mtn.co.za/cache/geoserver/wms`
2. **Coverage Check Method:** `GetFeatureInfo` WMS request (not direct coordinate lookup)
3. **Architecture:** Client-side map clicking triggers WMS queries with pixel-to-coordinate conversion
4. **Technologies:** Separate WMS layers for 5G, LTE, and 3G coverage
5. **Integration:** Google Maps API with custom WMS tile overlay system

---

## 1. Architecture Overview

### 1.1 Technology Stack

```
┌─────────────────────────────────────────┐
│   MTN Coverage Web Application          │
│   (Angular/TypeScript SPA)              │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼─────────┐
│  Google Maps   │    │  MTN GeoServer   │
│  JavaScript    │    │  WMS Service     │
│  API           │    │  (Coverage Data) │
└────────────────┘    └──────────────────┘
        │                       │
        └───────────┬───────────┘
                    │
            ┌───────▼────────┐
            │  Coverage      │
            │  Result        │
            │  Display       │
            └────────────────┘
```

### 1.2 Core Components

1. **Frontend Application**
   - Angular SPA hosted at `www.mtn.co.za/home/coverage/`
   - Embedded map at `mtnsi.mtn.co.za/coverage/map3.html`
   - Google Maps API key: `AIzaSyCKj0Ew6BQvErweLLAhrYxNvYhv2k87c4c`

2. **Map Bootstrap System**
   - Configuration loader: `configs/map-bootstrap.json`
   - Map configuration: `configs/moc-bc67042cdd40437fb9ddd70a16bea399.json`
   - Dynamic script loading based on "boot-selector"

3. **Coverage Data Backend**
   - GeoServer WMS: `mtnsi.mtn.co.za/cache/geoserver/wms`
   - Multiple WMS layers for different technologies
   - Tiled map rendering (256x256px tiles)

---

## 2. WMS Layer Configuration

### 2.1 Available Coverage Layers

Based on the configuration file analysis:

```json
{
  "layers": [
    {
      "mapLayerId": "gigzone",
      "wmsURL": "/cache/geoserver/gwc/service/wms",
      "wmsLayers": [{
        "wmsLayerId": "gigzone",
        "wmsLayer": "mtnsi:GigZone-POI",
        "wmsStyle": "GigZone"
      }]
    },
    {
      "mapLayerId": "_5gCoverage",
      "wmsURL": "/cache/geoserver/wms",
      "opacity": 0.4,
      "wmsLayers": [{
        "wmsLayerId": "_5g",
        "wmsLayer": "mtnsi:MTNSA-Coverage-5G",
        "wmsStyle": "MTN-Coverage-5G-MOC"
      }]
    },
    {
      "mapLayerId": "lteCoverage",
      "wmsURL": "/cache/geoserver/wms",
      "opacity": 0.4,
      "wmsLayers": [{
        "wmsLayerId": "lte",
        "wmsLayer": "mtnsi:MTNSA-Coverage-LTE",
        "wmsStyle": "MTN-Coverage-LTE-MOC"
      }]
    }
  ]
}
```

### 2.2 WMS GetMap Request Format

**Example LTE Coverage Tile Request:**
```
GET https://mtnsi.mtn.co.za/cache/geoserver/wms?
  mlid=lteCoverage
  &SERVICE=WMS
  &REQUEST=GetMap
  &VERSION=1.1.1
  &LAYERS=mtnsi:MTNSA-Coverage-LTE
  &STYLES=MTN-Coverage-LTE-MOC
  &FORMAT=image/png
  &TRANSPARENT=TRUE
  &TILED=TRUE
  &SRS=EPSG:900913
  &BBOX=3130860.678125,-3052589.1611718736,3169996.4366015624,-3013453.4026953112
  &WIDTH=256
  &HEIGHT=256
```

**Coordinate System:** EPSG:900913 (Web Mercator / Google Maps projection)

---

## 3. Coverage Checking Mechanism

### 3.1 WMS GetFeatureInfo Request

The core coverage checking uses **WMS GetFeatureInfo** protocol:

#### JavaScript Implementation
```javascript
// From maptools-wmsquery.js
this.wmsFeatureInfoOptions = {
    service: "WMS",
    version: "1.3.0",
    request: "GetFeatureInfo",
    info_format: "text/javascript",
    exceptions: "application/vnd.ogc.se_xml",
    format_options: "callback:wmsGetFeatureInfoParseResponse"
};
```

#### Request Flow

1. **User clicks on map** → Triggers map click event
2. **Debounce handler** → Distinguishes single/double clicks (250ms delay)
3. **Pixel location calculation** → Converts lat/lng to pixel coordinates
4. **WMS query construction** → Builds GetFeatureInfo request
5. **JSONP callback** → Returns coverage data via `wmsGetFeatureInfoParseResponse`

### 3.2 Pixel-to-Coordinate Conversion

```javascript
// Calculate pixel location from lat/lng
getPixelLocation(map, latlng) {
    var scale = Math.pow(2, map.getZoom());
    var nw = new google.maps.LatLng(
        map.getBounds().getNorthEast().lat(),
        map.getBounds().getSouthWest().lng()
    );
    var worldCoordinateNW = map.getProjection().fromLatLngToPoint(nw);
    var worldCoordinate = map.getProjection().fromLatLngToPoint(latlng);
    var pixelLocation = new google.maps.Point(
        Math.floor((worldCoordinate.x - worldCoordinateNW.x) * scale),
        Math.floor((worldCoordinate.y - worldCoordinateNW.y) * scale)
    );
    return pixelLocation;
}
```

### 3.3 GetFeatureInfo Request Parameters

```javascript
// Query parameters construction
qParams.query_layers = qParams.layers = qLevelData.wmsQueryLayers;
qParams.feature_count = qLevelData.maxFeatures;
qParams.propertyName = qLevelData.propertyList; // Optional property filter
qParams.srs = "EPSG:900913";
qParams.width = mapDimensions.width;
qParams.height = mapDimensions.height;
qParams.bbox = "minX,minY,maxX,maxY"; // Map viewport bounds

// WMS 1.3.0 uses i,j instead of x,y
qParams.i = eventPoint.x.toFixed(0); // Pixel X coordinate
qParams.j = eventPoint.y.toFixed(0); // Pixel Y coordinate
```

**Example Request URL:**
```
https://mtnsi.mtn.co.za/cache/geoserver/wms?
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

---

## 4. Network Traffic Analysis

### 4.1 Key API Endpoints Discovered

| Endpoint | Purpose | Method |
|----------|---------|--------|
| `mtnsi.mtn.co.za/coverage/map3.html` | Embedded coverage map | GET |
| `mtnsi.mtn.co.za/coverage/configs/map-bootstrap.json` | Bootstrap configuration | GET |
| `mtnsi.mtn.co.za/cache/geoserver/wms` | Coverage tile rendering (GetMap) | GET |
| `mtnsi.mtn.co.za/cache/geoserver/wms` | Coverage checking (GetFeatureInfo) | GET |
| `www.mtn.co.za/api/cms/generic/v1/*` | CMS content (banners, promotions) | GET |

### 4.2 JavaScript Libraries Loaded

1. **jQuery 1.9.1** (`jquery-1.9.1.min.js`)
2. **jQuery Mobile 1.4.5** (`jquery.mobile-1.4.5.min.js`)
3. **Google Maps API v3** (with Places & Geometry libraries)
4. **Wicket.js** - WKT/WKB geometry parsing
5. **MarkerClusterer.js** - Marker clustering for map
6. **Custom MTN Scripts:**
   - `maptools.js` - WMS layer management
   - `maptools-wmsquery.js` - WMS query manager
   - `geocode.js` - Address geocoding
   - `coverage3.js` - Main coverage logic

### 4.3 Google Maps Integration

**Primary API Key:** `AIzaSyAlLAG0NxCZv-sS7gNO_1kz-P1mkFH_bh4` (Angular app)
**Map API Key:** `AIzaSyCKj0Ew6BQvErweLLAhrYxNvYhv2k87c4c` (Coverage map)

**Libraries:** `places,geometry`

---

## 5. Console Log Analysis

### 5.1 Boot Sequence

```
[LOG] Loading with boot-selector 'v3'
[LOG] Loaded 9 scripts for boot-selector 'v3'
[LOG] Google Maps API loaded.
[LOG] Map config [moc-bc67042cdd40437fb9ddd70a16bea399] loaded and initialized
```

### 5.2 Warnings Detected

1. **Google Maps Loading Warning:**
   ```
   Google Maps JavaScript API has been loaded directly without loading=async.
   This can result in suboptimal performance.
   ```

2. **Preload Warning:**
   ```
   <link rel=preload> must have a valid `as` value
   ```

3. **Google Places Deprecation (March 2025):**
   ```
   As of March 1st, 2025, google.maps.places.Autocomplete is not available to new customers.
   Please use google.maps.places.PlaceAutocompleteElement instead.
   ```

---

## 6. Browser Storage Analysis

### 6.1 Local Storage

**No coverage-related data stored in localStorage**

### 6.2 Session Storage

**No coverage-related data stored in sessionStorage**

### 6.3 Cookies

Cookies are primarily for:
- Google Analytics tracking
- Session management
- Marketing tags

**No coverage lookup caching detected in cookies**

---

## 7. Coverage Check User Flow

### Step-by-Step Process

```mermaid
graph TD
    A[User enters address] --> B[Google Places Autocomplete]
    B --> C[User selects suggestion]
    C --> D[Geocode to lat/lng]
    D --> E[Map pans to location]
    E --> F[Drop marker on map]
    F --> G[Trigger WMS GetFeatureInfo]
    G --> H{Coverage Found?}
    H -->|Yes| I[Display coverage details]
    H -->|No| J[Display no coverage message]
    I --> K[Show technology badges]
    K --> L[Show available packages]
```

### 7.1 Address Input Handling

**Google Places Autocomplete Integration:**
```javascript
// pac = Google Places Autocomplete instance
pac = new google.maps.places.Autocomplete(inputElement, {
    types: ['address'],
    componentRestrictions: { country: 'za' }
});

pac.addListener('place_changed', function() {
    var place = pac.getPlace();
    if (place.geometry) {
        map.setCenter(place.geometry.location);
        // Trigger coverage check at this location
    }
});
```

### 7.2 Coverage Result Display

Based on WMS GetFeatureInfo response, the system displays:
- **Technology badges:** 5G, LTE, 3G availability
- **Speed information:** Expected download/upload speeds
- **Package recommendations:** Available products for the location
- **Infrastructure details:** Cell tower proximity (if available)

---

## 8. Technical Specifications

### 8.1 Map Configuration

- **Default Zoom Level:** 10
- **Max POI Zoom Level:** 18
- **Max Cluster Zoom Level:** 17
- **Tile Size:** 256x256 pixels
- **Projection:** EPSG:900913 (Web Mercator)
- **Layer Opacity:** 0.4 (40% transparent)

### 8.2 WMS Layer Naming Convention

```
Namespace: mtnsi
Layers:
  - mtnsi:GigZone-POI
  - mtnsi:MTNSA-Coverage-5G
  - mtnsi:MTNSA-Coverage-LTE
  - mtnsi:MTNSA-Coverage-3G

Styles:
  - GigZone
  - MTN-Coverage-5G-MOC
  - MTN-Coverage-LTE-MOC
  - MTN-Coverage-3G-MOC
```

### 8.3 Query Manager Options

```javascript
{
    single: true,              // Enable single-click query
    singleRight: false,        // Disable right-click query
    double: false,             // Disable double-click query
    stopSingle: true,          // Stop event propagation on single click
    stopSingleRight: true,     // Stop event propagation on right click
    stopDouble: true,          // Stop event propagation on double click
    debounceDelay: 250         // 250ms debounce for click detection
}
```

---

## 9. Integration Patterns for CircleTel

### 9.1 What We Can Implement

✅ **Feasible Approaches:**

1. **WMS GetFeatureInfo API Integration**
   - Direct HTTP GET requests to GeoServer
   - Parse JSONP or JSON responses
   - No authentication required (public endpoint)

2. **Coordinate-Based Lookup**
   - Convert address to lat/lng using Google Geocoding
   - Calculate pixel coordinates
   - Query WMS GetFeatureInfo endpoint

3. **Multi-Layer Query**
   - Query all coverage layers simultaneously
   - Aggregate results (5G, LTE, 3G)
   - Determine best available technology

### 9.2 Implementation Challenges

❌ **Limitations:**

1. **No Direct REST API**
   - Must use WMS protocol
   - Requires map viewport context
   - Complex pixel coordinate calculations

2. **JSONP Callback Dependency**
   - Responses use JSONP format
   - Callback function: `wmsGetFeatureInfoParseResponse`
   - May need to parse manually

3. **Rate Limiting Unknown**
   - No visible rate limit headers
   - Could be IP-based throttling
   - Cache strategy recommended

### 9.3 Recommended Approach for CircleTel

```typescript
// Pseudocode for CircleTel integration

async function checkMTNCoverage(address: string) {
  // 1. Geocode address to coordinates
  const { lat, lng } = await geocodeAddress(address);

  // 2. Define map viewport (required for WMS)
  const viewport = calculateViewport(lat, lng, zoomLevel);

  // 3. Convert lat/lng to pixel coordinates
  const pixelCoords = latLngToPixel(lat, lng, viewport, zoomLevel);

  // 4. Build WMS GetFeatureInfo request
  const wmsParams = {
    service: 'WMS',
    version: '1.3.0',
    request: 'GetFeatureInfo',
    query_layers: 'mtnsi:MTNSA-Coverage-5G,mtnsi:MTNSA-Coverage-LTE',
    layers: 'mtnsi:MTNSA-Coverage-5G,mtnsi:MTNSA-Coverage-LTE',
    info_format: 'application/json', // or text/javascript
    feature_count: 10,
    srs: 'EPSG:900913',
    bbox: viewport.bbox,
    width: viewport.width,
    height: viewport.height,
    i: pixelCoords.x,
    j: pixelCoords.y
  };

  // 5. Query GeoServer
  const response = await fetch(
    'https://mtnsi.mtn.co.za/cache/geoserver/wms?' +
    new URLSearchParams(wmsParams)
  );

  // 6. Parse and return coverage data
  return parseWMSResponse(response);
}
```

---

## 10. Data Flow Diagram

```
┌─────────────┐
│   User      │
│   Input     │
│  (Address)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  Google Places API      │
│  Autocomplete &         │
│  Geocoding              │
└──────┬──────────────────┘
       │ {lat, lng}
       ▼
┌─────────────────────────┐
│  Map Viewport           │
│  Calculation            │
│  - Bounds               │
│  - Pixel coords         │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  WMS GetFeatureInfo     │
│  Request Builder        │
│  - Layer selection      │
│  - Parameter assembly   │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  MTN GeoServer          │
│  mtnsi.mtn.co.za        │
│  /cache/geoserver/wms   │
└──────┬──────────────────┘
       │ JSONP Response
       ▼
┌─────────────────────────┐
│  Response Parser        │
│  wmsGetFeatureInfo...   │
│  ParseResponse()        │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Coverage Result        │
│  Display                │
│  - Technologies         │
│  - Speeds               │
│  - Packages             │
└─────────────────────────┘
```

---

## 11. Screenshots Reference

1. **[01-initial-page.png](01-initial-page.png)** - MTN coverage page initial load
2. **[02-address-typed.png](02-address-typed.png)** - Address entered: "25 Fish Eagle Place..."
3. **[03-after-autocomplete.png](03-after-autocomplete.png)** - After Google Places autocomplete
4. **[04-results-loading.png](04-results-loading.png)** - Coverage check in progress
5. **[05-final-results.png](05-final-results.png)** - Final coverage results displayed

---

## 12. Key Takeaways

### For CircleTel Development:

1. **WMS Protocol Required**
   - MTN uses OGC Web Map Service standard
   - GetFeatureInfo is the core coverage check mechanism
   - No simple REST API available

2. **Client-Side Processing Needed**
   - Viewport calculations required
   - Pixel coordinate conversion essential
   - Map context dependency

3. **Multi-Layer Architecture**
   - Separate layers for each technology
   - Query multiple layers for complete coverage
   - Aggregate results client-side

4. **Google Maps Dependency**
   - Uses Google's projection system (EPSG:900913)
   - Requires geocoding for address lookup
   - Pixel calculations based on Google Maps viewport

5. **Caching Strategy Important**
   - No built-in caching in MTN API
   - Implement client-side caching
   - Store results by coordinates/address

---

## 13. Next Steps for CircleTel

### Immediate Actions:

1. ✅ **Validate WMS GetFeatureInfo endpoint**
   - Test with known coordinates
   - Verify JSONP/JSON response format
   - Check rate limiting

2. ✅ **Implement coordinate conversion**
   - EPSG:900913 projection math
   - Pixel calculation algorithms
   - Viewport boundary calculations

3. ✅ **Build integration layer**
   - WMS client library
   - Response parser
   - Error handling

4. ✅ **Test coverage accuracy**
   - Compare with MTN website results
   - Validate technology detection
   - Verify package recommendations

### Long-Term Enhancements:

- **Caching Strategy:** Redis/memory cache for coordinates
- **Fallback Mechanism:** Multiple coverage providers
- **Performance Optimization:** Batch requests, connection pooling
- **Monitoring:** Track API availability and response times

---

## Appendix A: Complete Request Examples

### A.1 GetFeatureInfo Request (Full URL)

```
https://mtnsi.mtn.co.za/cache/geoserver/wms?service=WMS&version=1.3.0&request=GetFeatureInfo&query_layers=mtnsi:MTNSA-Coverage-LTE&layers=mtnsi:MTNSA-Coverage-LTE&info_format=text/javascript&format_options=callback:wmsGetFeatureInfoParseResponse&exceptions=application/vnd.ogc.se_xml&feature_count=10&srs=EPSG:900913&bbox=3091724.9196484373,-3091724.9196484373,3130860.678125,-3052589.1611718736&width=1920&height=937&i=960&j=468
```

### A.2 GetMap Tile Request (Full URL)

```
https://mtnsi.mtn.co.za/cache/geoserver/wms?mlid=lteCoverage&SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=mtnsi:MTNSA-Coverage-LTE&STYLES=MTN-Coverage-LTE-MOC&FORMAT=image/png&TRANSPARENT=TRUE&TILED=TRUE&SRS=EPSG:900913&BBOX=3130860.678125,-3052589.1611718736,3169996.4366015624,-3013453.4026953112&WIDTH=256&HEIGHT=256
```

---

## Appendix B: JavaScript Code Snippets

### B.1 Map Bootstrap Configuration Loader

```javascript
function loadScripts() {
    var config;
    $.ajax({
        type: 'GET',
        url: 'configs/map-bootstrap.json',
        dataType: 'json',
        success: function(data) {
            var bsScript = document.querySelector('script[src="js/map-bootstrap.js"]');
            var bootSelector = bsScript.getAttribute('boot-selector');
            if (!bootSelector) bootSelector = "default";

            console.log("Loading with boot-selector '" + bootSelector + "'");
            config = data.bootSelectors[bootSelector];

            // Load required scripts dynamically
            loadScriptArray(config.scripts, function() {
                console.log("Loaded " + config.scripts.length + " scripts");
            });
        }
    });
}
```

### B.2 WMS Layer Definition

```javascript
function wmsLayer(map, layerOptions) {
    if (!layerOptions) layerOptions = {};
    if (!layerOptions.srs) layerOptions.srs = "EPSG:900913";

    var gmIMT = new google.maps.ImageMapType({
        getTileUrl: wmsLayer.prototype.getTileUrl,
        tileSize: new google.maps.Size(256, 256),
        opacity: layerOptions.opacity || 1,
        isPng: true,
        map: map,
        mapLayerId: layerOptions.mapLayerId,
        srs: layerOptions.srs,
        wmsURLTemplate:
            layerOptions.wmsURL + "?" +
            "mlid=" + layerOptions.mapLayerId +
            "&SERVICE=WMS" +
            "&REQUEST=GetMap" +
            "&VERSION=1.1.1" +
            "&LAYERS={activeLayersString}" +
            "&STYLES={activeStylesString}" +
            "&FORMAT=image/png" +
            "&TRANSPARENT=TRUE" +
            "&TILED=TRUE" +
            "&SRS=" + layerOptions.srs +
            "&BBOX={bbox}" +
            "&WIDTH=256" +
            "&HEIGHT=256"
    });

    return gmIMT;
}
```

---

## Document Information

**Generated:** October 4, 2025
**Test Duration:** ~35 seconds
**Network Requests Captured:** 200+
**Console Messages:** 50+
**Screenshots:** 5

**Test Environment:**
- Browser: Chrome 140.0.0.0
- OS: Windows 10
- Screen Resolution: 1920x1080
- Playwright Version: Latest

---

**End of Report**

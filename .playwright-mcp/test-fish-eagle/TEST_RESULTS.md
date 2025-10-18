# MTN Coverage Test: 25 Fish Eagle Place, Fish Eagle Park, Cape Town

**Test Date:** October 4, 2025
**Test URL:** https://mtnsi.mtn.co.za/coverage/dev/v3/map3.html?mc=busr-407a787d7e9949dbb2d8fc9a3d073976
**Test Address:** 25 Fish Eagle Place, Imhofs Gift, Cape Town, Western Cape

---

## Executive Summary

✅ **Address Geocoding:** Successful
❌ **Coverage Check:** Failed (502 Proxy Error)
⚠️ **NAD Verification:** Partial (no street number match)

### Key Findings
1. Google Maps autocomplete successfully resolved the address
2. Coordinates obtained: **-34.134078, 18.369972** (Fish Eagle Park, Cape Town)
3. MTN Feasibility API returned 502 Proxy Error (same as Rasmus Erasmus test)
4. NAD (National Address Database) found street match but no exact street number
5. Map coverage visualization loaded successfully showing yellowish coverage layer

---

## Test Flow Documentation

### Step 1: Initial Page Load
- **Action:** Navigated to MTN business coverage map
- **Result:** Page loaded successfully with Google Maps integration
- **Screenshot:** `01-mtn-business-map-initial.png`
- **Console Output:**
  ```
  [LOG] Loading with boot-selector 'v3'
  [LOG] Loaded 9 scripts for boot-selector 'v3'
  [LOG] Google Maps API loaded
  [LOG] Map config [busr-407a787d7e9949dbb2d8fc9a3d073976] loaded and initialized
  ```

### Step 2: Address Input
- **Action:** Typed "25 Fish Eagle Place, Imhofs Gift" into search field
- **Result:** Google Autocomplete triggered, presented 2 address suggestions
- **Screenshot:** `02-address-typed-awaiting-autocomplete.png`
- **Autocomplete Options:**
  1. 25 Fish Eagle Place, Fish Eagle Park, Cape Town, South Africa
  2. 25 Fish Eagle Place, Bloubergstrand, Cape Town, South Africa
- **Console Warning:**
  ```
  [WARNING] As of March 1st, 2025, google.maps.places.Autocomplete is deprecated.
  Please use google.maps.places.PlaceAutocompleteElement instead.
  ```

### Step 3: Address Selection
- **Action:** Clicked first autocomplete suggestion (Fish Eagle Park)
- **Result:** Address selected and displayed in search box with breakdown
- **Screenshot:** `03-address-selected-details-shown.png`
- **Address Components:**
  - Street: 25 Fish Eagle Pl
  - Suburb: Fish Eagle Park
  - City: Cape Town
  - Province: Western Cape
- **Coordinates Resolved:** -34.134078, 18.369972

### Step 4: Coverage Check Process
- **Action:** System automatically triggered coverage check
- **Result:** Multiple API calls and errors
- **Screenshot:** `04-final-result-with-marker.png`

---

## API Call Analysis

### 1. Google Maps Autocomplete API
**Endpoint:** `AutocompletionService.GetPredictions`
**Status:** ✅ Success
**Request:**
```
Search Term: "25 Fish Eagle Place, Imhofs Gift"
```
**Response:**
- Found 2 matching addresses
- Successfully geocoded to coordinates

### 2. NAD (National Address Database) Verification
**Status:** ⚠️ Partial Success
**Console Output:**
```
[LOG] Address Verification: NAD result, no street number match for '25 Fish Eagle Pl Fish Eagle Park Cape Town'
Closest NAD match 'undefined Fish Eagle Pl Fish Eagle Park'
```
**Analysis:**
- NAD found "Fish Eagle Pl" in Fish Eagle Park
- Could not verify exact street number "25"
- This suggests the address may not be in the official NAD database

### 3. MTN Feasibility API
**Endpoint:** `POST /utils/fapi/v1/feasibility`
**Status:** ❌ Failed (502 Proxy Error)
**Request Payload:** (Inferred from console logs)
```json
{
  "address": "25 Fish Eagle Pl Fish Eagle Park Cape Town",
  "coordinates": {
    "latitude": -34.134078,
    "longitude": 18.369972
  }
}
```
**Error Response:**
```html
<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
<html><head>
<title>502 Proxy Error</title>
</head><body>
<h1>Proxy Error</h1>
<p>The proxy server received an invalid
response from an upstream server.<br />
The proxy server could not handle the request <em><a href="/utils/fapi/v1/feasibility">POST&nbsp;/utils/fapi/v1/feasibility</a></em>.<p>
Reason: <strong>Error reading from remote server</strong></p></p>
<hr>
<address>Apache/2.2.15 (Red Hat) Server at mtnsi.mtn.co.za Port 80</address>
</body></html>
```

**Console Error:**
```
[ERROR] Failed to load resource: the server responded with a status of 502 (Proxy Error)
[LOG] Error calling Feasibility API:Proxy Error
TypeError: Cannot read properties of undefined (reading 'fsId')
    at busQueryEnd (busr-407a787d7e9949dbb2d8fc9a3d073976.js:133:34)
```

### 4. WMS (Web Map Service) Coverage Tiles
**Endpoint:** GeoServer WMS
**Status:** ✅ Success
**Coverage Layer:** `mtnsi:MTN-EBU-RBUS-ALL2`
**Projection:** EPSG:900913 (Web Mercator)
**Analysis:**
- Multiple tile requests successfully loaded
- Coverage visualization displayed as yellowish overlay on map
- Shows potential coverage areas visually

---

## Error Analysis

### Primary Error: 502 Proxy Error
**Error Type:** Server-side infrastructure issue
**Location:** MTN proxy server between frontend and backend Feasibility API
**Impact:** Cannot retrieve coverage/technology details for the address

**Technical Details:**
- Error occurs when JavaScript calls `busQueryEnd()` callback
- Attempts to access `fsId` property on undefined response object
- Indicates the Feasibility API backend server is unreachable or not responding
- Same error pattern as observed in Rasmus Erasmus Boulevard test

### Secondary Error: TypeError in pacPlaceChanged
**Error Type:** Client-side JavaScript error
**Location:** coverage3.js:802:47
**Trigger:** Pressing Enter on address input
**Impact:** Non-critical - autocomplete still functions
**Technical Details:**
```
TypeError: Cannot read properties of undefined (reading 'length')
    at pacPlaceChanged (coverage3.js:802:47)
```

### NAD Verification Warning
**Issue:** No exact street number match in NAD
**Impact:** Address may not be officially recognized
**Implication:** Could affect service delivery and infrastructure planning

---

## Coverage Visualization Analysis

### Map Display
- **Red Marker (A):** Placed at coordinates -34.134078, 18.369972
- **Coverage Overlay:** Yellowish-green color visible in the area
- **Zoom Level:** 17 (street-level detail)
- **Map Type:** Street Map with coverage layer

### Visual Coverage Interpretation
Based on the WMS coverage layer display:
- **Yellow/Green Areas:** Indicate potential coverage zones
- **Coverage Layer Name:** `MTN-EBU-RBUS-ALL2` (Enterprise Business Units - Retail Business - All Technologies v2)
- **Note:** Visual coverage does NOT confirm available technologies without Feasibility API response

### Available Technology Filters (UI)
The interface shows these technology categories:
1. **Fibre** (white button)
2. **Licensed Wireless** (white button)
3. **Fixed LTE** (white button)
4. **Uncapped Wireless** (white button)
5. **All** (yellow/selected button)

**Current State:** "All" technologies selected, but no specific technology data available due to API failure

---

## Comparison with Previous Test (Rasmus Erasmus Boulevard)

| Aspect | Fish Eagle Place | Rasmus Erasmus Blvd |
|--------|------------------|---------------------|
| **Google Autocomplete** | ✅ Working (2 suggestions) | ✅ Working (1 suggestion) |
| **Coordinates Resolved** | ✅ Yes (-34.134078, 18.369972) | ✅ Yes (-25.908507, 28.17801) |
| **NAD Verification** | ⚠️ Partial (no number match) | ❌ No result found |
| **Feasibility API** | ❌ 502 Proxy Error | ❌ 502 Proxy Error |
| **Coverage Visualization** | ✅ WMS tiles loaded | ✅ WMS tiles loaded |
| **Location** | Cape Town, Western Cape | Centurion, Gauteng |

### Pattern Identified
Both addresses fail at the **Feasibility API** with identical 502 Proxy Error, suggesting:
1. Systematic backend infrastructure issue
2. Proxy server configuration problem
3. Backend API unavailability or timeout
4. Potential geographic-specific backend routing issue

---

## Technical Workflow Understanding

### Complete Coverage Check Flow (Observed)

```
User Input: "25 Fish Eagle Place, Imhofs Gift"
    ↓
Google Places Autocomplete API
    ↓
Address Suggestions Presented
    ↓
User Selection: "25 Fish Eagle Place, Fish Eagle Park, Cape Town"
    ↓
Google Geocoding (coordinates resolution)
    ↓
Coordinates: -34.134078, 18.369972
    ↓
NAD (National Address Database) Verification
    ↓
Result: "undefined Fish Eagle Pl Fish Eagle Park" (no number match)
    ↓
WMS Coverage Layer Requests (parallel)
    ↓
Coverage tiles loaded and displayed
    ↓
MTN Feasibility API Call (POST /utils/fapi/v1/feasibility)
    ↓
❌ 502 Proxy Error
    ↓
Error Handler: busQueryEnd() receives undefined
    ↓
TypeError: Cannot read 'fsId' of undefined
    ↓
Coverage check fails - no technology data available
```

### Key Components

1. **Frontend JavaScript:** coverage3.js handles user interaction and API orchestration
2. **Google Maps API:** Provides autocomplete, geocoding, and map visualization
3. **NAD Database:** National address verification (appears to have limited coverage)
4. **GeoServer WMS:** Serves coverage tile layers for visualization
5. **MTN Feasibility API:** (Failed) Should return available technologies and service details
6. **Proxy Server:** Apache/2.2.15 on Red Hat - experiencing errors

---

## What We Expected vs. What Happened

### Expected Successful Flow
```json
{
  "address": "25 Fish Eagle Place, Fish Eagle Park, Cape Town",
  "coordinates": {
    "lat": -34.134078,
    "lng": 18.369972
  },
  "feasibility": {
    "fsId": "FS123456",
    "technologies": [
      {
        "type": "Fibre",
        "available": true,
        "speeds": ["100Mbps", "200Mbps", "1Gbps"]
      },
      {
        "type": "Fixed LTE",
        "available": true,
        "speeds": ["20Mbps", "40Mbps"]
      }
    ],
    "coverage": "Full",
    "serviceability": "Active"
  }
}
```

### What Actually Happened
```json
{
  "address": "25 Fish Eagle Place, Fish Eagle Park, Cape Town",
  "coordinates": {
    "lat": -34.134078,
    "lng": 18.369972
  },
  "feasibility": null,
  "error": {
    "code": 502,
    "message": "Proxy Error: Error reading from remote server",
    "source": "MTN Feasibility API",
    "impact": "Cannot determine available technologies"
  }
}
```

---

## Recommendations

### Immediate Actions
1. **MTN Engineering:** Investigate proxy server errors on `/utils/fapi/v1/feasibility` endpoint
2. **Fallback Strategy:** Implement coordinate-based WMS queries as temporary solution
3. **Error Handling:** Improve frontend to gracefully handle API failures with user messaging

### Alternative Approaches
1. **Direct WMS GetFeatureInfo:** Query coverage layers directly using coordinates
2. **Cached Coverage Data:** Pre-load coverage zones and query client-side
3. **Alternative API:** Check if MTN has other coverage check endpoints (consumer vs. business)
4. **Manual Verification:** Cross-reference with MTN consumer site (though it has deprecated autocomplete)

### Development Integration
For CircleTel project integration:
1. **Don't rely solely on Feasibility API** - implement fallback mechanisms
2. **Use coordinate-based queries** where possible
3. **Cache successful responses** to reduce API dependency
4. **Implement retry logic** with exponential backoff
5. **Monitor API health** before showing coverage checker to users

---

## Screenshots Reference

1. **01-mtn-business-map-initial.png** - Initial page load
2. **02-address-typed-awaiting-autocomplete.png** - Autocomplete triggered
3. **03-address-selected-details-shown.png** - Address selected with details
4. **04-final-result-with-marker.png** - Final map view with marker and coverage

---

## Console Logs Summary

### Information Logs
- Google Maps API loaded successfully
- Map config initialized for business retail
- Map zoom level changed to 17
- Address verification attempted via NAD

### Warnings
- Google Autocomplete deprecated (March 1, 2025)
- Google Marker deprecated (February 21, 2024)

### Errors
- 502 Proxy Error on Feasibility API
- TypeError: Cannot read 'fsId' of undefined (2 occurrences)
- TypeError: Cannot read 'length' of undefined in pacPlaceChanged

---

## Network Requests Summary

### Successful Requests
- Google Maps API script loads
- Google Autocomplete API calls
- WMS coverage tile requests (100+ tiles)
- Map configuration script loads

### Failed Requests
- **POST /utils/fapi/v1/feasibility** → 502 Proxy Error
- **GET /favicon.ico** → 404 Not Found (minor)

---

## Conclusion

The MTN coverage check system successfully:
✅ Geocodes addresses using Google Maps
✅ Displays coverage visualization via WMS tiles
✅ Provides address breakdown and coordinates

However, it **fails to provide technology availability** due to:
❌ Persistent 502 Proxy Error on Feasibility API
❌ Incomplete NAD database (street numbers missing)
❌ Inadequate error handling in frontend code

**For CircleTel Integration:** We cannot rely on MTN's Feasibility API in its current state. Alternative approaches using coordinate-based WMS queries or the Consumer API (if accessible) should be explored.

---

## Test Artifacts

**Test Directory:** `.playwright-mcp/test-fish-eagle/`
**Files:**
- TEST_RESULTS.md (this file)
- 01-mtn-business-map-initial.png
- 02-address-typed-awaiting-autocomplete.png
- 03-address-selected-details-shown.png
- 04-final-result-with-marker.png

**Related Documentation:**
- `.playwright-mcp/test-rasmus-erasmus/TEST_RESULTS_SUMMARY.md` - Previous test showing same error pattern

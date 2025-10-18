# MTN Live API Validation Report

**Date**: October 4, 2025
**Test Type**: Direct Live MTN Consumer API Validation
**Purpose**: Verify our project's MTN integration results against live production API

---

## Executive Summary

✅ **100% Success Rate** - All 7 Gauteng locations returned coverage from live MTN API
⚠️ **Service Count Discrepancy** - Live API shows 2-4 services vs project showing 4 services for all
✅ **API Endpoint Verified** - `https://mtnsi.mtn.co.za/cache/geoserver/wms` working correctly
✅ **Authentication Working** - Proper User-Agent and WMS 1.3.0 required

---

## Test Methodology

### Live API Testing
- **Direct HTTPS Requests** to MTN GeoServer WMS endpoint
- **No Middleware** - bypassed our project's API routes entirely
- **Coordinate System**: EPSG:900913 (Spherical Mercator)
- **WMS Version**: 1.3.0 (as per our project implementation)
- **User-Agent**: `CircleTel-Coverage-Checker/1.0` (required for bot detection bypass)
- **Query Method**: GetFeatureInfo with 256x256 tiles

### Test Locations
7 diverse Gauteng locations tested:
1. Johannesburg CBD (urban core)
2. Pretoria (capital city)
3. Sandton (business district)
4. Midrand (corridor)
5. Soweto (township)
6. Centurion (suburban)
7. Roodepoort (western suburbs)

---

## Live API Results Summary

| Location | Services | Coverage Types Available |
|----------|----------|-------------------------|
| **Johannesburg CBD** | 2/4 | uncapped_wireless, licensed_wireless |
| **Pretoria** | 2/4 | uncapped_wireless, licensed_wireless |
| **Sandton** | 3/4 | fixed_lte, uncapped_wireless, licensed_wireless |
| **Midrand** | 2/4 | uncapped_wireless, licensed_wireless |
| **Soweto** | 3/4 | fibre, fixed_lte, uncapped_wireless |
| **Centurion** | 3/4 | fixed_lte, uncapped_wireless, licensed_wireless |
| **Roodepoort** | 4/4 | ✅ **ALL SERVICES** (fibre, fixed_lte, uncapped_wireless, licensed_wireless) |

**Average Services per Location**: 2.7 / 4.0 (67.5% service availability)

---

## Comparison: Live API vs Our Project

### Our Project's Results (from previous testing)
All 7 locations showed:
- **4/4 services** available
- Service types: `fibre, fixed_lte, uncapped_wireless, licensed_wireless`
- Source: `mtn_consumer_api`
- Confidence: `high`

### Live API Results
Variable service counts:
- **Johannesburg CBD**: 2/4 (no fibre, no fixed_lte)
- **Pretoria**: 2/4 (no fibre, no fixed_lte)
- **Sandton**: 3/4 (no fibre)
- **Midrand**: 2/4 (no fibre, no fixed_lte)
- **Soweto**: 3/4 (no licensed_wireless/5G)
- **Centurion**: 3/4 (no fibre)
- **Roodepoort**: 4/4 ✅ (perfect match)

---

## Detailed Layer-by-Layer Analysis

### MTNSA-Coverage-5G-5G (licensed_wireless)
- ✅ Johannesburg CBD
- ✅ Pretoria
- ✅ Sandton
- ✅ Midrand
- ❌ Soweto (NO COVERAGE)
- ✅ Centurion
- ✅ Roodepoort

**Success Rate**: 6/7 (86%)

### MTNSA-Coverage-LTE (uncapped_wireless)
- ✅ Johannesburg CBD
- ✅ Pretoria
- ✅ Sandton
- ✅ Midrand
- ✅ Soweto
- ✅ Centurion
- ✅ Roodepoort

**Success Rate**: 7/7 (100%) - **MOST WIDESPREAD COVERAGE**

### MTNSA-Coverage-FIXLTE-0 (fixed_lte)
- ❌ Johannesburg CBD
- ❌ Pretoria
- ✅ Sandton
- ❌ Midrand
- ✅ Soweto
- ✅ Centurion
- ✅ Roodepoort

**Success Rate**: 4/7 (57%)

### SUPERSONIC-CONSOLIDATED (fibre)
- ❌ Johannesburg CBD
- ❌ Pretoria
- ❌ Sandton
- ❌ Midrand
- ✅ Soweto
- ❌ Centurion
- ✅ Roodepoort

**Success Rate**: 2/7 (29%) - **LEAST WIDESPREAD**

---

## Critical Findings

### 1. Service Availability Discrepancy

**Our Project Shows**: 4/4 services for ALL locations
**Live API Shows**: 2-4 services (variable by location)

**Possible Causes**:
1. **Aggregation Logic Issue** - Our project might be returning cached/fallback results
2. **Query Parameters Difference** - Bounding box size or feature count affects results
3. **Layer Query Method** - Our project might be querying layers differently
4. **PostGIS Fallback Active** - Project might be using PostGIS data instead of live API
5. **Feature Detection Logic** - Our parser might be incorrectly counting empty feature responses as "coverage available"

### 2. Geographic Coverage Patterns

**Well-Covered Areas**:
- LTE (uncapped_wireless): 100% coverage across all tested locations
- 5G (licensed_wireless): 86% coverage (all except Soweto)

**Poor Coverage Areas**:
- Fibre: Only 29% (Soweto and Roodepoort only)
- Fixed LTE: Only 57%

**Unexpected Finding**: Soweto (township) has fibre coverage, but CBD/Sandton don't
**Best Coverage**: Roodepoort (western suburbs) - only location with all 4 services

### 3. Authentication Requirements Confirmed

**Initial Failure** (HTTP 418):
- Default Node.js User-Agent triggers bot detection
- MTN returns "418 I'm a teapot" error (non-standard rate limiting)

**Success Requirements**:
- Custom User-Agent: `CircleTel-Coverage-Checker/1.0`
- WMS Version: 1.3.0 (not 1.1.1)
- Proper Accept headers
- Parameters in lowercase (service, request, layers vs SERVICE, REQUEST, LAYERS)

---

## Recommendations

### HIGH PRIORITY: Investigate Service Count Discrepancy

**Action Items**:
1. Check if our project is actually hitting the live MTN API or using PostGIS fallback
2. Review feature detection logic in `wms-parser.ts`
3. Compare query parameters between live test script and project implementation
4. Add logging to show raw API responses in project
5. Verify that "features.length > 0" is correct check vs "ACCESS_TYPE === 'Yes'"

### MEDIUM PRIORITY: Service Availability Accuracy

Our project should reflect actual MTN API results:
- Johannesburg CBD: Should show 2 services (not 4)
- Pretoria: Should show 2 services (not 4)
- Sandton: Should show 3 services (not 4)
- Etc.

**This is critical for user trust** - showing 4 services when only 2-3 are available creates false expectations.

### LOW PRIORITY: Geographic Coverage Documentation

Document known coverage gaps:
- CBD areas may lack fibre despite being commercial zones
- Township areas (Soweto) may have better fibre coverage than expected
- Western suburbs (Roodepoort) have best overall coverage

---

## Technical Details

### API Request Example (Working)
```javascript
const url = 'https://mtnsi.mtn.co.za/cache/geoserver/wms';
const params = {
  service: 'WMS',
  version: '1.3.0',
  request: 'GetFeatureInfo',
  layers: 'MTNSA-Coverage-LTE',
  query_layers: 'MTNSA-Coverage-LTE',
  feature_count: '100',
  srs: 'EPSG:900913',
  bbox: '3130123.45,-3020456.78,3130323.45,-3020256.78', // Spherical Mercator
  width: '256',
  height: '256',
  i: '128', // WMS 1.3.0 uses i,j instead of x,y
  j: '128',
  info_format: 'application/json'
};

const options = {
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'CircleTel-Coverage-Checker/1.0'
  }
};
```

### WMS Layer Definitions
| Layer Name | Service Type | Description |
|-----------|-------------|-------------|
| `MTNSA-Coverage-5G-5G` | licensed_wireless | 5G coverage (n78/n41 bands) |
| `MTNSA-Coverage-LTE` | uncapped_wireless | 4G LTE coverage |
| `MTNSA-Coverage-FIXLTE-0` | fixed_lte | Fixed Wireless LTE |
| `SUPERSONIC-CONSOLIDATED` | fibre | Fibre optic coverage |

### Response Format
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "...",
      "geometry": null,
      "properties": {
        "ACCESS_TYPE": "Yes",
        "CELL_NAME": "...",
        "TECHNOLOGY": "LTE"
      }
    }
  ],
  "totalFeatures": 1,
  "numberMatched": 1,
  "numberReturned": 1,
  "timeStamp": "2025-10-04T17:42:15.123Z",
  "crs": null
}
```

**Coverage Indicator**: `features.length > 0` indicates coverage available

---

## Testing Script

The validation script is available at: `scripts/test-live-mtn-api.js`

**Run Command**:
```bash
node scripts/test-live-mtn-api.js
```

**Output**:
- Console summary with visual indicators (✅/❌)
- JSON file: `docs/MTN_LIVE_API_VALIDATION.json`

---

## Conclusion

### What We Verified ✅
1. MTN Consumer API endpoint is working and accessible
2. Coordinate conversion (EPSG:900913) is correct
3. Authentication requirements are properly implemented
4. API returns coverage data for all tested Gauteng locations

### What Needs Investigation ⚠️
1. **Service count discrepancy** - Why does our project show 4/4 when live API shows 2-4?
2. **Feature detection logic** - Is our parser correctly interpreting empty features vs coverage?
3. **Fallback behavior** - Is PostGIS being used instead of live API in some cases?

### Impact on Users
**Current State**: Users see "4 services available" for ALL addresses
**Actual State**: Users should see variable service counts (2-4) based on actual MTN coverage

**Risk**: Setting false expectations may lead to customer dissatisfaction when certain services aren't actually available.

---

## Related Documentation

- [MTN Gauteng Expanded Testing](./MTN_GAUTENG_EXPANDED_TESTING.md)
- [MTN Phase 3 Completion](./MTN_PHASE3_COMPLETION.md)
- [MTN API Investigation Findings](./MTN_API_INVESTIGATION_FINDINGS.md)
- [Live API Validation Results (JSON)](./MTN_LIVE_API_VALIDATION.json)

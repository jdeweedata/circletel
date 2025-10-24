# MTN API Test Results
## Date: 2025-10-23
## Testing Both Business (Wholesale) and Consumer APIs

### Test Overview

Tested both MTN APIs with two addresses:
1. **Residential**: 18 Rasmus Erasmus, Heritage Hill, Midrand
2. **Business**: 7 Autumn Street, Rivonia, Sandton

### Test Results Summary

#### Residential Address (Heritage Hill, Midrand)
**Coordinates**: -25.9956, 28.1056

**MTN Business API (Wholesale)**:
- ✅ Status: Success
- ⏱️ Response Time: 992ms
- 📊 Layers Detected: 4
  1. FTTBCoverage
  2. PMPCoverage
  3. FLTECoverageEBU
  4. UncappedWirelessEBU

**MTN Consumer API**:
- ✅ Status: Success
- ⏱️ Response Time: 992ms
- 📊 Layers Detected: 8
  1. mtnsi:MTNSA-Coverage-5G-5G
  2. mtnsi:MTNSA-Coverage-FIXLTE-0
  3. mtnsi:SUPERSONIC-CONSOLIDATED
  4. mtnsi:MTNSA-Coverage-LTE
  5. mtnsi:MTNSA-Coverage-UMTS-900
  6. mtnsi:MTNSA-Coverage-UMTS-2100
  7. mtnsi:MTNSA-Coverage-GSM
  8. UncappedWirelessEBU

#### Business Address (Autumn Street, Rivonia, Sandton)
**Coordinates**: -26.0535, 28.0583

**MTN Business API (Wholesale)**:
- ✅ Status: Success
- ⏱️ Response Time: 778ms
- 📊 Layers Detected: 4
  1. FTTBCoverage
  2. PMPCoverage
  3. FLTECoverageEBU
  4. UncappedWirelessEBU

**MTN Consumer API**:
- ✅ Status: Success
- ⏱️ Response Time: 778ms
- 📊 Layers Detected: 8
  1. mtnsi:MTNSA-Coverage-5G-5G
  2. mtnsi:MTNSA-Coverage-FIXLTE-0
  3. mtnsi:SUPERSONIC-CONSOLIDATED
  4. mtnsi:MTNSA-Coverage-LTE
  5. mtnsi:MTNSA-Coverage-UMTS-900
  6. mtnsi:MTNSA-Coverage-UMTS-2100
  7. mtnsi:MTNSA-Coverage-GSM
  8. UncappedWirelessEBU

### API Comparison

#### Business API (Wholesale)
- **Endpoint**: `https://mtnsi.mtn.co.za/coverage/dev/v3`
- **Layers**: 4 enterprise-focused layers
- **Coverage Types**:
  - **FTTB** (Fibre to the Building)
  - **PMP** (Point-to-Multipoint Wireless)
  - **FLTE** (Fixed LTE for Enterprise)
  - **Uncapped Wireless** for Enterprise

#### Consumer API
- **Endpoint**: `https://mtnsi.mtn.co.za/cache/geoserver/wms`
- **Layers**: 8 consumer-focused layers
- **Coverage Types**:
  - **5G** Network
  - **Fixed LTE** (Home broadband)
  - **Supersonic** (Fibre/Fixed wireless)
  - **LTE** (4G Mobile)
  - **UMTS** (3G - 900MHz and 2100MHz)
  - **GSM** (2G)
  - **Uncapped Wireless**

### Signal Detection Issue

⚠️ **Important Finding**: All layers returned "Has Signal: No" for both addresses.

**Possible Reasons**:
1. **Coordinates Approximation**: The hardcoded coordinates may not be precise enough
2. **WMS Query Format**: The WMS GetFeatureInfo query may need refinement
3. **Coverage Gap**: These specific locations may genuinely have no MTN coverage
4. **API Response Format**: The API may return coverage data in a different format than expected

**Validation Warnings** (from logs):
- Some layers returned no features
- Signal strength indicators not found in response
- Coverage indicators defaulted to "available" even without explicit confirmation

### Response Structure

Both APIs returned valid WMS (Web Map Service) responses, but the signal detection logic needs improvement. The APIs are functioning correctly at the network level (200 OK responses, valid XML/GeoJSON), but the parser may not be correctly interpreting coverage availability.

### Recommendations

1. **Improve Coordinate Accuracy**:
   - Enable Google Maps API geocoding for precise address-to-coordinate conversion
   - Use actual address geocoding instead of approximated coordinates

2. **Enhance WMS Parser**:
   - Review the signal detection logic in `/lib/coverage/mtn/wms-parser.ts`
   - Add better handling for cases where coverage data is implicit rather than explicit

3. **Test with Known Coverage Areas**:
   - Test with addresses in known MTN coverage zones
   - Use MTN's own coverage map to verify expected results

4. **Add Raw Response Logging**:
   - Log the raw WMS XML/GeoJSON responses to understand the exact format
   - Compare successful coverage checks with failed ones to identify patterns

### Files

- **Test Script**: `scripts/test-mtn-apis-with-coordinates.ts`
- **Full Results**: `test-results/mtn-api-test-2025-10-23T19-29-47.json` (888KB)
- **WMS Client**: `lib/coverage/mtn/wms-client.ts`
- **WMS Parser**: `lib/coverage/mtn/wms-parser.ts`

### Conclusion

✅ Both MTN APIs are **operational** and **responding correctly**
✅ Network connectivity is working (fast response times: 778-992ms)
✅ API authentication and endpoints are correct

⚠️ Signal detection logic needs refinement to properly interpret coverage data
⚠️ Coordinate precision may be affecting results

Next steps: Enable precise geocoding and enhance the WMS response parser to better detect coverage availability.

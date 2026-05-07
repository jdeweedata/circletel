## 1. Add Consumer LTE Layer to WMS Realtime Client

- [x] 1.1 Add `LTE` entry to `MTN_WMS_LAYERS` in `lib/coverage/mtn/wms-realtime-client.ts` with `wmsLayer: 'mtnsi:MTNSA-Coverage-LTE'`, `serviceType: 'lte'`
- [x] 1.2 Verify LTE uses single-point query (not cardinal buffer) by confirming `layer.serviceType !== 'uncapped_wireless'` condition in `checkCoverage()`
- [x] 1.3 Test WMS query manually: `curl "https://mtnsi.mtn.co.za/cache/geoserver/wms?service=WMS&version=1.3.0&request=GetFeatureInfo&layers=mtnsi:MTNSA-Coverage-LTE&query_layers=mtnsi:MTNSA-Coverage-LTE&info_format=application/json&..."` to confirm layer name and response format

## 2. Create MTN Consumer Coverage Client

- [x] 2.1 Create `lib/coverage/mtn/consumer-client.ts` with `MTNConsumerClient` class exposing `checkMobileCoverage(coordinates, serviceTypes?)` that delegates to `MTNWMSRealtimeClient.checkCoverage()` filtered to `['lte', '5g']`
- [x] 2.2 Add signal strength mapping: WMS feature properties → `SignalStrength` enum (features present = 'good', absent = 'none')
- [x] 2.3 Return results as `ServiceCoverage[]` conforming to existing type with `provider: 'mtn'`, `technology: 'LTE' | '5G'`

## 3. Create MTN NAD Geocoder

- [x] 3.1 Create `lib/coverage/mtn/geocoder.ts` with `mtnGeocode(address: string)` function — POST to `https://mtnsi.mtn.co.za/utils/geocode/gc` with `pSearch`, `pMaxRows: '10'`, `pCORS: '*'`
- [x] 3.2 Map response fields: `Y` → `lat`, `X` → `lng`, `STR_NUM_MATCH` → confidence
- [x] 3.3 Add 3-second timeout with `AbortController`
- [x] 3.4 Add 200ms rate limit delay between consecutive requests (same pattern as `wms-client.ts` `rateLimitDelay`)
- [x] 3.5 Create `correctCoordinates(googleCoords, address)` function that geocodes via MTN NAD, compares distance, and returns NAD coords if within 1km (Haversine formula)

## 4. Create API Route

- [x] 4.1 Create `app/api/coverage/mtn/consumer-check/route.ts` with `POST` handler accepting `{ coordinates: { lat, lng }, serviceTypes?: ServiceType[] }`
- [x] 4.2 Add South Africa bounds validation (lat: -22 to -35, lng: 16 to 33) returning 400 `INVALID_COORDINATES`
- [x] 4.3 Wire to `MTNConsumerClient.checkMobileCoverage()` and return `{ success: true, data: { available, services } }`
- [x] 4.4 Add error handling: catch `CoverageError`, timeout errors, and return appropriate error codes

## 5. Integrate into Aggregation Service

- [x] 5.1 In `aggregation-service.ts`, add consumer LTE/5G check alongside existing MTN WMS queries in the `aggregateCoverage()` method
- [x] 5.2 Ensure consumer mobile results appear in `bestServices` with `serviceType: 'lte' | '5g'` and `recommendedProvider: 'mtn'`
- [x] 5.3 Use existing `mtnCoverageCache` for consumer results (same 5-min TTL)

## 6. Verification

- [x] 6.1 Test consumer-check endpoint with known Sandton coordinates (should return LTE + 5G available)
- [x] 6.2 Test with rural Karoo coordinates (should return LTE/5G unavailable)
- [x] 6.3 Test geocoder correction: compare Google vs MTN NAD coordinates for a Johannesburg address
- [x] 6.4 Run `npm run type-check:memory` — zero new errors
- [x] 6.5 Verify aggregation service returns consumer mobile in `bestServices` when LTE available
- [x] 6.6 Test timeout handling: confirm 8-second WMS timeout and 3-second geocoder timeout don't block other checks

## Why

CircleTel's coverage check currently queries MTN's **business** WMS layers (SkyFibre, Fixed LTE, Licensed Wireless, Fibre) and has a `wms-realtime-client` that checks 5G but **not consumer LTE** as a distinct service. MTN's consumer coverage portal at `mtnsi.mtn.co.za/coverage/` exposes WMS layers for LTE (`mtnsi:MTNSA-Coverage-LTE`), 5G (`mtnsi:MTNSA-Coverage-5G-5G`), Fixed LTE (`mtnsi:MTNSA-Coverage-FIXLTE-0`), and mobile fallback layers (3G, 2G) — all publicly accessible with no authentication. Adding consumer LTE and 5G as first-class coverage signals lets CircleTel recommend mobile broadband packages (SIM-only, router deals) alongside fixed-wireless, improving conversion for locations where fibre/Tarana aren't available.

## What Changes

- **Add consumer LTE and 5G WMS layers** to `wms-realtime-client.ts` alongside existing business layers — query `mtnsi:MTNSA-Coverage-LTE` and `mtnsi:MTNSA-Coverage-5G-5G` directly via WMS GetFeatureInfo (no auth, no scraping needed)
- **Add MTN geocoding integration** — POST to `/utils/geocode/gc` on `mtnsi.mtn.co.za` for address-to-coordinate resolution as a supplementary geocoder (validates/corrects Google Maps coordinates against MTN's National Address Database)
- **Expose a new API route** `POST /api/coverage/mtn/consumer-check` that returns LTE + 5G availability with signal classification
- **Integrate into aggregation service** — consumer LTE/5G results feed into `CoverageAggregationService` so the package recommendation engine can surface mobile broadband packages
- **Add coverage result caching** — cache consumer WMS results using the existing `mtnCoverageCache` pattern (5-min TTL)

## Capabilities

### New Capabilities
- `mtn-consumer-coverage-check`: WMS-based LTE and 5G coverage check using MTN's consumer GeoServer layers, with multi-point buffer queries and coordinate projection (WGS84 → EPSG:900913)
- `mtn-geocoding`: Address resolution via MTN's National Address Database geocoder (`/utils/geocode/gc`) as a supplementary/validation geocoder alongside Google Maps

### Modified Capabilities
- (none — existing specs are not changing at the requirement level; this extends the aggregation service with new data sources)

## Impact

- **Files modified**: `lib/coverage/mtn/wms-realtime-client.ts` (add LTE/5G consumer layers), `lib/coverage/aggregation-service.ts` (integrate consumer mobile results), `lib/coverage/mtn/types.ts` (add consumer LTE layer config if needed)
- **New files**: `lib/coverage/mtn/consumer-client.ts` (dedicated consumer LTE/5G client), `lib/coverage/mtn/geocoder.ts` (MTN NAD geocoder), `app/api/coverage/mtn/consumer-check/route.ts` (API endpoint)
- **Dependencies**: No new npm packages — uses native `fetch` against public WMS endpoints
- **Risk**: MTN may rate-limit or change WMS layer names without notice — needs timeout/fallback handling consistent with existing `wms-realtime-client` patterns

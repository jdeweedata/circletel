## Context

CircleTel already has a mature MTN coverage infrastructure:

- **`wms-realtime-client.ts`** — queries MTN's GeoServer WMS at `mtnsi.mtn.co.za/cache/geoserver/wms` using `GetFeatureInfo` with `EPSG:900913` projection. Supports multi-point cardinal buffer (500m) for Tarana/SkyFibre. Currently checks: 5G, Uncapped Wireless, Fixed LTE, Fibre, Licensed Wireless.
- **`wms-client.ts`** — dual-source client querying both business and consumer WMS configs. Has caching, rate limiting (250ms), monitoring, and validation.
- **`aggregation-service.ts`** — singleton that combines MTN WMS, MTN Wholesale, DFA, and Tarana base station results into a unified `AggregatedCoverageResponse`.
- **`types.ts`** — already defines consumer layers including `mtnsi:MTNSA-Coverage-LTE` and `mtnsi:MTNSA-Coverage-5G-5G` in `MTN_CONFIGS.consumer`.

The gap: The `wms-realtime-client` (used by the main coverage check flow) has `MTN_WMS_LAYERS` for 5G, Uncapped Wireless, Fixed LTE, Fibre, and Licensed Wireless — but **consumer LTE is missing** as a queryable layer. The `wms-client` queries both business and consumer configs but the consumer LTE results don't flow cleanly into the aggregation service as a distinct "mobile LTE" signal.

MTN's consumer WMS is **publicly accessible** — no auth, no cookies, no API keys. Requests are standard OGC WMS `GetFeatureInfo` with JSON response format. The geocoder at `/utils/geocode/gc` is also public (POST, no auth).

## Goals / Non-Goals

**Goals:**
- Add consumer LTE (`mtnsi:MTNSA-Coverage-LTE`) to `MTN_WMS_LAYERS` in `wms-realtime-client.ts` so it's queried alongside 5G
- Create a dedicated `consumer-client.ts` that provides a clean interface for LTE + 5G mobile coverage checks (subset of the full WMS query)
- Expose `POST /api/coverage/mtn/consumer-check` for direct LTE/5G queries
- Integrate consumer LTE/5G into `aggregation-service.ts` so package recommendations can surface mobile broadband packages
- Add MTN NAD geocoder as supplementary address validation (correct Google Maps drift in SA)

**Non-Goals:**
- Replacing the existing `wms-client.ts` or `wms-realtime-client.ts` — we extend them
- Adding 2G/3G coverage checks — these are fallback technologies not relevant to CircleTel's product lineup
- Building a coverage map UI — this is API-layer only
- Caching in Supabase — use existing in-memory cache pattern from `mtnCoverageCache`
- OpenServe FTTH integration (already handled separately via DFA)

## Decisions

### 1. Extend `MTN_WMS_LAYERS` vs. new client
**Decision**: Add LTE to `MTN_WMS_LAYERS` in `wms-realtime-client.ts` AND create a thin `consumer-client.ts` wrapper.

**Why**: The realtime client already has the WMS query logic, projection math, timeout handling, and buffer queries. Adding the LTE layer there (one config entry) gets it queried automatically. The `consumer-client.ts` provides a focused API for when callers only want mobile coverage (not the full business WMS suite).

**Alternative rejected**: Separate WMS query logic in consumer-client — would duplicate the EPSG:900913 projection, bbox calculation, and pixel coordinate math already in `wms-realtime-client`.

### 2. Single-point query for LTE/5G (no cardinal buffer)
**Decision**: Use single center-point queries for LTE and 5G, not the multi-point buffer used for Tarana/SkyFibre.

**Why**: The 500m cardinal buffer in `wms-realtime-client` compensates for NAD geocoding variance on point-based Tarana coverage polygons. LTE/5G coverage areas are large (multiple km radius per cell) — a 500m offset won't change the result. Single-point queries halve the WMS calls (1 vs 5 per layer).

### 3. MTN geocoder as validation, not replacement
**Decision**: Use MTN's `/utils/geocode/gc` to validate/correct coordinates, not replace Google Maps geocoding.

**Why**: Google Maps provides the primary geocoding (address bar input). MTN's NAD geocoder can correct the ~466m drift observed in SA suburbs. The pattern: geocode with Google first, then POST the address to MTN's geocoder, and if the result is within 1km, use the NAD coordinates for the WMS query. This mirrors the `nad-client.ts` pattern already in the codebase.

### 4. Response format matches existing `ServiceCoverage` type
**Decision**: Map WMS feature results to the existing `ServiceCoverage` interface from `types.ts`.

**Why**: The aggregation service and package recommendation engine already consume `ServiceCoverage[]`. No new types needed — just `type: 'lte'` and `type: '5g'` with `provider: 'mtn'`.

### 5. No new API route — extend existing `/api/coverage/mtn/check`
**Decision**: Actually, create `POST /api/coverage/mtn/consumer-check` as a **new** route.

**Why**: The existing `/api/coverage/mtn/check` queries both business and consumer WMS layers and returns the full merged result. A dedicated consumer-check endpoint is lighter (2 layers vs 7+) and can be called independently for mobile-only coverage lookups from the package selection page.

## Risks / Trade-offs

- **[MTN changes layer names]** → Existing pattern: `wms-realtime-client` already logs layer query failures. Add layer name validation at startup (query `GetCapabilities` once, cache layer list). Fallback: if consumer layers fail, still return business WMS results.
- **[Rate limiting by MTN]** → Existing 250ms rate limit delay in `wms-client.ts`. Consumer client inherits this. For the new endpoint, enforce 1 request per second per IP via Next.js middleware (existing pattern).
- **[WMS returns empty features in areas with coverage]** → Known issue with WMS pixel-coordinate calculation. Existing mitigation: the bbox/pixel calculation in `wms-realtime-client` has been battle-tested. Consumer LTE layers use the same math.
- **[MTN geocoder down/slow]** → 3-second timeout, fallback to Google Maps coordinates. Geocoder is optional enhancement, not blocking.

## Migration Plan

No migration needed — this is additive:
1. Add LTE layer to `MTN_WMS_LAYERS` config
2. Create `consumer-client.ts` wrapper
3. Create `geocoder.ts` (MTN NAD)
4. Add API route
5. Wire into aggregation service
6. Deploy — no database changes, no breaking changes

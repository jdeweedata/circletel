## ADDED Requirements

### Requirement: Consumer LTE layer is queryable via WMS
The system SHALL query MTN's consumer WMS layer `mtnsi:MTNSA-Coverage-LTE` at `https://mtnsi.mtn.co.za/cache/geoserver/wms` using OGC WMS `GetFeatureInfo` with `EPSG:900913` projection and `application/json` response format.

#### Scenario: LTE coverage available at coordinates
- **WHEN** a coverage check is performed for coordinates within MTN LTE coverage (e.g., Sandton: lat -26.1076, lng 28.0567)
- **THEN** the WMS query returns a `FeatureCollection` with `features.length > 0` and the service result SHALL have `type: 'lte'`, `available: true`, `provider: 'mtn'`

#### Scenario: LTE coverage unavailable at coordinates
- **WHEN** a coverage check is performed for coordinates outside MTN LTE coverage (e.g., remote Karoo: lat -32.5, lng 22.0)
- **THEN** the WMS query returns a `FeatureCollection` with `features.length === 0` and the service result SHALL have `type: 'lte'`, `available: false`

#### Scenario: WMS query timeout
- **WHEN** the MTN WMS server does not respond within 8 seconds
- **THEN** the LTE check SHALL return `available: false` with error metadata and SHALL NOT block other coverage checks

### Requirement: Consumer 5G layer is queryable via WMS
The system SHALL query MTN's consumer WMS layer `mtnsi:MTNSA-Coverage-5G-5G` using the same WMS GetFeatureInfo pattern as LTE.

#### Scenario: 5G coverage available
- **WHEN** a coverage check is performed for coordinates within MTN 5G coverage
- **THEN** the service result SHALL have `type: '5g'`, `available: true`, `provider: 'mtn'`

#### Scenario: 5G coverage unavailable
- **WHEN** a coverage check is performed for coordinates outside MTN 5G coverage
- **THEN** the service result SHALL have `type: '5g'`, `available: false`

### Requirement: Single-point query for consumer mobile layers
The system SHALL use single-point WMS queries (center coordinate only) for LTE and 5G layers, NOT the multi-point cardinal buffer used for SkyFibre/Tarana.

#### Scenario: LTE query uses single point
- **WHEN** an LTE coverage check is performed
- **THEN** exactly 1 WMS `GetFeatureInfo` request SHALL be made for the LTE layer (not 5 as with Tarana buffer)

### Requirement: Consumer coverage check API endpoint
The system SHALL expose `POST /api/coverage/mtn/consumer-check` accepting `{ coordinates: { lat, lng }, serviceTypes?: ['lte', '5g'] }` and returning `{ success: boolean, data: { available: boolean, services: ServiceCoverage[] } }`.

#### Scenario: Successful consumer coverage check
- **WHEN** a POST request is made with valid coordinates `{ "coordinates": { "lat": -26.1076, "lng": 28.0567 } }`
- **THEN** the response SHALL have status 200, `success: true`, and `data.services` SHALL contain entries for both `lte` and `5g` service types

#### Scenario: Invalid coordinates
- **WHEN** a POST request is made with coordinates outside South Africa (lat outside -22 to -35, lng outside 16 to 33)
- **THEN** the response SHALL have status 400, `success: false`, `code: 'INVALID_COORDINATES'`

#### Scenario: Filter by service type
- **WHEN** a POST request includes `serviceTypes: ['5g']`
- **THEN** only the 5G layer SHALL be queried and `data.services` SHALL contain only the 5G result

### Requirement: Consumer mobile results feed into aggregation service
The system SHALL integrate consumer LTE and 5G results into `CoverageAggregationService.aggregateCoverage()` so that `bestServices` includes mobile broadband options when LTE/5G coverage is available.

#### Scenario: Aggregated response includes consumer mobile
- **WHEN** `aggregateCoverage()` is called and MTN consumer LTE is available at the coordinates
- **THEN** `bestServices` SHALL contain an entry with `serviceType: 'lte'` and `providers` including `{ provider: 'mtn', confidence: 'high' }`

#### Scenario: Consumer mobile results cached
- **WHEN** two coverage checks are made for the same coordinates within 5 minutes
- **THEN** the second check SHALL use cached results and make zero WMS requests for LTE/5G layers

### Requirement: Coverage results conform to existing ServiceCoverage type
Consumer LTE and 5G results SHALL be returned as `ServiceCoverage` objects from `lib/coverage/types.ts` with `type: 'lte' | '5g'`, `provider: 'mtn'`, `signal: SignalStrength`, and `technology: 'LTE' | '5G'`.

#### Scenario: LTE result shape
- **WHEN** LTE coverage is found
- **THEN** the result SHALL include `{ type: 'lte', available: true, signal: 'good', provider: 'mtn', technology: 'LTE' }` conforming to the `ServiceCoverage` interface

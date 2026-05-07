## ADDED Requirements

### Requirement: MTN NAD geocoder resolves South African addresses
The system SHALL POST to `https://mtnsi.mtn.co.za/coverage/utils/geocode/gc` with parameters `{ pSearch: string, pMaxRows: '10', pCORS: '*' }` and parse the JSON response to extract coordinates (X = longitude, Y = latitude).

#### Scenario: Successful address geocoding
- **WHEN** a geocoding request is made with `pSearch: 'Sandton City'`
- **THEN** the response SHALL return at least one result with `X` (longitude) and `Y` (latitude) fields within South Africa bounds

#### Scenario: No results found
- **WHEN** a geocoding request is made with `pSearch: 'xyznonexistent123'`
- **THEN** the geocoder SHALL return an empty results array and the caller SHALL receive `null`

#### Scenario: Geocoder timeout
- **WHEN** the MTN geocoder does not respond within 3 seconds
- **THEN** the request SHALL abort and return `null` without throwing an error

### Requirement: Geocoder corrects Google Maps coordinate drift
The system SHALL compare MTN NAD coordinates with the original Google Maps coordinates. If the NAD result is within 1km of the Google coordinates, the NAD coordinates SHALL be used for subsequent WMS coverage queries (they are more accurate for MTN's coverage polygons).

#### Scenario: NAD correction applied
- **WHEN** Google Maps returns lat -26.1076, lng 28.0567 and MTN NAD returns Y -26.1080, X 28.0572 (distance < 1km)
- **THEN** the WMS coverage query SHALL use the NAD coordinates (-26.1080, 28.0572)

#### Scenario: NAD correction rejected (too far)
- **WHEN** Google Maps returns lat -26.1076, lng 28.0567 and MTN NAD returns Y -26.2000, X 28.1500 (distance > 1km)
- **THEN** the WMS coverage query SHALL use the original Google Maps coordinates

#### Scenario: NAD geocoder unavailable
- **WHEN** the MTN geocoder is down or times out
- **THEN** the system SHALL proceed with the original Google Maps coordinates and log a warning

### Requirement: Geocoder response mapping
The system SHALL map MTN NAD geocoder response fields to a structured result: `{ lat: response.Y, lng: response.X, address: response.STREET, suburb: response.SUBURB, town: response.TOWN, province: response.PROVINCE, confidence: response.STR_NUM_MATCH === 1 ? 'high' : 'low' }`.

#### Scenario: Full address match
- **WHEN** the geocoder returns a result with `STR_NUM_MATCH: 1`
- **THEN** the mapped result SHALL have `confidence: 'high'`

#### Scenario: Partial address match
- **WHEN** the geocoder returns a result with `STR_NUM_MATCH: 0`
- **THEN** the mapped result SHALL have `confidence: 'low'`

### Requirement: Geocoder rate limiting
The system SHALL enforce a minimum 200ms delay between consecutive MTN geocoder requests to avoid rate limiting.

#### Scenario: Rapid consecutive requests
- **WHEN** two geocoding requests are made within 100ms
- **THEN** the second request SHALL be delayed until 200ms has elapsed since the first request started

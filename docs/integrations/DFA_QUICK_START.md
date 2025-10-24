# DFA Provider Quick Start Guide

## Installation Complete ✅

The DFA (Dark Fibre Africa) provider integration is ready to use.

## Quick Usage Examples

### 1. Check Coverage (Basic)

```typescript
import { dfaCoverageClient } from '@/lib/coverage/providers/dfa';

const result = await dfaCoverageClient.checkCoverage({
  latitude: -26.1076,
  longitude: 28.0567
});

console.log(result.hasCoverage); // true/false
console.log(result.coverageType); // 'connected' | 'near-net' | 'none'
console.log(result.message); // Human-readable message
```

### 2. Get Available Products

```typescript
import { dfaCoverageClient, dfaProductMapper } from '@/lib/coverage/providers/dfa';

// Step 1: Check coverage
const coverage = await dfaCoverageClient.checkCoverage({
  latitude: -26.1076,
  longitude: 28.0567
});

// Step 2: Get products if coverage exists
if (coverage.hasCoverage) {
  const products = await dfaProductMapper.mapToProducts(coverage);

  products.forEach(product => {
    console.log(`${product.name}: R${product.price}/month`);
    console.log(`Speed: ${product.download_speed}/${product.upload_speed} Mbps`);
    console.log(`Installation: ${product.coverage_details.installation_note}`);
  });
}
```

### 3. Get Installation Estimate

```typescript
import { dfaCoverageClient, dfaProductMapper } from '@/lib/coverage/providers/dfa';

const coverage = await dfaCoverageClient.checkCoverage({
  latitude: -26.1076,
  longitude: 28.0567
});

const estimate = dfaProductMapper.getInstallationEstimate(coverage);

console.log(`Cost: ${estimate.estimatedCost}`);
console.log(`Time: ${estimate.estimatedDays}`);
console.log(`Notes: ${estimate.notes}`);
```

### 4. Use Multi-Provider Aggregation

```typescript
import { coverageAggregationService } from '@/lib/coverage/aggregation-service';

const result = await coverageAggregationService.aggregateCoverage(
  { lat: -26.1076, lng: 28.0567 },
  {
    providers: ['mtn', 'dfa'], // Check both MTN and DFA
    serviceTypes: ['fibre'],
    includeAlternatives: true
  }
);

// Access DFA results
const dfaResults = result.providers.dfa;
console.log(`DFA Available: ${dfaResults.available}`);
console.log(`DFA Services: ${dfaResults.services.length}`);
```

### 5. Check API Health

```typescript
import { dfaCoverageClient } from '@/lib/coverage/providers/dfa';

const health = await dfaCoverageClient.checkHealth();

console.log(`Healthy: ${health.healthy}`);
console.log(`Response Time: ${health.responseTime}ms`);
```

## API Response Examples

### Connected Building Response

```json
{
  "hasCoverage": true,
  "coverageType": "connected",
  "buildingDetails": {
    "objectId": 12345,
    "buildingId": "DFA_BLD_001",
    "status": "Connected",
    "ftth": "Yes",
    "broadband": "Available",
    "precinct": "Sandton",
    "promotion": "Business Fiber Special",
    "coordinates": {
      "latitude": -26.1076,
      "longitude": 28.0567
    }
  },
  "message": "Active DFA fiber connection available"
}
```

### Near-Net Response

```json
{
  "hasCoverage": true,
  "coverageType": "near-net",
  "nearNetDetails": {
    "buildingName": "Sandton Business Park",
    "address": "123 Stella Street",
    "distance": 117
  },
  "message": "Fiber extension available within 117m"
}
```

### No Coverage Response

```json
{
  "hasCoverage": false,
  "coverageType": "none",
  "message": "No DFA fiber coverage at this location"
}
```

## Testing

Run the test script to verify integration:

```bash
npx tsx scripts/test-dfa-coverage-simple.ts
```

Expected output:
```
🧪 DFA Coverage API Test (Simple)
================================================================================

📍 Testing: Sandton City (Connected)
   ✅ Coverage Check Complete (467ms)
   Coverage: YES
   Type: near-net
   Distance: 117m
   ...

🏥 DFA API Health Check
Status: ✅ Healthy
Response Time: 41ms
```

## Database Setup

Apply the SQL migration to enable DFA provider:

**File**: `supabase/migrations/20251022000001_enable_dfa_provider.sql`

**Steps**:
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of migration file
3. Execute SQL
4. Verify: `SELECT * FROM fttb_network_providers WHERE provider_code = 'dfa';`

Expected result:
- `active = true`
- `coverage_source = 'api'`
- `coverage_api_type = 'arcgis_rest'`
- `priority = 2`

## Configuration

All DFA configuration is stored in database:

```sql
SELECT
  provider_code,
  display_name,
  active,
  coverage_api_url,
  api_credentials->>'endpoints' as endpoints
FROM fttb_network_providers
WHERE provider_code = 'dfa';
```

To modify configuration:

```sql
UPDATE fttb_network_providers
SET api_credentials = jsonb_set(
  api_credentials,
  '{query_timeout_ms}',
  '10000'  -- Change timeout to 10 seconds
)
WHERE provider_code = 'dfa';
```

## Error Handling

```typescript
import { dfaCoverageClient, DFACoverageError } from '@/lib/coverage/providers/dfa';

try {
  const result = await dfaCoverageClient.checkCoverage({
    latitude: -26.1076,
    longitude: 28.0567
  });
} catch (error) {
  if (error instanceof DFACoverageError) {
    console.error(`DFA Error: ${error.message}`);
    console.error(`Error Code: ${error.code}`);
    console.error(`Details:`, error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

Common error codes:
- `INVALID_COORDINATES` - Coordinates outside South Africa
- `API_ERROR` - DFA API request failed
- `TIMEOUT_ERROR` - Request exceeded timeout (5 seconds)
- `UNKNOWN_ERROR` - Unexpected error occurred

## Performance Tips

1. **Use Caching**: Aggregation service caches results for 5 minutes
2. **Batch Requests**: Check multiple addresses in parallel
3. **Set Reasonable Timeouts**: Default is 5 seconds
4. **Handle Failures Gracefully**: DFA API may be unavailable

```typescript
// Good: Parallel requests
const results = await Promise.all([
  dfaCoverageClient.checkCoverage({ latitude: -26.1076, longitude: 28.0567 }),
  dfaCoverageClient.checkCoverage({ latitude: -25.7479, longitude: 28.2293 })
]);

// Bad: Sequential requests
const result1 = await dfaCoverageClient.checkCoverage({ latitude: -26.1076, longitude: 28.0567 });
const result2 = await dfaCoverageClient.checkCoverage({ latitude: -25.7479, longitude: 28.2293 });
```

## Integration Points

### Coverage Checker Page

```typescript
// app/coverage/page.tsx
import { coverageAggregationService } from '@/lib/coverage/aggregation-service';

const handleCoverageCheck = async (lat: number, lng: number) => {
  const result = await coverageAggregationService.aggregateCoverage(
    { lat, lng },
    { providers: ['mtn', 'dfa'] }
  );

  // DFA results automatically included
  setResults(result);
};
```

### Admin Coverage Dashboard

```typescript
// app/admin/coverage/testing/page.tsx
import { dfaCoverageClient } from '@/lib/coverage/providers/dfa';

const testDFACoverage = async () => {
  const health = await dfaCoverageClient.checkHealth();
  setApiHealth({ dfa: health });
};
```

## TypeScript Types

All types are fully typed:

```typescript
import type {
  DFACoverageRequest,
  DFACoverageResponse,
  DFACoverageType,
  DFAConnectedBuilding,
  DFANearNetBuilding,
  WebMercatorCoordinates,
  WGS84Coordinates
} from '@/lib/coverage/providers/dfa';
```

## Coordinate Utilities

```typescript
import {
  latLngToWebMercator,
  webMercatorToLatLng,
  haversineDistance,
  isWithinSouthAfricaBounds
} from '@/lib/coverage/providers/dfa';

// Convert coordinates
const webMercator = latLngToWebMercator(-26.1076, 28.0567);
// { x: 3123456.789, y: -3004567.890, spatialReference: { wkid: 102100 } }

// Check if coordinates are in South Africa
const isInSA = isWithinSouthAfricaBounds(-26.1076, 28.0567); // true

// Calculate distance between two points
const distance = haversineDistance(-26.1076, 28.0567, -25.7479, 28.2293);
// Distance in meters
```

## Documentation

- **Full API Analysis**: `docs/integrations/DFA_ARCGIS_INTEGRATION_ANALYSIS.md`
- **Implementation Summary**: `docs/integrations/DFA_IMPLEMENTATION_SUMMARY.md`
- **Multi-Provider Architecture**: `docs/features/customer-journey/MULTI_PROVIDER_ARCHITECTURE.md`

## Support

For issues or questions:
1. Check API health: `dfaCoverageClient.checkHealth()`
2. Review logs in Supabase Dashboard
3. Check DFA API status: https://gisportal.dfafrica.co.za/arcgis/rest/services
4. Refer to error codes and messages

## Next Steps

1. Apply SQL migration to enable DFA provider
2. Test integration with real customer addresses
3. Monitor API performance and error rates
4. Add DFA to admin testing interface
5. Create coverage map visualization with DFA layer

---

**Status**: ✅ Ready for Production
**Last Updated**: October 22, 2025
**Maintainer**: Development Team

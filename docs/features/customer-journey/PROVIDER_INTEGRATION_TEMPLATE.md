# Provider Integration Template
## How to Add New Coverage Providers to CircleTel

> **Purpose**: Step-by-step checklist for integrating new fibre/wireless providers
> **Time**: 2-3 days per provider (if data ready)
> **Examples**: MetroFibre, Openserve, DFA, Vumatel

---

## Prerequisites Checklist

Before starting integration, ensure you have:

- [ ] **Coverage Data**: API access OR static coverage files (KML/KMZ/Shapefile)
- [ ] **API Documentation**: Endpoint URLs, authentication, request/response formats
- [ ] **Product Pricing**: List of products with speeds and pricing
- [ ] **SLA Details**: Service level agreements, support contacts
- [ ] **Partnership Agreement**: Legal/commercial agreement signed
- [ ] **Test Credentials**: Sandbox/test environment access
- [ ] **Geographic Scope**: Coverage area boundaries (provinces, cities)

---

## Integration Steps

### Step 1: Database Setup (1-2 hours)

#### 1.1 Add Provider to `fttb_network_providers`

```sql
INSERT INTO fttb_network_providers (
  name, display_name, provider_code, type,
  service_offerings, coverage_source, priority, enabled,
  website, support_contact, api_documentation_url
) VALUES (
  'metrofibre',                              -- Technical name
  'MetroFibre',                              -- Display name
  'metrofibre',                              -- Unique code
  'static',                                  -- 'api' or 'static'
  '["fibre"]'::jsonb,                        -- Service types offered
  'static_file',                             -- 'api', 'static_file', 'postgis', 'hybrid'
  10,                                        -- Priority (lower = higher priority)
  false,                                     -- Start disabled, enable after testing
  'https://metrofibre.co.za',               -- Provider website
  'support@circletel.co.za',                -- CircleTel support email for this provider
  'https://metrofibre.co.za/api-docs'       -- API docs (if available)
);
```

#### 1.2 Decide: New Products OR Map to Existing?

**Option A**: Provider offers unique products → Create new products
**Option B**: Provider offers same FTTH as existing → Map to HomeFibreConnect/BizFibreConnect

For example:
- MetroFibre FTTH 100Mbps = Same as HomeFibreConnect 100 → Map to existing
- DFA Enterprise Fibre 1Gbps = New product → Create new

If mapping to existing products:
```sql
UPDATE service_packages
SET compatible_providers = array_append(compatible_providers, 'metrofibre')
WHERE name IN ('HomeFibreConnect 50', 'HomeFibreConnect 100', 'BizFibreConnect 50');
```

If creating new products:
```sql
INSERT INTO service_packages (
  name, service_type, product_category, customer_type,
  speed_down, speed_up, price, compatible_providers, active
) VALUES (
  'MetroFibre 100',
  'fibre',
  'fibre_consumer',
  'consumer',
  100, 100, 1299,
  ARRAY['metrofibre'],
  true
);
```

#### 1.3 Create Product Mappings (if using `provider_product_mappings` table)

```sql
INSERT INTO provider_product_mappings (
  provider_code,
  provider_service_type,              -- Provider's API service name
  circletel_product_id,               -- FK to service_packages
  mapping_config,                     -- JSON config for transformation
  priority,
  active
) VALUES (
  'metrofibre',
  'FTTH 100Mbps',                     -- MetroFibre's service name
  (SELECT id FROM service_packages WHERE name = 'HomeFibreConnect 100'),
  '{"speed_multiplier": 1, "price_override": null}'::jsonb,
  1,
  true
);
```

---

### Step 2: Coverage Integration (3-4 hours)

#### 2.1 Create Provider Client

Create `/lib/coverage/providers/[provider]/[provider]-client.ts`:

```typescript
import { Coordinates } from '../../types';
import { ProviderCoverageResponse } from '../../provider-mapping-interface';

export class MetroFibreClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.METROFIBRE_API_KEY || '';
    this.baseUrl = process.env.METROFIBRE_API_URL || 'https://api.metrofibre.co.za';
  }

  /**
   * Check coverage at coordinates
   */
  async checkCoverage(coordinates: Coordinates): Promise<ProviderCoverageResponse> {
    const startTime = Date.now();

    try {
      // OPTION A: API Call
      const response = await fetch(`${this.baseUrl}/coverage/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lat: coordinates.lat, lng: coordinates.lng })
      });

      const data = await response.json();

      // OR OPTION B: Static File Query (KML/Shapefile)
      // const coverage = await this.queryStaticCoverageFile(coordinates);

      return {
        coordinates,
        available: data.available || false,
        services: data.services.map(s => ({
          serviceType: s.type,
          available: s.available,
          signal: s.signal_strength,
          capacity: s.capacity
        })),
        provider: 'metrofibre',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        coordinates,
        available: false,
        services: [],
        provider: 'metrofibre',
        responseTime: Date.now() - startTime,
        metadata: { error: error.message }
      };
    }
  }
}

export const metroFibreClient = new MetroFibreClient();
```

#### 2.2 Add to Aggregation Service

Update `/lib/coverage/aggregation-service.ts` to include new provider in fallback chain.

---

### Step 3: Product Mapping Logic (2-3 hours)

#### 3.1 Create Product Mapper

Create `/lib/coverage/providers/[provider]/[provider]-product-mapper.ts`:

```typescript
import { ProviderCoverageResponse, MappedProduct, ProductMappingOptions, ProviderMappingFunction } from '../../provider-mapping-interface';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const mapMetroFibreProducts: ProviderMappingFunction = async (
  coverageData: ProviderCoverageResponse,
  options: ProductMappingOptions = {}
): Promise<MappedProduct[]> => {
  const { customerType, budget, minSpeed } = options;

  const mappedProducts: MappedProduct[] = [];

  // Extract available services
  const fibreService = coverageData.services.find(s =>
    s.serviceType.toLowerCase().includes('ftth') ||
    s.serviceType.toLowerCase().includes('fibre')
  );

  if (!fibreService || !fibreService.available) {
    return [];
  }

  // Query products compatible with MetroFibre
  let query = supabase
    .from('service_packages')
    .select('*')
    .contains('compatible_providers', ['metrofibre'])
    .eq('service_type', 'fibre')
    .eq('active', true);

  if (customerType) {
    const productCategory = customerType === 'consumer' ? 'fibre_consumer' : 'fibre_business';
    query = query.eq('product_category', productCategory);
  }

  if (budget?.min) query = query.gte('price', budget.min);
  if (budget?.max) query = query.lte('price', budget.max);
  if (minSpeed) query = query.gte('speed_down', minSpeed);

  const { data: products, error } = await query;

  if (error || !products) {
    console.error('Error fetching MetroFibre products:', error);
    return [];
  }

  // Map to MappedProduct format
  return products.map(pkg => ({
    productId: pkg.id,
    productName: pkg.name,
    circletelCategory: pkg.product_category,
    provider: 'metrofibre',
    price: pkg.price,
    speed: { download: pkg.speed_down, upload: pkg.speed_up },
    dataAllowance: 'unlimited',
    available: true,
    signal: fibreService.signal || 'good',
    confidence: fibreService.signal === 'excellent' ? 'high' : 'medium'
  }));
};
```

#### 3.2 Add to Provider Registry

Update `/lib/coverage/provider-registry.ts`:

```typescript
import { mapMetroFibreProducts } from './providers/metrofibre/metrofibre-product-mapper';

export const PROVIDER_REGISTRY: Record<string, ProviderCapabilities> = {
  // ... existing providers ...

  metrofibre: {
    providerCode: 'metrofibre',
    displayName: 'MetroFibre',
    logo: '/images/providers/metrofibre-logo.png',
    website: 'https://metrofibre.co.za',
    supportContact: 'support@circletel.co.za',
    serviceTypes: ['fibre'],
    coverageSource: 'static_file', // or 'api'
    mappingFunction: mapMetroFibreProducts
  }
};
```

---

### Step 4: Testing (2-3 hours)

#### 4.1 Unit Tests

Create `/lib/coverage/providers/[provider]/__tests__/[provider]-product-mapper.test.ts`:

```typescript
import { mapMetroFibreProducts } from '../metrofibre-product-mapper';

describe('MetroFibre Product Mapper', () => {
  const mockCoverageData = {
    coordinates: { lat: -26.2041, lng: 28.0473 },
    available: true,
    services: [
      { serviceType: 'FTTH', available: true, signal: 'good' }
    ],
    provider: 'metrofibre',
    responseTime: 200
  };

  test('maps FTTH to HomeFibreConnect products', async () => {
    const products = await mapMetroFibreProducts(mockCoverageData, { customerType: 'consumer' });

    expect(products.length).toBeGreaterThan(0);
    expect(products[0].provider).toBe('metrofibre');
    expect(products[0].circletelCategory).toBe('fibre_consumer');
  });

  test('respects budget constraints', async () => {
    const products = await mapMetroFibreProducts(mockCoverageData, {
      budget: { max: 1000 }
    });

    products.forEach(p => {
      expect(p.price).toBeLessThanOrEqual(1000);
    });
  });
});
```

Run tests:
```bash
npm run test -- metrofibre-product-mapper.test.ts
```

#### 4.2 Integration Tests

1. Enable provider in database: `UPDATE fttb_network_providers SET enabled = true WHERE provider_code = 'metrofibre';`
2. Test coverage check with known MetroFibre coverage area
3. Verify products returned
4. Test with MTN + MetroFibre overlap → verify de-duplication

#### 4.3 Manual Testing Checklist

- [ ] Coverage check returns MetroFibre availability
- [ ] Products display with MetroFibre attribution
- [ ] Products filter correctly by customer type
- [ ] Multi-provider results (MTN + MetroFibre) de-duplicate correctly
- [ ] Provider logo displays in UI
- [ ] SLA information accessible
- [ ] No console errors

---

### Step 5: Documentation (1 hour)

#### 5.1 Update Documentation

- [ ] Update `MULTI_PROVIDER_ARCHITECTURE.md` with MetroFibre example
- [ ] Add MetroFibre to provider list in CLAUDE.md
- [ ] Document any provider-specific quirks

#### 5.2 Create Provider README

Update `/lib/coverage/providers/metrofibre/README.md`:

```markdown
# MetroFibre Integration

**Status**: ✅ Integrated
**Coverage Source**: Static KML files
**Last Updated**: 2025-10-21

## Coverage Details
- **Areas**: Johannesburg Metro, Cape Town Metro
- **Technology**: FTTH (Fibre to the Home)
- **Speeds**: 10Mbps - 1Gbps

## Products
- HomeFibreConnect 50 (R899) - Available
- HomeFibreConnect 100 (R1,399) - Available
- BizFibreConnect 50 (R1,899) - Available
- BizFibreConnect 100 (R2,799) - Available

## API Details
- **Type**: Static coverage files (KML)
- **Update Frequency**: Quarterly
- **Contact**: partnerships@metrofibre.co.za

## Testing
- All unit tests passing
- Integration tests passing
- Manual testing complete
```

---

### Step 6: Deployment (1 hour)

#### 6.1 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Database migration applied
- [ ] Environment variables set (if API-based)
- [ ] Provider enabled in database
- [ ] Documentation updated
- [ ] Code reviewed

#### 6.2 Deployment Steps

1. Merge feature branch to main
2. Deploy to staging
3. Run smoke tests
4. Monitor for errors
5. Deploy to production
6. Monitor coverage checks
7. Announce new provider to team

---

## Provider-Specific Examples

### MetroFibre (FTTH - Static Files)
- **Time**: 2 days
- **Coverage**: KML files from MetroFibre
- **Products**: Map to HomeFibreConnect/BizFibreConnect
- **Complexity**: Low (static data)

### Openserve (FTTH - Static Files)
- **Time**: 2 days
- **Coverage**: Telkom Openserve coverage maps
- **Products**: Map to HomeFibreConnect/BizFibreConnect
- **Complexity**: Low (static data, excellent coverage)

### DFA (Business Fibre - API)
- **Time**: 3 days
- **Coverage**: DFA API integration
- **Products**: Primarily BizFibreConnect (enterprise focus)
- **Complexity**: Medium (API integration, authentication)

### Vumatel (FTTH - Static Files)
- **Time**: 2 days
- **Coverage**: Vumatel coverage KML/Shapefile
- **Products**: Map to HomeFibreConnect (residential)
- **Complexity**: Low (excellent JHB/CPT coverage)

---

## Troubleshooting

### Provider Not Returning Products
1. Check `enabled = true` in database
2. Verify `compatible_providers` array includes provider code
3. Check provider mapping function is registered
4. Verify coverage data returns `available = true`

### Products Duplicated
1. Ensure product de-duplication logic in aggregation service
2. Check `compatible_providers` doesn't have duplicates

### API Authentication Failures
1. Verify environment variables set correctly
2. Check API key is valid
3. Test API directly with Postman/curl

---

**Last Updated**: 2025-10-21
**Estimated Time**: 2-3 days per provider
**Prerequisites**: Coverage data, product pricing, partnership agreement

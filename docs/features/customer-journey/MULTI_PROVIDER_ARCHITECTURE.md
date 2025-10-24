# Multi-Provider Coverage Architecture
## CircleTel Provider Registry & Product Mapping System

> **Status**: Design Complete, Implementation Pending
> **Created**: 2025-10-21
> **Version**: 1.0

---

## Overview

CircleTel's coverage system is designed to aggregate coverage data from multiple telecommunications providers (MTN, MetroFibre, Openserve, DFA, Vumatel) and intelligently map their services to CircleTel's product portfolio.

### Design Principles

1. **Provider-Agnostic Application Layer**: UI and API code doesn't know about specific providers
2. **Provider-Specific Integration Layer**: Each provider has its own mapper with standard interface
3. **Dynamic Provider Selection**: Enable/disable providers without code changes
4. **Product Flexibility**: Same CircleTel product can be delivered by multiple providers
5. **Fallback Resilience**: If one provider's API fails, fall back to others

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                            │
│  (Provider-agnostic: /app, /components, /api)                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│               COVERAGE AGGREGATION SERVICE                       │
│  - Multi-provider orchestration                                 │
│  - Result merging & de-duplication                              │
│  - Provider priority management                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PROVIDER REGISTRY                               │
│  {                                                               │
│    mtn: { mappingFunction, capabilities, ... },                 │
│    metrofibre: { mappingFunction, capabilities, ... },          │
│    openserve: { ... }, dfa: { ... }, vumatel: { ... }          │
│  }                                                               │
└───┬──────────┬──────────┬──────────┬──────────┬─────────────────┘
    │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  MTN   │ │ Metro  │ │ Open   │ │  DFA   │ │ Vuma   │
│ Mapper │ │ Mapper │ │ Mapper │ │ Mapper │ │ Mapper │
└───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
    │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  MTN   │ │ Metro  │ │ Open   │ │  DFA   │ │ Vuma   │
│ Client │ │ Client │ │ Client │ │ Client │ │ Client │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
    │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ MTN    │ │ KML    │ │ KML    │ │ API    │ │ Shape  │
│ API    │ │ Files  │ │ Files  │ │        │ │ Files  │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
```

---

## Data Model

### Database Tables

#### 1. `fttb_network_providers`
Provider registry with capabilities and metadata.

```sql
CREATE TABLE fttb_network_providers (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  provider_code TEXT UNIQUE NOT NULL,        -- 'mtn', 'metrofibre', etc.
  type TEXT NOT NULL,                        -- 'api', 'static'
  service_offerings JSONB DEFAULT '[]',      -- ['fibre', 'wireless', '5g', 'lte']
  coverage_source TEXT,                      -- 'api', 'static_file', 'postgis', 'hybrid'
  api_version TEXT,
  api_documentation_url TEXT,
  website TEXT,
  support_contact TEXT,
  priority INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example Data**:
```sql
INSERT INTO fttb_network_providers VALUES
  ('uuid1', 'mtn_wholesale_mns', 'MTN Wholesale', 'mtn', 'api',
   '["fibre","wireless","5g","lte"]'::jsonb, 'api', 'v1',
   'https://mtnbusiness.co.za/api-docs', 'https://mtnbusiness.co.za',
   'support@circletel.co.za', 1, true, NOW(), NOW()),

  ('uuid2', 'metrofibre', 'MetroFibre', 'metrofibre', 'static',
   '["fibre"]'::jsonb, 'static_file', NULL, NULL,
   'https://metrofibre.co.za', 'support@circletel.co.za', 10, false, NOW(), NOW());
```

#### 2. `service_packages`
Products with provider compatibility.

```sql
ALTER TABLE service_packages
ADD COLUMN compatible_providers TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN provider_specific_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN provider_priority INTEGER DEFAULT 1;
```

**Example Data**:
```sql
-- HomeFibreConnect 100 available from MTN, Openserve, Vumatel
UPDATE service_packages
SET compatible_providers = ARRAY['mtn', 'openserve', 'vumatel']
WHERE name = 'HomeFibreConnect 100';

-- BizFibreConnect 100 available from MTN, MetroFibre, Openserve
UPDATE service_packages
SET compatible_providers = ARRAY['mtn', 'metrofibre', 'openserve']
WHERE name = 'BizFibreConnect 100';

-- MTN 5G only from MTN
UPDATE service_packages
SET compatible_providers = ARRAY['mtn']
WHERE name LIKE 'MTN 5G%';
```

#### 3. `provider_product_mappings` (Optional)
Explicit mapping rules when transformation logic needed.

```sql
CREATE TABLE provider_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code TEXT NOT NULL REFERENCES fttb_network_providers(provider_code),
  provider_service_type TEXT NOT NULL,       -- Provider's API service name
  circletel_product_id UUID REFERENCES service_packages(id),
  mapping_config JSONB DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_code, provider_service_type, circletel_product_id)
);
```

**Example Data**:
```sql
INSERT INTO provider_product_mappings VALUES
  (gen_random_uuid(), 'mtn', 'FTTH 100Mbps',
   (SELECT id FROM service_packages WHERE name = 'HomeFibreConnect 100'),
   '{"speed_multiplier": 1}'::jsonb, 1, true, NOW(), NOW()),

  (gen_random_uuid(), 'mtn', 'Fixed Wireless Broadband',
   (SELECT id FROM service_packages WHERE name = 'SkyFibre Home 40'),
   '{"technology": "Tarana"}'::jsonb, 1, true, NOW(), NOW());
```

---

## Code Architecture

### 1. Provider Mapping Interface
Standard interface all providers implement.

**File**: `/lib/coverage/provider-mapping-interface.ts`

```typescript
export interface ProviderCoverageResponse {
  coordinates: Coordinates;
  available: boolean;
  services: ProviderServiceAvailability[];
  provider: string;
  responseTime: number;
  metadata?: Record<string, unknown>;
}

export interface MappedProduct {
  productId: string;
  productName: string;
  circletelCategory: string;
  provider: string;
  price: number;
  speed: { download: number; upload: number };
  dataAllowance?: number | 'unlimited';
  available: boolean;
  signal?: string;
  confidence: 'high' | 'medium' | 'low';
}

export type ProviderMappingFunction = (
  coverageData: ProviderCoverageResponse,
  options?: ProductMappingOptions
) => Promise<MappedProduct[]>;
```

### 2. Provider Registry
Central registry of all providers.

**File**: `/lib/coverage/provider-registry.ts`

```typescript
export const PROVIDER_REGISTRY: Record<string, ProviderCapabilities> = {
  mtn: {
    providerCode: 'mtn',
    displayName: 'MTN',
    serviceTypes: ['fibre', 'wireless', '5g', 'lte'],
    coverageSource: 'api',
    mappingFunction: mapMTNProducts  // ← Provider-specific
  },
  metrofibre: {
    providerCode: 'metrofibre',
    displayName: 'MetroFibre',
    serviceTypes: ['fibre'],
    coverageSource: 'static_file',
    mappingFunction: mapMetroFibreProducts
  }
  // ... openserve, dfa, vumatel
};

export function getProvider(code: string): ProviderCapabilities | undefined {
  return PROVIDER_REGISTRY[code];
}

export function getEnabledProviders(): ProviderCapabilities[] {
  // Query database for enabled providers
  // For now, return MTN only
  return [PROVIDER_REGISTRY.mtn];
}
```

### 3. Provider-Specific Mappers
Each provider has its own mapping logic.

**File**: `/lib/coverage/providers/mtn/mtn-product-mapper.ts`

```typescript
export async function mapMTNProducts(
  coverageData: ProviderCoverageResponse,
  options: ProductMappingOptions = {}
): Promise<MappedProduct[]> {
  const mappedProducts: MappedProduct[] = [];

  for (const service of coverageData.services) {
    if (!service.available) continue;

    // Fibre → HomeFibreConnect or BizFibreConnect
    if (service.serviceType.includes('FTTH')) {
      const products = await mapFibreProducts(service, options);
      mappedProducts.push(...products);
    }

    // Fixed Wireless → SkyFibre
    if (service.serviceType.includes('Wireless')) {
      const products = await mapWirelessProducts(service, options);
      mappedProducts.push(...products);
    }

    // 5G → MTN 5G Resale
    if (service.serviceType === '5G') {
      const products = await map5GProducts(service, options);
      mappedProducts.push(...products);
    }

    // LTE → MTN LTE Resale
    if (service.serviceType === 'LTE') {
      const products = await mapLTEProducts(service, options);
      mappedProducts.push(...products);
    }
  }

  return mappedProducts;
}
```

**Key Point**: Each provider implements this same pattern but with provider-specific logic.

### 4. Coverage Aggregation Service
Orchestrates multi-provider coverage checks.

**File**: `/lib/coverage/aggregation-service.ts`

```typescript
export class CoverageAggregationService {
  async aggregateCoverage(
    coordinates: Coordinates,
    options: AggregationOptions
  ): Promise<AggregatedCoverageResponse> {
    const providers = getEnabledProviders();
    const results: ProviderCoverageResponse[] = [];

    // Check coverage from all enabled providers
    for (const provider of providers) {
      const result = await this.checkProviderCoverage(provider, coordinates);
      if (result) results.push(result);
    }

    // Merge results
    return this.mergeResults(results, options);
  }

  private async checkProviderCoverage(
    provider: ProviderCapabilities,
    coordinates: Coordinates
  ): Promise<ProviderCoverageResponse | null> {
    // Provider-specific coverage check
    // MTN → API call
    // MetroFibre → KML file query
    // etc.
  }

  private mergeResults(
    results: ProviderCoverageResponse[],
    options: AggregationOptions
  ): AggregatedCoverageResponse {
    // De-duplicate services
    // Prioritize by provider priority
    // Return best coverage
  }
}
```

---

## Request Flow

### Example: Coverage Check at Johannesburg Location

```
1. User enters address → Coordinates: -26.2041, 28.0473

2. Coverage API receives request
   POST /api/coverage/mtn/check
   { "coordinates": { "lat": -26.2041, "lng": 28.0473 } }

3. Aggregation Service queries enabled providers
   - getEnabledProviders() → [mtn, metrofibre, openserve]

4. Parallel coverage checks:
   ┌─ MTN Client → MTN API → { FTTH: available, 5G: available, LTE: available }
   ├─ MetroFibre Client → KML query → { FTTH: available }
   └─ Openserve Client → KML query → { FTTH: available }

5. Provider Mappers convert to products:
   ┌─ mapMTNProducts() →
   │   - HomeFibreConnect 50/100/200/500 (provider: 'mtn')
   │   - SkyFibre Home 20/40/60 (provider: 'mtn')
   │   - MTN 5G 50GB/100GB (provider: 'mtn')
   │   - MTN LTE Uncapped (provider: 'mtn')
   │
   ├─ mapMetroFibreProducts() →
   │   - HomeFibreConnect 50/100/200/500 (provider: 'metrofibre')
   │
   └─ mapOpenserveProducts() →
       - HomeFibreConnect 50/100/200/500 (provider: 'openserve')

6. De-duplication:
   - HomeFibreConnect 100 available from mtn, metrofibre, openserve
   - Display as: "HomeFibreConnect 100 - Available via MTN, MetroFibre, Openserve"
   - Let customer choose provider preference

7. Return merged response:
   {
     "available": true,
     "products": [
       {
         "id": "uuid1",
         "name": "HomeFibreConnect 100",
         "price": 1399,
         "providers": ["mtn", "metrofibre", "openserve"],
         "preferredProvider": "mtn"  // Lowest priority number
       },
       {
         "id": "uuid2",
         "name": "SkyFibre Home 40",
         "price": 899,
         "providers": ["mtn"]
       }
     ]
   }
```

---

## Provider Integration Patterns

### Pattern 1: API-Based Provider (MTN, DFA)

```typescript
// 1. Client
class MTNWholesaleClient {
  async checkCoverage(coordinates: Coordinates) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'X-API-KEY': this.apiKey },
      body: JSON.stringify({ lat: coordinates.lat, lng: coordinates.lng })
    });
    return response.json();
  }
}

// 2. Mapper
async function mapMTNProducts(coverageData, options) {
  // Query database for MTN-compatible products
  const products = await db.query(`
    SELECT * FROM service_packages
    WHERE 'mtn' = ANY(compatible_providers)
    AND service_type = $1
  `, [serviceType]);

  return products.map(toMappedProduct);
}

// 3. Register
PROVIDER_REGISTRY.mtn = {
  providerCode: 'mtn',
  mappingFunction: mapMTNProducts
};
```

### Pattern 2: Static File Provider (MetroFibre, Openserve, Vumatel)

```typescript
// 1. Client
class MetroFibreClient {
  private coverageData: KMLData;

  async loadCoverageFiles() {
    // Load KML/KMZ files at startup
    this.coverageData = await parseKML('/data/metrofibre-coverage.kml');
  }

  async checkCoverage(coordinates: Coordinates) {
    // Query in-memory spatial data
    const polygon = this.findPolygon(coordinates);
    return {
      available: polygon !== null,
      services: polygon ? [{ serviceType: 'FTTH', available: true }] : []
    };
  }
}

// 2. Mapper (same pattern as API-based)
async function mapMetroFibreProducts(coverageData, options) {
  const products = await db.query(`
    SELECT * FROM service_packages
    WHERE 'metrofibre' = ANY(compatible_providers)
  `);
  return products.map(toMappedProduct);
}

// 3. Register
PROVIDER_REGISTRY.metrofibre = {
  providerCode: 'metrofibre',
  mappingFunction: mapMetroFibreProducts
};
```

---

## Product Mapping Strategies

### Strategy 1: Shared Products (Recommended)
Multiple providers deliver the same CircleTel product.

**Advantages**:
- Simple product catalog
- Customer chooses based on coverage, not product differences
- Easy to compare pricing if providers differ

**Example**:
```
HomeFibreConnect 100 Mbps (R1,399/month)
├─ Available via MTN (priority 1)
├─ Available via Openserve (priority 11)
└─ Available via Vumatel (priority 13)
```

### Strategy 2: Provider-Specific Products
Each provider has unique products.

**Advantages**:
- Accurate provider differentiation
- Can show provider-specific features/SLAs

**Example**:
```
MTN HomeFibre 100 (R1,399/month)
MetroFibre 100 (R1,299/month)
Openserve 100 (R1,349/month)
```

**Recommendation**: Use **Strategy 1** (shared products) for simplicity. Reserve Strategy 2 for truly unique offerings (e.g., MTN 5G is MTN-only).

---

## Benefits of This Architecture

1. **Scalability**: Add new providers in 2-3 days with template
2. **Resilience**: If MTN API fails, fallback to MetroFibre/Openserve
3. **Flexibility**: Enable/disable providers without code changes
4. **Maintainability**: Provider-specific logic isolated in separate files
5. **Testability**: Each provider mapper can be unit tested independently
6. **Performance**: Parallel provider queries reduce latency
7. **Customer Choice**: Show multiple coverage sources, let customer decide

---

## Next Steps

1. **Phase 1A**: Implement multi-provider foundation with MTN
2. **Phase 5A**: Add MetroFibre (2-3 days after MVP)
3. **Phase 5B**: Add Openserve (2-3 days)
4. **Phase 5C**: Add DFA (2-3 days)
5. **Phase 5D**: Add Vumatel (2-3 days)

---

**Last Updated**: 2025-10-21
**Version**: 1.0
**Status**: Design Complete, Ready for Implementation

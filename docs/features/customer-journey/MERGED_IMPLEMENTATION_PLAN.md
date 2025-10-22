# CircleTel Customer Journey - Unified Implementation Plan
## Multi-Provider Product Mapping + Complete Customer Journey (BRS 4.1-4.3)

> **Status**: Ready for Implementation (Foundation: 80% Complete)
> **Created**: 2025-10-21
> **Last Updated**: 2025-10-22 (Tasks 2.1 & 2.2 Complete)
> **Merged From**:
> - `MTN_Coverage_API_to_CircleTel_Product_Mapping_v1_0.md`
> - `IMPLEMENTATION_PLAN.md`
> - Multi-provider scalability requirements
>
> **BRS Reference**: Section 4.1 (Availability Check), 4.2 (Product Search), 4.3 (Order & Subscription)
> **Timeline**: 18-19 days (4 weeks for 1 developer)
> **Progress**: Phase 1B - 75% Complete (KYC Upload & Review ✅)

---

## Executive Summary

The CircleTel platform has a **solid foundation (70% complete)** with MTN coverage integration, order workflow, and database schema in place. However, **critical gaps** remain before production deployment, and the system must be architected for **multi-provider scalability** from day one.

### What This Plan Delivers

1. **Multi-Provider Product Mapping System** - Scalable architecture for MTN, MetroFibre, Openserve, DFA, Vumatel
2. **Complete MTN Product Catalog** - HomeFibreConnect, BizFibreConnect, SkyFibre, MTN 5G/LTE resale products
3. **End-to-End Customer Journey** - From coverage check → order → activation → self-service
4. **B2B Quote System** - Business customer journey with quote generation
5. **Subscription Management** - Customer portal for service management, billing, invoices

### Current Status Breakdown

| Component | Completion | Status | Gap |
|-----------|-----------|---------|-----|
| **Coverage Integration** | 85% | ✅ Working | MTN only, needs multi-provider |
| **Product Catalog** | 40% | ⚠️ Partial | Only SkyFibre products exist |
| **Product Mapping** | 0% | ❌ Missing | No mapping functions exist |
| **Order & Subscription** | 60% | ⚠️ Partial | Needs KYC, tracking, notifications |
| **B2B Journey** | 30% | ⚠️ Partial | Database ready, no UI |
| **Multi-Provider Architecture** | 0% | ❌ Missing | Single-provider hardcoded |
| **Overall** | **70%** | ✅ **Foundation Ready** | **30% remaining** |

### Remaining Work Summary

- **Phase 1A** (3-4 days): Multi-provider foundation + MTN product mapping
- **Phase 1B** (5 days): Order tracking, notifications, KYC upload, payment validation
- **Phase 2** (5 days): Business customer journey, quote system
- **Phase 3** (3 days): Subscription management, billing dashboard
- **Phase 4** (2 days): UX optimizations, analytics

**Total Effort**: ~18-19 days (4 weeks for 1 developer)

---

## Phase 1A: Multi-Provider Product Mapping Foundation (NEW - 3-4 days)

> **Priority**: P0 - Prerequisite for all other phases
> **Why First**: Customer journey depends on complete product catalog and provider-agnostic architecture
> **Outcome**: MTN fully implemented + architecture ready for 4 more providers

### Architectural Vision

**Problem**: Current system is MTN-only with hardcoded provider logic. Adding MetroFibre, Openserve, DFA, or Vumatel would require significant refactoring.

**Solution**: Build provider registry system where each provider:
- Has its own mapping configuration
- Implements standard `ProviderMappingFunction` interface
- Can be added/removed without touching shared code
- Products can be available from multiple providers

**Key Principle**: **Provider-agnostic at the application layer, provider-specific at the integration layer**

### Part 1: Database Schema Enhancement (Day 1)

#### Task 1.1: Multi-Provider Database Migration (4 hours)

**Create**: `/supabase/migrations/20251021000002_create_multi_provider_architecture.sql`

**Changes**:

```sql
-- 1. Enhance fttb_network_providers table
ALTER TABLE fttb_network_providers
ADD COLUMN IF NOT EXISTS provider_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS service_offerings JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS api_version TEXT,
ADD COLUMN IF NOT EXISTS api_documentation_url TEXT,
ADD COLUMN IF NOT EXISTS coverage_source TEXT CHECK (coverage_source IN ('api', 'static_file', 'postgis', 'hybrid'));

-- 2. Enhance service_packages table
ALTER TABLE service_packages
ADD COLUMN IF NOT EXISTS compatible_providers TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS provider_specific_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS provider_priority INTEGER DEFAULT 1;

-- 3. Create provider_product_mappings table
CREATE TABLE IF NOT EXISTS provider_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code TEXT NOT NULL REFERENCES fttb_network_providers(provider_code),
  provider_service_type TEXT NOT NULL,
  circletel_product_id UUID REFERENCES service_packages(id),
  mapping_config JSONB DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_code, provider_service_type, circletel_product_id)
);

-- 4. Update MTN providers with provider_code
UPDATE fttb_network_providers
SET
  provider_code = 'mtn',
  service_offerings = '["fibre", "wireless", "5g", "lte"]'::jsonb,
  coverage_source = 'api',
  api_documentation_url = 'https://mtnbusiness.co.za/api-docs'
WHERE name ILIKE '%mtn%';

-- 5. Add placeholder providers for future integration
INSERT INTO fttb_network_providers (
  name, display_name, provider_code, type, service_offerings,
  coverage_source, priority, enabled
) VALUES
  ('metrofibre', 'MetroFibre', 'metrofibre', 'static', '["fibre"]'::jsonb, 'static_file', 10, false),
  ('openserve', 'Openserve', 'openserve', 'static', '["fibre"]'::jsonb, 'static_file', 11, false),
  ('dfa', 'Dark Fibre Africa', 'dfa', 'api', '["fibre"]'::jsonb, 'api', 12, false),
  ('vumatel', 'Vumatel', 'vumatel', 'static', '["fibre"]'::jsonb, 'static_file', 13, false)
ON CONFLICT (name) DO NOTHING;

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_provider_product_mappings_provider
ON provider_product_mappings(provider_code);
CREATE INDEX IF NOT EXISTS idx_provider_product_mappings_product
ON provider_product_mappings(circletel_product_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_providers
ON service_packages USING GIN(compatible_providers);
CREATE INDEX IF NOT EXISTS idx_fttb_network_providers_code
ON fttb_network_providers(provider_code);
```

**Validation**:
- [ ] Migration applied via Supabase Dashboard SQL Editor
- [ ] `provider_code` unique constraint working
- [ ] MTN providers have `provider_code = 'mtn'`
- [ ] Placeholder providers created (disabled)
- [ ] Indexes created successfully

---

#### Task 1.2: Add MTN Products to Database (4 hours)

**Products to Add**:

**1. HomeFibreConnect (Consumer Fibre)** - Compatible with: `['mtn', 'openserve', 'vumatel']`

```sql
INSERT INTO service_packages (
  name, service_type, product_category, customer_type, speed_down, speed_up, price,
  description, features, compatible_providers, active
) VALUES
  (
    'HomeFibreConnect 50',
    'fibre',
    'fibre_consumer',
    'consumer',
    50, 50, 899,
    'Fast and reliable fibre internet for homes - 50 Mbps',
    '["Unlimited data", "Symmetric speeds", "99.9% uptime SLA", "24/7 support"]'::jsonb,
    ARRAY['mtn', 'openserve', 'vumatel'],
    true
  ),
  (
    'HomeFibreConnect 100',
    'fibre',
    'fibre_consumer',
    'consumer',
    100, 100, 1399,
    'High-speed fibre internet for homes - 100 Mbps',
    '["Unlimited data", "Perfect for streaming", "Multiple devices", "24/7 support"]'::jsonb,
    ARRAY['mtn', 'openserve', 'vumatel'],
    true
  ),
  (
    'HomeFibreConnect 200',
    'fibre',
    'fibre_consumer',
    'consumer',
    200, 200, 1799,
    'Ultra-fast fibre internet for homes - 200 Mbps',
    '["Unlimited data", "Gaming & 4K streaming", "Large households", "24/7 support"]'::jsonb,
    ARRAY['mtn', 'openserve', 'vumatel'],
    true
  ),
  (
    'HomeFibreConnect 500',
    'fibre',
    'fibre_consumer',
    'consumer',
    500, 500, 2299,
    'Premium fibre internet for homes - 500 Mbps',
    '["Unlimited data", "Professional streaming", "Smart home ready", "Priority support"]'::jsonb,
    ARRAY['mtn', 'openserve', 'vumatel'],
    true
  )
ON CONFLICT (name) DO NOTHING;
```

**2. BizFibreConnect (Business Fibre)** - Compatible with: `['mtn', 'metrofibre', 'openserve']`

```sql
INSERT INTO service_packages (
  name, service_type, product_category, customer_type, speed_down, speed_up, price,
  description, features, compatible_providers, active
) VALUES
  (
    'BizFibreConnect 50',
    'fibre',
    'fibre_business',
    'smme',
    50, 50, 1899,
    'Business-grade fibre with SLA - 50 Mbps',
    '["Unlimited data", "Business SLA", "Fixed IP available", "Priority support", "4-hour response time"]'::jsonb,
    ARRAY['mtn', 'metrofibre', 'openserve'],
    true
  ),
  (
    'BizFibreConnect 100',
    'fibre',
    'fibre_business',
    'smme',
    100, 100, 2799,
    'Business-grade fibre with SLA - 100 Mbps',
    '["Unlimited data", "Business SLA", "Fixed IP included", "Priority support", "2-hour response time"]'::jsonb,
    ARRAY['mtn', 'metrofibre', 'openserve'],
    true
  ),
  (
    'BizFibreConnect 500',
    'fibre',
    'fibre_business',
    'enterprise',
    500, 500, 4999,
    'Enterprise fibre with Premium SLA - 500 Mbps',
    '["Unlimited data", "Premium SLA", "Multiple fixed IPs", "Dedicated account manager", "1-hour response time"]'::jsonb,
    ARRAY['mtn', 'metrofibre', 'openserve'],
    true
  )
ON CONFLICT (name) DO NOTHING;
```

**3. MTN 5G/LTE Resale Products** - Compatible with: `['mtn']` only

```sql
-- Consumer 5G/LTE Products
INSERT INTO service_packages (
  name, service_type, product_category, customer_type, speed_down, speed_up, price,
  data_cap, description, features, compatible_providers, active
) VALUES
  (
    'MTN 5G 50GB',
    '5g',
    '5g_consumer',
    'consumer',
    100, 50, 349, 50,
    'MTN 5G mobile data - 50GB',
    '["50GB monthly data", "5G speeds where available", "LTE fallback", "No contract"]'::jsonb,
    ARRAY['mtn'],
    true
  ),
  (
    'MTN 5G 100GB',
    '5g',
    '5g_consumer',
    'consumer',
    100, 50, 599, 100,
    'MTN 5G mobile data - 100GB',
    '["100GB monthly data", "5G speeds where available", "LTE fallback", "No contract"]'::jsonb,
    ARRAY['mtn'],
    true
  ),
  (
    'MTN LTE Uncapped',
    'lte',
    'lte_consumer',
    'consumer',
    20, 10, 699, 999999,
    'MTN LTE uncapped home internet',
    '["Uncapped data", "20 Mbps speed", "No fixed line required", "Quick installation"]'::jsonb,
    ARRAY['mtn'],
    true
  )
ON CONFLICT (name) DO NOTHING;

-- Business 5G/LTE Products
INSERT INTO service_packages (
  name, service_type, product_category, customer_type, speed_down, speed_up, price,
  data_cap, description, features, compatible_providers, active
) VALUES
  (
    'MTN Business 5G 50GB',
    '5g',
    '5g_business',
    'smme',
    100, 50, 499, 50,
    'MTN Business 5G - 50GB',
    '["50GB monthly data", "Business SLA", "Fixed IP available", "Priority support"]'::jsonb,
    ARRAY['mtn'],
    true
  ),
  (
    'MTN Business 5G 100GB',
    '5g',
    '5g_business',
    'smme',
    100, 50, 799, 100,
    'MTN Business 5G - 100GB',
    '["100GB monthly data", "Business SLA", "Fixed IP available", "Priority support"]'::jsonb,
    ARRAY['mtn'],
    true
  ),
  (
    'MTN Business LTE 200GB',
    'lte',
    'lte_business',
    'smme',
    20, 10, 1099, 200,
    'MTN Business LTE - 200GB',
    '["200GB monthly data", "Business SLA", "Fixed IP included", "24/7 support"]'::jsonb,
    ARRAY['mtn'],
    true
  )
ON CONFLICT (name) DO NOTHING;
```

**Validation**:
- [ ] 4 HomeFibreConnect products inserted
- [ ] 3 BizFibreConnect products inserted
- [ ] 3 Consumer 5G/LTE products inserted
- [ ] 3 Business 5G/LTE products inserted
- [ ] All products have `compatible_providers` array
- [ ] Query `SELECT * FROM service_packages WHERE 'mtn' = ANY(compatible_providers)` returns 13 products

---

### Part 2: Provider Registry System (Day 2)

#### Task 2.1: Provider Mapping Interface (2 hours)

**Create**: `/lib/coverage/provider-mapping-interface.ts`

```typescript
import { Coordinates } from './types';

/**
 * Standard interface all provider mappers must implement
 * This ensures consistency across MTN, MetroFibre, Openserve, DFA, Vumatel
 */

export interface ProviderCoverageResponse {
  coordinates: Coordinates;
  available: boolean;
  services: ProviderServiceAvailability[];
  provider: string;
  responseTime: number;
  metadata?: Record<string, unknown>;
}

export interface ProviderServiceAvailability {
  serviceType: string; // Provider's service name (e.g., "FTTH", "Fixed Wireless")
  available: boolean;
  signal?: string;
  capacity?: string;
  region?: string;
  notes?: string;
}

export interface MappedProduct {
  productId: string;
  productName: string;
  circletelCategory: string; // 'fibre_consumer', 'fibre_business', 'wireless', '5g', 'lte'
  provider: string;
  price: number;
  speed: { download: number; upload: number };
  dataAllowance?: number | 'unlimited';
  available: boolean;
  signal?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ProductMappingOptions {
  customerType?: 'consumer' | 'smme' | 'enterprise';
  budget?: { min?: number; max?: number };
  minSpeed?: number;
  preferUnlimited?: boolean;
}

/**
 * Provider Mapping Function Type
 * All providers must implement this signature
 */
export type ProviderMappingFunction = (
  coverageData: ProviderCoverageResponse,
  options?: ProductMappingOptions
) => Promise<MappedProduct[]>;

/**
 * Provider Capabilities
 * Defines what each provider offers
 */
export interface ProviderCapabilities {
  providerCode: string;
  displayName: string;
  logo?: string;
  website?: string;
  supportContact?: string;
  serviceTypes: string[]; // ['fibre', 'wireless', '5g', 'lte']
  coverageSource: 'api' | 'static_file' | 'postgis' | 'hybrid';
  apiDocumentationUrl?: string;
  slaDocumentationUrl?: string;
  mappingFunction: ProviderMappingFunction;
}
```

**Validation**:
- [ ] File created
- [ ] TypeScript compiles without errors
- [ ] All interfaces exported

---

#### Task 2.2: Provider Registry (3 hours)

**Create**: `/lib/coverage/provider-registry.ts`

```typescript
import { ProviderCapabilities, ProviderMappingFunction } from './provider-mapping-interface';
import { mapMTNProducts } from './providers/mtn/mtn-product-mapper';

/**
 * Provider Registry
 * Central configuration for all coverage providers
 *
 * To add a new provider:
 * 1. Create /lib/coverage/providers/[provider]/[provider]-product-mapper.ts
 * 2. Implement ProviderMappingFunction
 * 3. Add to PROVIDER_REGISTRY below
 */

export const PROVIDER_REGISTRY: Record<string, ProviderCapabilities> = {
  mtn: {
    providerCode: 'mtn',
    displayName: 'MTN',
    logo: '/images/providers/mtn-logo.png',
    website: 'https://mtnbusiness.co.za',
    supportContact: 'support@circletel.co.za',
    serviceTypes: ['fibre', 'wireless', '5g', 'lte'],
    coverageSource: 'api',
    apiDocumentationUrl: 'https://mtnbusiness.co.za/api-docs',
    slaDocumentationUrl: '/docs/sla/mtn-sla.pdf',
    mappingFunction: mapMTNProducts
  },

  // Future providers (disabled until implemented)
  metrofibre: {
    providerCode: 'metrofibre',
    displayName: 'MetroFibre',
    logo: '/images/providers/metrofibre-logo.png',
    website: 'https://metrofibre.co.za',
    serviceTypes: ['fibre'],
    coverageSource: 'static_file',
    mappingFunction: async () => [] // Placeholder
  },

  openserve: {
    providerCode: 'openserve',
    displayName: 'Openserve',
    logo: '/images/providers/openserve-logo.png',
    website: 'https://openserve.co.za',
    serviceTypes: ['fibre'],
    coverageSource: 'static_file',
    mappingFunction: async () => [] // Placeholder
  },

  dfa: {
    providerCode: 'dfa',
    displayName: 'Dark Fibre Africa',
    logo: '/images/providers/dfa-logo.png',
    website: 'https://dfafrica.co.za',
    serviceTypes: ['fibre'],
    coverageSource: 'api',
    mappingFunction: async () => [] // Placeholder
  },

  vumatel: {
    providerCode: 'vumatel',
    displayName: 'Vumatel',
    logo: '/images/providers/vumatel-logo.png',
    website: 'https://vumatel.co.za',
    serviceTypes: ['fibre'],
    coverageSource: 'static_file',
    mappingFunction: async () => [] // Placeholder
  }
};

/**
 * Get provider capabilities by code
 */
export function getProvider(providerCode: string): ProviderCapabilities | undefined {
  return PROVIDER_REGISTRY[providerCode];
}

/**
 * Get all enabled providers
 */
export function getEnabledProviders(): ProviderCapabilities[] {
  // In the future, query database for enabled providers
  // For now, only MTN is fully implemented
  return [PROVIDER_REGISTRY.mtn];
}

/**
 * Get providers that support a specific service type
 */
export function getProvidersByServiceType(serviceType: string): ProviderCapabilities[] {
  return Object.values(PROVIDER_REGISTRY).filter(provider =>
    provider.serviceTypes.includes(serviceType)
  );
}

/**
 * Check if provider supports a service type
 */
export function providerSupportsService(providerCode: string, serviceType: string): boolean {
  const provider = getProvider(providerCode);
  return provider?.serviceTypes.includes(serviceType) ?? false;
}
```

**Validation**:
- [ ] File created
- [ ] MTN provider registered
- [ ] 4 future providers registered (placeholders)
- [ ] `getProvider('mtn')` returns MTN capabilities
- [ ] `getProvidersByServiceType('fibre')` returns 5 providers

---

#### Task 2.3: Create Provider Directory Structure (1 hour)

**Create directories and placeholder files**:

```
/lib/coverage/providers/
  ├── mtn/
  │   ├── mtn-product-mapper.ts       # Implements ProviderMappingFunction
  │   ├── mtn-service-detector.ts     # Detects which MTN services available
  │   └── mtn-capabilities.ts         # MTN metadata
  ├── metrofibre/
  │   └── README.md                   # "Coming soon - MetroFibre integration"
  ├── openserve/
  │   └── README.md                   # "Coming soon - Openserve integration"
  ├── dfa/
  │   └── README.md                   # "Coming soon - DFA integration"
  └── vumatel/
      └── README.md                   # "Coming soon - Vumatel integration"
```

**Create**: `/lib/coverage/providers/metrofibre/README.md`
```markdown
# MetroFibre Integration (Coming Soon)

MetroFibre is a fibre network operator providing FTTH services in South Africa.

## Integration Checklist
- [ ] Obtain MetroFibre coverage data (KML/KMZ files or API access)
- [ ] Create MetroFibre coverage client
- [ ] Implement `mapMetroFibreProducts()` function
- [ ] Map MetroFibre services → HomeFibreConnect or create MetroFibre-specific products
- [ ] Add to provider registry
- [ ] Test coverage checking
- [ ] Enable in database (`enabled = true`)

## Resources
- Website: https://metrofibre.co.za/
- Coverage Map: https://metrofibre.co.za/coverage/
- Contact: partnerships@circletel.co.za

**Estimated Time**: 2-3 days
```

**Repeat for openserve/, dfa/, vumatel/ with respective URLs**

**Validation**:
- [ ] Directory structure created
- [ ] README.md files created for future providers
- [ ] MTN directory exists (will be populated in next task)

---

### Part 3: MTN Product Mapping Implementation (Day 3)

#### Task 3.1: MTN Product Mapper (6 hours)

**Create**: `/lib/coverage/providers/mtn/mtn-product-mapper.ts`

```typescript
import { ProviderCoverageResponse, MappedProduct, ProductMappingOptions } from '../../provider-mapping-interface';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * MTN Product Mapper
 * Maps MTN coverage API responses to CircleTel products
 */

export async function mapMTNProducts(
  coverageData: ProviderCoverageResponse,
  options: ProductMappingOptions = {}
): Promise<MappedProduct[]> {
  const { customerType, budget, minSpeed, preferUnlimited } = options;

  const mappedProducts: MappedProduct[] = [];

  // Extract available MTN services
  const services = coverageData.services;

  // Map each service type to products
  for (const service of services) {
    if (!service.available) continue;

    // Fibre services → HomeFibreConnect or BizFibreConnect
    if (service.serviceType.toLowerCase().includes('ftth') ||
        service.serviceType.toLowerCase().includes('fibre')) {
      const fibreProducts = await mapFibreProducts(service, customerType, budget, minSpeed);
      mappedProducts.push(...fibreProducts);
    }

    // Fixed Wireless → SkyFibre
    if (service.serviceType.toLowerCase().includes('wireless') ||
        service.serviceType.toLowerCase().includes('broadband')) {
      const wirelessProducts = await mapWirelessProducts(service, customerType, budget, minSpeed);
      mappedProducts.push(...wirelessProducts);
    }

    // 5G services → MTN 5G resale
    if (service.serviceType === '5G') {
      const fiveGProducts = await map5GProducts(service, customerType, budget);
      mappedProducts.push(...fiveGProducts);
    }

    // LTE services → MTN LTE resale
    if (service.serviceType === 'LTE' || service.serviceType === 'FixedLTE') {
      const lteProducts = await mapLTEProducts(service, customerType, budget);
      mappedProducts.push(...lteProducts);
    }
  }

  return mappedProducts;
}

/**
 * Map MTN FTTH services to HomeFibreConnect or BizFibreConnect products
 */
async function mapFibreProducts(
  service: any,
  customerType?: string,
  budget?: { min?: number; max?: number },
  minSpeed?: number
): Promise<MappedProduct[]> {
  // Determine product category based on customer type
  const productCategory = customerType === 'consumer' ? 'fibre_consumer' :
                         (customerType === 'smme' || customerType === 'enterprise') ? 'fibre_business' :
                         null;

  // Build query
  let query = supabase
    .from('service_packages')
    .select('*')
    .contains('compatible_providers', ['mtn'])
    .eq('service_type', 'fibre')
    .eq('active', true);

  if (productCategory) {
    query = query.eq('product_category', productCategory);
  }

  if (budget?.min) query = query.gte('price', budget.min);
  if (budget?.max) query = query.lte('price', budget.max);
  if (minSpeed) query = query.gte('speed_down', minSpeed);

  const { data: products, error } = await query;

  if (error || !products) {
    console.error('Error fetching fibre products:', error);
    return [];
  }

  // Map to MappedProduct format
  return products.map(pkg => ({
    productId: pkg.id,
    productName: pkg.name,
    circletelCategory: pkg.product_category,
    provider: 'mtn',
    price: pkg.price,
    speed: { download: pkg.speed_down, upload: pkg.speed_up },
    dataAllowance: 'unlimited',
    available: true,
    signal: service.signal || 'good',
    confidence: service.signal === 'excellent' ? 'high' :
                service.signal === 'good' ? 'high' : 'medium'
  }));
}

/**
 * Map MTN Fixed Wireless to SkyFibre products
 */
async function mapWirelessProducts(
  service: any,
  customerType?: string,
  budget?: { min?: number; max?: number },
  minSpeed?: number
): Promise<MappedProduct[]> {
  let query = supabase
    .from('service_packages')
    .select('*')
    .contains('compatible_providers', ['mtn'])
    .or('service_type.eq.wireless,service_type.eq.uncapped_wireless')
    .eq('active', true);

  if (customerType) {
    query = query.eq('customer_type', customerType);
  }

  if (budget?.min) query = query.gte('price', budget.min);
  if (budget?.max) query = query.lte('price', budget.max);
  if (minSpeed) query = query.gte('speed_down', minSpeed);

  const { data: products, error } = await query;

  if (error || !products) return [];

  return products.map(pkg => ({
    productId: pkg.id,
    productName: pkg.name,
    circletelCategory: pkg.product_category,
    provider: 'mtn',
    price: pkg.price,
    speed: { download: pkg.speed_down, upload: pkg.speed_up },
    dataAllowance: 'unlimited',
    available: true,
    signal: service.signal || 'good',
    confidence: service.signal === 'excellent' ? 'high' :
                service.signal === 'good' ? 'medium' : 'low'
  }));
}

/**
 * Map MTN 5G services to MTN 5G resale products
 */
async function map5GProducts(
  service: any,
  customerType?: string,
  budget?: { min?: number; max?: number }
): Promise<MappedProduct[]> {
  const productCategory = customerType === 'consumer' ? '5g_consumer' : '5g_business';

  let query = supabase
    .from('service_packages')
    .select('*')
    .contains('compatible_providers', ['mtn'])
    .eq('service_type', '5g')
    .eq('product_category', productCategory)
    .eq('active', true);

  if (budget?.min) query = query.gte('price', budget.min);
  if (budget?.max) query = query.lte('price', budget.max);

  const { data: products, error } = await query;

  if (error || !products) return [];

  return products.map(pkg => ({
    productId: pkg.id,
    productName: pkg.name,
    circletelCategory: pkg.product_category,
    provider: 'mtn',
    price: pkg.price,
    speed: { download: pkg.speed_down, upload: pkg.speed_up },
    dataAllowance: pkg.data_cap || 0,
    available: true,
    signal: service.signal || 'good',
    confidence: 'high'
  }));
}

/**
 * Map MTN LTE services to MTN LTE resale products
 */
async function mapLTEProducts(
  service: any,
  customerType?: string,
  budget?: { min?: number; max?: number }
): Promise<MappedProduct[]> {
  const productCategory = customerType === 'consumer' ? 'lte_consumer' : 'lte_business';

  let query = supabase
    .from('service_packages')
    .select('*')
    .contains('compatible_providers', ['mtn'])
    .eq('service_type', 'lte')
    .eq('product_category', productCategory)
    .eq('active', true);

  if (budget?.min) query = query.gte('price', budget.min);
  if (budget?.max) query = query.lte('price', budget.max);

  const { data: products, error } = await query;

  if (error || !products) return [];

  return products.map(pkg => ({
    productId: pkg.id,
    productName: pkg.name,
    circletelCategory: pkg.product_category,
    provider: 'mtn',
    price: pkg.price,
    speed: { download: pkg.speed_down, upload: pkg.speed_up },
    dataAllowance: pkg.data_cap === 999999 ? 'unlimited' : pkg.data_cap || 0,
    available: true,
    signal: service.signal || 'good',
    confidence: 'medium'
  }));
}
```

**Validation**:
- [ ] File created
- [ ] All mapping functions implemented
- [ ] TypeScript compiles without errors
- [ ] Queries filter by `compatible_providers`

---

#### Task 3.2: Update Coverage API to Use Provider Mapping (2 hours)

**Update**: `/app/api/coverage/packages/route.ts`

Add after line 91 (where coverage result is obtained):

```typescript
// NEW: Use provider-specific mapping instead of hardcoded logic
import { getProvider } from '@/lib/coverage/provider-registry';
import { MappedProduct } from '@/lib/coverage/provider-mapping-interface';

// ... existing coverage check code ...

if (coverageResult.overallCoverage && coverageResult.bestServices.length > 0) {
  coverageAvailable = true;

  // NEW: Map coverage to products using provider registry
  const provider = getProvider('mtn'); // Use MTN for now, will expand later

  if (provider && provider.mappingFunction) {
    const mappedProducts: MappedProduct[] = await provider.mappingFunction(
      {
        coordinates,
        available: true,
        services: coverageResult.bestServices.map(s => ({
          serviceType: s.serviceType,
          available: s.available,
          signal: s.signal
        })),
        provider: 'mtn',
        responseTime: 0
      },
      {
        customerType: 'consumer', // Can be enhanced with user preference later
        preferUnlimited: true
      }
    );

    availablePackages = mappedProducts.map(product => ({
      id: product.productId,
      name: product.productName,
      service_type: product.circletelCategory,
      product_category: product.circletelCategory,
      speed_down: product.speed.download,
      speed_up: product.speed.upload,
      price: product.price,
      provider: product.provider,
      available: product.available,
      signal: product.signal,
      confidence: product.confidence
    }));
  }

  // Store metadata
  coverageMetadata = {
    provider: 'mtn',
    productsFound: availablePackages.length,
    mappingUsed: true,
    // ... existing metadata
  };
}
```

**Validation**:
- [ ] Coverage API updated
- [ ] Products returned use provider mapping
- [ ] All product types (fibre, wireless, 5G, LTE) returned correctly

---

### Part 4: Testing & Documentation (Day 4)

#### Task 4.1: Unit Tests for MTN Mapping (3 hours)

**Create**: `/lib/coverage/providers/mtn/__tests__/mtn-product-mapper.test.ts`

```typescript
import { mapMTNProducts } from '../mtn-product-mapper';
import { ProviderCoverageResponse } from '../../../provider-mapping-interface';

describe('MTN Product Mapper', () => {
  const mockCoverageData: ProviderCoverageResponse = {
    coordinates: { lat: -26.2041, lng: 28.0473 },
    available: true,
    services: [
      { serviceType: 'FTTH', available: true, signal: 'excellent' },
      { serviceType: 'Fixed Wireless', available: true, signal: 'good' },
      { serviceType: '5G', available: true, signal: 'good' },
      { serviceType: 'LTE', available: true, signal: 'fair' }
    ],
    provider: 'mtn',
    responseTime: 500
  };

  test('maps FTTH to HomeFibreConnect products (consumer)', async () => {
    const products = await mapMTNProducts(mockCoverageData, { customerType: 'consumer' });

    const fibreProducts = products.filter(p => p.circletelCategory === 'fibre_consumer');
    expect(fibreProducts.length).toBeGreaterThan(0);
    expect(fibreProducts[0].productName).toContain('HomeFibreConnect');
    expect(fibreProducts[0].provider).toBe('mtn');
  });

  test('maps FTTH to BizFibreConnect products (business)', async () => {
    const products = await mapMTNProducts(mockCoverageData, { customerType: 'smme' });

    const fibreProducts = products.filter(p => p.circletelCategory === 'fibre_business');
    expect(fibreProducts.length).toBeGreaterThan(0);
    expect(fibreProducts[0].productName).toContain('BizFibreConnect');
  });

  test('maps Fixed Wireless to SkyFibre products', async () => {
    const products = await mapMTNProducts(mockCoverageData, { customerType: 'consumer' });

    const wirelessProducts = products.filter(p =>
      p.productName.includes('SkyFibre') || p.circletelCategory.includes('wireless')
    );
    expect(wirelessProducts.length).toBeGreaterThan(0);
  });

  test('maps 5G to MTN 5G resale products', async () => {
    const products = await mapMTNProducts(mockCoverageData, { customerType: 'consumer' });

    const fiveGProducts = products.filter(p => p.circletelCategory === '5g_consumer');
    expect(fiveGProducts.length).toBeGreaterThan(0);
    expect(fiveGProducts[0].productName).toContain('MTN 5G');
  });

  test('respects budget constraints', async () => {
    const products = await mapMTNProducts(mockCoverageData, {
      budget: { min: 500, max: 1000 }
    });

    products.forEach(product => {
      expect(product.price).toBeGreaterThanOrEqual(500);
      expect(product.price).toBeLessThanOrEqual(1000);
    });
  });

  test('respects minimum speed requirement', async () => {
    const products = await mapMTNProducts(mockCoverageData, { minSpeed: 100 });

    products.forEach(product => {
      expect(product.speed.download).toBeGreaterThanOrEqual(100);
    });
  });
});
```

**Run tests**:
```bash
npm run test -- mtn-product-mapper.test.ts
```

**Validation**:
- [ ] All tests pass
- [ ] Coverage > 80%

---

#### Task 4.2: Create Documentation (2 hours)

**1. Create**: `/docs/features/customer-journey/MULTI_PROVIDER_ARCHITECTURE.md`

(This will be created in the next message due to length limits)

**2. Create**: `/docs/features/customer-journey/PROVIDER_INTEGRATION_TEMPLATE.md`

(This will also be created separately)

**3. Update**: `/CLAUDE.md`

Add to "Key Implementation Status" section:
```markdown
- **Multi-Provider Architecture**: ✅ Foundation Complete (MTN + 4 providers ready)
  - See `docs/features/customer-journey/MULTI_PROVIDER_ARCHITECTURE.md`
  - Provider registry pattern for scalable integration
  - MetroFibre, Openserve, DFA, Vumatel: Ready to add (2-3 days each)
```

---

### Phase 1A Quality Gates

**Must pass before proceeding to Phase 1B**:

- [ ] Database migration applied (multi-provider schema)
- [ ] 13 MTN products in database (4 HomeFibreConnect, 3 BizFibreConnect, 3+3 5G/LTE)
- [ ] Provider registry functional (`PROVIDER_REGISTRY` has 5 providers)
- [ ] MTN product mapping working end-to-end
- [ ] Coverage API returns products from database (not hardcoded)
- [ ] Products correctly filtered by customer type
- [ ] Products correctly filtered by budget and speed
- [ ] All unit tests passing
- [ ] TypeScript compilation successful
- [ ] Documentation complete (architecture + integration template)

---

## Phase 1B: Critical Fixes (Days 5-9) - P0 - **75% COMPLETE** ✅

> **Original Phase 1 from IMPLEMENTATION_PLAN.md - Updated 2025-10-22**
> **Current Status**: KYC Upload & Review Complete ✅

**Summary**:
- Order status tracking page ✅ (Complete)
- Service activation emails ❌ (Not implemented)
- Sales team real-time alerts ❌ (Not implemented)
- **KYC document upload UI** ✅ **COMPLETE** (Task 2.1 - 2025-10-22)
- **KYC admin review page** ✅ **COMPLETE** (Task 2.2 - 2025-10-22)
- Payment validation & testing ❌ (Not implemented)

**Duration**: 5 days (3.75 days complete)
**Priority**: P0 (Blocks MVP)

**Completed Tasks**:
- **Task 2.1: KYC Document Upload** (6 hours) ✅
  - Customer-facing KYC upload component with drag-and-drop
  - Supabase Storage integration (private bucket with RLS)
  - Order-based document tracking
  - Multi-document support (ID, proof of address, company docs)
  - Files: `CustomerKycUpload.tsx`, `OrderDetailsKycStatus.tsx`

- **Task 2.2: Admin KYC Review Page** (6 hours) ✅
  - Admin review interface at `/admin/kyc`
  - Document viewer modal with PDF/image preview
  - Approve/reject workflow with verification notes
  - Order status synchronization (`kyc_approved`/`kyc_rejected`)
  - Search and filter by customer, status, document type
  - Stats dashboard (Total, Pending, Under Review, Approved, Rejected)
  - Files: `app/admin/kyc/page.tsx`, `DocumentViewer.tsx`, 3 API routes
  - Admin sidebar integration (ShieldCheck icon)

**Remaining Tasks**:
- Task 1.2: Service Activation Email + Zoho Integration (8 hours)
- Task 1.3: Sales Team Alerts + Zoho CRM (6 hours)
- Task 3.1: Payment Error Recovery (4 hours)
- Task 3.2: Payment Testing Suite (4 hours)

---

## Phase 2: B2B Journey (Days 10-14) - P1

> **Original Phase 2 from IMPLEMENTATION_PLAN.md - Enhanced with Business Product Focus**

**Enhancements for Multi-Provider**:
- Task 4.1 (Business Landing Page): Display BizFibreConnect products prominently
- Task 5.1 (Quote Builder): Include products from all compatible providers
- Add provider selection in quote (allow customer to prefer MTN vs MetroFibre vs Openserve)

**Duration**: 5 days
**Priority**: P1

---

## Phase 3: Subscription Management (Days 15-17) - P2

> **Original Phase 3 from IMPLEMENTATION_PLAN.md - Unchanged**

**Duration**: 3 days
**Priority**: P2

---

## Phase 4: UX Optimizations (Days 18-19) - P3

> **Original Phase 4 from IMPLEMENTATION_PLAN.md - Unchanged**

**Duration**: 2 days
**Priority**: P3

---

## Future Provider Integration Roadmap

### Post-MVP Provider Additions

#### Phase 5A: MetroFibre Integration (2-3 days)
**When**: After Phase 4 complete
**Prerequisites**:
- MetroFibre coverage data (KML files or API access)
- MetroFibre product pricing confirmed

**Tasks**:
1. Obtain MetroFibre coverage files or API credentials
2. Create `/lib/coverage/providers/metrofibre/metrofibre-client.ts`
3. Create `/lib/coverage/providers/metrofibre/metrofibre-product-mapper.ts`
4. Decide: Map to HomeFibreConnect/BizFibreConnect OR create MetroFibre-specific products
5. Update `compatible_providers` in database
6. Add to provider registry (enable in database)
7. Test coverage checking with MetroFibre + MTN overlap
8. Test product de-duplication (same package from multiple providers)

**Expected Outcome**: Coverage checker shows MetroFibre availability, products available from MetroFibre

---

#### Phase 5B: Openserve Integration (2-3 days)
**When**: Parallel with 5A or sequential
**Prerequisites**: Openserve coverage data

**Tasks**: Same pattern as MetroFibre
- Openserve = Telkom's fibre network (FTTH)
- Likely maps to HomeFibreConnect (residential) and BizFibreConnect (business)
- Coverage excellent in major metros

---

#### Phase 5C: DFA Integration (2-3 days)
**When**: After 5A/5B
**Prerequisites**: DFA partnership agreement, API access

**Tasks**: Same pattern
- DFA = Enterprise-focused fibre provider
- Primarily maps to BizFibreConnect
- API integration (not static files)

---

#### Phase 5D: Vumatel Integration (2-3 days)
**When**: After 5C
**Prerequisites**: Vumatel coverage data

**Tasks**: Same pattern
- Vumatel = Residential fibre (FTTH)
- Maps to HomeFibreConnect
- Excellent Johannesburg/Cape Town coverage
- Static coverage files (KML/KMZ)

---

## Overall Timeline

| Phase | Focus | Days | Cumulative |
|-------|-------|------|------------|
| **Phase 1A** | Multi-Provider + MTN Products | 3-4 days | 3-4 days |
| **Phase 1B** | Critical Fixes | 5 days | 8-9 days |
| **Phase 2** | B2B Journey | 5 days | 13-14 days |
| **Phase 3** | Subscription Mgmt | 3 days | 16-17 days |
| **Phase 4** | UX Optimizations | 2 days | **18-19 days** |

**MVP Timeline**: 18-19 days (4 weeks for 1 developer)

**Future Providers** (Post-MVP):
- Phase 5A: MetroFibre (2-3 days)
- Phase 5B: Openserve (2-3 days)
- Phase 5C: DFA (2-3 days)
- Phase 5D: Vumatel (2-3 days)

**Total with All Providers**: 26-31 days (6 weeks)

---

## Success Metrics

### Phase 1A Success Criteria
- [ ] Multi-provider architecture deployed
- [ ] 13 MTN products live in production
- [ ] Coverage checker returns all product types (fibre, wireless, 5G, LTE)
- [ ] Products correctly attributed to providers
- [ ] Adding MetroFibre later = template-driven (< 1 day if data ready)
- [ ] No hardcoded provider logic in UI/API layers

### Overall MVP Success (End of Phase 4)
- [ ] End-to-end consumer journey functional
- [ ] End-to-end business journey functional
- [ ] MTN fully integrated (all product types)
- [ ] Provider architecture ready for 4 more providers
- [ ] <2s average page load time
- [ ] >90% customer satisfaction

---

## Related Documentation

- **Phase Breakdown**:
  - `TODO_BREAKDOWN.md` - Actionable checklist (updated with Phase 1A)

- **Multi-Provider Docs**:
  - `MULTI_PROVIDER_ARCHITECTURE.md` - Technical architecture
  - `PROVIDER_INTEGRATION_TEMPLATE.md` - How to add new providers

- **Original Plans** (Superseded):
  - `IMPLEMENTATION_PLAN.md` - Original customer journey plan
  - `MTN_Coverage_API_to_CircleTel_Product_Mapping_v1_0_ARCHIVED.md` - Original MTN mapping doc

- **Database**:
  - `/supabase/migrations/20251021000002_create_multi_provider_architecture.sql` - Multi-provider schema

---

**Last Updated**: 2025-10-21
**Status**: Ready for Implementation
**Next Action**: Begin Phase 1A, Task 1.1 (Multi-Provider Database Migration)
**Estimated MVP Completion**: 18-19 working days (4 weeks)
**Estimated Full Provider Coverage**: 26-31 working days (6 weeks)

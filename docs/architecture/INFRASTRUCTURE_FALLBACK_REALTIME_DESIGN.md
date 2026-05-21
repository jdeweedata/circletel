# Infrastructure Fallback with Real-Time Validation Design

## Critical Requirements

### 1. Real-Time Data Priority
**Primary Rule:** Infrastructure fallback is **ONLY** used when real-time WMS data is unavailable. Never override actual MTN coverage data with estimates.

### 2. Product-Technology Matching
**Requirement:** Products shown to users must match technologies actually available at their address, verified by real-time WMS queries.

### 3. Freshness Validation
**Requirement:** Track coverage data age and confidence. Flag outdated estimates.

## Implementation Architecture

### Layer 1: Primary Coverage Check (Real-Time WMS)

```typescript
// lib/coverage/mtn/coverage-service.ts

export interface CoverageCheckResult {
  source: 'wms_realtime' | 'wms_cache' | 'infrastructure_estimate' | 'failed';
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
  dataAge: number; // seconds since check
  coverage: {
    available: boolean;
    technologies: TechnologyAvailability[];
    signal: SignalStrength;
  };
  fallbackReason?: string;
  validUntil: string; // ISO timestamp
}

export interface TechnologyAvailability {
  type: ServiceType;
  available: boolean;
  source: 'wms_confirmed' | 'infrastructure_estimated' | 'unavailable';
  signal: SignalStrength;
  verificationStatus: 'verified' | 'estimated' | 'unknown';
  lastVerified?: string; // ISO timestamp
  confidence: number; // 0-100
}

export class RealtimeCoverageService {
  private readonly MAX_CACHE_AGE = 5 * 60 * 1000; // 5 minutes
  private readonly FALLBACK_CONFIDENCE_PENALTY = 30; // Reduce confidence by 30% for estimates

  /**
   * Check coverage with strict real-time priority
   */
  async checkCoverage(coordinates: Coordinates, serviceTypes?: ServiceType[]): Promise<CoverageCheckResult> {
    const startTime = Date.now();

    // STEP 1: Always try real-time WMS first
    try {
      const wmsResult = await this.checkWMSRealtime(coordinates, serviceTypes);

      if (wmsResult.success && wmsResult.hasValidData) {
        return {
          source: 'wms_realtime',
          confidence: 'high',
          timestamp: new Date().toISOString(),
          dataAge: Date.now() - startTime,
          coverage: wmsResult.coverage,
          validUntil: new Date(Date.now() + this.MAX_CACHE_AGE).toISOString()
        };
      }
    } catch (error) {
      console.warn('Real-time WMS check failed:', error);
    }

    // STEP 2: Check cache (recent WMS data)
    const cached = await this.getCachedCoverage(coordinates);
    if (cached && this.isCacheFresh(cached)) {
      return {
        source: 'wms_cache',
        confidence: 'high',
        timestamp: cached.timestamp,
        dataAge: Date.now() - new Date(cached.timestamp).getTime(),
        coverage: cached.coverage,
        validUntil: new Date(new Date(cached.timestamp).getTime() + this.MAX_CACHE_AGE).toISOString()
      };
    }

    // STEP 3: Infrastructure fallback (ONLY when real-time unavailable)
    const infrastructureEstimate = await this.estimateFromInfrastructure(coordinates, serviceTypes);

    return {
      source: 'infrastructure_estimate',
      confidence: 'low',
      timestamp: new Date().toISOString(),
      dataAge: 0,
      coverage: infrastructureEstimate,
      fallbackReason: 'Real-time WMS data unavailable - showing infrastructure-based estimate',
      validUntil: new Date(Date.now() + 60 * 1000).toISOString() // 1 min validity for estimates
    };
  }

  /**
   * Check if cached data is still fresh
   */
  private isCacheFresh(cached: CachedCoverage): boolean {
    const age = Date.now() - new Date(cached.timestamp).getTime();
    return age < this.MAX_CACHE_AGE;
  }

  /**
   * Estimate coverage from infrastructure when WMS unavailable
   */
  private async estimateFromInfrastructure(
    coordinates: Coordinates,
    requestedTypes?: ServiceType[]
  ): Promise<CoverageCheckResult['coverage']> {
    const infrastructureScore = await this.calculateInfrastructureScore(coordinates);
    const geoContext = geographicValidator.getLocationInfo(coordinates);

    const technologies: TechnologyAvailability[] = [];

    // Technology thresholds from guide
    const thresholds: Record<ServiceType, number> = {
      'fibre': 75,
      '5g': 70,
      'fixed_lte': 45,
      'uncapped_wireless': 60,
      'licensed_wireless': 50,
      'lte': 40,
      '3g_2100': 30,
      '3g_900': 25,
      '2g': 15
    };

    const typesToCheck = requestedTypes || Object.keys(thresholds) as ServiceType[];

    for (const serviceType of typesToCheck) {
      const threshold = thresholds[serviceType];
      const available = infrastructureScore >= threshold;

      technologies.push({
        type: serviceType,
        available,
        source: 'infrastructure_estimated',
        signal: this.estimateSignalFromInfrastructure(infrastructureScore, threshold),
        verificationStatus: 'estimated',
        confidence: this.calculateEstimateConfidence(infrastructureScore, threshold)
      });
    }

    return {
      available: technologies.some(t => t.available),
      technologies,
      signal: 'fair' // Conservative estimate
    };
  }

  /**
   * Calculate infrastructure score based on location
   */
  private async calculateInfrastructureScore(coordinates: Coordinates): Promise<number> {
    const majorCities = [
      { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, score: 95 },
      { name: 'Cape Town', lat: -33.9249, lng: 18.4241, score: 95 },
      { name: 'Pretoria', lat: -25.7479, lng: 28.2293, score: 90 },
      { name: 'Durban', lat: -29.8587, lng: 31.0218, score: 90 },
      { name: 'Port Elizabeth', lat: -33.9608, lng: 25.6022, score: 85 },
      { name: 'Bloemfontein', lat: -29.1211, lng: 26.2140, score: 80 }
    ];

    let maxScore = 0;

    for (const city of majorCities) {
      const distance = this.calculateDistance(
        coordinates.lat,
        coordinates.lng,
        city.lat,
        city.lng
      );

      // Score decreases with distance: 30km = half score, 100km = quarter score
      const distanceScore = city.score * Math.max(0, 1 - (distance / 100));
      maxScore = Math.max(maxScore, distanceScore);
    }

    return Math.round(maxScore);
  }

  /**
   * Estimate signal strength from infrastructure score
   */
  private estimateSignalFromInfrastructure(score: number, threshold: number): SignalStrength {
    const margin = score - threshold;

    if (score < threshold) return 'none';
    if (margin >= 20) return 'good';
    if (margin >= 10) return 'fair';
    return 'poor';
  }

  /**
   * Calculate confidence level for infrastructure estimate
   */
  private calculateEstimateConfidence(score: number, threshold: number): number {
    if (score < threshold) return 0;

    const margin = score - threshold;
    const baseConfidence = 50; // Infrastructure estimates start at 50% confidence

    // Add up to 30% confidence based on margin above threshold
    const marginBonus = Math.min(30, (margin / 20) * 30);

    return Math.round(baseConfidence + marginBonus);
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
```

### Layer 2: Product-Technology Matching

```typescript
// lib/coverage/product-matcher.ts

export interface ProductAvailability {
  productId: string;
  productName: string;
  available: boolean;
  requiredTechnologies: ServiceType[];
  verificationStatus: 'confirmed' | 'estimated' | 'unavailable';
  confidence: number;
  availableTechnologies: ServiceType[];
  missingTechnologies: ServiceType[];
  alternativeProducts?: string[];
}

export class ProductTechnologyMatcher {
  /**
   * Match products to verified technologies at location
   */
  async matchProducts(
    coordinates: Coordinates,
    coverageResult: CoverageCheckResult
  ): Promise<ProductAvailability[]> {
    // Get all products from database
    const allProducts = await this.getAllProducts();
    const productAvailability: ProductAvailability[] = [];

    for (const product of allProducts) {
      const availability = this.checkProductAvailability(product, coverageResult);
      productAvailability.push(availability);
    }

    return productAvailability;
  }

  /**
   * Check if specific product is available at location
   */
  private checkProductAvailability(
    product: Product,
    coverageResult: CoverageCheckResult
  ): ProductAvailability {
    const requiredTechs = this.getProductRequiredTechnologies(product);
    const availableTechs: ServiceType[] = [];
    const missingTechs: ServiceType[] = [];

    let lowestConfidence = 100;
    let hasEstimates = false;

    // Check each required technology
    for (const requiredTech of requiredTechs) {
      const techAvailability = coverageResult.coverage.technologies.find(
        t => t.type === requiredTech
      );

      if (techAvailability && techAvailability.available) {
        availableTechs.push(requiredTech);

        // Track if any technology is estimated (not WMS-verified)
        if (techAvailability.source === 'infrastructure_estimated') {
          hasEstimates = true;
        }

        // Track lowest confidence
        lowestConfidence = Math.min(lowestConfidence, techAvailability.confidence);
      } else {
        missingTechs.push(requiredTech);
      }
    }

    // Product is available ONLY if ALL required technologies are available
    const available = missingTechs.length === 0;

    // Verification status based on data source
    let verificationStatus: ProductAvailability['verificationStatus'];
    if (!available) {
      verificationStatus = 'unavailable';
    } else if (hasEstimates) {
      verificationStatus = 'estimated';
    } else {
      verificationStatus = 'confirmed';
    }

    // Find alternatives if product unavailable
    const alternativeProducts = !available
      ? this.findAlternativeProducts(product, availableTechs)
      : undefined;

    return {
      productId: product.id,
      productName: product.name,
      available,
      requiredTechnologies: requiredTechs,
      verificationStatus,
      confidence: lowestConfidence,
      availableTechnologies: availableTechs,
      missingTechnologies: missingTechs,
      alternativeProducts
    };
  }

  /**
   * Get required technologies for a product
   */
  private getProductRequiredTechnologies(product: Product): ServiceType[] {
    // Product metadata should specify required technologies
    if (product.metadata?.requiredTechnologies) {
      return product.metadata.requiredTechnologies;
    }

    // Fallback: infer from product type
    if (product.type === 'fibre') return ['fibre'];
    if (product.type === '5g_home') return ['5g'];
    if (product.type === 'fixed_lte') return ['fixed_lte'];
    if (product.type === 'wireless') return ['uncapped_wireless', 'licensed_wireless'];

    return [];
  }

  /**
   * Find alternative products using available technologies
   */
  private findAlternativeProducts(
    unavailableProduct: Product,
    availableTechs: ServiceType[]
  ): string[] {
    // Logic to suggest alternative products based on available technologies
    // This would query products table for products matching available techs
    return [];
  }
}
```

### Layer 3: UI Presentation with Clear Indicators

```typescript
// components/coverage/CoverageResult.tsx

interface CoverageResultProps {
  result: CoverageCheckResult;
  products: ProductAvailability[];
}

export function CoverageResult({ result, products }: CoverageResultProps) {
  return (
    <div className="space-y-4">
      {/* Data Source Indicator */}
      <DataSourceBadge source={result.source} confidence={result.confidence} />

      {/* Fallback Warning (if applicable) */}
      {result.source === 'infrastructure_estimate' && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Estimated Coverage</AlertTitle>
          <AlertDescription>
            {result.fallbackReason}
            <br />
            <strong>Note:</strong> This is an estimate based on infrastructure analysis.
            Actual coverage may vary. We recommend contacting our team for verification.
          </AlertDescription>
        </Alert>
      )}

      {/* Products List */}
      <div className="space-y-2">
        <h3 className="font-semibold">Available Products</h3>

        {products.filter(p => p.available).map(product => (
          <ProductCard key={product.productId} product={product} />
        ))}

        {products.filter(p => !p.available).length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm text-muted-foreground">Currently Unavailable</h4>
            {products.filter(p => !p.available).map(product => (
              <UnavailableProductCard
                key={product.productId}
                product={product}
                alternatives={product.alternativeProducts}
              />
            ))}
          </div>
        )}
      </div>

      {/* Data Freshness Indicator */}
      <DataFreshnessIndicator
        timestamp={result.timestamp}
        validUntil={result.validUntil}
        dataAge={result.dataAge}
      />
    </div>
  );
}

function DataSourceBadge({ source, confidence }: { source: string; confidence: string }) {
  const badges = {
    'wms_realtime': {
      label: 'Real-Time Data',
      variant: 'success',
      icon: CheckCircle2,
      description: 'Verified with MTN live coverage map'
    },
    'wms_cache': {
      label: 'Recent Data',
      variant: 'default',
      icon: Clock,
      description: 'Data from recent coverage check'
    },
    'infrastructure_estimate': {
      label: 'Estimated',
      variant: 'warning',
      icon: AlertTriangle,
      description: 'Based on infrastructure analysis - verification recommended'
    }
  };

  const badge = badges[source as keyof typeof badges];

  return (
    <div className="flex items-center gap-2">
      <Badge variant={badge.variant as any}>
        <badge.icon className="w-3 h-3 mr-1" />
        {badge.label}
      </Badge>
      <span className="text-sm text-muted-foreground">{badge.description}</span>
    </div>
  );
}

function ProductCard({ product }: { product: ProductAvailability }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {product.productName}
          <Badge variant={product.verificationStatus === 'confirmed' ? 'success' : 'warning'}>
            {product.verificationStatus === 'confirmed' ? 'Verified' : 'Estimated'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Technology:</span>
            <span className="text-sm font-medium">
              {product.availableTechnologies.map(t => SERVICE_TYPE_MAPPING[t].name).join(', ')}
            </span>
          </div>

          {product.verificationStatus === 'estimated' && (
            <Alert variant="info" className="mt-2">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Availability estimated based on infrastructure analysis.
                Contact us to verify coverage at your exact address.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2 mt-3">
            <ProgressBar value={product.confidence} className="flex-1" />
            <span className="text-xs text-muted-foreground">{product.confidence}% confidence</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Layer 4: Monitoring & Validation

```typescript
// lib/coverage/fallback-monitor.ts

export class FallbackMonitoringService {
  private fallbackUsageMetrics = {
    totalChecks: 0,
    wmsSuccesses: 0,
    cacheHits: 0,
    fallbacksUsed: 0,
    fallbackAccuracy: [] as number[]
  };

  /**
   * Record coverage check result
   */
  recordCheck(result: CoverageCheckResult) {
    this.fallbackUsageMetrics.totalChecks++;

    switch (result.source) {
      case 'wms_realtime':
        this.fallbackUsageMetrics.wmsSuccesses++;
        break;
      case 'wms_cache':
        this.fallbackUsageMetrics.cacheHits++;
        break;
      case 'infrastructure_estimate':
        this.fallbackUsageMetrics.fallbacksUsed++;
        break;
    }

    // Alert if fallback usage is too high
    if (this.getFallbackRate() > 0.3) { // 30% threshold
      this.alertHighFallbackUsage();
    }
  }

  /**
   * Validate fallback accuracy when WMS becomes available
   */
  async validateFallbackAccuracy(
    coordinates: Coordinates,
    fallbackEstimate: CoverageCheckResult,
    actualWMSData: CoverageCheckResult
  ) {
    const accuracy = this.compareResults(fallbackEstimate, actualWMSData);
    this.fallbackUsageMetrics.fallbackAccuracy.push(accuracy);

    // Log significant discrepancies
    if (accuracy < 0.7) {
      console.warn('Low fallback accuracy detected:', {
        coordinates,
        accuracy,
        estimated: fallbackEstimate,
        actual: actualWMSData
      });
    }

    return accuracy;
  }

  private compareResults(estimated: CoverageCheckResult, actual: CoverageCheckResult): number {
    let matches = 0;
    let total = 0;

    for (const estTech of estimated.coverage.technologies) {
      const actualTech = actual.coverage.technologies.find(t => t.type === estTech.type);

      if (actualTech) {
        total++;
        if (estTech.available === actualTech.available) {
          matches++;
        }
      }
    }

    return total > 0 ? matches / total : 0;
  }

  getFallbackRate(): number {
    return this.fallbackUsageMetrics.totalChecks > 0
      ? this.fallbackUsageMetrics.fallbacksUsed / this.fallbackUsageMetrics.totalChecks
      : 0;
  }

  getAverageFallbackAccuracy(): number {
    const accuracies = this.fallbackUsageMetrics.fallbackAccuracy;
    return accuracies.length > 0
      ? accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
      : 0;
  }

  private alertHighFallbackUsage() {
    console.error('High fallback usage detected!', {
      fallbackRate: this.getFallbackRate(),
      totalChecks: this.fallbackUsageMetrics.totalChecks,
      fallbacksUsed: this.fallbackUsageMetrics.fallbacksUsed
    });

    // In production: send alert to monitoring service
  }
}
```

## Implementation Summary

### Priority 1: Real-Time Data (Always First)
1. **Always attempt WMS first** - never skip real-time check
2. **Use cache only when fresh** (< 5 minutes old)
3. **Clear indicators** when showing cached vs live data

### Priority 2: Product Matching
1. **Verify all required technologies** before showing product
2. **Clear verification status** (Confirmed vs Estimated vs Unavailable)
3. **Suggest alternatives** when products unavailable

### Priority 3: Fallback Safety
1. **Infrastructure estimate ONLY when WMS fails**
2. **Reduced confidence** for estimates (50-80% max)
3. **Short validity** for estimates (1 min vs 5 min for WMS)
4. **Clear warnings** in UI about estimate nature

### Priority 4: Monitoring
1. **Track fallback usage** - alert if >30%
2. **Validate accuracy** when possible
3. **Log discrepancies** for improvement

## Configuration

```typescript
// lib/coverage/config.ts

export const COVERAGE_CONFIG = {
  // Cache settings
  WMS_CACHE_TTL: 5 * 60 * 1000, // 5 minutes for WMS data
  ESTIMATE_VALIDITY: 60 * 1000, // 1 minute for estimates

  // Confidence thresholds
  WMS_REALTIME_CONFIDENCE: 95, // WMS real-time data
  WMS_CACHE_CONFIDENCE: 90, // Recent WMS cache
  INFRASTRUCTURE_BASE_CONFIDENCE: 50, // Infrastructure estimates start here
  MIN_PRODUCT_CONFIDENCE: 70, // Minimum to show product as "available"

  // Technology thresholds (infrastructure score needed)
  TECHNOLOGY_THRESHOLDS: {
    fibre: 75,
    '5g': 70,
    fixed_lte: 45,
    uncapped_wireless: 60,
    licensed_wireless: 50,
    lte: 40,
    '3g_2100': 30,
    '3g_900': 25,
    '2g': 15
  },

  // Monitoring
  MAX_FALLBACK_RATE: 0.3, // Alert if >30% of checks use fallback
  MIN_FALLBACK_ACCURACY: 0.7 // Alert if accuracy <70%
};
```

## Testing Strategy

### 1. Real-Time Validation Test
```typescript
// Test that WMS is always attempted first
test('Always attempts WMS before fallback', async () => {
  const service = new RealtimeCoverageService();
  const spy = jest.spyOn(service, 'checkWMSRealtime');

  await service.checkCoverage({ lat: -26.2041, lng: 28.0473 });

  expect(spy).toHaveBeenCalledFirst();
});
```

### 2. Product Matching Test
```typescript
// Test that products match verified technologies
test('Only shows products with confirmed technologies', async () => {
  const coverageResult: CoverageCheckResult = {
    source: 'infrastructure_estimate',
    confidence: 'low',
    coverage: {
      technologies: [
        { type: 'fibre', available: false, source: 'infrastructure_estimated' },
        { type: '5g', available: true, source: 'infrastructure_estimated' }
      ]
    }
  };

  const matcher = new ProductTechnologyMatcher();
  const products = await matcher.matchProducts(coords, coverageResult);

  const fibreProduct = products.find(p => p.requiredTechnologies.includes('fibre'));
  expect(fibreProduct.available).toBe(false);
  expect(fibreProduct.verificationStatus).toBe('unavailable');
});
```

### 3. Staleness Detection Test
```typescript
// Test that stale cache is rejected
test('Rejects stale cached data', async () => {
  const service = new RealtimeCoverageService();
  const staleCache = {
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min old
    coverage: { /* ... */ }
  };

  const result = await service.checkCoverage(coords);
  expect(result.source).not.toBe('wms_cache');
});
```

## Deployment Plan

### Phase 1: Implementation (Week 1)
- [ ] Implement RealtimeCoverageService
- [ ] Add ProductTechnologyMatcher
- [ ] Create UI components with indicators
- [ ] Add monitoring service

### Phase 2: Testing (Week 1)
- [ ] Unit tests for all services
- [ ] Integration tests for fallback chain
- [ ] E2E tests for UI indicators
- [ ] Load testing for performance

### Phase 3: Gradual Rollout (Week 2)
- [ ] Deploy to staging with monitoring
- [ ] 10% production traffic
- [ ] Validate fallback accuracy
- [ ] 50% production traffic
- [ ] Full rollout

### Phase 4: Optimization (Ongoing)
- [ ] Tune infrastructure thresholds based on accuracy data
- [ ] Improve product matching algorithms
- [ ] Enhance UI based on user feedback

This ensures **infrastructure fallback enhances reliability without compromising accuracy** by always prioritizing real-time data and clearly indicating when estimates are used.

# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-09-24-mtn-dfa-coverage-integration/spec.md

> Created: 2025-09-24
> Version: 1.0.0

## Endpoints

### POST /supabase/functions/enhanced-multi-provider-coverage

**Purpose:** Enhanced coverage checking across MTN, DFA, and CircleTel providers with WMS and ArcGIS integration
**Parameters:**
```typescript
{
  lat: number;           // Latitude coordinate (-90 to 90)
  lng: number;          // Longitude coordinate (-180 to 180)
  address: string;      // Full address string for geocoding fallback
  userType: 'consumer' | 'business'; // Determines feature set and response detail
  technologies?: string[]; // Optional filter: ['FIBRE', '4G', '5G', 'FIXED_WIRELESS']
  cacheStrategy?: 'prefer_cache' | 'force_refresh'; // Cache behavior control
}
```

**Response:**
```typescript
{
  address: string;
  coordinates: { lat: number; lng: number; };
  userType: 'consumer' | 'business';
  timestamp: string; // ISO 8601 format
  processingTime: number; // milliseconds

  overall: {
    hasAnyConcentration: boolean;
    availableTechnologies: string[];
    bestProvider: string;
    confidence: number; // 0-100 confidence score
    recommendedPlan: string;
    estimatedMonthlyCost?: number; // business only
  };

  providers: Array<{
    name: 'MTN' | 'DFA' | 'CircleTel';
    technologies: string[];
    hasConcentration: boolean;
    confidence: number;
    coverageStrength: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'None';
    availablePackages: string[];
    wmsFeatures?: object; // MTN WMS layer data
    arcgisFeatures?: object; // DFA ArcGIS feature data
    estimatedInstallTime: number; // days
    signalStrength?: number; // dBm for mobile providers
    buildingStatus?: 'Connected' | 'Near' | 'Planned' | 'Not Available'; // fibre providers
  }>;

  businessFeatures?: { // only for userType: 'business'
    slaOptions: string[];
    supportTiers: string[];
    customQuoteAvailable: boolean;
    multiSiteDiscount?: number;
  };

  cacheInfo: {
    cacheHit: boolean;
    dataAge: number; // seconds since cache creation
    expiresIn: number; // seconds until cache expires
  };
}
```

**Errors:**
- `400 Bad Request`: Missing required parameters (lat, lng, address, userType)
- `422 Unprocessable Entity`: Invalid coordinates or address format
- `429 Too Many Requests`: Rate limit exceeded for provider APIs
- `502 Bad Gateway`: One or more provider APIs unavailable
- `503 Service Unavailable`: PostGIS spatial indexing temporarily unavailable
- `500 Internal Server Error`: Unexpected processing error

### POST /supabase/functions/batch-coverage-check

**Purpose:** Business multi-site coverage analysis with parallel processing
**Parameters:**
```typescript
{
  addresses: Array<{
    id: string;        // Client-provided identifier
    address: string;   // Full address string
    lat?: number;      // Optional pre-geocoded coordinates
    lng?: number;
    priority?: 'high' | 'medium' | 'low'; // Processing priority
  }>;
  reportFormat: 'summary' | 'detailed' | 'executive';
  technologies?: string[]; // Filter for specific technologies
  slaRequirements?: {
    uptime: string;    // e.g., "99.9%"
    support: string;   // e.g., "24/7"
    response: string;  // e.g., "4 hours"
  };
}
```

**Response:**
```typescript
{
  batchId: string; // Unique identifier for this batch job
  totalSites: number;
  completedSites: number;
  failedSites: number;
  processingTime: number; // total milliseconds

  summary: {
    sitesWithFibre: number;
    sitesWithMobile: number;
    sitesWithMultiProvider: number;
    recommendedStrategy: string;
    estimatedMonthlyCost: number;
    estimatedSetupCost: number;
  };

  sites: Array<{
    id: string;
    address: string;
    coordinates: { lat: number; lng: number; };
    overallScore: number; // 0-100
    bestProvider: string;
    availableTechnologies: string[];
    recommendedPackage: string;
    monthlyCost: number;
    setupCost: number;
    installationTime: number; // days
    providers: Array<ProviderResult>; // Same structure as single coverage check
  }>;

  reportUrl?: string; // URL to generated PDF report
  exportOptions: {
    pdf: boolean;
    excel: boolean;
    csv: boolean;
  };
}
```

**Errors:**
- `400 Bad Request`: Invalid address format or missing required fields
- `413 Payload Too Large`: Too many addresses (limit: 50 for batch processing)
- `429 Too Many Requests`: Batch processing quota exceeded
- `500 Internal Server Error`: Batch processing failure

### GET /supabase/functions/coverage-cache-status

**Purpose:** Check cache status and coverage data freshness for performance optimization
**Parameters:**
```typescript
{
  lat: number;
  lng: number;
  buffer?: number; // Search radius in meters (default: 100m)
  provider?: 'MTN' | 'DFA' | 'CircleTel'; // Check specific provider cache
}
```

**Response:**
```typescript
{
  cacheHit: boolean;
  lastUpdated: string; // ISO 8601 timestamp
  dataAge: number; // seconds since last update
  needsRefresh: boolean; // true if data is stale
  coverageRadius: number; // meters of cached coverage data
  providers: string[]; // which providers have cached data
  confidence: number; // 0-100 reliability score of cached data
  spatialAccuracy: number; // meters of geographic precision
}
```

**Errors:**
- `400 Bad Request`: Invalid coordinates
- `404 Not Found`: No cache data available for location
- `500 Internal Server Error`: Cache system unavailable

### POST /supabase/functions/coverage-report-generator

**Purpose:** Generate formatted coverage reports for business customers
**Parameters:**
```typescript
{
  batchId?: string; // Reference to existing batch check
  coverageData?: object; // Direct coverage data for single reports
  reportType: 'technical' | 'executive' | 'proposal';
  branding: {
    customerName: string;
    customerLogo?: string; // Base64 or URL
    includeCircleTelBranding: boolean;
  };
  customizations?: {
    highlightTechnologies?: string[];
    includeAlternatives?: boolean;
    includePricing?: boolean;
  };
}
```

**Response:**
```typescript
{
  reportId: string;
  reportUrl: string; // URL to downloadable PDF
  generationTime: number; // milliseconds
  expiresAt: string; // ISO 8601 timestamp
  reportMetadata: {
    pageCount: number;
    fileSize: number; // bytes
    format: 'PDF';
    includedSections: string[];
  };
}
```

**Errors:**
- `400 Bad Request`: Missing batchId or coverageData
- `404 Not Found`: Referenced batch data not found
- `500 Internal Server Error`: PDF generation failed

## Controllers

### Enhanced Multi-Provider Coverage Controller

**Location:** `supabase/functions/enhanced-multi-provider-coverage/index.ts`

**Responsibilities:**
- Coordinate parallel queries to MTN, DFA, and CircleTel APIs
- Handle WMS and ArcGIS spatial data integration
- Implement intelligent caching strategy with PostGIS indexing
- Provide confidence scoring and recommendation engine
- Return structured coverage comparison data

**Key Methods:**
```typescript
async function processLocationRequest(params: CoverageRequest): Promise<CoverageResponse>
async function queryMTNWMS(coordinates: Coordinates): Promise<MTNResult>
async function queryDFAArcGIS(coordinates: Coordinates): Promise<DFAResult>
async function queryCircleTelCoverage(coordinates: Coordinates): Promise<CircleTelResult>
async function calculateConfidenceScore(results: ProviderResult[]): Promise<number>
async function generateRecommendations(results: ProviderResult[], userType: string): Promise<Recommendation>
```

### Batch Coverage Controller

**Location:** `supabase/functions/batch-coverage-check/index.ts`

**Responsibilities:**
- Process multiple addresses in parallel with throttling
- Generate comprehensive multi-site coverage reports
- Handle business-specific SLA requirements
- Provide cost analysis and deployment recommendations

**Key Methods:**
```typescript
async function processBatchRequest(addresses: BatchRequest): Promise<BatchResponse>
async function parallelCoverageCheck(addresses: Address[], concurrency: number): Promise<SiteResult[]>
async function generateCostAnalysis(sites: SiteResult[]): Promise<CostAnalysis>
async function createDeploymentStrategy(sites: SiteResult[]): Promise<DeploymentPlan>
```

### Coverage Cache Controller

**Location:** `supabase/functions/coverage-cache-status/index.ts`

**Responsibilities:**
- Manage PostGIS spatial cache queries
- Provide cache freshness and reliability metrics
- Handle cache invalidation strategies
- Optimize spatial indexing performance

**Key Methods:**
```typescript
async function checkCacheStatus(coordinates: Coordinates): Promise<CacheStatus>
async function validateCacheData(cachedResult: CacheEntry): Promise<ValidationResult>
async function refreshSpatialIndex(coordinates: Coordinates): Promise<void>
```

### Report Generator Controller

**Location:** `supabase/functions/coverage-report-generator/index.ts`

**Responsibilities:**
- Generate PDF reports with customer branding
- Create executive, technical, and proposal formats
- Handle report customization and export options
- Manage report storage and access URLs

**Key Methods:**
```typescript
async function generatePDFReport(data: ReportData, format: ReportType): Promise<ReportResult>
async function applyCustomerBranding(report: Report, branding: BrandingOptions): Promise<Report>
async function uploadReportToStorage(report: Buffer): Promise<string>
```
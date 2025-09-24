# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-24-mtn-dfa-coverage-integration/spec.md

> Created: 2025-09-24
> Version: 1.0.0

## Technical Requirements

### Frontend Components (React + TypeScript)
- **Enhanced Coverage Map Component** - Upgrade existing `EnhancedCoverageCheck.tsx` with ArcGIS JS API integration for WMS layer support, enabling MTN coverage visualization alongside existing DFA data
- **Provider Comparison Interface** - New `ProviderComparisonPanel.tsx` component with side-by-side coverage analysis, interactive filtering by technology type (4G/5G/Fibre), and real-time signal strength indicators
- **Business Multi-Site Manager** - New `BusinessCoverageManager.tsx` component with batch address input, parallel coverage checking, progress indicators, and exportable PDF report generation
- **Consumer Quick Check Widget** - Enhanced version of existing quick check with instant results display, package recommendations, and streamlined "Sign Up Now" workflow

### API Integration Layer
- **MTN WMS Client Service** - New service class `MTNWMSService.ts` for querying MTN coverage map WMS endpoints with session management, coordinate transformation, and signal strength interpretation
- **Enhanced DFA ArcGIS Client** - Upgrade existing `DFAArcGISService.ts` with full ArcGIS REST API integration, spatial query capabilities, and connected building status verification
- **Coverage Result Aggregator** - Enhanced `multiProviderCoverage.ts` service with intelligent merging of MTN WMS and DFA ArcGIS responses, confidence scoring, and recommendation engine
- **Rate Limiting Manager** - New `APIRateLimitService.ts` with request throttling, retry logic with exponential backoff, and provider-specific quota management

### Performance Optimizations
- **Multi-tier Caching Strategy** - Memory cache (React Query) → IndexedDB (client-side persistence) → Supabase PostGIS (server-side spatial cache) with intelligent TTL management
- **Parallel Query Processing** - Concurrent provider API calls with Promise.all() implementation supporting 6+ simultaneous requests with timeout handling
- **Spatial Indexing Enhancement** - PostGIS-based coverage area pre-computation with R-tree indexing for sub-second geographic lookups
- **Progressive Loading Implementation** - Staged result display with skeleton loaders, incremental data population, and smooth transitions using Framer Motion

### User Experience Enhancements
- **Smart Loading States** - Progressive indicators showing individual provider status with estimated completion times and real-time progress updates
- **Comprehensive Error Handling** - Graceful degradation when MTN/DFA APIs are unavailable with fallback to cached data and user-friendly error messages
- **WCAG 2.1 AA Compliance** - Full accessibility support with screen reader optimization, keyboard navigation, and high contrast mode support
- **Mobile-First Responsiveness** - Touch-optimized map interactions using ArcGIS mobile gestures and responsive design patterns from existing design system

### Integration with Existing Systems
- **Supabase Edge Function Enhancement** - Extend existing `multi-provider-coverage` function with MTN WMS proxy capabilities and enhanced DFA integration
- **Design System Compliance** - All new components follow CircleTel atomic design patterns using existing design tokens and component library
- **CI/CD Compatibility** - Components designed for existing Playwright testing framework with visual regression baseline updates
- **Admin System Integration** - Coverage data accessible in admin dashboard for business customer support and sales team analysis

## Approach

### Phase 1: MTN WMS Integration (Week 1)
1. **WMS Service Implementation**
   - Create `MTNWMSService.ts` with GetCapabilities parsing
   - Implement coordinate transformation (WGS84 ↔ Web Mercator)
   - Build session management with authentication token handling
   - Add signal strength interpretation logic

2. **Enhanced DFA Integration**
   - Upgrade existing DFA service to full ArcGIS REST API
   - Implement spatial query capabilities for building footprints
   - Add connected/near-net status verification
   - Integrate real-time building status updates

### Phase 2: Coverage Aggregation Engine (Week 2)
1. **Multi-Provider Service Enhancement**
   - Enhance `multiProviderCoverage.ts` with parallel processing
   - Implement confidence scoring algorithm
   - Build recommendation engine based on coverage quality
   - Add intelligent caching with PostGIS spatial indexing

2. **Rate Limiting and Performance**
   - Implement `APIRateLimitService.ts` with provider-specific quotas
   - Add retry logic with exponential backoff
   - Build connection pooling for database operations
   - Optimize spatial queries with R-tree indexing

### Phase 3: Frontend Component Development (Week 3)
1. **Enhanced Coverage Map Component**
   - Upgrade existing component with ArcGIS JS API 4.x
   - Implement WMS layer support for MTN coverage
   - Add interactive provider toggle controls
   - Build real-time signal strength visualization

2. **Provider Comparison Interface**
   - Create `ProviderComparisonPanel.tsx` with side-by-side layout
   - Implement technology filtering (4G/5G/Fibre)
   - Add coverage quality indicators
   - Build export functionality for coverage reports

### Phase 4: Business Features & UX Polish (Week 4)
1. **Business Multi-Site Manager**
   - Create `BusinessCoverageManager.tsx` component
   - Implement batch address processing with progress indicators
   - Build PDF report generation with company branding
   - Add CSV export functionality for bulk analysis

2. **Consumer Experience Enhancement**
   - Enhance existing quick check widget
   - Implement instant results with skeleton loading
   - Add package recommendation engine
   - Build streamlined signup flow integration

## External Dependencies

### API Dependencies
- **MTN Coverage WMS Service**
  - Endpoint: `https://coverage.mtn.co.za/wms`
  - Authentication: API key required
  - Rate limits: 1000 requests/hour
  - Response format: WMS GetMap/GetFeatureInfo
  - Coordinate systems: EPSG:4326, EPSG:3857

- **DFA ArcGIS REST API**
  - Endpoint: `https://services.arcgis.com/dfa/coverage`
  - Authentication: OAuth 2.0 token
  - Rate limits: 500 requests/minute
  - Response format: JSON with spatial geometries
  - Coverage types: Connected, Near-net, Planned

### Technology Stack Additions
- **ArcGIS API for JavaScript 4.28+**
  - Purpose: Advanced mapping capabilities and WMS layer support
  - Bundle size impact: ~2MB (lazy loaded)
  - Browser compatibility: Modern browsers with WebGL support

- **PostGIS 3.3+**
  - Purpose: Spatial indexing and geometric operations
  - Database extension for Supabase PostgreSQL
  - Enables sub-second spatial queries for coverage areas

- **Framer Motion 10+**
  - Purpose: Smooth transitions and loading animations
  - Bundle size: ~50KB gzipped
  - Used for progressive loading states and map interactions

### Development Tools
- **ArcGIS TypeScript Definitions**
  - Package: `@types/arcgis-js-api`
  - Version: 4.28+
  - Required for TypeScript integration

- **PostGIS Type Extensions**
  - Package: `@types/geojson`
  - Version: 1.0+
  - Required for spatial data type definitions

### Performance Considerations
- **Memory Management**
  - ArcGIS map instances require explicit cleanup
  - Implement component unmount handlers
  - Monitor WebGL context limits on mobile devices

- **Network Optimization**
  - WMS tile requests can be bandwidth intensive
  - Implement intelligent zoom-level caching
  - Use progressive JPEG for coverage overlay tiles

- **Database Performance**
  - PostGIS spatial indexes require regular maintenance
  - Monitor query execution plans for optimization opportunities
  - Consider partitioning for large coverage datasets

### Security Requirements
- **API Key Management**
  - MTN API keys stored in Supabase Vault
  - Rotation schedule: Every 90 days
  - Environment-specific keys for dev/staging/production

- **Cross-Origin Resource Sharing**
  - Configure CORS policies for MTN WMS endpoints
  - Implement proxy through Supabase Edge Functions if needed
  - Validate all external API responses

- **Data Privacy**
  - Coverage queries logged for analytics (anonymized)
  - User location data not stored permanently
  - Compliance with POPIA regulations for SA users
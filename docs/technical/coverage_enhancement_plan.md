# CircleTel Coverage Check Enhancement Plan

## Overview
Integration of advanced coverage checking capabilities from the MTN coverage checker into CircleTel's existing infrastructure to create a comprehensive high-speed internet availability checking system.

## User Journey 4.1: High-Speed Internet Availability Check

### Purpose
To determine the availability of high-speed internet services at a specific location, ensuring users don't waste time exploring packages that aren't applicable to them.

### Enhanced Acceptance Criteria
- ✅ I can enter my address using intelligent autocomplete
- ✅ I can use geolocation to determine my location automatically
- ✅ The system checks multiple provider databases for comprehensive coverage
- ✅ I can visualize coverage on an interactive map
- ✅ If covered, I see available packages with pricing and speeds
- ✅ If not covered, my details are registered as a lead in Zoho CRM
- ✅ The sales team is automatically notified of new leads
- ✅ I can proceed to plan selection and ordering if coverage exists

## Technical Implementation Strategy

### Phase 1: Enhanced Address Input & Geolocation
**Components to Integrate:**
- `AddressInput.tsx` from MTN checker (Google Places integration)
- Enhanced geolocation with reverse geocoding
- Real-time address validation

**Improvements:**
```typescript
// Enhanced address input with multiple providers
interface EnhancedAddressInput {
  // Google Places API for autocomplete
  googlePlaces: boolean;
  // Geolocation API for current location
  geolocation: boolean;
  // Support for business name search
  businessSearch: boolean;
  // Province/city quick select
  quickSelect: string[];
}
```

### Phase 2: Multi-Provider Coverage Engine
**Current:** DFA FTTB only
**Enhanced:** Multiple technology types and providers

```typescript
interface CoverageProvider {
  name: string;
  technologies: TechnologyType[];
  checkCoverage: (lat: number, lng: number) => Promise<CoverageResult>;
}

type TechnologyType =
  | 'FIBRE'           // Fibre to the Building
  | 'FIXED_WIRELESS'  // SkyFibre/Fixed Wireless
  | 'LTE'             // 4G/5G mobile
  | 'SATELLITE'       // Starlink/satellite
  | 'ADSL';           // Legacy copper

const providers: CoverageProvider[] = [
  { name: 'DFA', technologies: ['FIBRE'] },
  { name: 'Openserve', technologies: ['FIBRE'] },
  { name: 'Vuma', technologies: ['FIBRE'] },
  { name: 'CircleTel_Wireless', technologies: ['FIXED_WIRELESS', 'LTE'] },
];
```

### Phase 3: Interactive Coverage Visualization
**Integration:** Google Maps with coverage overlays

```typescript
interface CoverageMapProps {
  result: MultiProviderCoverageResult;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  activeTechnologies: ToggleState;
  onToggleTechnology: (tech: TechnologyType, enabled: boolean) => void;
}

// Technology filter toggles
const technologyFilters = {
  'FIBRE': { color: '#10B981', label: 'Fibre' },
  'FIXED_WIRELESS': { color: '#F59E0B', label: 'SkyFibre' },
  'LTE': { color: '#3B82F6', label: '4G/5G' },
  'SATELLITE': { color: '#8B5CF6', label: 'Satellite' }
};
```

### Phase 4: Package Selection & Pricing
**Integration:** Dynamic package loading based on coverage

```typescript
interface ServicePackage {
  id: string;
  name: string;
  technology: TechnologyType;
  provider: string;
  speed: string;           // "100Mbps", "1Gbps"
  price: number;          // Monthly price in ZAR
  installation: number;   // Installation cost
  contract: number;       // Contract months
  features: string[];     // ["Uncapped", "Static IP", "24/7 Support"]
  available: boolean;     // Based on coverage check
}

// Dynamic package filtering
const getAvailablePackages = (coverageResult: CoverageResult): ServicePackage[] => {
  return packages.filter(pkg =>
    coverageResult.technologies.includes(pkg.technology) &&
    coverageResult.providers.includes(pkg.provider)
  );
};
```

### Phase 5: Enhanced Lead Management
**Current:** Basic Zoho lead creation
**Enhanced:** Intelligent lead scoring and routing

```typescript
interface EnhancedLeadData {
  // Contact info
  name: string;
  email: string;
  phone: string;
  company?: string;

  // Location data
  address: string;
  coordinates: { lat: number; lng: number };

  // Coverage context
  requestedTechnologies: TechnologyType[];
  availableTechnologies: TechnologyType[];
  hasPartialCoverage: boolean;

  // Business context
  estimatedValue: number;
  urgency: 'low' | 'medium' | 'high';
  source: 'coverage_check' | 'contact_form' | 'chat';

  // Routing
  assignedTeam: 'wireless' | 'fibre' | 'enterprise' | 'residential';
}

// Intelligent lead scoring
const calculateLeadScore = (lead: EnhancedLeadData): number => {
  let score = 0;

  // Coverage availability boosts score
  if (lead.hasPartialCoverage) score += 30;
  if (lead.availableTechnologies.includes('FIBRE')) score += 40;

  // Business indicators
  if (lead.company) score += 20;
  if (lead.estimatedValue > 1000) score += 30;

  // Urgency factor
  if (lead.urgency === 'high') score += 25;

  return Math.min(score, 100);
};
```

## Integration Components

### 1. Enhanced Coverage Check Component
```typescript
// src/components/coverage/EnhancedCoverageCheck.tsx
interface EnhancedCoverageCheckProps {
  // Display mode
  mode: 'embedded' | 'fullpage' | 'modal';

  // Pre-fill data
  initialAddress?: string;
  initialCoordinates?: { lat: number; lng: number };

  // Technology focus
  focusTechnologies?: TechnologyType[];

  // Callbacks
  onCoverageFound?: (result: CoverageResult, packages: ServicePackage[]) => void;
  onLeadCreated?: (lead: EnhancedLeadData) => void;
  onOrderStarted?: (package: ServicePackage) => void;
}
```

### 2. Multi-Provider Coverage Service
```typescript
// src/services/multiProviderCoverage.ts
class MultiProviderCoverageService {
  private providers: CoverageProvider[];

  async checkAllProviders(
    lat: number,
    lng: number,
    address: string
  ): Promise<MultiProviderCoverageResult> {
    const results = await Promise.allSettled(
      this.providers.map(provider =>
        provider.checkCoverage(lat, lng)
      )
    );

    return this.aggregateResults(results, address);
  }

  private aggregateResults(
    results: PromiseSettledResult<CoverageResult>[],
    address: string
  ): MultiProviderCoverageResult {
    // Combine results from all providers
    // Determine best available options
    // Calculate coverage confidence score
  }
}
```

### 3. Package Management System
```typescript
// src/services/packageService.ts
class PackageService {
  async getAvailablePackages(
    coverage: CoverageResult,
    filters?: PackageFilters
  ): Promise<ServicePackage[]> {
    const packages = await this.loadPackages();

    return packages
      .filter(pkg => this.isAvailable(pkg, coverage))
      .filter(pkg => this.matchesFilters(pkg, filters))
      .sort(this.sortByRecommendation);
  }

  private sortByRecommendation(a: ServicePackage, b: ServicePackage): number {
    // Sort by value for money, technology preference, etc.
  }
}
```

## User Experience Flow

### 1. Landing Experience
```
┌─────────────────────────────────────┐
│          Coverage Check             │
│                                     │
│  🏠 [Enter your address...]         │
│     📍 Use current location         │
│                                     │
│     Quick locations:                │
│     [Johannesburg] [Cape Town]      │
│     [Durban] [Pretoria]             │
│                                     │
│  [🔍 Check Coverage]                │
└─────────────────────────────────────┘
```

### 2. Coverage Results
```
┌─────────────────────────────────────┐
│  ✅ Great! We found coverage        │
│                                     │
│  📍 123 Business Park, Sandton     │
│                                     │
│  Available Technologies:            │
│  🔵 Fibre (3 providers)            │
│  🟡 SkyFibre (Available)           │
│  🟢 4G/5G (Excellent)              │
│                                     │
│  📊 [View on Map] [See Packages]   │
└─────────────────────────────────────┘
```

### 3. Package Selection
```
┌─────────────────────────────────────┐
│           Available Packages        │
│                                     │
│  🥇 RECOMMENDED                     │
│  BizFibreConnect 100Mbps            │
│  R899/month • Free installation     │
│  [Select Package]                   │
│                                     │
│  SkyFibre 50Mbps                    │
│  R699/month • Quick setup           │
│  [Select Package]                   │
│                                     │
│  [Compare All] [Contact Sales]      │
└─────────────────────────────────────┘
```

### 4. No Coverage Flow
```
┌─────────────────────────────────────┐
│  ❌ No direct coverage found        │
│                                     │
│  📍 123 Remote Road, Kleinmond     │
│                                     │
│  Don't worry! We're expanding.      │
│  Leave your details and we'll       │
│  notify you when coverage arrives.  │
│                                     │
│  [📝 Join Waiting List]            │
│  [🔍 Explore Alternatives]         │
└─────────────────────────────────────┘
```

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Set up multi-provider coverage service architecture
- [ ] Integrate Google Places API for enhanced address input
- [ ] Create coverage result aggregation logic

### Week 3-4: Visualization
- [ ] Implement interactive Google Maps component
- [ ] Add technology filter toggles
- [ ] Create coverage overlay system

### Week 5-6: Package Management
- [ ] Build dynamic package loading system
- [ ] Implement package recommendation engine
- [ ] Create package comparison interface

### Week 7-8: Lead Enhancement
- [ ] Enhance Zoho integration with lead scoring
- [ ] Implement intelligent team routing
- [ ] Add automated follow-up workflows

### Week 9-10: Testing & Optimization
- [ ] Comprehensive testing across scenarios
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Analytics integration

## Success Metrics

### Conversion Metrics
- **Coverage Check Completion Rate**: >85%
- **Lead Conversion Rate**: >15% (from no coverage)
- **Package Selection Rate**: >60% (from coverage found)
- **Order Completion Rate**: >40% (from package selection)

### User Experience Metrics
- **Time to Coverage Result**: <3 seconds
- **Address Recognition Accuracy**: >95%
- **Mobile Usability Score**: >90%
- **Customer Satisfaction**: >4.5/5

### Business Impact
- **Lead Quality Score**: Increase by 40%
- **Sales Team Efficiency**: Reduce qualification time by 50%
- **Coverage Accuracy**: >98% correlation with actual availability
- **Customer Acquisition Cost**: Reduce by 25%

## Technical Requirements

### Infrastructure
- Google Maps API with Places & Geocoding
- Real-time coverage database APIs
- Caching layer for performance
- Analytics tracking

### Integrations
- Zoho CRM for lead management
- Supabase for data storage
- Existing CircleTel services
- Payment processing (future)

### Security & Compliance
- POPIA compliant data handling
- Secure API key management
- Rate limiting and abuse prevention
- Privacy-first location handling

## Conclusion

This enhanced coverage check system will transform CircleTel's user experience by providing:

1. **Comprehensive Coverage Intelligence**: Multi-provider, multi-technology checking
2. **Interactive Visualization**: Maps and filters for better understanding
3. **Intelligent Lead Management**: Smart routing and scoring
4. **Seamless Package Selection**: From coverage to purchase
5. **Mobile-First Experience**: Optimized for all devices

The integration leverages the best features from the MTN coverage checker while maintaining CircleTel's brand identity and existing Zoho CRM workflows, creating a world-class coverage checking experience that drives conversions and improves customer satisfaction.
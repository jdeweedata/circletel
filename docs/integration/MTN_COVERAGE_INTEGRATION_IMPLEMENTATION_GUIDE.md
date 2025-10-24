# MTN API Coverage Integration - Implementation Guide
## Phases 3-8 Detailed Instructions

**Status**: Phases 1-2 Complete ✅
**Date**: October 20, 2025
**Remaining**: Phases 3-8

---

## ✅ Completed Work (Phases 1-2)

### Phase 1: MTN Wholesale API Client ✅
**Files Created:**
- ✅ `lib/coverage/mtn/wholesale-client.ts` - Complete client with caching
- ✅ `lib/coverage/mtn/wholesale-types.ts` - TypeScript types

**Features:**
- Product fetching with 1-hour cache
- Feasibility checking for multiple products
- Automatic product-to-category mapping
- Error handling and timeouts (30s)
- Singleton pattern for efficiency

**Product Mappings:**
- FTTH products → `fibre` category (Fibre to the Home)
- Fixed Wireless → `wireless` category (SkyFibre)
- Cloud Connect/Ethernet → `connectivity` category

### Phase 2: Database Migration ✅
**File Created:**
- ✅ `supabase/migrations/20251020120000_add_mtn_wholesale_mappings.sql`

**Mappings Added:**
```sql
-- Consumer (existing/verified)
'5G' → '5g'
'LTE' → 'lte'
'FixedLTE' → 'fixed_lte'

-- Wholesale (new)
'Fixed Wireless Broadband' → 'wireless' (SkyFibre)
'Wholesale FTTH FNO' → 'fibre' (FTTH)
'Wholesale FTTH (MNS)' → 'fibre' (FTTH)
'Wholesale Cloud Connect' → 'connectivity'
'Wholesale Access Connect' → 'connectivity'
'Wholesale Ethernet Wave Leased Line' → 'connectivity'
'Wholesale Cloud Connect Lite' → 'connectivity'
```

**Apply Migration:**
```bash
# Use Supabase Dashboard SQL Editor (most reliable)
# Or via CLI:
supabase db push
```

---

## 📋 Phase 3: Update Coverage Aggregation Service

### File to Modify
`lib/coverage/aggregation-service.ts`

### Changes Required

#### 1. Add UserType Parameter
```typescript
// Add to imports at top
import { mtnWholesaleClient } from './mtn/wholesale-client';
import { MTNWholesaleCoverageResult } from './mtn/wholesale-types';

// Update CoverageAggregationOptions interface (around line 42)
export interface CoverageAggregationOptions {
  providers?: CoverageProvider[];
  serviceTypes?: ServiceType[];
  includeAlternatives?: boolean;
  prioritizeSpeed?: boolean;
  prioritizeReliability?: boolean;
  userType?: 'consumer' | 'business'; // ADD THIS LINE
}
```

#### 2. Update getCoverageFromProvider Method
Find the `getCoverageFromProvider` method (around line 144) and update it:

```typescript
private async getCoverageFromProvider(
  provider: CoverageProvider,
  coordinates: Coordinates,
  serviceTypes?: ServiceType[],
  userType?: 'consumer' | 'business' // ADD THIS PARAMETER
): Promise<any> {
  if (provider === 'mtn') {
    // Decide which API to use based on userType
    if (userType === 'business') {
      // Use Wholesale API for business users
      return this.getMTNWholesaleCoverage(coordinates);
    } else {
      // Use Consumer API for consumer users (default)
      return this.getMTNConsumerCoverage(coordinates, serviceTypes);
    }
  }

  // ... rest of existing code for other providers
}
```

#### 3. Add New Method: getMTNWholesaleCoverage
Add this new method to the class (after `getCoverageFromProvider`):

```typescript
/**
 * Get MTN Wholesale coverage for business users
 */
private async getMTNWholesaleCoverage(
  coordinates: Coordinates
): Promise<any> {
  try {
    const result: MTNWholesaleCoverageResult =
      await mtnWholesaleClient.checkFeasibility(coordinates);

    if (!result.available || result.error) {
      return {
        available: false,
        confidence: 'low' as const,
        services: [],
        error: result.error
      };
    }

    // Convert wholesale products to service coverage format
    const services = result.products
      .filter(p => p.feasible)
      .map(product => ({
        type: this.mapWholesaleToServiceType(product.productCategory),
        available: true,
        signal: 'good' as const, // Wholesale doesn't provide signal strength
        provider: 'mtn' as CoverageProvider,
        technology: product.name,
        metadata: {
          capacity: product.capacity,
          region: product.region,
          notes: product.notes,
          wholesaleProduct: product.name
        }
      }));

    return {
      available: services.length > 0,
      confidence: 'high' as const,
      services,
      metadata: {
        source: 'mtn_wholesale_api',
        responseTime: result.responseTime,
        productsChecked: result.products.length
      }
    };
  } catch (error) {
    console.error('MTN Wholesale coverage check failed:', error);
    return {
      available: false,
      confidence: 'low' as const,
      services: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Map wholesale product category to ServiceType
 */
private mapWholesaleToServiceType(
  category: 'fibre' | 'wireless' | 'connectivity'
): ServiceType {
  const mapping: Record<string, ServiceType> = {
    'fibre': 'fibre',
    'wireless': 'uncapped_wireless',
    'connectivity': 'fibre' // Connectivity products often delivered via fibre
  };
  return mapping[category] || 'fibre';
}
```

#### 4. Update getMTNConsumerCoverage Method
Find the existing `getMTNConsumerCoverage` method and ensure it's named correctly (it might be named differently). The method should handle consumer API calls (5G, LTE, Fixed LTE).

#### 5. Update aggregateCoverage Method
Find the `aggregateCoverage` method (around line 65) and update the provider promises:

```typescript
async aggregateCoverage(
  coordinates: Coordinates,
  options: CoverageAggregationOptions = {}
): Promise<AggregatedCoverageResponse> {
  // ... existing code ...

  const {
    providers = ['mtn'] as CoverageProvider[],
    serviceTypes,
    includeAlternatives = true,
    prioritizeSpeed = false,
    prioritizeReliability = true,
    userType = 'consumer' // ADD DEFAULT VALUE
  } = options;

  // ... existing code ...

  const providerPromises = providers.map(async (provider) => {
    try {
      const coverage = await this.getCoverageFromProvider(
        provider,
        coordinates,
        serviceTypes,
        userType // PASS userType HERE
      );
      return { provider, coverage, error: null };
    } catch (error) {
      // ... existing error handling ...
    }
  });

  // ... rest of existing code ...
}
```

---

## 📋 Phase 4: Update Packages API Route

### File to Modify
`app/api/coverage/packages/route.ts`

### Changes Required

#### 1. Extract userType from Query Parameters
Update the GET function (around line 12):

```typescript
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const userType = searchParams.get('userType') as 'consumer' | 'business' | null; // ADD THIS LINE

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    // ... rest of existing code ...
```

#### 2. Pass userType to Aggregation Service
Find where `coverageAggregationService.aggregateCoverage` is called (around line 56):

```typescript
const coverageResult = await coverageAggregationService.aggregateCoverage(
  coordinates,
  {
    providers: ['mtn'],
    includeAlternatives: true,
    prioritizeReliability: true,
    prioritizeSpeed: false,
    userType: userType || 'consumer' // ADD THIS LINE (default to consumer)
  }
);
```

#### 3. Update Metadata Logging
Update the metadata object (around line 76) to include userType:

```typescript
coverageMetadata = {
  provider: 'mtn',
  confidence: coverageResult.providers.mtn?.confidence || 'unknown',
  lastUpdated: coverageResult.lastUpdated,
  servicesFound: availableServices.length,
  source: coverageResult.providers.mtn?.metadata?.source || 'mtn_consumer_api',
  phase: coverageResult.providers.mtn?.metadata?.phase || 'phase_3_infrastructure_ready',
  infrastructureEstimatorAvailable: coverageResult.providers.mtn?.metadata?.infrastructureEstimatorAvailable || true,
  userType: userType || 'consumer' // ADD THIS LINE
};
```

---

## 📋 Phase 5: Update Coverage Page UI

### File to Modify
`app/coverage/page.tsx`

### Changes Required

#### 1. Add User Type State
Add after the existing useState declarations (around line 37):

```typescript
const [userType, setUserType] = useState<'consumer' | 'business'>('consumer');
```

#### 2. Add User Type Selector UI
Add this component before the address input section (around line 150-200):

```typescript
{currentStep === 'input' && (
  <>
    {/* User Type Selector - ADD THIS SECTION */}
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-circleTel-darkNeutral">
        What are you looking for?
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setUserType('consumer')}
          className={`p-6 rounded-lg border-2 transition-all ${
            userType === 'consumer'
              ? 'border-circleTel-orange bg-orange-50'
              : 'border-gray-200 hover:border-circleTel-orange/50'
          }`}
        >
          <div className="flex items-center justify-center mb-2">
            <Wifi className={`h-8 w-8 ${
              userType === 'consumer' ? 'text-circleTel-orange' : 'text-gray-400'
            }`} />
          </div>
          <h4 className="font-semibold mb-1">Home & Mobile</h4>
          <p className="text-sm text-gray-600">
            5G, LTE, Home Internet & Fibre
          </p>
        </button>

        <button
          type="button"
          onClick={() => setUserType('business')}
          className={`p-6 rounded-lg border-2 transition-all ${
            userType === 'business'
              ? 'border-circleTel-orange bg-orange-50'
              : 'border-gray-200 hover:border-circleTel-orange/50'
          }`}
        >
          <div className="flex items-center justify-center mb-2">
            <Award className={`h-8 w-8 ${
              userType === 'business' ? 'text-circleTel-orange' : 'text-gray-400'
            }`} />
          </div>
          <h4 className="font-semibold mb-1">Business Solutions</h4>
          <p className="text-sm text-gray-600">
            Wholesale, FTTH, Connectivity
          </p>
        </button>
      </div>
    </div>

    {/* Existing address input section continues here... */}
```

#### 3. Update Package Fetch Call
Find where packages are fetched (around line 65) and add userType parameter:

```typescript
// Step 2: Get available packages for the lead
const packagesResponse = await fetch(
  `/api/coverage/packages?leadId=${leadId}&userType=${userType}` // ADD userType HERE
);
```

#### 4. Update Loading Messages
Update the checking phase message to be dynamic (around line 300):

```typescript
{currentStep === 'checking' && (
  <div className="text-center py-12">
    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-circleTel-orange mb-4" />
    <h3 className="text-xl font-semibold mb-2">
      Checking {userType === 'business' ? 'Business' : 'Home'} Coverage
    </h3>
    <p className="text-gray-600">
      {userType === 'business'
        ? 'Checking wholesale products and connectivity options...'
        : 'Analyzing 5G, LTE, and fibre availability...'}
    </p>
    <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
  </div>
)}
```

---

## 📋 Phase 6: Update ServiceType Definitions

### File to Modify
`lib/coverage/types.ts`

### Changes Required

Find the ServiceType definition (around line 53) and update it:

```typescript
export type ServiceType =
  | 'fibre'
  | 'fibre_consumer'     // For FTTH consumer packages
  | 'fibre_business'     // For FTTB business packages (if needed separately)
  | 'connectivity'       // NEW: For business connectivity products
  | 'fixed_lte'
  | 'uncapped_wireless'
  | 'licensed_wireless'
  | 'wireless'           // Maps to SkyFibre
  | '5g'
  | 'lte'
  | '3g_900'
  | '3g_2100'
  | '2g';
```

**Note**: You may already have some of these. Add only what's missing.

---

## 📋 Phase 7: Enhance NoCoverageLeadForm

### File to Modify
`components/coverage/NoCoverageLeadForm.tsx`

### Changes Required

#### 1. Add userType Prop
Update the component props:

```typescript
interface NoCoverageLeadFormProps {
  coordinates?: { lat: number; lng: number };
  address?: string;
  userType?: 'consumer' | 'business'; // ADD THIS LINE
}

export function NoCoverageLeadForm({
  coordinates,
  address,
  userType = 'consumer' // ADD THIS WITH DEFAULT
}: NoCoverageLeadFormProps) {
```

#### 2. Include userType in Form Submission
Find where the form is submitted (likely a fetch POST call) and include userType:

```typescript
const response = await fetch('/api/coverage/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address: address || formAddress,
    coordinates,
    userType: userType, // ADD THIS LINE
    // ... other form fields
  })
});
```

#### 3. Update Form UI Text
Update form heading based on userType:

```typescript
<h3 className="text-xl font-semibold mb-4">
  {userType === 'business'
    ? 'Request Business Coverage Information'
    : 'We\'ll Notify You When Coverage Is Available'}
</h3>
```

#### 4. Update Coverage Page to Pass userType
Back in `app/coverage/page.tsx`, find where `NoCoverageLeadForm` is rendered (around line 400) and pass userType:

```typescript
{currentStep === 'no-coverage' && (
  <NoCoverageLeadForm
    coordinates={noCoverageCoordinates}
    address={address}
    userType={userType} // ADD THIS LINE
  />
)}
```

---

## 📋 Phase 8: Testing & Validation

### Test Cases

#### Test 1: Consumer Flow (B2C)
```
1. Navigate to /coverage
2. Select "Home & Mobile"
3. Enter address: "123 Main Road, Sandton, Johannesburg"
4. Click "Check Coverage"
5. Verify: Shows 5G, LTE, Fixed LTE packages
6. Check browser network tab:
   - GET /api/coverage/packages?leadId=XXX&userType=consumer
7. Verify packages shown are consumer-focused
```

#### Test 2: Business Flow (B2B)
```
1. Navigate to /coverage
2. Select "Business Solutions"
3. Enter address: "456 Business Park, Cape Town"
4. Click "Check Coverage"
5. Wait ~12 seconds (wholesale API is slower)
6. Verify: Shows wholesale products (FTTH, Fixed Wireless, Connectivity)
7. Check browser network tab:
   - GET /api/coverage/packages?leadId=XXX&userType=business
8. Verify packages shown are business-focused
```

#### Test 3: No Coverage - Consumer
```
1. Select "Home & Mobile"
2. Enter rural address with no coverage
3. Verify: Lead capture form appears
4. Submit form
5. Check database: coverage_leads table has userType='consumer'
```

#### Test 4: No Coverage - Business
```
1. Select "Business Solutions"
2. Enter address with no wholesale coverage
3. Verify: Lead capture form appears with business messaging
4. Submit form
5. Check database: coverage_leads table has userType='business'
```

#### Test 5: API Fallback
```
1. Temporarily break MTN API (wrong API key)
2. Check coverage
3. Verify: Falls back to PostGIS database
4. Verify: Still shows some packages (from database coverage)
```

### Validation Checklist

- [ ] ✅ Consumer flow shows mobile/home packages (5G, LTE, FTTH)
- [ ] ✅ Business flow shows wholesale products
- [ ] ✅ User type selection is intuitive
- [ ] ✅ Loading messages are appropriate for user type
- [ ] ✅ No coverage shows lead capture form with correct messaging
- [ ] ✅ API calls include userType parameter
- [ ] ✅ Database mappings work correctly
- [ ] ✅ Response times acceptable (<500ms consumer, <15s business)
- [ ] ✅ Error handling works (fallback to database)
- [ ] ✅ Browser console has no errors

### Performance Benchmarks

| Metric | Consumer (B2C) | Business (B2B) | Status |
|--------|----------------|----------------|--------|
| API Response Time | < 500ms | < 15 seconds | Target |
| Page Load | < 2 seconds | < 2 seconds | Target |
| Coverage Check | < 3 seconds | < 20 seconds | Target |
| Package Display | Immediate | Immediate | Target |

### Database Verification

After migration:
```sql
-- Check mappings exist
SELECT * FROM service_type_mapping WHERE provider = 'mtn' ORDER BY priority;

-- Verify product categories
SELECT DISTINCT product_category FROM service_packages WHERE active = true;

-- Check coverage leads are capturing userType
SELECT id, address, userType, created_at FROM coverage_leads ORDER BY created_at DESC LIMIT 10;
```

---

## 🔧 Environment Variables

Add to `.env.local`:
```env
# MTN Wholesale API (optional - defaults provided)
MTN_WHOLESALE_API_KEY=bdaacbcae8ab77672e545649df54d0df
MTN_WHOLESALE_API_URL=https://asp-feasibility.mtnbusiness.co.za
```

---

## 📚 Additional Resources

### Key Files Created/Modified

**New Files:**
- `lib/coverage/mtn/wholesale-client.ts`
- `lib/coverage/mtn/wholesale-types.ts`
- `supabase/migrations/20251020120000_add_mtn_wholesale_mappings.sql`

**Modified Files:**
- `lib/coverage/aggregation-service.ts`
- `lib/coverage/types.ts`
- `app/api/coverage/packages/route.ts`
- `app/coverage/page.tsx`
- `components/coverage/NoCoverageLeadForm.tsx`

### API Documentation

- **MTN Consumer API**: `docs/integrations/mtn/consumer-api/MTN_CONSUMER_API_SPECIFICATION.md`
- **MTN Wholesale API**: `docs/integrations/mtn/MTN_WHOLESALE_API.md`
- **Integration Summary**: `docs/integrations/mtn/README.md`

### Product Mapping Reference

**Consumer (B2C) - MTN Consumer API:**
| Technical Type | Product Category | ServiceType |
|----------------|------------------|-------------|
| 5G | 5g | '5g' |
| LTE | lte | 'lte' |
| FixedLTE | fixed_lte | 'fixed_lte' |

**Business (B2B) - MTN Wholesale API:**
| Wholesale Product | Product Category | ServiceType |
|-------------------|------------------|-------------|
| Fixed Wireless Broadband | wireless | 'uncapped_wireless' |
| Wholesale FTTH FNO | fibre | 'fibre' |
| Wholesale FTTH (MNS) | fibre | 'fibre' |
| Wholesale Cloud Connect | connectivity | 'fibre' |
| Wholesale Access Connect | connectivity | 'fibre' |
| Wholesale Ethernet Wave | connectivity | 'fibre' |
| Wholesale Cloud Connect Lite | connectivity | 'fibre' |

---

## 🚀 Deployment Checklist

Before deploying to production:

1. **Database Migration**
   - [ ] Apply migration in staging first
   - [ ] Verify mappings in staging database
   - [ ] Apply migration in production
   - [ ] Verify mappings in production database

2. **Environment Variables**
   - [ ] Set MTN_WHOLESALE_API_KEY in Vercel/Netlify
   - [ ] Set MTN_WHOLESALE_API_URL in Vercel/Netlify
   - [ ] Test environment configuration

3. **Testing**
   - [ ] Run all 5 test cases in staging
   - [ ] Verify no console errors
   - [ ] Check mobile responsiveness
   - [ ] Test with slow network (business API timeout)

4. **Monitoring**
   - [ ] Set up API error alerts
   - [ ] Monitor response times
   - [ ] Track user type selection ratio
   - [ ] Monitor lead capture rate

5. **Documentation**
   - [ ] Update user-facing help docs
   - [ ] Document for support team
   - [ ] Update API changelog

---

## 🎯 Success Criteria

Integration is successful when:

✅ Users can select between Consumer and Business coverage
✅ Consumer flow shows mobile/home packages (< 3s response)
✅ Business flow shows wholesale products (< 20s response)
✅ No coverage leads are captured with correct user type
✅ API fallback works when MTN APIs fail
✅ Database mappings correctly match products to categories
✅ No JavaScript errors in browser console
✅ Mobile experience is smooth
✅ Loading states are clear and appropriate
✅ Support team can differentiate consumer vs business leads

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Wholesale API returns empty products array
**Solution**: Check API key is correct, verify test environment URL

**Issue**: Products not showing after coverage check
**Solution**: Verify service_type_mapping migration was applied

**Issue**: "User type" selector not showing
**Solution**: Clear browser cache, check coverage page for UI changes

**Issue**: Business check timeout after 30 seconds
**Solution**: Normal - wholesale API can take 12-15 seconds, increase timeout if needed

### Debugging

Enable detailed logging:
```typescript
// In aggregation-service.ts
console.log('[Coverage] User type:', userType);
console.log('[Coverage] API called:', userType === 'business' ? 'Wholesale' : 'Consumer');
console.log('[Coverage] Results:', coverageResult);
```

Check network requests in browser DevTools:
- Look for `/api/coverage/packages?leadId=XXX&userType=YYY`
- Verify userType is passed correctly
- Check response data structure

---

## 🎉 Implementation Complete!

Once all phases are complete, you will have:

✅ **Separate B2C and B2B coverage flows**
✅ **MTN Consumer API** for home/mobile (5G, LTE, Fixed LTE)
✅ **MTN Wholesale API** for business (7 products)
✅ **Automatic coverage checking** on address entry
✅ **Product category mapping** working correctly
✅ **Lead capture** with user type tracking
✅ **Fallback system** to database when APIs fail
✅ **Production-ready** integration with proper error handling

**Total Estimated Implementation Time**: 4-6 hours
**Risk Level**: Low (APIs tested and working)
**Breaking Changes**: None (additive changes only)

---

**Document Version**: 1.0
**Created**: October 20, 2025
**Last Updated**: October 20, 2025
**Status**: Ready for Implementation
**Phases Complete**: 1-2 of 8

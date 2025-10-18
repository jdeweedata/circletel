# Coverage Search Flow Analysis

## Summary

Analysis of how coverage searches are handled in CircleTel and competitor sites (WebAfrica, Afrihost). Tested with addresses:
- 18 Rasmus Erasmus, Heritage Hill
- 123 Jan Bantjies Rd, Montana, Pretoria, 0151, South Africa

## CircleTel Implementation

### Coverage Flow Architecture

1. **Address Input** ([components/coverage/AddressAutocomplete.tsx](../components/coverage/AddressAutocomplete.tsx))
   - Google Places Autocomplete for address suggestions
   - Manual geocoding fallback if autocomplete unavailable
   - Updates parent component on every keystroke with partial data
   - Validates and geocodes addresses before coverage check

2. **Lead Creation** ([app/api/coverage/lead/route.ts](../app/api/coverage/lead/route.ts))
   - Creates a `coverage_leads` record with address and coordinates
   - Returns `leadId` for tracking the coverage request

3. **Coverage Check** ([app/api/coverage/packages/route.ts](../app/api/coverage/packages/route.ts))
   - **Primary Method**: Real-time MTN WMS coverage aggregation via [lib/coverage/aggregation-service.ts](../lib/coverage/aggregation-service.ts)
   - **Fallback 1**: PostGIS spatial query (`check_coverage_at_point` RPC)
   - **Fallback 2**: Area name/address text matching from `coverage_areas` table
   - Service type mapping: Technical types (from MTN API) → Product categories
   - Returns available packages filtered by coverage

4. **Package Filtering Logic**
   - MTN API returns technical service types (e.g., "5g", "fibre", "fixed_lte")
   - Mapped to product categories via `service_type_mapping` table
   - Packages filtered by `product_category` field matching mapped categories
   - **Result**: Only packages available for detected services are shown

### Test Results - CircleTel

**Address: 123 Jan Bantjies Rd, Montana, Pretoria**
- ✅ Coverage found
- **10 packages available** across multiple service types:
  - **SkyFibre (Wireless)**: 10Mbps (R259), 25Mbps (R329), 50Mbps (R439)
  - **HomeFibreConnect**: 20Mbps (R379), 50Mbps (R609), 100Mbps (R499/R609), 200Mbps (R699)
  - **BizFibreConnect**: 200Mbps (R809), 500Mbps (R1009)
- All packages show:
  - Promotional pricing (3 months)
  - Speed tiers
  - Signal strength (excellent)
  - Service features (uncapped, free installation, free router)

### Key Implementation Files

1. **Coverage Checker Component**
   - [components/coverage/CoverageChecker.tsx](../components/coverage/CoverageChecker.tsx:125-129) - Coverage API call
   - Shows packages inline after successful coverage check
   - Redirects to `/packages/{leadId}` page on coverage found (when callback provided)

2. **API Routes**
   - [app/api/coverage/packages/route.ts](../app/api/coverage/packages/route.ts:46-79) - Real-time MTN coverage check
   - [app/api/coverage/packages/route.ts](../app/api/coverage/packages/route.ts:131-185) - Package filtering logic

3. **Coverage Aggregation**
   - [lib/coverage/aggregation-service.ts](../lib/coverage/aggregation-service.ts:64-135) - Multi-provider aggregation
   - [lib/coverage/mtn/wms-realtime-client.ts](../lib/coverage/mtn/wms-realtime-client.ts) - Real-time MTN WMS client
   - 5-minute caching for performance

## Competitor Analysis

### WebAfrica (www.webafrica.co.za)

**Coverage Checker Behavior:**
- Address autocomplete with Google Maps integration
- **Issue Found**: After selecting address suggestion, both search button and textbox become disabled
- Appears to have a processing issue or stuck state
- No coverage results displayed during testing
- **UX Issue**: Broken flow prevents coverage check completion

**Design Approach:**
- Prominent hero search on homepage
- "Click here to use our interactive map" alternative
- Shows generic packages (Fibre, LTE, Store) without coverage filtering

### Afrihost (www.afrihost.com/fibre/)

**Coverage Checker Behavior:**
- Address search available but **NOT required**
- Shows **ALL packages upfront** (37+ providers visible)
- Coverage check is optional - users can browse before checking
- Packages organized by provider with speed tiers

**Design Approach:**
- Browse-first model vs search-first
- Shows complete catalog immediately
- Installation time displayed per provider (1-4 weeks)
- Package carousel navigation
- "Check Coverage" is secondary action

**Package Display:**
- Provider logos prominently displayed
- Speed ranges and pricing visible
- Installation costs and WiFi router inclusion noted
- Extensive T&Cs and provider-specific details

## Key Differences

### CircleTel vs Competitors

1. **Coverage-First Approach** (CircleTel)
   - ✅ Only shows available products
   - ✅ Reduces decision fatigue
   - ✅ Prevents disappointment from unavailable options
   - ⚠️ Requires address input before seeing any packages

2. **Browse-First Approach** (Afrihost)
   - ✅ Instant package visibility
   - ✅ Users can research before committing to coverage check
   - ⚠️ May show unavailable options
   - ⚠️ Requires users to filter mentally

3. **Broken Implementation** (WebAfrica)
   - ❌ Coverage checker non-functional during testing
   - ❌ Poor user experience with disabled controls
   - Shows generic content only

## Product Filtering Logic Deep Dive

### CircleTel's Smart Filtering

```javascript
// Step 1: Get technical service types from MTN coverage check
availableServices = ['5g', 'fibre', 'fixed_lte']

// Step 2: Map technical types to product categories
const mappings = await supabase
  .from('service_type_mapping')
  .select('*')
  .in('technical_type', availableServices)

productCategories = ['SkyFibre', 'HomeFibreConnect', 'BizFibreConnect']

// Step 3: Filter packages by product category
const packages = await supabase
  .from('service_packages')
  .select('*')
  .in('product_category', productCategories)
  .eq('active', true)
```

### Data Flow

```
User Address → Geocoding → MTN Coverage API
                              ↓
                    Technical Service Types
                              ↓
                    Service Type Mapping
                              ↓
                    Product Categories
                              ↓
                    Filtered Packages
```

## Recommendations

### What Works Well in CircleTel

1. ✅ **Progressive Enhancement**: Autocomplete → Geocoding → Coverage → Packages
2. ✅ **Smart Filtering**: Only show what's actually available
3. ✅ **Multi-Fallback**: Real-time API → PostGIS → Text matching
4. ✅ **Performance**: 5-minute caching reduces API load
5. ✅ **User Clarity**: Clear coverage status and package availability

### Potential Improvements

1. **Address Input UX**
   - The button enable logic could be more lenient (currently requires exact workflow)
   - Consider showing address as valid after typing (not just after selection)

2. **Hybrid Approach**
   - Show popular packages first (like Afrihost)
   - Then personalize based on coverage after address input
   - Best of both worlds: browse capability + smart filtering

3. **Coverage Transparency**
   - Display which providers/technologies were checked
   - Show confidence level in coverage results
   - Explain why certain packages are shown/hidden

4. **Error Handling**
   - Better fallback messaging when all methods fail
   - Clearer distinction between "no coverage" vs "check failed"

## Database Schema

### Key Tables

1. **coverage_leads**
   - Tracks all coverage searches
   - Stores address, coordinates, results

2. **service_type_mapping**
   - Maps technical types to product categories
   - Priority field for ordering

3. **service_packages**
   - Product catalog with categories
   - Active flag for filtering

4. **coverage_areas** (legacy)
   - Text-based coverage matching
   - Fallback when API fails

## Conclusion

**CircleTel's approach is superior to competitors:**
- ✅ Shows only available products (vs Afrihost showing all)
- ✅ Works reliably (vs WebAfrica's broken checker)
- ✅ Smart filtering prevents user disappointment
- ✅ Multiple fallback strategies ensure reliability

**The product filtering is working as designed:**
- Coverage check determines available service types
- Service types map to product categories
- Only packages in those categories are displayed
- Users see personalized, available options only

This creates a better user experience by eliminating options the user cannot actually order.

# Coverage-Based Package Filtering Test

## Overview
This document demonstrates that packages are correctly filtered based on the actual technology coverage available at specific addresses.

## How It Works

### 1. Coverage Detection Flow
```
User Address
    ↓
Geocoding (Google Maps API)
    ↓
Coordinates (lat/lng)
    ↓
MTN Coverage Aggregation Service
    ↓
Available Service Types (fibre, 5g, lte, etc.)
    ↓
Service Type Mapping (technical → product categories)
    ↓
Package Filtering (only show packages for available services)
    ↓
Display to User
```

### 2. Service Type Mapping

The system maps MTN's technical service types to product categories:

| Technical Type | Product Category | Priority |
|---|---|---|
| `uncapped_wireless` | SkyFibre | 1 |
| `5g` | 5G | 1 |
| `fibre` | HomeFibreConnect | 1 |
| `fibre` | BizFibreConnect | 2 |
| `fixed_lte` | LTE | 2 |
| `lte` | LTE | 3 |

### 3. Package Categories

- **SkyFibre**: Wireless broadband packages
- **HomeFibreConnect**: Residential fibre packages
- **BizFibreConnect**: Business fibre packages
- **LTE**: Mobile data packages
- **5G**: 5G wireless packages

## Test Results

### Test 1: Heritage Hill, Centurion
**Coordinates**: (-25.9086729, 28.1779879)

**Coverage Result**:
```json
{
  "availableServices": [
    "fibre",
    "fixed_lte",
    "uncapped_wireless",
    "licensed_wireless"
  ],
  "productCategories": [
    "SkyFibre",
    "HomeFibreConnect",
    "LTE",
    "BizFibreConnect"
  ],
  "packagesFound": 21
}
```

**Package Breakdown**:
- ✅ **SkyFibre packages** (3): Starter, Essential, Pro
- ✅ **HomeFibreConnect packages** (6): Basic, Standard, Premium, Ultra, Giga, etc.
- ✅ **BizFibreConnect packages** (2): Essential, Pro
- ✅ **LTE packages** (10): Various data allowances from 10GB to 1TB

**Expected**: Full range of packages across all service types
**Actual**: ✅ 21 packages displayed across 4 categories

### Verification Methods

#### Method 1: Via Web Interface
1. Navigate to http://localhost:3003/
2. Enter address: "18 Rasmus Erasmus, Centurion"
3. Click "Show me my deals"
4. Observe progress indicator showing 3 stages
5. View packages page with filtered results

#### Method 2: Via API Direct Testing
```bash
# Step 1: Create a lead
curl -X POST http://localhost:3003/api/coverage/lead \
  -H "Content-Type: application/json" \
  -d '{
    "address": "18 Rasmus Erasmus, Centurion",
    "coordinates": {"lat": -25.9086729, "lng": 28.1779879},
    "customer_type": "residential"
  }'

# Response will include: {"leadId": "...", "status": "success"}

# Step 2: Get packages for that lead
curl http://localhost:3003/api/coverage/packages?leadId=<LEAD_ID>
```

**Expected Response Structure**:
```json
{
  "available": true,
  "services": ["fibre", "fixed_lte", "uncapped_wireless", "licensed_wireless"],
  "packages": [
    {
      "id": "...",
      "name": "SkyFibre Starter",
      "product_category": "SkyFibre",
      "service_type": "wireless",
      "price": 459.00,
      "promotion_price": 259.00,
      ...
    },
    // ... 20 more packages
  ],
  "leadId": "...",
  "address": "18 Rasmus Erasmus, Centurion",
  "coordinates": {"lat": -25.9086729, "lng": 28.1779879}
}
```

#### Method 3: Via Database Query
```sql
-- Check what services were detected for a specific lead
SELECT
  id,
  address,
  coverage_available,
  available_services,
  checked_at
FROM coverage_leads
WHERE id = '<LEAD_ID>';

-- Verify package filtering
SELECT
  sp.name,
  sp.product_category,
  sp.service_type,
  sp.price
FROM service_packages sp
WHERE sp.product_category IN ('SkyFibre', 'HomeFibreConnect', 'LTE', 'BizFibreConnect')
  AND sp.active = true
ORDER BY sp.product_category, sp.price;
```

## How to Test Different Addresses

### Test Scenario 1: Area with Full Coverage
**Example**: Johannesburg CBD, Centurion, Pretoria CBD
**Expected**: Multiple service types (fibre + LTE + wireless)
**Expected Package Count**: 15-25 packages

### Test Scenario 2: Area with Limited Coverage
**Example**: Some suburban areas
**Expected**: Fewer service types (maybe only LTE or wireless)
**Expected Package Count**: 5-15 packages

### Test Scenario 3: Area with No Coverage
**Example**: Very rural areas
**Expected**: Fallback to legacy coverage_areas table or "No coverage" message
**Expected Package Count**: 0 or fallback packages

## Code References

### Coverage Detection
- **API Route**: [app/api/coverage/packages/route.ts](../app/api/coverage/packages/route.ts)
- **Aggregation Service**: [lib/coverage/aggregation-service.ts](../lib/coverage/aggregation-service.ts)
- **MTN Client**: [lib/coverage/mtn/wms-client.ts](../lib/coverage/mtn/wms-client.ts)

### Package Filtering Logic
Located in `app/api/coverage/packages/route.ts` (lines 131-185):

```typescript
// Map technical service types to product categories
const { data: mappings } = await supabase
  .from('service_type_mapping')
  .select('*')
  .in('technical_type', availableServices)  // Only services available at location
  .eq('active', true);

let productCategories = [...new Set(mappings.map(m => m.product_category))];

// Get packages ONLY for available product categories
const { data: packages } = await supabase
  .from('service_packages')
  .select('*')
  .in('product_category', productCategories)  // Filtered!
  .eq('active', true)
  .order('price', { ascending: true });
```

## Conclusion

✅ **Package filtering is working correctly**:
1. System detects available technology at specific coordinates via MTN API
2. Technical service types are mapped to product categories
3. Only packages matching available categories are displayed
4. Users only see packages they can actually order at their location

## Future Enhancements

1. **Multi-Provider Aggregation**: Add more providers beyond MTN (Vodacom, Telkom, etc.)
2. **Signal Strength Display**: Show expected speeds/quality based on signal strength
3. **Alternative Recommendations**: Suggest nearby areas with better coverage
4. **Coverage Map Visualization**: Show coverage heatmap for different technologies
5. **Real-time Availability**: Check with providers before final order confirmation

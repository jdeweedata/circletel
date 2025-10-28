# 5G Coverage Integration - Complete Documentation

## Overview

This document explains how 5G coverage is integrated across all coverage layers (MTN WMS API, DFA, and database) to ensure both consumer and business customers can access 5G packages.

**Last Updated**: 2025-10-28
**Status**: ✅ Fully Operational
**Test Results**: 6/6 tests passing

---

## Coverage Flow

```
1. User enters address (e.g., "7 Autumn St, Rivonia")
   ↓
2. MTN WMS API checks coverage (queries multiple layers)
   ↓ Layer 'mtnsi:MTNSA-Coverage-5G-5G' → returns "5g" (Actual 5G Cellular)
   ↓ Layer 'mtnsi:MTNSA-Coverage-Tarana' → returns "uncapped_wireless" (TARANA Fixed Wireless)
   ↓
3. Service Type Mapping converts technical types to product categories
   5g → 5g (priority: 1) - Actual 5G cellular packages
   uncapped_wireless → wireless (priority: 3) - Tarana fixed wireless packages
   ↓
4. Database query fetches packages
   WHERE product_category IN ('5g', 'wireless')
   AND customer_type = ('consumer' OR 'business')
   AND active = true
   ↓
5. API returns available packages
   Consumer: 3 5G packages (R449-R949) + 3 Wireless packages (R799-R1,999)
   Business: 6 5G packages (R494-R1,044) + 4 Wireless packages (R1,099-R2,899)
```

---

## Provider Coverage

### MTN (Multiple Technologies)

**Coverage Detection**: MTN WMS API (GeoServer with multiple layers)

**Technologies & Layers**:
1. **5G Cellular** (Actual 5G)
   - Layer: `mtnsi:MTNSA-Coverage-5G-5G`
   - Service Type: `5g`
   - Technology: 5G NR (New Radio)
   - Use Case: Mobile broadband evolution, high-speed cellular

2. **Tarana Fixed Wireless** (NOT 5G)
   - Layer: `mtnsi:MTNSA-Coverage-Tarana`
   - Service Type: `uncapped_wireless`
   - Technology: TARANA Wireless G1 (proprietary fixed wireless)
   - Use Case: Fixed wireless access, SkyFibre products

3. **Fixed LTE**
   - Layer: `mtnsi:MTNSA-Coverage-FIXLTE-EBU-0`
   - Service Type: `fixed_lte`
   - Technology: LTE (4G)

4. **Licensed Wireless**
   - Layer: `mtnsi:MTN-PMP-Feasible-Integrated`
   - Service Type: `licensed_wireless`
   - Technology: Point-to-point microwave

5. **Fibre (FTTB)**
   - Layer: `mtnsi:MTN-FTTB-Feasible`
   - Service Type: `fibre`
   - Technology: Fiber to the building

### DFA (Fibre Only)

**Technology**: FTTB/FTTH
**Coverage Detection**: DFA Coverage API
**Service Types Returned**:
- `fibre` - Connected buildings
- `fibre` (near-net) - Buildings within 200m of infrastructure

**Important**: DFA does **NOT** provide 5G coverage. 5G is exclusive to MTN.

---

## Database Schema

### Service Type Mapping

Maps technical service types from APIs to product categories:

| Technical Type | Product Category | Provider | Priority | Active | Notes |
|----------------|-----------------|----------|----------|--------|-------|
| `5g` | `5g` | mtn | 1 | ✅ | MTN 5G Cellular - Actual 5G from layer mtnsi:MTNSA-Coverage-5G-5G |
| `fixed_lte` | `lte` | mtn | 2 | ✅ | MTN Fixed LTE packages |
| `uncapped_wireless` | `wireless` | mtn | 3 | ✅ | MTN Tarana Fixed Wireless (SkyFibre) - NOT 5G |

**Priority**: Lower number = higher priority. When multiple mappings exist, all active mappings are used to show relevant packages.

**IMPORTANT**: The `uncapped_wireless` technical type refers to **Tarana fixed wireless technology**, NOT 5G cellular. True 5G cellular coverage comes from the `5g` technical type detected from the `mtnsi:MTNSA-Coverage-5G-5G` layer.

### Service Packages (5G)

All 5G packages must have:
```typescript
{
  service_type: '5g',
  product_category: '5g',  // MUST be '5g' (not 'MTN 5G Business' or other variants)
  customer_type: 'consumer' | 'business',
  active: true
}
```

**Current 5G Packages**:

**Consumer (3 packages)**:
1. MTN Home Essential 5G 35Mbps - R449
2. MTN Home Professional 5G 60Mbps - R649
3. MTN Home Enterprise 5G - R949

**Business (6 packages)**:
1. MTN Business 5G Essential - R494
2. MTN Business Uncapped 5G 35Mbps - R494
3. MTN Business 5G Professional - R714
4. MTN Business Uncapped 5G 60Mbps - R714
5. MTN Business 5G Enterprise - R1,044
6. MTN Business Uncapped 5G Best Effort - R1,044

---

## API Integration

### Coverage Check Endpoint: `/api/coverage/packages`

**Request**:
```
GET /api/coverage/packages?leadId=abc123&type=residential
```

**Query Parameters**:
- `leadId` (required): Coverage lead ID
- `type` (optional): `residential` (default) or `business`

**Response** (when 5G available):
```json
{
  "available": true,
  "services": ["uncapped_wireless", "fixed_lte"],
  "packages": [
    {
      "id": "uuid",
      "name": "MTN Home Essential 5G 35Mbps",
      "service_type": "5g",
      "product_category": "5g",
      "speed_down": 35,
      "price": 449,
      "description": "...",
      "features": ["...", "..."]
    }
  ],
  "metadata": {
    "providers": {
      "mtn": {
        "confidence": "high",
        "servicesFound": 2
      }
    },
    "totalServicesFound": 2
  }
}
```

### Coverage Aggregation Service

**File**: `lib/coverage/aggregation-service.ts`

**Method**: `aggregateCoverage(coordinates, options)`

**Options**:
```typescript
{
  providers: ['mtn', 'dfa'],      // MTN for wireless, DFA for fibre
  includeAlternatives: true,
  prioritizeReliability: true,
  prioritizeSpeed: false
}
```

**Returns**:
```typescript
{
  overallCoverage: boolean,
  providers: {
    mtn: {
      available: boolean,
      confidence: 'high' | 'medium' | 'low',
      services: [{
        type: 'uncapped_wireless',
        available: true,
        layerData: {
          NAME: "X6677_45",
          TYPE: "TARANA",
          PROVIDER: "MTN"
        }
      }]
    },
    dfa: { ... }
  },
  bestServices: [...]
}
```

---

## Customer Type Handling

### Consumer Flow (B2C)

1. User checks coverage at residential address
2. MTN WMS queries multiple layers:
   - Layer `mtnsi:MTNSA-Coverage-5G-5G` → detects 5g coverage
   - Layer `mtnsi:MTNSA-Coverage-Tarana` → detects uncapped_wireless coverage
3. Service mappings applied:
   - `5g` → `5g` (priority 1) - Actual 5G cellular
   - `uncapped_wireless` → `wireless` (priority 3) - Tarana fixed wireless
4. Query: `customer_type = 'consumer'` AND `product_category IN ('5g', 'wireless')`
5. Returns: 3 consumer 5G packages (R449-R949) + 3 wireless packages (R799-R1,999)

### Business Flow (B2B)

1. Business user checks coverage (type=business)
2. MTN WMS queries multiple layers:
   - Layer `mtnsi:MTNSA-Coverage-5G-5G` → detects 5g coverage
   - Layer `mtnsi:MTNSA-Coverage-Tarana` → detects uncapped_wireless coverage
3. Service mappings applied:
   - `5g` → `5g` (priority 1) - Actual 5G cellular
   - `uncapped_wireless` → `wireless` (priority 3) - Tarana fixed wireless
4. Query: `customer_type = 'business'` AND `product_category IN ('5g', 'wireless')`
5. Returns: 6 business 5G packages (R494-R1,044) + 4 wireless packages (R1,099-R2,899)

**Note**: Business packages have 10% premium pricing compared to consumer.

---

## Test Results (2025-10-28)

### End-to-End Test: 7 Autumn St, Rivonia

**Test Location**: Known 5G coverage area
**Coordinates**: -26.0542, 28.0600

| Test # | Test Description | Result | Details |
|--------|------------------|--------|---------|
| 1 | MTN WMS 5G Layer Detection | ✅ PASS | Layer 'mtnsi:MTNSA-Coverage-5G-5G' returns 5g (NETWORK_TYPE: 5G, CELLID: N00237B2) |
| 2 | MTN WMS Tarana Layer Detection | ✅ PASS | Layer 'mtnsi:MTNSA-Coverage-Tarana' returns uncapped_wireless (TYPE: TARANA, NAME: X6677_45) |
| 3 | Service Type Mapping (5G) | ✅ PASS | 5g → 5g (priority 1) - Actual 5G cellular |
| 4 | Service Type Mapping (Tarana) | ✅ PASS | uncapped_wireless → wireless (priority 3) - Tarana fixed wireless |
| 5 | Consumer Packages | ✅ PASS | 3 5G + 3 wireless + 16 LTE packages available |
| 6 | Business Packages | ✅ PASS | 6 5G + 4 wireless + 16 LTE packages available |

**Overall Result**: **6/6 tests passing** ✅

**Key Findings**:
- ✅ **5G Cellular** and **Tarana Wireless** correctly detected as **separate technologies**
- ✅ 5G packages shown only when actual 5G cellular coverage exists (from 5G layer)
- ✅ Wireless packages shown when Tarana fixed wireless coverage exists (from Tarana layer)
- ✅ Both technologies can be available simultaneously at the same address

---

## Troubleshooting

### Issue: 5G packages not showing for consumers

**Diagnosis**:
1. Check MTN WMS API returns `uncapped_wireless`:
   ```bash
   npx tsx scripts/test-mtn-5g-coverage.ts
   ```

2. Verify service type mapping exists:
   ```sql
   SELECT * FROM service_type_mapping
   WHERE technical_type = 'uncapped_wireless'
   AND product_category = '5g'
   AND active = true;
   ```

3. Check consumer packages exist and are active:
   ```sql
   SELECT id, name, service_type, product_category, customer_type, active
   FROM service_packages
   WHERE service_type = '5g'
   AND customer_type = 'consumer'
   AND active = true;
   ```

### Issue: product_category inconsistency

**Symptom**: Some 5G packages have `product_category = 'MTN 5G Business'` instead of `'5g'`

**Fix**:
```sql
UPDATE service_packages
SET product_category = '5g'
WHERE service_type = '5g'
AND product_category != '5g';
```

**Script**: `scripts/fix-5g-integration.js` (auto-fixes this issue)

### Issue: DFA showing 5G coverage

**Diagnosis**: DFA should **NEVER** return 5G coverage. 5G is MTN exclusive.

**Verification**:
- Check DFA integration only queries fibre layers
- DFA API response should only contain `fibre` service types
- If DFA returns wireless/5G, contact DFA support

---

## Monitoring & Analytics

### Coverage Logs

All coverage checks are logged to `coverage_logs` table:

```sql
SELECT
  address,
  latitude,
  longitude,
  coverage_type,
  provider_code,
  has_coverage,
  packages_found,
  created_at
FROM coverage_logs
WHERE provider_code = 'mtn'
AND has_coverage = true
ORDER BY created_at DESC
LIMIT 100;
```

### 5G Coverage Statistics

```sql
-- 5G package requests
SELECT
  COUNT(*) as total_checks,
  COUNT(CASE WHEN has_coverage THEN 1 END) as with_coverage,
  AVG(packages_found) as avg_packages,
  province
FROM coverage_logs
WHERE provider_code = 'mtn'
AND coverage_type = 'residential'
GROUP BY province
ORDER BY total_checks DESC;
```

---

## Maintenance Tasks

### Weekly

1. **Verify 5G package counts**:
   ```sql
   SELECT customer_type, COUNT(*) as count
   FROM service_packages
   WHERE service_type = '5g' AND active = true
   GROUP BY customer_type;
   ```
   Expected: Consumer: 3, Business: 6

2. **Check service type mappings**:
   ```sql
   SELECT * FROM service_type_mapping
   WHERE (technical_type = '5g' OR technical_type = 'uncapped_wireless')
   AND active = true
   ORDER BY technical_type, priority;
   ```
   Expected: 2 mappings
   - `5g → 5g` (priority 1) - Actual 5G cellular
   - `uncapped_wireless → wireless` (priority 3) - Tarana fixed wireless

### Monthly

1. **Review MTN WMS API uptime**:
   - Check coverage_logs for MTN errors
   - Monitor response times
   - Verify no degradation in coverage detection

2. **Update package pricing** (if needed):
   - Review business vs consumer pricing gap (should be ~10%)
   - Update promotion_price fields for seasonal offers

---

## Related Documentation

- **MTN Consumer Packages**: `/docs/products/MTN_CONSUMER_PACKAGES.md`
- **Coverage API Documentation**: `/docs/integrations/MTN_WMS_INTEGRATION.md`
- **Service Type Mappings**: `/docs/database/SERVICE_TYPE_MAPPING.md`
- **DFA Integration**: `/docs/integrations/DFA_INTEGRATION_FINAL_STATUS.md`

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-10-28 | ✅ CORRECTED: Separated 5G cellular from Tarana wireless | System |
| 2025-10-28 | ✅ Added true 5G layer (mtnsi:MTNSA-Coverage-5G-5G) to MTNWMSRealtimeClient | System |
| 2025-10-28 | ✅ Removed incorrect uncapped_wireless → 5g mapping | System |
| 2025-10-28 | ✅ Confirmed correct mappings: 5g → 5g, uncapped_wireless → wireless | System |
| 2025-10-28 | ✅ End-to-end testing: All 6/6 tests passing with correct technology detection | System |
| 2025-10-28 | ✅ Updated documentation to reflect 5G vs Tarana distinction | System |

---

**Status**: ✅ **FULLY OPERATIONAL (CORRECTED)**

5G coverage and Tarana wireless are now properly separated:
- **5G Cellular**: MTN WMS layer `mtnsi:MTNSA-Coverage-5G-5G` detects actual 5G cellular coverage
- **Tarana Wireless**: MTN WMS layer `mtnsi:MTNSA-Coverage-Tarana` detects fixed wireless (NOT 5G)
- **Service Type Mappings**:
  - `5g → 5g` (Actual 5G cellular packages)
  - `uncapped_wireless → wireless` (Tarana fixed wireless packages, branded as SkyFibre)
- Both consumer (3 5G + 3 wireless) and business (6 5G + 4 wireless) packages active
- Both technologies can be available simultaneously at the same address
- End-to-end testing confirms complete and correct coverage flow
- DFA correctly excluded from 5G coverage (fibre only)

**Total 5G Packages**: 9 (3 consumer + 6 business)
**Price Range**: R449-R1,044/month
**Coverage**: Nationwide MTN 5G network

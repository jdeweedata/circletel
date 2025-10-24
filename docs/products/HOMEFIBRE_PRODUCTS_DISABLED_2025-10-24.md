# HomeFibreConnect Products Disabled

**Date**: 2025-10-24
**Action**: Disabled HomeFibreConnect (MTN Fibre) products
**Reason**: Not market competitive at current pricing
**Status**: ✅ Complete

---

## Executive Summary

All 5 HomeFibreConnect products have been disabled in the database and will no longer appear on the frontend for customer selection. These products were MTN's residential fibre offerings (Supersonic brand) and are not competitive with other market options at this time.

---

## Products Disabled

### 1. HomeFibre Basic
- **ID**: `294072fa-c1b3-41d2-8ca3-08907d08f399`
- **Speed**: 20 Mbps down / 10 Mbps up
- **Price**: R579/month (Promo: R379/month)
- **Status**: Disabled ❌

### 2. HomeFibre Standard
- **ID**: `fcf92a7c-265f-41e4-9acc-beaa103af5ab`
- **Speed**: 50 Mbps down / 50 Mbps up
- **Price**: R809/month (Promo: R609/month)
- **Status**: Disabled ❌

### 3. HomeFibre Premium
- **ID**: `54732b7d-cc7a-4792-bb84-6f13845c85a0`
- **Speed**: 100 Mbps down / 50 Mbps up
- **Price**: R799/month (Promo: R499/month)
- **Status**: Disabled ❌

### 4. HomeFibre Ultra
- **ID**: `78415f5f-fd16-4b6f-8f89-b2a177434230`
- **Speed**: 100 Mbps down / 100 Mbps up
- **Price**: R909/month (Promo: R609/month)
- **Status**: Disabled ❌

### 5. HomeFibre Giga
- **ID**: `2ff4b91d-578f-48bd-97a0-1d9d903505a9`
- **Speed**: 200 Mbps down / 100 Mbps up
- **Price**: R999/month (Promo: R699/month)
- **Status**: Disabled ❌

---

## Impact

### Frontend Impact
✅ **Products will NOT appear** in:
- Coverage checker results (`/api/coverage/packages`)
- Package selection pages (`/packages/*`)
- Product listings (`/products`)
- Order forms

**Reason**: All product queries filter by `active = true`:
```sql
SELECT * FROM service_packages
WHERE active = true
  AND service_type = 'HomeFibreConnect'
```

Since `active = false` for all HomeFibreConnect products, they are excluded from results.

**Code Reference**: `app/api/coverage/packages/route.ts:187`

---

### Admin Panel Impact
✅ **Products still visible** in admin panel at `/admin/products`

**Reasons**:
1. Admins need to see disabled products for management
2. Products show with "Inactive" badge
3. Can be re-enabled via "Activate" dropdown option

**Features Available**:
- View product details
- Edit pricing (if needed for future)
- View audit history
- **Toggle Active/Inactive status** (can re-enable if needed)
- Archive product (permanent removal)

**Code Reference**: `app/admin/products/page.tsx:141-168` (handleToggleStatus function)

---

### Database Impact
✅ **Products still exist** in `service_packages` table with `active = false`

**Changes Made**:
```sql
UPDATE service_packages
SET active = false,
    updated_at = '2025-10-24T...'
WHERE service_type = 'HomeFibreConnect'
  AND active = true;
```

**Records Updated**: 5 products

---

## Coverage Impact

### MTN Fibre Layer Mapping

The MTN Consumer API still returns fibre coverage via:
- **Layer**: `mtnsi:SUPERSONIC-CONSOLIDATED`
- **Technical Type**: `'fibre'`

However, when the API returns `'fibre'` coverage:

**Before Disabling**:
```javascript
// service_type_mapping returned:
// 'fibre' → 'HomeFibreConnect' (priority 1)
// Query found 5 active HomeFibreConnect products
// Result: 5 products displayed to customer
```

**After Disabling**:
```javascript
// service_type_mapping still returns:
// 'fibre' → 'HomeFibreConnect' (priority 1)
// Query finds 0 active HomeFibreConnect products (all disabled)
// Result: 0 products displayed to customer
```

**Code Reference**: `app/api/coverage/packages/route.ts:177-187`

---

## Alternative Fibre Products Still Available

### DFA Fibre (Dark Fibre Africa) - ACTIVE ✅

When DFA coverage is detected, these products are still available:

**Business Products** (BizFibreConnect):
- BizFibre Essential: 200/200 Mbps @ R1,109 (Promo: R809)
- BizFibre Pro: 500/500 Mbps @ R1,309 (Promo: R1,009)

**Consumer Products** (Generic Fibre):
- HomeFibre Starter: 20/20 Mbps @ R799
- HomeFibre Plus: 50/50 Mbps @ R999
- HomeFibre Max: 200/200 Mbps @ R1,499
- HomeFibre Ultra: 500/500 Mbps @ R1,999

**Total Alternative Fibre Products**: 11 products (2 business + 9 consumer)

**Coverage Source**: DFA ArcGIS API (Connected Buildings + Near-Net Buildings)

---

## Service Type Mapping

### Current Mapping Configuration

The `service_type_mapping` table still contains fibre mappings:

| Technical Type | Provider | Product Category | Priority | Active |
|----------------|----------|------------------|----------|--------|
| `'fibre'` | `'dfa'` | `'HomeFibreConnect'` | 1 | ✅ true |
| `'fibre'` | `'dfa'` | `'BizFibreConnect'` | 2 | ✅ true |
| `'fibre'` | `'openserve'` | `'HomeFibreConnect'` | 3 | ✅ true |
| `'fibre'` | `'openserve'` | `'BizFibreConnect'` | 4 | ✅ true |

**Note**: Mappings remain active, but no HomeFibreConnect products are returned because `service_packages.active = false` for all HomeFibreConnect products.

---

## How to Re-Enable Products

### Option 1: Admin Panel (Recommended)
1. Login to admin panel at `/admin/login`
2. Navigate to `/admin/products`
3. Filter by status: "Inactive"
4. Find HomeFibre products
5. Click dropdown menu (⋮) → "Activate"
6. Product becomes active and visible on frontend

### Option 2: Database Script
```javascript
// Re-enable all HomeFibreConnect products
await supabase
  .from('service_packages')
  .update({ active: true })
  .eq('service_type', 'HomeFibreConnect');
```

### Option 3: Individual Product API Call
```bash
# PUT /api/admin/products/{product_id}
curl -X PUT "http://localhost:3000/api/admin/products/294072fa-..." \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": true,
    "change_reason": "Re-enabled for market competitive pricing"
  }'
```

---

## Testing Verification

### Test 1: Coverage API Returns No HomeFibre Products ✅

**Test Address**: Sandton CBD (-26.1076, 28.0567)

**Expected Behavior**:
```
GET /api/coverage/packages?leadId=<id>&type=residential

Response:
{
  "available": true,
  "services": ["fibre"],
  "packages": [
    // Should NOT contain any HomeFibreConnect products
    // Only DFA fibre or generic fibre products
  ]
}
```

**Verification**: Check that no products have `service_type: 'HomeFibreConnect'`

---

### Test 2: Admin Panel Shows Inactive Badge ✅

**Test Page**: `/admin/products`

**Expected Behavior**:
- HomeFibre products visible in list
- Badge shows "Inactive" (grey badge)
- Dropdown menu has "Activate" option
- Stats card shows "5 inactive products"

---

### Test 3: Direct Database Query ✅

```sql
SELECT name, service_type, active
FROM service_packages
WHERE service_type = 'HomeFibreConnect';

Expected Result:
   name                  | service_type       | active
-------------------------+--------------------+--------
 HomeFibre Basic        | HomeFibreConnect   | false
 HomeFibre Standard     | HomeFibreConnect   | false
 HomeFibre Premium      | HomeFibreConnect   | false
 HomeFibre Ultra        | HomeFibreConnect   | false
 HomeFibre Giga         | HomeFibreConnect   | false
```

---

## Business Context

### Why Disabled?

**Reason**: MTN HomeFibreConnect packages are not market competitive

**Market Comparison**:

| Package | Speed | MTN Price | Market Leader Price | Difference |
|---------|-------|-----------|---------------------|------------|
| HomeFibre Basic | 20/10 Mbps | R579 (R379 promo) | ~R300-R400 | Not competitive |
| HomeFibre Standard | 50/50 Mbps | R809 (R609 promo) | ~R500-R600 | Not competitive |
| HomeFibre Premium | 100/50 Mbps | R799 (R499 promo) | ~R600-R700 | Not competitive |

**Customer Impact**: Offering non-competitive products could harm CircleTel's reputation and sales conversion.

**Future Strategy**: Wait for MTN to update pricing, or negotiate better wholesale rates.

---

### Alternative Products Available

CircleTel customers still have access to:

1. **DFA Fibre** (Dark Fibre Africa)
   - Connected Buildings (immediate installation)
   - Near-Net Buildings (quote for extension)
   - Competitive pricing

2. **Generic Fibre Products** (11 products)
   - Consumer: HomeFibre Starter/Plus/Max/Ultra
   - Business: BizFibre Connect Lite/Starter/Plus/Pro/Ultra

3. **SkyFibre (Tarana Wireless)** (7 products)
   - Wireless alternative where fibre unavailable
   - Competitive speeds (50-200 Mbps)

**Total Active Products**: 39 products (44 total - 5 disabled HomeFibreConnect)

---

## Documentation & Scripts

### Files Created

1. **Disable Script**: `scripts/disable-homefibre-products.js`
   - Disables all HomeFibreConnect products
   - Verifies database changes
   - Can be run again if products re-enabled by mistake

2. **This Documentation**: `docs/products/HOMEFIBRE_PRODUCTS_DISABLED_2025-10-24.md`
   - Complete record of what was disabled and why
   - Impact analysis
   - Re-enablement procedures

3. **Analysis Document**: `docs/analysis/FIBRE_PACKAGES_API_TO_DATABASE_FLOW.md`
   - Complete API-to-database flow
   - Product mapping logic
   - Coverage system architecture

---

## Rollback Plan

If HomeFibreConnect products need to be re-enabled:

### Quick Rollback Script

```javascript
// scripts/enable-homefibre-products.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function enableHomeFibreProducts() {
  const { data, error } = await supabase
    .from('service_packages')
    .update({ active: true })
    .eq('service_type', 'HomeFibreConnect')
    .select('id, name, active');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✅ Re-enabled products:', data);
}

enableHomeFibreProducts();
```

**Time to Re-enable**: < 1 minute
**Impact**: Products immediately visible on frontend

---

## Summary

✅ **Action Completed**: All 5 HomeFibreConnect products disabled

✅ **Frontend Impact**: Products no longer visible to customers

✅ **Admin Access**: Still manageable via admin panel

✅ **Alternative Products**: 39 active products still available

✅ **Reversible**: Can be re-enabled anytime via admin panel or script

✅ **Documentation**: Complete records maintained

---

**Action By**: CircleTel Development Team
**Approved By**: Product Management
**Date**: 2025-10-24
**Version**: 1.0

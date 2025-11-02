# MTN Handset Deals Removal - Summary

## ✅ Completed

Successfully removed all MTN handset deals from the admin catalogue and frontend, keeping only SIM-only plans visible.

## What Was Done

### 1. Deactivated 50 Handset Products
**Script:** `scripts/deactivate-mtn-handset-deals.js`

**Handset products deactivated (examples):**
- MTN Made For Business SM + Oppo Reno 14 5G
- MTN Made For Business M + Oppo Reno 14 5G  
- MTN Made For Business SM + Apple iPhone 17 (256GB)
- MTN Made For Business S+ + Samsung Galaxy S25 FE
- MTN Made For Business S+ + Vivo Y29
- MTN Made For Business S+ + Vivo V50 Lite
- MTN Made For Business S+ + Huawei Nova 14i
- MTN Made For Business M+ + Apple iPhone Air (256GB)
- MTN Made For Business Data+ S + MoMo Point of Sale (PoS) 2025
- And 41 more handset products...

**Action taken:** Set `active = false` and `status = 'archived'`

### 2. Kept 1 SIM-Only Product Active
✅ **MTN Made For Business S**
- Device: "Use Your Own" (SIM-only)
- SKU: 202501EBU8176
- Price: R159/month
- Features: 1.5GB Data, 100 Minutes, Free SIM Card

## Current Database State

```
Total MTN Products: 51
├── Active: 1 (SIM-only)
└── Inactive: 50 (handsets - hidden)
```

## Why Deactivation Instead of Deletion?

**Problem:** Cannot delete products due to foreign key constraints
- Products are referenced in `business_quote_items` table
- Products are referenced in `service_packages_audit_logs` table
- Deletion would break historical quotes and audit trails

**Solution:** Deactivation
- Set `active = false` to hide from display
- Set `status = 'archived'` for proper classification
- Products remain in database for data integrity
- Historical quotes/orders remain intact

## Impact

### Admin Catalogue
- ✅ Only 1 SIM-only plan shows in `/admin/products`
- ❌ 50 handset products hidden (filtered by `active = true`)

### Frontend/Customer View  
- ✅ Only SIM-only plans available for selection
- ❌ Handset deals not offered to customers
- ✅ Coverage check still works normally

### API Endpoints
All APIs automatically filter by `active = true`:
- `/api/admin/products` - Shows only active products
- `/api/coverage/packages` - Returns only active packages
- Customer-facing pages - Display only active products

### Historical Data
- ✅ Existing quotes with handset products remain valid
- ✅ Audit logs preserved
- ✅ No data loss or integrity issues

## Scripts Created

### 1. `scripts/deactivate-mtn-handset-deals.js`
**Purpose:** Mark handset products as inactive (recommended approach)

**Usage:**
```powershell
# Preview (dry run)
node scripts/deactivate-mtn-handset-deals.js

# Execute deactivation
node scripts/deactivate-mtn-handset-deals.js --confirm
```

**What it does:**
- Identifies handset products (where `metadata.oemDevice !== 'Use Your Own'`)
- Sets `active = false` and `status = 'archived'`
- Keeps SIM-only products active
- Shows summary of changes

### 2. `scripts/remove-mtn-handset-deals.js`
**Purpose:** Attempt permanent deletion (reference only - blocked by FK constraints)

**Status:** ⚠️ Does not work due to foreign key constraints

**Included for:** Documentation purposes, shows why deactivation was necessary

## Verification Commands

### Check Active vs Inactive Count
```powershell
node -e "const {createClient} = require('@supabase/supabase-js'); require('dotenv').config({path: '.env.local'}); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); Promise.all([supabase.from('service_packages').select('id', {count: 'exact', head: true}).like('name', 'MTN%'), supabase.from('service_packages').select('id', {count: 'exact', head: true}).like('name', 'MTN%').eq('active', true), supabase.from('service_packages').select('id', {count: 'exact', head: true}).like('name', 'MTN%').eq('active', false)]).then(([total, active, inactive]) => {console.log('Total:', total.count); console.log('Active:', active.count); console.log('Inactive:', inactive.count);});"
```

**Expected output:**
```
Total: 51
Active: 1
Inactive: 50
```

### View Active Products
```powershell
node -e "const {createClient} = require('@supabase/supabase-js'); require('dotenv').config({path: '.env.local'}); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('service_packages').select('name, metadata').like('name', 'MTN%').eq('active', true).then(({data}) => data.forEach(p => console.log(p.name + ' - Device: ' + p.metadata?.oemDevice)));"
```

**Expected output:**
```
MTN Made For Business S - Device: Use Your Own
```

### View Inactive Products (First 5)
```powershell
node -e "const {createClient} = require('@supabase/supabase-js'); require('dotenv').config({path: '.env.local'}); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('service_packages').select('name, metadata').like('name', 'MTN%').eq('active', false).limit(5).then(({data}) => data.forEach(p => console.log(p.name + ' - Device: ' + p.metadata?.oemDevice)));"
```

**Expected output:**
```
MTN Made For Business SM + Oppo Reno 14 5G - Device: Oppo Reno 14 5G
MTN Made For Business M + Oppo Reno 14 5G - Device: Oppo Reno 14 5G
MTN Made For Business SM + Apple iPhone 17 (256GB) - Device: Apple iPhone 17 (256GB)
...
```

## Reactivation (If Needed)

If you ever need to reactivate handset products:

```powershell
node -e "const {createClient} = require('@supabase/supabase-js'); require('dotenv').config({path: '.env.local'}); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('service_packages').update({active: true, status: 'active'}).like('name', 'MTN%').eq('active', false).then(({error, count}) => error ? console.error(error) : console.log('Reactivated ' + count + ' products'));"
```

⚠️ **Warning:** This will reactivate ALL inactive MTN products including handsets.

## Database Schema

**Relevant fields in `service_packages` table:**
```sql
active BOOLEAN DEFAULT true           -- Controls visibility
status TEXT CHECK (status IN ...)     -- Product lifecycle state
metadata JSONB                         -- Contains oemDevice field
```

**Status values:**
- `'active'` - Normal active product
- `'archived'` - Deactivated/historical product
- `'draft'` - Not yet published
- `'inactive'` - Temporarily disabled

## Import Script Update

**File:** `scripts/import-mtn-deals.js`

**Already handles filtering:**
- Only imports mobile deals (LTE/5G)
- Skips fibre and other services
- Auto-categorizes as 5G or LTE

**If you import new MTN deals in future:**
1. Script will import all mobile products (including handsets)
2. New handsets will be marked as `active = true`
3. You'll need to run deactivation script again

**Automated solution (future enhancement):**
Add to import script to auto-deactivate handsets:
```javascript
if (oemDevice !== 'Use Your Own') {
  product.active = false;
  product.status = 'archived';
}
```

## Results Summary

✅ **Handset products:** 50 deactivated (hidden from all displays)  
✅ **SIM-only products:** 1 kept active (MTN Made For Business S)  
✅ **Data integrity:** All historical records preserved  
✅ **Admin catalogue:** Clean - only SIM-only plans visible  
✅ **Frontend:** Only SIM-only plans available to customers  
✅ **Reversible:** Can reactivate products if needed  

## Technical Details

### Deactivation Query
```sql
UPDATE service_packages
SET active = false, status = 'archived'
WHERE name LIKE 'MTN%'
  AND metadata->>'oemDevice' != 'Use Your Own';
```

### Filter in Admin API
```sql
SELECT * FROM service_packages
WHERE name LIKE 'MTN%'
  AND active = true;  -- Automatically filters out handsets
```

### Filter in Frontend API
```sql
SELECT * FROM service_packages
WHERE active = true  -- Only active products returned
  AND customer_type = 'business';
```

## Commits

- `eeab64b` - feat(admin): Deactivate MTN handset deals, keep only SIM-only products
- `0a060f4` - feat(admin): Filter MTN deals to show only LTE and 5G products
- `2c43ccb` - feat(admin): Add MTN monthly deals Excel import system

## Next Steps

### When Importing New Monthly Deals:

1. **Option A: Auto-deactivate handsets during import**
   - Modify `import-mtn-deals.js` to set handsets as inactive
   - Add: `active: oemDevice === 'Use Your Own'`

2. **Option B: Run deactivation after import**
   - Import all deals normally
   - Run: `node scripts/deactivate-mtn-handset-deals.js --confirm`

**Recommended:** Option A (auto-deactivate during import)

---

**Date:** 2025-11-02  
**Status:** ✅ Complete - Only SIM-only MTN deals visible  
**Impact:** Admin catalogue and frontend now show only SIM-only MTN products

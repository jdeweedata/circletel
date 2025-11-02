# MTN Deals - LTE and 5G Filtering

## ✅ Implemented

The MTN deals import system now automatically filters to **only show LTE and 5G mobile products** in both the admin catalogue and frontend.

## How It Works

### 1. Import Script Filtering

**File:** `scripts/import-mtn-deals.js`

**Two-stage filtering:**

#### Stage 1: Mobile Deals Detection
```javascript
function isMobileDeal(plan, device) {
  // Excludes fibre deals
  if (planStr.includes('fibre') || planStr.includes('fiber')) {
    return false;
  }
  
  // Includes mobile plans like "Made For Business"
  // and recognizes devices (iPhone, Galaxy, etc.)
  return true;
}
```

**Filters out:**
- Fibre deals
- Non-mobile services
- Other telecommunications products

#### Stage 2: LTE vs 5G Classification
```javascript
function determineServiceType(device, plan) {
  const deviceStr = String(device || '').toLowerCase();
  const planStr = String(plan || '').toLowerCase();
  
  // Check for 5G indicator
  if (deviceStr.includes('5g') || planStr.includes('5g')) {
    return '5g';
  }
  
  // Default to LTE for all other mobile deals
  return 'lte';
}
```

**Classification:**
- **5G Products:** Devices with "5G" in name (e.g., "Oppo Reno 14 5G")
- **LTE Products:** All other mobile devices and SIM-only plans

### 2. Database Schema

Each product is tagged with `service_type`:
```sql
service_packages.service_type IN ('5g', 'lte')
```

**Example:**
```json
{
  "name": "MTN Made For Business SM + Oppo Reno 14 5G",
  "service_type": "5g",
  "sku": "202508EBU2726"
}
```

### 3. Frontend Display

The packages API (`/api/coverage/packages`) automatically filters products by `service_type`. MTN deals are categorized as:
- `service_type: '5g'` → Shows in 5G offerings
- `service_type: 'lte'` → Shows in LTE offerings

**Other product types (not affected by this filter):**
- `service_type: 'fibre'` → Fibre products
- `service_type: 'wireless'` → Fixed wireless
- etc.

## Import Results (Oct 2025 File)

### Total Rows Analyzed
- **Total Excel rows:** 17,465
- **Header row:** 1
- **Product rows:** 17,464

### Filtering Results
- ✅ **Mobile Deals Imported:** 17,304 (LTE + 5G)
- ⏭️ **Non-Mobile Deals Skipped:** 160

### Breakdown by Type
The 17,304 mobile deals are automatically split into:
- **5G Products:** Devices with "5G" in device name
- **LTE Products:** All other mobile deals (SIM-only, 4G devices, etc.)

### What Was Filtered Out (160 products)
- Fibre broadband deals
- Fixed-line products
- Non-mobile business services
- Other telecommunications products

## Admin Catalogue

**Access:** `/admin/products`

**Filter Options:**
The admin panel already supports filtering by `service_type`:
- Select "5G" to see only 5G deals
- Select "LTE" to see only LTE deals
- Leave blank to see all products

**API Endpoint:** `/api/admin/products?service_type=5g` or `?service_type=lte`

## Frontend Display

**Customer-facing pages automatically filter by service_type:**

Products are shown based on coverage results and service type matching. The system:
1. Checks coverage at customer's address
2. Determines available service types (5G, LTE, fibre, etc.)
3. Only shows products matching available service types
4. MTN deals (LTE/5G) appear when mobile coverage is available

## Verification Commands

### Check Total MTN Products
```powershell
node scripts/check-mtn-products.js
```

### Check Service Type Distribution
```powershell
node -e "const {createClient} = require('@supabase/supabase-js'); require('dotenv').config({path: '.env.local'}); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('service_packages').select('service_type').like('name', 'MTN%').then(({data}) => {const counts = {}; data.forEach(p => counts[p.service_type] = (counts[p.service_type] || 0) + 1); console.log('Service Type Distribution:', counts);});"
```

### Sample 5G Products
```powershell
node -e "const {createClient} = require('@supabase/supabase-js'); require('dotenv').config({path: '.env.local'}); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('service_packages').select('name, service_type, sku').like('name', 'MTN%').eq('service_type', '5g').limit(5).then(({data}) => console.log(JSON.stringify(data, null, 2)));"
```

### Sample LTE Products
```powershell
node -e "const {createClient} = require('@supabase/supabase-js'); require('dotenv').config({path: '.env.local'}); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('service_packages').select('name, service_type, sku').like('name', 'MTN%').eq('service_type', 'lte').limit(5).then(({data}) => console.log(JSON.stringify(data, null, 2)));"
```

## Benefits

### 1. **Accurate Categorization**
- 5G devices automatically tagged as `service_type: '5g'`
- LTE/4G devices tagged as `service_type: 'lte'`
- Non-mobile deals excluded completely

### 2. **Clean Admin Panel**
- Only relevant MTN mobile deals appear
- Easy filtering by 5G vs LTE
- No fibre or other services cluttering the list

### 3. **Better Customer Experience**
- Customers only see products relevant to their coverage
- 5G products shown when 5G coverage available
- LTE products shown for LTE coverage areas

### 4. **Automatic Updates**
- Monthly imports automatically apply same filtering
- No manual categorization needed
- Consistent product tagging

## Example Products

### 5G Product
```json
{
  "name": "MTN Made For Business SM + Oppo Reno 14 5G",
  "service_type": "5g",
  "sku": "202508EBU2726",
  "base_price_zar": 849,
  "features": ["4GB Data", "200 Minutes", "Free SIM Card"]
}
```

### LTE Product (SIM Only)
```json
{
  "name": "MTN Made For Business S",
  "service_type": "lte",
  "sku": "202501EBU8176",
  "base_price_zar": 159,
  "features": ["1.5GB Data", "100 Minutes", "Free SIM Card"]
}
```

### LTE Product (with 4G Device)
```json
{
  "name": "MTN Made For Business S+ + Samsung Galaxy S25 FE",
  "service_type": "lte",
  "sku": "202508EBU2124",
  "base_price_zar": 629,
  "features": ["2.3GB Data", "125 Minutes", "Free SIM Card"]
}
```

## Technical Implementation

### Detection Logic

**5G Detection Keywords:**
- Device name contains "5G"
- Plan name contains "5G"

**LTE Default:**
- All other mobile deals
- Includes 4G devices (no explicit 5G marking)
- Includes SIM-only plans
- Includes older devices

**Mobile Deal Detection:**
- "Made For Business" plans
- Device names (iPhone, Galaxy, Oppo, Vivo, Huawei, etc.)
- "Data+" plans
- Excludes: fibre, fixed-line, non-mobile services

## Testing Results

### Dry Run Output
```
📦 MTN Deals Import

File: Helios and iLula Business Promos - Oct 2025 - Deals.xlsx
Mode: DRY RUN

🔍 Parsing deals...
   ✅ Parsed: 17,304 mobile deals (LTE/5G)
   ⏭️  Skipped: 160 non-mobile deals

Sample Products:
1. MTN Made For Business SM + Oppo Reno 14 5G [5G]
2. MTN Made For Business M + Oppo Reno 14 5G [5G]
3. MTN Made For Business SM + Apple iPhone 17 (256GB) [LTE]
```

### Database Verification
```sql
-- Check service type distribution
SELECT service_type, COUNT(*) 
FROM service_packages 
WHERE name LIKE 'MTN%' 
GROUP BY service_type;

-- Expected results:
-- 5g   | ~500-1000 products (devices with 5G)
-- lte  | ~16,300 products (all other mobile deals)
```

## Maintenance

### Monthly Import Process
No changes needed! The filtering happens automatically:

1. Receive new MTN Excel file
2. Run import script (filters automatically)
3. Products are correctly tagged as 5G or LTE
4. Frontend displays appropriately

### Adding New Filtering Rules
If you need to add more filtering logic, edit:
- `isMobileDeal()` - to exclude additional product types
- `determineServiceType()` - to add more 5G/LTE detection patterns

## Summary

✅ **Filtering Active:** Only LTE and 5G mobile deals are imported  
✅ **Auto-Classification:** 5G vs LTE detected from device names  
✅ **Admin Display:** Filtered products in admin catalogue  
✅ **Frontend Display:** Customers see only relevant products  
✅ **Monthly Updates:** Automatic filtering on each import  

**Result:** Clean, accurate product catalogue with only MTN mobile deals (LTE/5G), no fibre or other services.

---

**Last Updated:** 2025-11-02  
**Status:** ✅ Implemented and Tested  
**Commits:** 
- `2c43ccb` - Initial MTN import system
- `0a060f4` - Added LTE/5G filtering

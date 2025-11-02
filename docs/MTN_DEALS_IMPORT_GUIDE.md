# MTN Deals Monthly Import Guide

## Overview
This guide explains how to import monthly MTN promotional deals from Excel spreadsheets into the CircleTel product database.

## Files Created
- `scripts/import-mtn-deals.js` - Main import script
- `scripts/import-mtn-deals-test.js` - Test import with 10 products

## Import Script Features

### ✅ Automated Mapping
The script automatically maps MTN Excel columns to the `service_packages` table:
- **Deal ID** → SKU (unique identifier)
- **OEM and Device** → Part of product name
- **Price Plan** → Product name
- **Total Subscription Incl VAT** → Monthly price
- **Once-off Pay-in** → Setup fee
- **Total Data** → Features (e.g., "4GB Data")
- **Total Minutes** → Features (e.g., "200 Minutes")
- **Contract Term** → Stored in metadata

### ✅ Product Details
Each imported product includes:
- Full product name (e.g., "MTN Made For Business SM + Oppo Reno 14 5G")
- Monthly pricing (base_price_zar)
- Setup fees (pricing.setup)
- Data allocation (features array)
- Voice minutes and SMS (features array)
- Contract term (metadata)
- Free inclusions (SIM, CLI, ITB)
- Promo dates (start/end)
- Channel visibility (Helios/iLula availability)

## Usage

### 1. Dry Run (Preview Only - No Database Changes)
```bash
node scripts/import-mtn-deals.js "docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Oct-2025/Helios and iLula Business Promos - Oct 2025 - Deals.xlsx" --dry-run
```

**What it does:**
- Reads and parses the Excel file
- Shows sample products (first 3)
- Displays summary (total products found)
- **Makes NO database changes**

### 2. Test Import (First 10 Products Only)
```bash
node scripts/import-mtn-deals-test.js "docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Oct-2025/Helios and iLula Business Promos - Oct 2025 - Deals.xlsx"
```

**What it does:**
- Imports first 10 deals only
- Creates products in database
- Useful for verifying import is working correctly

✅ **Test Status:** Completed successfully (10/10 products inserted)

### 3. Full Import (All Products)
```bash
node scripts/import-mtn-deals.js "docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Oct-2025/Helios and iLula Business Promos - Oct 2025 - Deals.xlsx"
```

**What it does:**
- Imports ALL deals from Excel (17,464 products in Oct 2025 file)
- Automatically updates existing products (by SKU)
- Inserts new products

⚠️ **Warning:** This imports ~17k products. Make sure you want to do this!

### 4. Import Without Updating Existing
```bash
node scripts/import-mtn-deals.js "path/to/deals.xlsx" --no-update
```

**What it does:**
- Only inserts NEW products
- Skips products that already exist (by SKU)

## Monthly Import Process

When you receive a new MTN deals file each month:

### Step 1: Save the Excel File
```
docs/products/01_ACTIVE_PRODUCTS/MTN Deals/[Month-Year]/Helios and iLula Business Promos - [Month] [Year] - Deals.xlsx
```

Example:
```
docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Nov-2025/Helios and iLula Business Promos - Nov 2025 - Deals.xlsx
```

### Step 2: Dry Run (Preview)
```bash
node scripts/import-mtn-deals.js "docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Nov-2025/Helios and iLula Business Promos - Nov 2025 - Deals.xlsx" --dry-run
```

Check the output:
- Verify product count makes sense
- Check sample products look correct
- Note any parsing errors

### Step 3: Run Full Import
```bash
node scripts/import-mtn-deals.js "docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Nov-2025/Helios and iLula Business Promos - Nov 2025 - Deals.xlsx"
```

### Step 4: Verify Import
```bash
# Check count of MTN products
node -e "const {createClient} = require('@supabase/supabase-js'); require('dotenv').config({path: '.env.local'}); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('service_packages').select('id', {count: 'exact', head: true}).like('name', 'MTN%').then(({count}) => console.log('Total MTN products:', count));"
```

## Database Schema

Products are inserted into the `service_packages` table with the following structure:

```typescript
{
  id: UUID,                          // Auto-generated
  name: string,                      // "MTN Made For Business SM + Device"
  description: string,               // Full description with speed, minutes, etc.
  slug: string,                      // URL-friendly (auto-generated)
  sku: string,                       // Deal ID (unique identifier)
  service_type: '5g',               // Mobile deals
  product_category: 'business',      // B2B products
  customer_type: 'business',         // Business customers only
  base_price_zar: number,           // Monthly price incl VAT
  pricing: {                         // Detailed pricing
    monthly: number,
    setup: number,
    monthly_ex_vat: number,
    download_speed: null,
    upload_speed: null
  },
  features: string[],               // ["4GB Data", "200 Minutes", ...]
  metadata: {                        // Full deal details
    dealId: string,
    promoStartDate: ISO date,
    promoEndDate: ISO date,
    oemDevice: string,
    deviceStatus: string,
    pricePlan: string,
    contractTerm: number,
    // ... many more fields
  },
  is_featured: boolean,             // false by default
  is_popular: boolean,              // true if data >= 5GB
  status: 'active',
  active: true,
  network_provider_id: UUID,        // Links to MTN provider
  requires_fttb_coverage: false
}
```

## Data Mapping Details

| Excel Column | Database Field | Notes |
|-------------|----------------|-------|
| Deal ID | sku | Unique identifier for updates |
| Promo Start date | metadata.promoStartDate | Converted from Excel date |
| Promo End date | metadata.promoEndDate | Converted from Excel date |
| OEM and Device | Part of name, metadata.oemDevice | "Use Your Own" → SIM only |
| Total Subscription Incl Vat | base_price_zar, pricing.monthly | Monthly price |
| Total Subscription Ex Vat | pricing.monthly_ex_vat | Ex-VAT price |
| Once-off Pay-in | pricing.setup | Setup/activation fee |
| Price Plan | Part of name, metadata.pricePlan | Plan name |
| Total Data | Parsed to features | "4GB" → "4GB Data" feature |
| Total Minutes | Parsed to features | "200min" → "200 Minutes" |
| SMS Bundle | Parsed to features | "500sms" → "500 SMS" |
| Free Sim/CLI/ITB | features | Added if "Yes" |
| Contract Term | metadata.contractTerm | Contract length in months |
| Available on Helios | metadata.availableHelios | Boolean |
| Available on iLula | metadata.availableILula | Boolean |

## Troubleshooting

### Issue: "File not found"
**Solution:** Use the full path in quotes:
```bash
node scripts/import-mtn-deals.js "docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Oct-2025/Helios and iLula Business Promos - Oct 2025 - Deals.xlsx"
```

### Issue: Database connection error
**Solution:** Check your `.env.local` file has correct Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Issue: Import is slow
**Solution:** The script processes ~17k products which can take 5-10 minutes. This is normal.

### Issue: Duplicate products
**Solution:** The script automatically updates existing products by SKU. If you want to skip existing products instead, use:
```bash
node scripts/import-mtn-deals.js "path/to/file.xlsx" --no-update
```

## Notes

- **Unique Identifier:** SKU (Deal ID) is used to identify products. Same SKU = update existing product
- **Network Provider:** Script automatically links to MTN provider if found in database
- **Product Status:** All imported products are set to `active: true` and `status: 'active'`
- **Popular Flag:** Products with 5GB+ data are automatically marked as `is_popular: true`
- **Metadata:** All Excel columns are preserved in the `metadata` JSONB field for future reference

## Test Results (Oct 2025 File)

✅ **Dry Run:** Successfully parsed 17,464 deals  
✅ **Test Import:** 10 products inserted correctly  
⏳ **Full Import:** Not yet run (awaiting confirmation)

## Sample Product
```json
{
  "name": "MTN Made For Business SM + Oppo Reno 14 5G",
  "base_price_zar": 849,
  "sku": "202508EBU2726",
  "features": [
    "Free SIM Card",
    "Free CLI (Caller Line ID)",
    "Free ITB (International Toll Bypass)",
    "4GB Data",
    "200 Minutes"
  ],
  "metadata": {
    "dealId": "202508EBU2726",
    "contractTerm": 36,
    "oemDevice": "Oppo Reno 14 5G",
    "pricePlan": "Made For Business SM",
    "promoStartDate": "2025-08-01",
    "promoEndDate": "2025-11-07",
    "availableHelios": true,
    "availableILula": true
  }
}
```

## Questions?
Contact the development team or check `scripts/import-mtn-deals.js` for implementation details.

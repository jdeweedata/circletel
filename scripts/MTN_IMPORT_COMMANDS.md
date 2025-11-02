# MTN Deals Import - Quick Commands

## 📋 Quick Reference

All commands should be run from the project root: `C:\Projects\circletel-nextjs`

---

## 1. Preview Import (Dry Run)
**No database changes** - just shows what would be imported

```powershell
node scripts/import-mtn-deals.js "docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Oct-2025/Helios and iLula Business Promos - Oct 2025 - Deals.xlsx" --dry-run
```

**What you'll see:**
- Total deals found
- First 3 sample products
- Price range
- No database changes

---

## 2. Test Import (10 Products Only)
**Safe testing** - imports just the first 10 products

```powershell
node scripts/import-mtn-deals-test.js "docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Oct-2025/Helios and iLula Business Promos - Oct 2025 - Deals.xlsx"
```

**Result:** 10 products inserted into database

---

## 3. Full Import (All ~17,464 Products)
**Production import** - imports all deals from Excel

```powershell
node scripts/import-mtn-deals.js "docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Oct-2025/Helios and iLula Business Promos - Oct 2025 - Deals.xlsx"
```

**Time:** ~10 minutes  
**Updates:** Existing products (by SKU) are updated automatically

---

## 4. Full Import (Insert New Only)
**Skip existing products** - only insert new products

```powershell
node scripts/import-mtn-deals.js "docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Oct-2025/Helios and iLula Business Promos - Oct 2025 - Deals.xlsx" --no-update
```

**Result:** New products inserted, existing products skipped

---

## 5. Check Current MTN Products
**View database stats** - see what's already imported

```powershell
node scripts/check-mtn-products.js
```

**Shows:**
- Total MTN product count
- Price range (min, max, average)
- Sample products
- Contract term distribution
- Popular products count

---

## 6. Count Total MTN Products
**Quick count** - just the number

```powershell
node -e "const {createClient} = require('@supabase/supabase-js'); require('dotenv').config({path: '.env.local'}); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('service_packages').select('id', {count: 'exact', head: true}).like('name', 'MTN%').then(({count}) => console.log('Total MTN products:', count));"
```

---

## 7. View Sample Product Details
**Inspect one product** - see full data structure

```powershell
node -e "const {createClient} = require('@supabase/supabase-js'); require('dotenv').config({path: '.env.local'}); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('service_packages').select('*').like('name', 'MTN%').limit(1).single().then(({data}) => console.log(JSON.stringify(data, null, 2)));"
```

---

## 8. Delete All MTN Products
**⚠️ DANGER** - removes all MTN products (use with caution!)

```powershell
node -e "const {createClient} = require('@supabase/supabase-js'); require('dotenv').config({path: '.env.local'}); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); supabase.from('service_packages').delete().like('name', 'MTN%').then(({error}) => error ? console.error(error) : console.log('✅ All MTN products deleted'));"
```

⚠️ **WARNING:** This permanently deletes all products with "MTN" in the name!

---

## Monthly Import Workflow

### November 2025 Example

```powershell
# 1. Preview the file
node scripts/import-mtn-deals.js "docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Nov-2025/Helios and iLula Business Promos - Nov 2025 - Deals.xlsx" --dry-run

# 2. Import all deals
node scripts/import-mtn-deals.js "docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Nov-2025/Helios and iLula Business Promos - Nov 2025 - Deals.xlsx"

# 3. Verify import
node scripts/check-mtn-products.js
```

---

## Troubleshooting

### Problem: "Cannot find module"
```powershell
# Install dependencies
npm install
```

### Problem: "File not found"
```powershell
# Use absolute path or check file location
dir "docs\products\01_ACTIVE_PRODUCTS\MTN Deals\Oct-2025\"
```

### Problem: Database connection error
```powershell
# Check .env.local file exists and has correct keys
cat .env.local
```

### Problem: Import is slow
```
This is normal. ~17k products takes ~10 minutes.
Progress is shown in console.
```

---

## File Locations

| File | Purpose |
|------|---------|
| `scripts/import-mtn-deals.js` | Main import script |
| `scripts/import-mtn-deals-test.js` | Test with 10 products |
| `scripts/check-mtn-products.js` | Check database stats |
| `docs/MTN_DEALS_IMPORT_GUIDE.md` | Full documentation |
| `docs/MTN_DEALS_IMPORT_SUMMARY.md` | Implementation summary |
| `docs/products/01_ACTIVE_PRODUCTS/MTN Deals/Oct-2025/` | Current Excel file location |

---

## Current Status

✅ Test import completed: 10/10 products  
⏳ Full import: Ready to run (17,464 products)  
📊 Current total: 51 MTN products in database

---

## Quick Decision Guide

**Want to see what will happen?**
→ Run dry-run command (#1)

**Want to test safely?**
→ Run test import (#2)

**Ready to import everything?**
→ Run full import (#3)

**Want to check what's already there?**
→ Run check command (#5)

---

**Last Updated:** 2025-11-02  
**Status:** ✅ Ready for production use

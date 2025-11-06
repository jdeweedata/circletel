# MTN Business Deals Import Instructions

## Step-by-Step Guide to Import 17,464 MTN Deals

### ✅ Prerequisites Completed
- [x] JSON file converted from Excel (17,464 deals)
- [x] Comparison analysis complete
- [x] Database migration SQL created
- [x] Python import script created

---

## Step 1: Apply Database Migration

### Option A: Via Supabase Dashboard (RECOMMENDED)

1. **Go to Supabase SQL Editor**:
   - Open: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql
   
2. **Run the migration**:
   - Open file: `supabase/migrations/20251104105023_create_mtn_business_deals.sql`
   - Copy ALL content (entire file)
   - Paste into SQL Editor
   - Click "Run" button
   
3. **Verify table creation**:
   ```sql
   SELECT COUNT(*) FROM mtn_business_deals;
   ```
   Should return 0 (empty table)

### Option B: Via Supabase CLI (Alternative)

```bash
cd supabase
supabase db push --include 20251104105023_create_mtn_business_deals.sql
```

---

## Step 2: Test Import (100 Deals)

Test with a small subset first to ensure everything works:

```bash
python scripts/import-mtn-deals.py --test
```

**Expected Output**:
```
================================================================================
MTN BUSINESS DEALS IMPORT
================================================================================

[TEST MODE] Importing 100 deals only

Connected to Supabase
Loaded 17,464 deals from JSON

Starting import of 100 deals...
Batch size: 100

Processing batch 1/1 (100 deals)...
  Imported 100 deals (Total: 100/100)

================================================================================
IMPORT COMPLETE
================================================================================
Total Deals: 100
Imported: 100
Errors: 0
Success Rate: 100.0%

================================================================================
VERIFICATION
================================================================================

Total deals in database: 100
  1 months: X deals
  3 months: X deals
  ...
```

### If Test Succeeds → Proceed to Step 3
### If Test Fails → Check error messages and fix before proceeding

---

## Step 3: Full Import (All 17,464 Deals)

Once test is successful, import all deals:

```bash
python scripts/import-mtn-deals.py
```

**This will**:
- Import all 17,464 deals
- Process in batches of 100
- Take approximately 3-5 minutes
- Show progress for each batch

**Expected Output**:
```
================================================================================
MTN BUSINESS DEALS IMPORT
================================================================================

Connected to Supabase
Loaded 17,464 deals from JSON

Starting import of 17,464 deals...
Batch size: 100

Processing batch 1/175 (100 deals)...
  Imported 100 deals (Total: 100/17,464)

Processing batch 2/175 (100 deals)...
  Imported 100 deals (Total: 200/17,464)

... (continues for all 175 batches)

================================================================================
IMPORT COMPLETE
================================================================================
Total Deals: 17,464
Imported: 17,464
Errors: 0
Success Rate: 100.0%
```

---

## Step 4: Verify Import

Check the imported data:

```bash
python scripts/import-mtn-deals.py --verify-only
```

Or in Supabase SQL Editor:

```sql
-- Total count
SELECT COUNT(*) FROM mtn_business_deals;

-- By contract term
SELECT contract_term, COUNT(*) 
FROM mtn_business_deals 
GROUP BY contract_term 
ORDER BY contract_term;

-- By price plan (top 10)
SELECT price_plan, COUNT(*) as deal_count
FROM mtn_business_deals
GROUP BY price_plan
ORDER BY deal_count DESC
LIMIT 10;

-- By device (top 10)
SELECT device_name, COUNT(*) as deal_count
FROM mtn_business_deals
GROUP BY device_name
ORDER BY deal_count DESC
LIMIT 10;

-- Pricing summary
SELECT 
  MIN(monthly_price_incl_vat) as min_price,
  MAX(monthly_price_incl_vat) as max_price,
  AVG(monthly_price_incl_vat) as avg_price,
  COUNT(*) as total_deals
FROM mtn_business_deals;

-- Sample deals
SELECT 
  deal_name,
  device_name,
  price_plan,
  contract_term,
  monthly_price_incl_vat,
  total_data
FROM mtn_business_deals
LIMIT 10;
```

---

## Step 5: Update Admin Panel (Future)

Create admin UI to browse deals:

### Future Enhancements:
1. **Browse MTN Deals Page** (`/admin/products/mtn-deals`)
   - Filter by device, price plan, contract term
   - Search by deal ID or name
   - Sort by price, data bundle
   
2. **Add to Quote Builder**
   - Select MTN deal when creating quote
   - Automatically populate device + service
   - Calculate total contract value

3. **Deal Management**
   - Mark deals as active/inactive
   - Update pricing
   - Set expiry dates
   - Refresh from new MTN file monthly

---

## Import Script Options

```bash
# Test mode (100 deals only)
python scripts/import-mtn-deals.py --test

# Custom batch size
python scripts/import-mtn-deals.py --batch-size 50

# Verify only (no import)
python scripts/import-mtn-deals.py --verify-only

# Full import (default)
python scripts/import-mtn-deals.py
```

---

## Troubleshooting

### Error: "Table doesn't exist"
**Solution**: Run Step 1 first to create the table via SQL migration

### Error: "Duplicate key value violates unique constraint"
**Problem**: Trying to import same deal_id twice  
**Solution**: Clear table and re-import:
```sql
TRUNCATE TABLE mtn_business_deals CASCADE;
```
Then run import script again

### Error: "Value too long for type character varying"
**Problem**: Deal field exceeds column length  
**Solution**: Check which field and update migration SQL to increase length

### Import hangs or is very slow
**Problem**: Network issues or large batch size  
**Solution**: Reduce batch size:
```bash
python scripts/import-mtn-deals.py --batch-size 25
```

---

## Files Created

1. **`supabase/migrations/20251104105023_create_mtn_business_deals.sql`**
   - Database schema
   - Indexes
   - RLS policies
   - Comments

2. **`scripts/import-mtn-deals.py`**
   - Import script
   - Data mapping
   - Batch processing
   - Verification

3. **`docs/analysis/MTN_PRODUCTS_COMPARISON.md`**
   - Analysis report
   - Comparison with service_packages
   - Recommendations

4. **`scripts/compare-mtn-products.py`**
   - Comparison tool
   - Reusable for future comparisons

---

## Next Steps After Import

1. ✅ Verify all 17,464 deals imported successfully
2. Create admin page to browse deals
3. Integrate with quote system
4. Set up monthly refresh process (new MTN file)
5. Train sales team on using device bundles

---

## Data Refresh Process

MTN updates deals monthly/quarterly. To refresh:

1. Get new Excel file from MTN
2. Convert to JSON: `python scripts/excel-to-json.py "path/to/new-file.xlsx"`
3. Clear old deals: `TRUNCATE TABLE mtn_business_deals CASCADE;`
4. Import new deals: `python scripts/import-mtn-deals.py`
5. Verify: Check deal count and sample records

---

## Support

For issues:
1. Check error messages in terminal
2. Review Supabase logs
3. Check migration SQL syntax
4. Verify .env.local has correct credentials

---

**Ready to import? Start with Step 1!** 🚀

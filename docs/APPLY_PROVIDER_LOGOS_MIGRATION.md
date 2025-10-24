# Apply Provider Logos Migration - Instructions

**Migration File**: `supabase/migrations/20251024170000_add_provider_logos.sql`
**Status**: ⚠️ **Ready to Apply** (Manual step required)
**Date**: 2025-10-24

---

## ⚡ Quick Apply (Supabase Dashboard)

### Step-by-Step Instructions

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng
   - Login if needed

2. **Navigate to SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Or use direct link: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new

3. **Open Migration File**
   - Open `supabase/migrations/20251024170000_add_provider_logos.sql` in your editor
   - Select ALL content (Ctrl+A / Cmd+A)
   - Copy to clipboard (Ctrl+C / Cmd+C)

4. **Paste and Run**
   - In Supabase SQL Editor, paste the SQL (Ctrl+V / Cmd+V)
   - Review the SQL (optional - it's been tested)
   - Click the **RUN** button (or press Ctrl+Enter)

5. **Verify Success**
   - You should see success messages in the output panel
   - Look for: "Provider Logos - Migration Complete"
   - Verify: "✓ Providers with logos: 2" (MTN and DFA)

---

## 📋 What This Migration Does

### Database Changes

**1. Adds 5 New Columns** to `fttb_network_providers` table:
```sql
- logo_url          TEXT           -- Primary logo path
- logo_dark_url     TEXT           -- Dark variant (for dark backgrounds)
- logo_light_url    TEXT           -- Light variant (for light backgrounds)
- logo_format       VARCHAR(10)    -- File format (svg/png/jpg)
- logo_aspect_ratio DECIMAL(5,2)   -- Width/height ratio for scaling
```

**2. Updates 5 Providers** with logo information:
- ✅ **MTN**: `/images/providers/mtn.png` (PNG, 1.78 ratio)
- ✅ **DFA**: `/images/providers/dfa-dark.png` + `/images/providers/dfa-white.png` (PNG, 1.35 ratio)
- ✅ **MetroFibre**: `/images/providers/metrofibre.svg` (SVG, 2.15 ratio)
- ✅ **Openserve**: `/images/providers/openserve.svg` (SVG, 3.64 ratio)
- ✅ **Vumatel**: `/images/providers/vumatel.svg` (SVG, 5.88 ratio)

**3. Creates 1 New View**:
- `v_providers_with_logos` - Convenient view of active providers with logo data

**4. Updates 1 Existing View**:
- `v_products_with_providers` - Now includes provider logo data in product queries

**5. Creates 1 Index**:
- `idx_fttb_network_providers_logo` - Optimizes logo queries by provider_code

---

## ✅ Expected Output

After running the migration, you should see:

```
================================================
Provider Logos - Migration Complete
================================================

Logo Summary:
  ✓ Providers with logos: 2
  ✓ Total active providers: 2
  ✓ Coverage: 100.00 %

Logo Locations:
  ✓ MTN: /images/providers/mtn.png (3840×2160, 31KB)
  ✓ DFA: /images/providers/dfa-dark.png, /images/providers/dfa-white.png
  ✓ MetroFibre: /images/providers/metrofibre.svg
  ✓ Openserve: /images/providers/openserve.svg
  ✓ Vumatel: /images/providers/vumatel.svg

Views Created:
  ✓ v_providers_with_logos (active providers with logos)
  ✓ v_products_with_providers (updated with logo data)

Ready for Component Implementation
================================================
```

---

## 🧪 Verify Migration Success

### Test Query 1: Check New Columns
```sql
SELECT
  provider_code,
  display_name,
  logo_url,
  logo_format,
  logo_aspect_ratio
FROM fttb_network_providers
WHERE active = true
ORDER BY priority;
```

**Expected Result**: 2 rows (MTN and DFA) with logo data populated

### Test Query 2: Check View
```sql
SELECT * FROM v_providers_with_logos;
```

**Expected Result**: 2 rows with complete logo information

### Test Query 3: Check Products with Provider Data
```sql
SELECT
  id,
  name,
  service_type,
  provider_details
FROM v_products_with_providers
LIMIT 5;
```

**Expected Result**: Products with provider_details JSON containing logo URLs

---

## 🔄 Rollback (If Needed)

If you need to undo this migration:

```sql
-- Remove columns
ALTER TABLE fttb_network_providers
DROP COLUMN IF EXISTS logo_url,
DROP COLUMN IF EXISTS logo_dark_url,
DROP COLUMN IF EXISTS logo_light_url,
DROP COLUMN IF EXISTS logo_format,
DROP COLUMN IF EXISTS logo_aspect_ratio;

-- Drop view
DROP VIEW IF EXISTS v_providers_with_logos;

-- Recreate original v_products_with_providers view (without logo data)
-- See: supabase/migrations/20251021000006_cleanup_and_migrate.sql (lines 208-253)
```

---

## 🚨 Troubleshooting

### Error: "relation fttb_network_providers does not exist"
**Cause**: Base provider table not created
**Fix**: Run migration `20251021000006_cleanup_and_migrate.sql` first

### Error: "column logo_url already exists"
**Cause**: Migration already applied
**Solution**: This is safe - the `IF NOT EXISTS` clause will skip the column creation

### Error: "provider_code 'mtn' not found"
**Cause**: Provider records don't exist yet
**Fix**: Check that previous migrations created provider records

### No Providers with Logos
**Cause**: Providers might be inactive
**Check**:
```sql
SELECT provider_code, display_name, active
FROM fttb_network_providers;
```
**Fix**: Ensure MTN and DFA have `active = true`

---

## 📝 Post-Migration Checklist

After successful migration:

- [ ] ✅ Verify 5 new columns exist in `fttb_network_providers`
- [ ] ✅ Verify 2 active providers have logo_url populated
- [ ] ✅ Test view `v_providers_with_logos` returns 2 rows
- [ ] ✅ Test view `v_products_with_providers` includes provider_details
- [ ] ✅ Proceed to API integration (next step)

---

## 🔗 Next Steps

**After migration applied successfully**:

1. **Modify Coverage API** (`app/api/coverage/packages/route.ts`)
   - Add provider data to package responses
   - See: `docs/SESSION_SUMMARY_PROVIDER_LOGOS_2025-10-24.md` (Step 2)

2. **Update Product Cards** (`components/ui/compact-package-card.tsx`)
   - Import and display `ProviderLogo` component
   - See: `docs/SESSION_SUMMARY_PROVIDER_LOGOS_2025-10-24.md` (Step 3)

3. **Test Integration**
   - Run coverage check with real address
   - Verify logos display on product cards
   - Test responsive design

---

## 📚 References

- **Migration File**: `supabase/migrations/20251024170000_add_provider_logos.sql`
- **Component**: `components/products/ProviderLogo.tsx`
- **Full Analysis**: `docs/analysis/PROVIDER_LOGOS_ANALYSIS.md`
- **Implementation Guide**: `docs/SESSION_SUMMARY_PROVIDER_LOGOS_2025-10-24.md`

---

**Status**: Ready to apply ✅
**Risk Level**: Low (uses IF NOT EXISTS, safe to run multiple times)
**Estimated Time**: 30 seconds
**Required By**: Provider logo integration in coverage API

**Questions?** See troubleshooting section above or check full documentation.

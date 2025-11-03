# Service Packages Migration Instructions

## ⚠️ IMPORTANT: Apply Database Migration First

Before the updated admin panel will work, you MUST apply the database migration.

### ⚠️ UPDATE: Use V2 Migration (Fixes Duplicate Slug Error)

If you got error: `could not create unique index "service_packages_slug_unique"`, use the V2 migration below.

### Step 1: Apply SQL Migration

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to: https://app.supabase.com/project/agyjovdugmtopasyvlng/sql
2. Click "New Query"
3. Copy the entire contents of: `supabase/migrations/20251030194500_enhance_service_packages_v2.sql` ← **USE V2!**
4. Paste into the SQL Editor
5. Click "Run" (or press Ctrl+Enter)
6. Wait for "Success" message

**What's Fixed in V2:**
- Handles duplicate product names by appending `-2`, `-3`, etc. to slugs
- Example: Two "SkyFibre Starter" products become `skyfibre-starter` and `skyfibre-starter-2`

**Option B: Via Command Line** (if you have psql installed)

```bash
# Set your database URL first
export DB_URL="postgresql://postgres:[YOUR_PASSWORD]@db.agyjovdugmtopasyvlng.supabase.co:5432/postgres"

# Apply migration
psql "$DB_URL" < supabase/migrations/20251030193000_enhance_service_packages.sql
```

### Step 2: Verify Migration

Run this script to verify the migration was successful:

```bash
node -r dotenv/config -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data, error } = await supabase
    .from('service_packages')
    .select('id, name, pricing, slug, base_price_zar, is_featured')
    .limit(1);

  if (error) {
    console.error('❌ Migration not applied yet:', error.message);
  } else {
    console.log('✅ Migration successful!');
    console.log('Sample record:', JSON.stringify(data[0], null, 2));
  }
})();
"
```

### Step 3: Restart Dev Server

```bash
# Kill existing dev server
# Then restart
npm run dev:memory
```

## What This Migration Does

### New Fields Added to `service_packages`:

1. **`pricing`** (JSONB) - Structured pricing: `{monthly, setup, download_speed, upload_speed}`
2. **`slug`** (TEXT) - SEO-friendly URLs
3. **`sku`** (TEXT) - Product SKU codes
4. **`metadata`** (JSONB) - Flexible data storage
5. **`is_featured`** (BOOLEAN) - Homepage featured flag
6. **`is_popular`** (BOOLEAN) - Popular products flag
7. **`status`** (TEXT) - Product status: active/inactive/archived/draft
8. **`bundle_components`** (JSONB) - For product bundles
9. **`base_price_zar`** (NUMERIC) - Synced with pricing.monthly
10. **`cost_price_zar`** (NUMERIC) - Synced with pricing.setup

### Auto-Generated Data:

- **Slugs** - Generated from product names (e.g., "SkyFibre SME 50" → "skyfibre-sme-50")
- **Pricing Objects** - Built from existing `price` and `speed_down`/`speed_up` fields
- **Sync Triggers** - Automatically keep pricing JSONB and root-level fields in sync

### New Features:

- **Audit Trail** - All changes logged to `service_packages_audit_logs`
- **Auto-Sync** - Pricing fields automatically synchronized
- **Indexes** - Optimized for slug, status, featured, popular queries

## Troubleshooting

### Error: "column pricing does not exist"
**Solution**: You haven't applied the migration yet. Follow Step 1 above.

### Error: "duplicate key value violates unique constraint"
**Solution**: Some products have duplicate names. The migration will skip these - you can fix them manually after.

### Migration takes too long
**Solution**: The migration processes 83 records. Should complete in < 10 seconds. If it hangs, check Supabase Dashboard for active queries.

## After Migration

Once the migration is complete:

1. ✅ Admin panel will manage `service_packages` (all 83 products)
2. ✅ Coverage checker will show updated prices immediately
3. ✅ Wireless page will use the same data source
4. ✅ Single source of truth for all products
5. ✅ Audit trail for all changes

---

**Questions?** Check the migration file comments or ask for help.

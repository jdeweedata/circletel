# Products Table Deprecation Notice

**Status**: 🟡 DEPRECATED - In Migration Phase
**Migration Deadline**: TBD
**Replacement**: `service_packages` table

---

## Overview

The `products` table is being **deprecated** in favor of the `service_packages` table as part of CircleTel's TMF-aligned product catalogue architecture (Epic 1.6).

### Why Deprecate?

1. **Dual Source of Truth Problem**: Having both `products` and `service_packages` creates data inconsistency
2. **Admin Workflow**: Product managers now use `admin_products` → publish → `service_packages` workflow
3. **TMF Alignment**: `service_packages` aligns with TM Forum Product Catalogue specification
4. **Zoho Integration**: All Zoho CRM syncs use `service_packages`

### Data Flow (Current)

```
admin_products (ProductSpecification)
    ↓
    Publish Pipeline
    ↓
service_packages (ProductOffering) ← CANONICAL SOURCE
    ↓
Zoho CRM Products
```

The `products` table is **not** part of this flow and should not be used.

---

## Current Usage Audit (Epic 1.6)

### Files Still Using `products` Table

| File | Usage | Priority | Migration Status |
|------|-------|----------|------------------|
| `lib/services/products.ts` | Legacy CRUD service | 🔴 High | ⏳ Pending |
| `app/api/admin/stats/route.ts` | Admin dashboard stats | 🔴 High | ⏳ Pending |
| `app/api/admin/products/[id]/route.ts` | Admin product detail API | 🟡 Medium | ⏳ Pending |
| `lib/services/products-client.ts` | Client-side product fetching | 🟡 Medium | ⏳ Pending |
| `app/admin/products/new/page.tsx` | Create new product page | 🟢 Low | ⏳ Pending |

### Files Using `service_packages` Table (✅ Already Migrated)

- `lib/catalog/publish.ts` - Publish pipeline
- `lib/integrations/zoho/product-sync-service.ts` - Zoho CRM sync
- `lib/integrations/zoho/sync-retry-service.ts` - Retry logic
- `scripts/backfill-zoho-products.js` - Backfill script
- `app/api/admin/products/integration-status/route.ts` - Integration status
- Plus 15 other files (50+ total occurrences)

---

## Migration Guide

### For Developers

**DO NOT** add new code that queries the `products` table. Use `service_packages` instead.

#### ❌ Old Pattern (Deprecated)
```typescript
// DON'T DO THIS
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('status', 'active');
```

#### ✅ New Pattern (Correct)
```typescript
// DO THIS INSTEAD
const { data } = await supabase
  .from('service_packages')
  .select('*')
  .eq('status', 'active');
```

### Field Mapping: `products` → `service_packages`

| Old (products) | New (service_packages) | Notes |
|----------------|------------------------|-------|
| `id` | `id` | UUID primary key |
| `name` | `name` | Product name |
| `sku` | `sku` | Product code |
| `category` | `category` | Category |
| `description` | `description` | Description |
| `base_price_zar` | `base_price_zar` | Monthly price |
| `cost_price_zar` | `cost_price_zar` | Cost price |
| `status` | `status` | Status (draft/active/archived) |
| `is_active` | `status === 'active'` | Derived from status |
| `is_featured` | `is_featured` | Featured flag |
| `is_popular` | `is_popular` | Popular flag |
| `service_type` | `service_type` | Service type |
| `features` | `features` | Features array |
| `pricing` | `pricing` | Pricing JSON |
| `metadata` | `metadata` | Metadata JSON |
| `bundle_components` | `bundle_components` | Bundle components |
| `created_at` | `created_at` | Created timestamp |
| `updated_at` | `updated_at` | Updated timestamp |
| N/A | `source_admin_product_id` | **NEW**: Links to admin_products |
| N/A | `valid_from` | **NEW**: Offering launch date |
| N/A | `valid_to` | **NEW**: Offering retirement date |
| N/A | `market_segment` | **NEW**: B2B/B2C/Partner |
| N/A | `provider` | **NEW**: MTN/DFA/Vumatel |

### Migration Checklist for Each File

- [ ] Replace `from('products')` with `from('service_packages')`
- [ ] Update type imports from `Product` to match new schema
- [ ] Handle new fields: `source_admin_product_id`, `valid_from`, `valid_to`
- [ ] Update queries to use `status === 'active'` instead of `is_active`
- [ ] Test thoroughly before committing
- [ ] Update documentation

---

## Migration Steps (Priority Order)

### Phase 1: High Priority (Week 1)

**1.1 Admin Stats API** (`app/api/admin/stats/route.ts`)
- **Impact**: Admin dashboard uses this for product counts
- **Change**: Line 26 - Change `from('products')` to `from('service_packages')`
- **Testing**: Visit `/admin` and verify product stats display correctly

**1.2 Legacy Products Service** (`lib/services/products.ts`)
- **Impact**: Used by admin product creation page
- **Change**: Refactor entire service to use `service_packages`
- **Alternative**: Deprecate service entirely, use publish pipeline instead
- **Testing**: Admin product CRUD operations

### Phase 2: Medium Priority (Week 2)

**2.1 Admin Product Detail API** (`app/api/admin/products/[id]/route.ts`)
- **Impact**: Product detail page
- **Change**: Query `service_packages` instead of `products`
- **Testing**: Visit `/admin/products/[id]`

**2.2 Products Client Service** (`lib/services/products-client.ts`)
- **Impact**: Client-side product fetching
- **Change**: Update queries to `service_packages`
- **Testing**: Frontend product displays

### Phase 3: Low Priority (Week 3)

**3.1 Create Product Page** (`app/admin/products/new/page.tsx`)
- **Impact**: New product creation
- **Change**: Use admin_products table + publish pipeline instead
- **Recommendation**: This page should create `admin_products`, not `products`
- **Testing**: Create new product workflow

---

## Rollout Plan

### Step 1: Add Deprecation Warnings (Week 1)
```typescript
// Add to lib/services/products.ts
console.warn(
  '[DEPRECATED] ProductsService uses legacy products table. ' +
  'Use service_packages instead. See docs/admin/PRODUCTS_TABLE_DEPRECATION.md'
);
```

### Step 2: Migrate Code (Weeks 1-3)
- Follow migration checklist for each file
- Deploy to staging after each migration
- Test thoroughly before production

### Step 3: Mark Table as Read-Only (Week 4)
```sql
-- Revoke INSERT, UPDATE, DELETE on products table
REVOKE INSERT, UPDATE, DELETE ON products FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON products FROM anon;

-- Add trigger to prevent writes
CREATE OR REPLACE FUNCTION prevent_products_table_writes()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'The products table is deprecated and read-only. Use service_packages instead.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_readonly
BEFORE INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION prevent_products_table_writes();
```

### Step 4: Archive Table (Week 6+)
- Backup `products` table data
- Rename table to `products_archived`
- Keep for historical reference only

---

## FAQs

**Q: Why not just rename `service_packages` to `products`?**
A: `service_packages` has additional fields (`source_admin_product_id`, `valid_from`, etc.) that align with TMF spec. It's architecturally different.

**Q: What happens to existing data in `products` table?**
A: Existing data should be migrated via the publish pipeline. Products in `products` table should be recreated in `admin_products` and published to `service_packages`.

**Q: Can I still read from `products` table?**
A: Yes, during migration phase. But all new code should use `service_packages`.

**Q: What about consumer-facing pages?**
A: All consumer pages (product listings, checkout, quotes) should ONLY use `service_packages`.

**Q: How does this affect Zoho CRM integration?**
A: No impact. Zoho sync already uses `service_packages` exclusively.

---

## Support

For questions about this migration:
- **Technical Lead**: Platform Engineering Team
- **Documentation**: `docs/admin/PRODUCT_CATALOGUE_ZOHO_INTEGRATION_PLAN.md`
- **Epic**: Epic 1.6 - Refactor consumer flows to rely only on service_packages

---

**Last Updated**: 2025-01-15
**Status**: 🟡 Migration In Progress
**Next Review**: 2025-02-01

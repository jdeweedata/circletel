# Admin Product Management - Complete Guide

**Purpose**: Manage CircleTel products, pricing, and features through the admin panel
**Tables**: `products` (master catalog) and `service_packages` (coverage checker packages)
**Access**: Admin panel → Products section
**Permissions Required**: `products:view`, `products:edit`, `products:create`

---

## 🎯 Overview

CircleTel has **TWO product tables** that serve different purposes:

### 1. `products` Table (Master Catalog)
**Purpose**: Main product database managed via admin panel
**Used By**: Admin dashboard, product management, analytics
**Location**: Admin → Products page
**Features**:
- Full CRUD operations
- Price history/audit logs
- Product approvals workflow
- SKU management
- Category organization

### 2. `service_packages` Table (Coverage Packages)
**Purpose**: Package recommendations for coverage checker
**Used By**: Coverage results page (`/packages/[leadId]`)
**API**: `/api/coverage/packages`
**Features**:
- Promotion pricing
- Speed tiers
- Service type mapping
- Customer type segmentation

---

## 📊 Current Status

### ✅ What's Already Implemented

**Admin UI Pages**:
- `/admin/products` - Product list with filtering ✅
- `/admin/products/new` - Create new product ✅
- `/admin/products/approvals` - Product approval workflow ✅

**API Routes**:
- `GET /api/admin/products` - List products with filtering ✅
- `GET /api/admin/products/[id]` - Get single product ✅
- `PUT /api/admin/products/[id]` - Update product ✅
- `GET /api/admin/products/[id]/audit-logs` - View change history ✅

**Features**:
- ✅ RBAC permission gates
- ✅ Product filtering (category, status, service)
- ✅ Price editing with change reason
- ✅ Audit log tracking
- ✅ Bulk actions (archive, activate)
- ✅ Featured/popular product flags

---

### ⚠️ What's Missing

**Edit Page**:
- ❌ No dedicated `/admin/products/[id]/edit` page
- ❌ Product features array editor
- ❌ Image/media upload
- ❌ Service package synchronization

**Sync Between Tables**:
- ❌ No automatic sync from `products` → `service_packages`
- ❌ Manual updates required in both tables
- ❌ Risk of pricing drift

**Frontend Display**:
- ⚠️ Coverage checker uses `service_packages` (recently fixed)
- ⚠️ Product pages may use `products` table
- ⚠️ Need unified approach

---

## 🔧 Recommended Solution

### Option A: Keep Both Tables with Sync (Recommended ⭐)

**Approach**:
1. Use `products` as master source of truth
2. Keep `service_packages` for coverage-specific features (promotions, speed tiers)
3. Add sync mechanism to update `service_packages` when `products` change

**Pros**:
- ✅ Maintains coverage-specific features
- ✅ Single admin interface for product management
- ✅ Automatic synchronization prevents drift
- ✅ Preserves existing functionality

**Cons**:
- ⚠️ More complex architecture
- ⚠️ Requires sync logic/triggers

---

### Option B: Migrate to Single `products` Table

**Approach**:
1. Migrate all data from `service_packages` to `products`
2. Add coverage-specific columns to `products` (promotion_price, etc.)
3. Update coverage API to query `products`
4. Deprecate `service_packages`

**Pros**:
- ✅ Single source of truth
- ✅ Simpler architecture
- ✅ Easier to maintain

**Cons**:
- ⚠️ Requires data migration
- ⚠️ Schema changes
- ⚠️ May break existing queries

---

## 🚀 Implementation Plan (Option A)

### Phase 1: Create Product Edit Page (2 hours)

**File**: `app/admin/products/[id]/edit/page.tsx`

**Features**:
- Product details form (name, SKU, description)
- Pricing fields (monthly price, setup fee)
- Features array editor (add/remove/reorder)
- Category and service selection
- Customer type (consumer/smme/enterprise)
- Active/featured toggles
- Change reason field

**Components Needed**:
- Form with react-hook-form + Zod validation
- Features list editor (dynamic array)
- Image upload (future)
- Permission gate (PRODUCTS.EDIT)

---

### Phase 2: Add Sync Logic (1 hour)

**Option 2a: Database Trigger** (Recommended)
```sql
CREATE OR REPLACE FUNCTION sync_product_to_service_packages()
RETURNS TRIGGER AS $$
BEGIN
  -- Update corresponding service_package when product changes
  UPDATE service_packages
  SET
    name = NEW.name,
    price = NEW.price_monthly,
    speed_down = NEW.speed_download,
    speed_up = NEW.speed_upload,
    description = NEW.description,
    features = NEW.features,
    active = NEW.is_active,
    updated_at = NOW()
  WHERE
    -- Match by SKU or create mapping table
    service_type = NEW.service
    AND product_category = NEW.category
    AND name = NEW.name; -- or use a mapping table

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_products_trigger
AFTER UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION sync_product_to_service_packages();
```

**Option 2b: API Middleware**
```typescript
// In PUT /api/admin/products/[id]/route.ts
async function syncToServicePackages(product: Product) {
  // Find matching service_package
  const { data: pkg } = await supabase
    .from('service_packages')
    .select('id')
    .eq('name', product.name)
    .single();

  if (pkg) {
    // Update service_package
    await supabase
      .from('service_packages')
      .update({
        price: product.price_monthly,
        speed_down: product.speed_download,
        speed_up: product.speed_upload,
        description: product.description,
        features: product.features,
        active: product.is_active
      })
      .eq('id', pkg.id);
  }
}
```

---

### Phase 3: Features Array Editor (1 hour)

**Component**: `components/admin/products/FeaturesEditor.tsx`

```typescript
interface FeaturesEditorProps {
  features: string[];
  onChange: (features: string[]) => void;
}

export function FeaturesEditor({ features, onChange }: FeaturesEditorProps) {
  const [newFeature, setNewFeature] = useState('');

  const addFeature = () => {
    if (newFeature.trim()) {
      onChange([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    onChange(features.filter((_, i) => i !== index));
  };

  const moveFeature = (from: number, to: number) => {
    const updated = [...features];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    onChange(updated);
  };

  return (
    <div>
      <Label>Product Features</Label>
      <div className="space-y-2">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => moveFeature(index, Math.max(0, index - 1))}
              disabled={index === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => moveFeature(index, Math.min(features.length - 1, index + 1))}
              disabled={index === features.length - 1}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Input value={feature} readOnly className="flex-1" />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => removeFeature(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            placeholder="Add new feature..."
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addFeature()}
          />
          <Button onClick={addFeature}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 4: Test & Verify (30 minutes)

**Test Cases**:
1. ✅ Edit product in admin panel
2. ✅ Update price → verify `service_packages` synced
3. ✅ Add/remove features → verify display on coverage page
4. ✅ Toggle active status → verify coverage API excludes inactive
5. ✅ Check RBAC permissions prevent unauthorized edits
6. ✅ Verify audit logs record all changes

---

## 📋 Quick Start Guide

### For Admin Users

**To Edit a Product**:
1. Go to **Admin → Products**
2. Find product in list (use search/filters)
3. Click **Edit** button (or three dots menu → Edit)
4. Update fields as needed:
   - Name, description, SKU
   - Pricing (monthly, setup fee)
   - Features (add/remove items)
   - Status (active/inactive)
   - Featured flag
5. Provide **change reason** (e.g., "Updated pricing for Q1 2025")
6. Click **Save Changes**
7. ✅ Product updated in database
8. ✅ Coverage checker automatically shows new pricing

**To Create a Product**:
1. Go to **Admin → Products**
2. Click **+ New Product** button
3. Fill in all required fields
4. Click **Create Product**
5. If sync is enabled, product appears in coverage checker

---

## 🔐 Permissions

Required permissions for product management:

| Action | Permission | Who Has Access |
|--------|-----------|----------------|
| View products | `products:view` | All admin users |
| Edit product | `products:edit` | Product Manager, Super Admin |
| Create product | `products:create` | Product Manager, Super Admin |
| Delete product | `products:delete` | Super Admin only |
| Approve product | `products:approve` | Product Manager, Super Admin |
| View audit logs | `products:audit` | Product Manager, Finance, Super Admin |

---

## 📊 Current Data Structure

### `products` Table Schema
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  sku VARCHAR UNIQUE,
  category VARCHAR, -- 'connectivity', 'it_services', 'bundle', etc.
  service VARCHAR, -- 'SkyFibre', 'BizFibreConnect', etc.
  customer_type VARCHAR, -- 'consumer', 'smme', 'enterprise'
  price_monthly DECIMAL,
  price_once_off DECIMAL,
  speed_download INTEGER,
  speed_upload INTEGER,
  data_limit VARCHAR,
  contract_duration VARCHAR,
  description TEXT,
  features TEXT[] OR JSONB, -- Array of feature strings
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `service_packages` Table Schema
```sql
CREATE TABLE service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  service_type VARCHAR,
  product_category VARCHAR,
  speed_down INTEGER,
  speed_up INTEGER,
  price NUMERIC,
  promotion_price NUMERIC,
  promotion_months INTEGER,
  description TEXT,
  features TEXT[], -- Array of feature strings
  active BOOLEAN DEFAULT true,
  customer_type VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 Workflow Example

**Scenario**: Update SkyFibre Starter price from R799 to R849

**Steps**:
1. Admin logs in with Product Manager role
2. Navigates to **Admin → Products**
3. Searches for "SkyFibre Starter"
4. Clicks **Edit** button
5. Updates `Monthly Price` field: `799` → `849`
6. Enters change reason: "Price increase Q1 2025"
7. Clicks **Save Changes**

**What Happens**:
1. ✅ API validates user has `products:edit` permission
2. ✅ Updates `products` table: `price_monthly = 849`
3. ✅ Trigger/middleware syncs to `service_packages`: `price = 849`
4. ✅ Audit log created with user, timestamp, old/new values
5. ✅ Coverage checker immediately shows R849 for new searches
6. ✅ Product page shows updated pricing

---

## 🔗 Related Files

**Admin Pages**:
- `app/admin/products/page.tsx` - Product list
- `app/admin/products/new/page.tsx` - Create product
- `app/admin/products/[id]/edit/page.tsx` - Edit product (TO BE CREATED)

**API Routes**:
- `app/api/admin/products/route.ts` - List/create products
- `app/api/admin/products/[id]/route.ts` - Get/update/delete product

**Components**:
- `components/admin/products/PriceEditModal.tsx` - Quick price edit
- `components/admin/products/AuditHistoryModal.tsx` - View audit logs
- `components/admin/products/FeaturesEditor.tsx` - Manage features (TO BE CREATED)

**Services**:
- `lib/services/products-client.ts` - Client-side product service
- `lib/types/products.ts` - Product TypeScript types

---

## 📌 Next Steps

**Immediate (This Session)**:
1. Create product edit page `/admin/products/[id]/edit`
2. Build features array editor component
3. Add sync logic (trigger or middleware)
4. Test complete workflow

**Short-term (This Week)**:
1. Add image upload for product photos
2. Create bulk edit functionality
3. Add product import/export (Excel)
4. Improve mobile responsiveness

**Long-term (Future)**:
1. Consider migrating to single `products` table
2. Add product versioning
3. Implement product bundles/upsells
4. Add inventory management

---

**Created**: 2025-01-20
**Status**: Planning Complete
**Priority**: HIGH - Critical for product management
**Estimated Time**: 4-5 hours for complete implementation

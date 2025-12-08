# Supplier Product Detail Page - Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Products List   │    │ Direct URL      │    │ Search/Filter   │
│ Row Click       │    │ Access          │    │ Result Click    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP ROUTER                               │
│                                                                     │
│   /admin/suppliers/products/[id]                                    │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  ProductDetailPage (Client Component)                       │  │
│   │                                                             │  │
│   │  1. Extract ID from params                                  │  │
│   │  2. Fetch product data                                      │  │
│   │  3. Render loading/error/data states                        │  │
│   └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ fetch()
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API ROUTE HANDLER                                │
│                                                                     │
│   /api/admin/suppliers/products/[id]/route.ts                       │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  GET Handler                                                │  │
│   │                                                             │  │
│   │  1. Parse ID from async params                              │  │
│   │  2. Create Supabase client                                  │  │
│   │  3. Query supplier_products with suppliers join             │  │
│   │  4. Calculate margin                                        │  │
│   │  5. Resolve image URL                                       │  │
│   │  6. Return JSON response                                    │  │
│   └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ SQL Query
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                    │
│                                                                     │
│   ┌───────────────────────┐    ┌───────────────────────┐           │
│   │  supplier_products    │───▶│  suppliers            │           │
│   │                       │    │                       │           │
│   │  - id                 │    │  - id                 │           │
│   │  - supplier_id (FK)   │    │  - name               │           │
│   │  - sku                │    │  - code               │           │
│   │  - name               │    │  - website_url        │           │
│   │  - description        │    └───────────────────────┘           │
│   │  - manufacturer       │                                        │
│   │  - cost_price         │                                        │
│   │  - retail_price       │                                        │
│   │  - cached_image_path  │                                        │
│   │  - source_image_url   │                                        │
│   │  - stock_cpt/jhb/dbn  │                                        │
│   │  - specifications     │                                        │
│   │  - features           │                                        │
│   │  - ...                │                                        │
│   └───────────────────────┘                                        │
│                                                                     │
│   ┌───────────────────────┐                                        │
│   │  supplier-images      │  (Storage Bucket)                      │
│   │  Public images        │                                        │
│   └───────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  ProductDetailPage                                                  │
│  ════════════════                                                   │
│  State: product, loading, error                                     │
│  Effect: fetch on mount                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  PageHeader                                                  │  │
│  │  ──────────                                                  │  │
│  │  ┌─────────┐ ┌─────────────────┐ ┌────────────────────────┐ │  │
│  │  │ Back    │ │ Title + SKU     │ │ Badges + Links         │ │  │
│  │  │ Button  │ │                 │ │ [Active] [In Stock]    │ │  │
│  │  └─────────┘ └─────────────────┘ └────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Tabs                                                        │  │
│  │  ────                                                        │  │
│  │  [Overview] [Specifications] [Metadata]                      │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  TabContent: Overview                                  │ │  │
│  │  │                                                        │ │  │
│  │  │  ┌─────────┐  ┌────────────────────────────────────┐  │ │  │
│  │  │  │ Product │  │ Core Details Card                  │  │ │  │
│  │  │  │ Image   │  │ - Name                             │  │ │  │
│  │  │  │         │  │ - Description                      │  │ │  │
│  │  │  │ (or Box │  │ - Manufacturer                     │  │ │  │
│  │  │  │  icon)  │  │ - Category                         │  │ │  │
│  │  │  └─────────┘  │ - Supplier link                    │  │ │  │
│  │  │               └────────────────────────────────────┘  │ │  │
│  │  │                                                        │ │  │
│  │  │  ┌─────────────────────┐  ┌────────────────────────┐  │ │  │
│  │  │  │ Pricing Card        │  │ Stock Card             │  │ │  │
│  │  │  │                     │  │                        │  │ │  │
│  │  │  │ Cost:   R450.00 ↑   │  │ CPT:  15  ┌─────┐     │  │ │  │
│  │  │  │ Retail: R599.00     │  │ JHB:  23  │ Bar │     │  │ │  │
│  │  │  │ Margin: R149 (33%)  │  │ DBN:   8  │Chart│     │  │ │  │
│  │  │  │                     │  │ Total: 46 └─────┘     │  │ │  │
│  │  │  └─────────────────────┘  └────────────────────────┘  │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  TabContent: Specifications                            │ │  │
│  │  │                                                        │ │  │
│  │  │  ┌──────────────────────────────────────────────────┐ │ │  │
│  │  │  │ Specifications Table (from JSONB)                │ │ │  │
│  │  │  │ ┌─────────────────┬───────────────────────────┐ │ │ │  │
│  │  │  │ │ Key             │ Value                     │ │ │ │  │
│  │  │  │ ├─────────────────┼───────────────────────────┤ │ │ │  │
│  │  │  │ │ Warranty        │ 2 years                   │ │ │ │  │
│  │  │  │ │ Weight          │ 1.5kg                     │ │ │ │  │
│  │  │  │ │ Dimensions      │ 30x20x10cm                │ │ │ │  │
│  │  │  │ └─────────────────┴───────────────────────────┘ │ │ │  │
│  │  │  └──────────────────────────────────────────────────┘ │ │  │
│  │  │                                                        │ │  │
│  │  │  ┌──────────────────────────────────────────────────┐ │ │  │
│  │  │  │ Features List                                    │ │ │  │
│  │  │  │ • Feature 1                                      │ │ │  │
│  │  │  │ • Feature 2                                      │ │ │  │
│  │  │  │ • Feature 3                                      │ │ │  │
│  │  │  └──────────────────────────────────────────────────┘ │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  TabContent: Metadata                                  │ │  │
│  │  │                                                        │ │  │
│  │  │  Sync Info:                                            │ │  │
│  │  │  - Last Synced: 2 hours ago                            │ │  │
│  │  │                                                        │ │  │
│  │  │  Timestamps:                                           │ │  │
│  │  │  - Created: Dec 1, 2025 10:30 AM                       │ │  │
│  │  │  - Updated: Dec 8, 2025 2:15 PM                        │ │  │
│  │  │                                                        │ │  │
│  │  │  Raw Metadata: [Expand]                                │ │  │
│  │  │  { "source": "scoop", ... }                            │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoint Detail

### GET /api/admin/suppliers/products/[id]

```
Request:
  Method: GET
  URL: /api/admin/suppliers/products/{uuid}
  Headers:
    Cookie: session token (admin auth)

Response (200):
  {
    "success": true,
    "data": {
      "id": "uuid",
      "supplier_id": "uuid",
      "sku": "ABC-12345",
      "name": "Product Name",
      "description": "Product description...",
      "manufacturer": "XYZ Corp",
      "cost_price": 450.00,
      "retail_price": 599.00,
      "source_image_url": "https://...",
      "cached_image_path": "scoop/abc123.jpg",
      "product_url": "https://supplier.com/product/abc",
      "stock_cpt": 15,
      "stock_jhb": 23,
      "stock_dbn": 8,
      "stock_total": 46,
      "in_stock": true,
      "category": "Electronics",
      "subcategory": "Networking",
      "specifications": { "warranty": "2 years" },
      "features": ["Feature 1", "Feature 2"],
      "is_active": true,
      "is_discontinued": false,
      "last_synced_at": "2025-12-08T10:00:00Z",
      "previous_cost_price": 420.00,
      "previous_stock_total": 50,
      "metadata": {},
      "created_at": "2025-12-01T10:30:00Z",
      "updated_at": "2025-12-08T14:15:00Z",
      // Computed fields
      "image_url": "https://supabase.../scoop/abc123.jpg",
      "margin_amount": 149.00,
      "margin_percentage": 33.1,
      // Joined data
      "supplier": {
        "id": "uuid",
        "name": "Scoop Distribution",
        "code": "SCOOP",
        "website_url": "https://scoop.co.za"
      }
    }
  }

Response (404):
  {
    "success": false,
    "error": "Product not found"
  }

Response (500):
  {
    "success": false,
    "error": "Internal server error",
    "details": "..."
  }
```

---

## Database Query

```sql
SELECT
  sp.*,
  s.id as "supplier.id",
  s.name as "supplier.name",
  s.code as "supplier.code",
  s.website_url as "supplier.website_url"
FROM supplier_products sp
LEFT JOIN suppliers s ON sp.supplier_id = s.id
WHERE sp.id = $1
LIMIT 1
```

**Supabase JS equivalent:**

```typescript
const { data, error } = await supabase
  .from('supplier_products')
  .select(`
    *,
    supplier:suppliers(id, name, code, website_url)
  `)
  .eq('id', productId)
  .single()
```

---

## Navigation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NAVIGATION PATHS                             │
└─────────────────────────────────────────────────────────────────────┘

                    ┌───────────────────────┐
                    │   /admin/suppliers    │
                    │   (Suppliers List)    │
                    └───────────┬───────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────┐
        │      /admin/suppliers/products            │
        │      (All Products List)                  │
        │                                           │
        │  ┌─────┬──────┬──────────┬───────────┐   │
        │  │ Row │ Name │ Supplier │ Price ... │   │
        │  ├─────┼──────┼──────────┼───────────┤   │
        │  │  ○──┼──────┼──────────┼───────────│◀──┤─── Row Click
        │  │  │  │      │          │           │   │
        │  └──┼──┴──────┴──────────┴───────────┘   │
        └─────┼─────────────────────────────────────┘
              │
              │ router.push(`/admin/suppliers/products/${id}`)
              ▼
        ┌───────────────────────────────────────────┐
        │   /admin/suppliers/products/[id]          │
        │   (Product Detail Page)                   │
        │                                           │
        │   ← Back Button                           │──────┐
        │                                           │      │
        │   [Overview] [Specs] [Metadata]           │      │
        │                                           │      │
        │   Supplier Link ────────────────────────▶│─┐    │
        │   Product URL (external) ───────────────▶│─┼────│─▶ New Tab
        └─────────────────────────────────────────┬─┘ │    │
              │                                   │   │    │
              │ Back                              │   │    │
              ▼                                   │   │    │
        ┌───────────────────────────────────────┐ │   │    │
        │  /admin/suppliers/products            │ │   │    │
        │  (Returns to list)                    │◀┘   │    │
        └───────────────────────────────────────┘     │    │
                                                      │    │
        ┌─────────────────────────────────────────────┘    │
        ▼                                                  │
┌─────────────────────────────────┐                        │
│  /admin/suppliers/[id]          │                        │
│  (Supplier Detail Page)         │◀───────────────────────┘
└─────────────────────────────────┘
```

---

## Type Definitions Reference

From `lib/suppliers/types.ts`:

```typescript
export interface SupplierProduct {
  id: string
  supplier_id: string
  sku: string
  name: string
  description: string | null
  manufacturer: string | null
  cost_price: number | null
  retail_price: number | null
  source_image_url: string | null
  cached_image_path: string | null
  product_url: string | null
  stock_cpt: number
  stock_jhb: number
  stock_dbn: number
  stock_total: number
  in_stock: boolean
  category: string | null
  subcategory: string | null
  specifications: Record<string, unknown>
  features: string[]
  is_active: boolean
  is_discontinued: boolean
  last_synced_at: string | null
  previous_cost_price: number | null
  previous_stock_total: number | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  code: string
  website_url: string | null
  // ... other fields
}
```

---

## Integration Points

| System | Integration | Details |
|--------|-------------|---------|
| **Supabase** | Database queries | `supplier_products` + `suppliers` join |
| **Supabase Storage** | Image serving | `supplier-images` bucket, public URLs |
| **Next.js Router** | Navigation | `router.push()`, `params` extraction |
| **Admin Auth** | Access control | Cookie-based session (no RLS bypass needed for read) |

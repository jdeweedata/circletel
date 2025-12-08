# Supplier Product Detail Page - Full Specification

## 1. Overview

### 1.1 Description

Create a comprehensive product detail page at `/admin/suppliers/products/[id]` that displays full information about a supplier product including:
- Product image with fallback
- Core details (SKU, name, manufacturer, category)
- Pricing with margin calculation and change indicators
- Stock levels by branch (CPT, JHB, DBN)
- Specifications and features from JSONB fields
- Sync metadata (last synced, created, updated)
- Link to supplier and source product page

### 1.2 Goals

1. **Comprehensive View**: Display all product data fields in an organized layout
2. **Pattern Consistency**: Follow existing admin detail page patterns (tabs, cards, badges)
3. **Navigation Context**: Preserve list filters when navigating back
4. **Performance**: Fast loading with optimized single query

### 1.3 Non-Goals

1. **Product Editing**: Phase 1 is read-only (edit functionality deferred)
2. **Cost Component Links**: Integration with `product_cost_components` table deferred
3. **Price History Chart**: Historical price tracking deferred
4. **Stock Alerts**: Low stock notifications deferred

---

## 2. User Stories

### US-1: View Product Details

**As an** admin user
**I want to** view complete details of a supplier product
**So that** I can understand pricing, stock, and specifications

**Acceptance Criteria:**
- [ ] Display product image with fallback to Box icon
- [ ] Show SKU, name, manufacturer, category, subcategory
- [ ] Display cost price and retail price with margin calculation
- [ ] Show price change indicator (up/down arrow) if changed since last sync
- [ ] Display stock levels per branch with visual indicators
- [ ] Show active/discontinued status badges
- [ ] Display specifications and features sections
- [ ] Show sync metadata (last_synced_at, created_at, updated_at)

### US-2: Navigate from Products List

**As an** admin user
**I want to** click on a product row to view its details
**So that** I can quickly access product information

**Acceptance Criteria:**
- [ ] Product rows in listing are clickable
- [ ] Clicking row navigates to `/admin/suppliers/products/[id]`
- [ ] Back button returns to products list
- [ ] Page preserves scroll position on return (browser default)

### US-3: Access External Resources

**As an** admin user
**I want to** access the supplier's product page
**So that** I can verify information at the source

**Acceptance Criteria:**
- [ ] Display link to product_url if available
- [ ] Display link to supplier website
- [ ] Links open in new tab
- [ ] Show supplier name and code with link to supplier detail

---

## 3. Technical Specification

### 3.1 Files to Create

#### 3.1.1 API Route: `app/api/admin/suppliers/products/[id]/route.ts`

```typescript
/**
 * GET /api/admin/suppliers/products/[id]
 * Returns single product with supplier details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse>
```

**Response Schema:**
```typescript
{
  success: true,
  data: {
    // SupplierProduct fields
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
    // Computed fields
    image_url: string | null  // Resolved from cached_image_path or source_image_url
    margin_amount: number | null
    margin_percentage: number | null
    // Joined supplier
    supplier: {
      id: string
      name: string
      code: string
      website_url: string | null
    }
  }
}
```

**Error Responses:**
- `404`: Product not found
- `500`: Database error

#### 3.1.2 Page Component: `app/admin/suppliers/products/[id]/page.tsx`

**Component Structure:**
```
ProductDetailPage
├── Header
│   ├── Back Button → /admin/suppliers/products
│   ├── Product Name + SKU
│   ├── Status Badges (Active, Discontinued, In Stock)
│   └── External Links (Product URL, Supplier)
├── Tabs
│   ├── Overview Tab
│   │   ├── Product Image (left)
│   │   ├── Core Details Card
│   │   │   ├── Name, Description
│   │   │   ├── Manufacturer, Category
│   │   │   └── Supplier Link
│   │   ├── Pricing Card
│   │   │   ├── Cost Price (with change indicator)
│   │   │   ├── Retail Price
│   │   │   └── Margin (amount & percentage)
│   │   └── Stock Card
│   │       ├── Branch breakdown (CPT/JHB/DBN)
│   │       └── Total with status
│   ├── Specifications Tab
│   │   ├── Specifications Table (from JSONB)
│   │   └── Features List
│   └── Metadata Tab
│       ├── Sync Info (last_synced_at)
│       ├── Timestamps (created_at, updated_at)
│       └── Raw Metadata (collapsible JSON)
└── Loading State
    └── Skeleton components
```

### 3.2 Files to Modify

#### 3.2.1 Products Listing: `app/admin/suppliers/products/page.tsx`

**Changes:**
1. Make table rows clickable
2. Add `cursor-pointer` and hover styles
3. Navigate on row click to `/admin/suppliers/products/${product.id}`

```tsx
// Change from:
<TableRow key={product.id}>

// Change to:
<TableRow
  key={product.id}
  className="cursor-pointer hover:bg-gray-50"
  onClick={() => router.push(`/admin/suppliers/products/${product.id}`)}
>
```

### 3.3 Database Changes

**None required.** Existing `supplier_products` table has all needed fields.

### 3.4 UI Components Used

From existing codebase:
- `Card`, `CardContent`, `CardHeader`, `CardTitle` - Section containers
- `Badge` - Status indicators
- `Button` - Actions and navigation
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - Tab navigation
- `Table`, `TableRow`, `TableCell` - Specifications display
- `Separator` - Visual dividers

Icons (from lucide-react):
- `ArrowLeft` - Back navigation
- `Box` - Image fallback
- `MapPin` - Stock location
- `TrendingUp`, `TrendingDown` - Price changes
- `ExternalLink` - External links
- `Package` - Product icon
- `Clock` - Timestamps
- `Tag` - Category
- `Building` - Manufacturer

---

## 4. Architecture

### 4.1 Data Flow

```
User clicks product row
        │
        ▼
┌─────────────────────────────────────┐
│  /admin/suppliers/products/[id]     │
│  ProductDetailPage (client)         │
└─────────────────────────────────────┘
        │
        │ fetch('/api/admin/suppliers/products/{id}')
        ▼
┌─────────────────────────────────────┐
│  API Route Handler                  │
│  app/api/admin/suppliers/           │
│  products/[id]/route.ts             │
└─────────────────────────────────────┘
        │
        │ Supabase query with join
        ▼
┌─────────────────────────────────────┐
│  Database                           │
│  supplier_products + suppliers      │
└─────────────────────────────────────┘
        │
        │ Return joined data
        ▼
┌─────────────────────────────────────┐
│  ProductDetailPage renders          │
│  - Tabs with content                │
│  - Cards with data                  │
└─────────────────────────────────────┘
```

### 4.2 Component Layout

```
┌────────────────────────────────────────────────────────────┐
│ ← Back   Product Name Here                    [Active] [●] │
│          SKU: ABC-12345  •  Supplier: SCOOP                │
├────────────────────────────────────────────────────────────┤
│ [Overview]  [Specifications]  [Metadata]                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────┐  ┌─────────────────────────────────────────┐ │
│  │         │  │ CORE DETAILS                            │ │
│  │  IMAGE  │  │ Manufacturer: XYZ Corp                  │ │
│  │         │  │ Category: Electronics > Networking      │ │
│  │         │  │ Supplier: Scoop Distribution ↗          │ │
│  └─────────┘  └─────────────────────────────────────────┘ │
│                                                            │
│  ┌─────────────────────┐  ┌────────────────────────────┐  │
│  │ PRICING             │  │ STOCK                      │  │
│  │ Cost: R450.00  ↑    │  │ Cape Town:    15 units     │  │
│  │ Retail: R599.00     │  │ Johannesburg: 23 units     │  │
│  │ Margin: R149 (33%)  │  │ Durban:       8 units      │  │
│  │                     │  │ Total:        46 units ✓   │  │
│  └─────────────────────┘  └────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ DESCRIPTION                                          │ │
│  │ Full product description text here...                │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 5. Risk Assessment

### 5.1 Risk Level: **Low**

### 5.2 Risk Factors

| Factor | Risk | Mitigation |
|--------|------|------------|
| Pattern Consistency | Low | Follow existing `orders/[id]` pattern |
| Data Completeness | Low | All fields exist in database |
| API Complexity | Low | Simple single-table query with join |
| Performance | Low | Single product query, no pagination |

### 5.3 Dependencies

- Existing `supplier_products` table
- Existing `suppliers` table
- Existing products listing page
- UI components already available

---

## 6. Success Criteria

### 6.1 Functional

- [ ] Product detail page loads within 500ms
- [ ] All product fields displayed correctly
- [ ] Navigation from list works
- [ ] Back button returns to list
- [ ] External links open in new tabs
- [ ] Image displays or shows fallback

### 6.2 Technical

- [ ] TypeScript strict mode passes
- [ ] No console errors
- [ ] Responsive design (mobile-friendly)
- [ ] Loading state displayed during fetch
- [ ] 404 handled for invalid product IDs

### 6.3 UX

- [ ] Consistent with other admin detail pages
- [ ] Clear information hierarchy
- [ ] Status immediately visible
- [ ] Pricing and stock at a glance

---

## 7. Testing Strategy

### 7.1 Manual Testing

1. **Navigation**
   - Click product row → detail page loads
   - Click back → returns to list
   - Direct URL access → page loads

2. **Data Display**
   - Product with all fields populated
   - Product with minimal fields (nulls)
   - Product with no image
   - Product with specifications JSONB
   - Product with empty features array

3. **Edge Cases**
   - Invalid product ID → 404 message
   - Network error → error state
   - Deleted product → graceful handling

### 7.2 Type Checking

```bash
npm run type-check:memory
```

---

## 8. Implementation Notes

### 8.1 Margin Calculation

```typescript
const marginAmount = (retail_price && cost_price)
  ? retail_price - cost_price
  : null

const marginPercentage = (marginAmount && cost_price)
  ? ((marginAmount / cost_price) * 100).toFixed(1)
  : null
```

### 8.2 Price Change Indicator

```typescript
const priceChanged = previous_cost_price && cost_price !== previous_cost_price
const priceIncreased = priceChanged && cost_price > previous_cost_price
```

### 8.3 Stock Status

```typescript
const stockStatus = in_stock
  ? { label: 'In Stock', color: 'green' }
  : { label: 'Out of Stock', color: 'red' }
```

### 8.4 Image URL Resolution

```typescript
const imageUrl = cached_image_path
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/supplier-images/${cached_image_path}`
  : source_image_url
```

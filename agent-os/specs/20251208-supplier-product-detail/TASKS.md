# Supplier Product Detail Page - Task Breakdown

## Summary

| Metric | Value |
|--------|-------|
| Total Story Points | **5 points** |
| Task Groups | 2 |
| Files to Create | 2 |
| Files to Modify | 1 |

---

## Task Group 1: Backend (API Route)

**Agent**: backend-engineer
**Points**: 2
**Dependencies**: None
**Priority**: P1 - Start Here

### Tasks

- [ ] **T1.1** Create API route directory
  - Create `app/api/admin/suppliers/products/[id]/`

- [ ] **T1.2** Implement GET endpoint
  - Create `app/api/admin/suppliers/products/[id]/route.ts`
  - Accept `id` from async params (Next.js 15 pattern)
  - Query `supplier_products` with supplier join
  - Calculate margin_amount and margin_percentage
  - Resolve image URL (cached or source)
  - Return structured response

- [ ] **T1.3** Handle error cases
  - Return 404 for non-existent product
  - Return 500 with details for database errors
  - Log errors to console

### Files

| File | Action |
|------|--------|
| `app/api/admin/suppliers/products/[id]/route.ts` | CREATE |

### Acceptance Criteria

- [ ] API returns complete product data with supplier details
- [ ] 404 returned for invalid product ID
- [ ] Margin calculated correctly when prices present
- [ ] Image URL resolved correctly

---

## Task Group 2: Frontend (Page Component)

**Agent**: frontend-engineer
**Points**: 3
**Dependencies**: Task Group 1 (API must be available)
**Priority**: P2 - After Backend

### Tasks

- [ ] **T2.1** Create page component
  - Create `app/admin/suppliers/products/[id]/page.tsx`
  - Use 'use client' directive
  - Implement loading state with skeleton
  - Implement error state with message
  - Implement 404 state for missing product

- [ ] **T2.2** Implement header section
  - Back button to `/admin/suppliers/products`
  - Product name and SKU display
  - Status badges (Active, Discontinued, In Stock)
  - External link to product_url (if available)
  - Link to supplier detail page

- [ ] **T2.3** Implement Overview tab
  - Product image with Box icon fallback
  - Core details card (name, description, manufacturer, category)
  - Pricing card with margin calculation
  - Price change indicator (TrendingUp/TrendingDown)
  - Stock card with branch breakdown

- [ ] **T2.4** Implement Specifications tab
  - Specifications table from JSONB
  - Features list (bullet points)
  - Empty state if no specifications

- [ ] **T2.5** Implement Metadata tab
  - Sync info (last_synced_at with relative time)
  - Timestamps (created_at, updated_at)
  - Collapsible raw metadata JSON

- [ ] **T2.6** Update products listing
  - Modify `app/admin/suppliers/products/page.tsx`
  - Add cursor-pointer to table rows
  - Add hover:bg-gray-50 style
  - Add onClick to navigate to detail page

### Files

| File | Action |
|------|--------|
| `app/admin/suppliers/products/[id]/page.tsx` | CREATE |
| `app/admin/suppliers/products/page.tsx` | MODIFY |

### Acceptance Criteria

- [ ] Page loads with skeleton during fetch
- [ ] All tabs display correct content
- [ ] Product rows are clickable in listing
- [ ] Back navigation works correctly
- [ ] External links open in new tab
- [ ] Responsive on mobile devices

---

## Implementation Order

```
1. Task Group 1 (Backend)
   └── T1.1 → T1.2 → T1.3

2. Task Group 2 (Frontend)
   └── T2.1 → T2.2 → T2.3 → T2.4 → T2.5 → T2.6
```

---

## Code Templates

### T1.2 - API Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCachedImageUrl } from '@/lib/suppliers/image-cache'

export const runtime = 'nodejs'
export const maxDuration = 15

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const { data: product, error } = await supabase
      .from('supplier_products')
      .select(`
        *,
        supplier:suppliers(id, name, code, website_url)
      `)
      .eq('id', id)
      .single()

    if (error || !product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Calculate margin
    const marginAmount = (product.retail_price && product.cost_price)
      ? product.retail_price - product.cost_price
      : null
    const marginPercentage = (marginAmount && product.cost_price)
      ? (marginAmount / product.cost_price) * 100
      : null

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        image_url: getCachedImageUrl(product.cached_image_path) || product.source_image_url,
        margin_amount: marginAmount,
        margin_percentage: marginPercentage,
      },
    })
  } catch (error) {
    console.error('[Product Detail API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### T2.6 - Row Click Modification

```tsx
// In app/admin/suppliers/products/page.tsx
// Change TableRow to be clickable:

<TableRow
  key={product.id}
  className="cursor-pointer hover:bg-gray-50 transition-colors"
  onClick={() => router.push(`/admin/suppliers/products/${product.id}`)}
>
```

---

## Verification Checklist

After implementation:

- [ ] `npm run type-check:memory` passes
- [ ] API endpoint returns correct data
- [ ] Page loads without errors
- [ ] All tabs render correctly
- [ ] Row click navigation works
- [ ] Back button returns to list
- [ ] External links work
- [ ] Mobile responsive

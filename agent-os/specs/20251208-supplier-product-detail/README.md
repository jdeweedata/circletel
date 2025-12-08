# Supplier Product Detail Page

**Spec ID**: `20251208-supplier-product-detail`
**Created**: 2025-12-08
**Status**: Ready for Implementation
**Priority**: Medium
**Total Story Points**: 5 points

## Overview

Add a product detail page at `/admin/suppliers/products/[id]` to display comprehensive information about individual supplier products, including pricing, stock levels, specifications, and sync history.

## Goals

- Display full product details with image, pricing, and stock by branch
- Show price change trends and margin calculations
- Display specifications and features from JSONB fields
- Provide navigation back to products list with context preservation
- Follow existing admin detail page patterns (tabbed layout)

## Non-Goals

- Product editing (read-only view for Phase 1)
- Integration with product cost components
- Price/stock alerts or notifications

## Quick Stats

| Metric | Count |
|--------|-------|
| Files to Create | 2 |
| Files to Modify | 1 |
| Database Changes | 0 |
| API Endpoints | 1 new |

## Key Files

### To Create

| File | Purpose |
|------|---------|
| `app/admin/suppliers/products/[id]/page.tsx` | Product detail page with tabbed layout |
| `app/api/admin/suppliers/products/[id]/route.ts` | GET endpoint for single product |

### To Modify

| File | Change |
|------|--------|
| `app/admin/suppliers/products/page.tsx` | Add row click navigation to detail page |

## Quick Start

```bash
# 1. Review the spec
cat agent-os/specs/20251208-supplier-product-detail/SPEC.md

# 2. Check task breakdown
cat agent-os/specs/20251208-supplier-product-detail/TASKS.md

# 3. Start with Task Group 1 (Backend)
# Create API route first, then frontend page

# 4. Track progress
# Update PROGRESS.md as you complete tasks
```

## Architecture Reference

See `architecture.md` for:
- Data flow diagram
- Component structure
- API endpoint details

## Related Documentation

- `docs/architecture/SYSTEM_OVERVIEW.md` - System architecture
- `lib/suppliers/types.ts` - TypeScript type definitions
- `app/admin/orders/[id]/page.tsx` - Reference tabbed layout pattern

# Interstellio UI Refactor Design

**Date:** 2026-03-12
**Status:** Approved
**Author:** Claude

## Overview

Refactor the Interstellio RADIUS admin page (`/admin/integrations/interstellio`) to match the design system established in the Orders detail page (`/admin/orders/[id]`).

## Current State

The Interstellio page uses:
- Custom header with inline controls
- Custom `InterstellioStatsCards` component (not shared)
- shadcn `Tabs` component (boxed style)
- Tables and charts without `SectionCard` wrappers
- Inconsistent spacing and typography

## Target State

Match the Orders detail page pattern:
- White header with breadcrumbs, title, StatusBadge, action buttons
- 4-column `StatCard` grid using shared component
- `UnderlineTabs` + `TabPanel` (underline style)
- `SectionCard` wrappers with icon headers
- Consistent `min-h-screen bg-slate-50` layout

## Components to Create

### 1. InterstellioHeader

Location: `components/admin/interstellio/InterstellioHeader.tsx`

Pattern: Match `OrderHeader` structure
- Breadcrumbs: Integrations > Interstellio RADIUS
- Title: "Interstellio RADIUS"
- StatusBadge: Health status (healthy/degraded/error)
- Action buttons: Grouped icon buttons + "Sync Now" primary action
- Auto-refresh toggle moved to action button group

### 2. InterstellioStatCards

Location: `components/admin/interstellio/InterstellioStatCards.tsx`

Use shared `StatCard` component with 4 cards:
1. **Total Subscribers** - count, subtitle: "X online"
2. **Active Sessions** - count, subtitle: "Across X subscribers"
3. **Linked Services** - count, subtitle: "X unlinked"
4. **Total Usage** - formatted GB/TB, subtitle: "This month"

### 3. Page Structure Updates

File: `app/admin/integrations/interstellio/page.tsx`

Changes:
- Replace custom header with `InterstellioHeader`
- Replace `InterstellioStatsCards` with new version using shared `StatCard`
- Replace shadcn `Tabs` with `UnderlineTabs` + `TabPanel`
- Wrap table content in `SectionCard` components
- Update layout to `min-h-screen bg-slate-50`
- Move auto-refresh state to header

## Tab Structure

| Tab | Content |
|-----|---------|
| Subscribers | `SectionCard` with `SubscriberTable` |
| Active Sessions | `SectionCard` with `ActiveSessionsTable` |
| Usage Analytics | `SectionCard` with subscriber selector + `UsageChart` |

## Data Flow

No changes to data fetching logic:
- Same API endpoints (`/api/admin/integrations/interstellio/*`)
- Same state management (useState hooks)
- Same refresh logic (manual + auto-refresh interval)

## Files to Modify

1. `app/admin/integrations/interstellio/page.tsx` - Main page refactor
2. `components/admin/interstellio/InterstellioHeader.tsx` - New component
3. `components/admin/interstellio/InterstellioStatCards.tsx` - Refactor to use shared StatCard
4. `components/admin/interstellio/index.ts` - Update exports

## Files to Keep Unchanged

- `components/admin/interstellio/SubscriberTable.tsx`
- `components/admin/interstellio/ActiveSessionsTable.tsx`
- `components/admin/interstellio/UsageChart.tsx`
- All API routes

## Success Criteria

- [ ] Page layout matches Orders detail page pattern
- [ ] Uses shared `StatCard`, `UnderlineTabs`, `TabPanel`, `SectionCard` components
- [ ] All existing functionality preserved (auto-refresh, disconnect, etc.)
- [ ] Type check passes
- [ ] Visual consistency with admin design system

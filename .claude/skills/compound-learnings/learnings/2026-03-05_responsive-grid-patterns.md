# Responsive Grid Patterns

**Date**: 2026-03-05
**Source**: Admin order detail page responsive fix
**Commits**: `04bb0bb7`

## Pattern 1: Intermediate Breakpoint for 3-Column Grids

**Problem**: Grid jumping from 1 to 3 columns is jarring on tablets (768-1024px).

**Solution**: Always include `md` breakpoint for 2-column layout.

```tsx
// ❌ WRONG: Jumps from 1 to 3 columns
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

// ✅ CORRECT: Progressive 1 → 2 → 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
```

**Breakpoint reference**:
| Prefix | Min Width | Typical Device |
|--------|-----------|----------------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |

## Pattern 2: Column Spanning for Tall Components

**Problem**: On tablets (2-column layout), tall components like timelines leave awkward gaps.

**Solution**: Span full width on tablets, single column on desktop.

```tsx
// Third column spans full width on tablets, single on desktop
<div className="space-y-4 md:space-y-6 md:col-span-2 xl:col-span-1">
  <OrderProgressTimeline />
</div>
```

## Pattern 3: Icon-Only Tabs on Mobile

**Problem**: Tab labels overflow on small screens with 4+ tabs.

**Solution**: Hide labels on mobile, show icon only.

```tsx
<TabsTrigger value="overview" className="...">
  <PiEyeBold className="w-4 h-4 sm:mr-2" />
  <span className="hidden sm:inline">Overview</span>
</TabsTrigger>
```

## Pattern 4: Progressive Typography

**Problem**: Large headings overflow on mobile.

**Solution**: Scale typography progressively across breakpoints.

```tsx
// Progressive heading sizes
<h1 className="text-xl sm:text-2xl lg:text-3xl font-black">

// Progressive padding
<div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">

// Progressive gaps
<div className="gap-4 md:gap-6">
```

## Pattern 5: Responsive Breadcrumbs

**Problem**: Full breadcrumb trail too long on mobile.

**Solution**: Hide intermediate items progressively.

```tsx
<nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
  <Link href="/admin/orders" className="flex items-center gap-1">
    <PiArrowLeftBold className="w-4 h-4" />
    <span className="hidden sm:inline">Orders</span>
  </Link>
  <PiCaretRightBold className="w-3 h-3 text-slate-400" />
  <span className="hidden md:inline">Active Orders</span>
  <PiCaretRightBold className="hidden md:block w-3 h-3 text-slate-400" />
  <span className="font-medium truncate">{orderNumber}</span>
</nav>
```

## Checklist for Responsive Admin Pages

- [ ] Does the grid have intermediate breakpoints (not just 1 → 3)?
- [ ] Do tall components span properly on tablets?
- [ ] Are tabs icon-only on mobile if 4+ tabs?
- [ ] Do headings scale down on mobile?
- [ ] Are breadcrumbs simplified on small screens?
- [ ] Is padding reduced on mobile (px-4 vs px-8)?

## Time Savings

- ~15 min per responsive layout fix by following these patterns
- Prevents QA feedback loops on tablet layouts

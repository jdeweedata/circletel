---
module: Admin Order Detail Page
date: 2026-03-05
problem_type: styling_issue
component: shadcn_tabs
symptoms:
  - "Active tab invisible - white text and icon on white background"
  - "TabsTrigger data-[state=active] styles not applying"
  - "bg-primary CSS variable not working in production"
root_cause: tailwind_merge_limitation
severity: medium
tags: [tailwind-merge, shadcn-ui, tabs, css-variables, data-attributes]
files_affected:
  - components/ui/tabs.tsx
  - app/admin/orders/[id]/page.tsx
resolution_time: ~2 hours
---

# Invisible Active Tab - tailwind-merge Data Variant Limitation

## Symptom

Active tab on admin order detail page (`/admin/orders/[id]`) appeared completely invisible - white text and icon on white/transparent background. Inactive tabs displayed correctly with dark text.

**Observed in HTML:**
```html
<button class="... data-[state=active]:bg-background data-[state=active]:text-foreground
               data-[state=active]:bg-primary data-[state=active]:text-white ...">
```

Both default AND custom active state classes present in DOM.

## Investigation Attempts

### Attempt 1: Tailwind `!important` modifier
```tsx
// Added ! prefix to force override
className="data-[state=active]:!bg-primary data-[state=active]:!text-white"
```
**Result**: Failed. Both classes still in DOM, CSS specificity depends on stylesheet order.

### Attempt 2: `unstyled` prop pattern
Added `unstyled` prop to TabsTrigger component to disable default active styles:
```tsx
// components/ui/tabs.tsx
const TabsTrigger = React.forwardRef<...>(({ className, unstyled, ...props }, ref) => (
  <TabsPrimitive.Trigger
    className={cn(
      "...",
      !unstyled && "data-[state=active]:bg-background data-[state=active]:text-foreground",
      className
    )}
  />
))
```
**Result**: Partial success. Default styles removed, but `bg-primary` CSS variable still not applying in production.

## Root Cause

**Two separate issues:**

1. **tailwind-merge limitation**: The `cn()` utility uses `tailwind-merge` which doesn't recognize arbitrary data attribute variants (`data-[state=active]:`) as conflicting classes. Both `bg-background` and `bg-primary` survive the merge.

2. **CSS variable resolution**: `bg-primary` references a CSS custom property that wasn't resolving correctly in production builds (possibly Turbopack-related).

## Solution

### 1. Add `unstyled` prop to TabsTrigger (components/ui/tabs.tsx)

```tsx
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { unstyled?: boolean }
>(({ className, unstyled, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      !unstyled && "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
```

### 2. Use hardcoded hex color + base text color

```tsx
<TabsTrigger
  value="overview"
  unstyled
  className="rounded-lg font-medium text-xs sm:text-sm text-slate-600 data-[state=active]:bg-[#F77B00] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:hover:bg-slate-100 transition-all"
>
```

**Key changes:**
- `unstyled` prop removes conflicting default styles
- `bg-[#F77B00]` hardcoded hex bypasses CSS variable issues
- `text-slate-600` base color ensures inactive tabs are visible

## Prevention

1. When customizing shadcn/ui component active states, use `unstyled` prop pattern
2. If CSS variables don't work, use hardcoded Tailwind arbitrary values
3. Always add a base text color when using `text-white` for active state
4. Don't rely on `!important` to override data attribute variants in tailwind-merge

## Related Files

- `components/ui/tabs.tsx` - TabsTrigger with unstyled prop
- `app/admin/orders/[id]/page.tsx` - Usage example
- `.claude/skills/compound-learnings/learnings/2026-03-05_tailwind-merge-data-variants.md` - Detailed learning doc

## Commits

- `37a08f44` - fix: add unstyled prop to TabsTrigger for custom active states
- `24350c9f` - fix: use hardcoded hex color for active tab background

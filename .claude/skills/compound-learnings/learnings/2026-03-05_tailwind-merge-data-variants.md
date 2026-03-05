# tailwind-merge Data Attribute Variant Limitation

**Date**: 2026-03-05
**Context**: Fixing invisible active tab on admin order detail page
**Trigger**: Custom `data-[state=active]:bg-primary` styles not overriding base component defaults

## The Problem

When using shadcn/ui components with custom active state styles, the `cn()` utility (which uses `tailwind-merge`) doesn't recognize arbitrary data attribute variants as conflicting classes.

### Example

```tsx
// Base TabsTrigger has:
"data-[state=active]:bg-background data-[state=active]:text-foreground"

// Custom className adds:
"data-[state=active]:bg-primary data-[state=active]:text-white"

// Result in DOM (BOTH classes present):
"data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:bg-primary data-[state=active]:text-white"
```

**Why it fails**: CSS specificity depends on stylesheet order, not class string order. Both rules have equal specificity, so whichever appears last in the generated CSS wins - unpredictably.

## What Doesn't Work

### 1. Tailwind `!important` modifier
```tsx
// Attempted fix:
"data-[state=active]:!bg-primary data-[state=active]:!text-white"

// Still fails because both classes are in DOM
```

### 2. Class order in className
```tsx
// cn() doesn't dedupe these - both survive
cn(baseClasses, customClasses)
```

## The Solution: `unstyled` Prop Pattern

Add an opt-out prop to the base component:

```tsx
// components/ui/tabs.tsx
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

### Usage

```tsx
<TabsTrigger
  value="overview"
  unstyled  // Disables default active colors
  className="data-[state=active]:bg-primary data-[state=active]:text-white"
>
  Overview
</TabsTrigger>
```

## Benefits

1. **Backwards compatible** - Existing usages (242 in this codebase) unaffected
2. **Explicit opt-out** - Clear intent when customizing
3. **No CSS hacks** - Clean, maintainable solution
4. **Reusable pattern** - Can apply to other shadcn components

## Components This May Affect

- `TabsTrigger` - active state colors
- `Button` - variant colors if customizing
- `Toggle` - pressed state colors
- Any component with `data-[state=*]:` default styles

## Related Files

- `components/ui/tabs.tsx` - Implementation
- `app/admin/orders/[id]/page.tsx` - Usage example
- `lib/utils.ts` - cn() function using tailwind-merge

## Time Saved

~2-3 hours per occurrence by knowing:
1. Why `!important` doesn't work
2. The root cause (tailwind-merge limitation)
3. The clean solution (unstyled prop pattern)

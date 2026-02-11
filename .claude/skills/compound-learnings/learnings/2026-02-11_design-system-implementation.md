# Design System Implementation - 2026-02-11

## Overview

Implemented a comprehensive CircleTel design system based on official brand guidelines, creating reusable typography classes, semantic color tokens, and a TypeScript constants file.

## Files Created/Modified

| File | Purpose |
|------|---------|
| `tailwind.config.ts` | Official brand colors + UI semantic tokens |
| `app/globals.css` | Typography utility classes |
| `lib/design-system.ts` | TypeScript constants for programmatic access |
| `app/layout.tsx` | Fixed theme color to #F5841E |

## Typography System

### Classes Available

```css
.page-title     /* 30px/700 - H1 page headings */
.header-title   /* 18px/600 - Header bar titles */
.section-heading /* 20px/700 - H2 section headings */
.card-title     /* 14px/500 - H3 card titles */
.body-text      /* 14px/400 - Body paragraphs */
.body-text-lg   /* 16px/400 - Larger body text */
.muted-text     /* 14px/400 gray - Secondary text */
.muted-text-sm  /* 12px/400 gray - Small muted text */
```

### Usage Example

```tsx
// Before (inconsistent)
<h1 className="text-3xl font-bold text-slate-900">Title</h1>
<p className="text-sm text-slate-500">Subtitle</p>

// After (design system)
<h1 className="page-title">Title</h1>
<p className="muted-text">Subtitle</p>
```

## Color System

### Brand Colors (Tailwind)

```typescript
// Primary
circleTel-orange: '#F5841E'     // Main accent
circleTel-navy: '#13274A'       // Deep navy
circleTel-gray: '#747474'       // Brand gray

// Secondary
circleTel-burnt-orange: '#D76026'
circleTel-warm-orange: '#E97B26'
circleTel-bright-orange: '#F4742B'
```

### UI Semantic Tokens

```typescript
ui-bg: '#F9FAFB'              // Page background
ui-card: '#FFFFFF'            // Card/section background
ui-text-primary: '#111827'    // Near-black text
ui-text-secondary: '#4B5563'  // Medium gray text
ui-text-muted: '#6B7280'      // Lighter gray text
ui-border: '#E5E7EB'          // Default border
ui-sidebar: '#1F2937'         // Dark sidebar
```

### Usage Pattern

```tsx
// Before (raw colors)
<div className="bg-white border-slate-200 text-slate-900">

// After (semantic tokens)
<div className="bg-ui-card border-ui-border text-ui-text-primary">
```

## Programmatic Access

```typescript
import { BRAND_COLORS, UI_COLORS, TYPOGRAPHY } from '@/lib/design-system';

// For charts
const chartColor = BRAND_COLORS.orange;

// For inline styles
style={{ color: UI_COLORS.textPrimary }}

// Get class name
const className = TYPOGRAPHY.pageTitle.className; // 'page-title'
```

## Migration Checklist

When applying design system to a page:

1. [ ] Replace page title with `.page-title`
2. [ ] Replace section headings with `.section-heading`
3. [ ] Replace card labels with `.card-title`
4. [ ] Replace body text with `.body-text`
5. [ ] Replace muted/secondary text with `.muted-text`
6. [ ] Replace `bg-white` with `bg-ui-card`
7. [ ] Replace `border-slate-100/200` with `border-ui-border`
8. [ ] Replace `bg-slate-50` with `bg-ui-bg`
9. [ ] Replace `text-slate-900` with `text-ui-text-primary`
10. [ ] Replace `text-slate-500` with `.muted-text` or `text-ui-text-muted`
11. [ ] Replace `orange-500/600` with `circleTel-orange`

## Key Insights

1. **Semantic tokens > raw colors**: Using `ui-text-primary` instead of `slate-900` makes future rebranding trivial

2. **Typography classes reduce decisions**: No more deciding between `text-sm font-medium text-slate-500` vs `text-xs font-semibold text-slate-400`

3. **Preserve gradient patterns**: The sophisticated aesthetic (gradient headers, hover effects) works perfectly with design system colors

4. **Progressive adoption**: Can apply page-by-page without breaking existing pages

## Pages Using Design System

- [x] `/admin/corporate` (list)
- [x] `/admin/corporate/[id]` (detail)
- [x] `/admin/orders/[id]` (detail)
- [x] `/admin/orders` (list)
- [ ] `/admin/customers`
- [ ] `/admin/dashboard`
- [ ] Other admin pages...

## Related Files

- Brand guidelines: Official CircleTel PDF
- Previous learnings: `2026-02-11_admin-design-system.md` (sophisticated aesthetic patterns)

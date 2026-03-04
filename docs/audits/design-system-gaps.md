# CircleTel Design System Gaps Analysis

**Date**: 2026-03-03
**Source**: Frontend Design Audit

---

## Current State

CircleTel currently has **3 competing design systems**:
1. **shadcn/ui** - Generic component library (buttons, cards, forms)
2. **CircleTel Custom** - Brand tokens in Tailwind config
3. **Legacy Ad-hoc** - Hardcoded styles from rapid development

**Result**: Inconsistent UX, maintenance burden, slower development.

---

## Gap 1: No Documentation

### Problem
No single source of truth for design decisions. Developers make local decisions.

### Evidence
- 5 different orange hex values found
- 2 different dark navy tokens (`navy` vs `darkNeutral`)
- 3 different hero gradient patterns

### Recommendation
Create `/docs/design-system/` with:
- `COLORS.md` - Full palette with usage guidelines
- `TYPOGRAPHY.md` - Font scale, weights, line heights
- `COMPONENTS.md` - When to use which component variant
- `GRADIENTS.md` - Standard gradient presets

---

## Gap 2: Token Naming Inconsistency

### Problem
Mix of naming conventions makes tokens hard to discover.

### Current State
```typescript
colors: {
  circleTel: {
    orange: '#E87A1E',           // Good - semantic
    'orange-accessible': '#AE5B16', // Good - modifier
    'orange-dark': '#C45A30',     // Good - modifier
    navy: '#1B2A4A',             // Good - semantic

    // Legacy (different naming)
    darkNeutral: '#1F2937',      // Bad - different style
    secondaryNeutral: '#4B5563', // Bad - different style
    lightNeutral: '#E6E9EF',     // Bad - different style

    // Palette colors (unclear usage)
    'burnt-orange': '#D76026',   // Unclear when to use
    'warm-orange': '#E97B26',    // Unclear when to use
  }
}
```

### Recommendation
Consolidate to consistent naming:
```typescript
colors: {
  circleTel: {
    // Primary
    orange: '#E87A1E',
    'orange-hover': '#C45A30',
    'orange-accessible': '#AE5B16', // For text on white
    'orange-light': '#FDF2E9',      // Backgrounds

    // Neutral
    navy: '#1B2A4A',
    'navy-dark': '#0F1427',
    charcoal: '#2D3436',

    // Gray scale
    gray: {
      900: '#1F2937',
      700: '#4B5563',
      600: '#7F8C8D',
      200: '#F0F0F0',
      100: '#F9FAFB',
    }
  }
}
```

---

## Gap 3: No Gradient Presets

### Problem
Gradients defined inline, causing inconsistency.

### Current State
```tsx
// Hero 1 (homepage)
from-circleTel-navy via-circleTel-navy to-circleTel-navy/95

// Hero 2 (business)
from-circleTel-darkNeutral via-circleTel-secondaryNeutral to-circleTel-darkNeutral

// Hero 3 (legacy)
from-circleTel-darkNeutral via-purple-900 to-circleTel-darkNeutral

// CTA sections
from-circleTel-orange to-orange-600

// Promo banners
from-circleTel-orange to-orange-500
```

### Recommendation
Add gradient presets to Tailwind:
```typescript
// tailwind.config.ts
theme: {
  extend: {
    backgroundImage: {
      'gradient-hero': 'linear-gradient(to bottom right, #1B2A4A, #1B2A4A)',
      'gradient-cta': 'linear-gradient(to right, #E87A1E, #ea580c)',
      'gradient-promo': 'linear-gradient(to right, #E87A1E, #f97316)',
      'gradient-card-selected': 'linear-gradient(to bottom right, #1E4B85, #163a6b)',
    }
  }
}
```

Usage:
```tsx
<section className="bg-gradient-hero">
<div className="bg-gradient-cta">
```

---

## Gap 4: Button Variants Incomplete

### Problem
Button component exists but variants don't cover all use cases.

### Current State
shadcn Button has: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`

### Missing
- Primary CTA variant with CircleTel orange
- Hover state standardization (`-dark` suffix)
- Loading state styling

### Recommendation
Extend Button component:
```typescript
// components/ui/button.tsx
const buttonVariants = cva(
  // ... existing
  {
    variants: {
      variant: {
        // ... existing
        cta: "bg-circleTel-orange hover:bg-circleTel-orange-dark text-white shadow-lg",
        ctaOutline: "border-2 border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white",
      }
    }
  }
)
```

---

## Gap 5: Typography Scale Not Applied

### Problem
Fonts configured but not consistently applied.

### Current State
```typescript
fontFamily: {
  'sans': ['var(--font-poppins)', ...],
  'heading': ['var(--font-poppins)', ...],
  'body': ['var(--font-montserrat)', 'var(--font-poppins)', ...],
}
```

### Issues
- Many h1-h3 elements missing `font-heading` class
- Body text sometimes uses `font-sans` (Poppins) instead of `font-body` (Montserrat)
- No global base styles applied

### Recommendation
Add base typography in `globals.css`:
```css
@layer base {
  h1, h2, h3, h4, h5, h6 {
    @apply font-heading;
  }

  body {
    @apply font-body;
  }

  code, pre {
    @apply font-mono;
  }
}
```

---

## Gap 6: Component Duplication

### Problem
Multiple versions of similar components exist.

### Examples
| Purpose | Components | Should Be |
|---------|------------|-----------|
| Hero section | Hero, HeroWithTabs, NewHero | 1 configurable NewHero |
| Package cards | EnhancedPackageCard, CompactPackageCard | 1 PackageCard with size prop |
| Form inputs | Input (shadcn), custom inline | 1 Input with variants |

### Recommendation
1. Delete unused legacy components
2. Add variant props to shared components
3. Document when to use each variant

---

## Gap 7: Hover States Inconsistent

### Problem
Three different hover state patterns:

```tsx
// Pattern 1: Opacity
hover:bg-circleTel-orange/90

// Pattern 2: Dark variant token
hover:bg-circleTel-orange-dark

// Pattern 3: Hardcoded darker hex
hover:bg-[#e67516]
```

### Recommendation
Standardize on Pattern 2 (dark variant token):
```tsx
// Primary buttons
bg-circleTel-orange hover:bg-circleTel-orange-dark

// Secondary buttons (outline)
bg-transparent hover:bg-circleTel-orange-light

// Links
text-circleTel-orange hover:text-circleTel-orange-dark
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create design system documentation folder
- [ ] Document current color palette
- [ ] Define official gradient presets
- [ ] Add base typography to globals.css

### Phase 2: Cleanup (Week 2)
- [ ] Delete legacy Hero components
- [ ] Replace hardcoded hex colors with tokens
- [ ] Migrate `darkNeutral` → `navy` across codebase
- [ ] Deprecate legacy tokens with comments

### Phase 3: Enhancement (Week 3)
- [ ] Add Button CTA variants
- [ ] Create PackageCard size variants
- [ ] Add gradient utilities to Tailwind
- [ ] Document component usage guidelines

### Phase 4: Enforcement (Ongoing)
- [ ] Add ESLint rule to flag hardcoded hex colors
- [ ] Create PR checklist for design consistency
- [ ] Schedule quarterly design audits

---

## Files to Create

```
docs/design-system/
├── README.md                 # Overview and principles
├── COLORS.md                 # Color palette and usage
├── TYPOGRAPHY.md             # Font scale and families
├── GRADIENTS.md              # Gradient presets
├── COMPONENTS.md             # Component variants guide
└── PATTERNS.md               # Common UI patterns
```

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Hardcoded hex colors | 40+ instances | 0 |
| Duplicate components | 3 Hero, 2 Card | 1 each |
| Design doc coverage | 0% | 100% |
| Token naming consistency | 60% | 100% |
| Typography application | 70% | 100% |

---

**Next Step**: Create `docs/design-system/COLORS.md` as first documentation file.

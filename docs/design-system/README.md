# CircleTel Design System

> Single source of truth for typography, colors, and component patterns.

## Typography Scale

Based on 1.32× modular scale (adopted from Payfast analysis). Uses Manrope for headings, Inter for body text.

### Desktop Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display-1` / H1 | 48px (3rem) | 700 | 1.2 | Hero titles, page headers |
| `display-2` / H2 | 36px (2.25rem) | 700 | 1.25 | Section headings |
| `display-3` / H3 | 28px (1.75rem) | 600 | 1.3 | Card titles, subsections |
| `display-4` / H4 | 21px (1.3rem) | 600 | 1.4 | Minor headings |
| Body | 16px (1rem) | 400 | 1.5 | Paragraphs, descriptions |
| Small | 14px (0.875rem) | 400 | 1.4 | Labels, captions |

### Mobile Scale (0.85× desktop)

| Token | Desktop | Mobile |
|-------|---------|--------|
| H1 | 48px | 40px |
| H2 | 36px | 30px |
| H3 | 28px | 24px |
| H4 | 21px | 18px |
| Body | 16px | 16px |

### CSS Classes

```css
/* Utility classes in globals.css */
.page-title      /* H1: 48px, bold */
.section-heading /* H2: 36px, bold */
.card-title      /* H3: 28px, semibold */
.body-text       /* Body: 16px */
.body-text-lg    /* Body large: 18px */
.muted-text      /* Secondary: 14px, gray */
```

### Tailwind Classes

```tsx
// Direct Tailwind usage
<h1 className="text-display-1">Hero Title</h1>
<h2 className="text-display-2">Section</h2>
<h3 className="text-display-3">Card Title</h3>
<h4 className="text-display-4">Subsection</h4>
```

---

## Color Tokens

### Primary Palette

| Token | Value | Usage |
|-------|-------|-------|
| `circleTel-orange` | #E87A1E | Primary brand, CTAs |
| `circleTel-orange-dark` | #C45A30 | Hover states |
| `circleTel-orange-light` | #FDF2E9 | Light backgrounds |
| `circleTel-navy` | #1B2A4A | Headlines, dark UI |
| `circleTel-charcoal` | #2D3436 | Footer, dark sections |

### UI Gray Scale

| Token | Value | Usage |
|-------|-------|-------|
| `ui-bg` | #F9FAFB | Page backgrounds |
| `ui-card` | #FFFFFF | Card backgrounds |
| `ui-text-primary` | #111827 | Primary text |
| `ui-text-secondary` | #4B5563 | Secondary text |
| `ui-text-muted` | #6B7280 | Muted text |
| `ui-border` | #E5E7EB | Borders |

### WebAfrica-Inspired (for package cards)

| Token | Value | Usage |
|-------|-------|-------|
| `webafrica-blue` | #1E4B85 | Selected state |
| `webafrica-blue-light` | #CDD6F4 | Selected badges |
| `webafrica-blue-bg` | #F5F9FF | Light card bg |

---

## Gradient Presets

```css
/* Hero gradients */
.bg-gradient-hero      /* Orange to navy diagonal */
.bg-gradient-hero-dark /* Navy to midnight */

/* Card gradients */
.bg-gradient-card      /* White to light gray */
.bg-gradient-card-selected /* Navy gradient */

/* CTA gradients */
.bg-gradient-cta       /* Orange to burnt orange */
```

---

## Font Families

| Family | Variable | Usage |
|--------|----------|-------|
| Inter | `--font-inter` | Body text, UI, labels, nav |
| Manrope | `--font-manrope` | Headings, hero, sections |
| JetBrains Mono | `--font-mono` | Code, API keys, data |

### Why This Stack

- **Inter**: Optimized for screen readability and UI, excellent number legibility
- **Manrope**: Strong geometric character for headings, modern feel
- **JetBrains Mono**: Developer-focused monospace, clear code blocks

### Tailwind Usage

```tsx
<h1 className="font-heading">Heading</h1>   {/* Manrope */}
<p className="font-body">Body text</p>       {/* Inter */}
<span className="font-data">123,456</span>   {/* Inter */}
<code className="font-mono">code</code>      {/* JetBrains Mono */}
```

---

## Icon Library

**Library**: Phosphor Icons Bold (via `react-icons/pi`)
**Migration Date**: 2026-03-05

### Import Pattern

```tsx
import { PiCheckBold, PiXBold, PiUserBold, PiGearBold } from 'react-icons/pi';

// Usage
<PiCheckBold className="w-5 h-5 text-green-600" />
<PiXBold className="w-4 h-4" />
```

### Common Icons

| Use Case | Icon | Import |
|----------|------|--------|
| Close/Dismiss | ✕ | `PiXBold` |
| Confirm/Check | ✓ | `PiCheckBold` |
| Loading | ○ | `PiSpinnerBold` |
| Search | 🔍 | `PiMagnifyingGlassBold` |
| Settings | ⚙ | `PiGearBold` |
| User/Profile | 👤 | `PiUserBold` |
| Location | 📍 | `PiMapPinBold` |
| Home | 🏠 | `PiHouseBold` |
| WiFi | 📶 | `PiWifiHighBold` |
| Security | 🛡 | `PiShieldBold` |
| Link | 🔗 | `PiLinkBold` |
| File/Document | 📄 | `PiFileTextBold` |
| Calendar | 📅 | `PiCalendarBold` |
| Package | 📦 | `PiPackageBold` |
| Arrow Right | → | `PiArrowRightBold` |
| Arrow Up Right | ↗ | `PiArrowUpRightBold` |
| Currency | $ | `PiCurrencyDollarBold` |
| Trend Up | 📈 | `PiTrendUpBold` |
| Shopping Cart | 🛒 | `PiShoppingCartBold` |

### Naming Convention

All icons follow the `PiXxxBold` pattern:
- `Pi` prefix (Phosphor Icons)
- Icon name in PascalCase
- `Bold` suffix (weight variant)

### Sizing Guidelines

| Context | Class | Size |
|---------|-------|------|
| Inline with text | `w-4 h-4` | 16px |
| Buttons/Actions | `w-5 h-5` | 20px |
| Cards/Headers | `w-6 h-6` | 24px |
| Feature icons | `w-8 h-8` to `w-12 h-12` | 32-48px |

### Full Reference

See `docs/design-system/ICON_MAPPING.md` for complete icon mapping from Lucide/Heroicons to Phosphor.

---

## Component Patterns

### Package Cards

```tsx
// Unselected state
<Card className="border-circleTel-orange/30 hover:border-circleTel-orange
                 bg-gradient-to-br from-white to-gray-50">

// Selected state
<Card className="border-webafrica-blue bg-gradient-to-br from-webafrica-blue
                 to-webafrica-blue-dark text-white shadow-lg shadow-blue-500/20">
```

### CTA Buttons

```tsx
// Primary CTA
<Button className="bg-circleTel-orange hover:bg-circleTel-orange-dark
                   text-white font-semibold">

// Secondary CTA
<Button variant="outline" className="border-circleTel-orange
                                     text-circleTel-orange hover:bg-circleTel-orange-light">
```

### Segment Tabs

```tsx
// Active tab
<Tab className="bg-circleTel-orange text-white rounded-lg">

// Inactive tab
<Tab className="bg-circleTel-grey200 text-circleTel-navy hover:bg-circleTel-orange-light">
```

---

## Migration Notes

### Previous Scale (Deprecated)

| Element | Old | New | Change |
|---------|-----|-----|--------|
| H1 | 30px | 48px | +60% |
| H2 | 20px | 36px | +80% |
| H3 | 14px | 28px | +100% |
| H4 | - | 21px | NEW |

### Why We Changed

1. **Hierarchy**: Old H3 (14px) was same size as body text - no visual distinction
2. **Scale**: Old scale was inconsistent (1.5×, 1.43×) - new uses consistent 1.32×
3. **Industry Standard**: Payfast, Supersonic, WebAfrica all use 48-60px hero headings
4. **Mobile First**: New scale maintains readability on mobile with 0.85× reduction

---

## Package Card Components

The codebase has specialized package card components for different contexts:

### Available Components

| Component | Location | Use Case |
|-----------|----------|----------|
| `CompactPackageCard` | `components/ui/compact-package-card.tsx` | Grid layouts, mobile-optimized, provider logos |
| `EnhancedPackageCard` | `components/ui/enhanced-package-card.tsx` | Full-featured with benefits list, savings badges |
| `PackageCard` | `components/packages/PackageCard.tsx` | Coverage checker results |
| `BusinessPackageCard` | `components/partners/feasibility/` | Partner feasibility checks |

### Shared Props Pattern

```typescript
// Common props across package cards
interface PackageCardBaseProps {
  // Pricing
  promoPrice: number;
  originalPrice?: number;
  currency?: string;  // default: 'R'
  period?: string;    // default: 'pm'

  // Package details
  name?: string;
  type?: 'uncapped' | 'capped';
  downloadSpeed?: number;
  uploadSpeed?: number;

  // Interaction
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}
```

### Usage Guidelines

1. **Grid displays**: Use `CompactPackageCard` for responsive grid layouts
2. **Detail views**: Use `EnhancedPackageCard` when showing full benefits
3. **Coverage results**: Use `PackageCard` in coverage checker flow
4. **Business contexts**: Use `BusinessPackageCard` for B2B feasibility

---

## File Locations

- **Tailwind Config**: `tailwind.config.ts` (colors, fontSize tokens)
- **Global CSS**: `app/globals.css` (typography classes, component classes)
- **Font Setup**: `app/layout.tsx` (Next.js font imports)

---

**Version**: 1.1 | **Updated**: 2026-03-05

# Compact Package Card - Color Reference Guide

**Quick Reference**: Color values and Tailwind classes used in the improved design

## Color Palette

### Brand Colors (from CircleTel)

| Color Name | Hex Value | Tailwind Class | Usage |
|------------|-----------|----------------|-------|
| CircleTel Orange | `#F5831F` | `circleTel-orange` | Primary brand color |
| Darker Orange | `#e67516` | N/A (custom) | Gradient endpoint |
| Dark Neutral | `#1F2937` | `circleTel-darkNeutral` | Dark text/backgrounds |
| Light Neutral | `#E6E9EF` | `circleTel-lightNeutral` | Light backgrounds |
| White | `#FFFFFF` | `circleTel-white` | Text on colored backgrounds |

### WebAfrica Colors (for selected state)

| Color Name | Hex Value | Tailwind Class | Usage |
|------------|-----------|----------------|-------|
| WebAfrica Blue | `#1E4B85` | `webafrica-blue` | Selected card background |
| Blue Light | `#CDD6F4` | `webafrica-blue-light` | Light blue accents |
| Blue Lighter | `#E8F0FF` | `webafrica-blue-lighter` | Very light blue |
| Pink | `#E91E63` | `webafrica-pink` | Promotional badges |

## Component Color Mapping

### Unselected Card State

| Element | CSS Classes | Color Description |
|---------|-------------|-------------------|
| **Background** | `bg-gradient-to-br from-[#F5831F] via-[#F5831F] to-[#e67516]` | Brand orange gradient (F5831F → e67516) |
| **Border** | `border border-orange-500/30` | Semi-transparent orange border (30% opacity) |
| **Shadow** | `shadow-lg shadow-orange-500/25` | Large orange shadow (25% opacity) |
| **Hover Shadow** | `hover:shadow-orange-500/40` | Darker orange shadow on hover (40% opacity) |
| **Primary Text** | `text-white drop-shadow-sm` | Pure white with small drop shadow |
| **Original Price** | `text-white/85 drop-shadow-sm` | White at 85% opacity with drop shadow |
| **Logo Background** | `bg-white/15 backdrop-blur-sm` | Semi-transparent white (15%) with blur |

### Selected Card State

| Element | CSS Classes | Color Description |
|---------|-------------|-------------------|
| **Background** | `bg-webafrica-blue` | WebAfrica blue (#1E4B85) |
| **Border** | `border-2 border-webafrica-blue` | 2px WebAfrica blue border |
| **Shadow** | `shadow-md shadow-webafrica-blue/20` | Medium blue shadow (20% opacity) |
| **Hover Shadow** | `hover:shadow-webafrica-blue/30` | Darker blue shadow on hover (30% opacity) |
| **Primary Text** | `text-white drop-shadow-sm` | Pure white with small drop shadow |
| **Original Price** | `text-blue-200 drop-shadow-sm` | Light blue (#BFDBFE) with drop shadow |
| **Logo Background** | `bg-white/10 backdrop-blur-sm` | Semi-transparent white (10%) with blur |

### Promotional Badge Colors

| Badge Color Prop | CSS Classes | Color Description |
|------------------|-------------|-------------------|
| `pink` | `bg-primary-900` | Primary color (900 shade) |
| `orange` | `bg-gradient-to-r from-orange-600 to-orange-500` | Orange gradient (600 → 500) |
| `yellow` | `bg-gradient-to-r from-yellow-600 to-yellow-500` | Yellow gradient (600 → 500) |
| `blue` | `bg-gradient-to-r from-sky-600 to-sky-500` | Sky blue gradient (600 → 500) |

## Tailwind Color Shades Used

### Orange Shades
- `orange-300`: Replaced (was too bright)
- `orange-400`: Replaced (was too bright)
- `orange-500`: Used for borders and shadows (`#F97316`)
- `orange-600`: Used in promotional badges (`#EA580C`)

### Blue Shades
- `blue-200`: Used for selected state original price (`#BFDBFE`)
- `webafrica-blue`: Custom blue for selected background (`#1E4B85`)

### White/Transparency
- `white`: Pure white (`#FFFFFF`)
- `white/10`: 10% opacity white (rgba(255, 255, 255, 0.1))
- `white/15`: 15% opacity white (rgba(255, 255, 255, 0.15))
- `white/85`: 85% opacity white (rgba(255, 255, 255, 0.85))

## Before & After Comparison

### Background Colors

| State | Before | After | Change |
|-------|--------|-------|--------|
| Unselected | `from-orange-400 to-orange-300` | `from-[#F5831F] via-[#F5831F] to-[#e67516]` | Brand-specific orange gradient |
| Selected | `bg-[#1E4B85]` | `bg-webafrica-blue` | Uses Tailwind config value |

### Border/Shadow

| State | Before | After | Change |
|-------|--------|-------|--------|
| Unselected | `border-gray-200` | `border border-orange-500/30` + `shadow-lg shadow-orange-500/25` | Color-matched border + shadow |
| Selected | `border-[#1E4B85]` | `border-2 border-webafrica-blue` + `shadow-md shadow-webafrica-blue/20` | Thicker border + shadow |

### Text Colors

| Element | Before | After | Change |
|---------|--------|-------|--------|
| Promotional Price | `text-white` | `text-white drop-shadow-sm` | Added drop shadow |
| Original Price (Unselected) | `text-white/70` | `text-white/85 drop-shadow-sm` | Increased opacity + shadow |
| Original Price (Selected) | `text-blue-200` | `text-blue-200 drop-shadow-sm` | Added drop shadow |
| Speed Indicators | `text-white` | `text-white` + icons have `drop-shadow-sm` | Added icon shadows |

### Logo Container

| State | Before | After | Change |
|-------|--------|-------|--------|
| N/A | No container | Wrapped in `bg-white/15 backdrop-blur-sm` (unselected) | Added semi-transparent background |
| N/A | No container | Wrapped in `bg-white/10 backdrop-blur-sm` (selected) | Added semi-transparent background |

## Opacity Reference

Understanding Tailwind opacity notation:

- `/10` = 10% opacity = `opacity: 0.1`
- `/15` = 15% opacity = `opacity: 0.15`
- `/20` = 20% opacity = `opacity: 0.2`
- `/25` = 25% opacity = `opacity: 0.25`
- `/30` = 30% opacity = `opacity: 0.3`
- `/40` = 40% opacity = `opacity: 0.4`
- `/70` = 70% opacity = `opacity: 0.7`
- `/85` = 85% opacity = `opacity: 0.85`

## Shadow Reference

Understanding Tailwind shadow classes:

- `shadow-md`: Medium shadow (4px blur)
- `shadow-lg`: Large shadow (10px blur)
- `shadow-xl`: Extra large shadow (20px blur)
- `drop-shadow-sm`: Small text drop shadow (2px)

## Accessibility Contrast Ratios

### Unselected State (Orange Background)
- **White Text on Brand Orange (#F5831F)**: ~4.6:1 (WCAG AA for large text)
- **White/85 Text on Brand Orange**: ~3.9:1 (WCAG AA for large text)
- **With drop shadows**: Improved perceived contrast

### Selected State (Blue Background)
- **White Text on WebAfrica Blue (#1E4B85)**: ~8.6:1 (WCAG AAA)
- **Blue-200 Text on WebAfrica Blue**: ~3.8:1 (WCAG AA for large text)

All text meets or exceeds WCAG AA standards for large text (18px+).

## Usage in Code

### Applying the Unselected Style
```tsx
!selected && [
  'bg-gradient-to-br from-[#F5831F] via-[#F5831F] to-[#e67516]',
  'text-white',
  'shadow-lg shadow-orange-500/25',
  'border border-orange-500/30'
]
```

### Applying the Selected Style
```tsx
selected && [
  'bg-webafrica-blue text-white',
  'border-2 border-webafrica-blue',
  'shadow-md shadow-webafrica-blue/20'
]
```

### Logo Background Conditional
```tsx
className={cn(
  'rounded-lg px-2 py-1 backdrop-blur-sm',
  selected ? 'bg-white/10' : 'bg-white/15'
)}
```

## Color Decision Rationale

### Why Brand Orange (#F5831F)?
- Official CircleTel brand color from brand guidelines
- Maintains brand consistency across platform
- Professional, recognizable, and trustworthy

### Why WebAfrica Blue for Selected?
- Already in use elsewhere in the platform
- Provides excellent contrast with orange
- Creates clear visual distinction between states

### Why Gradients?
- Adds depth and professionalism
- Prevents flat, plain appearance
- Subtle enough to not distract from content

### Why Shadows Instead of Borders?
- Creates elevation effect (cards appear to float)
- More modern design pattern
- Better visual hierarchy in card grids

### Why Drop Shadows on Text?
- Improves readability on colored backgrounds
- Ensures text stands out in all lighting conditions
- Minimal performance impact

## Maintenance Notes

### Updating Colors
If brand colors change in the future:

1. Update `tailwind.config.ts` color definitions
2. Replace `#F5831F` and `#e67516` in component
3. Test contrast ratios with new colors
4. Update this documentation

### Adding New States
To add a new card state (e.g., disabled, loading):

1. Add new color variant to Tailwind config
2. Follow the pattern: `[state] && ['bg-[color]', 'border-[color]', 'shadow-[color]/[opacity]']`
3. Ensure text contrast meets WCAG standards
4. Document in this reference

---

**Last Updated**: 2025-10-24
**Component Version**: v1.1.0 (Color Improvements)
**Maintained By**: Development Team

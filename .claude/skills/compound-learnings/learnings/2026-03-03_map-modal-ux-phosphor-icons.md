# Map Modal UX & Phosphor Icons

**Date**: 2026-03-03
**Session**: Homepage icons + Map modal redesign

## Phosphor Icons Convention

### Why Phosphor over Lucide
- More distinctive style (less "AI template" look)
- Bold variants (`PiXxxBold`) work better for UI controls
- Consistent geometric design language

### Import Pattern
```tsx
import { PiHouseBold, PiBuildingsBold, PiBriefcaseBold } from 'react-icons/pi';
import { PiXBold, PiMapPinBold, PiCrosshairBold } from 'react-icons/pi';
```

### Icon Mapping (Lucide → Phosphor)
| Lucide | Phosphor Bold |
|--------|---------------|
| `Home` | `PiHouseBold` |
| `Building2` | `PiBuildingsBold` |
| `Briefcase` | `PiBriefcaseBold` |
| `X` | `PiXBold` |
| `MapPin` | `PiMapPinBold` |
| `Crosshair` | `PiCrosshairBold` |

---

## Immersive Modal Pattern

### When to Use
- Location selection (maps)
- Image/media viewing
- Full-screen previews

### Structure
```tsx
<DialogContent className="max-w-[95vw] h-[90vh] p-0 bg-gray-900">
  {/* Full-screen content */}
  <div className="relative w-full h-full">
    <FullScreenContent />

    {/* Floating close button */}
    <button className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md">
      <PiXBold />
    </button>

    {/* Floating search/controls */}
    <div className="absolute top-4 left-4 right-16 z-10">
      <input className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl" />
    </div>

    {/* Bottom action panel */}
    <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-4">
        {/* Content + buttons */}
      </div>
    </div>
  </div>
</DialogContent>
```

### Key Styles
- Dark background: `bg-gray-900`
- Glass panels: `bg-white/95 backdrop-blur-md`
- Shadows: `shadow-xl` or `shadow-2xl`
- Rounded: `rounded-2xl`
- Z-index layers: content (0) → controls (10) → close (20)

---

## Segmented Control Pattern

### Pill-style Toggle
```tsx
<div className="bg-white rounded-2xl shadow-xl overflow-hidden flex p-1">
  <button
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
      isActive
        ? 'bg-circleTel-navy text-white shadow-md'
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
    }`}
  >
    <Icon className="w-4 h-4" />
    Label
  </button>
</div>
```

### Inline SVG Icons for Map/Satellite
```tsx
// Map icon
<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/>
  <path d="M8 2v16M16 6v16"/>
</svg>

// Globe/Satellite icon
<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <circle cx="12" cy="12" r="10"/>
  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
</svg>
```

---

## Turbopack for Development

### Script Added
```json
"dev:turbo": "node --max-old-space-size=8192 ./node_modules/next/dist/bin/next dev --turbo"
```

### Benefits
- Near-instant hot reload (ms vs seconds)
- More stable than Webpack in large projects
- Rust-based bundler

### Fixing Chunk Errors
```bash
pkill -f "next dev"
rm -rf .next
npm run dev:turbo
```

---

## Design Decisions

### Satellite as Default
- Users can identify their building more easily
- Zoom level 19 (vs 18) for better detail
- Larger marker (48px vs 40px)

### Floating Controls Positioning
- Search: `top-4 left-4 right-16` (leaves room for close button)
- Close: `top-4 right-4`
- Map toggle + location: `bottom-28` (above action panel)
- Zoom: `right-4 top-1/2 -translate-y-1/2`
- Action panel: `bottom-0` with padding

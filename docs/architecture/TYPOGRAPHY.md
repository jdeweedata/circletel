---
type: architecture
domain: [frontend, design]
tags: [typography, fonts, inter, space-mono, tailwind, css]
status: current
last_updated: 2025-10-25
dependencies: [DESIGN_SYSTEM.md]
priority: low
description: Typography system with font stacks and CSS variables
---

# CircleTel Typography System

## Font Stack

### Primary: Inter
**Usage**: Body text, headings, UI components, forms
- Modern, geometric sans-serif
- Optimized for screens and UI
- Excellent readability at all sizes
- Variable font for performance

### Accent: Space Mono
**Usage**: Code snippets, technical data, order numbers, IDs, metrics
- Monospace font with personality
- Great for technical/data display
- Pairs beautifully with Inter
- Use sparingly for emphasis

---

## Implementation

### Global Setup (Already Configured)

**app/layout.tsx**:
```typescript
import { Inter, Space_Mono } from "next/font/google";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: 'swap',
});

const spaceMono = Space_Mono({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: 'swap',
});
```

**tailwind.config.ts**:
```typescript
fontFamily: {
  'sans': ['var(--font-inter)', ...fallbacks],
  'mono': ['var(--font-space-mono)', ...fallbacks],
}
```

---

## Usage Examples

### Default (Inter)
All text uses Inter by default:
```tsx
<p className="text-base">This uses Inter automatically</p>
<h1 className="text-4xl font-bold">Headings use Inter</h1>
```

### Monospace (Space Mono)
Use for technical/data elements:
```tsx
{/* Order numbers */}
<span className="font-mono text-sm">ORD-2024-001234</span>

{/* Technical IDs */}
<code className="font-mono bg-gray-100 px-2 py-1 rounded">
  090240287465
</code>

{/* Metrics/Stats */}
<div className="font-mono text-2xl font-bold">
  850 Mbps
</div>

{/* Code blocks */}
<pre className="font-mono text-sm bg-gray-900 text-white p-4 rounded-lg">
  npm install @circletel/sdk
</pre>
```

### Recommended Use Cases

#### Inter (font-sans - default)
- ✅ Body copy
- ✅ Headings (h1-h6)
- ✅ Buttons
- ✅ Form labels and inputs
- ✅ Navigation
- ✅ Cards and UI components
- ✅ Marketing content

#### Space Mono (font-mono)
- ✅ Order numbers: `ORD-2024-001234`
- ✅ Account IDs: `ACC-789456`
- ✅ Technical identifiers: `090240287465`
- ✅ Speed metrics: `850 Mbps`
- ✅ Data usage: `450 GB / 1 TB`
- ✅ Timestamps: `2025-01-15 14:30:22`
- ✅ API responses/code
- ✅ IP addresses: `192.168.1.1`
- ⚠️ Use sparingly - accent only

---

## Typography Scale

### Headings
```tsx
<h1 className="text-4xl md:text-5xl font-bold">Main Heading</h1>
<h2 className="text-3xl md:text-4xl font-semibold">Section Heading</h2>
<h3 className="text-2xl md:text-3xl font-semibold">Subsection</h3>
<h4 className="text-xl md:text-2xl font-medium">Card Title</h4>
<h5 className="text-lg font-medium">Small Heading</h5>
<h6 className="text-base font-medium">Tiny Heading</h6>
```

### Body Text
```tsx
<p className="text-base">Standard body (16px)</p>
<p className="text-sm">Small text (14px)</p>
<p className="text-xs">Extra small (12px)</p>
<p className="text-lg">Large body (18px)</p>
```

### Font Weights
```tsx
<span className="font-normal">Regular (400)</span>
<span className="font-medium">Medium (500)</span>
<span className="font-semibold">Semibold (600)</span>
<span className="font-bold">Bold (700)</span>
```

---

## Performance

### Load Times (South African Context)
- **Inter Variable**: ~35KB (subset: latin)
- **Space Mono**: ~25KB (weights: 400, 700)
- **Total**: ~60KB (acceptable for PP rule)
- **Display**: `swap` (prevents FOIT)

### Optimization
- ✅ Variable fonts for Inter (fewer requests)
- ✅ Subset to Latin characters only
- ✅ Font display: swap (immediate text render)
- ✅ Preloaded via Next.js font optimization
- ✅ Self-hosted (no Google Fonts CDN dependency)

---

## Examples in Context

### Dashboard Card
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-base">Your Plan</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="font-mono text-sm text-muted-foreground">
      ACC-789456
    </div>
    <div className="text-2xl font-bold">Premium Family</div>
    <div className="font-mono text-lg font-semibold text-primary">
      850 Mbps
    </div>
  </CardContent>
</Card>
```

### Order Summary
```tsx
<div>
  <h3 className="text-xl font-semibold mb-2">Order Summary</h3>
  <div className="flex justify-between">
    <span className="text-sm text-muted-foreground">Order Number</span>
    <span className="font-mono text-sm font-medium">ORD-2024-001234</span>
  </div>
  <div className="flex justify-between">
    <span className="text-sm text-muted-foreground">Download Speed</span>
    <span className="font-mono text-base font-bold">850 Mbps</span>
  </div>
</div>
```

---

## Design Principles

1. **Simplicity First (SF)**: Two fonts only - Inter + Space Mono
2. **Performance Priority (PP)**: Optimized for SA connectivity (~60KB total)
3. **Accessibility Standards (AS)**: High contrast, excellent legibility
4. **Modern Development (MD)**: Variable fonts, Next.js optimization

---

## Migration Notes

Previous font stack was Arial/Helvetica. All components now use:
- `font-sans` → Inter (default)
- `font-mono` → Space Mono (explicit)

No component changes needed - Inter is applied globally via `font-sans` class on `<html>`.

---

## Related Files
- `app/layout.tsx` - Font imports and CSS variables
- `tailwind.config.ts` - Font family configuration
- `app/globals.css` - Base typography styles

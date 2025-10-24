# Provider Logo Analysis - WebAfrica Implementation Study

**Date**: 2025-10-24
**Purpose**: Analyze WebAfrica's provider logo display system for CircleTel implementation
**Status**: ✅ Complete

---

## Executive Summary

WebAfrica displays network infrastructure provider logos on their fibre product cards to show customers which network provider delivers each product. This analysis documents their implementation for adoption in CircleTel's multi-provider product system.

**Key Findings**:
- **28 network providers** displayed with logos on WebAfrica
- **Logo styling**: 175px × 48px, `object-fit: contain`, **brand colors** (not grayscale)
- **Logo format**: Primarily SVG (27/28), with 1 PNG
- **Positioning**: Logo displayed at top of each product card
- **CircleTel providers**: Vumatel, MetroFibre, Openserve, DFA, MTN (5 active)

---

## WebAfrica Logo Implementation

### Visual Design

**Product Card Structure**:
```
┌─────────────────────────────────┐
│  [Provider Logo - 175×48px]     │  ← Top of card
│                                 │
│  R489pm                         │
│  R395pm / first 2 months        │
│                                 │
│  [Speed Dropdown: 30/30 Mbps]  │
│                                 │
│  What you get for free:         │
│  - Free setup worth R2699       │
│  - Fully insured router         │
│                                 │
│  [Check Availability Button]    │
└─────────────────────────────────┘
```

### Logo Styling

**CSS Properties** (inspected via Playwright):
```css
img[alt*="logo"] {
  width: 175px;
  height: 48px;
  object-fit: contain;  /* Maintains aspect ratio */
  filter: none;         /* NO grayscale - brand colors displayed */
  opacity: 1;
}
```

**Key Design Decisions**:
1. **Brand Colors**: Logos displayed in full color (NOT grayscale as initially thought)
2. **Fixed Dimensions**: 175px width ensures consistent sizing across all providers
3. **Aspect Ratio**: `object-fit: contain` prevents logo distortion
4. **Format**: SVG preferred for scalability and crisp rendering

### Logo Format Analysis

| Format | Count | Percentage | Examples |
|--------|-------|------------|----------|
| SVG | 27 | 96.4% | Vumatel, MetroFibre, Openserve, Frogfoot |
| PNG | 1 | 3.6% | Netstream |

**Recommendation**: Use SVG format for all CircleTel provider logos.

---

## WebAfrica Providers Catalog

### All 28 Providers Identified

| # | Provider Name | Logo URL | Format |
|---|---------------|----------|--------|
| 1 | **Vumatel** | `https://www.webafrica.co.za/.../vumatel-logo-fibre-webafrica.svg` | SVG |
| 2 | **Vuma Reach** | `https://www.webafrica.co.za/.../vuma-reach.svg` | SVG |
| 3 | **Octotel** | `https://www.webafrica.co.za/.../octotel-logo-fibre-webafrica.svg` | SVG |
| 4 | **MetroFibre** | `https://www.webafrica.co.za/.../metro-nexus-logo-fibre-webafrica.svg` | SVG |
| 5 | **MetroFibre Nova** | `https://www.webafrica.co.za/.../metro-nova-logo-fibre-webafrica.svg` | SVG |
| 6 | **Openserve** | `https://www.webafrica.co.za/.../openserve-logo-fibre-webafrica.svg` | SVG |
| 7 | **Frogfoot** | `https://www.webafrica.co.za/.../frogfoot-logo-fibre-webafrica.svg` | SVG |
| 8 | **Vuma Key** | `https://www.webafrica.co.za/.../vuma-key.svg` | SVG |
| 9 | **Web Connect** | `https://www.webafrica.co.za/.../openserve-web-connect-logo-fibre-webafrica.svg` | SVG |
| 10 | **Frogfoot Air** | `https://www.webafrica.co.za/.../frogfoot-air-logo-fibre-webafrica.svg` | SVG |
| 11 | **Vodacom** | `https://www.webafrica.co.za/.../vodacom-logo-fibre-webafrica.svg` | SVG |
| 12 | **Fibre Geeks** | `https://www.webafrica.co.za/.../fibregeeks-logo-fibre-webafrica.svg` | SVG |
| 13 | **ZoomFibre** | `https://www.webafrica.co.za/.../zoom-logo-fibre-webafrica.svg` | SVG |
| 14 | **Mitsol** | `https://www.webafrica.co.za/.../mitsol-logo-fibre-webafrica.svg` | SVG |
| 15 | **Evotel** | `https://www.webafrica.co.za/.../evotel-logo-fibre-webafrica.svg` | SVG |
| 16 | **Balwin** | `https://www.webafrica.co.za/.../balwin-logo-fibre-webafrica.svg` | SVG |
| 17 | **Comtel** | `https://www.webafrica.co.za/.../comtel-logo-fibre-webafrica.svg` | SVG |
| 18 | **Gaia Fibonacci** | `https://www.webafrica.co.za/.../Fibonacci_Webafrica.svg` | SVG |
| 19 | **FibreSuburb** | `https://www.webafrica.co.za/.../fibresuburbs-logo-fibre-webafrica.svg` | SVG |
| 20 | **Cybersmart** | `https://www.webafrica.co.za/.../Cybersmart-Webafrica.svg` | SVG |
| 21 | **TT Connect** | `https://www.webafrica.co.za/.../ttconnect-logo-fibre-webafrica.svg` | SVG |
| 22 | **Thinkspeed** | `https://www.webafrica.co.za/.../thinkspeed-logo-fibre-webafrica.svg` | SVG |
| 23 | **DNATel** | `https://www.webafrica.co.za/.../dnatel-logo-fibre-webafrica.svg` | SVG |
| 24 | **Lightstruck** | `https://www.webafrica.co.za/.../lightstruck-logo-fibre-webafrica.svg` | SVG |
| 25 | **ClearAccess** | `https://www.webafrica.co.za/.../clearaccess-logo-fibre-webafrica.svg` | SVG |
| 26 | **Netstream** | `https://www.webafrica.co.za/.../netstream-logo-fibre-webafrica.png` | PNG |
| 27 | **Open Fibre** | `https://www.webafrica.co.za/.../openfibre-logo-fibre-webafrica.svg` | SVG |
| 28 | **Link Layer** | `https://www.webafrica.co.za/.../linklayer-logo-fibre-webafrica.svg` | SVG |

---

## CircleTel Active Providers

Based on `supabase/migrations/20251021000006_cleanup_and_migrate.sql`, CircleTel has 5 network providers:

| Provider | Code | Status | Logo Downloaded | Logo Path |
|----------|------|--------|----------------|-----------|
| **MTN** | `mtn` | ✅ Active | ✅ Yes | `public/images/providers/mtn.png` (3840×2160, 31KB) |
| **Dark Fibre Africa** | `dfa` | ✅ Active | ✅ Yes (2 versions) | `public/images/providers/dfa-dark.png`<br>`public/images/providers/dfa-white.png` |
| **MetroFibre** | `metrofibre` | ⚠️ Inactive (placeholder) | ✅ Yes | `public/images/providers/metrofibre.svg` |
| **Openserve** | `openserve` | ⚠️ Inactive (placeholder) | ✅ Yes | `public/images/providers/openserve.svg` |
| **Vumatel** | `vumatel` | ⚠️ Inactive (placeholder) | ✅ Yes | `public/images/providers/vumatel.svg` |

**Total Active**: 2 providers (MTN, DFA)
**Total Configured**: 5 providers

---

## Downloaded Provider Logos

### Logo Inventory

```bash
public/images/providers/
├── dfa-dark.png      # 11 KB - Dark Fibre Africa (dark text, transparent)
├── dfa-white.png     # 14 KB - Dark Fibre Africa (white text, transparent)
├── metrofibre.svg    # 11 KB - MetroFibre Nexus
├── mtn.png           # 31 KB - MTN (3840×2160 PNG)
├── openserve.svg     # 2.4 KB - Openserve
└── vumatel.svg       # 3.6 KB - Vumatel
```

### Logo File Analysis

| Logo | Format | Size | Dimensions (natural) | Status |
|------|--------|------|---------------------|--------|
| `dfa-dark.png` | PNG-8 (colormap) | 11 KB | 1130 × 836 px | ✅ Valid |
| `dfa-white.png` | PNG-8 (colormap) | 14 KB | 1080 × 799 px | ✅ Valid |
| `metrofibre.svg` | SVG | 11 KB | Scalable | ✅ Valid |
| `mtn.png` | PNG-4 (colormap) | 31 KB | 3840 × 2160 px | ✅ Valid |
| `openserve.svg` | SVG | 2.4 KB | Scalable | ✅ Valid |
| `vumatel.svg` | SVG | 3.6 KB | Scalable | ✅ Valid |

**Status**: ✅ All logos downloaded successfully.

---

## CircleTel Implementation Plan

### 1. Database Schema Enhancement

**Add to `fttb_network_providers` table**:
```sql
ALTER TABLE fttb_network_providers
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_dark_url TEXT,
ADD COLUMN IF NOT EXISTS logo_light_url TEXT,
ADD COLUMN IF NOT EXISTS logo_format VARCHAR(10) DEFAULT 'svg',
ADD COLUMN IF NOT EXISTS logo_aspect_ratio DECIMAL(5,2);
```

**Update existing providers**:
```sql
UPDATE fttb_network_providers
SET
  logo_url = '/images/providers/mtn.svg',
  logo_format = 'svg',
  logo_aspect_ratio = 1.96  -- Example: 300/153
WHERE provider_code = 'mtn';

UPDATE fttb_network_providers
SET
  logo_url = '/images/providers/dfa-dark.png',
  logo_light_url = '/images/providers/dfa-white.png',
  logo_format = 'png',
  logo_aspect_ratio = 1.35  -- 1130/836
WHERE provider_code = 'dfa';
```

### 2. React Component: `ProviderLogo.tsx`

**Component Specification**:
```tsx
interface ProviderLogoProps {
  providerCode: string;
  providerName: string;
  logoUrl: string;
  className?: string;
  variant?: 'default' | 'grayscale';  // User requested grayscale option
  priority?: boolean;  // For Next.js Image optimization
}

// Default styling
const defaultStyles = {
  width: '175px',
  height: '48px',
  objectFit: 'contain'
};

// Grayscale filter (user requested)
const grayscaleFilter = {
  filter: 'grayscale(100%)',
  opacity: 0.7  // Optional: reduce opacity for subtle effect
};
```

**Features**:
- Next.js `<Image>` component for optimization
- Fallback for missing logos
- Responsive sizing (mobile vs desktop)
- Optional grayscale variant (as user requested)
- Alt text for accessibility

### 3. Integration Points

**Coverage API Response** (`/api/coverage/packages`):
```typescript
{
  "available": true,
  "services": ["fibre", "wireless"],
  "packages": [
    {
      "id": "pkg-123",
      "name": "HomeFibre Premium",
      "service_type": "HomeFibreConnect",
      "price": 799,
      "provider": {
        "code": "dfa",
        "name": "Dark Fibre Africa",
        "logo_url": "/images/providers/dfa-dark.png"
      }
    }
  ]
}
```

**Product Display Pages**:
- `/packages/[leadId]/page.tsx` - Package selection cards
- `/coverage` - Coverage checker results
- `components/ui/compact-package-card.tsx` - Product card component
- `components/ui/package-detail-sidebar.tsx` - Sidebar detail view

### 4. Styling Approach

**Option 1: Brand Colors (WebAfrica style)**
```css
.provider-logo {
  width: 175px;
  height: 48px;
  object-fit: contain;
  filter: none;  /* Full brand colors */
}
```

**Option 2: Grayscale (CircleTel requested)**
```css
.provider-logo {
  width: 175px;
  height: 48px;
  object-fit: contain;
  filter: grayscale(100%);
  opacity: 0.7;
}

.provider-logo:hover {
  filter: none;  /* Show colors on hover */
  opacity: 1;
}
```

**Recommendation**: Start with **Option 2 (grayscale)** as user requested, with hover effect to show brand colors.

---

## Responsive Design Considerations

### Desktop (1024px+)
- Logo: 175px × 48px (WebAfrica standard)
- Positioned at top of product card
- Hover effects enabled

### Tablet (768px - 1023px)
- Logo: 150px × 41px (scaled proportionally)
- Maintain aspect ratio
- Touch-friendly spacing

### Mobile (< 768px)
- Logo: 120px × 33px (scaled proportionally)
- Compact layout
- Ensure readability

### CSS Implementation
```css
.provider-logo {
  width: 175px;
  height: 48px;
  object-fit: contain;
}

@media (max-width: 1023px) {
  .provider-logo {
    width: 150px;
    height: 41px;
  }
}

@media (max-width: 767px) {
  .provider-logo {
    width: 120px;
    height: 33px;
  }
}
```

---

## Testing Checklist

### Logo Display Testing
- [ ] Logo renders correctly in product cards
- [ ] Grayscale filter applied correctly
- [ ] Hover effect shows brand colors
- [ ] Fallback displays when logo missing
- [ ] Responsive sizing works on all breakpoints

### Coverage API Testing
- [ ] Provider data includes logo URL
- [ ] Multiple providers display correctly
- [ ] Logo matches correct provider
- [ ] Performance: logos load quickly

### Accessibility Testing
- [ ] Alt text present and descriptive
- [ ] Logo readable in high-contrast mode
- [ ] Screen reader announces provider name
- [ ] Keyboard navigation works

---

## Technical Implementation Files

### New Files to Create
1. `components/products/ProviderLogo.tsx` - Logo component
2. `lib/types/provider-types.ts` - Provider TypeScript types
3. `supabase/migrations/20251024XXXXXX_add_provider_logos.sql` - Database migration

### Files to Modify
1. `app/api/coverage/packages/route.ts` - Add provider data to response
2. `components/ui/compact-package-card.tsx` - Add ProviderLogo component
3. `components/ui/package-detail-sidebar.tsx` - Add provider info section
4. `app/packages/[leadId]/page.tsx` - Pass provider data to components

---

## Database Query Examples

### Fetch Products with Provider Logos
```sql
SELECT
  sp.id,
  sp.name,
  sp.price,
  sp.service_type,
  sp.compatible_providers,
  fnp.provider_code,
  fnp.display_name AS provider_name,
  fnp.logo_url,
  fnp.logo_dark_url,
  fnp.logo_light_url,
  fnp.logo_format
FROM service_packages sp
JOIN fttb_network_providers fnp
  ON fnp.provider_code = ANY(sp.compatible_providers)
WHERE sp.active = true
  AND fnp.active = true
ORDER BY fnp.priority ASC, sp.price ASC;
```

### Get Provider by Code
```sql
SELECT
  provider_code,
  display_name,
  logo_url,
  logo_dark_url,
  logo_light_url,
  logo_format,
  logo_aspect_ratio
FROM fttb_network_providers
WHERE provider_code = 'dfa'
  AND active = true;
```

---

## Next Steps

### Phase 1: Database & Assets (Current)
- [x] Download provider logos
- [ ] Obtain official MTN logo (replace current)
- [ ] Create database migration
- [ ] Apply migration to Supabase

### Phase 2: Component Development
- [ ] Create `ProviderLogo.tsx` component
- [ ] Create provider TypeScript types
- [ ] Add unit tests for component

### Phase 3: Integration
- [ ] Modify coverage API to include provider data
- [ ] Update product card components
- [ ] Update package selection page
- [ ] Add provider filter (optional future enhancement)

### Phase 4: Testing & Polish
- [ ] Test on all breakpoints
- [ ] Verify accessibility
- [ ] Performance optimization
- [ ] User acceptance testing

---

## Design Decisions Log

| Decision | Rationale | Date |
|----------|-----------|------|
| Use grayscale logos | User requested "grey scale style" for provider logos | 2025-10-24 |
| 175px × 48px dimensions | Matches WebAfrica standard, proven UX | 2025-10-24 |
| SVG format preferred | Scalability, crisp rendering, small file size | 2025-10-24 |
| Hover effect shows colors | Improves UX, shows brand identity | 2025-10-24 |
| Store logos in public/images/providers/ | Next.js static asset optimization | 2025-10-24 |
| Database stores logo URLs | Flexible, allows CDN migration later | 2025-10-24 |

---

## References

- **WebAfrica Fibre Page**: https://www.webafrica.co.za/fibre/
- **CircleTel Provider Migration**: `supabase/migrations/20251021000006_cleanup_and_migrate.sql`
- **HomeFibre Disabled Products**: `docs/products/HOMEFIBRE_PRODUCTS_DISABLED_2025-10-24.md`
- **Fibre API Flow**: `docs/analysis/FIBRE_PACKAGES_API_TO_DATABASE_FLOW.md`

---

**Last Updated**: 2025-10-24
**Analysts**: Claude Code + Development Team
**Status**: Documentation complete, implementation pending
**Version**: 1.0

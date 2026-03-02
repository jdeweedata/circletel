# SkyFibre Home Prismic Product Page Design

**Date**: 2026-03-01
**Status**: Implemented
**Author**: Claude Code

## Overview

Design for a Prismic-managed product landing page for SkyFibre Home residential internet service.

## Decisions Made

1. **Page Type**: Product Landing Page (marketing content, not individual product detail)
2. **Product Line**: SkyFibre Home (residential FWA)
3. **Page Structure**: Simple - Hero + Pricing + FAQ + CTA
4. **Approach**: New `product_page` document type in Prismic (Option A)

## Architecture

### URL Structure

| Content Type | URL Pattern | Source |
|--------------|-------------|--------|
| Product Landing Pages | `/product/:uid` | Prismic CMS |
| Product Detail Pages | `/products/:slug` | Supabase DB |
| Service Pages | `/services/:slug` | Prismic CMS |

### Document Type: `product_page`

**Location**: `customtypes/product_page/index.json`

**Main Tab Fields**:
- `uid` (UID) - URL slug
- `product_name` (Text) - Product title
- `tagline` (Text) - Subtitle/value proposition
- `hero_image` (Image) - Background image for hero
- `hero_cta_text` (Text) - Button label
- `hero_cta_link` (Link) - CTA destination
- `slices` (SliceZone) - pricing_table, faq, feature_grid, comparison_table, hero_section

**SEO Tab Fields**:
- `meta_title` (Text)
- `meta_description` (Text)
- `meta_image` (Image)

### Available Slices

| Slice | Purpose | Status |
|-------|---------|--------|
| `pricing_table` | Show pricing tiers | Existing |
| `faq` | FAQ accordion | Existing |
| `feature_grid` | Feature highlights | Existing |
| `comparison_table` | vs competitors | Existing |
| `hero_section` | Additional hero (optional) | Existing |

## Implementation

### Files Created/Modified

1. **New Files**:
   - `customtypes/product_page/index.json` - Prismic document type
   - `app/product/[uid]/page.tsx` - Next.js page component
   - `.design/images/sections/hero/skyfibre-home-hero.jpg` - Hero image

2. **Modified Files**:
   - `prismicio.ts` - Added product_page route
   - `lib/prismicio.ts` - Added product_page route

### Hero Image

**Location**: `.design/images/sections/hero/skyfibre-home-hero.jpg`
**Dimensions**: 2752 x 1536 (16:9)
**Size**: 6.6MB
**Content**: South African family using internet at home, modern living room, orange accent lighting

## Usage

### Creating Content in Prismic

1. Go to https://circletel.prismic.io/builder
2. Create new document → Select "Product Page"
3. Fill in:
   - UID: `skyfibre-home`
   - Product Name: `SkyFibre Home`
   - Tagline: `Fast, Reliable Home Internet`
   - Hero Image: Upload the generated hero image
   - CTA Text: `Check Your Coverage`
   - CTA Link: `/coverage-check`
4. Add slices:
   - Pricing Table (3 tiers: Plus R799, Max R999, Ultra R1299)
   - FAQ (3-5 common questions)
5. Fill SEO tab
6. Publish

### Accessing in App

The page will be available at:
```
https://www.circletel.co.za/product/skyfibre-home
```

### Syncing Types (After Publishing to Prismic)

```bash
npx @slicemachine/init --repository circletel
# Or run Slice Machine UI
npx prismic-cli init --repository circletel
```

## Content Structure (SkyFibre Home)

```
/product/skyfibre-home
├── Hero (built-in)
│   ├── Product Name: "SkyFibre Home"
│   ├── Tagline: "Fast, Reliable Home Internet"
│   ├── Background: Family using internet
│   └── CTA: "Check Your Coverage" → /coverage-check
│
├── Pricing Table (slice)
│   ├── Plus: 50Mbps @ R799/mo
│   ├── Max: 100Mbps @ R999/mo
│   └── Ultra: 200Mbps @ R1,299/mo
│
└── FAQ (slice)
    ├── What speeds can I expect?
    ├── Is installation included?
    └── What about load shedding?
```

## Next Steps

1. **Push custom type to Prismic**: Run Slice Machine to sync
2. **Create content**: Use Prismic dashboard to create SkyFibre Home page
3. **Upload hero image**: Add generated image to Prismic media library
4. **Test locally**: Visit `/product/skyfibre-home` after content is published
5. **Add more product pages**: Repeat for SkyFibre SMB, WorkConnect, etc.

## Brand Compliance

- Primary orange (#F5831F) used for CTAs
- Dark gradient overlay for text readability
- Clean, modern hero with text-left layout
- CircleTel brand guidelines followed for image generation

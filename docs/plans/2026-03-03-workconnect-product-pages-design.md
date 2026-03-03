# WorkConnect Product Pages Design

**Date:** 2026-03-03
**Status:** Approved
**Author:** Claude Code

## Overview

Create product pages for WorkConnect Starter, Plus, and Pro using Sanity CMS with AI-generated hero images and dynamic Next.js pages.

## Approach: Sanity-First

All content lives in Sanity CMS as the single source of truth. Marketing team can edit copy, prices, and features without developer involvement.

## Components

### 1. AI Image Generation

Generate 3 hero images using Gemini image generation:

| Product | Concept | Specs |
|---------|---------|-------|
| **Starter** | Solo freelancer at clean home desk, laptop with video call, morning light | 16:9, 1920x1080, 4K |
| **Plus** | Small team in modern home office, dual monitors, afternoon productivity | 16:9, 1920x1080, 4K |
| **Pro** | Power user with multi-monitor, streaming gear, content creation vibe | 16:9, 1920x1080, 4K |

**Visual Guidelines:**
- Professional lifestyle photography style
- South African diversity
- Warm neutrals with CircleTel orange (#FF6B00) accents
- No AI-generated text or logos

### 2. Sanity Content Structure

Three `productPage` documents:

#### WorkConnect Starter (R799/mo)
- Tagline: "Start Working Smarter"
- Target: Freelancers, entry WFH
- Key features: 50 Mbps, VoIP QoS, 25GB backup, 2 email accounts
- Support: Mon-Sat 07:00-19:00, 12hr response

#### WorkConnect Plus (R1,099/mo)
- Tagline: "Power Your Productivity"
- Target: Remote workers, micro-business
- Key features: 100 Mbps, 50GB backup, 5 emails, 3 VPN tunnels
- Support: 8hr response
- Badge: "Most Popular"

#### WorkConnect Pro (R1,499/mo)
- Tagline: "Built for Ambition"
- Target: Content creators, power users, 3-5 staff
- Key features: 200 Mbps, 100GB backup, 10 emails, static IP included
- Support: 4hr response, WhatsApp priority
- Badge: "Best Value"

### 3. Next.js Dynamic Pages

**Route:** `/workconnect/[slug]/page.tsx`

**Sections:**
1. Hero - Full-width image, name, tagline, price, CTA
2. Key Features Grid - 4-6 cards with icons
3. Technical Specs - Clean specification table
4. Technology Note - FWB vs FTTH upload disclosure
5. Plan Comparison CTA
6. FAQ Block (from Sanity)
7. Final CTA - Coverage check

**Data Fetching:**
```typescript
const WORKCONNECT_PRODUCT_QUERY = groq`
  *[_type == "productPage" && slug.current == $slug][0] {
    name, tagline, "slug": slug.current,
    heroImage, pricing, keyFeatures, specifications, seo
  }
`;
```

### 4. SOHO Landing Page Update

**File:** `app/(marketing)/soho/page.tsx`

**Changes:**
- Remove hardcoded `WORKCONNECT_PLANS` array
- Fetch products from Sanity with ISR
- Fix pricing: Plus R999 → R1,099
- Keep existing UI layout

**Query:**
```typescript
const WORKCONNECT_ALL_QUERY = groq`
  *[_type == "productPage" && category == "soho"]
  | order(pricing.startingPrice asc) {
    name, "slug": slug.current, tagline,
    heroImage, pricing, keyFeatures[0...6]
  }
`;
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `public/images/workconnect/*.jpg` | Create - 3 AI images |
| `app/workconnect/[slug]/page.tsx` | Create - Dynamic product page |
| `lib/sanity/queries.ts` | Modify - Add WorkConnect queries |
| `app/(marketing)/soho/page.tsx` | Modify - Fetch from Sanity |
| Sanity Studio | Create - 3 product documents |

## Product Specifications Reference

Source: `/home/circletel/products/connectivity/soho/CircleTel_WorkConnect_SOHO_Product_Portfolio_v1_1.md`

### Speed Profiles (Technology-Dependent)

| Tier | FTTH | FWB (Tarana) | 5G/LTE |
|------|------|--------------|--------|
| Starter | 50/50 Mbps | 50/12.5 Mbps | ~50/10 Mbps |
| Plus | 100/100 Mbps* | 100/25 Mbps | ~100/20 Mbps |
| Pro | 200/200 Mbps | 200/50 Mbps | ~200/40 Mbps |

*FTTH Plus: Customer receives 200/200 (no 100 Mbps wholesale tier)

### Pricing Correction

The existing SOHO page shows Plus at R999. Per the product spec, the correct price is **R1,099**.

## Success Criteria

1. Three AI-generated hero images uploaded to Sanity
2. Three product documents created in Sanity Studio
3. Dynamic `/workconnect/[slug]` page rendering from Sanity
4. SOHO landing page fetching products from Sanity
5. Correct pricing displayed (Plus = R1,099)
6. Mobile-responsive layouts
7. Coverage check CTA functional on all pages

# CircleTel Marketing Slices

This directory contains all Prismic Slices (reusable page sections) for CircleTel marketing content.

## Planned Slices (Phase 3)

We'll create these 6 essential slices:

### 1. HeroSection
- **Purpose:** Main hero banner for landing pages
- **Fields:** headline, subheadline, cta_text, cta_link, background_image
- **Style:** Full-width, centered text, CircleTel orange CTA

### 2. FeatureGrid
- **Purpose:** Showcase product/service features
- **Fields:** section_title, features (repeatable: icon, title, description)
- **Style:** Responsive 3-column grid (1/2/3 columns on mobile/tablet/desktop)

### 3. PricingTable
- **Purpose:** Display service packages with pricing
- **Fields:** section_title, plans (repeatable: name, price, features, cta, highlighted)
- **Style:** Cards with conditional orange border for highlighted plan

### 4. CallToAction
- **Purpose:** Conversion-focused section
- **Fields:** headline, description, primary_cta, secondary_cta, background_color
- **Style:** Full-width with dynamic background (orange/dark/light)

### 5. FAQ
- **Purpose:** Frequently Asked Questions
- **Fields:** section_title, faqs (repeatable: question, answer)
- **Style:** Accordion component with smooth animations

### 6. TestimonialCarousel
- **Purpose:** Customer testimonials
- **Fields:** section_title, testimonials (repeatable: quote, author, role, image, logo)
- **Style:** Auto-rotating carousel with CircleTel branding

## Old Slices

Previous custom CMS slices have been removed as part of tech debt cleanup (2026-02-08).
See ADR: `docs/architecture/adr/ADR-001-cms-migration-to-prismic.md`

---

**Status:** Ready for Phase 3 implementation
**Brand Colors:** Orange #F5831F, Dark Neutral #1F2937, Light Neutral #E6E9EF

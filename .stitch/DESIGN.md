# Design System: CircleTel Arlan Bundles — Product Pages
**Project ID:** 16627943995582367258
**Stitch Project:** projects/16627943995582367258
**Design System Asset:** assets/5857804706630434043
**Generated:** 2026-04-06
**Source Screens:** 10 (8 desktop, 2 mobile)

---

## 1. Visual Theme & Atmosphere

Warm, locally-rooted, and confidently commercial. The design projects the energy of a South African SME champion — approachable and direct, never cold or corporate. Every screen is built around a single conversion goal, with the primary CTA visible above the fold without scrolling.

The mood is **Vibrant-Functional**: generous whitespace on white backgrounds gives breathing room, while bold orange accent work and high-contrast navy anchors communicate authority and momentum. There is no dark mode — the brand lives entirely in light, with sections alternating between white (`#FFFFFF`) and an off-white warm gray (`#F8F9FA`) to create rhythm without visual fatigue.

Where sections need emphasis (hero areas, feature callouts, and footers), a deep navy background (`#1E293B`) is used with reversed typography to create strong contrast moments that frame the surrounding light content.

The overall density is **moderate** — enough information on screen to build confidence and answer objections, but never overwhelming. Pricing is always prominent and unambiguous.

---

## 2. Color Palette & Roles

| Name | Hex | Role |
|------|-----|------|
| **Conversion Orange** | `#E87A1E` | All primary CTAs, price highlights, active nav states, feature badges, card top-border on recommended tier |
| **Anchor Navy** | `#1E293B` | Hero sections, footer backgrounds, dark section overlays, primary heading text on light backgrounds |
| **WhatsApp Growth Green** | `#16A34A` | WhatsApp CTA buttons exclusively, success states, checkmark icons, positive badge fills |
| **Primary Body Text** | `#111827` | All main body copy, product names, feature labels — near-black for legibility without harshness |
| **Supporting Gray** | `#6B7280` | Secondary body copy, metadata text, form labels, descriptive subtext beneath headings |
| **Cloud White** | `#FFFFFF` | Primary page background, card backgrounds, reversed text on dark sections |
| **Warmth Wash** | `#F8F9FA` | Alternate section backgrounds — creates visual separation without border lines |
| **Frosted Glass** | `rgba(255,255,255,0.80)` with `backdrop-filter: blur(12px)` | Sticky navigation bar on scroll — gives depth without blocking content |

**Palette philosophy:** Two colours do the conversion work (orange for action, green for WhatsApp). Navy holds the structure. Everything else recedes to support them.

---

## 3. Typography Rules

**Headlines:** Plus Jakarta Sans — set bold (700) to extrabold (800) weight for all display text, product names, section titles, and pricing figures. Tracking is tight (letter-spacing: -0.02em) for headlines above 24px, giving headings a compact, confident presence. Used at 48–64px for hero headlines, 28–36px for section titles, 20–24px for card headings.

**Body Copy:** Inter — set regular (400) to medium (500) weight for all body text, feature descriptions, and form elements. Line height is relaxed (1.6) for paragraph text, ensuring comfortable reading across long feature lists and pricing comparisons. Used at 15–16px for body copy, 13–14px for metadata and captions.

**Price Display:** Plus Jakarta Sans ExtraBold (800) at oversized scale — pricing figures are always the largest typographic element on pricing cards, set in either Conversion Orange (`#E87A1E`) for the primary tier or Anchor Navy (`#1E293B`) for secondary tiers.

**Labels & Badges:** Inter Medium (500) in uppercase, tight tracking (0.06em), small scale (11–12px) — used for category badges, tier labels, and status indicators.

**Hierarchy rule:** Never use more than 3 type sizes on a single screen section. Headline → Subheading → Body. Price figures sit outside this hierarchy as a deliberate emphasis break.

---

## 4. Component Stylings

**Primary Buttons (CTA):**
Pill-shaped (border-radius: 9999px), filled with Conversion Orange (`#E87A1E`), white label text in Inter Medium. Minimum height 48px desktop, 52px mobile. Padding: 12px 28px. No border. Hover state: 8% darker orange. Shadow: none — buttons are flat to avoid competing with card shadows.

**WhatsApp Buttons:**
Same pill shape and sizing as primary, filled with WhatsApp Growth Green (`#16A34A`), white label text. Always accompanied by a WhatsApp icon to the left of the label. Used as the lowest-friction lead channel — appears near every primary CTA as a secondary option.

**Ghost / Outline Buttons:**
Pill-shaped, transparent fill, 1.5px Conversion Orange border, Conversion Orange label text. Used for secondary actions and "Learn more" patterns alongside a primary CTA.

**Product Cards:**
White background (`#FFFFFF`), border-radius 1rem (16px), shadow: 0 2px 12px rgba(0,0,0,0.08) — whisper-soft and diffused to lift cards off the page without drama. Standard cards have no top border. **Recommended or featured tier cards** gain a 3px solid Conversion Orange top border and a subtly elevated shadow: 0 4px 24px rgba(232,122,30,0.15) — the orange glow effect that signals "best choice" without text labels.

**Comparison Tables:**
Two-column tables (CircleTel vs competitor) use the same card container styling. CircleTel column has the Conversion Orange top border treatment. Row alternation uses Warmth Wash (`#F8F9FA`) on every second row.

**Glass Navigation Bar:**
Sticky, 64px tall, frosted glass (`rgba(255,255,255,0.80)` + `backdrop-filter: blur(12px)`), 1px bottom border in light gray. Logo left-aligned. Navigation links use Inter Medium in Primary Body Text colour (`#111827`), active/hover state switches to Conversion Orange. Primary CTA button ("Get Started" / "Check Availability") right-aligned in orange pill style.

**Feature Icon Badges:**
Circular container, Warmth Wash (`#F8F9FA`) fill, 48–56px, containing a Material Symbols Outlined icon in Conversion Orange. Used in "How It Works" and feature list sections.

**Form Inputs:**
1px solid border in `#D1D5DB` (light gray), border-radius 0.75rem (12px), white fill, Inter Regular 15px placeholder text in `#9CA3AF`. Focus state: border switches to Conversion Orange with a soft orange glow ring (`box-shadow: 0 0 0 3px rgba(232,122,30,0.15)`). Maximum 3 fields per form — never more.

**Section Dividers:**
No visible dividers or horizontal rules. Section separation is achieved entirely through background colour alternation (white ↔ Warmth Wash) and vertical padding (80px desktop, 48px mobile).

---

## 5. Layout Principles

**Max content width:** 1200px, horizontally centred on all viewports.

**Section rhythm:** Sections alternate between Cloud White (`#FFFFFF`) and Warmth Wash (`#F8F9FA`) backgrounds. Dark navy (`#1E293B`) sections appear at hero, mid-page emphasis moments, and footer. Never two dark sections adjacent.

**Vertical spacing:** 80px top/bottom padding on desktop sections, 48px on mobile. Card grids use 24px gap. Feature icon rows use 32px gap.

**Grid structure:**
- 4-column product card grid on desktop (1280px+)
- 2-column grid on tablet (768px–1279px)
- Single column on mobile (< 768px), full-width cards

**CRO layout rules:**
- Single primary CTA per screen section — never two orange buttons side by side
- Price anchor appears above the fold on all product pages
- WhatsApp CTA always appears as a secondary option beneath or beside the primary CTA
- Objection handling copy appears inline beneath CTAs, never in footnotes
- Social proof (customer count, testimonials) placed immediately above or below primary CTA

**Navigation:** Sticky glass nav always visible. Mobile nav collapses to hamburger with full-screen overlay drawer, maintaining glass/blur effect.

**Mobile-first considerations:**
- Touch targets minimum 48×48px
- Full-width buttons on mobile (no pill shrinkage)
- Pricing cards stack vertically, recommended tier floated to top
- Forms max 3 fields, large input height (52px) for thumb-friendly tapping

---

## 6. Voice & Tone (for copy alignment)

- Address SME owners directly: "your team", "your fleet", "your office"
- Contrast vs "going to the MTN store" — that is the reference competitor
- Highlight: zero CAPEX, single invoice, one account, local support
- Price always prominent — never hide pricing or make users click to see it
- CTA text: action-first ("Get Business Mobile", "Connect Your Fleet", "Check Coverage") not generic ("Submit", "Learn More")
- Warm and local, not corporate telco cold — CircleTel is the SME owner's partner, not a provider

---

## Usage

When prompting Stitch to generate new screens for this project, include this block at the start of your prompt:

```
Using the CircleTel design system (project 16627943995582367258):
- Primary: Conversion Orange (#E87A1E) for all CTAs
- Dark: Anchor Navy (#1E293B) for headings and dark sections  
- Accent: WhatsApp Green (#16A34A) for WhatsApp CTAs only
- Fonts: Plus Jakarta Sans headlines (extrabold, -0.02em tracking), Inter body (medium, relaxed)
- Buttons: pill-shaped (9999px radius), flat (no shadow)
- Cards: white, 16px radius, whisper-soft shadow; featured = 3px orange top border
- Layout: max 1200px, 80px section padding, alternating white/F8F9FA backgrounds
- CRO: single primary CTA per section, price above fold, WhatsApp always secondary option
```

*CircleTel (Pty) Ltd — "Connecting Today, Creating Tomorrow"*

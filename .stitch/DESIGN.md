# CircleTel Design System
**Version:** 2.0  
**Updated:** 2026-04-06  
**Scope:** Full platform — Marketing, Order Flow, Customer Dashboard, Admin, Partner Portal  
**Stitch Project:** 16627943995582367258  
**Brand tagline:** "One Provider. One Bill. Your Office Runs."

---

## 1. Visual Theme & Atmosphere

CircleTel is South Africa's SME champion ISP — warm, local, and commercially direct. The design language lives at the intersection of **conversion-first product marketing** and **data-dense operations tooling**: the same brand must sell R2,499/mo office bundles to a Rivonia SME owner on mobile, and display 300-row billing tables to an admin operator on a 27-inch monitor.

The result is a **Vibrant-Functional** system built on five guiding moods:

**Public marketing** — Bold Manrope headings in deep navy, high-contrast orange CTAs, generous whitespace, and a warm off-white alternating section rhythm. Every marketing page has one job: get the visitor to check coverage or speak to sales on WhatsApp.

**Order flow** — Clean, step-by-step process UI. Low visual noise. Progress indicators. Confident pricing. Never make the user wonder where they are or what comes next.

**Customer dashboard** — Calm data overview. Navy sidebar, white content area, stat cards with subtle shadows. Success greens and amber warnings dominate. Orange is reserved for upsell CTAs only.

**Admin console** — Dense information architecture. Slate-50 background, white panels, tabbed detail pages. Status badges tell the story. Compact typography at 13–14px for table rows.

**Partner portal** — Same admin shell, slightly elevated trust signals. Compliance document states, FICA badge treatments, partner ID chips.

**No dark mode.** The entire CircleTel platform runs exclusively in light mode. The Anchor Navy sections (hero, footer, emphasis) provide the contrast moments that replace dark mode in competing SaaS products.

---

## 2. Color Palette & Roles

### Brand Core

| Token | Hex | Role |
|-------|-----|------|
| `--ct-orange` | `#E87A1E` | **All primary CTAs**, pricing highlights, active nav states, featured card top-border, icon accents |
| `--ct-orange-accessible` | `#AE5B16` | Orange text on light backgrounds (accessibility, 4.5:1 contrast on white) |
| `--ct-orange-dark` | `#C45A30` | Hover state for orange buttons and interactive elements |
| `--ct-orange-light` | `#FDF2E9` | Tint backgrounds for orange icon badges, tab hover states, light callout fills |
| `--ct-navy` | `#1B2A4A` | Hero sections, footer, dark emphasis sections, sidebar background |
| `--ct-navy-deep` | `#0F1427` | Darkest surface — gradient terminus, modal overlays, midnight-dark hero variants |
| `--ct-charcoal` | `#2D3436` | Footer background (slightly warmer than navy for visual separation) |

### WhatsApp Channel

| Token | Hex | Role |
|-------|-----|------|
| `--ct-wa-green` | `#16A34A` | **WhatsApp CTA buttons exclusively** — never used for any other purpose |
| `--ct-wa-green-hover` | `#15803D` | WhatsApp button hover state |

### UI Surface Scale

| Token | Hex | Role |
|-------|-----|------|
| `--ct-bg` | `#F9FAFB` | Page background (admin, dashboard, order flow) |
| `--ct-bg-warm` | `#F8F9FA` | Alternating section background on marketing pages |
| `--ct-white` | `#FFFFFF` | Card surfaces, nav bar, input fills, primary content background |
| `--ct-border` | `#E5E7EB` | Default borders — cards, inputs, table rows, dividers |
| `--ct-border-strong` | `#D1D5DB` | Stronger borders for form inputs, focused panels |

### Text Scale

| Token | Hex | Role |
|-------|-----|------|
| `--ct-text-primary` | `#111827` | All body copy, product names, form content |
| `--ct-text-secondary` | `#4B5563` | Supporting copy, form labels, card subtitles |
| `--ct-text-muted` | `#6B7280` | Metadata, timestamps, captions, placeholder text |
| `--ct-text-inverted` | `#FFFFFF` | Text on dark navy / charcoal surfaces |

### Semantic Status (Admin & Dashboard)

| State | Background | Text | Use |
|-------|-----------|------|-----|
| Success | `#ECFDF5` | `#047857` | Active, Paid, Completed, Approved, Verified |
| Warning | `#FFFBEB` | `#B45309` | Pending, Processing, Awaiting, Scheduled |
| Error | `#FEF2F2` | `#B91C1C` | Failed, Cancelled, Rejected, Expired |
| Info | `#EFF6FF` | `#1D4ED8` | New, Draft, Info |
| Neutral | `#F1F5F9` | `#334155` | Unknown, Default |

**Palette philosophy:** Orange and Green are the only action colours. Orange owns conversion (CTAs, highlights). Green owns WhatsApp (exclusively). Navy holds structure. Semantic colours are confined to admin status surfaces — they never appear in public marketing.

---

## 3. Typography Rules

### Font Families

| Role | Family | CSS Variable | Fallback |
|------|--------|-------------|---------|
| **Display / Headings** | Manrope | `var(--font-manrope)` | `ui-sans-serif, system-ui, sans-serif` |
| **Body / UI** | Inter | `var(--font-inter)` | `ui-sans-serif, system-ui, sans-serif` |
| **Data / Mono** | JetBrains Mono | `var(--font-mono)` | `ui-monospace, SFMono-Regular, Menlo` |

### Type Scale

| Role | Family | Size | Weight | Line Height | Letter Spacing | Context |
|------|--------|------|--------|-------------|----------------|---------|
| Display Hero | Manrope | 48–64px | 800 | 1.15 | -0.02em | Marketing hero headlines |
| Display Section | Manrope | 32–40px | 700 | 1.2 | -0.02em | Section headings, page titles |
| Display Card | Manrope | 24–28px | 700 | 1.25 | -0.01em | Product card headings, modal titles |
| Display Sub | Manrope | 20–22px | 600 | 1.3 | 0 | Feature headings, step titles |
| Body Large | Inter | 17–18px | 400 | 1.65 | 0 | Intro paragraphs, lead copy |
| Body | Inter | 15–16px | 400 | 1.6 | 0 | Standard body, feature descriptions |
| Body Medium | Inter | 15–16px | 500 | 1.6 | 0 | Emphasized body, form labels |
| Table / Data | Inter | 13–14px | 400–500 | 1.5 | 0 | Admin table rows, data cells |
| Label / Badge | Inter | 11–12px | 500–600 | 1 | 0.06em | Status badges, tier labels, caps labels |
| Mono Data | JetBrains Mono | 13–14px | 400 | 1.5 | 0 | Account numbers, contract IDs, IP addresses, API keys |
| Price Display | Manrope | 36–48px | 800 | 1 | -0.02em | Pricing figures on product cards |
| Price Inline | Manrope | 22–28px | 700 | 1 | 0 | Inline prices, billing amounts |

### Principles

- **Manrope 700–800 for structure**: All headings use ExtraBold or Bold. Never use Manrope at regular weight.
- **Price figures break the hierarchy**: Pricing numbers are always the largest typographic element on a product card — oversized Manrope 800 in Conversion Orange or Anchor Navy.
- **Inter for density**: Admin table rows use Inter at 13–14px — compact and readable without crowding.
- **JetBrains Mono for identifiers**: Any system-generated identifier (CT-2025-001, CTPL-2025-001, IP addresses, API keys) is always monospace for scannability.
- **Three sizes per section rule**: Never more than 3 type sizes in a single screen section. Heading → Subheading → Body. Price is the only permitted exception.
- **Mobile scale**: All display sizes reduce by 0.85× on mobile (e.g., 48px hero → 40px on mobile).

---

## 4. Component Stylings

### Buttons

**Primary CTA (Orange Pill)**
- Background: `#E87A1E`
- Text: `#FFFFFF`, Inter Medium (500), 15–16px
- Padding: `12px 28px` desktop, `14px 28px` mobile
- Border radius: `9999px` (full pill)
- Border: none
- Hover: `#C45A30` (8% darker)
- Shadow: none — buttons are flat
- Minimum height: 48px desktop, 52px mobile
- Icon: left-aligned, 4px gap, same color as text

**WhatsApp CTA (Green Pill)**
- Background: `#16A34A`
- Text: `#FFFFFF`, same sizing as Primary
- Border radius: `9999px`
- Always includes WhatsApp icon (left of label)
- Hover: `#15803D`
- Used only as the secondary option alongside or beneath a Primary CTA

**Ghost / Outline (Orange Border)**
- Background: transparent
- Border: `1.5px solid #E87A1E`
- Text: `#E87A1E`, Inter Medium
- Hover: `background: #FDF2E9`
- Used for secondary actions, "Learn more" patterns

**Destructive**
- Background: `#B91C1C`
- Text: `#FFFFFF`
- Same pill shape, 9999px radius
- Admin-only — never appears in public marketing

**Admin Ghost**
- Background: `#FFFFFF`
- Border: `1px solid #E5E7EB`
- Text: `#374151`, Inter Medium
- Hover: `background: #F9FAFB`
- Used in admin table row actions, secondary admin panel actions

### Navigation Bar

**Public Marketing Nav**
- Sticky, 64px tall
- Frosted glass: `background: rgba(255,255,255,0.80)`, `backdrop-filter: blur(12px)`
- Bottom border: `1px solid #E5E7EB`
- Logo: left-aligned, SVG mark
- Nav links: Inter Medium, 15px, `#111827`, hover switches to `#E87A1E`
- Active state: `#E87A1E` text, no underline
- Right: Primary orange pill CTA ("Check Coverage" or "Get Started")
- Mobile: collapses to hamburger → full-screen drawer, maintaining blur effect

**Admin / Dashboard Sidebar**
- Fixed sidebar, 240px wide
- Background: `#1F2937` (dark slate)
- Logo: white version
- Nav items: Inter Medium, 14px, `rgba(255,255,255,0.70)`, active = `#FFFFFF` with `#E87A1E` left-border accent (3px)
- Section groupings with uppercase Inter 11px label in `rgba(255,255,255,0.40)`

### Cards

**Product / Pricing Card**
- Background: `#FFFFFF`
- Border radius: `1rem` (16px)
- Border: `1px solid #E5E7EB`
- Shadow: `0 2px 12px rgba(0,0,0,0.08)` — whisper-soft, diffused
- Internal padding: `24px`
- Featured / recommended tier: adds `3px solid #E87A1E` top border + elevated shadow `0 4px 24px rgba(232,122,30,0.15)`

**Stat Card (Admin / Dashboard)**
- Background: `#FFFFFF`
- Border radius: `0.75rem` (12px)
- Border: `1px solid #E5E7EB`
- Shadow: `0 1px 2px rgba(0,0,0,0.05)` — minimal, functional
- Padding: `24px`
- Active / selected state: `ring-2 ring-circleTel-orange/20` + `border-circleTel-orange`
- Icon container: 40×40px rounded-lg, colored background (blue-100, green-100, etc.)
- Value: Inter Bold (700) at 28–32px, `#111827`
- Label: Inter SemiBold (600) at 12px, `#6B7280`, uppercase tracking

**Section Card (Admin Panels)**
- Background: `#FFFFFF`
- Border radius: `0.75rem` (12px)
- Border: `1px solid #E5E7EB`
- Shadow: `0 1px 2px rgba(0,0,0,0.05)`
- Header: Manrope SemiBold 16px with optional icon (left) and action button (right)
- Body padding: `24px`

**Info Card (Marketing Feature Block)**
- Background: `#F8F9FA` or `#FFFFFF` depending on section
- Border radius: `1rem`
- No border, no shadow — relies on background color alternation for separation
- Icon: 48–56px circle, `#F8F9FA` fill, Conversion Orange icon

### Status Badge

- Border radius: `9999px` (pill)
- Padding: `2px 10px`
- Font: Inter Medium (500), 12px, 1.0 line-height
- Dot indicator: 6×6px circle, `bg-current`, left of label
- Variants: success / warning / error / info / neutral (see Section 2 for colors)
- Prop: `status=` (the label text) — NOT `label=`, `text=`, or `children=`

### Form Inputs

- Border: `1px solid #D1D5DB`
- Border radius: `0.75rem` (12px)
- Fill: `#FFFFFF`
- Text: Inter Regular (400), 15px, `#111827`
- Placeholder: Inter Regular (400), 15px, `#9CA3AF`
- Focus: border → `#E87A1E` + `box-shadow: 0 0 0 3px rgba(232,122,30,0.15)`
- Height: 44px desktop, 52px mobile (thumb-friendly)
- Max 3 fields per form in marketing / order flow contexts
- Error state: border → `#B91C1C` + `box-shadow: 0 0 0 3px rgba(185,28,28,0.15)`
- Labels: Inter Medium (500), 14px, `#374151`, above the input

### Comparison Table

- Container: same card styling (white, 16px radius, soft shadow)
- Header row: Manrope SemiBold 14px, `#6B7280`, uppercase, no bottom border
- Alternating rows: even rows `#F9FAFB`, odd rows `#FFFFFF`
- CircleTel column: `3px solid #E87A1E` top border treatment
- Check marks: `#047857` (emerald), × marks: `#B91C1C` (red)
- Row divider: `1px solid #F3F4F6` (very faint)

### Data Tables (Admin)

- Background: `#FFFFFF`
- Header: Inter SemiBold (600), 12px, `#6B7280`, uppercase, `0.05em` tracking, `#F9FAFB` header row fill
- Row: Inter Regular (400), 14px, `#111827`, 52px row height
- Row hover: `#F9FAFB` background
- Row selected: `#FFF7ED` background (light orange tint)
- Borders: `1px solid #F3F4F6` between rows only — no vertical column borders
- Pagination: Inter Medium (500), 14px, pill-shaped page buttons, active = orange fill

### Toast / Notification

- Border radius: `0.75rem` (12px)
- Shadow: `0 4px 12px rgba(0,0,0,0.15)` — elevated to float above content
- Background: `#FFFFFF`
- Left accent border: 4px wide, colored by state (success=`#047857`, warning=`#B45309`, error=`#B91C1C`, info=`#1D4ED8`)
- Title: Inter SemiBold (600), 14px
- Message: Inter Regular (400), 13px, `#4B5563`
- Icon: left of title, 20px, matching accent color
- Duration: 4s auto-dismiss for info/success, persistent for error

### Modal / Dialog

- Overlay: `rgba(0,0,0,0.50)` backdrop
- Container: `#FFFFFF`, border-radius `1rem` (16px), max-width 560px (standard), 800px (wide)
- Shadow: `0 20px 60px rgba(0,0,0,0.20)`
- Header: Manrope Bold (700) 20px title + close icon (top-right)
- Body: 24px padding all sides
- Footer: right-aligned button group (Ghost cancel + Primary orange confirm)
- Mobile: bottom sheet pattern — slides up from bottom, full width, 24px radius top corners

### Progress / Stepper (Order Flow)

- Container: white pill row, 64px tall, sticky below nav
- Step indicator: numbered circles, 28px, active = `#E87A1E` fill + white text, completed = `#047857` fill + checkmark, inactive = `#E5E7EB` fill + `#9CA3AF` text
- Step label: Inter Medium (500), 13px, active = `#E87A1E`, completed = `#047857`, inactive = `#9CA3AF`
- Connector line: 2px, completed = `#047857`, inactive = `#E5E7EB`

---

## 5. Layout Principles

### Max Widths

| Context | Max Width | Notes |
|---------|-----------|-------|
| Marketing pages | 1200px | Centered, 24px side padding |
| Admin content | 1400px | Full-width sidebar layout |
| Order flow | 960px | Constrained for focus |
| Modals (standard) | 560px | — |
| Modals (wide) | 800px | For complex forms |

### Section Rhythm (Marketing)

Sections alternate: **Cloud White** (`#FFFFFF`) → **Warmth Wash** (`#F8F9FA`) → **Anchor Navy** (`#1B2A4A`).

Rules:
- Never two Anchor Navy sections adjacent
- Dark (navy) sections used for: hero, mid-page emphasis moments, footer
- Section padding: `80px` top/bottom desktop, `48px` mobile
- Never use horizontal rules — section separation via background color only

### Spacing Scale

| Step | Value | Use |
|------|-------|-----|
| xs | 4px | Icon gap, badge padding |
| sm | 8px | Input internal, icon margin |
| md | 16px | Card internal, form field gap |
| lg | 24px | Card grid gap, section padding (mobile inner) |
| xl | 32px | Feature icon row gap, subsection spacing |
| 2xl | 48px | Mobile section padding |
| 3xl | 64px | Nav height, large inner gaps |
| 4xl | 80px | Desktop section padding |

### Grid Structure

| Breakpoint | Product Cards | Stat Cards | Admin Table |
|-----------|--------------|------------|-------------|
| Mobile (<768px) | 1 column, full-width | 2 columns | Single column stacked |
| Tablet (768–1279px) | 2 columns | 2–3 columns | Full table, horizontal scroll |
| Desktop (1280px+) | 3–4 columns | 4 columns | Full table, no scroll |

### CRO Layout Rules (Marketing)

1. **Single primary CTA per screen section** — never two orange buttons side by side
2. **Price anchor above the fold** on all product pages — no "click to see pricing"
3. **WhatsApp CTA always secondary** — beneath or beside the primary CTA, never the only option
4. **Objection handling copy inline** — beneath CTAs, never in footnotes or tooltips
5. **Social proof placement** — immediately above or below primary CTA
6. **Coverage check is the universal first step** — every page has a path to coverage check

---

## 6. Depth & Elevation

| Level | Name | Shadow Value | Use |
|-------|------|-------------|-----|
| 0 | Flat | none | Section dividers via background color, admin table headers, nav items |
| 1 | Card | `0 2px 12px rgba(0,0,0,0.08)` | Standard product cards, info cards, section cards |
| 1+ | Card Featured | `0 4px 24px rgba(232,122,30,0.15)` | Recommended pricing tier — orange-tinted glow |
| 2 | Panel | `0 4px 8px rgba(0,0,0,0.10)` | Stat cards, admin panels, form containers |
| 3 | Float | `0 4px 12px rgba(0,0,0,0.15)` | Toast notifications, dropdowns, popovers |
| 4 | Modal | `0 20px 60px rgba(0,0,0,0.20)` | Modals, dialogs, full-screen overlays |
| 5 | Nav Glass | `rgba(255,255,255,0.80)` + `backdrop-filter: blur(12px)` | Sticky marketing nav bar on scroll |

**Elevation philosophy:** Depth is used sparingly. Marketing pages are mostly flat — cards use Level 1 maximum. Admin UI uses Level 2 for information hierarchy. Toast and modal are the only heavy-shadow surfaces. The frosted glass nav is the one exception to the flat/minimal rule, used to signal persistence.

**Orange glow rule:** The only colored shadow permitted is the orange glow on featured pricing cards (`rgba(232,122,30,0.15)`). All other shadows are neutral gray. This keeps the orange accent rare and high-signal.

---

## 7. Do's and Don'ts

### Do

- **Do** use Manrope 700–800 for all headings — the weight is part of the brand identity
- **Do** keep exactly one orange pill CTA per screen section (the conversion anchor)
- **Do** include a WhatsApp secondary CTA near every primary CTA on marketing pages
- **Do** display pricing prominently and numerically — never hide it behind a click
- **Do** use JetBrains Mono for system identifiers (contract IDs, account numbers, IPs)
- **Do** alternate section backgrounds (white ↔ #F8F9FA) to create rhythm without borders
- **Do** use the orange focus ring on inputs (`0 0 0 3px rgba(232,122,30,0.15)`)
- **Do** use `status=` prop on StatusBadge (not `label=`, `text=`, or `children=`)
- **Do** render icons as JSX elements in StatCard: `icon={<PiSomeBold />}` (not `icon={PiSomeBold}`)
- **Do** use address copy like "your team", "your office", "your fleet" — direct and local
- **Do** include the coverage check CTA on every marketing page
- **Do** use pill-shaped (9999px radius) buttons for all CTAs — never rectangular

### Don't

- **Don't** use WhatsApp Green (`#16A34A`) for anything except WhatsApp buttons
- **Don't** place two orange pill buttons side by side — it cancels both
- **Don't** use dark mode — CircleTel is a light-only brand
- **Don't** put pricing in a footnote or hide it behind "contact us for pricing"
- **Don't** use drop shadows heavier than Level 2 in admin tables or list rows
- **Don't** use semantic status colors (emerald/amber/red) on marketing surfaces
- **Don't** use Manrope at light (300) or regular (400) weight — always 600 minimum
- **Don't** add horizontal rule dividers — use background alternation instead
- **Don't** stack two adjacent Anchor Navy (`#1B2A4A`) sections
- **Don't** use the term "24/7 support" — support hours are Mon–Fri 8am–5pm SAST
- **Don't** display a phone number — WhatsApp (082 487 3900) and email are the only inbound channels
- **Don't** guess column/prop names — StatusBadge uses `status=`, not `label=`
- **Don't** use `optimizePackageImports` on any package that is in `serverExternalPackages`

---

## 8. Responsive Behavior

### Breakpoints

| Name | Min Width | Tailwind | Key Changes |
|------|-----------|---------|-------------|
| Mobile | 0px | (base) | Single column, full-width cards, stacked nav, hamburger menu |
| SM | 640px | `sm:` | 2-column grids begin, form columns expand |
| MD | 768px | `md:` | 2-column product cards, tablet nav, sticky nav active |
| LG | 1024px | `lg:` | Sidebar unlocks in admin, 3-column product grids, full tables |
| XL | 1280px | `xl:` | 4-column product grids, full desktop typography scale |
| 2XL | 1400px | `2xl:` | Max content width container (`1400px`) — beyond this, content centers |

### Mobile-Specific Rules

- **Touch targets**: Minimum 48×48px — applies to all buttons, nav items, table row actions
- **Full-width buttons**: Pill buttons expand to full container width on mobile (no shrinkage)
- **Pricing cards**: Stack vertically, recommended tier floated to top of stack
- **Forms**: Max 3 visible fields at once, input height 52px for thumb-friendly tapping
- **Nav**: Hamburger → full-screen overlay drawer with `backdrop-filter: blur(12px)`; drawer slides from right
- **Admin tables**: Horizontal scroll container — columns freeze at left (name/status) on scroll
- **Modals**: Bottom sheet pattern on mobile — slides up from bottom, full width, 24px top radius, 100% viewport height cap
- **Typography**: All display sizes reduce by 0.85× from desktop to mobile

### Safe Area Handling

For PWA / mobile homescreen:
- `padding-bottom: env(safe-area-inset-bottom, 0px)` on bottom nav
- `.has-bottom-nav` class adds `64px + safe-area` bottom padding to page content
- `pt-safe` on full-screen overlays and modals

### Sticky CTA Exclusions (StickyMobileCTA)

The floating "Check Coverage" mobile CTA is hidden on:
`/coverage`, `/order`, `/checkout`, `/auth`, `/admin`, `/partners`, `/dashboard`

---

## 9. Agent Prompt Guide

### Quick Color Reference

```
Orange (CTA):    #E87A1E   -- all primary buttons, pricing highlights
Orange Dark:     #C45A30   -- hover state
Orange Tint:     #FDF2E9   -- light badge backgrounds, tab hover
Navy:            #1B2A4A   -- hero, dark sections, sidebar
Navy Deep:       #0F1427   -- gradient terminus, deep dark
WhatsApp:        #16A34A   -- WhatsApp buttons ONLY
Text:            #111827   -- all body copy
Text Muted:      #6B7280   -- secondary/caption
Border:          #E5E7EB   -- cards, inputs
Surface:         #F9FAFB   -- page bg (admin/dashboard)
Surface Warm:    #F8F9FA   -- alternating section (marketing)
```

### Copy This Block Into Every Stitch Prompt

```
Using the CircleTel design system:
- Fonts: Manrope ExtraBold (800) for headlines (-0.02em tracking), Inter for body (400–500)
- Orange #E87A1E: all primary CTAs (pill shape, 9999px radius, flat/no shadow)
- Navy #1B2A4A: hero + footer backgrounds, reversed white typography
- WhatsApp #16A34A: WhatsApp buttons only, always with WA icon
- Cards: white #FFFFFF, 16px radius, shadow 0 2px 12px rgba(0,0,0,0.08)
- Featured card: add 3px #E87A1E top border + orange-tinted shadow
- Sections alternate: white ↔ #F8F9FA, dark moments = #1B2A4A
- Layout: max 1200px, 80px section padding desktop / 48px mobile
- CRO: 1 orange CTA per section, pricing above fold, WhatsApp as secondary
- No dark mode. No phone number. No horizontal rules.
```

### Context-Specific Prompt Starters

**Marketing product page:**
```
Design a CircleTel [product name] product page. Vibrant-Functional mood.
Manrope 800 hero headline in white on Anchor Navy (#1B2A4A) hero section.
Orange CTA pill (#E87A1E) above fold. WhatsApp secondary (#16A34A).
Pricing in orange Manrope 800. Sections alternate white/#F8F9FA.
Max 1200px, 80px section padding.
```

**Admin dashboard / data table:**
```
Design a CircleTel admin [page name] screen. Dense, operational, calm.
Left sidebar #1F2937 with white nav. Content area #F9FAFB background.
White stat cards with Inter Bold values. Slate-200 bordered data table.
Status badges: emerald (active), amber (pending), red (failed).
No orange CTAs except for upsell actions. Compact 14px table rows.
```

**Order flow step:**
```
Design CircleTel order flow step [N] of 3. Clean, focused, zero noise.
White background. Progress stepper at top: completed=emerald, active=orange, future=gray.
Max 960px content width. Single primary action (orange pill CTA) per screen.
Pricing clearly visible without scrolling.
```

**Customer dashboard:**
```
Design CircleTel customer dashboard [section]. Calm, informative.
Navy sidebar (#1F2937). White main content. 4-column stat cards (white, Level 2 shadow).
Semantic status colours for service/billing states. Orange only for upsell CTAs.
Manrope 700 for section headings, Inter 14px for data.
```

### Component-Specific Prompts

**Orange pill button:**
```
Background #E87A1E, text white, Inter Medium 15px, padding 12px 28px, border-radius 9999px,
no border, no shadow. Hover: #C45A30.
```

**WhatsApp button:**
```
Background #16A34A, text white, Inter Medium 15px, padding 12px 28px, border-radius 9999px,
WhatsApp icon left-aligned 4px gap. Hover: #15803D.
```

**Featured pricing card:**
```
White background, 16px border-radius, 3px solid #E87A1E top border,
shadow 0 4px 24px rgba(232,122,30,0.15). Price in Manrope 800 48px #E87A1E.
"Recommended" pill badge in orange top-right.
```

**Admin stat card:**
```
White background, 12px border-radius, 1px solid #E5E7EB border,
shadow 0 1px 2px rgba(0,0,0,0.05). Icon 40×40 rounded-lg colored bg.
Value: Inter Bold 30px #111827. Label: Inter 600 12px #6B7280 uppercase.
```

**Status badge (success):**
```
Background #ECFDF5, text #047857, Inter Medium 12px, padding 2px 10px,
border-radius 9999px, 6px green dot left.
```

---

*CircleTel (Pty) Ltd — "Connecting Today, Creating Tomorrow"*  
*8a Mellis Rd, Rivonia, Sandton, Gauteng 2128, South Africa*  
*WhatsApp: 082 487 3900 | contactus@circletel.co.za | Mon–Fri 8am–5pm SAST*

---
version: alpha
name: CircleTel
description: B2B/B2C ISP platform for South Africa. One Provider. One Bill. Your Office Runs.
colors:
  primary: "#E87A1E"
  primary-dark: "#C45A30"
  primary-light: "#FDF2E9"
  primary-accessible: "#AE5B16"
  secondary: "#1B2A4A"
  secondary-dark: "#0F1427"
  neutral: "#F9FAFB"
  surface: "#FFFFFF"
  charcoal: "#2D3436"
  text-primary: "#111827"
  text-secondary: "#4B5563"
  text-muted: "#6B7280"
  border: "#E5E7EB"
  success: "#10B981"
  error: "#EF4444"
  whatsapp: "#25D366"
typography:
  h1:
    fontFamily: Manrope
    fontSize: 3.75rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  h2:
    fontFamily: Manrope
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.01em
  h3:
    fontFamily: Manrope
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.3
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.75
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.625
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 600
    lineHeight: 1.25
  mono:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: 400
rounded:
  sm: 6px
  md: 12px
  lg: 16px
  xl: 20px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  section: 96px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: 16px 40px
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    rounded: "{rounded.xl}"
    padding: 14px 32px
  button-secondary-hover:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 24px
  card-featured:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 32px
  badge:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.primary-accessible}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  nav:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
  footer:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: 12px 16px
---

## Overview

**Trusted connectivity for South African SMEs.** CircleTel's visual identity is built on authority and warmth — the deep navy of a reliable enterprise partner, activated by a bold South African orange that signals energy and action.

The UI is information-dense but calm. Pages earn attention through generous whitespace and clear typographic hierarchy, not visual noise. Every CTA earns its prominence because the surrounding layout has restrained itself.

Design philosophy: **Professional-but-approachable.** We serve business owners who need to trust us with their office connectivity, not early adopters shopping for UI polish. The interface should feel like a reliable local partner — knowledgeable, clear, and always available.

## Colors

The palette is anchored in two hero colors with a supporting neutral system.

- **Primary (`#E87A1E`)** — CircleTel Orange. The sole CTA driver. Every primary button, active link, icon highlight, and interactive accent. Never use for body text on white.
- **Primary Dark (`#C45A30`)** — Hover and pressed states for orange buttons. Never use as a standalone color.
- **Primary Light (`#FDF2E9`)** — Tab hover backgrounds, badge fills, soft section tints. The "orange whisper."
- **Primary Accessible (`#AE5B16`)** — The only orange approved for text on white backgrounds. Use for orange labels, links in body copy, and form hints.
- **Secondary (`#1B2A4A`)** — Deep Navy. Navigation, footers, hero backgrounds, feature card backgrounds. The authority color.
- **Secondary Dark (`#0F1427`)** — Midnight Navy. Deeper hero overlays and sidebar backgrounds only.
- **Neutral (`#F9FAFB`)** — Page background. Never use pure white for page backgrounds.
- **Surface (`#FFFFFF`)** — Cards, modals, input fields. White is reserved for elevated surfaces.
- **Charcoal (`#2D3436`)** — Footer background alternative, admin sidebar.
- **Text Primary (`#111827`)** — Near-black for h1–h3 and body text on white/neutral backgrounds.
- **Text Secondary (`#4B5563`)** — Supporting text, descriptions, meta information.
- **Text Muted (`#6B7280`)** — Placeholders, timestamps, fine print.
- **Border (`#E5E7EB`)** — All dividers, card outlines, input borders.
- **WhatsApp (`#25D366`)** — Reserved exclusively for the WhatsApp CTA button/icon. Never repurpose this green.

## Typography

Two fonts, used intentionally:

- **Manrope** — Display and headings. High x-height, geometric confidence. Use at bold weight (700) for all headings. Use at semibold (600) for subheadings and card titles.
- **Inter** — Body copy, labels, UI text, data tables. Optimized for readability at small sizes and for numeric legibility in pricing and stats.
- **JetBrains Mono** — Code snippets, plan SKUs, IP addresses, technical values only.

**Scale in use:**

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `h1` | 3.75rem (60px) | 700 | Hero headlines only |
| `h2` | 2.25rem (36px) | 700 | Section titles |
| `h3` | 1.5rem (24px) | 600 | Card titles, subsection headers |
| `body-lg` | 1.125rem (18px) | 400 | Hero subheadlines, lead copy |
| `body-md` | 1rem (16px) | 400 | Standard body text |
| `body-sm` | 0.875rem (14px) | 400 | Captions, fine print, table content |
| `label` | 0.875rem (14px) | 600 | Button labels, form labels, badge text |

Responsive scaling for `h1`: `text-3xl sm:text-4xl md:text-5xl lg:text-6xl`. Never below 1.875rem on mobile.

## Layout

- **Max content width**: 1400px (`container` class, centered with 2rem horizontal padding)
- **Section vertical rhythm**: `py-16 md:py-24` (64px → 96px). Hero sections get `py-20 md:py-32`.
- **Grid system**: 12-column CSS grid. Common splits: 1-col mobile → 2-col tablet → 3-col desktop for feature cards. Pricing uses 1 → 3 columns.
- **Card grid gap**: `gap-6 md:gap-8` (24px → 32px)
- **Hero layout**: Full-width navy/gradient background, centered content, max-width prose container inside.

## Elevation & Depth

Three shadow levels in practice:

| Level | Tailwind | Use |
|-------|----------|-----|
| Resting | `shadow` | Default cards, inputs |
| Raised | `shadow-lg` | CTA cards, feature highlights, modals |
| Floating | `shadow-2xl` | Hero conversion cards, dropdowns |

No colored shadows. No inset shadows except on active inputs. The navy background creates natural depth contrast against white card surfaces — rely on this before adding shadows.

## Shapes

- **Buttons**: `rounded-xl` (20px). Pill shape (`rounded-full`) for badges and status indicators only.
- **Cards**: `rounded-lg` (16px) standard, `rounded-2xl` (24px) for hero conversion cards.
- **Inputs**: `rounded-md` (12px).
- **Avatars / Icon containers**: `rounded-full`.
- **Decorative circles**: Used as background texture on hero sections (large, low-opacity, `border` only — never filled).

Avoid sharp corners (0px) entirely. Avoid very large radius mismatches between adjacent elements.

## Components

### Primary Button
Orange fill, white text, `rounded-xl`, `px-10 py-4`, Manrope 600. On hover: `primary-dark` background, `shadow-xl`. Use for the single most important action on a page.

### Secondary Button
Navy border (`border-2`), navy text, transparent fill, same radius. On hover: navy fill, white text. Use as the paired alternative to a primary button.

### Cards
White background, `rounded-lg`, `shadow`, `p-6`. Featured/highlighted variants use navy background with white text. Never mix card styles in the same grid row.

### Navigation
Navy background. Logo left. Nav links center or right, white text, `hover:text-orange`. Active state: orange underline or orange text. Mobile: hamburger → full-screen overlay or slide-in drawer.

### Badges / Pills
`primary-light` background, `primary-accessible` text, `rounded-full`, `px-3 py-1`, `text-sm font-semibold`. Status badges use semantic colors (green for active, red for error, gray for inactive).

### Pricing Cards
3-column grid on desktop. Middle/featured card: navy background, white text, slightly taller, `shadow-2xl`. Include price in large Manrope bold, period in `body-sm` muted.

### WhatsApp CTA
Always use `#25D366` green. Float button on mobile: fixed bottom-right, `rounded-full`, `shadow-lg`. Inline variant: ghost button with WhatsApp icon.

## Do's and Don'ts

**Do:**
- Use Primary Orange exclusively for the highest-priority interactive element on a page
- Pair orange CTAs with navy backgrounds for maximum contrast and brand recognition
- Use Manrope for all headings — never Inter for display text
- Keep whitespace generous; sections should breathe at `py-16` minimum
- Use `primary-accessible` (`#AE5B16`) when orange text must appear on white backgrounds
- Include a WhatsApp contact path on every customer-facing page
- Use `rounded-full` for icon containers (w-16 h-16) in feature sections

**Don't:**
- Don't use primary orange (`#E87A1E`) as body text on white — fails WCAG AA
- Don't use more than one primary orange CTA per section
- Don't use pure white (`#FFFFFF`) as a page background — use `neutral` (`#F9FAFB`)
- Don't add colored box shadows — they conflict with the flat authority aesthetic
- Don't repurpose the WhatsApp green (`#25D366`) for any other UI element
- Don't use JetBrains Mono for anything other than code/technical values
- Don't use decorative gradients on body sections — reserve for hero backgrounds only
- Don't mix card border radiuses within the same grid

## Agent Prompt Guide

Quick color reference for prompts:
- "Use CircleTel orange" → `#E87A1E`
- "Use CircleTel navy" → `#1B2A4A`
- "Page background" → `#F9FAFB`
- "Card background" → `#FFFFFF`
- "Orange text on white" → `#AE5B16`

**Ready-to-use prompts:**
- "Build a pricing section using CircleTel's DESIGN.md — 3 columns, middle card featured in navy"
- "Create a hero section with navy background, orange primary CTA, and secondary outlined CTA"
- "Build a feature card grid (3-up) with orange icon containers and navy headings"
- "Generate an admin stat card using the CircleTel design system — white card, navy label, large Inter number"

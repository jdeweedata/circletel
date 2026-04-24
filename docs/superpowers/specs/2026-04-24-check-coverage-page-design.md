# /check-coverage Standalone Landing Page — Design Spec

**Date**: 2026-04-24  
**Status**: Approved  
**Route**: `/check-coverage`  
**Approach**: Option A — thin wrapper around existing components

---

## Overview

A standalone ad-landing page for the CircleTel SkyFibre coverage checker. Primary traffic source is paid ads (Google/Meta). Single job: capture the user's address and redirect them into the purchase funnel. Minimal Sanity dependency — content is stable enough to hardcode.

---

## Files Changed

| Action | File | Notes |
|--------|------|-------|
| CREATE | `app/(marketing)/check-coverage/page.tsx` | Server component — exports `metadata`, wraps content in `<Suspense>` |
| CREATE | `app/(marketing)/check-coverage/CheckCoverageContent.tsx` | `'use client'` — all interactive logic |
| MODIFY | `app/api/coverage/check/route.ts` | Read `utm_source`, `utm_medium`, `utm_campaign` from request body and include in `coverage_leads` insert |

**Blast radius**: 2 new files + 3-line addition to existing API route. No existing pages or components touched.

---

## Architecture

`page.tsx` is a Next.js 15 server component. It exports `metadata` (required server-side) and renders:

```tsx
<Suspense fallback={<LoadingSkeleton />}>
  <CheckCoverageContent />
</Suspense>
```

`Suspense` is required because `CheckCoverageContent` calls `useSearchParams()`, which suspends in the App Router.

`CheckCoverageContent` is a `'use client'` component that owns all state and interactions.

---

## Data Flow

```
User lands: /check-coverage?utm_source=google&utm_medium=cpc&utm_campaign=skyfibre-q2

1. useSearchParams() → capture utm_source, utm_medium, utm_campaign → store in useRef (no re-render)
2. AddressAutocomplete renders → user selects address via Google Places
3. onLocationSelect callback → stores address string + { lat, lng } in state
4. User clicks "Check Coverage" → setLoading(true)
5. POST /api/coverage/check  { address, coordinates, utm_source, utm_medium, utm_campaign }
   └── API: creates coverage_lead row with UTM fields, runs coverage check
   └── Returns: { available: boolean, leadId: string }
6a. available: true  → router.push(`/packages/${leadId}`)
6b. available: false → setNoCoverage(true) → render NoCoverageLeadCapture inline
6c. error/timeout    → toast.error(...) → setLoading(false), button re-enables
```

---

## API Route Change: `/api/coverage/check`

Current route accepts `{ address, coordinates }`. Add UTM passthrough:

```typescript
// Read from request body
const { address, coordinates, utm_source, utm_medium, utm_campaign } = await request.json();

// Add to coverage_leads insert
const leadData: any = {
  address,
  customer_type: 'consumer',
  lead_source: 'coverage_checker',
  ...(utm_source && { utm_source }),
  ...(utm_medium && { utm_medium }),
  ...(utm_campaign && { utm_campaign }),
};
```

The `coverage_leads` table already has `utm_source`, `utm_medium`, `utm_campaign` columns (migration `20251004000001_add_phase1_tracking_to_coverage_leads.sql`).

---

## Page Sections

### 1. Hero (navy `#13274A`, `py-20`)

- Small badge: "SKYFIBRE COVERAGE" (orange pill, uppercase)
- `<h1>`: "Check If SkyFibre Covers Your Address" — Poppins, white, large
- Subhead: "Enter your address below. We'll show you available packages in 30 seconds." — Montserrat, white/70
- `AddressAutocomplete` component — full-width, white background
- "Check Coverage" button — orange `#F5841E`, white text, full-width on mobile
- Loading state: spinner + "Checking coverage..." on button while API call runs
- No-coverage state: `NoCoverageLeadCapture` component renders here (replaces form area), navy bg maintained

### 2. Trust Badges (white bg, `py-12`)

3-column grid (stacks to 1 col on mobile):

| Icon | Headline | Sub |
|------|----------|-----|
| `PiHouseLineBold` | "6 Million+ Homes Covered" | "Across South Africa" |
| `PiCalendarCheckBold` | "Installed in 3–5 Days" | "Fast professional setup" |
| `PiHandshakeBold` | "No Contract Required" | "Cancel anytime" |

### 3. What Happens Next (slate-50 bg, `py-16`)

Numbered steps, connected by horizontal line on desktop, stacked on mobile:

| Step | Title | Body |
|------|-------|------|
| 01 | "Coverage Check" | "We check your address against MTN's Tarana G1 coverage map" |
| 02 | "See Your Options" | "You'll see available speed tiers and pricing within 30 seconds" |
| 03 | "Book Installation" | "Choose your plan and we'll schedule installation within 5 business days" |

### 4. Fallback CTA (white bg, `py-12`)

- Headline: "Can't find your address?"
- Body: "WhatsApp us and we'll check manually."
- Button: WhatsApp link via `getWhatsAppLink('Hi CircleTel, please check coverage at my address: ')` from `lib/constants/contact.ts`

### 5. Footer CTA (navy bg, `py-16`)

- Headline: "Not sure which plan is right?"
- Sub: "Talk to our team."
- Button 1: "View Packages" → `/products` (white outlined)
- Button 2: "WhatsApp Sales" → `CONTACT.WHATSAPP_LINK` (orange solid)

---

## SEO Metadata

```typescript
export const metadata: Metadata = {
  title: 'Check SkyFibre Coverage | CircleTel Business Internet',
  description: 'Check if SkyFibre Business wireless broadband is available at your address. 100 Mbps uncapped from R1,299/mo. Free installation. No contract.',
  keywords: 'coverage check, SkyFibre, business internet, CircleTel, check availability',
  alternates: {
    canonical: 'https://circletel.co.za/check-coverage',
  },
  openGraph: {
    title: 'Check SkyFibre Coverage at Your Address',
    description: 'Check if SkyFibre Business wireless broadband is available at your address. 100 Mbps uncapped from R1,299/mo.',
  },
};
```

---

## Mobile Responsiveness

- Hero form: full-width input + button stacked vertically on mobile
- Trust badges: `grid-cols-1 md:grid-cols-3`
- Steps: `flex-col md:flex-row`, connector line hidden on mobile
- All text scales down one step on mobile (`text-3xl md:text-5xl` for H1)
- Minimum tap target 44px on all buttons

---

## Brand Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `circleTel-navy` | `#13274A` | Hero bg, Footer CTA bg |
| `circleTel-orange` | `#F5841E` | Submit button, badge, step numbers |
| `text-white/70` | — | Hero subheadline |
| Poppins | — | H1, section headings |
| Montserrat / system | — | Body, subheadlines |

---

## UTM Handling Summary

- Captured client-side via `useSearchParams()` on mount
- Stored in `useRef` to avoid re-renders
- Passed as optional fields in the `POST /api/coverage/check` body
- Persisted in `coverage_leads` table for campaign attribution
- Not exposed to the user; purely backend tracking

---

## Out of Scope

- Sanity CMS content management for this page (content is stable)
- A/B testing infrastructure
- Analytics event tracking beyond UTM persistence
- Any changes to the `/packages/[leadId]` page

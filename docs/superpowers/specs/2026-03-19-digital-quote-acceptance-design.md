# Design: Digital Quote Acceptance Flow

**Date**: 2026-03-19
**Status**: Reviewed (v2)
**Scope**: Build functional quote acceptance form with signature canvas, replacing static mockup on preview and share pages

---

## Problem

The quote preview page has a non-functional "ACCEPT QUOTE & PROCEED TO ORDER" button with disabled checkboxes and a static "Sign Here" div. The sign API (`POST /api/quotes/business/[id]/sign`) is fully built but has no frontend calling it. Customers cannot digitally accept quotes.

## Solution

Build a reusable `QuoteAcceptanceForm` component with:
- Signer details form (name, email, SA ID number, position)
- 6 acceptance checkboxes (terms, address, installation, authority, FICA, CIPC)
- Signature canvas (draw or type mode) using `react-signature-canvas`
- Submit to existing sign API
- Mount on both public share page and admin preview page

---

## Component: `QuoteAcceptanceForm`

### Props

```typescript
interface QuoteAcceptanceFormProps {
  quoteId: string;
  quote: BusinessQuote;          // For status checks, company name, contact info
  onAccepted?: () => void;       // Callback after successful acceptance
}
```

### States

| State | What renders |
|---|---|
| **Signable** (status `sent`/`viewed`, not expired) | Full acceptance form |
| **Already accepted** | Confirmation message with signature date |
| **Expired** | Expiry message with "Contact sales" CTA |
| **Draft/Pending** | "Quote is being prepared" message |
| **Submitting** | Form disabled, spinner on submit button |
| **Success** | Confirmation with "What happens next" info |
| **Error** | Error message with retry button |

### Form Layout

```
┌─ CUSTOMER ACCEPTANCE ─────────────────────────────┐
│                                                     │
│  SIGNER DETAILS                                     │
│  ┌─────────────────┐ ┌─────────────────┐           │
│  │ Full Name *     │ │ Email Address * │           │
│  └─────────────────┘ └─────────────────┘           │
│  ┌─────────────────┐ ┌─────────────────┐           │
│  │ SA ID Number *  │ │ Title/Position  │           │
│  └─────────────────┘ └─────────────────┘           │
│                                                     │
│  ACCEPTANCE DECLARATION                             │
│  ☐ I accept the terms and conditions               │
│  ☐ I confirm the service address is correct        │
│  ☐ I authorize CircleTel to proceed                │
│  ☐ I have authority to sign for the company        │
│  ☐ I confirm FICA documentation requirements      │
│  ☐ I confirm CIPC registration documentation       │
│                                                     │
│  SIGNATURE                                          │
│  [Draw] [Type]                                      │
│  ┌─────────────────────────────────────┐           │
│  │                                     │           │
│  │        (canvas / typed name)        │           │
│  │                                     │           │
│  └─────────────────────────────────────┘           │
│  [Clear]                                            │
│                                                     │
│  Additional Notes (optional)                        │
│  ┌─────────────────────────────────────┐           │
│  │                                     │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│       [ ACCEPT QUOTE & SIGN DIGITALLY ]             │
│                                                     │
│  By signing, you agree to the terms above.          │
│  Your IP address and timestamp will be recorded.    │
└─────────────────────────────────────────────────────┘
```

### Validation

**Backend fields** (sent to sign API — matches `SignQuoteRequest` type):

| Field | Rule | Error message |
|---|---|---|
| `signer_name` | Required, min 2 chars | "Full name is required" |
| `signer_email` | Required, valid email | "Valid email address is required" |
| `signer_id_number` | Required, valid 13-digit SA ID | "Valid South African ID number is required" |
| `signer_title` | Optional | - |
| `signature_type` | `'drawn'` or `'typed'` (from active tab) | Auto-set from selected mode |
| `signature_data` | Non-empty base64 string | "Signature is required" |
| `terms_accepted` | Must be true | "You must accept the terms and conditions" |
| `fica_documents_confirmed` | Must be true | "You must confirm FICA requirements" |
| `cipc_documents_confirmed` | Must be true | "You must confirm CIPC requirements" |
| `additional_notes` | Optional | - |

**UI-only checkboxes** (not sent to API — enforced client-side before enabling submit):

| Checkbox | Purpose |
|---|---|
| "I confirm the service address and technical requirements are correct" | Customer confirms address before signing |
| "I authorize CircleTel to proceed with installation" | Installation consent |
| "I have authority to sign on behalf of the company" | Signing authority declaration |

These 3 are UI gates — all must be checked before the submit button enables. They are not stored as separate database fields because they are implicit in the act of signing (the signature itself constitutes the authority declaration). The `terms_accepted` backend field covers the legal acceptance.

**SA ID validation** uses existing `isValidSAIDNumber()` from `lib/quotes/quote-validator.ts`.

**Signature data size limit**: Max 500KB for base64 signature data. Validated client-side before submit.

Submit button is disabled until ALL validations pass (backend fields + UI checkboxes).

### Pre-fill Logic

When the form mounts, pre-fill from the quote's contact details:
- `signer_name` ← `quote.contact_name`
- `signer_email` ← `quote.contact_email`

This saves the customer time while still allowing them to change it (e.g., a different person signs).

---

## Component: `SignatureCanvas`

### Props

```typescript
interface SignatureCanvasProps {
  onSignatureChange: (dataUrl: string | null) => void;  // base64 PNG or null if empty
  width?: number;
  height?: number;
}
```

### Modes

**Draw mode** (default):
- `react-signature-canvas` component
- Touch and mouse support
- Black ink on white background
- "Clear" button to reset
- Exports base64 PNG via `toDataURL()`
- Responsive — scales to container width

**Type mode**:
- Text input where customer types their full name
- Rendered in a cursive font (e.g., `Dancing Script` from Google Fonts or system cursive)
- Preview below the input shows the typed name styled as a signature
- On submit, the typed text is rendered to a hidden canvas and exported as base64 PNG (same format as drawn)

### Toggle

Tab-style toggle at the top: `[Draw] [Type]` — switching modes clears the current signature.

---

## Public Share Page Flow

**File**: `app/quotes/share/[token]/page.tsx`

### Current behaviour

The share page does NOT render the quote inline. It resolves the share token, tracks a `view` event via `POST /api/quotes/business/${quoteId}/track`, then **redirects** to `/quotes/business/${quoteId}/preview?shared=true`.

### Architecture decision: Keep the redirect

The share page stays as a redirect — the acceptance form lives on the **preview page**, which already renders the full quote. The `?shared=true` query parameter tells the preview page it's a customer-facing view.

### Changes needed

1. **Share page** (`app/quotes/share/[token]/page.tsx`) — Fix hardcoded contact details on error page to use `CONTACT` constants from `lib/constants/contact.ts`. No other changes needed.

2. **No new `mark-viewed` endpoint** — The existing `POST /api/quotes/business/${quoteId}/track` with `event_type: 'view'` already fires from the share page. If it doesn't update the quote status from `sent` → `viewed`, add that logic to the existing track endpoint rather than creating a duplicate.

---

## Preview Page Changes (Both Admin & Shared)

**File**: `app/quotes/business/[id]/preview/page.tsx`

Replace the static acceptance section (disabled checkboxes, "Sign Here" div, non-functional button) with the `QuoteAcceptanceForm` component. This renders for both admin access and shared customer access.

```tsx
<QuoteAcceptanceForm
  quoteId={quote.id}
  quote={quote}
  onAccepted={() => router.refresh()}
/>
```

After successful acceptance, the form shows a confirmation state with:
- "Quote accepted successfully" message
- "What happens next" steps (KYC verification, contract, installation scheduling)
- WhatsApp link to contact sales (using `CONTACT` constants)

### SSR guard for signature canvas

`react-signature-canvas` uses DOM `<canvas>` and must be loaded with `dynamic(() => import(...), { ssr: false })` to prevent SSR errors in Next.js.

---

## Dependencies

### New npm package

`react-signature-canvas` — lightweight (15KB gzip), 1.5M weekly downloads, touch-native.

```bash
npm install react-signature-canvas
npm install -D @types/react-signature-canvas
```

### Existing dependencies used

- `react-hook-form` + `zod` — form validation (already in project)
- `isValidSAIDNumber()` from `lib/quotes/quote-validator.ts` — SA ID validation
- `canSignQuote()` from `lib/quotes/quote-validator.ts` — status gate
- Sign API at `POST /api/quotes/business/[id]/sign` — already built, no changes needed

---

## Files Affected

| File | Change |
|------|--------|
| `components/quotes/QuoteAcceptanceForm.tsx` | **New** — Main acceptance form component |
| `components/quotes/SignatureCanvas.tsx` | **New** — Draw/type signature input (loaded with `dynamic`, SSR disabled) |
| `app/quotes/business/[id]/preview/page.tsx` | Replace static mockup with acceptance form |
| `app/quotes/share/[token]/page.tsx` | Fix hardcoded contact details to use CONTACT constants |
| `package.json` | Add `react-signature-canvas` + `@types/react-signature-canvas` |

---

## Out of Scope

- Post-acceptance workflow (admin notifications, KYC creation, contract generation) — spec #2/#3
- Zoho Sign integration — used for contract signing, not quote acceptance
- Payment method collection — separate onboarding step
- Multi-signer support — single signer per quote for now
- Signature verification/tamper detection — signatures stored as base64, verified by audit trail (IP, user-agent, timestamp)

---

## Security Considerations

- **No auth required on share page** — by design, share links are public (protected by UUID token)
- **IP + user-agent captured** — existing sign API already records these
- **SA ID number validated** — 13-digit Luhn check via existing validator
- **Rate limiting** — sign endpoint should be rate-limited (1 attempt per 10 seconds per IP) to prevent abuse. Add via middleware or Vercel Edge config.
- **HTTPS only** — signature data transmitted over TLS
- **Idempotent** — signing a quote that's already accepted returns error (existing `canSignQuote` check)

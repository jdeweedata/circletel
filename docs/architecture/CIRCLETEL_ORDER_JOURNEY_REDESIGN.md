# CircleTel Order Journey — Redesign

Redesigned consumer order flow borrowing Vox's linear, single-purpose-per-page pattern. Moves auth after cart commitment to reduce drop-off. Weaves Didit KYC into Step 6 ("Your Details") with smart skip logic — no extra step, no friction for returning or hardware-only customers.

## What Changes (and Why)

| Vox pattern borrowed | Current CircleTel problem | Redesign |
|---|---|---|
| **Dedicated enhancements page** | Add-ons buried in package sidebar | New `/order/enhancements` page after package selection |
| **Order summary as its own page** | Summary is a sidebar inside checkout | New `/order/summary` review page before auth |
| **Auth after cart commitment** | Auth gate before you can even see checkout | Auth happens after summary — customer is already committed |
| **One purpose per page** | `/order/checkout` does auth + address + profile + summary + T&Cs | Split into 4 focused pages |
| **Linear step progression** | 3-step progress bar with conditional branching | 7-step linear progress bar, always visible |
| **Identity collection** | Only basic profile (name, phone) | Add SA ID / passport for RICA pre-population |
| **Inline consumer KYC** | No consumer KYC — only B2B has verification | Didit `consumer_light_kyc` embedded in Step 6 with smart skip |

## What Stays the Same

- Homepage coverage check (already good)
- Google Places autocomplete + geocoding
- Package selection page with service type toggle
- Zustand `OrderContext` for state persistence
- NetCash Pay Now payment gateway
- Payment callback handling

## Flow Diagram

```mermaid
flowchart TD
    %% =============================================
    %% STEP 1: COVERAGE CHECK (unchanged)
    %% =============================================
    A[Homepage<br/>/] --> B[Enter address<br/>Google Places autocomplete]
    B --> B1[Geocode + create lead<br/>GET /api/geocode<br/>POST /api/coverage/lead]
    B1 --> C{Coverage?}
    C -- No --> D[No coverage dialog<br/>Lead capture form]
    D --> D1[Thank you — we'll notify you]
    C -- Yes --> E[Package selection<br/>/packages/leadId]

    %% =============================================
    %% STEP 2: CHOOSE PLAN (unchanged)
    %% =============================================
    E --> F[Service type toggle<br/>Fibre | LTE | 5G | Wireless]
    F --> G[Browse & select package]

    %% =============================================
    %% STEP 3: ENHANCEMENTS (NEW — borrowed from Vox)
    %% =============================================
    G --> H[Enhancements page<br/>/order/enhancements]

    H --> H0{Add extras?}
    H0 -- Entertainment --> H1[Streaming bundles<br/>Netflix, Showmax, etc.]
    H0 -- Router/Hardware --> H2[Compatible routers<br/>+ mesh Wi-Fi]
    H0 -- Voice --> H3[VoIP add-on]
    H0 -- Security --> H4[Internet security]
    H0 -- Skip --> I[Continue]

    H1 --> I
    H2 --> I
    H3 --> I
    H4 --> I

    %% =============================================
    %% STEP 4: ORDER SUMMARY (NEW — borrowed from Vox)
    %% =============================================
    I --> J[Order summary page<br/>/order/summary]
    J --> J1[Review cart<br/>Package + add-ons<br/>Monthly total + once-off fees<br/>Excl. VAT + incl. VAT breakdown]
    J1 --> J2[Click 'Proceed to Checkout']

    %% =============================================
    %% STEP 5: SIGN IN (moved AFTER summary)
    %% =============================================
    J2 --> K{Authenticated?}
    K -- Yes --> M[Skip to details]
    K -- No --> L[Sign in / Register<br/>/order/checkout/account]

    L --> L1{Auth method}
    L1 -- Phone OTP --> L2[Enter phone + verify OTP]
    L1 -- Email --> L3[Sign up or sign in]
    L1 -- Google --> L4[Google OAuth → callback]

    L2 --> M
    L3 --> M
    L4 --> M

    %% =============================================
    %% STEP 6: YOUR DETAILS + KYC (NEW)
    %% =============================================
    M --> N[Your details<br/>/order/checkout/details]
    N --> N1[Name, surname, email, phone<br/>Pre-filled from auth if available]
    N1 --> N2[Service address<br/>Pre-filled from coverage check]
    N2 --> N3[Property type<br/>House / Apartment / Business / Estate]

    N3 --> N4{Wireless/Mobile?}
    N4 -- Yes --> N5{Delivery = service address?}
    N4 -- No --> N6[Continue]
    N5 -- No --> N7[Enter delivery address]
    N5 -- Yes --> N6
    N7 --> N6

    N6 --> N8[SA ID or Passport number<br/>For RICA + KYC]

    %% --- KYC decision logic ---
    N8 --> KYC1{KYC required?}

    KYC1 -- Already verified --> KYC_SKIP[Skip KYC<br/>Badge: 'Identity verified ✓']
    KYC1 -- Hardware-only order --> KYC_SKIP
    KYC1 -- RICA service, not verified --> KYC2[Create consumer KYC session<br/>POST /api/compliance/consumer-kyc]

    KYC2 --> KYC3[LightKYCSession inline<br/>consumer_light_kyc flow<br/>~2 min: ID + address + liveness]

    KYC3 --> KYC4{Verification result}

    KYC4 -- Approved --> KYC_SKIP
    KYC4 -- Pending review --> KYC5[Proceed with order<br/>Admin reviews before activation]
    KYC4 -- Declined --> KYC6[Retry or contact support<br/>POST /api/compliance/retry-kyc]

    KYC6 --> KYC2

    KYC_SKIP --> O
    KYC5 --> O

    %% =============================================
    %% STEP 7: CONFIRM & PAY (slimmed down)
    %% =============================================
    O[Confirm & pay<br/>/order/checkout/confirm]
    O --> O1[Final order summary<br/>Package + add-ons + address + VAT]
    O1 --> O2[Accept Terms & Conditions]
    O2 --> O3[Place Order]

    O3 --> P1[Create order<br/>POST /api/orders/create]
    P1 --> P2[Initiate R1.00 validation<br/>POST /api/payment/netcash/initiate]
    P2 --> P3[Redirect to NetCash Pay Now]

    %% =============================================
    %% PAYMENT RESULT (unchanged)
    %% =============================================
    P3 --> Q[NetCash gateway<br/>20+ payment methods]
    Q --> R{Result}
    R -- Success --> S[Order confirmed<br/>/payment/callback → /dashboard]
    R -- Cancelled --> T[Retry option]
    R -- Error --> U[Error + retry]

    %% =============================================
    %% STYLES
    %% =============================================
    style A fill:#E87A1E,color:#fff
    style E fill:#1B2A4A,color:#fff
    style H fill:#E87A1E,color:#fff
    style J fill:#1B2A4A,color:#fff
    style N fill:#1B2A4A,color:#fff
    style KYC3 fill:#f59e0b,color:#fff
    style KYC_SKIP fill:#4CAF50,color:#fff
    style O fill:#1B2A4A,color:#fff
    style Q fill:#4CAF50,color:#fff
    style S fill:#4CAF50,color:#fff
    style D fill:#ef4444,color:#fff
    style KYC6 fill:#ef4444,color:#fff
    style T fill:#f59e0b,color:#fff
    style U fill:#ef4444,color:#fff
```

## Progress Bar: 3 Steps → 7 Steps

| Step | Current | Redesigned |
|------|---------|------------|
| 1 | Choose Plan | **Coverage** |
| 2 | Sign In | **Choose Plan** |
| 3 | Confirm & Pay | **Enhancements** |
| 4 | — | **Review Order** |
| 5 | — | **Sign In** |
| 6 | — | **Your Details** (includes KYC when required) |
| 7 | — | **Confirm & Pay** |

KYC is embedded inside Step 6, not a separate step. The progress bar stays at 7 steps — customers who skip KYC never know it existed.

## Route Changes

| Current | Redesigned | Purpose |
|---------|------------|---------|
| `/packages/[leadId]` | `/packages/[leadId]` | No change |
| — | `/order/enhancements` | **NEW** — dedicated add-ons page |
| — | `/order/summary` | **NEW** — review cart before auth |
| `/order/checkout` (account step) | `/order/checkout/account` | Sign in — now step 5 not step 2 |
| `/order/checkout` (confirm step) | `/order/checkout/details` | **NEW** — personal info + address + KYC |
| — | `/order/checkout/confirm` | Slimmed to: final review + T&Cs + pay |

## Component Reuse

| Existing Component | Current Location | Redesign Usage |
|--------------------|------------------|----------------|
| `CoverageChecker` | `components/coverage/CoverageChecker.tsx` | Step 1 — unchanged |
| `PackagesContent` | `app/packages/[leadId]/page.tsx` | Step 2 — unchanged |
| `ServiceToggle` | `components/ui/service-toggle.tsx` | Step 2 — unchanged |
| `AddonsSelection` | `components/order/AddonsSelection.tsx` | Step 3 — moves to dedicated page |
| `OrderSummarySidebar` | `components/order/checkout/OrderSummarySidebar.tsx` | Step 4 — promoted to full page |
| `AccountSection` | `components/order/checkout/AccountSection.tsx` | Step 5 — own page |
| `PhoneOTPSection` | `components/order/checkout/PhoneOTPSection.tsx` | Step 5 — own page |
| `ServiceAddressSection` | `components/order/checkout/ServiceAddressSection.tsx` | Step 6 — moves to details page |
| `CheckoutProgressBar` | `components/order/CheckoutProgressBar.tsx` | Updated from 3 → 7 steps |
| `LightKYCSession` | `components/compliance/LightKYCSession.tsx` | Step 6 — inline KYC when required |
| `KYCStatusBadge` | `components/compliance/KYCStatusBadge.tsx` | Step 6 — shows verified badge for returning customers |

## New Components Needed

| Component | Purpose | Page |
|-----------|---------|------|
| `EnhancementsPage` | Full-page add-ons layout with categories | `/order/enhancements` |
| `OrderSummaryPage` | Full-page cart review with VAT breakdown | `/order/summary` |
| `CustomerDetailsForm` | Name, phone, email, SA ID, property type, inline KYC | `/order/checkout/details` |
| `ConfirmAndPayPage` | Final review + T&Cs + Place Order button | `/order/checkout/confirm` |

## Consumer KYC Integration

### Smart Skip Logic

KYC only triggers when all three conditions are met:

1. **Order includes a RICA-mandatory service** (Fibre, LTE, 5G, Wireless) — hardware-only orders skip
2. **Customer is not already KYC-verified** — checked via `consumer_kyc_sessions` table
3. **Customer just entered their SA ID / passport** — KYC section appears inline after ID entry

```
if (orderHasRICAService && !customer.kycVerified) → show KYC
else → skip with green badge or no KYC UI at all
```

### Flow Within Step 6

After the customer enters their SA ID:

1. **Already verified?** → Show "Identity verified" badge, continue button enabled immediately
2. **Not verified, RICA service?** → Expand inline KYC section:
   - Create session via `POST /api/compliance/consumer-kyc`
   - Embed `LightKYCSession` with `flowType='consumer_light'`
   - Didit opens in new tab: ID verification → proof of address → liveness (~2 min)
   - On completion, poll status via `GET /api/compliance/{id}/status`
3. **Hardware-only?** → No KYC UI shown at all

### Verification Results

| Result | Action | Order blocked? |
|--------|--------|---------------|
| `approved` | Badge: "Identity verified" — proceed | No |
| `pending_review` | Badge: "Verification in review" — proceed to payment | No (admin gates activation) |
| `declined` | Show retry button + support contact | Yes (must retry or contact support) |

`pending_review` does NOT block the order. The customer can complete payment. Admin reviews KYC before triggering activation/RICA submission — this is the same gate used in the B2B flow.

### Codebase Changes Required

| Change | File | Description |
|--------|------|-------------|
| New API endpoint | `app/api/compliance/consumer-kyc/route.ts` | Accepts `customerId` + `idNumber` instead of `quoteId`. Creates `consumer_light_kyc` session via Didit |
| Session manager | `lib/integrations/didit/session-manager.ts` | New `createConsumerKYCSession(customerId, idNumber)` function alongside existing `createKYCSessionForQuote()` |
| Consumer KYC table | `supabase/migrations/` | New `consumer_kyc_sessions` table (or add `context` column to `kyc_sessions` to distinguish B2B vs consumer) |
| Details page | `app/order/checkout/details/page.tsx` | Embed `LightKYCSession` conditionally after SA ID input |
| Order context | `lib/stores/order-store.ts` | Add `kycStatus` and `kycSessionId` to Zustand store |

### Existing Infrastructure Reused

- `LightKYCSession` component already supports `consumer_light` flow type
- `DiditFlowType` already includes `'consumer_light_kyc'`
- `ConsumerKYCSession` type already defined in `lib/integrations/didit/types.ts`
- `ExtractedKYCData` captures SA ID number, address, liveness score, face match
- Retry endpoint `POST /api/compliance/retry-kyc` works for both B2B and consumer
- Status polling `GET /api/compliance/{id}/status` is flow-agnostic

## Key Wins

1. **Lower drop-off** — customer sees their full cart before being asked to sign in. They're invested.
2. **Less cognitive load** — each page does one thing. No scrolling past auth forms to find the address section.
3. **Better upsell** — dedicated enhancements page with proper layout, not a sidebar toggle.
4. **RICA readiness** — collecting SA ID early means activation is faster post-payment.
5. **KYC without friction** — verified customers skip entirely; hardware-only customers never see it; RICA customers complete it inline in ~2 min alongside their details.
6. **Reuses existing components** — `AddonsSelection`, `ServiceAddressSection`, `OrderSummarySidebar`, `PhoneOTPSection`, `LightKYCSession` all survive, just on different pages.

## API Endpoints

| Endpoint | Method | Step |
|----------|--------|------|
| `/api/geocode` | GET | 1 — Coverage |
| `/api/coverage/lead` | POST | 1 — Coverage |
| `/api/coverage/packages` | GET | 2 — Choose Plan |
| `/api/compliance/consumer-kyc` | POST | 6 — Your Details (NEW) |
| `/api/compliance/{id}/status` | GET | 6 — Your Details (existing) |
| `/api/compliance/retry-kyc` | POST | 6 — Your Details (existing) |
| `/api/orders/create` | POST | 7 — Confirm & Pay |
| `/api/payment/netcash/initiate` | POST | 7 — Confirm & Pay |

## State Management

No changes to `OrderContext` (Zustand + localStorage). The store already persists across page navigation. Google OAuth checkout state still uses `sessionStorage` for the redirect round-trip.

New fields added to `OrderContext`:

| Field | Type | Purpose |
|-------|------|---------|
| `kycStatus` | `'not_required' \| 'pending' \| 'approved' \| 'pending_review' \| 'declined'` | Tracks KYC state for the current order |
| `kycSessionId` | `string \| null` | Didit session ID for status polling |

## Reference

- **Current flow**: `docs/architecture/CIRCLETEL_ORDER_JOURNEY.md`
- **Vox reference**: `docs/architecture/VOX_LTE_ORDER_JOURNEY.md`
- **B2B flow**: `docs/architecture/CIRCLETEL_BUSINESS_BUY_JOURNEY.md`
- **Didit types**: `lib/integrations/didit/types.ts`
- **KYC component**: `components/compliance/LightKYCSession.tsx`

<!-- CI pipeline test: staging deployment verification 2026-05-23T20:36:54Z -->

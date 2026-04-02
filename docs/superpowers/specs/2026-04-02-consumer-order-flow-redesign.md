# Consumer Order Flow Redesign — Design Spec

**Date:** 2026-04-02  
**Status:** Approved  
**Author:** Jeffrey (via brainstorming session)

---

## Problem Statement

The current residential consumer order flow has 6 screens, two critical bugs that break conversion, and uses hardcoded mock data for package pricing. Customers are ejected from the wizard mid-flow to verify an OTP, the confirmation page breaks on refresh, and there is a duplicate order creation risk. This spec describes a 3-step redesign that fixes all critical issues and halves the screen count.

---

## Goals

1. Fix all critical and high-severity bugs in the current flow
2. Reduce screens from 6 to 3 (+ confirmation) to minimise drop-off
3. Display real package data from the coverage API
4. Eliminate the OTP detour that ejects users mid-order
5. Ensure the confirmation page survives a page refresh

---

## Out of Scope

- B2B / partner order flows
- Admin order management
- Post-activation service management
- KYC document collection (remains in dashboard)
- Dashboard billing / invoices

---

## New Flow Overview

```
/order/coverage  →  /order/packages/[leadId]  →  /order/checkout  →  /order/confirmation
   Step 1                  Step 2                     Step 3
  Location             Choose Plan              Account & Pay
```

Progress bar shows 3 honest steps. No hidden sub-steps.

### Bundle product entry point
Bundle URLs (`/order/coverage?product=<slug>`) still enter at Step 1 — no change needed. The coverage page reads the `product` query param and auto-selects the coverage type as before.

---

## Step 1 — Location (`/order/coverage`)

### What changes
- Add **Property Type** dropdown, revealed after address is confirmed
- No other changes to existing coverage logic

### Property Type options

**Residential** (shown when coverage type = Residential):
- Freestanding Home (SDU)
- Gated / Security Estate
- Apartment / Flat Complex
- Townhouse

**Business** (shown when coverage type = Business):
- Office or Business Park
- Industrial or Warehouse
- Educational Facility
- Healthcare Facility
- Free Standing Building
- SOHO (Small Office Home Office)

### State stored on submit
```
OrderContext.coverage = {
  leadId, address, coordinates, coverageType, propertyType
}
```

### Navigation
- On submit → `/order/packages/[leadId]?type=[coverageType]`

---

## Step 2 — Choose Plan (`/order/packages/[leadId]`)

### What changes
- Replace hardcoded mock packages with a real API call:
  ```
  GET /api/coverage/packages?leadId=[leadId]&type=[coverageType]
  ```
- API already returns: `id`, `name`, `price`, `promotion_price`, `promotion_months`, `speed_down`, `speed_up`, `features[]`, `provider` (with logo)
- Show loading skeleton while fetching
- Handle empty state: "No packages available at your address" with WhatsApp CTA

### What stays the same
- Package card grid layout (1 / 2 / 3 col responsive)
- Fibre / Wireless tabs (derived from `service_type` / `product_category`)
- Most Popular badge, promotional pricing display
- Trust indicators at bottom
- Selection state (ring highlight)

### State stored on select
```
OrderContext.package = {
  packageId, packageName, packageSpeed, basePrice,
  promotionPrice, promotionMonths, features, provider
}
```

### Navigation
- On package selected → `/order/checkout`

---

## Step 3 — Account & Pay (`/order/checkout`) ← New page

This page replaces `/order/account`, `/order/service-address`, and `/order/payment`.

### Layout
Two-section single page with sticky order summary sidebar on desktop.

**Left / main column:** Account section (conditional) + Payment section  
**Right / sidebar:** Order summary (package name, speed, price, R1.00 charge today)

### Section A — Account (conditional on auth state)

#### New customer (not logged in)
- Google OAuth button ("Continue with Google")
- Divider: "Or sign up with email"
- Fields: First name, Last name, Email, Password (min 8 chars, show/hide toggle), Phone number
- Terms & Privacy checkbox (required)
- Phone is **collected but not verified here** — verification is deferred to post-order

#### Returning customer (already logged in)
- Compact identity card:
  ```
  👤 Ordering as [Full Name] · [email]  [Not you? Sign out →]
  ```
- Section A is hidden entirely — no form shown

### Section B — Payment (always shown)

- Validation charge banner: "VALIDATION ONLY — R1.00 charged today. First bill of R[price]/mo after activation."
- Payment method: Credit/Debit Card (NetCash, Mastercard/Visa/3D Secure logos)
- "Proceed to Payment" button → triggers order creation + NetCash initiation

### Order creation (happens here, once only)

On "Proceed to Payment":
1. Validate all required fields (client-side)
2. `POST /api/orders/create` with full order payload (package, address, propertyType, customer details)
3. On success: `POST /api/payment/netcash/initiate` with `orderId` + `amount: 1.00`
4. `window.location.href = paymentUrl` → NetCash hosted form
5. NetCash returns to `/order/confirmation?Reference=[payment_reference]&TransactionId=[id]` (fixed URL configured via `NEXT_PUBLIC_NETCASH_ACCEPT_URL`)

**Order is created exactly once — not before, not in multiple places.**

### Error handling
- Order creation failure: show inline error, retry button, WhatsApp support link
- Payment initiation failure: show inline error with order number (order already created, can retry payment from dashboard)

---

## Confirmation (`/order/confirmation`)

### What changes
- **Fetch order from API** on mount using `?Reference=` query param from NetCash:
  `GET /api/orders?reference=[Reference]`
  - The `payment_reference` on the order matches the NetCash `Reference` param
  - Removes dependency on OrderContext / localStorage
  - Page survives refresh and direct navigation
  - Show loading skeleton while fetching; show error state if reference not found
- Add **Phone Verification card** as first item in "What Happens Next":

```
⚠️  Verify your phone number
    We'll send a code to [phone]. Installation cannot be scheduled
    until your number is verified.
    [Verify Now →]  (links to /dashboard/profile?verify=phone)
```

### What stays the same
- Order number + date display
- Package + address summary
- "What Happens Next" numbered steps (phone verify prepended when unverified)
- Action buttons: "Return to Home" / "Go to Dashboard"

---

## Pages Deleted

The following pages are retired and should be removed or redirected:

| Page | Redirect to |
|------|-------------|
| `/order/account` | `/order/checkout` |
| `/order/service-address` | `/order/checkout` |
| `/order/payment` | `/order/checkout` |

Existing inbound links (from product pages, bundle flows) that pointed to `/order/account` or `/order/payment` must be updated to `/order/checkout`.

---

## OTP / Phone Verification Strategy

- Phone number is **collected** at Step 3 (account creation)
- Phone OTP is **not sent during the order flow**
- After order is placed, confirmation page shows a "Verify your phone" CTA
- Dashboard shows a persistent banner until phone is verified
- **Installation scheduling is blocked** until phone is verified (soft block — order exists, technician assignment held)
- Verification flow: `/dashboard/profile?verify=phone` → sends OTP → verify 6-digit code

---

## OrderContext Changes

### Stages simplified
```typescript
type OrderStage = 'coverage' | 'packages' | 'checkout' | 'confirmation'
```

### Remove
- `installationAddress` (now same as coverage address — no separate service-address step)
- `kyc` from order flow state (KYC remains in dashboard only)

### Add
- `propertyType` to coverage state
- `orderId` to confirmation state (for API fetch)

---

## API Contracts

### Existing APIs used (no changes needed)
- `POST /api/coverage/lead` — creates lead, returns `leadId`
- `GET /api/coverage/packages?leadId=&type=` — returns real packages
- `POST /api/orders/create` — creates order record
- `POST /api/payment/netcash/initiate` — returns `paymentUrl`

### New APIs needed
- `GET /api/orders?reference=[payment_reference]` — fetch single order for confirmation page
  - Auth: no session required (reference is unguessable) — sufficient for confirmation display
  - Returns: order number, package name, price, address, status, payment_status, customer name/email/phone
- `GET /api/orders/[orderId]` — fetch order by ID for dashboard order detail page (existing, verify it exists)

---

## Security

- Fix open redirect: validate `?redirect=` param on `/auth/login` against an allowlist of internal paths
- Order fetch on confirmation page: verify the orderId belongs to the authenticated user (or match by `payment_reference` query param returned by NetCash)

---

## What is NOT changing

- Coverage check logic and aggregation service
- NetCash webhook handlers (`/api/payment/netcash/webhook`, `accepted`, `declined`)
- Auth service (`CustomerAuthProvider`, `customer-auth-service.ts`)
- Dashboard (all `/dashboard/*` pages)
- Google OAuth callback (`/auth/callback`)
- All B2B / admin / partner flows

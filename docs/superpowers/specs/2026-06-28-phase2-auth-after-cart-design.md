# Phase 2 — Auth After the Cart (design)

**Date:** 2026-06-28
**Author:** Claude Code
**Status:** Approved design → implementation
**Roadmap:** `docs/superpowers/plans/2026-06-27-order-journey-redesign-phased.md` (Phase 2, gap #2)
**Depends on:** PR #579 (server-authoritative payment amount) — merged. This phase closes the
#3 owner-gate that #579 deliberately deferred.

---

## Goal

Let a guest build and review the full order, then authenticate **just-in-time at "Place Order"**,
so the order is created **owned** (`auth_user_id` + `customer_id` stamped server-side). Closes the
deferred payment-audit **#3** (unauthenticated initiation → hard owner-gate).

**Not** a route rebuild — route-splitting into `/order/summary` etc. stays Phase 3.

## Decisions (locked with user)

1. **Account still required**, just deferred to after the cart (not optional guest checkout).
2. **Just-in-time auth**: one review page; auth (`AccountSection`, OTP-first) reveals inline at
   "Place Order" and continues straight to payment on success. No new route.
3. Ownership is **server-authoritative** — derived from the verified session, never the request body.
4. Phase 2 **flips the #3 owner-gate to hard** in the initiate route (payment code, in-scope).

---

## Current state (verified 2026-06-28)

- `app/order/checkout/page.tsx`: `type CheckoutStep = 'account' | 'confirm'`; initialized
  `isAuthenticated ? 'confirm' : 'account'` (line ~48). Auth-first: the order summary/`confirm`
  step is only reachable after `isAuthenticated` flips (auto-advance effect line ~100). OAuth
  round-trip persists `{serviceAddress, propertyType}` to `sessionStorage['circletel_checkout_return']`
  (save line ~106, restore line ~117).
- `app/api/orders/create/route.ts`: inserts `consumer_orders` via **service-role** `createClient()`,
  sets **neither** `auth_user_id` nor `customer_id` (both columns exist, both nullable).
- `components/providers/CustomerAuthProvider.tsx`: provides `user` (auth.users; `user.id` =
  `auth_user_id`) and `customer` (row in `customers`, `customer.id` = `customer_id`, linked by
  `auth_user_id`). A `customers` row is auto-created on signup or via `/api/customers/ensure`.
- `app/api/payment/netcash/initiate/route.ts`: after #579, derives amount/recipient/ref from the
  order; carries a documented **Phase 2 seam** for the owner-gate (soft today).
- Existing auth-header pattern is already used elsewhere on the checkout page
  (`Authorization: Bearer <access_token>`, line ~397) — reuse it.

---

## Design

### A. Reorder the checkout (UX) — `app/order/checkout/page.tsx`

- Initialize `checkoutStep` to **`'confirm'` always** (drop the `isAuthenticated ? …` gate). Guest
  sees review (service address, property type, `OrderSummarySidebar`, terms) immediately.
- `handlePlaceOrder`:
  - if `isAuthenticated` → run `placeOrder()` unchanged.
  - else → reveal `AccountSection` inline (render it within/above the confirm step, OTP tab first),
    set a `pendingPlaceOrder` ref/flag. On auth success (`isAuthenticated` flips, or the
    OTP/`onPhoneSignupComplete` callbacks), if `pendingPlaceOrder` → call `placeOrder()` automatically.
- Keep `AccountSection` (`signUp`/`signIn`/`signInWithGoogle`/`onPhoneSignupComplete`) — only its
  **placement/trigger** changes, not its internals.
- `CheckoutProgressBar`: relabel the middle stage so the journey reads **Choose Plan › Review › Pay**
  (auth folds into Pay). Confirm the exact `STEPS` label change is display-only.

### B. Server-authoritative ownership — `app/api/orders/create/route.ts` (+ `placeOrder` caller)

- `placeOrder` (checkout page) sends `Authorization: Bearer <session.access_token>` on the
  `/api/orders/create` fetch (token already available via `supabase.auth.getSession()`).
- `orders/create`: resolve the verified user from **header OR cookies** (`auth-patterns.md`:
  Bearer → `getUser(token)`, else `createClientWithSession()`), then:
  - **Require** a valid session for this consumer path → 401 if absent.
  - Derive `auth_user_id = user.id`. Look up `customer_id` from `customers` where
    `auth_user_id = user.id` (the row exists post-signup; if somehow missing, call the same
    ensure-path used by the provider). Stamp **both** on the insert. Ignore any body-supplied ids.
  - Keep using the service-role client for the actual insert/duplicate-check (RLS-free), but the
    **identity** comes from the verified session, not the body.
- ⚠️ **Pre-flight check (planning):** confirm no *live* unauthenticated caller posts to
  `orders/create`. Known callers: `app/order/checkout` (will send token), dead `PaymentStage`
  (0 imports), broken `/checkout/payment` `CircleTelPaymentPage`. Admin order creation is a
  separate route. If a legit unauthenticated path exists, gate by path/flag instead of a blanket 401.

### C. Close #3 — hard owner-gate — `app/api/payment/netcash/initiate/route.ts` (+ caller)

- `placeOrder` sends the same Bearer token on the `/api/payment/netcash/initiate` fetch.
- `initiate`: resolve verified user (header OR cookies). If `order.auth_user_id` is set and the
  verified `user.id !== order.auth_user_id` → **403**. If no session at all → **401** (orders are
  now always owned, so an unauthenticated initiate is invalid).
- Replace the soft "NOTE (Phase 2)" seam with this enforcement. Amount/recipient derivation from
  #579 stays exactly as-is.

### D. OAuth round-trip — `app/order/checkout/page.tsx`

- Before `signInWithGoogle()`, in addition to `{serviceAddress, propertyType}`, persist a
  `pendingPlaceOrder: true` marker in `sessionStorage['circletel_checkout_return']`.
- On return (existing restore effect, now authenticated): restore fields, clear the marker, and
  **land on review with the auth step hidden and the Pay button ready** — do **NOT** auto-fire the
  payment redirect (no surprise charge). One click to pay. OTP/email are inline (no redirect) and
  continue automatically per §A.

### E. Out of scope

Route-splitting (`/order/summary`, `/order/enhancements`) — Phase 3. Add-ons/upsells — Phase 3.
KYC/RICA — Phase 4. Payment-method redesign — Phase 5.

---

## Data flow (happy path, guest)

```
Guest → /order/checkout (starts at 'confirm'/review)
  → fills address + property type, reviews summary, accepts terms
  → clicks "Place Order"
      ├─ authenticated? → placeOrder()
      └─ not? → inline AccountSection (OTP/email/Google)
                 → auth success → placeOrder() (auto-resume)
  placeOrder():
    → POST /api/orders/create  (Bearer token)
         → server verifies session, stamps auth_user_id + customer_id, inserts order
    → POST /api/payment/netcash/initiate  (Bearer token)
         → server verifies session.user.id === order.auth_user_id (else 403)
         → derives amount/recipient/ref from order (#579), returns NetCash form
    → redirect to NetCash
```

## Error handling

- `orders/create` no session → 401 "Please sign in to place your order" (UI re-opens auth step).
- `initiate` owner mismatch → 403; no session → 401 (UI surfaces a retry).
- OAuth malformed saved state → ignored (existing try/catch).
- `customers` row missing at create → ensure-path; if that fails → 500 with a clear message
  (do not create an unowned order).

## Testing / verification

- `npm run type-check:memory` clean for changed files.
- Reading-only DB check (allowed): after a team staging order, confirm the new row has
  `auth_user_id` + `customer_id` populated (`SELECT … FROM consumer_orders ORDER BY created_at DESC`).
- Manual: guest reaches review with **no** auth prompt; auth prompt appears only at Place Order;
  OTP/email resume to payment; Google returns to a ready-to-pay review.
- `initiate` returns 403 when a different session's token is used against an order
  (unit/integration-level assertion).
- No live payment run by me (no real orders on staging).

## Files touched (estimate)

| File | Change |
|---|---|
| `app/order/checkout/page.tsx` | reorder steps, inline auth at Place Order, Bearer tokens on both fetches, OAuth resume marker |
| `app/api/orders/create/route.ts` | verify session (header/cookies), require auth, stamp `auth_user_id` + `customer_id` |
| `app/api/payment/netcash/initiate/route.ts` | hard owner-gate (verify session vs `order.auth_user_id`) |
| `components/order/CheckoutProgressBar.tsx` | relabel middle stage (display only) |
| `docs/superpowers/plans/2026-06-27-order-journey-redesign-phased.md` | mark Phase 2 done, #3 closed |

`AccountSection.tsx` / `PhoneOTPSection.tsx` / `CustomerAuthProvider.tsx`: **unchanged** (reused).

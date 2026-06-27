# Order Journey Redesign — Phased Path

**Date:** 2026-06-27
**Author:** Claude Code
**Status:** Roadmap (not yet started)
**Source analysis:** `docs/architecture/VOX_VS_CIRCLETEL_ORDER_JOURNEY.md`
**Design assets:** `CIRCLETEL_ORDER_JOURNEY_REDESIGN.md`, `designs/stitch/order-journey/` (7 hi-fi screens)

---

## Goal

Bring CircleTel's shipped order flow up to the Vox-benchmark UX by adopting Vox's
single-purpose-per-page funnel **while keeping CircleTel's existing advantages**
(inline hero coverage, auto-selected package, 3 auth methods, no-contract positioning).

## Guiding principle

**Do NOT big-bang.** The order state runs on **React Context + localStorage**
(`circletel_order_state`), so pages can be split out incrementally. Ship → measure → next.
Each phase is independently shippable and conversion-measurable.

> **Doc-accuracy note (resolved in Phase 0, 2026-06-27):** several docs said the order flow uses
> **Zustand**; it actually uses **React Context + localStorage**. Corrected in `CLAUDE.md`,
> `CIRCLETEL_ORDER_JOURNEY_REDESIGN.md`, and `CIRCLETEL_ORDER_JOURNEY.md`. See the
> **Order State Reference** under Phase 0 for the authoritative shape.

---

## Phase overview

| Phase | Theme | Gap | Effort | Risk | Ship-blocking dependency |
|---|---|---|---|---|---|
| 0 | Foundation (progress bar, state verify) | — | S | Low | — |
| 1 | No-coverage cross-sell | #1 | S–M | Low | MTN coverage APIs (exist) |
| 2 | Auth after cart | #2 | M | Med | Phase 0 |
| 3 | Single-purpose pages (summary + upsells) | #3 | M–L | Med | Phase 0 |
| 4 | In-flow KYC/RICA | #5 | M | Med | Didit integration |
| 5 | In-app payment parity | #4 | L | **High** | **Payment security audit fixes first** |

**Recommended commit now:** Phase 0 + 1 (small, low-risk, biggest conversion lift, reuses existing data).
Phases 2–4 are the "real redesign" tranche. Hold Phase 5 until the payment-security bugs are fixed.

---

## Phase 0 — Foundation ✅ (done 2026-06-27)

**Goal:** make incremental page-splitting safe. No user-visible change.

- [x] ~~Add a persistent progress-bar component (`components/order/OrderProgressBar.tsx`)~~ — **NOT NEEDED.** A polished 3-step bar already exists and is in active use: **`components/order/CheckoutProgressBar.tsx`** (stages `packages → account → checkout` = "Choose Plan › Sign In › Confirm & Pay", `default`/`hero` variants, ships a `stepNumberToStage()` helper to map the state's numeric `currentStage`). Building a new one would duplicate it. Mounting strategy stays **per-page** for now; consolidating to a single persistent mount is deferred to **Phase 3**, when the checkout actually splits into separate routes (a layout-level mount is premature today — the order routes are split and `/packages/[leadId]` lives outside `/order/`).
- [x] Verify `circletel_order_state` survives cross-route navigation — **inherent**: the provider (`OrderContextProvider`) is mounted at the **root** `app/layout.tsx`, and state is localStorage-backed (`circletel_order_state`) with a debounced write + server sync to `/api/order-drafts` for authed users. It survives hard navigations and OAuth redirects by construction; no code needed.
- [x] Document the order-state shape (single source of truth) — see **Order State Reference** below.
- [x] Correct the Zustand → React Context note — fixed in `CLAUDE.md`, `docs/architecture/CIRCLETEL_ORDER_JOURNEY_REDESIGN.md` (×3), `docs/architecture/CIRCLETEL_ORDER_JOURNEY.md`. (Zustand IS still used elsewhere — admin auth store, cart, CMS editor — those mentions are correct and were left alone.)

**Outcome:** no new component, no behaviour change. Phase 0 was largely already satisfied by existing infrastructure; the real deliverable was correcting the docs and recording the state shape so Phases 2–3 build on accurate foundations.

### Order State Reference

**Source of truth:** `components/order/context/OrderContext.tsx` — React Context + `useReducer`, persisted to `localStorage['circletel_order_state']` (debounced) and synced to `/api/order-drafts` for authenticated users. Provider mounted at root `app/layout.tsx`. Hook: `useOrderContext()`. Legacy `contexts/OrderContext.tsx` is **dead code** (zero imports).

```ts
interface OrderState {
  currentStage: number;        // 1 | 2 | 3 (see OrderStage in lib/order/types.ts)
  orderData: OrderData;        // coverage + package + account data
  errors: ValidationErrors;    // field validation errors
  isLoading: boolean;
  savedAt?: Date;
  completedSteps: number[];    // e.g. [1, 2] — drives canNavigateToStep()
}
```

**Stage constants** (`lib/order/types.ts`): `OrderStage = 1 | 2 | 3`; `OrderStageId = 'coverage' | 'packages' | 'checkout'`; `STAGE_NAMES = ['Location', 'Choose Plan', 'Account & Pay']`; `TOTAL_STAGES = 3`; `getStageId(stage)`. A legacy 5-stage shape is clamped to stage 2 on hydration.

**Actions:** `setCurrentStage(n)`, `updateOrderData(partial)`, `markStepComplete(n)`, `resetOrder()`, `setErrors()`, `setLoading()`. Navigation guard `canNavigateToStep(target)` allows backward freely, forward only if the current step is complete.

**Step sequence / routes:** Stage 1 `coverage` (`/order/coverage` → redirects to `/` for the homepage coverage check) → Stage 2 `packages` (`/order/packages`, guarded: requires coverage) → Stage 3 `checkout` (`/order/checkout`, guarded: requires coverage + package). The active progress UI for these is `CheckoutProgressBar` (mounted per-page).

**Success criteria:** ✅ existing checkout already renders `CheckoutProgressBar`; ✅ state persists across hard navigation via root-level provider + localStorage; ✅ docs corrected; ✅ state shape recorded.

## Phase 1 — No-coverage cross-sell 🥇 (gap #1, highest ROI)

**Goal:** turn the dead-end into a conversion moment.

- [ ] Replace `NoCoverageLeadCapture`'s terminal form with **LTE/5G/Satellite/Wireless tabs** (Vox-style).
- [ ] Wire tabs to existing `/api/coverage/mtn/check` + `/api/coverage/mtn/packages` (already used by the admin checker).
- [ ] Keep the lead-capture form as a **fallback tab**, not the default.
- [ ] Handle the case where MTN returns no products (only 5G has active products today) — show available services only, lead form otherwise.
- [ ] Loading + error states for the MTN calls (try/catch/finally; no infinite spinner).

**Success criteria:** entering a fibre-uncovered address surfaces at least one alternative service tab with selectable packages; `% no-coverage sessions → package` rises from ~0.

## Phase 2 — Move auth after the cart (gap #2)

**Goal:** stop gating commitment behind sign-in.

- [ ] Extract auth out of the monolithic `/order/checkout` into a step **after** review.
- [ ] Lead with **OTP** (already live as secondary); keep email/pw + Google as options.
- [ ] Ensure order state (selected package + enhancements) persists through the auth redirect/round-trip.
- [ ] RBAC/session: confirm an authed session attaches to the in-progress order, not a fresh one.

**Success criteria:** a guest can build a full cart before any auth prompt; auth-step drop-off measurable and lower.

## Phase 3 — Split checkout into single-purpose pages (gap #3)

**Goal:** dismantle the page that does auth + address + profile + summary + T&Cs.

- [ ] Extract dedicated **`/order/summary`** review page (cart is a sidebar today).
- [ ] Extract dedicated **`/order/enhancements`** upsell page; move add-ons (Static IP +R114, Extended Support +R171, Managed WiFi +R229) **above** the flow, not below the CTA.
- [ ] Reduce `/order/checkout` to a single purpose (payment confirm).
- [ ] Progress bar reflects the new linear steps.
- [ ] T&Cs acceptance evidence (IP/UA/timestamp/terms-hash) still captured at the right step.

**Success criteria:** each route does one thing; add-on attach-rate jumps from near-zero.

## Phase 4 — In-flow identity / RICA (gap #5)

**Goal:** capture identity inside checkout instead of post-order upload.

- [ ] Embed **Didit KYC** as a checkout step (redesign already specs this).
- [ ] Smart-skip when KYC not required.
- [ ] Support the 6 ID types incl. business-entity types (parity with Vox).
- [ ] Persist KYC result to the order/customer record; reconcile with existing post-order vetting flow.

**Success criteria:** % of orders RICA-complete at checkout rises vs chased afterward.

## Phase 5 — In-app payment parity (gap #4, hardest, LAST) ⚠️

**Goal:** the one place even the redesign currently leaves open.

> **GATING DEPENDENCY — do NOT ship payment changes before this.**
> `PAYMENT_JOURNEY_AUDIT_2026-05-11.md` flagged bugs in this exact step. Status after
> verifying each against live code (2026-06-28):
> - **Wrong webhook table** — ✅ ALREADY FIXED. `netcash-webhook-processor.ts` uses
>   `consumer_orders` throughout; the audit's `.from('orders')` claim no longer applies.
> - **Client-controlled amount (#2)** — ✅ FIXED in the security PR (`payment-amount-server-authoritative`):
>   amount is now persisted on the order (`consumer_orders.payment_amount`, server-set at
>   creation) and the initiate route derives the charge + recipient + reference from the
>   order, ignoring the request body.
> - **Unauth initiation (#3)** — ⚠️ PARTIAL. Active protections shipped (payable-state guard:
>   reject paid/cancelled/failed orders; recipient derived server-side). The **hard owner-gate
>   is deferred to Phase 2**, because consumer orders are currently guest/unowned
>   (`auth_user_id`/`customer_id` are null at creation) — a hard gate today would break checkout.
> - **Deferred fast-follow:** #4 browser-exposed NetCash keys (needs key rotation, ops action)
>   and #5 webhook-signature fail-closed.

- [x] **Pre-req (#2):** client-controlled amount — server-authoritative amount shipped (separate security PR).
- [ ] **Pre-req (#3, Phase 2):** hard owner-gate on initiation, once orders carry an `auth_user_id`.
- [ ] **Pre-req (fast-follow):** rotate browser-exposed NetCash keys (#4); webhook-signature fail-closed (#5).
- [ ] Render in-app **debit-order** form (bank details, debit-date choice 26th/1st like Vox).
- [ ] Render in-app **credit-card** form (debit-date as Vox restricts it).
- [ ] Replace/supplement the NetCash redirect with in-app method selection.
- [ ] Reconciliation: confirmed-payment writes to the correct table and updates order status.

**Success criteria:** payment-step completion up; every confirmed payment reconciles correctly.

---

## Sequencing recommendation

1. **Now:** Phase 0 + 1 (low risk, highest lift, reuses MTN data already wired).
2. **Next tranche:** Phases 2 → 3 → 4 (the "real redesign").
3. **Separate urgent track / gate for Phase 5:** payment-security audit fixes.

## Related docs

- `docs/architecture/VOX_VS_CIRCLETEL_ORDER_JOURNEY.md` — the comparison this plan is built on
- `docs/architecture/CIRCLETEL_ORDER_JOURNEY_REDESIGN.md` — 7-step redesign spec
- `docs/architecture/VOX_LTE_ORDER_JOURNEY.md` — verified Vox benchmark
- `PAYMENT_JOURNEY_AUDIT_2026-05-11.md` — payment-step security bugs (gates Phase 5)
- `designs/stitch/order-journey/` — 7 hi-fi redesign screens

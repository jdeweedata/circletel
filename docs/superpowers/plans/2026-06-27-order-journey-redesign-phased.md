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

> **Doc-accuracy note:** `CLAUDE.md` and `CIRCLETEL_ORDER_JOURNEY_REDESIGN.md` say the flow uses
> **Zustand**. It actually uses **React Context + localStorage**. Correct this before a future
> implementer chases the wrong state layer.

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

## Phase 0 — Foundation

**Goal:** make incremental page-splitting safe. No user-visible change.

- [ ] Add a persistent **progress-bar component** (`components/order/OrderProgressBar.tsx`) driven by order state — cheap now, painful to retrofit.
- [ ] Verify `circletel_order_state` survives navigation between **separate routes** (localStorage-backed; verify, don't assume).
- [ ] Document the order-state shape (single source of truth) in the plan/architecture doc.
- [ ] Correct the Zustand → React Context note in `CLAUDE.md` and the redesign doc.

**Success criteria:** progress bar renders on existing checkout; state persists across a hard navigation between two test routes.

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
> `PAYMENT_JOURNEY_AUDIT_2026-05-11.md` flags real bugs in this exact step:
> webhook hits the wrong table (payments never confirm), client-controlled amount,
> no auth on initiation. These security fixes must land FIRST or alongside.
> They are more urgent than any UX item above and are a separate track.

- [ ] **Pre-req:** fix payment-security audit items (wrong webhook table, client-controlled amount, unauth initiation).
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

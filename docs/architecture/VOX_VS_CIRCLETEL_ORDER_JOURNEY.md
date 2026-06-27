# Vox vs CircleTel — Order Journey Comparison

Side-by-side review of Vox's LTE order journey (verified competitor benchmark) against
CircleTel's order journey **as actually shipped in production** and **as proposed in the redesign**.

## Sources & verification

| Source | What it is | Verified |
|--------|-----------|----------|
| `VOX_LTE_ORDER_JOURNEY.md` | Vox Shop LTE flow, live walkthrough | 2026-06-27, `shop.vox.co.za` (steps 1–12, no order placed) |
| CircleTel **shipped** flow | Live production walkthrough | 2026-06-27, `circletel.co.za` (Home → coverage → packages → checkout auth gate) |
| `CIRCLETEL_ORDER_JOURNEY_REDESIGN.md` | Proposed 7-step redesign | Design only — **not deployed** |

> **Key framing:** CircleTel's *shipped* flow lags Vox on most conversion dimensions. The *redesign*
> is an explicit copy of Vox's patterns and closes most of the gap — **but it is not built yet.**
> So the decision isn't "what to learn from Vox" (already documented) — it's "build the redesign or not,"
> plus one gap the redesign still leaves open (in-app payment) and one live bug found during the walkthrough.

## Step-by-step, side by side

| Stage | **Vox (verified)** | **CircleTel — SHIPPED** | **CircleTel — redesign (proposed)** |
|-------|--------------------|--------------------------|--------------------------------------|
| Entry | Home, inline coverage bar, Home/Business toggle | Home, **inline coverage bar** on hero ✓ | unchanged |
| Coverage check | Address + map-pin confirm | Address autocomplete (no pin step) | unchanged |
| **No coverage** | **→ LTE/5G/Satellite/Wireless tabs (converts)** | **→ lead-capture dead-end** ❌ | cross-sell alt services (planned) |
| Package select | Tier list + detail modal | `/packages/[leadId]` + service toggle, auto-selects a plan ✓ | unchanged |
| Upsells | **2 dedicated pages** (router; Norton + Voice), skippable | **sidebar, *below* the Order Now CTA** ❌ | `/order/enhancements` dedicated page |
| Review cart | **Dedicated order-summary page** | **sidebar only**, never a page ❌ | `/order/summary` dedicated page |
| Auth | **OTP only, AFTER cart** | Email/pw + Phone OTP + Google, **BEFORE Confirm & Pay** ⚠️ | moved after summary (Step 5) |
| Identity | **6 ID types** (SA ID/Company/Trust/NPO/Govt/Passport) | **none in flow** ❌ (deferred post-order) | embedded Didit KYC (Step 6) |
| Address | install + delivery + residency type | install + delivery + property type ✓ | unchanged |
| Payment | **In-app debit-order + credit-card forms**, debit-date choice | **NetCash redirect**, R1 validation charge, no in-app method choice ⚠️ | NetCash redirect (**unchanged — gap remains**) |
| Page model | **one purpose per page** | `/order/checkout` does auth + address + profile + summary + T&Cs ❌ | one purpose per page |
| Progress bar | persistent step indicator | 3-step (Choose Plan → Sign In → Confirm & Pay) | 7-step linear |

✓ on par · ⚠️ weaker · ❌ materially behind

## Gaps that cost conversions (prioritized)

1. **No-coverage is a dead-end, not a pivot.** *(biggest gap)* Vox turns "fibre not available" into the
   conversion moment — instant LTE/5G/Satellite/Wireless offer. CircleTel drops the customer into a
   "leave your details" capture form (`NoCoverageLeadCapture`). CircleTel has the supplier moat and MTN
   LTE/5G coverage already wired into the admin checker — parking warm intent in a lead table wastes it.
   *(Code-evidenced; not yet seen live — Sandton test address had wireless coverage.)*

2. **Auth gate fires before commitment.** Confirmed live: Step 2 is "Sign In or Create Account," gating
   Confirm & Pay. Vox collects nothing until after the cart. Cheap reorder, real drop-off impact.

3. **Upsells & review are sidebar afterthoughts.** Live: add-ons (Static IP +R114, Extended Support +R171,
   Managed WiFi +R229) sit *below* the Order Now CTA — a customer clicking through never sees them.
   Order summary is a sidebar, never a dedicated review page. Suppresses attach-rate and weakens commitment.

4. **Payment is the weakest comparison — and the redesign doesn't fix it.** Vox renders in-app debit-order
   and credit-card forms with explicit debit-date choice. CircleTel charges R1.00 and **redirects out to
   NetCash** with no in-app method selection; debit-order setup isn't in the main checkout. The redesign
   keeps the NetCash redirect, so in-app payment parity is an **unaddressed gap**.
   *(Separately, `PAYMENT_JOURNEY_AUDIT_2026-05-11.md` flags real bugs in this step — webhook hits the
   wrong table so payments never confirm, client-controlled amount, no auth on initiation. Those are more
   urgent than any UX item here.)*

5. **No in-flow RICA/identity capture.** Vox bakes identity (incl. business entity types) into checkout.
   CircleTel defers to post-order document upload. Redesign's embedded-KYC step (with smart skip) closes this.

## Live-validated observations (production walkthrough, 2026-06-27)

- ⚠️ **Price discrepancy (likely live bug):** package card advertised **R899/mo** for SkyFibre Home Plus,
  but checkout showed **R781.74 incl VAT (R679.77 excl)** — does not reconcile to R899. Trust/conversion risk.
- **R1.00 charge** is labelled "Validation charge · credited to your account" — authorization, refunded.
- **Auth methods live:** Email/password (primary), Phone OTP ("Send Verification Code"), Google — OTP is
  present but *secondary*, unlike Vox's OTP-only.
- **Coverage check is inline on the hero** (Vox-style) — better than the docs implied.
- **Positioning is genuinely competitive:** "No contracts, R0 setup," Installation FREE, 3D Secure /
  No Lock-In / Cancel Anytime badges — messaging Vox does not lead with.

## What CircleTel already does as well as / better than Vox

- Inline hero coverage check, auto-selected recommended package, free installation messaging.
- Three auth methods (Vox is OTP-only).
- Stronger no-lock-in / no-contract positioning.

## Doc-accuracy notes found during this review

- `CLAUDE.md` and the redesign doc say the order flow uses **Zustand**; it actually uses **React Context +
  localStorage** (`circletel_order_state`).

## Bottom line

The redesign closes gaps **1, 2, 3, 5**. It leaves **gap 4 (in-app payment)** open. The **R899 vs R781.74
price discrepancy** is a live issue independent of the redesign and should be triaged first. Net: the
strategic direction is already correct and documented — the open questions are *build the redesign?*,
*fix the price bug?*, and *do we want true in-app payment parity?*

## Related docs

- `VOX_LTE_ORDER_JOURNEY.md` — verified Vox benchmark (+ screenshots in `vox-lte-journey/`)
- `CIRCLETEL_ORDER_JOURNEY_REDESIGN.md` — proposed 7-step redesign
- `CIRCLETEL_ORDER_JOURNEY.md` — current/shipped flow
- `PAYMENT_JOURNEY_AUDIT_2026-05-11.md` — payment-step security bugs
- `designs/stitch/order-journey/` — 7 hi-fi redesign screens

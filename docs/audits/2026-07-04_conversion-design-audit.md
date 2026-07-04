# CircleTel Conversion & Design System Audit — 2026-07-04

**Scope:** DESIGN.md tokens, tailwind.config.ts, homepage (`components/home/HomeLanding20260607.tsx`), package results (`app/packages/[leadId]/page.tsx`), SEO town pages (`app/locations/[town]/page.tsx`), live site metadata.

**Job-to-be-Done:** *When I land on a CircleTel page from search or an ad, I want to confirm CircleTel works at my address and pick a package, so I can order internet without phoning around.*

Job steps: Define (am I in the right place?) → Locate (does it cover me?) → Prepare (compare packages) → Execute (order) → Confirm.

---

## What's working — don't break these

1. **Address-first funnel.** Homepage → coverage check → `/packages/{leadId}` filtered to what's actually available is the correct ISP conversion architecture. Most SA ISPs make users browse packages *before* the coverage check; you don't.
2. **The token foundation is genuinely good.** A dedicated accessible orange for text (`#AE5B16`), orange reserved as the sole CTA color, WhatsApp green quarantined, one type scale. This is better discipline than most design systems.
3. **Town SEO pages are conversion-aware**: coverage-conditional pitch, coverage badge, WhatsApp + coverage-check CTAs. This is the right template for intent-matched landings.
4. **Segment routing** (`?segment=home|wfh|business`) and offer-slug carry exist as plumbing for traffic-source personalization.

---

## Findings (severity 4 = blocker … 1 = minor)

### [Sev 3] Page titles/meta don't match landing intent — message match broken at the SERP
**Job step blocked:** Define
**Finding:** The homepage is `'use client'` with no metadata export, so every page inherits the root layout title: *"CircleTel — One Provider. One Bill. Your Office Runs."* — a B2B tagline. A consumer searching "uncapped home internet Centurion" clicks a B2B-titled result, or lands on a homepage whose hero defaults to the consumer segment while the `<title>`/SERP snippet said "office". Message mismatch between ad/SERP and page is a top documented cause of instant bounce.
**Principle:** JTBD forces of progress — weak *pull*, raised *anxiety* ("wrong company?"); Jakob's Law (users judge in the first seconds against expectation set by the link).
**Recommendation:** Per-route `generateMetadata` — consumer title for `/`, `/locations/*`, `/deals`; B2B title for `/business`, `/enterprise`. If SEO/ads carry `?segment=`, make the hero H1 and coverage-input placeholder match that segment *server-side* (or at least before paint), not just tab state.
**Impact:** Lower bounce from SEO traffic; higher coverage-check starts. **Effort:** Low–medium.

### [Sev 3] The hero's primary CTA scrolls to the form instead of *being* the form
**Job step blocked:** Locate
**Finding:** Hero CTA "Check coverage" scroll-jumps to the coverage card below the fold edge. The single business-critical action (address entry) is one interaction further than it needs to be, and on mobile the overlap card may sit fully below the fold.
**Principle:** Fitts's Law (distance to target) + friction analysis — every extra interaction before the commitment point costs completions.
**Recommendation:** Put the address autocomplete directly in the hero (the current floating card design works — move it up into the hero container). Keep "View packages" as secondary.
**Impact:** More coverage checks started per visit — the top of your funnel. **Effort:** Low.

### [Sev 3] Final CTA is `mailto:sales@circletel.co.za`
**Job step blocked:** Execute
**Finding:** The closing orange band's "Get my quote" opens the user's mail client. On mobile and on machines without a configured mail app this is a dead end; it's also untrackable and inconsistent with the WhatsApp-first support principle in DESIGN.md.
**Principle:** Nielsen #7 (efficiency) + forces of progress (anxiety/habit — composing a cold email is high-friction); your own design rule: "Include a WhatsApp contact path on every customer-facing page."
**Recommendation:** Replace with coverage check (consumer) or WhatsApp deep link / short lead form (business). Given the March 2026 campaign learning (leads died in follow-up), route quote requests into a tracked channel (Zoho ticket / coverage lead), never a mailbox.
**Impact:** Recovers bottom-of-page intent that currently evaporates. **Effort:** Low.

### [Sev 3] Package results page: choice overload, no guided recommendation
**Job step blocked:** Prepare → Execute
**Finding:** `/packages/{leadId}` shows up to 8 cards per tab across 4 service tabs (fibre/LTE/5G/wireless), and "auto-selects" the *first* package — an arbitrary default, not a recommendation. The user arrived saying "home / work-from-home / business" but that segment doesn't curate or rank the list.
**Principle:** Hick's Law (decision time and abandonment grow with options) + Tesler's Law (the system knows the segment and address; the user shouldn't do the filtering work).
**Recommendation:** Rank by segment fit and mark one card **"Recommended for [working from home]"** (navy featured treatment per DESIGN.md pricing-card spec). Collapse tabs the address doesn't support. Keep "show all" as the escape hatch.
**Impact:** Faster package selection, fewer stalls at the comparison step — likely the single biggest CRO lever in the funnel. **Effort:** Medium.

### [Sev 3] Two competing token systems — DESIGN.md is not what ships
**Job step blocked:** all (indirect — consistency and iteration speed)
**Finding:** Drift between the spec and the code:
- DESIGN.md: page background `#F9FAFB`, "never pure white". Homepage: `bg-white`.
- Ad-hoc colors not in any token set: `#F3F7FF`, `#DDE8FF` (business-proof section).
- `tailwind.config.ts` carries a whole **`webafrica` palette (pink!)**, "Secondary Palette" oranges (`burnt/warm/bright-orange`), legacy aliases, plus a parallel `ui.*` scale duplicating DESIGN.md's neutrals.
- Buttons: DESIGN.md says `rounded-xl` (20px); homepage uses `rounded-full` everywhere.
- H1: spec 3.75rem/700; homepage 5.375rem/extrabold/-0.04em.
**Principle:** Nielsen #4 (consistency); your own Rule 7 (one pattern, never a blend). Every drift makes the next page a coin-flip and makes A/B iteration noisy.
**Recommendation:** Decide which is canonical (the shipped homepage look is stronger — extrabold, rounded-full, tighter tracking), update DESIGN.md to match, then delete `webafrica`, secondary oranges, and legacy aliases from tailwind config so agents *can't* pick the wrong token. Add `#F3F7FF`/`#DDE8FF` as named tokens or replace with `primary-light`/neutral.
**Impact:** Consistent pages, cheaper/faster CRO experiments, on-brand agent output. **Effort:** Medium (mostly deletion).

### [Sev 2] Coverage-check failure = browser `alert()`
**Job step blocked:** Locate (error path)
**Finding:** `alert('Coverage check failed. Please try again.')` — no diagnosis, no alternative path, and the lead is lost.
**Principle:** Nielsen #9 (error recovery). Errors at the funnel's first commitment point deserve the most care, not the least.
**Recommendation:** Inline error state on the form with a WhatsApp fallback ("Can't check right now — WhatsApp us your address and we'll confirm within the hour") so a system failure still captures the lead.
**Impact:** Converts outage minutes into leads instead of bounces. **Effort:** Low.

### [Sev 2] Hero copy sells effort, not the offer
**Job step blocked:** Define
**Finding:** "Internet that works as hard as you do" is mood copy; price/speed anchors are below two full sections. SA ISP shoppers compare on **price × speed × uncapped × no contract** — your subhead has three of these but no price anchor.
**Principle:** Front-load value (first words carry the scan); forces of progress — a concrete offer strengthens *pull*.
**Recommendation:** Test a concrete hero: "Uncapped home internet from **R899/mo** — no contracts, R0 setup." Keep the current line as the business-segment variant.
**Impact:** Stronger SERP-to-hero scent, more coverage checks. **Effort:** Trivial (A/B — the `ab-test-setup` skill applies).

### [Sev 2] No WhatsApp path on the homepage
**Finding:** Town pages have WhatsApp CTAs; the homepage (per code read) has none — despite DESIGN.md mandating one on every customer-facing page and WhatsApp being your proven-cheapest channel (R41.80/conversation).
**Recommendation:** Ship the DESIGN.md floating WhatsApp button (fixed bottom-right, `#25D366`) site-wide via the marketing layout.
**Effort:** Trivial.

### [Sev 1] Segment/offer personalization is plumbing without payoff
`?offer=` slug goes to sessionStorage and the lead API ignores it (Plan 3 pending); segment changes only the input placeholder. Fine to defer, but note: attribution you don't persist can't inform the follow-up problem that killed the March campaign. Bump Plan 3's priority.

---

## Prioritized plan

**Fix now (low effort, direct funnel impact)**
1. Replace `mailto:` CTA with tracked channel (Sev 3)
2. Address input into the hero (Sev 3)
3. Per-route metadata / message match (Sev 3)
4. WhatsApp float site-wide (Sev 2)
5. Inline coverage-check error with WhatsApp fallback (Sev 2)

**Plan next (high impact, medium effort)**
6. Recommended-package ranking on `/packages/{leadId}` (Sev 3)
7. Token reconciliation: canonicalize shipped style into DESIGN.md, purge webafrica/legacy palettes (Sev 3)

**Quick wins (batch)**
8. Hero price-anchor copy A/B (Sev 2)
9. Persist offer slug on the lead (Sev 1 → feeds follow-up automation)

**Reconsider / defer**
- Full visual redesign or new palette: **not needed.** The orange/navy system is distinctive and conversion-appropriate (high-contrast single CTA color). The problem is drift and funnel mechanics, not the design language.

## Not verifiable from code — check in analytics/testing
- Actual fold position of the coverage card on common mobile viewports
- Whether GA4/conversion events fire on coverage-check start/complete and package select (no tracking calls seen in the audited components)
- Real bounce rate by landing page × source to confirm the message-match finding

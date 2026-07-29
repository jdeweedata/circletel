# CircleTel Homepage — Production Fix List

**Site:** https://circletel.co.za (marketing homepage — separate Next.js app, not this repo)
**Audit date:** 2026-07-12
**Owner:** Jeffrey De Wee
**Status:** Not started

Prioritized, implementation-ready fixes from the homepage audit. Work top to
bottom: items 1–4 are front-end only; item 5 needs a hosting/DNS change.
Suggested order: **1 + 2 together** (same component, biggest impact) → **4 → 3**
(quick wins) → **5** (host/DNS).

---

## Audit summary (what's already good)

- Fast: FCP ~0.96s, fully loaded ~1.1s, images lean AVIF (~174KB total).
- No console errors; all network requests return 200.
- Solid SEO base: single H1, meta description, og:image, `lang`, logical headings.
- Interactive elements are labeled for screen readers.
- Good mobile adaptation (top bar swaps to WhatsApp/Email icons).

The fixes below are the gaps, in priority order.

---

## 1. Cookie banner must not cover CTAs 🔴 P0 · ~1–2h

**Problem:** On mobile the banner overlaps "Find my plan" and fully hides "Use map"
and "View packages". On desktop it covers "View packages" and keeps overlapping
CTAs while scrolling (incl. the sticky "Check availability" bar). This blocks the
primary conversion path (coverage check → plan).

- [ ] Reduce the banner to a slim full-width bar pinned to the bottom (`fixed inset-x-0 bottom-0`), max ~64–80px tall — single line of text + buttons, not a large floating card over the hero.
- [ ] Add bottom padding/offset to the page (or hero) equal to the banner height while it's visible, so no CTA is ever occluded.
- [ ] Ensure the WhatsApp floating button and the sticky "Check availability" bar sit clear of the banner on mobile (stack or offset them).
- [ ] Set an intentional `z-index` so the banner is above content but the layout still reserves space for it.
- [ ] **Acceptance:** at 375px and 1280px, "Find my plan", "Use map", and "View packages" are all fully visible and tappable while the banner shows.

## 2. Add a "Decline" / "Manage" option to consent 🔴 P0 · ~2–3h

**Problem:** Consent only has "Accept" — no way to reject non-essential cookies.
POPIA (SA) expects a genuine choice; it's also a trust issue. *(Bundle with #1 — same component.)*

- [ ] Add a "Decline" (or "Reject non-essential") button next to "Accept".
- [ ] Add a "Manage preferences" option with categories: Necessary / Analytics / Marketing.
- [ ] Persist the choice (localStorage or cookie); do not re-show the banner once a choice is made.
- [ ] Gate analytics/marketing scripts so they only load **after** opt-in. Necessary cookies load regardless.
- [ ] **Acceptance:** a user can decline, the choice persists across reloads, and no non-essential tags fire before consent.

## 3. Add alt text to the 4 images missing it 🟠 P1 · ~30min

**Problem:** 4 of 6 images (hero + audience cards) have empty/missing `alt`.
Accessibility + image-SEO gap.

- [ ] Hero image → descriptive alt, e.g. `"Family using CircleTel home internet in the evening"`.
- [ ] "Home fibre" card → `alt="Home fibre"` (or a fuller description).
- [ ] "Work from home" card → `alt="Work-from-home connectivity"`.
- [ ] "Business" card → `alt="Business IT and connectivity"`.
- [ ] Any purely decorative image → intentional `alt=""`.
- [ ] **Acceptance:** every content image has meaningful alt; only decorative ones use `alt=""`.

## 4. Make the contact email consistent 🟠 P1 · ~15min

**Problem:** Header/hero shows `sales@circletel.co.za`; footer shows
`contactus@circletel.co.za`.

- [ ] Decide: one canonical address, OR clearly split "Sales: sales@…" vs "Support: contactus@…".
- [ ] Update the header `mailto:` link to match.
- [ ] Update the footer address to match.
- [ ] Update any contact schema / structured data if present.
- [ ] Confirm both inboxes are actually monitored.
- [ ] **Acceptance:** header, footer, and any structured data use the same address(es).

## 5. Resolve www vs non-www canonical mismatch 🟠 P1 · ~30min (+DNS/host)

**Problem:** Site served at `circletel.co.za` (non-www) but `<link rel="canonical">`
points to `https://www.circletel.co.za/`. If both hosts resolve without a redirect,
SEO signal splits (duplicate content).

- [ ] Choose one canonical host (non-www is simpler for a short domain).
- [ ] 301-redirect the other host to the canonical one at the hosting/edge layer.
- [ ] Make `<link rel="canonical">` self-referential to the host that actually serves.
- [ ] Align `og:url` and `sitemap.xml` with the canonical host.
- [ ] Set the preferred domain in Google Search Console.
- [ ] **Acceptance:** requesting the non-canonical host 301s to the canonical one, and canonical/og:url match the served URL.

---

## Final verification (run after all fixes)

- [ ] Mobile (375px): hero CTAs visible with banner; nav opens; coverage field usable.
- [ ] Desktop (1280px): no CTA overlapped by the banner at any scroll position.
- [ ] Consent: Accept and Decline both work and persist; non-essential scripts respect the choice.
- [ ] Lighthouse/axe: no missing-alt flags; accessibility score holds or improves.
- [ ] SEO: canonical resolves correctly; non-canonical host 301s.
- [ ] Manual: run one real coverage lookup end-to-end to confirm the funnel still returns plans.

## Notes

- Homepage is a separate Next.js + Tailwind app from this repo (`circletel-quotes-ui`).
- Items 1 & 2 share one `CookieConsent` component — build them together.
- During the audit I did **not** click "Accept" on cookies (would consent on your
  behalf) and did **not** submit the coverage form (takes a personal address), so
  the coverage lookup itself is untested — verify it in the final pass above.

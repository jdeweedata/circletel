# Agent Context — What AI Agents Know About CircleTel

This file captures project-specific knowledge that AI agents accumulate while working in this codebase. It supplements the human-written files (CLAUDE.md, AGENTS.md, client-context.md) with agent-discovered facts.

## Codebase Facts

### File Locations
- Project root: `/home/circletel`
- AGENTS.md: project root (Hermes context)
- CLAUDE.md: project root (Claude Code context)
- DESIGN.md: project root (design system)
- Architecture docs: `docs/architecture/SYSTEM_OVERVIEW.md`
- Rules: `.claude/rules/` (19 files)
- DB migrations: `supabase/migrations/`
- Product docs: `products/wholesale/dfa/` (DFA pricing and products)
- Plans: `docs/plans/`

### Key Commands
- `npm run dev:memory` — dev server (8GB heap)
- `npm run type-check:memory` — type check (4GB heap)
- `npm run build:memory` — production build (8GB heap)
- Scripts needing .env.local: `set -a && source .env.local && set +a && npx tsx scripts/...`

### Stack
- Next.js 15 App Router, React 18, TypeScript, Tailwind CSS, shadcn/ui
- Supabase/PostgreSQL with PostGIS
- Zustand, TanStack Query
- Integrations: MTN coverage APIs, Google Maps, Netcash payments, Zoho, Resend, Strapi CMS

### Database
- Supabase project: `agyjovdugmtopasyvlng`
- Invoice table: `customer_invoices` (NOT `invoices`)
- Key tables: `service_packages`, `coverage_leads`, `customers`, `consumer_orders`, `admin_users`

## Discovered Quirks

_Add quirks as they're discovered — things that would trip up the next agent._

Format:
```
### YYYY-MM-DD: Quirk
- **What:** Description of the unexpected behavior
- **Why:** Root cause if known
- **Workaround:** How to handle it
```

## Agent-Discovered Patterns

_Patterns discovered by agents while working in this codebase._

Format:
```

### 2026-06-16: SkyFibre Combined Orderability Gate
- **Context:** SkyFibre checkout must not rely on Tarana/TCS coverage alone because MTN CSP can reject otherwise covered addresses.
- **Pattern:** Use `POST /api/coverage/skyfibre/orderability` or `lib/coverage/skyfibre/checkSkyFibreOrderability` to combine TCS BN/RN evidence with MTN CSP orderability. CSP credentials must come from `MTN_CSP_USERNAME`, `MTN_CSP_PASSWORD`, and optional `MTN_CSP_API_BASE`.
- **Discovered by:** Codex
- **Notes:** 50/100 Mbps use CSP `feasibilityOld`; 200 Mbps uses `feasibilityCheck`. CSP `orderable` is the final orderability authority when TCS has an online/covered BN; active BN with zero active RN evidence lowers confidence and should show a site-survey/install caution, but does not by itself block CSP-orderable coverage.
- **Admin UI:** `/admin/coverage/checker` now includes a SkyFibre Orderability card under Tarana results and auto-runs the combined gate at 100 Mbps after each Tarana address check. The page shows a "Final Sales Decision" banner that treats the combined TCS + CSP result as the sales authority, renames the old coverage verdict to an RF signal estimate, blocks package recommendations unless the gate is `orderable`, and treats RF-vs-TCS BN mismatches as manual review. Admins can still switch to 50/100/200 Mbps and re-run manually. `/admin/sales/feasibility` single-site review also shows the same card for selected SkyFibre/Tarana packages. Both call the combined endpoint with `segment: "business"` for MTN CSP validation.
- **RPC quirk:** The deployed `find_nearest_tarana_base_station` RPC may omit `device_status`. `lib/coverage/mtn/base-station-service.ts` hydrates missing BN status from `tarana_base_stations` before deciding whether the BN is online; otherwise online BNs can be misread as offline and CSP will be skipped.

### 2026-06-28: Offer Spine storefront review caveats
- **Context:** Review of `docs/superpowers/specs/2026-06-28-offer-storefront-read-design.md` for the planned public `/offers` catalogue.
- **Pattern:** Treat public offer pricing as a separate sanitized contract from internal snapshots. `service_packages` prices are commonly stored/displayed as ex-VAT in the DB while MTN and hardware normalized products can already be incl-VAT, so `/offers` must define/normalize VAT basis before exposing JSON-LD or UI prices.
- **Guard caveat:** `offer_components.source_type = 'service_package'` is not enough to prove the underlying source table because Phase 0 maps both `admin_products` and `service_packages` to that component type. Use internal `offers.source_uid` prefixes (for example `service_packages:*`) when the source table matters.
- **Staleness quirk:** `lib/offers/staleness.ts` currently appears only in tests; `recompute-offer-pricing.loadDraft` sets `sourceUpdatedAt` from `offers.updated_at`, but changing that alone will not create an admin stale signal unless a read/admin path actually calls `isSnapshotStale`.
- **Discovered by:** Codex

### 2026-06-28: Consumer Checkout Fee Split
- **Context:** Consumer/Vox-style checkout no longer uses the old "R1 validation charge credited back" copy.
- **Pattern:** New checkout orders use `ORDER_PROCESSING_FEE_AMOUNT` (R149.00) from `lib/payments/payment-amounts.ts`; order creation stamps this amount server-side, Netcash initiation derives it from the order row and describes it as "CircleTel - Order processing fee", and the webhook marks that R149 payment as `confirmed` without activating service. The R1 constants/helpers remain intentionally for legacy rows and dashboard/payment-method validation flows only.
- **Discovered by:** Codex

### 2026-06-30: Admin-Assisted B2B Manual Intake Direction
- **Context:** Planning for admin-assisted B2B onboarding/manual intake from documents received by email, covering Unjani and future business customers.
- **Pattern:** Manual intake must support both selecting an existing B2B/Unjani customer and creating a new pending business customer shell. New shells must stay non-billable until documents are approved, debit-order banking details are captured, the customer accepts the Service Order through a secure signoff link, a final Service Order PDF is issued, and the service is active/billable.
- **Plan:** Executable implementation plan saved at `docs/superpowers/plans/2026-06-30-admin-assisted-b2b-onboarding.md`.
- **Discovered by:** Codex

### 2026-06-30: Staging Runner Disk Pressure Cleanup
- **Context:** Staging deploy run `28447363810` failed before checkout because `/dev/sda1` had only ~3.4GB free after cleanup, below the workflow's 4GB guard.
- **Pattern:** First safe reclaim batch is runner workspace/cache plus merged worktrees: remove `/home/actions-runner/_work/circletel/circletel`, `/home/actions-runner/.next-cache`, `/home/actions-runner/node_modules.tar`, `/home/actions-runner/.nm-cache-key`, and merged worktree `/home/circletel/.worktrees/admin-assisted-b2b-onboarding`. This reclaimed ~14GB and left `/` at 18GB free.
- **Discovered by:** Codex

### 2026-06-30: Product Docs Residential Pricing Drift
- **Context:** Read-through of `products/` found conflicting SkyFibre Home residential references.
- **Pattern:** Treat `products/connectivity/residential/SkyFibre_Residential_Product_Document_v3_0.md`, the standalone March 31 DOCX files, and `skyfibre_home_residential_products_v2_0.json` as the corrected residential sources for Plus/Max: 50/12.5 Mbps at R899 incl. VAT and 100/25 Mbps at R999 incl. VAT, both 4:1 asymmetric. Older catalogue/spec files still show outdated higher/ex-VAT-style pricing, and the Ultra DOCX exists at R1,299 incl. VAT but is absent from the JSON.
- **Discovered by:** Codex

### 2026-06-30: Offer-Driven No-Code Product Publishing Direction
- **Context:** User wants to stop coding a bespoke Next.js frontend page for every new product, hardware sale, bundle, or solution.
- **Pattern:** Treat `Offer` as the customer-buyable commercial source, then attach marketing/content/channel publishing metadata to Offers. Public website pages, campaign landing pages, Google Shopping, Facebook/Meta catalog, WhatsApp sales flows, and partner/admin quote flows should consume published Offers instead of each querying product source tables directly. Source product tables remain systems of record; CMS/page-builder blocks should reference Offer IDs so sales and marketing can publish pages/promotions without manually duplicating price, VAT, availability, or fulfilment rules.
- **Discovered by:** Codex

### 2026-06-30: Astro CMS Fit Decision
- **Context:** User asked whether Astro should be hosted in this repo to make CMS/product pages easier.
- **Pattern:** Astro is viable only as a separate marketing/static-content zone with unique path ownership, but the recommended first move for CircleTel is Next-native dynamic CMS pages because the repo already has `pb_pages`, CMS block renderers, admin CMS builder APIs, Offer public read code, auth, Supabase, checkout, and channel/order flows in Next. Do not put Astro inside the existing Next `app/` tree. If Astro is adopted later, isolate it as a monorepo app or separate container under a route prefix such as `/blog/*`, `/resources/*`, or `/campaign-static/*`, and keep buyable products/pricing/stock/checkout driven by Next Offers.
- **Discovered by:** Codex

### 2026-06-30: Product CMS Should Be Template-Driven First
- **Context:** User clarified that the existing CircleTel CMS/page builder is not polished or fully functional today, and showed Teljoy-style storefront, product detail, category, modal, and campaign examples as the target.
- **Pattern:** Treat the current CMS as an unfinished prototype, not the launch dependency. The recommended product-publishing path is a template-driven Product Publishing Studio: Offer data supplies commercial truth, curated templates render storefront/category/product/campaign pages, AI generates draft copy/assets from approved Offer context, and marketing approves/schedules publication. Avoid a broad freeform drag-and-drop rebuild as Phase 1; Teljoy-like commerce pages are mostly structured templates plus promotional creative, not arbitrary page composition.
- **Discovered by:** Codex
### YYYY-MM-DD: Pattern
- **Context:** When this applies
- **Pattern:** The approach that works
- **Discovered by:** Hermes / Claude Code
```

## Known State (updated 2026-05-24)

### DFA Integration
- CircleTel has active DFA reseller agreement
- **GNNI at Teraco data centres** — NOT at a customer building
  - Teraco JB1 (Isando, Johannesburg): cross-connect Echo SP Cabinet J_CH1_CAR065 → MTN Cabinet J_CH5_D16, 131.3m OS2 SM fibre, installed 14 Aug 2025
  - Teraco CT1 (Cape Town): cross-connect Echo SP Cabinet C_DC3_D02 → MTN, installed 15 Aug 2025
  - Echo SP provides Arista L2 switches (no PPPoE termination); MTN provides BNG (Huawei NE8000M14 JHB / S9312 CPT)
- **DFA Business Broadband GNNI**: 1Gbps, NRC R6,050 + MRC R898/mo, upgrade path to 10G (R12,000 NRC + R4,500/mo)
- **MTN FWB NNI** (separate): 2x 1Gbps ports, R7,000 NRC + R2,500 MRC each (includes 100Mbps backhaul)
- **BGP**: AS 327693 (CircleTel / Echo SP), sessions terminate on MTN BNG
- **IP pools**: JHB 100.66.160.0/20 (4,094 usable), CPT 100.66.176.0/20 (4,094 usable)
- **RADIUS/AAA**: 3 servers (102.220.62.161-163), realm circletel.co.za, proxy via echosp.link
- **VLANs**: AAA VLAN (RADIUS) + WWW/IP Transit VLAN (subscriber traffic)
- **Scale**: 1G GNNI supports ~100 subscribers; 10G upgrade at 100+ subs; IP Transit upgrade at 200+ subs
- 1 active broadband link (first customer)
- DFA GIS portal assessed — 49,531 addressable buildings nationally
- Near-Net buildings (21,830) are pre-qualified leads DFA has already surveyed
- Products: BizFibreConnect (25/50/100/200 Mbps)
- FY27 wholesale pricing effective 01 April 2026 — margins compressed
- Pricing review recommended: R1,999/R2,699/R3,299/R4,999

### Unjani
- 22 sites deployed (10 dead, 7 performing, 5 growing)
- R786.46/site OPEX
- Board-gated at 50 sites
- TDX 45-60 day payment lag
- See: `docs/plans/2026-05-24-mrr-growth-strategy.md`

### Financial Reality
- Cash: R86K, Burn: R198K/mo, Runway: 13 days
- Revenue: ~R35K/mo
- R463K intercompany receivables
- See: `memory-os/long-term/client-context.md`

### Team
- Jeffrey (MD, sole sales), TK (marketing), Tamsyn (back office), Jarryd (ops)
- No dedicated sales person — Jeffrey closes ~4/mo

### Second Brain (Knowledge Base)
- Location: `/root/second-brain/` (Claude Code-managed knowledge base)
- Wiki index: `/root/second-brain/knowledge-base/wiki/index.md`
- Raw pages: `/root/second-brain/knowledge-base/raw/pages/`
- Contains: CircleTel business analysis, unit economics, profitability diagnosis, market benchmarks, competitor intelligence
- **Competitor landscape (2026-06-19):** [[sa-isp-competitor-landscape-june-2026]] — full intel on Vox, SuperSonic, Afrihost, WebAfrica with pricing, product rules, moats, threats, and 10 competitive plays

# Architectural & Business Decisions

> Long-term memory: Record every significant decision with reasoning so Claude never re-debates settled choices.

## Format
[YYYY-MM-DD] Decision Title
Context: Why this came up
Decision: What was chosen
Reasoning: Why this option won
Alternatives rejected: What was considered and discarded
Impact: What this affects going forward

---

### [2025-10-24] Database: Use `customer_invoices` not `invoices`
**Context**: Billing table naming caused confusion across multiple sessions
**Decision**: The canonical billing table is `customer_invoices` — never use `invoices`
**Reasoning**: `invoices` doesn't exist in the Supabase schema. Previous sessions wasted time debugging queries against the wrong table name.
**Alternatives rejected**: Renaming the table (too risky with existing references)
**Impact**: Every billing query, API route, and component must reference `customer_invoices`

### [2025-10-24] Stack: Next.js 15 App Router + Supabase + Tailwind + shadcn/ui
**Context**: Initial platform architecture selection
**Decision**: Next.js 15 (App Router), TypeScript strict mode, Supabase (PostgreSQL), Tailwind CSS, shadcn/ui, Zustand + React Query
**Reasoning**: App Router for server components and streaming. Supabase for auth + RLS + edge functions in one. shadcn/ui for accessible, customizable components without vendor lock-in.
**Alternatives rejected**: Pages Router (legacy), Firebase (vendor lock-in), Prisma (extra ORM layer when Supabase client suffices)
**Impact**: All new features follow App Router conventions. No Pages Router patterns.

### [2025-10-24] Auth: Three-context pattern
**Context**: Admin dashboard needs granular permissions across 14 modules
**Decision**: Three-context auth with header + cookie checks and RBAC (100+ permissions, 17 role templates)
**Reasoning**: Single auth context was insufficient for admin vs customer vs API access patterns
**Alternatives rejected**: Simple JWT-only auth (insufficient for RBAC granularity)
**Impact**: See `.claude/rules/auth-patterns.md` for implementation details

### [2025-10-24] Coverage: 4-layer fallback system
**Context**: SA coverage data is unreliable from any single provider
**Decision**: MTN WMS → MTN Consumer → Provider APIs → Mock data fallback chain
**Reasoning**: No single API has complete coverage data for SA. Fallback ensures users always get a result.
**Alternatives rejected**: Single provider API (too unreliable)
**Impact**: Coverage components must handle all 4 states gracefully

### [2025-10-24] Payments: NetCash Pay Now
**Context**: SA market requires diverse payment options
**Decision**: NetCash Pay Now integration supporting 20+ payment methods
**Reasoning**: Best coverage of SA-specific payment methods (EFT, Ozow, SnapScan, etc.)
**Alternatives rejected**: Stripe (limited SA support), PayFast (fewer methods)
**Impact**: Payment flow in `components/checkout/InlinePaymentForm.tsx`

### [2025-10-24] Deployment: 2-branch strategy
**Context**: Need safe deployment pipeline
**Decision**: Feature branches push to staging first, then PR to main
**Reasoning**: Prevents broken deploys to production.
**Alternatives rejected**: Direct to main (too risky), 3-branch with develop (unnecessary overhead)
**Impact**: `git push origin feature/xyz:staging` → test → `gh pr create --base main`

### [2025-10-24] Products: Dual table architecture
**Context**: Product data needs to serve both admin and customer-facing views
**Decision**: Two tables (`products` + `service_packages`) that must stay in sync (known tech debt — Roadmap 2.2)
**Reasoning**: Historical architecture decision. Sync solution is Phase 2 priority.
**Alternatives rejected**: Single table (would require major refactor)
**Impact**: Any product update must consider both tables until sync is built.

### [2026-05-14] Tarana Sync: TMQ v1 → NQS v1 devices endpoint
**Context**: TMQ v1 `/api/tmq/v1/radios/search` returns 500 since late 2025, breaking the nightly tarana-sync Inngest function. TMQ v2/v3/v4/v5 search endpoints don't exist (404).
**Decision**: Replace all TMQ-based calls with NQS v1 `GET /api/nqs/v1/operators/219/devices?type={BN|RN}&offset=N`
**Reasoning**: NQS v1 is the only working endpoint that returns device data with full hierarchy (region, market, site, cell, sector). Verified via probe scripts and smoke tests — 697 BNs fetched successfully with correct ancestry mapping.
**Alternatives rejected**: TMQ v2-v5 (don't exist), TNI v2 sectors/devices (requires knowing sector IDs upfront, no fleet-wide listing)
**Impact**: `lib/tarana/client.ts` rewritten — `searchRadios()`, `mapNqsDeviceToRadio()`, `getDeviceCounts()`. NQS pagination is fixed at 10 items/page (limit param ignored). RN visibility is retailer-scoped (~9 RNs vs 8,600+ operator fleet). Ancestry uses nested objects (`ancestry.region.name`) not flat fields (`ancestry.regionName`).

---

### [2026-05-24] Supplier moat is the core competitive advantage
**Context**: Competitive analysis of WebAfrica, Afrihost, Vox vs CircleTel
**Decision**: CircleTel's unique advantage is multi-distributor hardware supply (7,438 products, 5 distributors). No ISP competitor can bundle internet + hardware + IT management.
**Reasoning**: Competitors are pure connectivity plays. Hardware bundling creates stickier customers and higher ARPU through Office-in-a-Box bundles.
**Alternatives rejected**: Consumer-only positioning (commodity market, low margins)
**Impact**: All growth strategy flows from hardware bundling capability. OiaB is the flagship product.

### [2026-05-24] Unjani is a separate P&L, not MRR
**Context**: Previous models treated Unjani as +R9-13K/month revenue. Actual per-site OPEX (R786.46) exceeds per-site revenue (R738) at current ad rates.
**Decision**: Unjani is a separate business unit with its own P&L. The R499 MTN wholesale cost sits inside the MSC shortfall. Non-MTN OPEX (R288/site) is a separate cost line.
**Reasoning**: Treating Unjani as MRR inflated the baseline and hid the operating loss.
**Alternatives rejected**: Bundling Unjani into CircleTel MRR (obscures the true cash position)
**Impact**: Combined cash flow models now show three streams: existing ops, Unjani, and OiaB. MSC shortfall of R18,652/month covers the MTN wholesale component.

### [2026-05-24] R10K marketing budget: 100% B2B, zero consumer
**Context**: R10K/month marketing budget with one full-stack marketer (TK)
**Decision**: All R10K goes to B2B OiaB campaigns targeting medical practices and accounting firms. Consumer is organic/referral only. No split budget.
**Reasoning**: B2B OiaB generates R10-35K MRR per R10K spend (0.3-1 month payback). Consumer generates R2.4-8K MRR (1.5-4 month payback). Splitting underfunds both.
**Alternatives rejected**: 60/40 B2B/consumer split, consumer-first campaign
**Impact**: Marketing section of MRR plan is 100% B2B. First campaign targets medical niche ("Your Practice Runs").

### [2026-05-24] Hardware lease separation from service contract
**Context**: Competitors market month-to-month no-lock-in. But OiaB requires hardware investment that needs protection.
**Decision**: Two contracts: Service Agreement (month-to-month, 30-day notice) + Hardware Rental Agreement (36-month, return hardware or pay 50% of remaining lease).
**Reasoning**: Marketing says "no lock-in on your internet" (true for service). Hardware investment is protected by separate lease. Follows Dell Financial Services / HP Financial Services model.
**Alternatives rejected**: 12-month minimum on everything (fights market trend), pure month-to-month (underwater on hardware at month 8)
**Impact**: Hardware lease template needed before first OiaB sale.

### [2026-05-24] No warm prospects — pipeline-first month 1
**Context**: Jeffrey has no existing OiaB prospects. Previous ramp assumed warm leads.
**Decision**: Month 1 is pipeline building (cold outreach + marketing campaigns). First deals close late month 1 / early month 2. Grounded 12-month target reduced from R1.25M to R657K.
**Reasoning**: Marketing campaigns take 2-4 weeks to generate leads. Cold outreach (5-10 medical practice visits/week) yields 1-2 deals/month at 5% conversion.
**Alternatives rejected**: Assumed warm leads (fantasy), mass consumer campaign (underfunded at R10K)
**Impact**: Ramp model reworked. Jeffrey's week 1 = build target list of 50 practices + begin cold outreach.

### [2026-05-24] Sell-first, buy-later model for COD hardware
**Context**: Scoop and Rectron are COD accounts (no credit terms). Arlan provides 30-day credit on their hardware.
**Decision**: Client pays 75% deposit upfront → order COD hardware from Scoop/Rectron → deliver in 5-7 days. Arlan routers on 30-day credit with zero upfront float.
**Reasoning**: Eliminates working capital requirement for hardware. 75% deposit covers COD costs. Arlan credit + commissions self-fund the router component.
**Alternatives rejected**: Pre-purchase buffer stock (requires R50-80K cash), distributor credit application (Scoop/Rectron don't offer it)
**Impact**: Per-client hardware float reduced to R700-1,100. Combined with Arlan commissions, OiaB launch is near cash-neutral.

### [2026-05-24] March 2026 Facebook campaign: ads work, follow-up failed
**Context**: Marlbank (Vaal) campaign — 28 Mar to 2 Apr 2026. R1,045 spent, 25 conversations, 30+ tickets, 0 conversions.
**Decision**: The campaign validated demand (R41.80/conversation, viable at R899 ARPU). The failure was operational: 60% of leads got zero follow-up, 67% of checked leads were outside coverage area. Never run another campaign without fixing lead workflow first.
**Reasoning**: The ads are not the problem. Tamsyn at 50% allocation carries 64% of all tickets with no sales/support prioritization. Leads died in her queue.
**Alternatives rejected**: "Campaign didn't work — try different creative" (wrong diagnosis)
**Impact**: Before any new ad spend: (1) fix Zoho priority queues, (2) implement lead response SLA, (3) automate coverage check via webhook, (4) recover the 30 stale leads.

### [2026-05-24] Cost reduction before growth investment
**Context**: R198K/month burn, R86K cash, 13 days runway. R463K trade receivables are intercompany — not collectible.
**Decision**: The three documented cost reductions (Anton -R11K, Ashwyn -R12.5K, NewGen shared services -R50K) must be actioned before any growth spend. These extend runway from 13 to 21+ days.
**Reasoning**: Growth investments (R500 geo-test, automation build, commission agents) are irrelevant if the business runs out of cash before they ship.
**Alternatives rejected**: Growth-first approach (runs out of cash), collection of R463K (it's intercompany, not external debt)
**Impact**: Monday morning priority 1 = three cost reduction conversations with NewGen. Priority 2 = recover March leads. Priority 3 = confirm Unjani billing.

> **Rule**: When a new architectural decision is made, add it here BEFORE implementing. Future sessions read this first.

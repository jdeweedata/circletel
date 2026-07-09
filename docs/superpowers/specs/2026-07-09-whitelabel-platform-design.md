# Whitelabel ISP Platform — Baseline Architecture & Productization Design

**Date:** 2026-07-09
**Status:** Baseline (approved design; each phase gets its own spec → plan → implementation cycle)
**Author:** Jeffrey + Claude Code (brainstorming session)

---

## 0. Context & Decision Summary

CircleTel runs on a custom-built platform: Next.js 15 monolith (~254 pages, 40+ admin
sections, ~56 API route groups, 102 production dependencies), Supabase, NetCash Pay Now,
Zoho CRM/Desk/Books, MTN + supplier integrations, deployed via Coolify on a VPS.

The strategic question examined: should CircleTel adopt a commercial OSS/BSS platform
(Splynx, Gaiia), or productize its own platform as a whitelabel ISP-in-a-box that other
operators could run — with CircleTel as tenant #1?

**Decision: productize our own platform (whitelabel), instance-per-tenant.**

Build-vs-buy findings that informed this:

- **Splynx**: entry license ~US$220/mo (≈R4,000/mo) for up to 400 subscribers, ~$0.55/sub
  above that. Replaces billing/CRM/provisioning but none of CircleTel's genuine moat
  (supplier catalogue of 7,438 products, coverage aggregation, CPQ, Unjani workflows).
  NetCash debit orders would need a custom payment-gateway add-on.
- **Gaiia**: targets mid-market North American fiber operators ("a few thousand to a few
  hundred thousand subscribers"). Not a realistic candidate at CircleTel's scale. Ruled out.
- CircleTel's realistic 12-month scale is 200–500 active subscribers — the range where
  licensing is affordable but migration cost/risk outweighs benefit, and where the custom
  platform's differentiators matter most.

**Whitelabel intent is directional — no external prospect exists yet.** Therefore: every
piece of work must pay for itself for CircleTel's own operations even if no tenant ever
signs. Architecture keeps the whitelabel door open; business demand pays for walking
through it. No speculative build-out.

Five pain areas drive the work (all confirmed live, not theoretical):

1. Billing & collections fragility (largest incident history)
2. Promotions require developer work and deploys
3. Non-technical staff blocked without developer help
4. Feature velocity / deploy risk (monolith sprawl, ~295 pre-existing type errors)
5. Database security and third-party integration friction

Five user roles must be able to operate the platform without a developer: finance/billing,
sales/marketing, ops/onboarding, support, and executives/managers.

---

## 1. Target Architecture

One codebase, **instance-per-tenant**. CircleTel today is simply "tenant #1." A future
tenant is the same Docker image deployed with different configuration and its own
Supabase project.

```
┌─────────────── One codebase (Next.js 15 monolith stays) ───────────────┐
│                                                                        │
│  Storefront (public)        Admin Console            Help Center       │
│  coverage → order → pay     5 role workspaces        user docs (/help) │
│         │                        │                        │            │
│  ═══════╪════════════ TENANT CONFIG LAYER ═══════════════╪═══════════  │
│         │   lib/tenant/ — the ONLY source of brand,      │             │
│         │   contacts, credentials, feature flags         │             │
│  ═══════╪══════════════════════╪═════════════════════════╪═══════════  │
│                                                                        │
│  Domain Core (lib/)                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐                  │
│  │ Billing  │ │  Offers  │ │  Orders/ │ │ Coverage/ │  ← the seams     │
│  │  Engine  │ │  Engine  │ │Onboarding│ │  Catalog  │                  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬──────┘                  │
│       └────────────┴─── Integration Gateway ──┴────────┐               │
│            NetCash │ Zoho │ MTN │ Suppliers │ Resend │ WhatsApp        │
└────────────────────────────────────────────────────────────────────────┘
   Per tenant: 1 app deployment + 1 Supabase project + 1 domain + 1 env set
   Migrations applied to every tenant DB by the deploy pipeline
```

Key properties:

- **The monolith is NOT split into microservices.** At 4.5 FTEs that is the wrong move.
  Module boundaries *inside* the monolith become the product's architecture. (This
  supersedes the earlier May-2026 idea of splitting into 3 services.)
- **Physical data isolation between tenants** (separate Supabase projects) — the cheapest
  isolation model and a genuine selling point to ISPs. It also sidesteps the current
  service-role-heavy RLS posture at the tenant boundary.
- **Shared multi-tenant SaaS (one DB, `tenant_id` everywhere) is explicitly rejected for
  now** — it would require retrofitting tenant scoping + RLS across 100+ tables and all
  API routes (6–12 months of refactor at high regression risk to live billing). The
  tenant-config layer is designed so this remains reachable later: all config reads flow
  through one module, so switching from env-driven to tenant_id-driven touches that
  module, not 254 pages.

**Error handling & observability baseline (applies to every seam):** every domain
mutation writes to a `platform_events` table (actor, entity, before/after, source).
Failures alert through one `notify()` service (generalizing the existing finance-email
alert pattern). Operations become auditable instead of vibes.

---

## 2. Tenant Config Layer (the whitelabel enabler)

A single module, `lib/tenant/`, is the only legal source of identity and credentials.

**Contents:**

- **Branding**: platform/company name, logo, color tokens (DESIGN.md tokens become
  per-tenant data feeding CSS variables), email/WhatsApp sender identities, legal entity
  details, T&C templates.
- **Contacts**: support numbers, WhatsApp lines, support hours (currently constants per
  `.claude/rules/contact-details.md` — they move here).
- **Credentials**: NetCash keys, Zoho tokens, MTN session, Resend key — resolved through
  `getTenantConfig()`, sourced from env vars (secrets) plus a `tenant_config` DB table
  (non-secret, admin-editable settings).
- **Feature flags**: which modules a tenant runs (a future tenant may have no Unjani
  module, no Zoho).

**Rules:**

1. No component or API route reads `process.env` for identity/branding or hard-codes
   brand strings. Everything goes through `getTenantConfig()`.
2. **De-CircleTel-ification is incremental, not big-bang**: a CI grep gate counts
   hard-coded `CircleTel` literals in `app/`, `components/`, `lib/` and **fails only if
   the count increases**. Touched files migrate opportunistically; the number only goes
   down.
3. No hard host assumptions (see §12): object storage, email, queues resolve through
   config/adapters.

---

## 3. Seam 1 — Billing Engine

The #1 incident source (double debits, missed invoices, reconciliation writing to
nonexistent columns, schema drift) becomes the product's flagship claim, so it gets the
strictest boundary.

- `lib/billing/engine/` is the **only writer** to billing tables. Cron routes, admin
  actions, and webhooks all call the engine; nothing else touches `customer_invoices` or
  payment tables directly.
- An explicit **invoice state machine** (draft → issued → collecting → paid/failed →
  reconciled/credited) with illegal transitions rejected in code. The class of bug where
  a reversal and a re-collection disagree becomes structurally impossible.
- **Collection rail abstraction**: NetCash is an adapter behind a `CollectionRail`
  interface. Essential for whitelabel (a future tenant may bank elsewhere) and the home
  of the NetCash guards (R1,500/item line limit, R20,000/day daily limit, action-date
  cut-off rules).
- **Finance workspace**: the billing person runs month-end — generate, review, submit
  batch, reconcile, chase failures — entirely from admin.
  **Success criterion: one full month-cycle with zero developer scripts.**

**Testing:** a billing **simulation harness** replays a synthetic month (mixed
anniversaries, pro-ratas, failures, reversals, credit notes) against the engine and
asserts the ledger balances. Real tests for the area where mocked tests have repeatedly
proven nothing.

---

## 4. Seam 2 — Offers & Promotions as Data

Builds directly on the shipped Offer Spine Phase 0 tables (`offers`, `offer_components`,
`offer_pricing_snapshot`).

- **Offer Manager** in admin: create/edit offers, attach components, set pricing with
  effective dates, schedule start/end, optional promo codes, publish/unpublish.
  A promotion becomes a 5-minute admin action — no deploy.
- **Storefront reads offers, never hard-coded prices**: package pages, deals pages, and
  checkout resolve price through the offer engine. The engine enforces the margin
  guardrails (`.claude/rules/margin-guardrails.md`) — a discount below floor requires an
  approval flag, in code, not in a prompt.
- **Campaign surfaces**: homepage banner, deals rail, and promo landing content driven by
  the same offer records plus a light content slot. Marketing publishes a
  Black-Friday-style campaign without a deploy.
- **Price provenance**: every price shown to a customer traces to a pricing snapshot ID —
  the audit answer to "what price did we promise this customer in March."

---

## 5. Seam 3 — Integration Gateway

Today each integration is bespoke (Zoho token quirks, MTN session refresh, NetCash
parameter traps — each solved differently). Target: `lib/integrations/core/` defines one
shape.

- **Adapter contract**: `authenticate() / healthCheck() / capabilities`, credentials
  resolved via the tenant config layer.
- **One webhook intake pattern**: signature verification, raw-payload logging, idempotency
  key, then dispatch. Every provider webhook goes through it (structurally closes the
  unsigned-eMandate-webhook audit finding).
- **Sync-job wrapper**: retries, rate-limit backoff (the Zoho lesson), structured run logs
  to an `integration_runs` table.
- **Integrations dashboard** (grow the existing `app/admin/integrations`): per-provider
  connection status, last successful sync, recent errors, re-auth action. This page is
  what a future tenant's admin sees when *they* connect *their* Zoho.
- Per-tenant enable/disable of integrations lives here (feature flags from §2).

**"Easy third-party integration" then means: new provider = one adapter folder + one
registry entry + one doc page.**

---

## 6. Seam 4 — Role-Scoped Admin

The 40-section admin becomes five **workspaces**, driven by a feature registry.

- Every admin section is registered with: route, roles allowed, and maturity
  (`stable | beta | internal | hidden`). **Navigation is generated from the registry** —
  half-finished screens are invisible to non-dev roles instead of landmines.
- Workspaces:
  - **Finance** — billing engine UI (§3): batches, reconciliation, invoices, failures.
  - **Sales/Marketing** — Offer Manager (§4), leads, campaigns.
  - **Ops/Onboarding** — vetting, installs, fulfilment (the most complete area today).
  - **Support** — customer 360: services, invoices, diagnostics, Zoho Desk tickets.
  - **Executive** — read-only KPI dashboard: MRR, collections rate, churn, pipeline.
- RBAC builds on the existing `admin_users` roles. The registry doubles as the per-tenant
  module switch.

---

## 7. Security Baseline (non-negotiable for a sellable platform)

Whitelabeling means selling trust. Known items become a tracked burn-down list:

- 2026-06-11 audit criticals: unauthenticated customer routes (IDOR), unsigned webhooks,
  committed Google keys.
- Open Supabase advisor items: public `installation-documents` / `site-photos` buckets,
  anon-writable hardware catalogue, `quote_acceptance_links` anon-read-all.
- Still-owed Zoho token rotation.

Structural rule going forward: **every new API route declares its auth context
explicitly** (public / customer-session / admin-role / service), enforced at review.

The §10 maturity gate requires this list at zero and Supabase advisors clean.

---

## 8. Documentation System (per-feature, dev + user)

Two audiences, two surfaces, one rule.

- **Developer docs** live in-repo (`docs/`): architecture per seam, integration guides
  (using the established Wrong-vs-Correct table pattern), API reference for routes as they
  are touched, and a **tenant setup runbook** — the document that must be good enough to
  stand up instance #2 unaided.
- **User docs** live **in the product** at `/help`: MDX articles per workspace task
  ("run a debit batch", "launch a promotion", "vet a document"), themable per tenant —
  the help center itself is a whitelabel feature. Executives get a "reading your
  dashboard" page.
- **The rule — Definition of Done includes docs**: a feature PR that changes user-facing
  behavior ships the matching help article; one that changes APIs/architecture ships the
  dev doc. Enforced via PR template checklist + review gate (the `api-docs-writer` agent
  drafts; a human approves).
- A user-facing **changelog** page is generated from release notes so tenants (and
  CircleTel's own staff) see what changed. It doubles as the update-channel narrative for
  tier 2/3 deployments (§12).

---

## 9. Support Channels

- **End-user / tenant-staff support:**
  - Help center (§8) as first line.
  - In-admin "report a problem" that creates a Zoho Desk ticket with context
    auto-attached (page, tenant, user, recent errors) — building on the existing Desk
    integration.
  - WhatsApp templates for proactive notices (pattern already proven with DebiCheck
    reminders and debit-order notices).
  - The Support workspace (§6) closes the loop internally.
- **Developer / operator support** (Jeffrey now, tenant operators later):
  - Integrations dashboard (§5) + a per-instance `/api/health` status endpoint.
  - Published changelog + runbook set.
  - When a real second tenant appears: SLA definition and supported-versions policy —
    **deliberately deferred until then.**

---

## 10. "Mature Enough to Whitelabel" — the concrete gate

The platform is sellable when ALL of these are true, verified by a **ghost-tenant dry
run** (stand up a fake ISP end-to-end):

1. A second instance goes from nothing → taking a test order in **under one day, from the
   runbook alone** — and the dry run is performed **from the tenant bundle** (Compose up
   on a clean VM), not by hand-cloning the Coolify setup (§12).
2. CI brand-literal count in product code is **zero**.
3. Billing completes **one full month-cycle with zero manual interventions**
   (generation → collection → reconciliation).
4. All five workspaces operated by non-technical staff for a month **without developer
   help**.
5. Security burn-down list (§7) at zero; Supabase advisors clean.
6. Docs complete: runbook, per-workspace user guides, integration guides, changelog live.
7. A promotion has been launched and retired **entirely from admin** by a non-developer.
8. Commercial wrapper exists: pricing model, demo tenant, and the CircleTel + Unjani
   story as reference.

---

## 11. Sequencing

Ordered by business value to CircleTel *now* — every phase pays for itself even if no
tenant ever signs. **Each phase gets its own spec → plan → implementation cycle**; this
document is the umbrella, not one giant plan.

| Phase | Duration (est.) | Scope | Why this order |
|---|---|---|---|
| **0** | ~1–2 wks | Guardrails: `lib/tenant/` skeleton + config accessor, feature registry + generated nav, brand-literal CI gate, docs-in-DoD PR template, portable scheduler decision (§12), security quick wins (close criticals) | Cheap; stops the holes getting deeper; everything after builds on it |
| **1** | ~4–6 wks | Billing engine seam + finance workspace + simulation harness | #1 incident source; protects existing revenue |
| **2** | ~3–4 wks | Offer Manager + storefront reads offers | Directly revenue-generating; unblocks marketing self-serve |
| **3** | ~3–4 wks | Integration gateway + integrations dashboard | Consolidates the second-biggest fragility cluster |
| **4** | ~4–6 wks | Workspace rollout for remaining roles + `/help` center + de-brand sweep to zero | The product's UX; staff fully self-serve |
| **Continuous** | — | Per-feature docs, security hygiene, changelog | Disciplines, not projects |

Realistic wall-clock at current capacity, interleaved with revenue work: **~5–6 months**
to the §10 gate. Timeboxes are scoping estimates, not commitments.

**Revisit triggers** (written down so the decision doesn't rot):

- *Shared multi-tenant SaaS (Approach B)*: revisit if platform-as-a-product becomes the
  primary business or tenant count exceeds ~10 instances.
- *Commercial OSS/BSS (Splynx)*: moot under the whitelabel strategy, but if the
  productization stalls, the original trigger stands — at 300+ active subscribers OR two
  billing incidents in a quarter, run a 2-week Splynx pilot before writing more custom
  billing code.

---

## 12. Deployment & Hosting Strategy (cloud, virtual, or on-prem)

### Core principle: one portable bundle, three delivery tiers

The stack is already ~80% portable: Next.js builds to a standalone Docker image, and
**Supabase is open source and self-hostable** — the same platform runs as managed cloud
or as a Docker Compose stack on any machine. The unit of deployment is therefore a
**"tenant bundle"**: one versioned artifact (app image + Supabase stack + scheduler +
reverse proxy) described in a single Compose file / IaC template, with all tenant
identity injected via the §2 config layer.

| Tier | What it is | Who runs it | Positioning |
|---|---|---|---|
| **1 — Managed (standard)** | We host the tenant's instance | Us (Coolify/VPS now; managed cloud later) | Default offer, fastest onboarding, recurring hosting margin |
| **2 — Customer cloud (standard+)** | Same bundle deployed into *their* AWS/Azure/GCP/Hetzner account | Deployed by us, operated jointly | "Your data in your cloud account" — answers procurement and POPIA questions |
| **3 — On-prem / private (custom)** | Same bundle on their hardware or private VM estate | Their team, with our update channel | For the ISP whose compliance or connectivity demands it |

**Critical property: tiers differ by contract, not by code.** If tier 3 requires a fork,
the product is broken.

### Bets on where hosting is evolving

- **The OCI container is the universal contract.** Hyperscalers, managed container
  platforms (Fly.io/Railway/Render), sovereignty clouds, and on-prem K8s all converge on
  "run this container." Keep the image self-contained: no Vercel-specific runtime, no
  provider-managed service the app can't live without.
- **South Africa data residency is cheap to offer and a real differentiator.** AWS Cape
  Town (`af-south-1`), Azure South Africa North (Johannesburg), and GCP Johannesburg
  (`africa-south1`) all exist. An SA ISP asking "where does my subscriber data live?"
  (a POPIA question) can be answered "Johannesburg, in your own account" at tier 2.
  Supabase Cloud's SA-region availability must be **verified, not assumed**; self-hosted
  Supabase guarantees residency regardless.
- **Do not adopt Kubernetes speculatively.** Compose-first: a single-VM Compose stack
  serves an ISP with thousands of subscribers comfortably and is what a tier-3 customer's
  small IT team can actually operate. Keep the bundle simple enough that a Helm
  translation is mechanical *if* a large tenant ever demands it — a per-deal task, not
  platform work.
- **Managed-first for the undifferentiated.** Tier 1's next hop beyond the single VPS is
  boring-by-design: a second VPS + Coolify (near-zero change) or a managed container
  service in an SA region when a paying tenant justifies it. Do not migrate CircleTel's
  own hosting speculatively — it works.

### What this changes in the platform NOW (small, concrete)

1. **Portable scheduler**: cron triggering must not assume any specific host — the bundle
   ships its own scheduler (container cron or systemd timer hitting `/api/cron/*` with
   `CRON_SECRET`). Part of Phase 0/3 hygiene, not a new phase.
2. **No hard host assumptions** joins the §2 discipline (storage, email, queues via
   config/adapters — already mostly true via the integration gateway).
3. **§10 gate item 1** requires the ghost-tenant dry run from the bundle.
4. **Update channel defined once**: versioned releases + the changelog (§8) are how tier
   2/3 instances upgrade — `docker compose pull` against a tagged release. Release
   discipline, no new machinery.

**Explicitly deferred until a real prospect exists**: per-tier support SLAs, per-tier
pricing, air-gapped operation, Helm chart. Architecture keeps the door open; demand pays
for walking through it.

---

## Out of Scope (this design)

- Splitting the monolith into services / microservices.
- Shared multi-tenant database (see revisit triggers, §11).
- Migration to any commercial OSS/BSS.
- Speculative hosting migration for CircleTel's own instance.
- Tenant self-signup / automated tenant provisioning UI (manual runbook provisioning is
  the v1; automation follows demand).

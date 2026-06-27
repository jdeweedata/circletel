# Product Management Module — Milestone 1 Design

**Spec reference:** CT-SPEC-PMM-M1-2026-001
**Date:** 2026-06-17
**Status:** DRAFT — awaiting review
**Source PRD:** CircleTel Product Management Module PRD (CT-PRD-PMM-2026-001 v1.0, Google Doc `1Bqs2HjslMNMS1hqpbjBuN27hRgmzCoYyyZOOU6LXq5k`)
**Author:** Product & Technology (brainstormed with Claude Code)

---

## 1. Summary

Build the PRD's **change-impact engine** — the capability it calls "the single most important capability" — by adding a **wholesale-input dependency layer** on top of the existing, shipped Unified Product Console. When a supplier cost changes, is retired, or goes end-of-life, the system automatically lists every affected CircleTel product, recomputes margins, flags floor breaches, counts affected customers/orders, and proposes a lifecycle action — replacing today's manual scramble (the MTN FWB-tier-retirement event of July 2025).

**This is an additive overlay, not a re-platform.** Three new tables, one Postgres RPC, two admin tabs, one detail panel, three API routes. Nothing existing is migrated or demoted.

---

## 2. Key decisions (and why)

| Decision | Choice | Rationale |
|---|---|---|
| Catalogue model | **Layer on existing** federated sources + read-time aggregator (PR #528) | PRD assumed greenfield single master; codebase deliberately chose federation. Re-platform discards shipped work and is high-risk. PRD §2.2 flags this as the one decision to confirm — confirmed: layer on. |
| First deliverable | **Wholesale-input dependency layer + change-impact engine** (designed together) | Engine is the prize but cannot exist without the dependency graph; the graph alone ships no visible value. Pair them. |
| Product universe (v1) | **`service_packages` only** (CircleTel retail products) | This is where the MTN/DFA wholesale-dependency pain lives. The 25k `mtn_dealer_products` (Arlan-fed, self-costed) and hardware SKUs are excluded from v1. |
| Affected-counts source | **Our own `consumer_orders`** (B2C) | `consumer_orders.service_package_id` + `status` gives clean per-product active/inflight counts with no external integration. B2B `contracts` have no product FK, so per-product B2B counts are deferred. PRD assumed AgilityGIS BSS — not needed for v1. |
| Product identity | **`service_packages.id`** | No global `product_code` exists (PRD VR-1 doesn't match reality); the aggregator keys by `table:id`. Use the real key, invent nothing. |
| Cost authority | `wholesale_inputs` becomes authoritative for the **wholesale/access slice** of cost | Hardware/install/support costs stay where they are. The new layer owns shared upstream inputs — the thing that was missing. |

---

## 3. Context: existing infrastructure (do not rebuild)

- **Unified Product Console** — `lib/services/unified-product-aggregator.ts` normalizes 4 source tables (`admin_products`, `service_packages`, `mtn_dealer_products`, `circletel_hardware_products`) at read time; keys by `table:id`, no dedup.
- **Rules engine** — `lib/products/rules/` (17+ rules incl. margin-floor 25%, naming, SKU-uniqueness, publish-gating).
- **Cost tables** — `product_cost_components` (`package_id`→`service_packages`, optional `supplier_product_id`→`supplier_products`; MTN/DFA costs often inline text), `product_wholesale_costs` (loose link to package by name/nullable FK).
- **Approvals/audit** — `product_approval_queue`, `product_approval_activity_log`, `product_audit_logs`; `ProductLifecycleStepper`/`Actions` components.
- **Supplier feeds** — MiRO/Scoop/Nology scrapers; Arlan/MTN deals (~25k rows).
- **Product Workspace shell** — `app/admin/products/` tabbed UI (Drafts · Archived · Hardware · Relationships · Unified Console · MTN Deals).

### Cost reality (from `products/solution-design.md` §3.5)
A product's cost is a **stack of shared inputs**, not one: Access (MTN Tarana/DFA) + BNG (Echo SP, **volume-tiered** R20.20–R30.30) + IP Transit (R28) + DFA Magellan backhaul (R86.27) + Support (R30) + Billing/AgilityGIS (R10.96). Several inputs (Echo SP BNG tier, DFA backhaul, transit) are **shared across the whole base** — so "one input changes → many products recompute" is the normal case, not an edge case.

### Wholesale partners (the `supplier` enum)
MTN Direct, MTN-via-Arlan, DFA, Echo SP, Interstellio, AgilityGIS, United Wireless, Peraso. Finite — the input register is dozens of rows, not thousands.

---

## 4. Data model (three new tables)

### 4.1 `wholesale_inputs` — the supplier price list
One row per upstream input that products are built on. The single place a supplier cost is entered.

```sql
CREATE TABLE public.wholesale_inputs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    input_code      TEXT NOT NULL,
    supplier        TEXT NOT NULL,   -- 'MTN_DIRECT','MTN_ARLAN','DFA','ECHO_SP','INTERSTELLIO','AGILITYGIS','UNITED_WIRELESS','PERASO','INTERNAL'
    input_name      TEXT NOT NULL,
    unit_cost       DECIMAL(10,2) NOT NULL,
    is_available    BOOLEAN NOT NULL DEFAULT true,   -- false = retired upstream
    is_eol          BOOLEAN NOT NULL DEFAULT false,  -- hardware end-of-life
    replacement_input_code TEXT,                     -- successor on retirement/EOL
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    source_ref      TEXT,            -- e.g. 'MTN FWB Commercial Schedule 30 Jul 2025'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (input_code, supplier, effective_from)
);
```

### 4.2 `product_cost_links` — the wiring diagram
Connects each product to the inputs it depends on. Many products → one input is what makes a change ripple.

```sql
CREATE TABLE public.product_cost_links (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_package_id UUID NOT NULL REFERENCES public.service_packages(id),
    wholesale_input_id UUID NOT NULL REFERENCES public.wholesale_inputs(id),
    quantity           DECIMAL(10,2) NOT NULL DEFAULT 1,
    cost_role          TEXT NOT NULL CHECK (cost_role IN
        ('access','backhaul','bng','transit','support','billing','hardware')),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.3 `change_impacts` — the alert inbox
One row per affected product per triggering event.

```sql
CREATE TABLE public.change_impacts (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_type             TEXT NOT NULL CHECK (trigger_type IN
        ('input_cost_change','input_retired','input_eol')),
    trigger_ref              UUID NOT NULL,   -- wholesale_inputs.id
    affected_service_package_id UUID REFERENCES public.service_packages(id),
    impact_type              TEXT NOT NULL CHECK (impact_type IN
        ('margin_change','margin_breach','availability_loss','requires_grandfather','requires_sunset')),
    margin_before            DECIMAL(5,2),
    margin_after             DECIMAL(5,2),
    affects_active_sales     BOOLEAN NOT NULL DEFAULT false,
    active_subscription_count INTEGER DEFAULT 0,   -- from consumer_orders (B2C)
    inflight_order_count     INTEGER DEFAULT 0,    -- from consumer_orders (B2C)
    proposed_action          TEXT,
    severity                 TEXT CHECK (severity IN ('info','warning','critical')),
    status                   TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
    detected_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by              UUID REFERENCES auth.users(id),
    review_notes             TEXT
);
```

Plus reuse/extend an audit table (`lifecycle_events` or existing `product_audit_logs`) for before/after recompute history.

### 4.4 Backfill
Populate `wholesale_inputs` + `product_cost_links` from `product_wholesale_costs` + MTN/DFA rows in `product_cost_components`. Because today's costs are loose text, the script emits a **reconciliation list** of duplicates/mismatches (same input named differently) for a one-time human review. No product left unlinked.

---

## 5. The engine (`run_change_impact` Postgres RPC)

Triggered by a `wholesale_inputs` write (cost change / `is_available→false` / `is_eol→true`) or a manual "Re-run impact" button. Steps:

1. **Find dependents** — traverse `product_cost_links` from the changed input to every `service_package`.
2. **Recompute cost & margin** — sum that package's cost-links at new input cost → `direct_cost` → `margin = (retail − direct_cost)/retail`.
3. **Check floor** — compare to universal 25% floor (per-line floor in M3). Below → breach.
4. **Count affected** — `consumer_orders` GROUP BY `service_package_id`: active + inflight (B2C).
5. **Classify & write `change_impacts`** with `proposed_action`:
   - margin fine → `info` (logged)
   - margin down, above floor → `warning` (review price)
   - margin below floor → `critical` (review/reprice)
   - input retired + active customers → `critical` (grandfather)
   - retired + `replacement_input_code` → propose sunset → successor

**Guarantees:** idempotent (re-run doesn't duplicate); every recompute writes an audit event with before/after; **read-only on `consumer_orders`** — never touches billing/orders. Performance: single SQL pass over dozens of inputs / hundreds of packages = milliseconds (PRD's <10s bar trivially met).

---

## 6. UI (additive to Product Workspace)

1. **Tab "Wholesale Inputs"** — register grouped by supplier; edit cost / mark retired / mark EOL+replacement. Saving fires the engine. Reuses `SuppliersSection` register patterns.
2. **Tab "Change Impact"** — inbox of open `change_impacts`, newest-first, severity filter; per-card margin before→after, breach flag, counts, proposed action; Acknowledge / Resolve buttons; top summary strip.
3. **Detail panel "Depends on"** — read-only list of a `service_package`'s inputs and each one's cost contribution, in the existing Unified Console detail sidebar.

**API routes** under `app/api/admin/products/` (Next.js 15 async params, service-role client, RLS PMO/admin write):
- `wholesale-inputs` — CRUD
- `change-impacts` — list / acknowledge / resolve
- `run-change-impact` — manual trigger

Admin-only. No change to consumer site, checkout, or billing.

---

## 7. Phasing & acceptance

| Step | Ships | Done when |
|---|---|---|
| 1 | Tables + backfill | All SkyFibre/BizFibre/Clinic products linked; reconciliation reviewed; none unlinked |
| 2 | `run_change_impact` RPC + audit | Test input change writes correct `change_impacts` rows (verified by SQL) |
| 3 | Wholesale Inputs tab + CRUD API | Editing a cost in UI produces impact rows |
| 4 | Change Impact tab + detail panel | Full loop works in browser on staging |

**Acceptance test (PRD §12 — replay the real event):** seed historical MTN FWB state; (a) retire 5/10/20 Mbps tiers, (b) reprice 50/100/200 Mbps (R542→R499, R626→R599, R737→R699). With no manual lookup, the Change Impact tab must list every dependent CircleTel product, its new margin, affected active subs + inflight orders, and the proposed action (grandfather retired tiers; review repriced). Pass on staging = Milestone 1 done.

---

## 8. Out of scope (v1) / later milestones

- **Out of v1:** 25k Arlan dealer deals; hardware SKUs; B2B per-product counts; auto-changing any price or stage (engine only *proposes*).
- **Milestone 2:** formal 8-stage lifecycle state machine with enforced stage-gates (consumes the engine's grandfather/sunset proposals).
- **Milestone 3:** product-lines taxonomy + per-line margin floors + portfolio analytics.

---

## 9. Open questions

1. Backfill reconciliation owner — who reviews the one-time duplicates/mismatches list? (PMO assumed.)
2. Per-line margin floors (SkyFibre 41–52%, BizFibre 31–41%, etc.) — enforce in M1, or universal 25% only until M3? (Default: universal 25% in M1.)
3. Should the engine also notify (email/WhatsApp) on `critical` impacts in M1, or is the inbox sufficient for v1? (Default: inbox only; notifications in M2.)

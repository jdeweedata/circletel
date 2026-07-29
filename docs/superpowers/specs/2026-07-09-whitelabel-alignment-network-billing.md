# Whitelabel Alignment — Network Management & Revenue Assurance

**Date:** 2026-07-09
**Status:** Companion spec to `2026-07-09-whitelabel-platform-design.md` (cross-cutting; **not a phase**)
**Author:** Jeffrey + Claude Code

---

## 0. Why this exists

A large body of work landed alongside whitelabel Phase 0: in-app **network management** (Ruijie, Interstellio, Tarana/TCS, MikroTik bridges), a **Revenue Assurance** capability (`service_network_identifiers` + reconciliation), and live **billing** actions (catch-up invoices, `billing_ready`/mandate-verified fixes). See:

- `docs/plans/2026-07-09-in-app-network-management-roadmap.md`
- `docs/plans/2026-07-09-revenue-assurance-map-coverage-audit.md`
- `docs/plans/2026-07-09-ra-report-reconciliation-spec.md`
- `docs/architecture/NETWORK_VISIBILITY_BRIDGES.md`

That work lands squarely on two whitelabel **seams** — **Integration Gateway (§5)** and **Billing Engine (§3)** — but was built in the pre-seam style the design is retiring: bespoke clients reading `process.env`, and raw-SQL writes to `customer_invoices`. Left unaligned it *deepens the sprawl* the design must later untangle (the catch-up invoices became one more of ~152 `customer_invoices` writers; the four network bridges added four bespoke credential-in-env clients + per-provider `*_sync_logs` tables).

**Goal:** make this work conform to the seam boundaries so it becomes proof *for* the seams, not debt *against* them — with **no speculative rebuild** (the design forbids it; every step must pay for CircleTel now). This spec is the durable map; its items are woven into each phase's plan as that phase is written.

## 1. Current state (verified 2026-07-09)

| Whitelabel piece | State | Our work that touches it |
|---|---|---|
| `lib/tenant/` `getTenantConfig()` | ✅ built (branding/contacts; env-override; **no credential routing yet** — Phase 2) | Network clients read `process.env` directly |
| `lib/admin/feature-registry.ts` | ✅ built (no per-tenant flags yet — Phase 4) | Network + RA admin sections unregistered |
| Brand-literal ratchet (`scripts/check-brand-literals.sh`, baseline 6182) | ✅ built | `lib/interstellio/client.ts:62` default `'circletel.co.za'` |
| **Integration Gateway** `lib/integrations/core/` | ❌ **spec only** | 4 bespoke clients + `ruijie/tarana/mikrotik_sync_logs` |
| **Billing Engine** `lib/billing/engine/` | ❌ **spec only** (~152 scattered writers; `CompliantBillingService` closest) | RA catch-up invoices via raw SQL |
| `platform_events` + unified `notify()` | ❌ **spec only** (ad-hoc `lib/billing/debit-batch-alert.ts`) | RA detections + billing mutations |
| Instance-per-tenant (no `tenant_id`) | ✅ chosen model | `service_network_identifiers` (tenant-local — already correct) |

## 2. Seam map

- **Network bridges** (Ruijie, Interstellio, Tarana/TCS, MikroTik) → **Seam 3 Integration Gateway**.
- **Revenue Assurance** → **reads** Seam 3 (network signals) + **acts through** Seam 1 (billing); never a direct billing writer.
- **Billing actions** (invoice creation, pro-rata, debit alignment, VAT, `billing_ready`/verified) → **Seam 1 Billing Engine**.
- **Docs** → already follow docs-in-DoD (§8). ✅

## 3. Guardrails — adopt now (applies to all new code)

1. **No new raw-SQL writes to `customer_invoices`/payment tables.** Route through `CompliantBillingService` (`lib/billing/compliant-billing-service.ts`) until `lib/billing/engine/` exists, then that becomes the single writer. The four catch-up invoices (INV-2026-00037…40) were raw-SQL — leave them (voidable), do not repeat.
2. **No new `process.env` credential reads in integration code.** Resolve through one accessor (today `getTenantConfig()` for identity; a `getIntegrationCredentials(provider)` to be added in Phase 2). Mirror `lib/payments/payment-provider-settings-loader.ts` (NetCash creds already in a `payment_provider_settings` DB table).
3. **No new bespoke `*_sync_logs` tables.** New integrations target the future `integration_runs`; until then reuse `integration_cron_jobs` / `integration_activity_log`.
4. **Every new API route declares its auth context** (public / customer-session / admin-role / service) per §7 — network/RA routes especially (device access + PII).

## 4. Conformance by seam (rides the phases; no rebuild now)

### Seam 3 — Integration Gateway (whitelabel Phase 3)
- The network roadmap's vendor-neutral **`NetworkDeviceAdapter`** is an *implementation of* the future `lib/integrations/core/` contract (`authenticate() / healthCheck() / capabilities`), not a parallel abstraction.
- **The network bridges are the first proof of the gateway** — four real adapters, four auth styles (OAuth, token, cookie-session, HMAC-proxy) — an ideal generality test. They feed `app/admin/integrations` (health, last sync, re-auth).
- Consolidate `ruijie/tarana/mikrotik_sync_logs` → `integration_runs` when Phase 3 builds it.
- Feature-flag each network integration per tenant (Phase 4).

### Seam 1 — Billing Engine (whitelabel Phase 1)
- **Revenue Assurance is a read/detect layer**: it produces `ra_exceptions`; *remediation* (advance-to-billing-ready, catch-up invoice, credit note) is performed by the billing engine, never RA SQL.
- The engine is the correct home for fixes this session surfaced: the **VAT-exclusive treatment** (the R450→R517.50 generator bug — see §5), **pro-rata**, and the **NetCash action-date / R1,500-line / R20,000-day guards** all belong in the engine's `CollectionRail` + invoice state machine.
- `service_network_identifiers` is the shared join for "is this billed service actually live on the network." Tenant-local (no `tenant_id`). Add `msisdn`/`iccid`/`mikrotik_serial` types as sources land.

### Observability (Phase 0/1)
- **RA is the natural first consumer of `platform_events`**: detections + billing mutations (`billing_ready` flip, verified flip, invoice creation) write `(actor, entity, before/after, source)`.
- RA alerts + the report-reconciliation `ra_recipients` route through the unified `notify()`, not a second bespoke email path.

### Tenant config / registry / ratchet (now)
- Register **Network-Management** (→ Ops/Support workspace) and **Revenue-Assurance** (→ Finance workspace) sections in `lib/admin/feature-registry.ts` with maturity (`beta`/`internal`).
- When touching `lib/interstellio/client.ts`, migrate the `'circletel.co.za'` default to `getTenantConfig()` so the ratchet ticks **down**.

## 5. Hygiene debts surfaced this session (carry forward, don't hide)

- **Generator VAT bug** — treats `monthly_price` (ex-VAT) as VAT-inclusive, under-billing the Unjani base ~R67.50/mo (correct monthly R450→R517.50). → Phase-1 billing-engine item.
- **Four raw-SQL catch-up invoices** — one-off; the engine must be able to produce this natively (pro-rata + catch-up) — capture as an engine test case.
- **11 legacy clinics mis-staged "pending"** — billed but no onboarding submission; belongs to the Ops workspace + the engine's "active service" signal, not a flag fix.

## 6. Weaving (where each item lands)

| Phase / plan | Items |
|---|---|
| **Now** (Phase 0 hygiene) — `docs/superpowers/plans/2026-07-09-whitelabel-phase0-guardrails.md` | §3 guardrails; register Network/RA sections; migrate the interstellio literal |
| **Phase 1** (billing-engine plan, future) | Seam 1 items + observability + §5 debts |
| **Phase 3** (integration-gateway plan, future) | Seam 3 items |
| **Phase 4** (workspace plan, future) | per-tenant flags + workspace placement |

## 7. Verification

- Conformance is documented: the two `docs/plans/2026-07-09-*` files carry "conforms to Seam 1 / Seam 3" notes; this spec is cross-referenced from the umbrella design §11.
- `bash scripts/check-brand-literals.sh` count ≤ 6182 (lower once the interstellio literal migrates).
- Guardrail proof over time: `git grep "from('customer_invoices')"` adds no new writer; new integration code adds no new `process.env.<PROVIDER>_` read.
- End-state (later phases): network adapters resolve creds via tenant config and log to `integration_runs`; RA emits `platform_events` and triggers billing-engine remediation with zero raw SQL.

## 8. Out of scope

- Building `lib/integrations/core/` or `lib/billing/engine/` now (their own phases).
- Refactoring the existing ~152 billing writers (Phase 1 owns it).
- Any `tenant_id`/shared-DB work (design rejects it for now).
- Re-billing the catch-up invoices already created (finance owns the NetCash portal step).

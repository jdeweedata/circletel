# Align session work (network mgmt + revenue assurance) with the whitelabel platform design

## Context

This session produced a large body of network-management + revenue-assurance + billing work (see `docs/plans/2026-07-09-*`, `docs/architecture/NETWORK_VISIBILITY_BRIDGES.md`, the `service_network_identifiers` table, and live billing changes for Soshanguve/Zamdela). In parallel, the whitelabel platform design (`docs/superpowers/specs/2026-07-09-whitelabel-platform-design.md`) landed its **Phase 0** (tenant config layer + feature registry + brand-literal CI ratchet, merged PR #608).

The design's whole thesis is to convert a 254-page monolith's sprawl into **module boundaries = product architecture**, via a few seams. Our session's work lands squarely on two of those seams — **Integration Gateway (§5)** and **Billing Engine (§3)** — but was built in exactly the pre-seam style the design is trying to retire (bespoke clients reading `process.env`; raw-SQL writes to `customer_invoices`). 

**The risk this plan addresses:** without alignment, our work *deepens the sprawl* the whitelabel design must later untangle (our catch-up invoices became a 153rd `customer_invoices` writer; our four network integrations added four more bespoke credential-in-env clients and per-provider sync-log tables). **The goal:** make this work conform to the seam boundaries so it becomes proof-of-concept *for* the seams rather than debt *against* them — without a speculative rebuild (the design forbids that; every step must pay for CircleTel now).

## Current state (verified via exploration)

| Whitelabel piece | State | Our work that touches it |
|---|---|---|
| `lib/tenant/` config accessor (`getTenantConfig()`) | ✅ built (branding/contacts; env-override; **no credential routing yet** — that's whitelabel Phase 2) | Network clients read `process.env` directly |
| `lib/admin/feature-registry.ts` (maturity-aware nav) | ✅ built (no per-tenant flags yet — Phase 4) | Network + RA admin sections |
| Brand-literal CI ratchet (`scripts/check-brand-literals.sh`, baseline **6182**) | ✅ built | `lib/interstellio/client.ts:62` default `'circletel.co.za'` |
| **Integration Gateway** `lib/integrations/core/` (adapter contract, `integration_runs`, webhook intake) | ❌ **spec only** | Ruijie/Interstellio/Tarana/MikroTik = 4 bespoke clients + `*_sync_logs` tables |
| **Billing Engine** `lib/billing/engine/` (single writer, state machine, `CollectionRail`) | ❌ **spec only** (152 scattered writers; `CompliantBillingService` is the closest thing) | RA catch-up invoices via raw SQL; billing_ready/verified flips |
| `platform_events` + unified `notify()` | ❌ **spec only** (ad-hoc `lib/billing/debit-batch-alert.ts`) | RA reconciliation findings; billing mutations |
| Instance-per-tenant physical isolation (no `tenant_id`) | ✅ the chosen model | `service_network_identifiers` (tenant-local — already correct) |

## Alignment map: session work → seam

- **Network bridges** (Ruijie, Interstellio, Tarana/TCS, MikroTik) → **Seam 3 Integration Gateway**.
- **Revenue Assurance** (reconciliation, `service_network_identifiers`, RA report-upload spec) → **reads** Seam 3 (network signals) + **acts through** Seam 1 (billing).
- **Billing actions** (invoice creation, pro-rata, debit alignment, VAT, billing_ready/verified) → **Seam 1 Billing Engine**.
- **Docs** (roadmap, RA specs, tri-bridge runbook) → already follow the docs-in-DoD discipline (§8) ✅.

## The plan

### A. Guardrails to adopt now (stop deepening the sprawl) — **do immediately, cheap**
These are principles applied to *new* code from here on, plus fixing the debts this session created:
1. **No new raw-SQL writes to `customer_invoices`/payment tables.** Route through `CompliantBillingService` (`lib/billing/compliant-billing-service.ts`, has `generateInvoice()` + VAT + audit + PDF) until `lib/billing/engine/` exists — then it becomes the single writer. Our four catch-up invoices (INV-2026-00037…40) were raw-SQL; leave them (voidable) but **do not repeat the pattern**.
2. **No new `process.env` credential reads in integration code.** New network/integration work resolves config through a single accessor (today `getTenantConfig()` for identity; a `getIntegrationCredentials(provider)` shape to be added in whitelabel Phase 2). Precedent to mirror: `lib/payments/payment-provider-settings-loader.ts` (NetCash creds already in a `payment_provider_settings` DB table).
3. **No new bespoke `*_sync_logs` tables.** The next integration logs to the future `integration_runs`; until then reuse the existing `integration_cron_jobs` / `integration_activity_log` tables rather than minting a new per-provider table.
4. **Every new API route declares auth context** (public/customer/admin-role/service) per §7 — the network/RA routes especially (device access + PII).

### B. Integration Gateway conformance (network bridges) — **rides whitelabel Phase 3**
5. **Make the network roadmap's "vendor-neutral `NetworkDeviceAdapter`" (Phase 0/6 of `docs/plans/2026-07-09-in-app-network-management-roadmap.md`) an *implementation of* the future `lib/integrations/core/` adapter contract** (`authenticate() / healthCheck() / capabilities`), not a parallel abstraction. Update the roadmap doc to state this dependency so we don't build two competing seams.
6. **Nominate the network bridges as the first proof of the Integration Gateway.** Ruijie/Interstellio/Tarana/MikroTik are 4 real adapters with 4 different auth styles (OAuth, token, cookie-session, HMAC-proxy) — an ideal test that the `core` contract is general. Feed them into `app/admin/integrations` (health, last sync, re-auth) as they migrate.
7. **Unify the 3 network sync-log tables** (`ruijie_sync_logs`, `tarana_sync_logs`, `mikrotik_sync_logs`) into `integration_runs` when Phase 3 builds it — a straight consolidation, and the dashboard's "last successful sync" then works for network too.
8. **Feature-flag each network integration per tenant** (a tenant may have no Ruijie/Tarana) via the registry mechanism (Phase 4).

### C. Billing Engine conformance (Revenue Assurance) — **rides whitelabel Phase 1**
9. **Reframe Revenue Assurance as a read/detect layer that raises actions the billing engine executes** — never a direct billing writer. Update `docs/plans/2026-07-09-ra-report-reconciliation-spec.md`: the RA reconciliation produces `ra_exceptions`; *remediation* (advance-to-billing-ready, catch-up invoice, credit note) is performed by the billing engine / `CompliantBillingService`, not by RA SQL.
10. **The billing engine is the correct home for the fixes this session surfaced:** the **VAT-exclusive treatment** (the R450→R517.50 generator bug), **pro-rata**, and the **NetCash action-date/line-limit guards** all belong in the engine's `CollectionRail` + invoice state machine (§3). Fold the VAT-bug fix into the Phase-1 billing-engine spec rather than a one-off patch.
11. **`service_network_identifiers` becomes the join the billing engine + RA share** to answer "is this billed service actually live on the network." Keep it tenant-local (no `tenant_id` — correct for instance-per-tenant). Add `msisdn`/`iccid`/`mikrotik_serial` types as those sources land.

### D. Tenant config, feature registry, brand ratchet — **small, now**
12. **Register the Network-Management and Revenue-Assurance admin sections in `lib/admin/feature-registry.ts`** with maturity (`beta`/`internal` while in progress) so half-built screens are invisible to non-dev roles. Target workspaces: RA → **Finance**; Network → **Ops/Support**.
13. **Don't increase the brand-literal count.** When touching `lib/interstellio/client.ts`, migrate the `'circletel.co.za'` default (line 62) to `getTenantConfig()` so the ratchet ticks *down*. Verify with `scripts/check-brand-literals.sh` before any push.

### E. Observability baseline — **rides whitelabel Phase 0/1**
14. **Revenue Assurance is the natural first consumer of `platform_events`**: leakage/exception detections and billing mutations (billing_ready flip, verified flip, invoice creation) write `(actor, entity, before/after, source)`. Our session did these via raw SQL + memory — the engine/RA should emit `platform_events` instead.
15. **RA alerts + the RA report-reconciliation `ra_recipients`** route through the future unified `notify()` (generalizing `lib/billing/debit-batch-alert.ts`), not a second bespoke email path.

### F. Immediate hygiene debts from this session (surface, don't silently carry)
- The **generator VAT bug** (under-bills the whole Unjani base R67.50/mo) — schedule as a Phase-1 billing-engine item (item 10).
- The **four raw-SQL catch-up invoices** — acceptable one-off; note in the billing-engine spec as a case the engine must be able to produce natively (pro-rata + catch-up).
- The **11 legacy clinics mis-staged as "pending"** — a pipeline/data gap; belongs to the Ops workspace + billing-engine "active service" signal, not a quick flag fix.

## Sequencing (ride the whitelabel phases — no speculative rebuild)

| When | Action items | Whitelabel phase |
|---|---|---|
| **Now** (this/next session) | A (guardrails) + D (register sections, brand-literal migrate) + update the two roadmap/RA docs with the conformance notes (B5, C9) | Phase 0 hygiene |
| **With billing-engine build** | C (RA as detect-layer; VAT/pro-rata/CollectionRail in engine; platform_events) + E | Phase 1 |
| **With integration-gateway build** | B (network adapters conform to `core`; `integration_runs`; dashboard) | Phase 3 |
| **With workspace rollout** | D feature-flags + workspace placement | Phase 4 |

## Deliverables & placement (decided: cross-cutting spec + woven into phase plans)

This alignment is **not a new phase**. It follows the design's spec-vs-plan convention: a durable companion **spec**, whose items are woven into each phase's plan as that phase is written.

**Primary artifact — a new cross-cutting alignment spec:**
- **`docs/superpowers/specs/2026-07-09-whitelabel-alignment-network-billing.md`** — the durable seam-map + guardrails (this plan, formalized). Companion to `2026-07-09-whitelabel-platform-design.md`, not a phase.
- Add a one-line cross-reference to it in the umbrella design's §11 sequencing table (`docs/superpowers/specs/2026-07-09-whitelabel-platform-design.md`) so it's discoverable.

**Woven into each phase's plan (when that phase is written):**
- **Phase 0** `docs/superpowers/plans/2026-07-09-whitelabel-phase0-guardrails.md` — items **A + D**: register Network/RA sections, migrate the interstellio brand literal, adopt the no-new-raw-SQL / no-new-env-cred guardrails.
- **Phase 1** (billing-engine plan, future) — items **C + E + F**: RA-as-detect-layer, VAT-exclusive fix, pro-rata + `CollectionRail` + NetCash guards, `platform_events`, `notify()`.
- **Phase 3** (integration-gateway plan, future) — item **B**: network adapters implement `lib/integrations/core/`; `*_sync_logs`→`integration_runs`; dashboard.
- **Phase 4** (workspace plan, future) — item **D** flags + workspace placement.

**Conformance notes added to our own session docs (Now step):**
- `docs/plans/2026-07-09-in-app-network-management-roadmap.md` — "conforms to Seam 3" note (B5–B8).
- `docs/plans/2026-07-09-ra-report-reconciliation-spec.md` — "detect-only; remediate via billing engine" note (C9, E14–15).
- `docs/architecture/NETWORK_VISIBILITY_BRIDGES.md` — brief seam-alignment note.

**One code change in the Now step:**
- `lib/admin/feature-registry.ts` — register Network-Management + Revenue-Assurance sections with maturity (`beta`/`internal`).

## Verification

- **Conformance is documented, not just intended:** the two `docs/plans/2026-07-09-*` files carry explicit "conforms to Seam 3 / Seam 1" sections; `git grep` for the new cross-references.
- **No regression to the ratchet:** `bash scripts/check-brand-literals.sh` count ≤ 6182 (and lower if the interstellio literal is migrated).
- **Registry:** `npm run test -- feature-registry` passes; Network/RA sections appear with correct maturity and are hidden for non-admin roles via `getVisibleSections`.
- **Guardrail proof:** `git grep "from('customer_invoices')"` shows no *new* writer added after this plan; new integration code shows no new `process.env.<PROVIDER>_` credential read.
- **End-state check (later phases):** once the seams exist, the network adapters resolve credentials via tenant config and log to `integration_runs`; RA emits `platform_events` and triggers billing-engine remediation with zero raw SQL.

## Out of scope

- Building `lib/integrations/core/` or `lib/billing/engine/` now — those are their own whitelabel phases with their own spec→plan cycles (the design mandates this).
- Refactoring the existing 152 billing writers (whitelabel Phase 1 owns that).
- Any `tenant_id`/shared-DB multi-tenant work (design explicitly rejects it for now).
- Re-billing/collection changes for the catch-up invoices already created (finance owns the NetCash portal step).

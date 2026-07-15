# Spec — Revenue Assurance: Report Upload & Reconciliation Engine (v1: Cellular SIM)

**Date:** 2026-07-09
**Parent:** `docs/plans/2026-07-09-in-app-network-management-roadmap.md` (§6a Revenue Assurance)
**Evidence:** `docs/plans/2026-07-09-revenue-assurance-map-coverage-audit.md`

> **Whitelabel alignment (Seam 1 — Billing Engine):** Revenue Assurance is a **detect-only** layer — it produces `ra_exceptions`; *remediation* (advance-to-billing-ready, catch-up invoice, credit note) is executed by the billing engine / `CompliantBillingService`, never RA raw SQL. `ra_exceptions` emit to `platform_events`; `ra_recipients` route through the unified `notify()`. See `docs/superpowers/specs/2026-07-09-whitelabel-alignment-network-billing.md`.

## 1. Why
Consumer cellular customers (5G/LTE on MTN SIM+router, e.g. Ashwyn R449, Raymund R649) have **no pollable active-signal** — they sit behind MTN CGNAT, don't touch Interstellio, and have no mapped Reyee AP (static-IP polling rejected as uneconomic). The pragmatic active-signal is a **monthly SIM-management report** from the carrier, uploaded and reconciled against billing. Built as a **reusable framework**, this is the first slice of the Revenue Assurance module and delivers the unified mapping table the audit flagged as prerequisite.

## 2. Locked decisions (2026-07-09)
1. **Reusable RA framework** — upload → column-map → reconcile → exceptions → notify; cellular SIM is report type #1. Future report types (other carriers/providers) plug in.
2. **Configurable recipient list** in settings (role label + email + WhatsApp number), not hard-coded, not RBAC-dependent.
3. **Email + WhatsApp** notifications (Resend + existing WhatsApp template infra; WhatsApp needs an approved Meta template).

## 3. Goal & success criteria
Admin uploads the monthly SIM report → system reconciles it against active 5G/LTE services → produces a typed exception list → emails + WhatsApps the network manager, service lead, and executive a summary.

**Done means:**
1. An admin can upload a CSV/XLSX SIM report at `/admin/revenue-assurance` and see parsed row count + status.
2. Reconciliation produces exceptions of each type (below) persisted and viewable in-app with an acknowledge/resolve action.
3. On completion, the configured recipients receive an **email + WhatsApp** summary (period, #active-unbilled + R value, #billed-inactive, #unmatched, link).
4. Ashwyn & Raymund resolve correctly once their SIM identifiers are mapped (or appear as `unmatched_service` until mapped).
5. `npm run type-check:memory` clean for touched files; staging-first.

## 4. Data model (additive migrations, applied per project convention)

**Unified mapping table (high-leverage — resolves the audit's mapping-backfill prerequisite for ALL sources):**
```sql
create table service_network_identifiers (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references customer_services(id) on delete cascade,
  identifier_type text not null,   -- 'msisdn' | 'iccid' | 'interstellio_uuid' | 'ruijie_sn' | 'tarana_serial'
  identifier_value text not null,
  created_at timestamptz default now(),
  unique (identifier_type, identifier_value)
);
```
This one table backfills every mapping gap (5G MSISDN, Unjani Ruijie SN, Tarana serial, Interstellio UUID) — not just cellular.

**Report engine tables:**
```sql
create table ra_report_uploads (
  id uuid primary key default gen_random_uuid(),
  report_type text not null,          -- 'mtn_sim_usage' (v1)
  period_month date not null,         -- first of month
  filename text, uploaded_by uuid,
  row_count int, status text default 'parsing',  -- parsing|reconciled|failed
  created_at timestamptz default now()
);
create table ra_report_rows (
  id bigint generated always as identity primary key,
  upload_id uuid references ra_report_uploads(id) on delete cascade,
  external_id text,                   -- msisdn/iccid
  sim_status text, usage_mb numeric, plan text,
  raw jsonb
);
create table ra_exceptions (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid references ra_report_uploads(id) on delete cascade,
  report_type text, service_id uuid null references customer_services(id),
  external_id text,
  exception_type text not null,       -- see §5
  severity text default 'medium',
  amount numeric,                     -- R value at risk where applicable
  detail jsonb,
  resolved_at timestamptz null, resolved_by uuid null
);
create table ra_recipients (
  id uuid primary key default gen_random_uuid(),
  role_label text not null,           -- 'network_manager' | 'service_lead' | 'executive'
  email text, whatsapp_number text, active boolean default true
);
```
All RLS service-role only, matching project convention.

## 5. Reconciliation rules (report_type = mtn_sim_usage)
Match each report row (by `external_id` → `service_network_identifiers` where type in msisdn/iccid) to an active 5G/LTE `customer_services`:

| Exception type | Condition | Meaning |
|---|---|---|
| `active_unbilled` | SIM active + usage>0, no active billed service matched | **Leakage** (priority; carries R value) |
| `billed_inactive` | active 5G/LTE service, matched SIM suspended or usage=0 | dispute / churn |
| `unmatched_sim` | report SIM not mapped to any service | mapping gap → drives backfill |
| `unmatched_service` | active 5G/LTE service with no SIM in report | missing from carrier report / not provisioned |
| `usage_anomaly` (optional) | usage far over/under plan | overage-bill / dormant |

## 6. Tasks
- **6.1** Migrations (§4) — apply manually to shared DB. **S**
- **6.2** Report-type config: a small registry mapping file columns → normalized fields (`external_id`, `sim_status`, `usage_mb`, `plan`) with an `mtn_sim_usage` preset. Parser reuses **exceljs** (XLSX) + a light CSV path. **M**
- **6.3** Upload API route (`POST /api/admin/revenue-assurance/uploads`) — admin-auth, store file meta, parse rows → `ra_report_rows`, set status. **M**
- **6.4** Reconciliation service — apply §5 rules, write `ra_exceptions`. Pure/testable. **M**
- **6.5** Notification — on `reconciled`, send summary to active `ra_recipients` via the existing `notification-router` (email channel + WhatsApp template). New email template `ra_reconciliation_summary`; new **approved** WhatsApp template. **M**
- **6.6** Admin UI `/admin/revenue-assurance` — upload form, run history, exception table with acknowledge/resolve, recipient settings editor. **M**
- **6.7** Seed `service_network_identifiers` for the known cellular customers (capture Ashwyn/Raymund MSISDN) + wire order-activation to populate it going forward (Phase 3 hook). **S**

## 7. Dependencies / risks
- **Sample MTN SIM report needed** to finalize the column mapping (build against a real export).
- **WhatsApp template approval** (Meta, ~24h) — start early (cf `circletel_debit_order_notice` precedent).
- **SIM identifier capture** — customer_services has no MSISDN today; `service_network_identifiers` + a backfill for the 2 known customers is required for them to reconcile.
- Report is monthly/manual — this is **not** real-time monitoring (by design; real-time cellular needs carrier SIM-management API or TR-069, deferred until the base grows).

## 8. Global constraints
- Additive migrations, manual apply, service-role RLS; no destructive changes.
- Reuse `lib/notifications/notification-router.ts` + `lib/integrations/whatsapp/*` — do not build new send paths.
- `type-check:memory` clean; branch off main → staging → PR to main.
- Recipients configurable (no hard-coded emails in code).

## 9. Verification
1. Upload a sample report on staging → row_count matches file.
2. Seed one active_unbilled + one billed_inactive scenario → exceptions generated with correct type + R value.
3. Recipients receive email + WhatsApp with correct counts + working in-app link.
4. Acknowledge/resolve flips exception state and is audit-stamped.
5. `service_network_identifiers` unique constraint prevents a SIM mapping to two services.

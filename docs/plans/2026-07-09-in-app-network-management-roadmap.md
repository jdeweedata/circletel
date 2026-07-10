# In-App Network Management — Feature & Roadmap

**Date:** 2026-07-09
**Owner:** CircleTel platform
**Goal:** Run and manage the entire device fleet from inside the CircleTel admin app — a real NOC — built on the live Ruijie Cloud API (and, later, MikroTik + other vendors).

> **Whitelabel alignment (Seam 3 — Integration Gateway):** the vendor-neutral `NetworkDeviceAdapter` (Phase 0/6 below) is an *implementation of* the future `lib/integrations/core/` adapter contract (`authenticate/healthCheck/capabilities`), not a parallel abstraction; the `ruijie/tarana/mikrotik_sync_logs` tables consolidate into `integration_runs`; credentials resolve via the tenant config layer, not `process.env`; per-tenant enable/disable via the feature registry. See `docs/superpowers/specs/2026-07-09-whitelabel-alignment-network-billing.md`.

---

## 1. Vision & Scope

Today CircleTel can *see* the fleet (inventory + online/offline) inside the app. "Full in-app network management" means the app becomes the single pane of glass to:

1. **Monitor** — live health, performance, alerts, SLA (no logging into Ruijie Cloud).
2. **Operate** — reboot, remote console, config changes, firmware, port/PoE control.
3. **Provision** — onboard a new site/device end-to-end (bind → assign to customer → push config).
4. **Monetize** — guest WiFi / captive portal / vouchers (the CloudWiFi WaaS product) and per-user PPSK.
5. **Expose** — let B2B customers self-serve a read-only view of their own sites (portal).

Scope covers the **Ruijie/Reyee fleet first** (55 live devices across Unjani, Newgen, CircleTel projects), with a vendor-abstraction seam so **MikroTik** (already partially scaffolded) and future vendors slot in without rework.

### The network is TWO layers — cover both

| Layer | Source | Signal | Status |
|---|---|---|---|
| **Hardware (L1/L2)** | Ruijie APs, MikroTik | device up/down, CPU, radio, ports | This roadmap (device-centric) |
| **Subscriber / AAA (L3)** | **Interstellio RADIUS (NebularStack)** | who's authenticated, session state, **data usage, service profile, credit/quota, active/inactive** | **Already integrated** — `lib/interstellio/client.ts` (mature: subscribers CRUD, sessions incl. disconnect, usage/CDR, profiles, credit, webhooks), admin routes under `/api/admin/integrations/interstellio/*`, webhook receiver. Under-leveraged. |

Interstellio is the **subscriber-connectivity truth** and the backbone of Revenue Assurance (§6a). Thread it through the phases as an explicit AAA dimension rather than a separate effort:
- **Phase 1** — per-customer session/usage visibility; wire Interstellio **webhooks** (session down, quota exceeded) into alerting (event-driven, not polling).
- **Phase 2** — surface existing control actions: `disconnectSession`, `enable/disableSubscriber`, `changeSubscriberProfile`.
- **Phase 3** — `createSubscriber`/`changeProfile` on order activation.

**Liveness caution:** mirror the Ruijie Phase-0 discipline — spike-verify our Interstellio token/endpoints actually return the subscribers/usage/CDR the console dashboard shows before depending on it (the dashboard proves the platform has data, not that our client still pulls it).

---

## 2. Current State (verified 2026-07-09)

**Working & live:**
- OAuth token, project tree, **25 deduped devices, 22 online** — verified against `cloud-eu`.
- **Sync cron running every 30 min** (`ruijie_sync_logs`, `triggered_by=cron`, cache fresh) → device list/detail pages show current data.
- **Device management logs** (`getDeviceLogs`) — returns real entries.
- Admin UI: `/admin/network` hub, `/devices`, `/devices/[sn]` (6 tabs), `/health`, `/map`, `/analytics`, `/outages`.
- Wired controls: **remote reboot** + **eWeb tunnel** (remote web console), both audit-logged (`ruijie_audit_log`, 4,758 rows).
- All routes admin-auth gated (session cookie → `admin_users`).

**Broken / gaps (must fix before building on top) — corrected root cause after code review 2026-07-09:**
- **CPU/Memory never fetched** — `getDeviceMetrics` hardcodes CPU/mem/radio/uptime to `null` and only derives `online_clients`. The documented **§2.6.6 CPU/Memory endpoint** (`/logbizagent/logbiz/api/sys/current_performance`) is simply **not implemented**. → implement it (Phase 0).
- **Radio channels have no documented cloud endpoint** (eWeb-tunnel only) — accept null, fix the UI so it doesn't show empty 0% bars.
- **Traffic returns zero** — uses the correct documented endpoint; needs the spike to confirm genuine-zero vs a request-param issue.
- **NOT a bug (earlier assumption corrected):** there is **no unhandled-rejection defect** — all client fns try/catch and return empty; that crash was a test-script artifact. `ruijieFetch` does dump 60KB HTML on 404s though — cap it.
- **Cache stores status only** — no metrics time series; Phase 0 adds `ruijie_device_metrics`.
- **MikroTik subsystem** exists in code but is unverified/likely inert.

See `docs/plans/2026-07-09-phase0-network-foundation-spec.md` for the full Phase 0 spec.

**Architecture principles to keep:**
- Cache table (`ruijie_device_cache`) for list/status, refreshed by cron; **live pass-through** for on-demand ops. This is sound — keep it.
- Background jobs already scaffolded in `lib/inngest/functions/ruijie-*` (sync, health-monitor, offline-alerts, tunnel-cleanup, token-refresh) — wire/verify rather than rebuild.
- Every mutating action → `ruijie_audit_log`. Keep this invariant for all new controls.

---

## 3. Roadmap

Each phase is independently shippable. Effort is T-shirt (S ≈ 1–2 days, M ≈ 3–5 days, L ≈ 1–2 wks).

### Phase 0 — Fix the foundation *(blocking, do first)* — **M**
Without this, every new dashboard inherits blank data.
- Capture the exact failing metrics/traffic request; compare to the Ruijie Cloud API Document (device CPU/memory §2.6.6, flow trend §2.6.2, STA list §2.5). Determine correct endpoint/params for RAP-series on `cloud-eu`.
- Fix the **unhandled rejection** in `getDeviceMetrics` (guard the sub-fetch, return partial cleanly).
- Decide: fetch metrics **live on open** (current) vs **persist to cache on sync** (enables history + alerting). Recommend: persist a metrics snapshot per sync so we get trend data for free.
- **Success:** Overview/Radio tabs show real CPU/mem/radio for an online AP; traffic chart shows non-zero for a site with traffic.

### Phase 1 — Complete monitoring & NOC — **L**
Turn "we can see devices" into "we get told when something breaks."
- Wire & verify the **offline-alerts** and **health-monitor** Inngest functions → notify finance/ops (email + WhatsApp, reuse existing channels) on device down / degraded.
- Per-device **historical charts** (CPU/mem/clients/traffic) from persisted snapshots (Phase 0 dependency).
- **Fleet health dashboard**: uptime %, offline count, worst-N devices, per-project rollups (Unjani vs Newgen vs CircleTel).
- **Connected-client visibility** confirmed working (verify against a device with active users).
- Tie device-down events into the existing **Outages** module (auto-suggest an incident when N devices at a site drop).
- **Success:** an AP going offline produces an alert within one sync cycle and appears on the health dashboard.

### Phase 2 — Remote operations — **L**
Everything an engineer would log into Ruijie Cloud to do.
- Reboot (✅ exists) + eWeb tunnel (✅ exists) — promote to a consistent "Actions" surface.
- **Switch port + PoE control** (API §2.6.7/2.6.8 + `/conf/switch/device/{sn}/poe`) — remotely power-cycle a PoE camera/AP at a clinic. High operational value.
- **Batch CLI** / **config cloning** (help-center features) — push a config to one or many devices.
- **Firmware upgrade** scheduling.
- All gated by RBAC (see §4) + audit-logged + confirm dialogs (reboot pattern already exists).
- **Success:** ops can power-cycle a specific switch port and push a CLI snippet to a device group from the app.

### Phase 3 — Provisioning & zero-touch onboarding — **M/L**
Collapse "new site" into an app workflow.
- **Add device** by SN/QR → bind to a Ruijie project → assign to a CircleTel customer/corporate site (reuse `DeviceCustomerLink` + `corporate_sites`).
- **Config templates** per product (SkyFibre, CloudWiFi, Unjani clinic standard) applied on bind.
- Link into existing **onboarding** flow so a provisioned device is tied to the order/contract.
- **Success:** onboarding a new clinic AP (bind → assign → template) is done entirely in-app.

### Phase 4 — Guest WiFi, captive portal & vouchers — **L**
Directly monetizes the **CloudWiFi WaaS** product.
- **Voucher management** (API §2.3): create voucher packages, generate/issue vouchers, query usage.
- **Captive portal** config + **PPSK / auth-account** management (API §2.4/§4): per-user WiFi credentials, add/delete/renew, usage dashboard.
- Ties to billing: voucher batches / WaaS seats as sellable units.
- **Success:** a WaaS site's guest-WiFi vouchers are issued and tracked from the app.

### Phase 5 — Customer-facing self-service — **M**
Leverage existing `/portal/sites` scaffolding.
- Read-only per-customer network view: their sites, uptime, current status, basic usage.
- Scoped by RLS/ownership so a B2B customer sees only their own devices.
- **Success:** a B2B customer logs into the portal and sees their site health without contacting support.

### Phase 6 — Multi-vendor abstraction & whitelabel — **L**
- Introduce a vendor-neutral device interface; make Ruijie one adapter, **MikroTik** a second (verify/complete the existing `mikrotik` routes).
- This is the network-management pillar of the **whitelabel ISP-in-a-box** platform (see `whitelabel-platform-baseline-design`) — a strong differentiator no competitor bundles.
- **Success:** the same device UI drives a MikroTik router and a Ruijie AP.

---

## 4. Cross-Cutting Concerns

- **RBAC** — remote-control actions (reboot, port/PoE, CLI, firmware) must be role-gated (`lib/rbac/permissions.ts`), not just "any admin." Read vs operate vs provision tiers.
- **Audit** — every mutating call → `ruijie_audit_log` (keep the existing pattern). Customer-facing actions too.
- **Rate limits / safety** — tunnel tenant cap (10), reboot confirm dialogs, batch-action guardrails (don't reboot a whole project by accident).
- **Region/endpoint correctness** — Phase 0 must document the verified `cloud-eu` endpoint set in `.claude/rules/` so it isn't rediscovered.
- **Cron mechanism** — sync is firing; confirm the alerting Inngest functions actually fire in prod before relying on them for pages (historically Inngest crons were suspect here).

---

## 5. Sequencing (DECIDED 2026-07-09)

**Approach: Balanced / comprehensive** — build the full NOC in phase order, no single track favored:

```
Phase 0 → 1 → 2 → 3 → 4 → 5 → 6
(fix)   (monitor)(operate)(provision)(monetize)(self-serve)(multi-vendor)
```

**Non-negotiable first:** Phase 0 — everything else shows blank data without it.

Each phase ships independently, so value lands continuously rather than in one big-bang release.

---

## 6. Locked Decisions (2026-07-09)

1. **Primary objective — Balanced / comprehensive.** Full NOC, phases 0→6 in order.
2. **Metrics — persist snapshots on each sync.** Phase 0 stores CPU/mem/radio/clients per device every 30-min sync into a metrics history table → historical charts (Phase 1) and threshold alerting come for free. Requires a new `ruijie_device_metrics` (or similar) time-series table + retention policy.
3. **MikroTik — in scope.** The vendor-abstraction seam (Phase 6) is part of this effort; verify/complete the existing `app/api/admin/network/mikrotik/*` subsystem as the second adapter. Design the device interface vendor-neutral from Phase 1 onward so it isn't retrofitted.
4. Customer-facing depth (Phase 5): start read-only; self-service actions revisited then.

---

## 6a. Adjacent Workstream — Revenue Assurance (separate module, depends on Phase 1)

**Decision (2026-07-09): Revenue Assurance is its own feature/module, NOT a network-management phase** — but it is built on the network inventory and starts once Phase 1 lands a trustworthy active-service signal.

**What it does:** three-way reconciliation to catch revenue leakage. The "active service" signal is **technology-dependent** (see model below); billing/invoicing are the other two legs.

### Service-Active Detection Model (per technology)

Every install — Tarana, 5G, LTE — **always has a Reyee/Ruijie AP**, and the AP only reaches Ruijie Cloud *through the customer's uplink*. So **"Reyee AP online" is the universal service-active heartbeat across ALL technologies** (uplink down → AP offline).

| Customer type | Uplink | On Interstellio RADIUS? | Active-service signals |
|---|---|---|---|
| **Tarana** (fixed wireless) | Tarana radio | ✅ Yes (L3) | Interstellio (subscriber + **usage + service profile + credit/quota**) + Tarana device state (`lib/tarana/client.ts`) + Reyee AP online |
| **5G** | MTN Router (SIM) | ❌ No (auths on MTN) | **Reyee AP online = primary** + MTN (limited) |
| **LTE** | MTN Router (SIM) | ❌ No (auths on MTN) | **Reyee AP online = primary** + MTN (limited) |

**Consequences:**
- For **5G/LTE**, the Reyee AP is the **only CircleTel-controlled active signal** → **Ruijie Phase 0 reliability is the revenue-assurance backbone for the entire 5G/LTE base**, not just NOC polish. No usage/tier data available (lives on MTN).
- For **Tarana**, Interstellio adds the rich layer (usage, tier, quota) enabling full leakage detection.

| Source of truth | Domain | Data |
|---|---|---|
| Active on network | Reyee AP (universal) + Interstellio (Tarana only) + Tarana device | `ruijie_device_cache.status`; `lib/interstellio/client.ts` (`listSubscribers`, `getSubscriberUsage`, `getCDRRecords`, `getCreditStatus`); `lib/tarana/client.ts` (`getAllDeviceStatusesNqs`) |
| Should be billed | Billing | `service_packages`, active-service records, `corporate_sites`, `customers` |
| Actually invoiced/collected | Finance | `customer_invoices`, NetCash |

### ⛔ Prerequisite gap — device/subscriber → customer mapping is incomplete
Reconciliation is only as good as the mapping. Current state (verified 2026-07-09):
- **Ruijie:** 29 cached APs → 15 linked to a site, **0 to an order, 14 unlinked**. Half the fleet has no customer/service mapping.
- **Tarana:** device online-status exists, but **no device→customer link**.
- **Interstellio:** subscriber-username ↔ customer mapping not established.

**This mapping layer is the true "Phase 0" of Revenue Assurance** — every active install's device/subscriber must resolve to a customer + service + billed package before any exception report is trustworthy. Backfill + enforce-at-provisioning (Phase 3 hook).

**First build slice + the mapping solution:** `docs/plans/2026-07-09-ra-report-reconciliation-spec.md` — a **reusable report-upload reconciliation engine** (upload → column-map → reconcile → typed exceptions → email+WhatsApp to network manager / service lead / executive), with **cellular SIM (MTN) as report type #1**. It introduces `service_network_identifiers` — one unified table mapping every source's identifier (msisdn/iccid/interstellio_uuid/ruijie_sn/tarana_serial) to a `customer_services` row — which resolves the mapping-backfill prerequisite for ALL sources, not just cellular. This is the pragmatic active-signal for the consumer cellular base (no pollable signal; static-IP polling rejected as uneconomic — carrier CGNAT).

**Exception types surfaced:**
- **Active-but-unbilled** → revenue leakage, recover cash *(priority — Interstellio shows the subscriber authenticating + consuming data with no matching active invoice; cf the Unjani legacy-hole, Task F consumer-hole, Cosmo-never-collected incidents)*
- **Billed-but-inactive** → dispute / churn risk (invoiced but subscriber disabled / zero sessions / zero usage)
- **Tier mismatch** → Interstellio **Service Profile** ≠ billed package
- **Usage-based leakage** → data over FUP/quota (Fair Usage / Credit Profiles / quota-exceeded auth-fails) not billed as overage

**Key join key:** Interstellio subscriber username (e.g. `CT-UNJ-002@circletel.co.za`, `NewExGenCT-Rivonia@circletel.co.za`) ⋈ CircleTel customer/service records — a mapping that must be established/verified as part of this module.

**Why separate:** two of its three inputs (billing truth, invoice/collection reconciliation + dispute workflow) are a finance domain of their own; and "all active services" spans every network vendor, not just Ruijie — so it consumes the **vendor-neutral active-services inventory** built here (the Phase 6 abstraction seam), making it the highest-value consumer of that seam rather than a subset of it.

**Dependency:** requires Phase 0 (telemetry fixed) + Phase 1 (reliable active/online signal + vendor-neutral inventory) before it can be trusted. Gets its own spec → plan cycle when Phase 1 is done.

---

## 7. Immediate Next Step

Phase 0 is the gate. It needs its own spec → plan cycle before implementation:
- Diagnose the exact failing Ruijie metrics/traffic endpoint on `cloud-eu` for RAP-series (capture request/response, compare to API doc §2.5/§2.6.2/§2.6.6).
- Fix the `getDeviceMetrics` unhandled rejection.
- Design the `ruijie_device_metrics` time-series table + wire persistence into the sync path.
- Design the vendor-neutral device interface (so MikroTik slots in later).
- Document the verified `cloud-eu` endpoint set in `.claude/rules/`.

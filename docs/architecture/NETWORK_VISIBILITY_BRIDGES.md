# Network Visibility Bridges — Tarana / TCS + Tri-Bridge Runbook

**Date:** 2026-07-09 · **Status:** verified live · **Scope:** how CircleTel sees active sites across the on-site device stack.

## 1. Site topology — three device layers

Every **managed** site (Unjani clinic, business connectivity) has the same stack:

```
Uplink (Tarana RN  |  MTN LTE/5G router)  →  MikroTik  →  Reyee AP(s) (indoor ± outdoor)
     │                                          │                │
    TCS bridge                              (TDX-locked)      Ruijie Cloud
     └──────────────── Interstellio (L3 PPPoE / RADIUS) ──────────┘
```

- **Consumer SIM** customers (e.g. bare MTN 5G router sold to an end-user) have **no MikroTik/Reyee** — reconcile via the MTN SIM report only.
- The **MikroTik is CircleTel-owned but not directly visible** (TDX captive-portal script holds admin; the L2TP edge-proxy management system is built but has 0 routers enrolled). See §5.

## 2. The three working bridges (verified 2026-07-09)

CircleTel can see live sites from three independent, read-only bridges. **The MikroTik is "bracketed":** TCS sees the layer above it, Ruijie the layer below it, Interstellio the L3 session through it — so Tarana-clinic liveness is fully observable **without** MikroTik access.

### 2.1 TCS — Tarana Cloud Suite (last-mile radio)
- **Code:** `lib/tarana/client.ts` + `lib/tarana/auth.ts`
- **Auth:** cookie-session — logs in with `TARANA_USERNAME`/`TARANA_PASSWORD` (in `.env`) → captures httpOnly `idToken`/`accessToken`/`userId`; browser-like headers + `X-Caller-Name: operator-portal` required (Istio gateway).
- **Base:** `https://portal.tcs.taranawireless.com` · Access as **MTN Operator 219**; CircleTel = **retailerId 1020 ("Circle Tel SA")** → RN view scoped to our own devices.
- **What you get (working):**
  - `getAllDeviceStatusesNqs('RN')` → `Map<serial, online>` — our Remote Nodes with live up/down (verified: **9 RNs, 6 online**).
  - `getDeviceBySerial(serial)` → deep per-RN detail: `linkState`, `losRange`, `sectorName`, `band`, `carriers`, `softwareVersion`, `uptimeSeconds`, mgmt `ip` + `endpoints` (web/ssh/grpc), `linkDisconnectDurationMillis`, reboot reasons.
  - Base-node inventory: 709 rows in `tarana_base_stations` (SkyFibre coverage).
- **Broken/param-nit (fix later):** `getDeviceCounts()` → 400; `getAllRemoteNodes()` → 500 (needs region/site params); `getNetworkHierarchy()` → empty.
- **Gotcha:** RN records carry **no clinic identifier** — `hostName` is a generated Tarana ID, `address` is null, `locationId` is an opaque hash, `sectorName` is the BN not the site. Mapping RN serial → clinic requires an external install cross-reference (see §4).

### 2.2 Interstellio / NebularStack (L3 subscriber / RADIUS)
- **Code:** `lib/interstellio/client.ts` — `getInterstellioClient()` auto-inits from `INTERSTELLIO_API_TOKEN` (in `.env`).
- **Base:** `subscriber-za.nebularstack.com` (+ identity/telemetry). Domain `circletel.co.za`.
- **What you get (working):**
  - `listSubscribers({ l: 50 })` — **max limit 50** (larger → 400). Verified: 25 subscribers, **14 `CT-UNJ-*` clinics, all enabled**, each with `name` = clinic name, `last_seen`, `static_ip4`, `service`/`profile`/`package`.
  - `isSessionActive(id)` — live session state (verified true for several clinics).
  - `getSubscriberUsage(id, granularity, {start,end})`, `getCDRRecords(...)`, `getSubscriberStatus(id)`.
  - The Unjani clinics' **managed connectivity itself** is on Interstellio (PPPoE), so `last_seen` ≈ "clinic/MikroTik online". 9 of 14 seen within the hour at probe time.
- **Broken:** `getSubscriberCount()` → 404 on stale path `/v1/subscriber/count`. Use `listSubscribers` / `getTotalSubscriberCount` (`/v1/subscribers/count`).

### 2.3 Ruijie Cloud (in-clinic Wi-Fi AP)
- **Code:** `lib/ruijie/client.ts` (see `ruijie-network-management-state` memory + roadmap). Cloud-eu, OAuth token. 25 devices / 22 online. Reboot + eWeb tunnel + device logs work; live CPU/mem/radio telemetry is **not** implemented (Phase 0 fix).

## 3. Unified active-signal mapping — `service_network_identifiers`

One table maps every source's identifier to a `customer_services` row (migration `20260709160000_create_service_network_identifiers.sql`).

| identifier_type | source | backfilled | notes |
|---|---|---|---|
| `ruijie_sn` | Ruijie AP SN → site → service | 23 | via `corporate_sites.service_id` |
| `interstellio_uuid` | CT-UNJ subscriber UUID → clinic | 16 (14 clinics + 2 SkyFibre) | matched on subscriber `name` → `corporate_sites.site_name` (verified 1:1) |
| `tarana_serial` | RN serial → clinic | **0 — pending** | no clinic id in TCS; needs install cross-reference (§4) |
| `msisdn` / `iccid` | MTN SIM → consumer 5G service | 0 — pending | needs SIM numbers from MTN |

**Coverage (2026-07-09):** 25 active services · **22 mapped (88%)** · **14 with 2+ independent sources** (Ruijie AP + Interstellio session — cross-verified liveness) · 39 identifiers total.

Backfills applied directly to the shared prod DB (data ops, not migrations) — same convention as the Ruijie/Interstellio backfills.

## 4. Known gaps

- **Tarana RN → clinic mapping** — 9 RNs (6 online) are an unmapped active-signal pool. TCS carries no clinic identifier on the RN; do **not** guess-map (wrong RN→clinic corrupts reconciliation). Resolve via the Unjani install/hardware register (serial → clinic) or a `hostName`/`address` convention.
- **Consumer 5G MSISDN** — Ashwyn/Raymund unmapped; needs SIM numbers from MTN (see the RA report-reconciliation spec).
- **Endpoint drift** — TCS `getDeviceCounts`/`getAllRemoteNodes`/`getNetworkHierarchy` and Interstellio `getSubscriberCount` have stale params; low-priority cleanup.

## 5. MikroTik (bracketed, not directly reachable)

Fully-built L2TP edge-proxy management system (`lib/mikrotik/*`, proxy `34.35.85.28:8443`, `mikrotik_routers` registry, 30-min sync) but **0 routers enrolled** — the gap is device **enrollment** (TDX-access), not build. Enrolling one router = insert via `POST /api/admin/network/mikrotik` (`identity`, `mac_address`, **`management_ip`** = L2TP tunnel IP, pppoe + router creds) **once** the router is on the L2TP tunnel and the proxy can RouterOS-auth it. De-risk with a bench/spare unit first. See the `mikrotik-access-state` memory for the full enrollment trace.

## 6. How to run a reachability probe

Bridges read creds at module load → **source `.env` before `tsx`**:

```bash
set -a && source .env && set +a && npx tsx scripts/<probe>.ts
```

Minimal examples:
```ts
// Tarana RN status
import { getAllDeviceStatusesNqs } from '@/lib/tarana/client'
const rn = await getAllDeviceStatusesNqs('RN')      // Map<serial, online>

// Interstellio clinics
import { getInterstellioClient } from '@/lib/interstellio'
const res = await getInterstellioClient().listSubscribers({ l: 50 })  // max 50
```

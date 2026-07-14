# WorkConnect™ SOHO FSD — Section 2 (Revised) + Integration Gap Analysis

> **Drop-in replacement for Section 2** of `CircleTel_WorkConnect_SOHO_FSD` (v1.1, CT-FSD-WORKCONNECT-SOHO-2026-001).
> **Revision:** 2026-07-14 — realigns the System Landscape, Integration Architecture, and Integration Protocols
> to the *actual* current CircleTel platform (per `docs/architecture/SYSTEM_OVERVIEW.md` v2.2 and the live `lib/` integrations),
> and adds **§2.4 Integration Gap Analysis** identifying what must be built to complete the WorkConnect delivery chain.
> Planned Value-Added Services (Cloud Backup, Email Hosting) and formal credit vetting are **retained as planned**, not stripped.

---

## 2. System Landscape & Integration Map

### 2.1 Systems of Record

The current CircleTel estate is a **Next.js 15 application on Supabase**, with Zoho as the CRM/accounting/support/e-sign
suite, NetCash for money movement, and a set of external network/AAA/CPE systems for the access layer.
`AgilityGIS BSS` from the original draft is **not part of the estate** — its billing-SoR role is fulfilled by
Supabase + Zoho Books + NetCash and is shown as superseded below.

| System | Role | Owner | Type | Platform Status |
|---|---|---|---|---|
| **Supabase (PostgreSQL)** | Core backend: database, API layer (PostgREST + Next.js API routes), product catalogue, orders, service instances, billing records, analytics, 3-context auth | CircleTel | SoR — Product, Orders, Billing, Analytics | **Live** |
| **Next.js 15 Application** | Application layer: public site, admin, customer & partner portals, API routes, middleware pipeline | CircleTel | Application host | **Live** — Coolify on VPS `94.72.104.81` (prod); Vercel (staging) |
| **Zoho CRM** | Lead tracking, sales pipeline, customer interactions, persona/churn tagging | Zoho | SoR — Sales/CRM | **Live** (async sync) |
| **Zoho Books** | Accounting ledger, invoice & customer sync, financial reconciliation | Zoho | SoR — Accounting | **Live** |
| **Zoho Desk** | Support tickets, fault management | Zoho | SoR — Support | **Live** |
| **Zoho Sign** | Contract & service-order e-signature / acceptance evidence | Zoho | External — E-Sign | **Live** |
| **NetCash Pay Now** | Payments, debit orders, eMandate, PCI vault (20+ methods) | NetCash | External — Payments | **Live** |
| **Inngest** | Event-driven, durable background jobs (provisioning, sync, notifications) | Inngest | Internal — Jobs | **Live** ¹ |
| **Didit** | KYC / identity verification (HMAC-signed webhooks) | Didit | External — Vetting | **Live** |
| **Resend** | Transactional email (`billing@notify.circletel.co.za`) | Resend | Internal — Notification | **Live** |
| **Clickatell** | SMS gateway | Clickatell | External — Notification | **Live** |
| **WhatsApp (Meta)** | WhatsApp notifications, Flows, campaign lead capture | Meta | External — Notification | **Live** |
| **Prismic** | Headless CMS for product & marketing pages | Prismic | External — Content | **Live** |
| **MTN Wholesale / Coverage** | Coverage checks (WMS, Consumer, FWB feasibility, 5G/LTE) + FWB provisioning | MTN | External — Upstream | **Partial** — coverage live; provisioning manual/CSV (Phase 1) |
| **DFA** | Fibre coverage / GIS feasibility | DFA | External — Upstream | **Live** (coverage aggregation) |
| **Echo SP Managed BNG** | PPPoE session mgmt, CGNAT, IP transit, RADIUS proxy (Huawei BNG @ JB1) | Echo SP | External — Network | **Live** (managed service) |
| **Interstellio RADIUS** | Subscriber AAA, CoA, speed profiles, CDR/session data | Interstellio | External — AAA | **Live** |
| **Ruijie Cloud** | CPE router mgmt, zero-touch provisioning, QoS templates, monitoring | Ruijie | External — CPE | **Live** — device sync live; some telemetry endpoints unavailable |
| **Tarana TCS** | Tarana G1 FWB Remote-Node visibility & management (via MTN operator) | MTN / Tarana | External — Access/CPE | **Live** (read visibility) |
| **MikroTik (edge proxy / L2TP)** | Router management registry & sync | CircleTel | Internal — Network | **Partial** — built; device enrolment pending |
| **Google Gemini** | Marketing image generation | Google | External — Content | **Live** (marketing only) |
| ~~AgilityGIS BSS~~ | ~~Billing / customer master~~ | — | ~~SoR — Billing~~ | **Superseded** — role fulfilled by Supabase + Zoho Books + NetCash |

**Planned — required for WorkConnect, not yet built** (see §2.4 for the build detail):

| System | Role | Owner | Type | Platform Status |
|---|---|---|---|---|
| **Cloud Backup Platform** | Managed cloud backup VAS (25/50/100/200 GB tiers) | CircleTel (hosted) | Internal — VAS | **Planned** — no integration yet |
| **Email Hosting Platform** | Business email accounts (`name@yourdomain.co.za`) — *distinct from Resend transactional email* | CircleTel (hosted) | Internal — VAS | **Planned** — no integration yet |
| **Credit Bureau API** | TransUnion / Experian credit scoring at order stage | External | External — Vetting | **Planned** — current vetting = Didit KYC only |

> ¹ **Inngest note:** Inngest runs event-driven durable functions. Scheduled (cron) jobs in production are driven by the
> **Vercel/Coolify cron → `/api/cron/*`** mechanism; Inngest's own cron triggers are dormant in prod (a few sync jobs,
> e.g. Ruijie/MikroTik, do fire on Inngest schedules — verify per job).

### 2.2 Integration Architecture

Solid boxes are **Live/Partial** today. Dashed `[TO BUILD]` boxes are **planned** components required to complete the
WorkConnect order-to-cash and service-management chain (detailed in §2.4).

```
+====================================================================+
|                        CUSTOMER TOUCHPOINTS                        |
|   [ Website ]  [ Admin/Partner Portal ]  [ WhatsApp ]  [ Portal ] |
+=========+=================+==================+=====================+
          |                 |                  |
          v                 v                  v
+====================================================================+
|                  CIRCLETEL APPLICATION LAYER                       |
|             Next.js 15 on Coolify (prod) / Vercel (staging)        |
|                                                                    |
|  +--------------+   +--------------+   +----------------------+     |
|  |   Supabase   |   |   Inngest    |   |   Prismic (CMS)      |     |
|  |  PostgreSQL  |<->| Durable Jobs |   |  product/mktg pages  |     |
|  | SoR: product,|   +--------------+   +----------------------+     |
|  | orders,bill, |                                                  |
|  | analytics    |   +---- Zoho Suite (async sync) --------------+  |
|  +------+-------+   |  CRM  |  Books  |  Desk  |  Sign          |  |
|         |           +-------------------------------------------+  |
|         |                                                          |
|  +--------------+   +--------------+   +----------------------+     |
|  | NetCash Pay  |   |    Didit     |   | Notifications:       |     |
|  | Now (pay/DO/ |   |    (KYC)     |   | Resend (email)       |     |
|  | eMandate/PCI)|   +--------------+   | Clickatell (SMS)     |     |
|  +--------------+                      | WhatsApp (Meta)      |     |
|                                        +----------------------+     |
|                                                                    |
|  + - - - - - - - - - - - PLANNED (TO BUILD) - - - - - - - - - - +  |
|  : [Credit Bureau API]  [Cloud Backup Platform]  [Email Hosting]:  |
|  :  TransUnion/Experian  provisioning + quota    mailbox provi- :  |
|  :  credit scoring       sync (VAS)              sioning (VAS)  :  |
|  + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +  |
+=========+=====================+=====================+==============+
          |                     |                     |
          v                     v                     v
+====================================================================+
|                   EXTERNAL INTEGRATION LAYER                       |
|                                                                    |
|  +--------------+  +--------------+  +--------------+  +---------+   |
|  | MTN Wholesale|  | DFA Coverage |  | Ruijie Cloud |  | Tarana  |  |
|  | / Coverage   |  |    / GIS     |  |  (CPE mgmt)  |  |  TCS    |  |
|  |(WMS/Consumer/|  +--------------+  +------+-------+  +----+----+   |
|  | FWB/5G/LTE)  |                           |              |        |
|  +------+-------+  +--------------+          |              |        |
|         |         |  Echo SP     |          |    +---------+----+   |
|         |         | Managed BNG  |          |    | MikroTik edge |  |
|         |         | (PPPoE/CGNAT)|          |    | proxy (L2TP)  |  |
|         |         +------+-------+          |    +--------------+   |
|         |                |                  |                       |
|         |         +------+-------+          |                       |
|         |         | Interstellio |          |                       |
|         |         | RADIUS (AAA) |          |                       |
|         |         +------+-------+          |                       |
|  + - - -+- - - - - - - - + - - - - - - - - -+- - - - - - - - - - +  |
|  : [MTN Provisioning API]  [RADIUS/BNG        [Ruijie ZTP + QoS  :  |
|  :  Phase 2 auto-order]     auto-CoA bridge]   push automation]  :  |
|  + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +  |
+=========+================+=================+========================+
          |                |                 |
          v                v                 v
+====================================================================+
|                          NETWORK / ACCESS LAYER                    |
|  [ MTN Tarana G1 Base Stations ] --- [ Tarana RN (FWB CPE) ]       |
|  [ MTN 5G NR ] --- [ 5G CPE ]     [ MTN LTE-A ] --- [ LTE CPE ]    |
|  [ Huawei BNG @ JB1 ] --- [ Echo SP L2 Switching ] --- [ Reyee ]   |
|                                                                    |
|  NOTE: MTN FTTH/GPON retired as a WorkConnect delivery path        |
|        (v1.1 change note) -> FTTH-only sites route to             |
|        HomeFibreConnect; no WorkConnect order is created.          |
+====================================================================+

  Legend
  [ solid ]  Live / Partial today
  : dashed : Planned — TO BUILD (see §2.4)
```

### 2.3 Integration Protocols

| Integration | Protocol | Auth | Direction | Frequency | Status |
|---|---|---|---|---|---|
| Supabase ↔ Next.js app | PostgREST / RPC + service-role & session clients | JWT + service-role key | Bidirectional | Real-time | **Live** |
| Supabase → Zoho CRM | REST/JSON | OAuth 2.0 (refresh token) | Push (async) | Event-driven + batch | **Live** |
| Supabase → Zoho Books | REST/JSON | OAuth 2.0 (Books refresh token) | Push (async) | On invoice/payment events | **Live** |
| Supabase → Zoho Desk | REST/JSON | OAuth 2.0 (Desk refresh token) | Bidirectional | On ticket events | **Live** ² |
| App → Zoho Sign | REST/JSON | OAuth 2.0 | Push | On contract issue | **Live** |
| App → NetCash Pay Now | HTTPS form-post + webhook | Service key + PCI vault key | Bidirectional | Per payment / debit batch | **Live** ³ |
| App → Didit | REST/JSON + webhook | API key + HMAC-SHA256 sig | Push/callback | Per KYC request | **Live** |
| App → Resend | REST/JSON | API key | Push | Event-driven | **Live** |
| App → Clickatell | REST/JSON | API key | Push | Event-driven | **Live** |
| App → WhatsApp (Meta) | Graph API + webhook | Access token | Bidirectional | Event-driven | **Live** |
| App → MTN Coverage | HTTPS (WMS/portal scrape + APIs) | Portal creds / session | Pull | Per coverage check | **Live** |
| App → DFA | REST/GIS | API key | Pull | Per coverage check | **Live** |
| Echo SP ↔ Interstellio RADIUS | RADIUS (UDP 1812/1813) + CoA | Shared secret | Proxy | Per PPPoE session | **Live** |
| App → Ruijie Cloud | REST/JSON | OAuth 2.0 | Bidirectional | Provisioning + 30-min poll | **Live** |
| App → Tarana TCS | HTTPS (NQS) | Cookie session (MTN operator) | Pull | On demand / poll | **Live** (read) |
| App → MikroTik edge proxy | API over L2TP tunnel | Router creds | Bidirectional | Sync cron | **Partial** |
| App → MTN Wholesale provisioning | Manual / CSV (Phase 1); **API (Phase 2)** | Portal creds | Push | Per order | **Partial → TO BUILD** |
| App → Cloud Backup Platform | REST/JSON | API key | Push | On provision + daily sync | **TO BUILD** |
| App → Email Hosting Platform | REST/JSON | API key | Push | On provision + changes | **TO BUILD** |
| App → Credit Bureau | REST/JSON | API key + client cert (TLS 1.3) | Push/Pull | Per credit check | **TO BUILD** |

> ² Zoho Desk API caveat: tags are read-only via REST; record campaign/type on custom fields and filter via keyword search
> (see repo rule `.claude/rules/zoho-desk-api.md`). ³ NetCash: amount is `p4` in Rands (not cents); `m2` is the PCI vault key.

---

## 2.4 Integration Gap Analysis — What Must Be Added to Complete WorkConnect

The current platform already supplies the **core** (Supabase, Zoho, NetCash, notifications, Didit) and the **access network**
(MTN coverage, Echo SP BNG, Interstellio RADIUS, Ruijie, Tarana). To run WorkConnect end-to-end (order → provision →
activate → bill → support) the following must be **added or automated**. Grouped by build type, with the FSD section each
unblocks.

### A. New external integrations to build

| # | Integration | Powers (FSD ref) | Current state | Priority |
|---|---|---|---|---|
| A1 | **Cloud Backup Platform** — account/quota provisioning API, off-peak scheduling, usage (`used_gb`) polling, 80%/95% quota alerts, POPIA 30-day retention + export | §3.2.9 `wc_vas_accounts`, §9.3 STEP 3, §15.1 `WC_BACKUP_QUOTA_*` | No provider selected, no code | **High** (bundled in every tier) |
| A2 | **Email Hosting Platform** — domain + mailbox provisioning API, quota per tier (2/5/10 + add-ons), auto-password + welcome delivery, suspend/deprovision lifecycle | §3.2.9 `wc_vas_accounts`, §9.3 STEP 4 | No provider selected, no code | **Medium** (VAS, can lag launch) |
| A3 | **Credit Bureau API** (TransUnion / Experian) — client-cert TLS, score → band mapping (≥580 pass / 450–579 conditional / <450 reject) | §5.2 CREDIT_CHECK, §18 VR-WC-005 | Only Didit KYC (identity, not credit score) exists | **High** (gates order flow) — or formally waive to Didit-only |

### B. Existing integrations to extend / automate

| # | Work | Powers (FSD ref) | Current state | Priority |
|---|---|---|---|---|
| B1 | **MTN Wholesale provisioning API (Phase 2)** — automated FWB/5G/LTE order placement + status callbacks into the order state machine | §5, §9.2 payloads, §19.1 | Coverage is live; **provisioning is manual/CSV** — the single biggest operational gap | **High** |
| B2 | **RADIUS/BNG automation bridge** (Interstellio + Echo SP) — programmatic subscriber create (`wc-{service}@circletel.co.za`), speed profile, CGNAT pool, static IP; **auto-CoA** for throttle/restore (billing D14/D30) and tier up/down | §6.3, §9.3 STEP 1, §10.1–10.3 | RADIUS/CoA live for existing services; WorkConnect orchestration + CoA triggers not wired | **High** |
| B3 | **Ruijie Cloud provisioning automation** — ZTP register call, QoS template push (`wc_standard`/`wc_pro`), monitor alerts → `wc_support_tickets` | §9.3 STEP 2 & 5, §11.1–11.3 | Device sync live; ZTP + QoS push + alert→ticket not automated; some telemetry endpoints 404 (limits CPU/mem alerts) | **Medium** |
| B4 | **Tarana TCS order/site-survey bridge** — RN serial capture into `wc_service_instances`, site-survey signal (dBm) feed | §3.2.2 `rn_device_serial`, §5.1 SITE_SURVEY | TCS gives read visibility only; assignment + survey status likely manual | **Medium** |
| B5 | **Zoho Books WorkConnect invoice sync** — push `wc_invoices` to the accounting ledger (extend existing `books-sync-orchestrator`) | §7, §3.2.7 | Books sync exists for current billing; WorkConnect tables not mapped | **High** (replaces AgilityGIS assumption) |

### C. New CircleTel platform components to build

| # | Component | Powers (FSD ref) | Current state | Priority |
|---|---|---|---|---|
| C1 | **`wc_*` schema migrations** — all Section 3/4 tables (customers, service_instances, addons, orders, line_items, cpe_devices, invoices, tickets, vas_accounts, coverage_checks, product_catalogue) + functions | §3, §4 | None deployed to Supabase | **High** (foundational) |
| C2 | **`/api/v1/workconnect/*` endpoints** — coverage-check, orders, service upgrade/cancel | §17 | Not built | **High** |
| C3 | **Order & service state-machine orchestration** — Inngest functions driving §5/§6 transitions, incl. billing-failure escalation (D0/3/14/30/60) | §5, §6, §7.4 | Not built | **High** |
| C4 | **`WC_*` notification templates** — welcome, invoice, throttle, suspend, restore, ticket, quota, win-back on Resend/Clickatell/WhatsApp | §15.1 | Channels live; WorkConnect templates not authored | **Medium** |
| C5 | **Reconciliation & data-consistency jobs** — nightly RADIUS↔service, VAS↔service, invoice↔payment-method checks | §19.2 | Not built | **Medium** |

### Summary — sequencing to "complete"

1. **Foundational (build first):** C1 schema → C2 API → C3 orchestration → B5 Zoho Books sync.
2. **Order-flow gates:** A3 credit bureau (or documented Didit-only waiver) + B1 MTN provisioning API.
3. **Activation chain:** B2 RADIUS/CoA automation → B3 Ruijie ZTP/QoS → B4 Tarana bridge.
4. **VAS:** A1 Cloud Backup (launch) → A2 Email Hosting (fast-follow).
5. **Hardening:** C4 templates → C5 reconciliation jobs.

Once A–C are delivered, every system referenced in the FSD is either **Live** or **built**, and the architecture in §2.2
has no remaining dashed boxes.

---

*CircleTel SA (Pty) Ltd — A member of the New Generation Group*
*"Connecting Today, Creating Tomorrow"*

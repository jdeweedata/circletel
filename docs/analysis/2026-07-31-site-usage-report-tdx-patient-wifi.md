# Research: TDX / ThinkWiFi patient Free Wi-Fi metrics per clinic site

**Date**: 2026-07-31  
**Issue**: [#664](https://github.com/jdeweedata/circletel/issues/664) (wayfinder research; part of #661 Site Network Usage Report)  
**Scope**: What patient Free Wi-Fi metrics CircleTel can obtain **per clinic site** for a **chosen date range**, how (API vs manual), and what to say about latency / authenticity in a branded report footnote.  
**Method**: Primary sources in-repo only — Unjani/TDX MSA extracts, Venue Performance / register / google-data artifacts, and a codebase search for APIs/scripts/integrations. No live TDX dashboard login was performed in this ticket.

---

## Verdict (short)

| Question | Answer |
|----------|--------|
| Live CircleTel → TDX/ThinkWiFi API? | **No.** None in `lib/`, `app/api/`, `scripts/`, or env (`.env.example` / `.env.local`). |
| Per-site, date-range metrics exist? | **Yes** — via TDX’s Looker Studio / Circletel-Unjani dashboard (manual export / screenshot), evidenced by in-repo CSV + register extracts. |
| Suitable for Site Network Usage Report Patient Wi-Fi section? | **Usage-facing metrics yes** (users, sessions, download GB). **Ad revenue / CPM / share lines are commercial** — keep out of the usage report per `CONTEXT.md` glossary; they remain available for finance. |
| Authenticity for footnote | Label as **TDX/ThinkWiFi aggregate analytics** (not CircleTel-measured); stamp **period + export/generated-at**; note numbers can be **revised** after export. |

---

## 1. Contractual primary source — TDX ↔ CircleTel MSA

Source: `docs/clients/unjani-clinics/TDX_CIRCLE_TEL_MSA_KEY_COMMERCIAL_TERMS.md` (extracted from TDX_Circle_Tel_MSA_Final.pdf / WiFi Monetisation Partnership MSA v5.0).

### What TDX must provide (Clauses 5 & 9)

- Captive portal + ad-tech platform  
- **Analytics dashboard**  
- **Monthly revenue / performance reports**  
- **Weekly reconciliation**  
- **Real-time dashboard** explicitly listing:
  - gross revenue **per site**
  - **user metrics**
  - **impressions**
  - revenue-share calculations  

### Data-access / POPIA boundary (Clause 8)

| Item | Owner / rule |
|------|----------------|
| Captive portal / ad-tech IP | TDX |
| User data controller | **TDX** (POPIA) |
| CircleTel access | **Aggregate / anonymised analytics only — no PII** |
| Healthcare | Enhanced protection obligations apply |

**Implication for the branded report**: Patient Wi-Fi numbers must be framed as TDX-sourced aggregates. CircleTel must not claim first-party measurement of patient identities or session PII.

### Commercial reporting lag (Clause 7.8) — not the same as dashboard lag

- TDX billing advice: by **7th of the following month**  
- Recovery payment: 30 days; revenue-share: 60 days  

Use billing calendars for money; use dashboard period stamps for usage metrics.

### Unjani MSA

`docs/clients/unjani-clinics/UNJANI_MSA_KEY_COMMERCIAL_TERMS.md` covers connectivity (R450/site, SLA, CPE). It does **not** define patient Free Wi-Fi analytics deliverables — those sit in the TDX monetisation MSA.

---

## 2. In-repo Venue Performance / dashboard artifacts

### 2.1 Looker Studio / Circletel-Unjani dashboard (operational source of truth)

Evidence:

- Complete register metadata cites **“Looker Studio ThinkWiFi dashboard (Jan–Apr 2026)”**  
  (`docs/clients/unjani-clinics/Unjani_Clinic_Network_Complete_Register_v3_1.json`).  
- Screenshot set under `docs/clients/unjani-clinics/google-data/` includes per-clinic month PNGs and  
  `Circletel-Unjani-Dashboard-›-2-Venues-Places-05-24-2026_05_54_PM.png` (dashboard UI capture).  
- Transcribed export: `docs/clients/unjani-clinics/google-data/unjani_clinic_performance.csv`.

### 2.2 Metrics available **per clinic × date range**

Columns observed in `unjani_clinic_performance.csv` (April full month + May partial month):

| Metric | Field | Usage report? | Notes |
|--------|-------|---------------|-------|
| Unique users | `Unique Users` | **Yes** | Aggregate; not PII |
| Login sessions | `Login Sessions` | **Yes** | Captive / portal sessions |
| Ad impressions | `Ad Impressions` | Optional / secondary | Engagement; not traffic volume |
| Download volume | `Download GB` | **Yes** | Patient Free Wi-Fi data use |
| Gross ad revenue | `Gross Revenue (R)` | **No** (finance) | Avoid in Site Network Usage Report |
| Net revenue | `Net Revenue (R)` | **No** (finance) | |
| ThinkWiFi share | `Think Share (R)` | **No** (finance) | |
| Partner / CircleTel share | `Partner Revenue (R)` | **No** (finance) | |

**Date-range proof**: periods in the CSV are not only calendar months — e.g. `1 May - 23 May 2026` vs `1 Apr - 30 Apr 2026`. Grain is **one row per clinic per selected period**.

### 2.3 Register / Venue Performance enrichments

`pilot_performance` on ThinkWiFi pilot clinics in the complete register adds the same core measures under Apr 2026 labels, plus derived fields:

- `apr_users_*`, `apr_sessions_*`, `apr_impressions_*`, `apr_download_gb`, gross ad revenue (26d and 30d prorated)  
- `apr_rpi` (revenue per impression)  
- `sessions_per_user`, `impressions_per_user`, `gb_per_user`  
- `pct_network_users` / `pct_network_impressions`  
- `performance_tier`, `dashboard_status`  
- Hardware context (`ap_type`, `hw_status`) — deployment metadata, not usage  

Network rollup in the same file (example Apr window): total users, impressions, gross ad revenue across active pilot sites.

`Unjani_ThinkWiFi_Venue_Performance_v5_0.json` is **network-level monthly revenue / CPM / CircleTel P&L** — useful for finance corrections, **not** the per-site usage grain for a site report.

Referenced but **not present** as files in-repo at research time (only cited by the register):

- `Unjani_ThinkWiFi_Venue_Performance_v3_0.json` (engagement metrics)  
- `Unjani_ThinkWiFi_Connected_Clients_Snapshot_v4_0.json` (**point-in-time** clients — not a date-range series)  
- `Unjani_ThinkWiFi_Hardware_Performance_Master_v4_0.json`  

Treat those as historical extracts that fed the register, not as a live feed.

### 2.4 Per-site actuals spreadsheet extract

`docs/clients/unjani-clinics/per-site-actuals-corrected.json` — monthly gross revenue + Apr impressions + rev/impr by clinic. Confirms per-site commercial + impression availability; same source family as the dashboard.

---

## 3. API vs manual export — codebase reality

| Channel | Status in CircleTel repo (2026-07-31) |
|---------|--------------------------------------|
| HTTP client / SDK for TDX or ThinkWiFi | **Absent** |
| Admin or cron routes ingesting patient Wi-Fi metrics | **Absent** |
| Env vars (`TDX_*`, `THINKWIFI_*`, Looker tokens) | **Absent** |
| Scripts that pull dashboard data | **Absent** (only static JSON/CSV/XLSX artifacts) |
| Manual Looker Studio / Circletel-Unjani dashboard export | **Documented by artifacts** (CSV + PNGs + register sourced from dashboard) |
| MSA “real-time dashboard” | **Contractual obligation on TDX**; delivery appears to be **TDX-hosted Looker**, not a CircleTel API |

**Near-term Site Network Usage Report implication**: Patient Wi-Fi section must be populated by **manual (or future automated) export from TDX’s dashboard**, or omitted with an explicit “source unavailable” state — not by calling a CircleTel backend today.

**Do not confuse with CircleTel-owned telemetry**:

- Interstellio / BNG usage → Staff / backhaul paths where enrolled  
- Ruijie Cloud STA / clients → AP-side clients (SSID-dependent; not TDX ad/session ledger)  
- MikroTik admin path is TDX-locked for captive portal; L2TP management built but **0 routers enrolled** (`docs/architecture/NETWORK_VISIBILITY_BRIDGES.md`)  

Those are **Staff / infrastructure** sources. Patient Free Wi-Fi **monetisation and portal analytics** remain TDX-controlled.

---

## 4. Latency

| Layer | Observed / contractual latency |
|-------|--------------------------------|
| Dashboard period selection | Flexible (full month or mid-month cut, e.g. 1–23 May) |
| CircleTel artifact freshness | Manual: screenshots dated; CSV transcribed after dashboard view — **hours–days**, not streaming into BSS |
| Number stability | **Not frozen at first pull** — v5.0 corrections changed Feb MP share and replaced Apr 24-day snapshot with full 30-day data (`Unjani_ThinkWiFi_Venue_Performance_v5_0.json` metadata) |
| Connected-clients snapshot | Point-in-time only (register citation) — **not** a substitute for period totals |
| Commercial reconciliation | Weekly recon + monthly reports; billing advice by 7th following month |

For a branded PDF: treat patient metrics as **as-of the export timestamp**, not “live at open”.

---

## 5. Authenticity — recommended report footnote

Suggested Patient Wi-Fi footnote copy (adapt as needed):

> Patient Free Wi-Fi figures are **aggregate analytics supplied by Think Digital X (TDX) / ThinkWiFi** via the Circletel–Unjani venue dashboard (Looker Studio). They are **not measured by CircleTel’s own BSS or RADIUS**. Under the TDX–CircleTel MSA, CircleTel receives **anonymised aggregates only** (no patient PII). Period: **{start} – {end}**. Exported / captured: **{generated_at ISO}**. Figures may be revised by TDX after this export; re-pull for disputes.

Always:

1. Separate **Staff Wi-Fi** (CircleTel-attributable) from **Patient Wi-Fi** (TDX) in the layout and source labels (`CONTEXT.md`: Site Network Usage Report).  
2. Prefer usage metrics (users, sessions, Download GB) in the usage PDF; keep revenue/CPM for finance packs.  
3. Show **generated-at** and **period** on every page that carries patient numbers.

---

## 6. What CircleTel can obtain for a chosen date range (checklist)

**Available today (manual dashboard export), per clinic site:**

1. Unique users  
2. Login sessions  
3. Ad impressions  
4. Download GB  
5. (Finance only) Gross / net / Think share / partner revenue for the same period  

**Not available as a CircleTel live API:** any of the above.  
**Not evidenced as a date-range series in remaining artifacts:** live connected-client time series (only a cited point-in-time snapshot).  
**Out of scope for patient section authenticity:** claiming CircleTel first-party patient Wi-Fi metering.

---

## 7. Sources consulted

| Source | Path / ref |
|--------|------------|
| TDX MSA key terms | `docs/clients/unjani-clinics/TDX_CIRCLE_TEL_MSA_KEY_COMMERCIAL_TERMS.md` |
| Unjani MSA key terms | `docs/clients/unjani-clinics/UNJANI_MSA_KEY_COMMERCIAL_TERMS.md` |
| Venue Performance v5.0 | `docs/clients/unjani-clinics/Unjani_ThinkWiFi_Venue_Performance_v5_0.json` |
| Complete site register (pilot_performance + Looker citation) | `docs/clients/unjani-clinics/Unjani_Clinic_Network_Complete_Register_v3_1.json` |
| Per-site performance CSV | `docs/clients/unjani-clinics/google-data/unjani_clinic_performance.csv` |
| Dashboard / venue screenshots | `docs/clients/unjani-clinics/google-data/*.png` |
| Per-site actuals | `docs/clients/unjani-clinics/per-site-actuals-corrected.json` |
| Financial model (dashboard corrections) | `docs/clients/unjani-clinics/UNJANI_FINANCIAL_MODEL.md` |
| Network visibility (MikroTik/TDX lock) | `docs/architecture/NETWORK_VISIBILITY_BRIDGES.md` |
| Product glossary (report shape) | `CONTEXT.md` — Site Network Usage Report |
| Code/env search | No `tdx` / `thinkwifi` clients under `lib/`, `app/api/`, `scripts/`; no matching env keys |

---

## 8. Residual risk / follow-ups (not done in #664)

- Confirm with TDX whether Looker export can be **API- or scheduled CSV**-fed into BSS (MSA promises dashboard, not an open API).  
- Re-locate Connected Clients Snapshot v4.0 if point-in-time concurrent clients are needed for a footnote caveat.  
- Do **not** treat Ruijie STA totals as Patient Free Wi-Fi without proving SSID = patient captive SSID and excluding staff.
)

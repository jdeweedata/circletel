# Site Network Usage Reports — Product / Design Spec Outline

**Status:** Ready for implementation plan (map destination met)  
**Date:** 2026-08-01  
**Wayfinder:** [#661](https://github.com/jdeweedata/circletel/issues/661) · Assemble task [#683](https://github.com/jdeweedata/circletel/issues/683)  
**Audience:** Engineer writing the implementation plan / MVP build (separate from this map)

This outline consolidates locked grilling decisions. It is **not** the MVP build.

---

## 1. Product intent

Admins generate and download **CircleTel-branded per-site PDFs** (optional CSV of the same numbers) for **active-service corporate sites**, covering locked report periods, with a **generated-at stamp** and logo/branding.

- **Unit of delivery:** one PDF per site  
- **Bulk:** ZIP of per-site PDFs (+ skip slips where a site is not available)  
- **Audience:** admin-only (no customer portal in v1)  
- **Primary UI:** Network → Usage Reports; shortcut on corporate site detail  
- **Unjani extras:** **Staff Wi-Fi** (CircleTel SSID rollups) and **Patient Free Wi-Fi** (TDX/ThinkWiFi), labelled as separate sources — never summed with each other or with core traffic

---

## 2. Report periods (Africa/Johannesburg)

| Preset | Bounds |
|--------|--------|
| Weekly | Last complete Mon–Sun week |
| Monthly | Last complete calendar month |
| 60-day | Rolling 60 days ending yesterday |
| Custom | Inclusive range, max 90 days |

All period labels and generated-at stamps use **SAST** (`Africa/Johannesburg`).

---

## 3. Site inclusion ([#665](https://github.com/jdeweedata/circletel/issues/665))

| Rule | Choice |
|------|--------|
| Universe | `corporate_sites` with status `active` |
| Optional expand | UI toggle to include `provisioned` |
| Linked service | If `service_id` set → linked `customer_services` must be `active` |
| Null `service_id` | Allowed when site is `active` |
| No telemetry | Still listed; report / ZIP slip = not available (no fake zeros) |
| Consumer | Out of v1 |
| Unjani preset | Filter corporate code `UNJ` |

---

## 4. Core traffic source stack ([#669](https://github.com/jdeweedata/circletel/issues/669), research [#662](https://github.com/jdeweedata/circletel/issues/662))

One **primary** byte series per report. Never sum Ruijie + Interstellio.

| Period | Primary |
|--------|---------|
| Weekly + custom ≤7 days | **Ruijie** hourly rollups when site→device→`group_id` linked and window covered; else **Interstellio** if mapped |
| Monthly / 60-day / custom >7 days | **Interstellio only** (daily, ≤90d). Ruijie must not be sole source |
| Neither / incomplete | Site **not available** → ZIP skip slip |

**Labelling**

- Core header names exactly one primary (`Ruijie traffic rollups (hourly)` or `Interstellio subscriber usage (daily)`).
- Footer: generated-at (SAST), period bounds, “Figures are from the labelled source only; do not combine with other network layers.”
- Short periods with both links: optional secondary panel “BNG / Interstellio (same period)” — not summed into primary.
- Longer periods: Interstellio panel only.

Research: `docs/analysis/2026-07-31-site-usage-report-circletel-telemetry.md`

---

## 5. PDF / design ([#667](https://github.com/jdeweedata/circletel/issues/667))

**Chosen layout: A — Classic document** (invoice-like hierarchy).

### Structure (top → bottom)

1. Brand header — CircleTel logo, report title, generated-at  
2. Site identity — name, code, account  
3. Period block — preset label, date range, timezone  
4. KPI strip — Downloaded / Uploaded / Avg DL / Peak bucket (from primary core source)  
5. Core site traffic — time series chart + primary source label + note  
6. Device identity — name, model, SN, group, status  
7. Unjani only — Wi-Fi breakdown (Staff + Patient), “separate sources — do not sum”  
8. Footer — site code, generated-at, do-not-sum reminder

### Chart axis (locked on Variant A)

- X-axis: **day of month** under each bar  
- Band labels: **Week 1…N** (Mon-start buckets of 7 days within the period)

### Prototype artifacts (reference only — not production)

- Branch: [`prototype/site-usage-report-pdf`](https://github.com/jdeweedata/circletel/tree/prototype/site-usage-report-pdf)  
- Route: `/admin/network/usage-reports/prototype?variant=A`  
- Sample PDF: `docs/prototypes/2026-07-31-site-usage-report-unjani-alexandra.pdf`  
- README: `docs/prototypes/README-site-usage-report.md`

### Optional CSV

Same numeric fields as the PDF for the selected site/period; companion download, not a substitute brand surface.

---

## 6. Unjani Staff Wi-Fi ([#682](https://github.com/jdeweedata/circletel/issues/682), instrumentation [#672](https://github.com/jdeweedata/circletel/issues/672))

| Decision | Choice |
|----------|--------|
| Title | **Staff Wi-Fi** (not “Staff Wi-Fi (CircleTel)”) |
| Primary metric | Total GB = `SUM(rx_bytes + tx_bytes)`; also show download + upload |
| Query | `ruijie_ssid_traffic_rollups` where `corporate_site_id = site`, `ssid = 'Unjani Clinic Staff'`, `hour_bucket` in report period |
| vs core (#669) | **Independent** of Ruijie/Interstellio core gate — same Staff query for week / month / 60d / ≤90d |
| Show GB | ≥1 Staff hour row in period |
| N/A (linked, no rows) | “Not available — no Staff Wi-Fi samples in this period” |
| N/A (no AP↔site path) | “Not available — AP not linked to site” ([#670](https://github.com/jdeweedata/circletel/issues/670) still applies) |
| Footnote (when numbers shown) | Sampled STA session telemetry (not accounting-grade); forward-only from sampler go-live; may undercount short sessions / gaps |

**Never** invent Staff from site/BNG totals, group rollups, or live Kbps. Free radio SSID is **not** Staff.

Parallel map #672 closed: migration + Inngest `ruijie-ssid-sta-sampler` writing Staff-only allow-list rows.

---

## 7. Unjani Patient Free Wi-Fi ([#671](https://github.com/jdeweedata/circletel/issues/671), research [#664](https://github.com/jdeweedata/circletel/issues/664))

| Decision | Choice |
|----------|--------|
| Source | Admin-uploaded **TDX/ThinkWiFi Looker CSV** for the period |
| Metrics | Unique users, login sessions, download GB |
| Missing export | “Awaiting TDX export” (not zeros) |
| Not used | Ruijie Free SSID radio, STA live Kbps, device Traffic-tab aggregate as patient |

Label as TDX anonymised analytics; numbers may be revised by TDX. Distinct from Staff and from core BNG/AP flow. Research: `docs/analysis/2026-07-31-site-usage-report-tdx-patient-wifi.md`

Device Traffic tab (ops UI, not Patient block): per-SN aggregate flow ≤7d is **not** SSID-split and is **not** the Patient section.

---

## 8. Generation: sync vs async ([#666](https://github.com/jdeweedata/circletel/issues/666))

| Batch size | Mode |
|------------|------|
| 1–5 sites | Synchronous download |
| >5 sites | Async Inngest job + in-admin progress + later download |
| Email notify | **Not** in v1 |
| Unavailable sites in ZIP | Include skip/error slip PDF (or equivalent), not silent omit with fake zeros |

---

## 9. Retention and audit ([#668](https://github.com/jdeweedata/circletel/issues/668))

| Concern | Rule |
|---------|------|
| Audit metadata | Always persist, long-lived: who, when, sites, period, sources, patient CSV flag, job id, outcome |
| File bytes (PDF/ZIP) | Retain **14 days** for re-download, then purge |
| Regenerate | New `generated-at`; **not** bit-identical to prior run |

---

## 10. Explicit non-goals (v1 / this map)

- Customer self-serve portal reports  
- Apps / ad revenue / ThinkWiFi platform rebuild  
- Email delivery of reports  
- Non-Unjani multi-SSID venue splits (deferred — see open questions)  
- Bit-identical monthly regenerates  
- Summing Patient + Staff + BNG/core into one “total Wi-Fi”

---

## 11. Open questions (out of map destination)

- Whether non-Unjani multi-SSID venues get any SSID split later  
- Email delivery to stakeholders  
- Residual Unjani AP↔site link gaps (ops backfill; report shows N/A until linked)  
- Admin UI for SSID allow-lists / sampler gap alerts (ops hardening, not report layout)

---

## 12. Suggested implementation-plan hand-off

Build order for a **separate** implementation plan (not this document’s job):

1. Admin Usage Reports picker (inclusion filter, periods, Unjani preset, patient CSV upload)  
2. Core traffic assembler (#669 period gate) + not-available / skip slip  
3. Staff assembler from `ruijie_ssid_traffic_rollups` (#682 states)  
4. Patient assembler from uploaded TDX CSV (#671)  
5. PDF renderer — Layout A hierarchy + day/week chart axis (#667)  
6. Optional CSV companion  
7. Sync (≤5) + async Inngest ZIP (>5) (#666)  
8. Audit row + 14-day blob retention/purge (#668)  
9. Site-detail shortcut + Network nav entry  

Prototype Variant A on `prototype/site-usage-report-pdf` is the visual reference; production should not ship the `/prototype` route as-is.

---

## Decision index

| Ticket | Role |
|--------|------|
| [#662](https://github.com/jdeweedata/circletel/issues/662) | Research — CircleTel telemetry by period |
| [#663](https://github.com/jdeweedata/circletel/issues/663) | Research — Staff attribution gaps (superseded for live path by #672/#682) |
| [#664](https://github.com/jdeweedata/circletel/issues/664) | Research — TDX patient metrics |
| [#665](https://github.com/jdeweedata/circletel/issues/665) | Grill — active-service inclusion |
| [#666](https://github.com/jdeweedata/circletel/issues/666) | Grill — sync vs async ZIP |
| [#667](https://github.com/jdeweedata/circletel/issues/667) | Prototype — Layout A chosen |
| [#668](https://github.com/jdeweedata/circletel/issues/668) | Grill — retention / audit |
| [#669](https://github.com/jdeweedata/circletel/issues/669) | Grill — Ruijie vs Interstellio by period |
| [#670](https://github.com/jdeweedata/circletel/issues/670) | Grill — Staff N/A when attribution path missing |
| [#671](https://github.com/jdeweedata/circletel/issues/671) | Grill — Patient via TDX CSV |
| [#672](https://github.com/jdeweedata/circletel/issues/672) | Parallel map — SSID rollup instrumentation (closed) |
| [#682](https://github.com/jdeweedata/circletel/issues/682) | Grill — Staff section when rollups live |
| [#683](https://github.com/jdeweedata/circletel/issues/683) | Task — this outline |

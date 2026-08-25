# Revenue Assurance — Map-Coverage Audit (2026-07-09)

First reconciliation pass: every **active `customer_services`** row matched against its network active-signal (Ruijie AP online, Interstellio link) and billing freshness. Read-only, live prod DB.

## Coverage summary (32 active services)

| Category | Svcs | MRR | Online Ruijie | Interstellio | Any signal | **No signal** | Invoiced≥Jun |
|---|---|---|---|---|---|---|---|
| corporate (Unjani) | 19 | R8,550 | 10 | 0 | 10 | **5** | 16 |
| fixed_wireless (Tarana) | 7 | R999 | 0 | 7 | 7 | 0 | 1 |
| business_connectivity | 3 | R1,350 | 0 | 0 | 0 | **2** | 0 |
| residential | 2 | R1,548 | 0 | 1 | 1 | **1** | 2 |
| 5g | 1 | R449 | 0 | 0 | 0 | **1** | 1 |
| **Total** | **32** | **~R12,896** | 10 | 8 | **18 (56%)** | **9 (28%)** | 20 |

**Only 56% of active services have any verifiable network active-signal; 28% have none.**

## Join model discovered
- `corporate_sites.service_id → customer_services.id` (20/20 valid) — the Unjani/corporate path.
- `ruijie_device_cache.corporate_site_id → corporate_sites.id` — Ruijie AP → site.
- `customer_services.connection_id` = **Interstellio subscriber UUID** (Tarana/fixed_wireless path).
- `corporate_sites.interstellio_subscriber_id` exists but is **0% populated** (dead link path).
- **No Tarana device → service link** anywhere.

## Findings

### 1. The "6 unbilled Tarana services" = TEST DATA, not leakage ✅ caught
The active-but-unbilled fixed_wireless rows are all **R0 test/junk records**: `Amoeba User`, `Test User` (Test Package), `ECHO Connection`, `Subscriber 2645064 / 3332867 / 35b741c8` (Standard Package, R0). They carry a real `connection_id` so they'd score as "active on Interstellio" and pollute every reconciliation. **Action: quarantine/delete.** Plus `Unjani Clinic - Training Demo` (known demo CT-2026-09999) in business_connectivity.
→ Stripping junk, real active services ≈ **25**.

### 2. Real structural gap — the 5G base has no active-signal linkage
- **Ashwyn Watkins** — 5G 35 Mbps, **R449, invoiced 2 Jul**, no Interstellio (on MTN), no mapped Reyee AP.
- **Raymund Watson** — 5G 60 Mbps, **R649, invoiced 2 Jul**, same.
→ **R1,098/mo billed but currently unverifiable.** Per the topology they *should* have a Reyee AP; it's just not mapped. **Action: confirm + map their Reyee APs.**

### 3. Unjani AP → service mapping is BROKEN (reverse check)
**10 online APs are unlinked**; 8 are clearly clinics: `UNJANICLINICKAYAMANDI, UNJANIALEX2, UNJANICLINICUMSINGA, UNJANICLINICZAMDELA, UNJANICLINICBARCELONA, UNJANICLINICBARC2, UNJANICLINICDURBAN, UNJANICOSMO2` (2 are Newgen internal, legitimately not services). So clinics like Kayamandi/Alexandra/Umsinga/Zamdela show `online_aps=0` against their service **even though their AP is online** — the AP↔site↔service link is missing. They're billed, so not leakage, but **un-monitorable** until linked.
→ **Action: link the 8 online clinic APs to their `corporate_sites`/service.**

### 4. Billed but AP offline — investigate
- **Unjani Clinic - Oukasie** — R450 invoiced, its AP is offline → genuine service-down-but-billed candidate (outage or churn). (Note: memory flags Oukasie as an approved-extension free clinic — reconcile.)

### 5. Pipeline (not leakage)
- **Unjani Clinic Delmas** — R450, never invoiced, onboarding `submitted` (not `billing_ready`) → correctly not billed yet.

## What this means for Revenue Assurance
The reconciliation engine is feasible and the join model is now known — but it is **gated by three data problems**, in priority order:
1. **Data hygiene** — 6 test Interstellio subscribers + 1 demo clinic must be quarantined or every report shows false "active" rows.
2. **Unjani AP→site→service mapping** — 8 online clinic APs unlinked; backfill the links.
3. **5G/LTE Reyee AP mapping** — the entire non-Interstellio base needs its AP mapped, or it stays unverifiable (structural, per topology).
4. Standardize on **one** Interstellio link (`connection_id` is populated; `corporate_sites.interstellio_subscriber_id` is dead — pick one).

These four items ARE the "mapping backfill" prerequisite named in the roadmap §6a. Only after them is an automated active-but-unbilled / billed-but-inactive report trustworthy.

---

## Remediation applied — 2026-07-09 (Option 2)

Built the unified mapping table and backfilled it (migration `20260709160000_create_service_network_identifiers.sql`, applied to prod):

- **`service_network_identifiers`** created (service_id ↔ identifier_type/value; types msisdn/iccid/interstellio_uuid/ruijie_sn/tarana_serial).
- **Linked 9 unlinked APs** to their verified sites (`ruijie_device_cache.corporate_site_id`): Alexandra, Barcelona (+BARC2), Kayamandi, Umsinga, Zamdela, Cosmo City (COSMO2), Oukasie, Durban.
- **Backfilled 25 identifiers**: 23 `ruijie_sn` + 2 `interstellio_uuid` (real priced SkyFibre services; R0 test subscribers excluded).
- **Quarantined 7 test/demo records** (reversible: `active=false`, `status=cancelled`): 6 R0 Interstellio test subs (already status=cancelled, active flag left true) + the R450 Training Demo clinic.

**Coverage before → after:**

| Metric | Before | After |
|---|---|---|
| Active services | 32 (incl. junk) | **25** (junk quarantined) |
| Mapped to a network signal | 18 (56%) | **22 (88%)** |
| Services with an online-AP signal | 10 | **16** |
| Previously-broken clinics (Kayamandi/Alexandra/Umsinga/Zamdela) | 0 online-AP | **all 4 resolve** ✅ |

**Residual (3 unmapped active services):**
- **Ashwyn Watkins** (5G R449) & **Raymund Watson** (5G R649) — MSISDN capture blocked; no SIM number stored anywhere (needs the numbers from MTN). Belongs to the cellular report-reconciliation feature.
- **Unjani Clinic Delmas** (R450) — onboarding `submitted`, no AP installed yet (pipeline, not leakage).

**New reverse gap found:** **Unjani Clinic - Durban** has an **online AP but NO service record** (site `service_id` is null) — an active install that isn't set up for billing. Linked the AP to the Durban site; **needs a service created or confirmation it's not a paying customer.**

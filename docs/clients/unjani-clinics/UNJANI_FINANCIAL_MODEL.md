# Unjani Clinics — Complete Financial Model

**Compiled**: 2026-05-07 (v2 — updated with Venue Performance v5.0 + billing timeline)
**Sources**: Unjani MSA, TDX MSA, Arlan Deal OP19627, Scoop QU523205, MST Quo202709, ThinkWiFi Venue Performance v5.0, Phase 2 Analysis v3.0, Per-Site Actuals (Apr 2026)

---

## 1. Deal Structure Overview

**Product Catalogue**: SKU `UNJ-MC-001` ("Unjani Managed Connectivity") in `service_packages` — R450 excl. VAT, `service_type = 'managed'`, `market_segment = 'b2b-managed'`, `valid_from = 2026-05-15`.

Three interlocking agreements form the Unjani commercial model:

```
┌─────────────────────────────────────────────────────────────────┐
│                     UNJANI NPC (Customer)                       │
│              Pays R450/site/month excl. VAT                     │
│              (ring-fenced subsidised rate)                       │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CIRCLE TEL (Operator)                         │
│     Provides: connectivity, hardware, WiFi, installation        │
│     Receives: R450 from Unjani + TDX cost recovery + rev share  │
│     Pays: MTN Arlan wholesale + OPEX stack                      │
└──────────┬────────────────────────────────┬─────────────────────┘
           │                                │
           ▼                                ▼
┌────────────────────┐      ┌──────────────────────────────────────┐
│  MTN ARLAN          │      │  TDX (Think Digital X)               │
│  Wholesale partner  │      │  WiFi Monetisation Partner           │
│  5G: R579 incl.     │      │  Captive Portal + Ad-Tech platform   │
│  LTE: R499 incl.    │      │  50/50 revenue share above recovery  │
└────────────────────┘      └──────────────────────────────────────┘
```

---

## 2. CAPEX — Per-Site Hardware & Installation

### Hardware (Scoop Quote QU523205 — 23/02/2026)

| Item | Code | Description | Unit Price | Per Site |
|------|------|-------------|-----------|----------|
| Outdoor AP | RG-RAP62X | Reyee Dual Band WiFi 6 3000 1xGE Outdoor AP | R1,325 | R1,325 |
| PoE Injector | POE-52V30W | PoE Adapter 52V 30W No Cable | R125 | R125 |
| Router | RB-HAPAXS | MikroTik hAP ax S 5xGE 1x2.5G SFP+ WiFi 6 | R1,150 | R1,150 |
| **Hardware subtotal** | | | | **R2,600 excl. VAT** |

### Mounting Brackets (MST Elect Quo202709 — 16/02/2026)

| Item | Code | Description | Unit Price | Per Site |
|------|------|-------------|-----------|----------|
| J Bracket | BRCKTJ600/1500/50 | J Bracket 600 x 1500 x 50mm | R379 | R379 |
| **Bracket subtotal** | | | | **R379 excl. VAT** |

### Installation

| Item | Cost | Notes |
|------|------|-------|
| Professional installation | **R2,500 excl. VAT** | Standard rate per site (confirmed) |

### Approved Configurations

| Config | Components | CAPEX/Site |
|--------|-----------|-----------|
| **Scenario A — Full Spec** | hEX S + indoor AP + outdoor AP + PoE + bracket | R3,828 excl. |
| **Scenario B — Consolidated** | hAP ax S (replaces router + indoor AP) + outdoor AP + PoE + bracket | R2,928 excl. |
| **Actual Procurement** (QU523205 + MST) | hAP ax S + outdoor AP + PoE + bracket | R2,979 excl. |
| **With Installation** | Hardware + bracket + install | **R5,479 excl. VAT** |
| **With Installation incl. VAT** | | **R6,300.85** |

### Additional Per-Site Costs (at scale)

| Item | Cost | Notes |
|------|------|-------|
| CAT6 cable | ~R400/site | R1,200/box shared across ~3 sites |
| RJ45 connectors, trunking, patch cables | ~R100/site | Estimated from 252-site budget |
| UPS (urban) | R800 | One-time, where needed |
| Solar kit (rural/off-grid) | R3,600 | Where mains power unreliable |
| **Adjusted total CAPEX/site** | **R5,979–R9,579** | Range depends on power requirements |

### Total CAPEX Deployed & Remaining

| Phase | Sites | CAPEX/Site (avg) | Total CAPEX |
|-------|-------|-----------------|-------------|
| Phase 1 (deployed) | 22 | ~R4,203 | R92,470 |
| Phase 2 (next 28) | 28 | ~R4,203 | R117,684 |
| **Total (50 sites)** | **50** | | **R210,154** |
| Full network (252) | 252 | ~R4,500 avg | ~R1,134,000 |

---

## 3. OPEX — Monthly Recurring Cost per Site

### Full OPEX Stack (v3.1 Register)

| Item | Monthly/Site | Notes |
|------|-------------|-------|
| MTN Wholesale (Tarana FWB 50 Mbps) | R499.00 | Current deployed sites |
| MTN Wholesale (5G 60 Mbps — Arlan deal) | R579.00 | For 5G-eligible new sites |
| MTN Wholesale (LTE 20 Mbps — Arlan deal) | R499.00 | For non-5G new sites |
| Echo SP CaaS | R55.00 | Connectivity-as-a-Service |
| AgilityGIS BSS | R10.96 | Billing/provisioning |
| Teraco NNI allocation | R62.50 | Network interconnect |
| NOC monitoring | R99.00 | Remote management |
| Field support allocation | R60.00 | Provisioned truck roll reserve |
| **Total OPEX (Tarana/LTE sites)** | **R786.46** | |
| **Total OPEX (5G sites)** | **R866.46** | +R80 for 5G vs Tarana |

### OPEX Comparison by Connectivity Type

| Connectivity | MTN Cost | Total OPEX | Unjani Fee | Monthly Gap |
|-------------|---------|-----------|-----------|-------------|
| **Tarana FWB 50 Mbps** | R499 | R786 | R450 | **−R336** |
| **LTE 20 Mbps (Arlan)** | R499 | R786 | R450 | **−R336** |
| **5G 60 Mbps (Arlan)** | R579 | R866 | R450 | **−R416** |

The Unjani R450 fee covers only **52–57%** of total OPEX. The gap must be recovered through TDX advertising revenue.

---

## 4. Revenue Model — Three Income Streams

### Stream 1: Unjani Service Fee (Guaranteed)

| Item | Value |
|------|-------|
| Monthly fee | R450 excl. VAT per site |
| **Billing start** | **15 May 2026 (pro-rata)** |
| **Full billing from** | **1 June 2026** |
| Payment terms | 30 days from invoice |
| Escalation | Year 1 locked, Year 2 CPI capped 6%, Year 3+ annual review |
| Contract term | 24 months minimum |

**Billing timeline**: No Unjani service fees were billed for Jan–14 May 2026. Circle Tel carried the full OPEX during this period. First invoice (pro-rata 15–31 May) due mid-June 2026. Full monthly invoicing begins 1 June 2026.

### Stream 2: TDX Tier 1 Recovery (Variable)

| Item | Value |
|------|-------|
| Recovery amount | First R450/site/month from Net Ad Revenue |
| Net Revenue formula | Gross Ad Revenue − Sales Commissions (max 20%) − Platform Fee (15%) |
| LTE/5G exception | R450 recovery OR 100% of Net Revenue if below R300 threshold |
| Payment terms | 30 days from invoice |

### Stream 3: TDX Tier 2 Revenue Share (Variable)

| Item | Value |
|------|-------|
| Trigger | Net Ad Revenue exceeds R450/site/month |
| Split | 50% Circle Tel / 50% TDX |
| Payment terms | 60 days from invoice |

### TDX Outstanding Receivable (Feb–Apr 2026)

TDX must pay Circle Tel's share of advertising revenue from **1 February 2026 to 30 April 2026** per the agreement terms. This agreement is to be signed.

| Month | Gross Ad Rev | CT Share (MP) | Source |
|-------|-------------|---------------|--------|
| Jan 2026 | R36 | R11 | Venue Performance v5.0 |
| Feb 2026 | R4,432 | R3,271 | Venue Performance v5.0 (corrected) |
| Mar 2026 | ~R7,000 est. | ~R4,500 est. | Interpolated (no clean March view) |
| Apr 2026 | R11,455 | R6,332 | Venue Performance v5.0 (full 30-day) |
| **Total receivable (Feb–Apr)** | | **~R14,103** | Excludes Jan (pre-agreement) |

**Note**: March standalone data is not available in the dashboard — the mar/apr view (31 Mar–30 Apr) nearly matches April alone, suggesting March revenue was lower early and ramped. The R4,500 estimate for March is interpolated between Feb (R3,271) and Apr (R6,332). Final figure subject to TDX reconciliation.

### Revenue Formula per Site

```
CT Monthly Revenue = R450 (Unjani)
                   + min(Net Ad Revenue, R450)         [TDX Tier 1 recovery]
                   + 50% × max(Net Ad Revenue − R450, 0) [TDX Tier 2 share]

Where: Net Ad Revenue = Gross × (1 − 0.15 platform fee − commissions)
       Commissions ≤ 20% of Gross
       Effective Net ≈ Gross × 0.65 (worst case: 15% + 20%)
       Effective Net ≈ Gross × 0.85 (best case: 15% only, no commissions)
```

---

## 5. Venue Performance — Corrected Actuals (v5.0)

### Network-Level Monthly Trajectory

Source: `Unjani_ThinkWiFi_Venue_Performance_v5_0.json` (corrected dashboard data)

| Month | Days | Gross Rev | Net Rev | TW Share | CT Share (MP) | CPM |
|-------|------|-----------|---------|----------|---------------|-----|
| Jan 2026 | 31 | R36 | R25 | R11 | R11 | R33.85 |
| Feb 2026 | 28 | R4,432 | R3,181 | R1,397 | **R3,053** | R113.34 |
| Apr 2026 | 30 | R11,455 | R6,207 | R3,400 | **R6,332** | R70.13 |
| May 2026 (7d) | 7 | R2,488 | R1,374 | R630 | R1,231 | R82.30 |
| **May 2026 (30d pro-rata)** | 30 | **R10,663** | **R5,888** | **R2,700** | **R5,276** | — |

**Key corrections in v5.0**: Feb MP Share corrected from R1,527 to R3,053. April uses full 30-day data (R11,455 gross) instead of 24-day snapshot.

### Circle Tel Network P&L (22 sites)

| Period | CT Ad Share | Unjani Fee | CT Total Rev | OPEX | Net Contribution |
|--------|-----------|------------|-------------|------|-----------------|
| Feb 2026 (30d) | R3,271 | R0* | R3,271 | R14,476 | **−R11,205** |
| Apr 2026 | R6,332 | R0* | R6,332 | R14,476 | **−R8,144** |
| May 2026 (pro-rata) | R5,276 | R4,840† | R10,116 | R14,476 | **−R4,360** |
| **Jun 2026 (projected)** | **R6,332** | **R9,900** | **R16,232** | **R14,476** | **+R1,756** |

\* Unjani billing not yet started (starts 15 May 2026)
† Pro-rata: 22 sites × R450 × (17/31 days) = R4,840

**The network turns cash-flow positive in June 2026** once full Unjani billing begins.

### Per-Site Averages (Apr 2026 — 22 sites)

| Metric | Value |
|--------|-------|
| Gross ad revenue per site | **R521/month** |
| CT ad share per site | **R288/month** |
| OPEX per site | R658/month |
| Unjani fee per site (from Jun) | R450/month |
| **Net contribution per site (from Jun)** | **+R80/month** |

### Revenue Growth Trajectory

| Metric | Jan | Feb | Apr | May (est.) | Trend |
|--------|-----|-----|-----|-----------|-------|
| Gross ad rev | R36 | R4,432 | R11,455 | R10,663 | **159× growth Jan→Apr** |
| Per-site gross | R2 | R201 | R521 | R485 | Above OPEX break-even from Apr |
| CT share | R11 | R3,271 | R6,332 | R5,276 | Stabilising at ~R5–6K/month |

### Per-Site Unit Economics — Scenario Analysis

**At current April performance (R521 gross/site):**

| Line | Amount | Notes |
|------|--------|-------|
| Unjani service fee | +R450 | From June 2026 |
| TDX CT share | +R288 | Actual April MP share per site |
| **Total CT revenue** | **+R738** | |
| Total OPEX | −R658 | Actual OPEX per v5.0 P&L |
| **Net contribution** | **+R80/site/month** | |
| **Monthly profit (22 sites)** | **+R1,756** | |
| **Annual profit (22 sites)** | **+R21,072** | |

**At Barcelona Benchmark (R2,964 gross/site):**

| Line | Amount | Notes |
|------|--------|-------|
| Unjani service fee | +R450 | Guaranteed |
| TDX Tier 1 recovery | +R450 | Capped at R450 |
| TDX Tier 2 share | +R810 | (R2,964 × 0.85 − R450) × 50% |
| **Total CT revenue** | **+R1,710** | |
| Total OPEX | −R658 | |
| **Net contribution** | **+R1,052/site/month** | |
| **Monthly profit (22 sites)** | **+R23,144** | |
| **Annual profit (22 sites)** | **+R277,728** | |
| **CAPEX payback** | **~4 months** | R92,470 ÷ R23,144 |

### Break-Even Analysis (Revised)

| Metric | Value |
|--------|-------|
| **OPEX break-even gross ad revenue** | **R245/site/month** |
| Calculation | R658 OPEX − R450 Unjani = R208 gap. R208 ÷ 0.85 net factor ≈ R245 gross |
| **Current gross per site** | **R521 (212% of break-even)** |
| **Status** | **Above break-even since April 2026** |
| Full break-even (OPEX + CAPEX payback in 24mo) | ~R490/site/month gross |
| Current vs full break-even | R521 vs R490 — **above full break-even** |

---

## 6. Performance Tiers — TDX Underperformance Protection (Clause 7.7)

| Tier | Trailing 3-Mo Avg | CT Recovery | Rev Split (CT/TDX) | Duration Limit |
|------|-------------------|-------------|---------------------|----------------|
| **Tier 1 — High** | ≥R450/mo | Full R450 | 50/50 | None |
| **Tier 2 — Moderate** | R200–R449 | R150 | 55/45 | 3 months |
| **Tier 3 — Low** | R50–R199 | None | 55/45 | 3 months + review |
| **Tier 4 — Dormant** | <R50 | None | 50/50 | Review at 2nd month |

**Network average (R521 gross/site in Apr)** places the overall network in **Tier 1**. Individual site performance varies — see per-site actuals for tier mapping per clinic.

---

## 7. Arlan Deal Economics

### Negotiated Rates (OP19627 — Dealer 853717 SME)

| Package | Standard MRC | Discount | **Negotiated MRC** | Excl. VAT |
|---------|-------------|----------|-------------------|-----------|
| 5G 60 Mbps (BU5G24M60SO) | R649 incl. | R70 | **R579 incl.** | ~R503 |
| LTE 20 Mbps (MBU20Mbps24SO) | R599 incl. | R100 | **R499 incl.** | ~R434 |

### Arlan Commission Revenue (per deal sold)

| Metric | 5G Deal | LTE Deal |
|--------|---------|----------|
| MRC (incl. VAT) | R579 | R499 |
| Commission rate | 9.75% | 9.75% |
| CT share (30% of commission) | 30% | 30% |
| Contract months | 24 | 24 |
| **Commission per deal** | **~R406** | **~R350** |

### Retail Arbitrage Opportunity

These packages are available to sell at normal retail pricing to non-Unjani customers:

| Package | Retail Price | Negotiated | Margin if Resold |
|---------|------------|-----------|-----------------|
| 5G 60 Mbps | R649 incl. | R579 incl. | R70/month (R1,680 over 24mo) |
| LTE 20 Mbps | R599 incl. | R499 incl. | R100/month (R2,400 over 24mo) |

---

## 8. Incumbent ISP Displacement Savings

Phase 2 sites currently pay other ISPs. Migrating to Circle Tel/MTN Arlan creates savings for Unjani:

| Current ISP | Avg Cost | Sites | vs. R450 CT Fee | Total Monthly Saving |
|-------------|---------|-------|-----------------|---------------------|
| Morclick | R899 | 4 | R449/site | R1,796 |
| Herotel | R699 | 3 | R249/site | R747 |
| Vodacom | R650 | 8 | R200/site | R1,600 |
| Telkom | R395 | 5 | −R55/site | −R275 |
| Rain | R660 | 2 | R210/site | R420 |
| Others | R500 | 6 | R50/site | R300 |
| **Total** | | **28** | | **R4,588/month** |

---

## 9. 50-Site Projections

### Scenario Matrix (Monthly, 50 sites)

| Scenario | Gross/Site | CT Rev/Site | OPEX/Site | NC/Site | Network/Mo | Annual | Viable? |
|----------|-----------|------------|----------|---------|-----------|--------|---------|
| **Current actual (Apr v5.0)** | **R521** | **R738** | **R658** | **+R80** | **+R4,000** | **+R48,000** | **Yes** |
| Outdoor AP optimised (3×) | R1,560 | R1,163 | R658 | +R505 | +R25,250 | +R303,000 | **Strong** |
| Alexandra indoor (R2,387) | R2,387 | R1,464 | R658 | +R806 | +R40,300 | +R483,600 | **Strong** |
| Barcelona outdoor (R2,964) | R2,964 | R1,710 | R658 | +R1,052 | +R52,600 | +R631,200 | **Excellent** |
| Alex + outdoor AP (R5,300) | R5,300 | R2,928 | R658 | +R2,270 | +R113,500 | +R1,362,000 | **Exceptional** |

### CAPEX Payback by Scenario (50 sites, R210,154 total CAPEX)

| Scenario | Monthly NC | Payback Period |
|----------|-----------|----------------|
| Current actual (Apr v5.0) | +R4,000 | **52 months** |
| Outdoor AP optimised | +R25,250 | **8 months** |
| Alexandra indoor | +R40,300 | **5.2 months** |
| Barcelona outdoor | +R52,600 | **4.0 months** |
| Alex + outdoor | +R113,500 | **1.9 months** |

---

## 10. Scaling Gates

Expansion beyond 50 sites is gated by the Board:

| Gate | Metric | Current (Apr v5.0) | Target | Status |
|------|--------|-------------------|--------|--------|
| Revenue Per Impression | CPM | R70.13 | R0.05+ RPI | **Needs mapping** |
| Sites 51–252 | Deferred | — | Q3 FY27 earliest | **Blocked** |
| Monthly network profit | Net contribution | +R1,756 (from Jun) | Positive | **Met (from Jun)** |
| Gross per site | Average | R521/month | R396 break-even | **Met (132%)** |

---

## 11. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Ad revenue stays at R183 avg | Permanent loss of R180/site/month | Outdoor AP retrofit, TDX engagement, fix zero-revenue sites |
| TDX non-payment (2+ months) | Exclusivity suspended | Clause 11 default protection — CT can engage alternative ad partners |
| Unjani NPC non-payment | Loss of guaranteed R450 | MSA early termination clause, 2% above prime interest |
| MTN Arlan rate increase | OPEX inflation | 24-month contracts lock in current pricing |
| Hardware theft/vandalism | Replacement at CT cost | Not covered under R450 MSA rate — excluded per agreement |
| Rural sites underperform | Lower ad revenue (fewer patients) | Phase 2 prioritises urban/peri-urban Eastern Cape clinics |

---

## 12. Cash Flow Timeline

### Pre-Revenue Period (Jan–14 May 2026)

Circle Tel carried all OPEX with no Unjani billing and no TDX payments during this period.

| Month | OPEX (22 sites) | Unjani Revenue | TDX CT Share | Net Cash |
|-------|-----------------|---------------|-------------|----------|
| Jan 2026 | −R14,476 | R0 | R11 | −R14,465 |
| Feb 2026 | −R14,476 | R0 | R3,271 (receivable) | −R14,476 |
| Mar 2026 | −R14,476 | R0 | ~R4,500 (receivable) | −R14,476 |
| Apr 2026 | −R14,476 | R0 | R6,332 (receivable) | −R14,476 |
| 1–14 May 2026 | −R6,667 | R0 | — | −R6,667 |
| **Total pre-revenue OPEX** | | | | **−R64,560** |
| **TDX receivable (Feb–Apr)** | | | **+R14,103** | |
| **Net cash deficit** | | | | **−R50,457** |

### Revenue Period (15 May 2026 onward)

| Month | OPEX | Unjani Fee | TDX CT Share | Net Cash |
|-------|------|-----------|-------------|----------|
| 15–31 May (pro-rata) | −R7,809 | +R4,840 | +R2,738 | −R231 |
| Jun 2026 (first full month) | −R14,476 | +R9,900 | +R6,332 | **+R1,756** |
| Jul 2026+ (steady state) | −R14,476 | +R9,900 | +R6,332 | **+R1,756** |

### Cost Recovery Timeline

| Metric | Value |
|--------|-------|
| Pre-revenue deficit (CAPEX + OPEX) | R92,470 + R50,457 = **R143K** |
| TDX receivable (Feb–Apr, to be signed) | **R14,103** |
| Monthly surplus from Jun 2026 | **R1,756/month** |
| Months to recover full deficit | ~73 months at current rates |
| Months to recover at Barcelona | ~6 months (R23,144/month surplus) |

---

## 13. Summary — Key Financial Metrics (Revised v5.0)

| Metric | Current (Apr v5.0) | Target |
|--------|-------------------|--------|
| **CAPEX per site** | R5,479 (incl. R2,500 install) | — |
| **OPEX per site** | R658/month | — |
| **Unjani service fee** | R450/site/month | R450 (billing from 15 May) |
| **Gross ad revenue per site** | **R521/month** | R2,964 (Barcelona) |
| **CT ad share per site** | R288/month | R1,260 (Barcelona) |
| **Total CT revenue per site (from Jun)** | **R738/month** | R1,710 (Barcelona) |
| **Net contribution per site** | **+R80/month** | +R1,052 (Barcelona) |
| **Network monthly profit (from Jun)** | **+R1,756** | +R23,144 (Barcelona) |
| **OPEX break-even gross ad** | R245/site/month | **Exceeded** (R521 actual) |
| **Full break-even (incl. CAPEX over 24mo)** | R490/site/month | **Exceeded** (R521 actual) |
| **TDX receivable (Feb–Apr)** | **R14,103** | Agreement to be signed |
| **Pre-revenue cash deficit** | **~R143K** | Recover via surplus + TDX |
| **Sites deployed** | 22 | 50 (Phase 2: +28) |
| **Total deployed CAPEX** | R92,470 | R210,154 (50 sites) |

---
paths:
  - "app/admin/dashboard/**"
  - "lib/milestones/**"
---

Rule: execution-targets
Loaded by: CLAUDE.md
Scope: 12-month bootstrap milestones, MSC schedule, channel targets, capital budget, hiring triggers

---

## MTN Wholesale Contract Timeline

**Contract start: September 2025** — this determines the MSC escalation schedule.

| Contract Quarter | Contract Months | Calendar Period | Monthly MSC |
|-----------------|----------------|-----------------|-------------|
| Q1 | 1-3 | Sep-Nov 2025 | Actual spend |
| Q2 | 4-6 | Dec 2025-Feb 2026 | R14,970 |
| Q3 | 7-9 | Mar-May 2026 | R29,940 |
| Q4 | 10-12 | Jun-Aug 2026 | R49,900 |
| Q5 | 13-15 | Sep-Nov 2026 | R74,850 |
| Q6 | 16-18 | Dec 2026-Feb 2027 | R104,790 |
| Q7 | 19-21 | Mar-May 2027 | R139,720 |
| Q8 | 22-24 | Jun-Aug 2027 | R179,640 |

**Total 24-month MSC exposure: R1,796,400**

## MSC Coverage Formula

```
MSC Coverage Ratio = (Tarana Customers × R499) / MSC Commitment
Target: ≥ 1.0x (break-even), Safe: ≥ 1.5x
```

## 12-Month Execution Milestones (Apr 2026 - Mar 2027)

| Month | Calendar | Arlan Deals | Arlan MRR | Tarana Cust. | Tarana MRR | MSC | MSC Coverage | Total MRR |
|-------|----------|------------|-----------|-------------|-----------|-----|-------------|-----------|
| 1 | Apr 2026 | 50 | R6,800 | 20 | R34,800 | R29,940 | 0.33x | R41,600 |
| 2 | May 2026 | 150 | R20,400 | 35 | R60,900 | R29,940 | 0.58x | R81,300 |
| 3 | Jun 2026 | 300 | R40,800 | 60 | R104,400 | R49,900 | 0.60x | R145,200 |
| 4 | Jul 2026 | 500 | R68,000 | 80 | R139,200 | R49,900 | 0.80x | R207,200 |
| **5** | **Aug 2026** | 700 | R95,200 | **100** | R174,000 | R49,900 | **1.00x** | R269,200 |
| 6 | Sep 2026 | 900 | R122,400 | 130 | R226,200 | R74,850 | 0.87x | R348,600 |
| **7** | **Oct 2026** | 1,100 | R149,600 | **150** | R261,000 | R74,850 | **1.00x** | R410,600 |
| 8 | Nov 2026 | 1,350 | R183,600 | 170 | R295,800 | R74,850 | 1.13x | R479,400 |
| **9** | **Dec 2026** | 1,600 | R217,600 | **210** | R365,400 | R104,790 | **1.00x** | R583,000 |
| 10 | Jan 2027 | 1,900 | R258,400 | 240 | R417,600 | R104,790 | 1.14x | R676,000 |
| 11 | Feb 2027 | 2,250 | R306,000 | 270 | R469,800 | R104,790 | 1.29x | R775,800 |
| 12 | Mar 2027 | 2,600 | R353,600 | 310 | R539,400 | R139,720 | 1.11x | R893,000 |

**R1.2M gap**: Month 12 base = R893K. Remaining R307K from DFA enterprise (~R60K), Managed IT (~R75K), higher Arlan volume, higher ARPU bundles.

## Phase Gates

| Phase | Months | Strategy | Key Milestone |
|-------|--------|----------|---------------|
| Arlan Cash Machine | 1-2 | Arlan-only, zero CAPEX | Generate R20K+/mo before Tarana spend |
| Dual-Channel Ramp | 3-5 | Arlan + Tarana ramp | MSC covered at 100 Tarana (Month 5) |
| Scale | 6-8 | Aggressive Tarana growth | Hire sales rep + installer |
| Expand | 9-12 | Full portfolio + DFA | R893K+ MRR, Series A prep |

## Hiring Triggers

| MRR Threshold | Hire | Expected Month |
|--------------|------|----------------|
| R200K+ sustained 2 months | Sales Rep 1 | Month 6 |
| R400K+ sustained 2 months | Technical Installer | Month 8 |
| R600K+ sustained 2 months | Sales Rep 2 | Month 10 |
| R800K+ | Junior Support/Admin | Month 12 |

## Capital Budget (R250,000)

| Category | Amount | When |
|----------|--------|------|
| BSS platform (AgilityGIS) | R6,000 | Months 1-12 |
| Marketing & sales materials | R15,000 | Months 1-3 |
| NNI Port setup (NRC) | R7,000 | Month 3 |
| MTN Setup + Training | R10,875 | Month 3 |
| First 50 installations | R127,500 | Months 3-6 |
| Working capital buffer | R30,000 | Reserve |
| Contingency | R53,625 | Reserve |

**Self-funding milestone**: Month 6 — Arlan commissions + customer payments exceed all costs.

## Key Dates

- **15 May 2026**: Unjani billing starts (first revenue from pilot)
- **01 Apr 2026**: DFA wholesale agreement effective (FY27 pricing)
- **Month 5 (Aug 2026)**: First MSC-covered month (100 Tarana × R499 = R49,900)

## Unjani Pilot (Active)

- 20 of 21 sites live (10 Tarana FWB + 11 Arlan 5G/LTE)
- Zero revenue until 15 May 2026
- Monthly cost: R18,771 incl. VAT
- 90-day pilot total exposure: R50-55K (partially offset by R4,358 Arlan commission)

## Database Table

Milestones tracked in `execution_milestones` with channel-split columns:
`target_arlan_deals`, `target_arlan_mrr`, `target_tarana_customers`, `target_tarana_mrr`

Pipeline deals tracked with `revenue_source` column: `tarana | arlan | dfa | managed_it | bundle`

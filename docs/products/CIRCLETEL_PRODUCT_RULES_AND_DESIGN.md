# CircleTel — Product Rules & Design

**Source:** `/home/circletel/products/` (Business Rules Documents, Commercial Product Specs, `solution-design.md`, `README.md`) + `.claude/rules/`
**Document date:** 2026-06-08
**Locale:** en-ZA · All prices **exclude 15% VAT** unless stated.

> This is the **rules & design** companion to:
> - `docs/products/CIRCLETEL_PRODUCTS_AND_SERVICES.md` (what we sell)
> - `docs/architecture/PRODUCT_CATALOGUE_AND_MANAGEMENT.md` (how it's modelled in code)

---

## Part A — Master Design & Governance Rules

Source: `products/solution-design.md` (the CircleTel Solution Design / Product Management system prompt, v1.0).

### A1. Brand & Naming Rules (non-negotiable)
- **Legal entity:** CircleTel SA (Pty) Ltd · **Parent:** New Generation Group · stylised **circleTEL**.
- **Naming convention:** all products follow the **`[Descriptor]Connect`** pattern (HomeFibreConnect, BizFibreConnect, ClinicConnect, ParkConnect, WorkConnect) **or** an established brand name (SkyFibre, AirLink, UmojaLink, CloudWiFi, CircleConnect). **Never deviate without explicit approval.**
- **Exact spellings** (enforced): SkyFibre, BizFibreConnect, HomeFibreConnect, WorkConnect, ParkConnect, ClinicConnect, UmojaLink, AirLink, CloudWiFi, CircleConnect.
- **Brand colours:** Orange `#F5841E`, Grey `#747474`, Deep Navy `#13274A`, Midnight Navy `#0F1427` (+ burnt/warm/bright orange variants).
- **Typography:** Headlines Poppins Bold (orange); body Montserrat Regular (grey).
- **Tone:** bold, modern, future-ready; never jargon-heavy.

### A2. Margin Discipline (non-negotiable)
1. **Minimum 25% gross margin on ALL products** — reject volume-at-any-cost.
2. **No custom pricing below COS floor + 25%** without **MD written approval**.
3. **Hardware amortisation** (CPE ÷ contract months) must be in every margin calc.
4. **Tower/site costs** must be allocated per-user in margin models.
5. **Installation revenue must cover installation cost** — never subsidise install.
- **COS floor ≈ R175.43/user/month** (BNG R20.20 + IP transit R28 + DFA backhaul R86.27 + support R30 + billing R10.96; excludes tower/access).

### A3. Product Prioritisation — POV Scoring
Score each product 1–10 on: Ease of Deployment, Go-to-Market Readiness, Market Demand, Market Competition.
- **8.0+** = LAUNCH IMMEDIATELY · **6.5–7.9** = SELECTIVE LAUNCH · **5.0–6.4** = DEPRIORITISE · **<5.0** = DO NOT PURSUE.

### A4. Contribution Margin Model (required for every product proposal)
Must include: revenue/user (excl VAT) · COS breakdown (wholesale, backhaul, BNG, support, billing) · hardware amortisation · infra allocation · **gross margin ≥25%** · CAC · **LTV ≥ 3× CAC** · **payback < 12 months**.

### A5. Solution Design Checklist (10-point gate for any new product)
Market demand → unit economics (≥25%) → technology fit → wholesale dependency → deployment complexity → competitive differentiation → revenue model → capital requirement → scalability → portfolio alignment (cross-sell vs cannibalise).

### A6. Technology Selection Matrix (which tech → which product)
| Scenario | Technology | Product |
|----------|-----------|---------|
| SME in Tarana coverage | Tarana G1 FWA | SkyFibre SMB |
| Symmetrical + SLA | DFA FTTB | BizFibreConnect |
| Rapid deploy / failover | MTN LTE/5G | CircleConnect Wireless |
| Office park multi-tenant | Peraso DUNE 60GHz | ParkConnect |
| No MTN coverage, moderate density | Reyee 5GHz self-managed | AirLink FWA |
| Township / affordable | Tarana / Reyee | UmojaLink |
| Healthcare / clinic | Hybrid Tarana + LTE failover | ClinicConnect |
| Home office | Technology-agnostic | WorkConnect SOHO |
| Venue Wi-Fi | Managed overlay | CloudWiFi WaaS |

### A7. PMF Framework & Signals
4-stage validation: Problem → Solution → Market (TAM/SAM/SOM) → Scale (unit economics hold at 10×/100×/1000×).
**Signals to measure:** churn <2% (target <1.5%) · NPS >40/>50/>60 (M6/M12/M24) · >30% referral growth · activation <24h LTE / <3d FWA / <5d fibre · <2 tickets/customer/month · positive net revenue retention.

### A8. Document & Output Standards
Version-control table on every doc · en-ZA · ref format `CT-[DEPT]-[TYPE]-[YEAR]-[SEQ]` · classification level · prices in ZAR "excl. VAT" by default (VAT 15%) · USD imports state rate (~R18.50).

### A9. Regulatory Rules
ICASA Class ECS licences (i-ECNS under evaluation) · B-BBEE Level 4 minimum · 30% HDG ownership · **POPIA mandatory** for all customer data · 2G/3G sunset Dec 2027.

---

## Part B — Per-Product Business Rules

Each connectivity/IT product has a Business Rules Document (BRD) in `products/`. Key rules below.

### B1. SkyFibre SMB — Fixed Wireless (Tarana G1)
*Source: `connectivity/fixed-wireless/SkyFibre_SMB_Business_Rules_Document_v1_0.md`*

- **Eligibility:** registered SA business only (consumers → SkyFibre Residential). Docs: CIPC, proof of address (≤3mo), signatory ID.
- **Credit (MRC ≥ R1,299):** ≥600 PASS · 500–599 MARGINAL (3-mo prepay or debit mandate) · <500 REJECT month-to-month (offer 12-mo + 2-mo deposit, or Arlan channel).
- **Coverage gate:** Tarana FWB, signal ≥ −75 dBm, LoS within 10 km, mains within 30 m, mandatory site survey.
- **Pricing (non-negotiable base):** Business 50 R1,299 · 100 R1,499 · 200 R1,899. All **4:1 asymmetric** (mandatory disclosure). Symmetrical need → BizFibreConnect; >200 Mbps → FTTH.
- **Discounts:** module bundle 5% if ≥3 modules (Sales Director) · annual 5% (CFO) · multi-site 10% from site 3 (MD). **No discount on base tier.** Min 25% contribution margin after discounts.
- **Modules (require active base):** Managed Router R149 · Enhanced SLA 99.5% R249 · Premium SLA 99.9% R499 · Email R79/R129 · Cloud Backup R49/R99/R179 · Business VPN R199/R349 · 5G/LTE Failover R399 · Security Suite R249. One SLA / one tier per category only.
- **Billing:** 1st of month, 7-day terms, debit order preferred. 1st debit return = R100 fee; 2nd in 60 days = suspension. 14 days arrears → suspend; 30-day cure; reconnection R250.
- **Contracts:** MTM (30-day notice, no penalty) · 12/24-mo fixed early exit = remaining × **75% MRC** (CPA s14). Auto-renewal 40–80 BD notice. CPA cooling-off 5 BD.
- **SLA credits:** Enhanced 10%/hr, Premium 15%/hr, cap 100% monthly MRC; claim window 30 days. Speed guarantee 85%/90% of package.
- **Fair use:** truly uncapped, **no FUP** (key differentiator), 8:1 business contention. Crypto-mining/reselling = immediate suspension; network attacks = termination + SAPS.
- **Equipment on exit:** Tarana RN collected by MTN ≤14 BD; Managed Router return ≤14 days or R1,500.
- **Partner commissions:** Authorised Reseller 15% first MRC · Gold 20%+10% recurring 12mo · Platinum 25%+15% recurring 24mo (clawback if cancel <3mo).
- **Arlan backstop:** customers rejecting pricing → MTN Business R999 via Arlan; CircleTel keeps 30% of MTN commission; flag for managed-services cross-sell within 90 days.

### B2. WorkConnect SOHO — Technology-Agnostic
*Source: `connectivity/soho/WorkConnect_SOHO_Business_Rules_Document_v1_0.md`*

- **Eligibility:** natural persons 18+, freelancers, micro-business ≤5 staff. >5 staff → SkyFibre SMB; pure consumer → HomeFibreConnect; <R799 budget → HomeFibreConnect Starter.
- **Credit (MTM):** ≥580 PASS · 450–579 MARGINAL (debit mandate or 2-mo upfront) · <450 12-mo + 1-mo deposit. Waived if 6/12-mo prepaid or existing zero-arrears ≥3mo.
- **Coverage priority:** **FTTH > FWB > 5G > LTE.** Pro tier NOT on 5G/LTE; Plus restricted on LTE.
- **Tiers:** Starter R799 (1–2 users) · Plus R1,099 (2–4) · Pro R1,499 (3–5). Speed varies by tech (e.g. Pro = 200/50 FWB or 500/500 FTTH). All include VoIP QoS, uncapped, cloud backup (25/50/100 GB), email (2/5/10), Reyee router; support Mon–Sat 07:00–19:00.
- **Add-ons:** Static IP R99 (incl. Pro) · Backup Boost R99 · LTE Failover R299 · Premium Router R199 once-off · extra email R15 · M365 Basic R149/user.
- **Discounts:** no base discount · multi-service 5% (≥2 services) · annual prepay = 1 month free (~8.3%) · referral R200/R200 · promo max 10% × 3mo (MD). Floors: Starter R720 / Plus R990 / Pro R1,350.
- **Annual price review (April):** max CPI+2% or wholesale increase, 30-day notice; cancel right within 20 BD.
- **Payment escalation:** 7 arrears notice → 14 throttle to 2 Mbps → 30 suspend → 60 terminate. >30 days = 2%/mo interest. Router not returned in 30 days = R1,500.
- **Contracts:** MTM (30-day, no fee) · 12-mo early exit 50% remaining (25% in last months) · 24-mo same. Auto-renew → MTM, 40 BD notice.
- **Fair use:** uncapped no FUP, **12:1 SOHO contention**. VoIP/VPN/banking PROTECTED; P2P shaped peak; backup off-peak 22:00–06:00.
- **Churn:** retention call ≤2 BD; win-back 90 days (waived install + 1 mo free); target <5% monthly churn.

### B3. CloudWiFi WaaS — Managed Wi-Fi
*Source: `connectivity/wifi-as-a-service/CloudWiFi_WaaS_Business_Rules_Document_v1_0.md`*

- **Eligibility:** registered business/body-corporate/NGO/government venues. Residential REJECTED → HomeFibreConnect; home-sole-prop → WorkConnect (exception if commercial venue).
- **Credit:** ≥620 PASS · 500–619 MARGINAL · <500 escalate. **CAPEX >R25,000 ⇒ mandatory director surety OR 50% CAPEX deposit** regardless of score.
- **Site survey MANDATORY** before signing (virtual allowed <200 m²); design plan valid 60 days; customer must approve in writing.
- **Tiers (by survey AP count, not budget):** Essential 1–2 AP R1,499 · Professional 3–5 AP R3,499 · Enterprise 6–12 AP R7,999 · Campus 12–30+ AP R14,999. Auto-upgrade if design exceeds tier.
- **Backhaul priority:** DFA Fibre > Tarana FWB > DUNE 60GHz > 5G > LTE. **Third-party backhaul REJECTED** (needs CircleTel backhaul for end-to-end SLA). FWB 4:1 disclosure mandatory.
- **Vertical packages** (no price premium): Hospitality, Commercial, Property, Healthcare (POPIA patient Wi-Fi, VLAN 30 isolation), Education (content filtering MANDATORY + free, Films Act compliance).
- **Add-ons:** Custom portal R2,500 NRC · Analytics R500 · ThinkWiFi R500 + rev-share · Failover R599 · Static IP R99 · Content Filter R250 · Signage VLAN R350 · UPS R150/mo or R800. **Max ONE discount** (priority anchor > multi-site > bundle > founders > loyalty).
- **Discounts:** bundle 10% (with CircleTel connectivity, auto) · multi-site 5%/10% · 36-mo loyalty 5% · Founders (first 20 sites) free survey+install+portal+1mo (R25k value).
- **Contracts:** Essential/Professional 24-mo, Enterprise/Campus **36-mo minimum**. ETF = remaining × MRC × (1 − served/total). Enterprise/Campus suspension delayed to Day 45 (MD approval).
- **SLA:** uptime 99.0/99.5/99.9/99.9%; response NBD/8h/4h/2h; credits 5/5/10/15% MRC. Chronic breach (3 consecutive months) = penalty-free exit.
- **Hardware:** CircleTel owns **all** hardware (all tiers, forever). Asset-registered, Ruijie Cloud managed (customer no admin access). 5-yr refresh included. Recovery ≤15 BD on exit; not returned = replacement charge.

### B4. Managed IT Services — Bundled Connectivity + IT
*Source: `managed-it/CircleTel_Managed_IT_Services_Business_Rules_Document_v1_0.md`*

- **Eligibility:** registered business (Pty/CC/sole-prop/NPO/government POA). Individuals → WorkConnect. Needs ≥1 user + SkyFibre coverage + credit ≥400 (or 3-mo prepay). Existing debt >60 days must settle first.
- **Tiers by user count:** Essential R2,999 (1–5, 5× M365 BB, 50 Mbps) · Professional R5,999 (10–15, 10× BS, 100 Mbps) · Premium R12,999 (25–35, 15× BP, 200 Mbps + LTE) · Enterprise POA min R35,000 (50–100, 20× E3, 500 Mbps). Add-on users R179/R329/R549/R799.
- **M365 rules:** tier fixes licence type (BB/BS/BP/E3); 12-mo CSP min; monthly billing +20%; provision ≤4h; 90-day litigation hold on offboard. E5 = custom.
- **Module dependency:** connectivity → M365 → backup; firewall after CPE; security training from month 2. Managed firewall/backup = Professional+; compliance reporting = Enterprise only.
- **Discount authority:** 0–5% rep · 6–10% Sales Mgr · 11–15% Sales Dir · 16–20% Product Lead · >20% CEO. Max 2 discounts stack.
- **Credit tier matrix:** 700+ = 6× MRC limit, no deposit; 400–499 = 1× limit + 2× deposit + director guarantee; <400 = prepay only (3× MRC).
- **Billing:** 1st of month, 7-day terms, CC +2.5%, no cash/cheque. Escalation 7→14→21 throttle (10 Mbps)→30 suspend→45 collections. Reconnect R500 (suspension) / R1,500 + deposit (after termination).
- **Contracts:** MTM / 12 / 24 / 36-mo. Early exit 50% remaining MRC; free-install clawback R2,500 if <6mo.
- **SLA:** uptime 99.0–99.9%; P1 response 4h/2h/1h/30min; RTO 8/4/4/2h; RPO 24/12/6/1h. Credits 10–50% MRC, cap 50%.
- **Backup:** Professional 500 GB/30d · Premium 1 TB/90d · Enterprise unlimited/365d. Azure za-north, AES-256, R2/GB overage.
- **Support hours:** Essential M–F 8–5 · Professional M–Sat 7–7 · Premium/Enterprise 24/7. Out-of-scope billable R550/hr.
- **Partner commission:** Referral 5% (12mo) · Bronze 10% (R10k MRR) · Silver 15% (R50k) · Gold 20% (R150k) · White-label wholesale (R500k). Clawback if cancel <90 days.
- **Overflow:** Link-up ICT provides Enterprise L3 (Azure/M365), absorbed in Enterprise margin. POPIA: 72h breach notify, 5-yr consent records, Azure SA storage.

---

## Part C — Arlan (MTN Reseller) Rules

*Sources: `wholesale/arlan/Arlan_Commission_Analysis_v1.0.md`, `Arlan_Deal_Packaging_Strategy_v1_0.md`, the 5 `*_BRD_v1_0.md`.*

### C1. Commission & Markup
- **CircleTel receives 30% of MTN commission** Arlan earns, on net subscription fees (excl. devices/VAT/once-offs). Commission continues on renewals **indefinitely**.

| Monthly sub | MTN rate | CircleTel (30%) | Term |
|-------------|----------|-----------------|------|
| R0–99 | 4.75% | 1.425% | 24mo |
| R100–199 | 5.75% | 1.725% | 24mo |
| R200–299 | 7.25% | 2.175% | 24mo |
| R300–499 | 8.75% | 2.625% | 24mo |
| R500–999 | 9.75% | 2.925% | 24mo |
| R1,000–1,999 | 11.75% | 3.525% | 24mo |
| R2,000+ | 13.75% | 4.125% | 24mo |

- **Markup = 100% CircleTel revenue** (not shared, separate from commission). **Markup floors:** IoT/M2M 20% · Fleet 18% · Data 15% · Devices (BMS) 8% (target 10–15%) · Voice 10% · Enterprise 5–8% · Corporate 3–5%. **Never price below Arlan base.**
- **FICA mandatory on ALL Arlan orders** (CIPC, director ID ≤3mo, address proof, bank letter, signed MTN form). No order without complete FICA.
- **Contracts (fixed):** devices 36mo · data/connectivity 24mo · fleet IoT 24mo (no individual SIM cancels). CPA s14 early exit at MTN rates (not CircleTel markup); clawback risk if cancel <6mo.
- **CPE:** Tozed ZLT X100 Pro 5G is **MTN property** — return ≤30 days if cancel <24mo, else R1,500.
- **Pricing lock:** price locked on signing; CircleTel absorbs Arlan increases up to 5%. Reconcile monthly by 25th.
- **Deal-economics floor:** single-line ≥R50/mo combined (commission+markup); multi-line ≥R40/line.

### C2. Arlan Bundles
| Bundle | Target | Composition | Customer pays | CircleTel earns | Term |
|--------|--------|-------------|---------------|-----------------|------|
| Business Mobility Starter | any SME | 1 device upgrade | R575–R1,150 | ~R87/deal | 36mo |
| Connected Office | SME 3–10 | 1 connectivity + 2 devices | R1,350–R1,650 | ~R294 | 24mo conn / 36mo device |
| Data & Connectivity | offices | standalone Shesha/5G/FWA | R359–R709 | 15%+ markup | 24mo |
| Fleet Connect | logistics | 5–20 IoT SIMs + 1 manager SIM | R750–R4,200 | R66–120/SIM | 24mo |
| WorkConnect + Mobile | WC SOHO | WC internet + 1 device | R1,800–R2,500 | R635–R1,035 | 24mo + 24/36mo |

- **Fleet IoT SIMs:** data-only (no voice/SMS/tethering — mandatory disclosure); 20% markup; manager SIM required; customer supplies hardware; min 5 SIMs.
- **WorkConnect+Mobile:** no bundle discount (each at retail); CPA s14 applies independently per contract.

---

## Part D — CircleTel Bundles

*Sources: `bundles/{BusinessComplete,RemotePlus,VenuePlus}_Commercial_Product_Spec_v1_0.md`.* Connectivity + Arlan mobile/voice/IoT.

### D1. Business Complete (SME 5–50) — 24mo
| Tier | SkyFibre + Backup + Voice | MRC excl/incl VAT | Margin |
|------|----------------------------|-------------------|--------|
| Essential | Biz 50 + 5G Essential | R1,798 / R2,068 | 27–30% |
| Professional | Biz 100 + 5G + Voice Std | R2,547 / R2,929 | |
| Enterprise | Biz 200 + 5G Ent + Voice Premium | R3,822 / R4,395 | |
Free install (R1,500 std). Add-ons: Fleet M2M R199, Voice line R349, IoT pack R399, Static IP R149, SLAs R249/R499. LTE:CAC 5.1–10.9×.

### D2. Remote+ (SOHO 1–5) — 24mo
| Tier | WorkConnect + Backup + Voice | MRC excl/incl VAT | Margin |
|------|-------------------------------|-------------------|--------|
| Starter | 50 Mbps + LTE 15GB | R968 / R1,113 | 18–31% |
| Plus | 100 Mbps + 5G Essential | R1,618 / R1,861 | |
| Pro | 200 Mbps + 5G + Voice Starter | R2,367 / R2,722 | |
Free install (R999 std). Add-ons: Static IP R99, Backup Boost R99, Extra LTE R199, M365 R179, LTE Failover R350.

### D3. Venue+ (commercial venues) — 24–48mo
| Tier | CloudWiFi + IoT SIMs | MRC excl/incl VAT | Margin |
|------|----------------------|-------------------|--------|
| Retail | Essential + 5 POS SIMs | R1,999 / R2,299 | 40–44% |
| Hospitality | Professional + 10 sensor SIMs | R4,499 / R5,174 | |
| Campus | Enterprise + 25 mixed SIMs | R9,999 / R11,499 | |
Free survey; install R2,500/R5,000/R12,500 (launch 50% off). High-margin add-ons (signage/filtering/analytics/ThinkWiFi all 100% margin). LTE:CAC 6.7–13.4×.

### D4. FleetConnect — DRAFT (fleet/logistics, pending CPS).

---

## Part E — Codified Rules in the Repo

These mirror the above as machine-enforceable guardrails — see `docs/architecture/PRODUCT_CATALOGUE_AND_MANAGEMENT.md` §10.

| Rule file | Enforces |
|-----------|----------|
| `.claude/rules/margin-guardrails.md` | 25% min margin (30% bundles), discount approval matrix, Arlan markup floors, MSC-aware pricing |
| `.claude/rules/product-economics.md` | Unit economics by channel (Tarana/Arlan/DFA), COS floor, commission tiers, LTV/CAC |
| `.claude/rules/product-management.md` | Skill triggers, bundle-design flow, wholesale/supplier refs |
| `lib/types/mtn-dealer-products.ts` | `MARKUP_RULES` + `MTN_COMMISSION_TIERS` constants |

---

## Part F — Source Document Index

| Area | Path |
|------|------|
| **Master design/rules** | `products/solution-design.md` |
| Folder index | `products/README.md` |
| SkyFibre SMB BRD / spec / FSD | `products/connectivity/fixed-wireless/SkyFibre_SMB_*` |
| WorkConnect SOHO BRD / spec / FSD | `products/connectivity/soho/WorkConnect_SOHO_*` |
| CloudWiFi WaaS BRD / spec | `products/connectivity/wifi-as-a-service/*` |
| Managed IT BRD / spec / FSD / overview | `products/managed-it/*` |
| BizFibreConnect / DFA | `products/connectivity/fibre/`, `products/wholesale/dfa/` |
| DUNE 60GHz / ParkConnect | `products/connectivity/fixed-wireless/DUNE_60GHz_*` |
| SkyFibre Home (sunset) | `products/connectivity/residential/*` |
| CircleCloud Hosting | `products/cloud-hosting/*` |
| Bundles (Business Complete / Remote+ / Venue+) | `products/bundles/*` |
| Arlan (commission, packaging, 5 BRDs) | `products/wholesale/arlan/*` |
| MTN / Echo SP wholesale | `products/wholesale/mtn/`, `products/wholesale/echo-sp/` |
| Captive ad portal (ThinkWiFi/PowerLynx) | `products/captive ad portal/*` |
| Competitive landscape | `products/research/SA_ISP_Competitive_Landscape_Analysis_2025.md` |
| Supplier price lists | `products/pricelist/` (Rectron, Nology, MiRO) |

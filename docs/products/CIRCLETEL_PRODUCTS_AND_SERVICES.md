# CircleTel — Products & Services We Sell

**Company:** CircleTel — Business-first ISP / Business Services Provider (South Africa)
**Document date:** 2026-06-08
**Strategy:** Pivoted from consumer ISP → **B2B Business Services Provider** (MTN AirFibre channel conflict made residential FWA unviable; consumer is now organic-only).

> **Pricing note:** Prices below are drawn from the product spec/portfolio docs and the product catalogue
> reference. They have shifted across versions (e.g. `product_catalogue.json` Mar-2026 vs the Complete
> Portfolio v1.0 Jan-2026), so treat them as indicative. The live source of truth is the `service_packages`
> table / admin product catalogue. Source files are listed in §7.

---

## 1. At a Glance — What We Sell

CircleTel sells across **five categories**:

| # | Category | What it is | Examples |
|---|----------|-----------|----------|
| 1 | **Connectivity** | Internet access (fixed-wireless, fibre, FWA) | SkyFibre, BizFibreConnect, HomeFibreConnect, WorkConnect, ParkConnect, ClinicConnect |
| 2 | **Managed Services** | IT, Wi-Fi & hosting delivered as a service | Managed IT Services, CloudWiFi WaaS, CircleCloud Hosting |
| 3 | **Mobile & IoT** | SIM-based connectivity (via Arlan/MTN) | CircleConnect IoT, Mobile Solutions |
| 4 | **Value-Added Modules (VAS)** | Add-ons attached to a base service | Static IP, SLAs, failover, email, cloud backup, VPN, security suite, managed router |
| 5 | **Hardware** | Routers, CPE, mmWave radios (resale + bundled) | Reyee routers, DUNE 60GHz radios, supplier catalogue |

**Portfolio scale (Complete Portfolio v1.0, Jan 2026):** ~10 product lines, ~34 SKUs, R3.25M MRR target at maturity, ~50% blended margin.

---

## 2. Connectivity Products

### 2.1 SkyFibre SMB — Business Fixed Wireless ★★★ *(Primary revenue driver)*
**Tech:** MTN Tarana G1 FWB · **Target:** SMEs 1–50 staff · **MRR goal:** R800k

| Tier | Speed | Price/mo | Margin | SLA |
|------|-------|----------|--------|-----|
| Essential | 50/50 Mbps | R1,899 | 41% | 99.5% |
| Professional | 100/100 Mbps | R2,899 | 50% | 99.5% |
| Premium | 200/200 Mbps | R4,499 | 52% | 99.9% |

Includes static IP, business Reyee router, email accounts, cloud backup. **Differentiators vs MTN Business R999:** static IP included, no FUP (truly uncapped), month-to-month, business SLA, named account manager.

### 2.2 ClinicConnect — Healthcare Vertical ★★★
**Tech:** MTN Tarana G1 FWA / MTN 5G-LTE · **Anchor:** Unjani Clinics (252 sites signed)

| Tier | Tech | Speed | Price/mo |
|------|------|-------|----------|
| Premium | Tarana G1 FWA | 50/50 Mbps | R450 |
| Standard | MTN 5G/LTE | 10–60 Mbps | R450 |

Adds patient Wi-Fi monetisation via ThinkWiFi partnership. Rollout: 10 (pilot) → 50 → 100 → 252 sites.

### 2.3 BizFibreConnect — Business Fibre ★★
**Tech:** DFA Business Internet Access · **Target:** business · **MRR goal:** R200k

| Tier | Speed | Price/mo | Margin |
|------|-------|----------|--------|
| Lite | 10/10 Mbps | R1,699 | 31% |
| Starter | 25/25 Mbps | R1,899 | 33% |
| Plus | 50/50 Mbps | R2,499 | 35% |
| Pro | 100/100 Mbps | R2,999 | 37% |
| Ultra | 200/200 Mbps | R4,373 | 38% |

Symmetrical fibre. Free install for first 100 customers; free site survey.

### 2.4 HomeFibreConnect — Residential FTTH ★★
**Tech:** MTN Wholesale FTTH · **Target:** residential

| Tier | Speed | Price/mo | Margin |
|------|-------|----------|--------|
| Starter | 25/25 Mbps | R899 | 26% |
| Plus | 50/50 Mbps | R1,199 | 35% |
| Max | 100/100 Mbps | R1,599 | 45% |
| Ultra | 200/200 Mbps | R2,299 | 51% |

### 2.5 WorkConnect™ SOHO — Small Office / Home Office
**Tech:** Technology-agnostic (FTTH → FWB Tarana → 5G → LTE) · **Target:** freelancers, remote workers, micro-business (1–5)

| Tier | Speed | Price/mo | Backup | Email | Static IP |
|------|-------|----------|--------|-------|-----------|
| Starter | 50 Mbps | R799 | add-on | 2 | add-on R99 |
| Plus | 100 Mbps | R1,099 | add-on | 5 | add-on R99 |
| Pro | 200 Mbps | R1,499 | 25 GB incl. | 10 | included |

VoIP QoS included, business router, extended support (Mon–Sat 07:00–19:00).

### 2.6 ParkConnect — Multi-Tenant Wireless (DUNE 60GHz) ★★★
**Tech:** Peraso mmWave 60GHz (licence-free 57–71 GHz) · **Target:** office/residential parks, estates · **MRR goal:** R750k

**Infrastructure packages** (per site):

| Package | Tenants | Setup (CAPEX) | Monthly |
|---------|---------|---------------|---------|
| Lite | 10–20 | R45–65k | R8.5–12k |
| Standard | 20–48 | R85–120k | R18–25k |
| Enterprise | 48–150+ | R180–350k | R45–85k |

**Per-tenant tiers:** Essential 50/50 R1,299 · Professional 100/100 R1,899 · Business 200/200 R2,999 · Enterprise 500/500 R4,999 (margins 54–64%).

### 2.7 AirLink FWA — Office Parks
**Tech:** Tarana FWB · Standard 50 R1,699 · Professional 100 R2,499 · Premium 200 R3,499 (40–55% margin).

### 2.8 UmojaLink Township — Prepaid Township Residential
**Tech:** Tarana FWB · Daily Pass R10 · Weekly Pass R49 · Monthly (50/12.5) R399. High point-of-value (POV 92), 25–30% margin.

---

## 3. Managed Services

### 3.1 Managed IT Services — Bundled Connectivity + IT ★★
**USP:** Single provider, single bill, ~30–40% cheaper than separate vendors · **Target:** SMEs 1–100 staff

| Tier | Users | Price/mo | Included | Margin |
|------|-------|----------|----------|--------|
| Essential | 1–10 | R2,999 | 50 Mbps + Basic IT + M365 Basic | 42% |
| Professional | 10–25 | R5,999 | 100 Mbps + Managed IT + Security + 500GB backup | 45% |
| Premium | 25–50 | R9,999 | 200 Mbps + Full stack + 1TB backup | 48% |
| Enterprise | 50–100 | R19,999 | 500 Mbps + Dedicated support + vCIO + unlimited backup | 52% |
| Custom | 100+ | POA | Tailored | 55%+ |

All tiers include: business internet, static IP, 99.5% SLA, business router, IT helpdesk, Microsoft 365 management, security (firewall/endpoint/email), cloud backup. **Activation 3 days** vs 3–6 weeks; month-to-month vs 12–24mo lock-in. Partners: Link-up ICT / Absolute IT (enterprise overflow), Microsoft CSP. Backup engine: Acronis Cyber Protect Cloud.

### 3.2 CloudWiFi™ WaaS — Managed Wi-Fi as a Service
**Model:** Fully managed, CircleTel owns all hardware · **Verticals:** hospitality, retail, property, healthcare, education

| Tier | Venue | APs | Monthly | CAPEX | Payback |
|------|-------|-----|---------|-------|---------|
| Essential | <300 m² | 1–2 | R1,499 | R5,200 | 11.8 mo |
| Professional | 300–800 m² | 3–5 | R3,499 | R11,045 | 5.7 mo |
| Enterprise | 800–2,000 m² | 6–12 | R7,999 | R21,325 | 4.0 mo |
| Campus | Multi-building | 12–30+ | R14,999 | R46,775 | 5.1 mo |

Hospitality variants: Boutique R2,999 / Standard R6,999 / Premium R12,999. Hardware: Reyee Wi-Fi 6 APs, MikroTik/Reyee gateways, Ruijie Cloud (zero licensing). **Add-ons:** captive portal (R2,500 NRC), analytics (R500/mo), ThinkWiFi integration (R500/mo + rev-share), failover (R599/mo), content filtering (R250/mo), digital signage VLAN (R350/mo).

### 3.3 CircleCloud Hosting — Web Hosting & Reseller
**Infrastructure:** NameHero CloudShield VPS (USA) + cPanel · **Target:** SMEs, agencies · **Margin:** 55–65% base (80%+ at scale)

| Tier | Storage | Email | Bandwidth | Price/mo |
|------|---------|-------|-----------|----------|
| Starter | 5 GB SSD | 5 | 50 GB | R199 |
| *(higher tiers escalate storage/accounts; reseller plans available)* | | | | |

Underlying VPS tiers: Starter R439 → Business R907; cPanel licences scale (Solo free → Premier 100 accts R1,294). Extends the Managed IT bundle for full digital-infrastructure offering.

---

## 4. Mobile & IoT

### 4.1 CircleConnect IoT — Multi-Network M2M SIMs
**Tech:** Multi-network SIM · **Target:** enterprise / IoT · **Margin:** 45–65%

| Tier | Data | Price/mo |
|------|------|----------|
| Starter | 50 MB | R29 |
| Standard | 500 MB | R99 |
| Professional | 2 GB | R199 |
| Enterprise | 10 GB | R450 |

### 4.2 Mobile Solutions — MTN via Arlan Reseller ★
**Model:** MTN business mobile (LTE/5G) resold via Arlan; commission + markup, ~30% margin. Packaged bundles:
- **Business Mobility Starter** (~R87/mo)
- **Connected Office** (~R294/bundle)
- **WorkConnect + Mobile** (R635–R1,035)
- **Fleet Connect** (IoT bulk SIMs)

Use cases: mobile workforce, fleet management, voice comms, data connectivity, backup connectivity, venue Wi-Fi, device upgrades.

---

## 5. Value-Added Modules (Add-ons / VAS)

Attached to a base connectivity service to lift ARPU and margin:

| Module | Price/mo | Margin |
|--------|----------|--------|
| Managed Router | R149 | 28–50% |
| Enhanced SLA (99.5%) | R249 | 40% |
| Premium SLA (99.9%) | R499 | 40% |
| 5G/LTE Failover | R299–R599 | 45% |
| Static IP | R99 | — |
| Email Hosting (5/10 mailbox) | R79–R129 | 46–49% |
| Cloud Backup (50/100/250 GB) | R49–R179 | 55–59% |
| Business VPN (5/10 users) | R49–R89 | 55–59% |
| Security Suite | R129 | 61% |
| Microsoft 365 (per user) | R149 | — |

**VAS supplier decisions:** Cloud backup = Comet + Wasabi (~R46/customer); Managed IT uses Acronis. Email = HostAfrica cPanel (~R50/customer). Backup is a **paid add-on** on Starter/Plus tiers, bundled only on Pro/Managed IT.

---

## 6. Hardware

Sold as **bundled** (with a connectivity plan) or **resale** (e-commerce) — not a separate buy-journey.

- **Routers/gateways:** Reyee (EG105G, EG305GH-P, EW1300G…), MikroTik
- **mmWave radios (DUNE 60GHz):** DN170G-AP (R5,318), DN170L-CPE (R4,986), DC170P065 CPE (R3,678)
- **Wi-Fi 6 APs:** Reyee
- **Supplier catalogue:** synced from Scoop, MiRO, Nology, Rectron (7,438 products — the supplier "moat")

---

## 7. Pipeline & Sunset

### Pipeline (planned)
| Product | Status | Notes |
|---------|--------|-------|
| EduConnect (Private Schools) | PLANNED | Classroom R2,499 / Campus R4,999 / Campus Plus R8,999 |
| CloudWiFi WaaS | scaling | hospitality/retail roll-out |
| ParkConnect (DUNE) | Q2 2026 | first commercial sites |
| CircleConnect IoT | Q2 2026 | Wave 1 |
| Managed IT / CloudHost | Q1 2026 GA | |
| ThinkWiFi Partnership | Q1 2026 | ad-funded free Wi-Fi monetisation |

### Sunset
| Product | Reason |
|---------|--------|
| **SkyFibre Home** (consumer FWA) | ZERO/NEGATIVE margin after MTN AirFibre channel conflict — deprioritised, customers transitioned |

---

## 8. Wholesale / Sourcing Behind the Products

| Provider | Role | Feeds |
|----------|------|-------|
| **MTN / Tarana** | Fixed-wireless broadband (FWB) | SkyFibre, AirLink, UmojaLink, ClinicConnect |
| **DFA (Dark Fibre Africa)** | Business fibre | BizFibreConnect |
| **MTN Wholesale FTTH** | Residential fibre | HomeFibreConnect |
| **Echo SP** | Managed BNG / IP transit | core infrastructure |
| **Arlan** | MTN LTE/5G reseller | Mobile Solutions, CircleConnect IoT |
| **Peraso (via MiRO)** | 60GHz mmWave hardware | ParkConnect / DUNE |
| **Scoop / MiRO / Nology / Rectron** | Hardware distributors | resale + bundled CPE |
| **NameHero** | VPS / cPanel hosting | CircleCloud Hosting |
| **Comet+Wasabi / Acronis / HostAfrica** | Backup & email VAS | add-on modules |

---

## 9. Source Documents

| Topic | Path |
|-------|------|
| Complete portfolio (strategic) | `files/CircleTel_Complete_Product_Portfolio_Active_and_Pipeline_v1_0.md` |
| Product catalogue reference (JSON) | `files/skills/circletel-product-manager/references/product_catalogue.json` |
| Portfolio overview | `docs/products/CircleTel_Product_Portfolio_Overview.md` |
| SkyFibre SMB spec | `products/.../SkyFibre_SMB_Commercial_Product_Spec_v2_0.md` |
| Managed IT | `products/.../CircleTel_Managed_IT_Services_Overview_v1_0.md` |
| WorkConnect SOHO | `products/connectivity/soho/CircleTel_WorkConnect_SOHO_Product_Portfolio_v1_1.md` |
| CloudWiFi WaaS | `products/connectivity/wifi-as-a-service/CircleTel_CloudWiFi_WaaS_Commercial_Product_Spec_v1_0.md` |
| CircleCloud Hosting | `products/cloud-hosting/CircleCloud_Hosting_Commercial_Product_Spec_v1_0.md` |
| DUNE 60GHz / ParkConnect | `products/connectivity/fixed-wireless/DUNE_60GHz_Product_Portfolio_CircleTel_v1_1.md` |
| BizFibreConnect (DFA) | `products/wholesale/dfa/CircleTel_BizFibreConnect__Business_Fibre_Product_Portfolio_-_DFA_Based.md` |
| Wholesale providers | `products/wholesale/{mtn,dfa,echo-sp,arlan}/` |
| VAS strategy | memory `workconnect-vas-strategy.md` |

> Companion doc: `docs/architecture/PRODUCT_CATALOGUE_AND_MANAGEMENT.md` (how these products are modelled, priced, and managed in code).

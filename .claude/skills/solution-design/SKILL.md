---
name: solution-design
version: 1.0.0
description: "CircleTel product management and solution design. Triggers: 'solution design', 'product design', 'new product', 'unit economics', 'margin analysis', 'technology selection', 'product-market fit', 'PMF', 'which technology', 'pricing model', 'contribution margin', 'LTV', 'CAC', 'wholesale costs'."
dependencies: [promotional-campaigns, pricing-strategy]
---

# CircleTel Solution Design & Product Management

Strategic product management for CircleTel's telecommunications portfolio. Use this skill to design solutions, validate unit economics, select technologies, and ensure product-market fit.

## When This Skill Activates

This skill automatically activates when you:
- Design new products or solutions for customers
- Evaluate unit economics or contribution margins
- Select technology for a customer scenario
- Validate product-market fit
- Analyze wholesale costs and pricing
- Compare product options for a use case
- Plan new product launches

**Keywords**: solution design, product design, new product, unit economics, margin analysis, technology selection, product-market fit, PMF, which technology, pricing model, contribution margin, LTV, CAC, wholesale costs, Tarana, DFA, DUNE, FWA, fibre

## Quick Reference

| Need | Section |
|------|---------|
| Choose technology for customer | [Technology Selection Matrix](#technology-selection-matrix) |
| Calculate margins | [Unit Economics](#unit-economics) |
| Design new product | [Solution Design Checklist](#solution-design-checklist) |
| Validate PMF | [Product-Market Fit Framework](#product-market-fit-framework) |
| Product specs | See `references/product-portfolio.md` |
| Wholesale costs | See `references/wholesale-costs.md` |

---

## CircleTel Identity

### Brand
- **Legal Entity:** CircleTel SA (Pty) Ltd (Reg: 2008/026404/07)
- **Brand Stylisation:** circleTEL
- **Tagline:** "Connecting Today, Creating Tomorrow"
- **Parent:** New Generation Group (NewGen)

### Vision
"To be South Africa's most trusted connectivity partner for underserved communities and growing businesses, delivering affordable, reliable digital services that enable economic participation and growth through AI-powered, digital-first experiences."

### Strategic Pillars (v4.0)
1. **Digital Inclusion** — Bridge the connectivity divide
2. **SME Empowerment** — Integrated digital services
3. **AI & Digital First** — AI at the core of operations
4. **Operational Excellence** — Scalable, efficient operations
5. **Sustainable Growth** — Diversified revenue, margin discipline

### Core Values
1. Ubuntu — Community-first
2. Reliability — Delivering on promises
3. Innovation — AI and technology for real problems
4. Accessibility — Digital services for all South Africans
5. Integrity — Transparent, ethical operations

---

## Product Portfolio Overview

| Product Line | Technology | Status | Price Range | Target Margin |
|--------------|------------|--------|-------------|---------------|
| **SkyFibre SMB** | MTN Tarana G1 FWA | ACTIVE | R1,899–4,899/pm | 41–52% |
| **BizFibreConnect** | DFA FTTB | ACTIVE | R1,699–4,373/pm | 31–41% |
| **ClinicConnect** | Hybrid Tarana+LTE | SIGNED | R450/site/pm | 33–40% |
| **ParkConnect DUNE** | Peraso 60GHz mmWave | Q2 2026 | R1,299–4,999/pm | 54–75% |
| **AirLink FWA** | Reyee 5GHz | ACTIVE | R599–1,699/pm | 58–81% |
| **Managed IT** | SuperOps.ai | ACTIVE | R2,999–19,999/pm | 42–55% |
| **WorkConnect SOHO** | Technology-agnostic | Development | R799–1,499/pm | TBC |
| **CloudWiFi WaaS** | Managed overlay | Development | Per-venue | TBC |
| **CircleConnect** | MTN LTE/5G | ACTIVE | Package-dependent | 33–37% |
| **HomeFibreConnect** | MTN FTTH | SUNSET | R899–2,299/pm | 4–26% |

**Full product details:** See `references/product-portfolio.md`

---

## Technology Selection Matrix

Use this to recommend the right technology for each customer scenario.

| Scenario | Technology | Product Line | Rationale |
|----------|------------|--------------|-----------|
| SME in MTN Tarana coverage | Tarana G1 FWA | SkyFibre SMB | Best latency (<5ms), best unit economics |
| Business needs symmetrical + SLA | DFA FTTB | BizFibreConnect | Guaranteed symmetrical, enterprise SLA |
| Rapid deployment / failover | MTN LTE/5G | CircleConnect | Nationwide, same-day activation |
| Office park (multi-tenant) | Peraso 60GHz | ParkConnect DUNE | Highest margins, shared backhaul |
| No MTN coverage, moderate density | Reyee 5GHz | AirLink FWA | Self-deploy, control infrastructure |
| Township / affordable segment | Tarana or Reyee | UmojaLink | Community-centric, prepaid model |
| Remote healthcare / clinic | Hybrid Tarana+LTE | ClinicConnect | Reliability-critical, managed service |
| Home office / freelancer | Best available | WorkConnect SOHO | Technology-agnostic |
| Venue WiFi (hospitality) | Managed overlay | CloudWiFi WaaS | Single monthly fee |

### Technology Capabilities

| Technology | Download | Upload | Latency | Best For |
|------------|----------|--------|---------|----------|
| **Tarana G1 FWA** | Up to 1Gbps | 4:1 ratio | <5ms | SME, business-critical |
| **DFA FTTB** | Up to 1Gbps | Symmetrical | <3ms | Enterprise, SLA-required |
| **MTN FTTH** | Up to 1Gbps | Variable | <5ms | Residential |
| **Peraso 60GHz** | Up to 2Gbps | Symmetrical | <1ms | Office parks, short-range LoS |
| **MTN LTE** | 10-150Mbps | 10-30% of DL | 20-50ms | Mobile, backup |
| **MTN 5G** | 50-500Mbps | 10-30% of DL | 10-30ms | High-speed mobile |
| **Reyee 5GHz** | Up to 500Mbps | Variable | 5-15ms | Self-managed FWA |

### Decision Tree

```
Customer needs connectivity:
│
├── Is Tarana G1 coverage available?
│   ├── YES → SkyFibre SMB (best unit economics)
│   └── NO → Continue
│
├── Is DFA fibre available at location?
│   ├── YES + needs SLA → BizFibreConnect
│   └── NO → Continue
│
├── Is it an office park / business park?
│   ├── YES → ParkConnect DUNE (if LoS available)
│   └── NO → Continue
│
├── Is rapid deployment needed?
│   ├── YES → CircleConnect LTE/5G
│   └── NO → Continue
│
├── Is it a township / price-sensitive area?
│   ├── YES → AirLink FWA or UmojaLink
│   └── NO → Continue
│
└── Default → WorkConnect SOHO (best available at address)
```

---

## Unit Economics

### Golden Rule
> **Minimum 25% gross margin on ALL products — no exceptions without MD written approval.**

### Cost of Sale (COS) Components

| Component | Vendor | Monthly Cost | Notes |
|-----------|--------|--------------|-------|
| BNG Service | Echo SP | R20.20 | Tier 4 rate (>1k users) |
| IP Transit | Echo SP/DFA | R28.00 | ~4 Mbps avg @ R7/Mbps |
| DFA Backhaul | DFA Magellan | R86.27 | R12,940 ÷ 150 users |
| Support | Internal | R30.00 | L1 support allocation |
| Billing/Admin | AgilityGIS | R10.96 | BSS stack |
| **Total COS Floor** | | **R175.43** | Excludes access costs |

### Echo SP BNG Pricing Tiers

| Tier | Subscribers | Per-Sub MRC |
|------|-------------|-------------|
| 1 | 1–250 | R30.30 |
| 2 | 251–500 | R26.93 |
| 3 | 501–1,000 | R23.57 |
| 4 | 1,001+ | R20.20 |

### Portfolio Unit Economics

| Product | Blended CAC | LTV | LTV/CAC | Payback |
|---------|-------------|-----|---------|---------|
| SkyFibre SMB | R2,550 | R18,000+ | 7.1x | 4–6 mo |
| BizFibreConnect | R2,500 | R14,280 | 5.7x | 8 mo |
| ClinicConnect | R1,500 | R9,132 | 6.1x | 6 mo |
| ParkConnect DUNE | R8,167 | R22,788 | 2.8x | 5.7 mo |
| Managed IT | R3,500 | R35,988 | 10.3x | 4 mo |
| AirLink FWA | ~R1,500 | R10,000+ | 6.7x | 3–4 mo |

### Margin Calculation

```
Gross Margin % = (Revenue - COS) / Revenue × 100

Required: ≥25% gross margin

Example:
  SkyFibre SMB 50/25: R1,899/mo
  COS: ~R175
  Gross Margin: (R1,899 - R175) / R1,899 = 90.8% ✓
```

---

## Solution Design Checklist

For every new solution or product, validate against these 10 points:

### 1. Market Demand
- [ ] Is there proven, addressable demand in SA?
- [ ] Who is the buyer persona (specific, not "SMEs")?
- [ ] What's their willingness to pay?

### 2. Unit Economics
- [ ] Does it achieve ≥25% gross margin at scale?
- [ ] What is the COS floor?
- [ ] Is LTV ≥3× CAC?

### 3. Technology Fit
- [ ] Which access technology best serves the use case?
- [ ] Are there coverage constraints?
- [ ] What's the deployment complexity?

### 4. Wholesale Dependency
- [ ] What are MTN/DFA/Echo SP costs?
- [ ] Are there volume discounts available?
- [ ] What are the contract obligations?

### 5. Deployment Complexity
- [ ] Can we deliver within operational capacity?
- [ ] What's the order-to-active timeline?
- [ ] What CPE/installation is required?

### 6. Competitive Differentiation
- [ ] Why would a customer choose CircleTel?
- [ ] What's our technology advantage?
- [ ] What's our service advantage?

### 7. Revenue Model
- [ ] MRR vs one-off vs blended?
- [ ] Contract term?
- [ ] ARPU trajectory over time?

### 8. Capital Requirement
- [ ] What CAPEX is needed?
- [ ] Who funds CPE — CircleTel or customer?
- [ ] What's the payback period?

### 9. Scalability
- [ ] Does it scale without proportional headcount?
- [ ] Are there volume cost improvements?
- [ ] What's the ops overhead at 10×, 100×?

### 10. Portfolio Alignment
- [ ] Does it cross-sell or cannibalize?
- [ ] How does it fit the product naming convention?
- [ ] Is it aligned with v4.0 strategy?

---

## Product-Market Fit Framework

### Stage 1: Problem Validation

| Question | How to Validate |
|----------|-----------------|
| Who has the problem? | Specific persona research |
| How are they solving it today? | Competitor analysis |
| Willingness to pay? | Customer interviews, not assumptions |
| Switching cost? | Analyze competitor lock-in |

### Stage 2: Solution Validation

| Question | How to Validate |
|----------|-----------------|
| Does our tech stack support it? | Technical feasibility review |
| Can we hit target price at ≥25% margin? | Full COS model |
| What's the MVP scope? | Feature prioritization |
| Order-to-active timeline? | Process mapping |

### Stage 3: Market Validation

| Metric | How to Calculate |
|--------|------------------|
| **TAM** | Total addressable market in ZAR |
| **SAM** | Limited by our coverage footprint |
| **SOM** | Realistic Year 1 capture |
| **Evidence** | LOIs, pilots, competitor analysis |

### Stage 4: Scale Validation

| Question | Answer Required |
|----------|-----------------|
| Unit economics at 10×, 100×, 1000×? | Model at each scale |
| Wholesale costs decrease? | Echo SP tiering, DFA volume |
| Ops processes scale? | Without linear headcount |
| Support model sustainable? | At projected subscriber count |

### PMF Signals to Measure

| Signal | Target |
|--------|--------|
| Monthly churn | <2% (target <1.5%) |
| NPS | >40 (M6), >50 (M12), >60 (M24) |
| Organic growth | >30% from referrals |
| Activation speed | <24h (LTE), <3d (FWA), <5d (fibre) |
| Support load | <2 tickets/customer/month |
| Revenue expansion | Positive net revenue retention |

---

## Product Prioritization (POV Scoring)

Score each product on four dimensions (1–10):

| Dimension | Question |
|-----------|----------|
| **Ease of Deployment** | How quickly can we deliver? |
| **GTM Readiness** | Are pricing, SLAs, sales tools ready? |
| **Market Demand** | Is there proven, addressable demand? |
| **Competition** | Can we win and differentiate? |

### Decision Thresholds

| Score | Action |
|-------|--------|
| **8.0+** | LAUNCH IMMEDIATELY |
| **6.5–7.9** | SELECTIVE LAUNCH (focus segments) |
| **5.0–6.4** | DEPRIORITISE (defer or pilot) |
| **<5.0** | DO NOT PURSUE |

---

## Contribution Margin Model Template

Every product proposal must include:

```markdown
## [Product Name] Contribution Margin Model

### Revenue
- Monthly price (excl. VAT): R[X]
- Contract term: [X] months
- Expected ARPU trajectory: [Flat/Growing/Declining]

### Cost of Sale
| Component | Monthly Cost |
|-----------|--------------|
| Access (MTN/DFA/etc.) | R[X] |
| BNG Service (Echo SP) | R[X] |
| IP Transit | R[X] |
| Support allocation | R[X] |
| Billing/Admin | R[X] |
| **Total COS** | **R[X]** |

### Hardware Amortization (if CircleTel-funded)
- CPE cost: R[X]
- Amortized over: [X] months
- Monthly allocation: R[X]

### Infrastructure Allocation
- Tower/site costs per user: R[X]

### Contribution Margin
- Revenue: R[X]
- Total COS (incl. hardware): R[X]
- **Gross Margin: [X]%** [✓ if ≥25%]

### Customer Economics
- CAC: R[X]
- LTV: R[X]
- LTV/CAC: [X]x [✓ if ≥3x]
- Payback: [X] months [✓ if <12]
```

---

## Naming Convention

All products follow established naming patterns:

| Pattern | Products |
|---------|----------|
| **[Descriptor]Connect** | HomeFibreConnect, BizFibreConnect, ClinicConnect, ParkConnect, WorkConnect |
| **Brand Names** | SkyFibre, AirLink, UmojaLink, CloudWiFi, CircleConnect |
| **Parent Brand** | CircleTel (stylised: circleTEL) |

**Never deviate from established naming without explicit approval.**

---

## Competitive Landscape

### Key Competitors

| Tier | Competitors | Our Advantage |
|------|-------------|---------------|
| **Premium FWA** | WiruLink, Comsol | Tarana G1 latency |
| **Mobile** | MTN, Vodacom, Rain, Telkom | Dedicated FWA reliability |
| **Fibre ISP** | Afrihost, Cool Ideas, RSAWEB | Multi-tech flexibility |

### CircleTel Competitive Advantages

1. **Technology moat:** Tarana G1 = sub-5ms latency (10× better than legacy)
2. **Multi-technology:** FWA + fibre + LTE/5G + 60GHz
3. **AI-first CX:** Multilingual chatbot, predictive churn
4. **Transparent pricing:** Published prices with clear SLAs
5. **Digital-first ops:** Lower overhead, faster deployment
6. **Community focus:** Ubuntu values, township inclusion

---

## Financial Targets (v4.0 Strategy)

| Metric | Target |
|--------|--------|
| MRR (Month 12) | R11.84M |
| Annual run rate | R142M |
| External customers | 12,500+ |
| EBITDA margin | 22%+ |
| Cash flow positive | Month 6 |
| External revenue | 50% of total |
| Customer concentration | No single >30% |

---

## Key Lessons (2025-2026)

1. **Working capital is strategic** — 296-day DSO paralysed execution
2. **Intercompany dependencies** create cash starvation
3. **Margin vs Volume:** 42% gross margin proves pricing works
4. **Strategy without resources** is a wish list
5. **Concentration risk:** No customer >30% of revenue

---

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `promotional-campaigns` | Designing promos for products |
| `pricing-strategy` | Pricing decisions and packaging |
| `competitor-alternatives` | Deep competitive analysis |

---

## Reference Files

- `references/product-portfolio.md` — Full product specifications
- `references/wholesale-costs.md` — MTN, DFA, Echo SP pricing
- `references/technology-specs.md` — Technical capabilities
- `products/solution-design.md` — Master source document

---

**Version:** 1.0.0
**Last Updated:** 2026-03-01
**Source:** products/solution-design.md

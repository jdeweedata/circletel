# SkyFibre Township™ Per Site Analysis
## Complete Financial & Technical Overview for Single Clinic Deployment
### Individual Site Business Case & Implementation Guide

---

## EXECUTIVE SUMMARY - SINGLE SITE

### Quick Financial Snapshot (Per Clinic)

| Metric | Value | Timeline |
|--------|-------|----------|
| **Initial Investment** | R58,226 | Once-off |
| **Monthly Revenue** | R7,825 | From Month 3 |
| **Monthly Costs** | R2,970 | Ongoing |
| **Monthly Profit** | R4,855 | Steady state |
| **Break-even** | 18 vouchers/day | Month 2 |
| **Payback Period** | 12 months | Investment recovered |
| **Annual ROI** | 100% | R58,260 profit/year |
| **Households Served** | 500-2,000 | Depending on model |

### Technical Snapshot

| Component | Specification | Coverage |
|-----------|--------------|----------|
| **Backhaul** | MTN Tarana 200 Mbps | Leased service |
| **WiFi Coverage** | 500m radius standard | ~500 households |
| **Extended Coverage** | 3-5km with CPEs | ~2,000 households |
| **Concurrent Users** | 400+ | Peak capacity |
| **User Speed** | 10-20 Mbps | Per connection |
| **Uptime Target** | 99.5% | Monthly SLA |

---

## 1. FINANCIAL BREAKDOWN PER SITE

### 1.1 Capital Investment Details

```
TOTAL CAPEX: R58,226
│
├── INFRASTRUCTURE (R15,000)
│   ├── 6m Steel Monopole
│   │   ├── 2×3m sections: R6,000
│   │   ├── Base plate: R1,500
│   │   └── Hardware: R500
│   ├── Foundation (1m³)
│   │   ├── Concrete: R1,500
│   │   ├── Reinforcement: R800
│   │   └── Labor: R700
│   ├── Lightning Protection
│   │   ├── Lightning rod: R1,200
│   │   ├── Grounding: R600
│   │   └── Surge protection: R200
│   └── Security
│       ├── Anti-climb: R500
│       ├── Locks: R300
│       └── Signage: R700
│
├── NETWORK EQUIPMENT (R28,226)
│   ├── Core Networking
│   │   ├── MikroTik CCR1009: R6,000
│   │   ├── PoE+ Switch (8-port): R4,500
│   │   └── Configuration: R0
│   ├── WiFi Access Points
│   │   ├── 2× TP-Link EAP245: R3,536
│   │   ├── 2× Reyee RAP2200: R3,190
│   │   ├── Outdoor enclosures: R2,000
│   │   └── Mounting brackets: R1,000
│   └── Cabinet & Accessories
│       ├── 12U outdoor cabinet: R6,000
│       ├── Cooling fans: R800
│       ├── Power distribution: R700
│       └── Cable management: R500
│
├── INSTALLATION (R15,000)
│   ├── Site Survey: R2,000
│   ├── Civil Works: R4,000
│   ├── Equipment Installation: R6,000
│   └── Network Configuration: R3,000
│
└── MTN TARANA CPE: R0 (Leased)
```

### 1.2 Monthly Operating Expenses

```
TOTAL MONTHLY OPEX: R2,970
│
├── CONNECTIVITY (R699)
│   └── MTN Tarana 200 Mbps
│       ├── Wholesale rate: R699
│       ├── Includes CPE lease
│       ├── 60TB monthly data
│       └── 99.5% SLA
│
├── PLATFORM COSTS (R489)
│   └── AgilityGIS BSS/OSS
│       ├── Service points (50): R313
│       ├── RADIUS accounts (50): R163
│       └── API access: R14
│
├── MAINTENANCE (R150)
│   ├── Remote monitoring: R0
│   ├── Quarterly inspection: R50
│   ├── Annual servicing: R50
│   ├── Spare parts reserve: R25
│   └── Community champion: R25
│
├── POWER & UTILITIES (R500)
│   ├── Electricity usage: R400
│   └── Clinic admin fee: R100
│
├── BUSINESS OPERATIONS (R862)
│   ├── Spaza commissions (15%): R562
│   ├── Community champion: R200
│   ├── Marketing materials: R50
│   └── Insurance: R50
│
└── CONTINGENCY (R270)
    └── 10% of operational costs
```

### 1.3 Revenue Model Per Site

```
MONTHLY REVENUE STREAMS: R7,825
│
├── VOUCHER SALES (R6,375) - 81% of revenue
│   ├── Daily vouchers sold: 50
│   ├── Price per voucher: R5
│   ├── Gross revenue: R7,500
│   └── Net (after 15% commission): R6,375
│
├── MONTHLY SUBSCRIPTIONS (R900) - 12% of revenue
│   ├── Home CPEs: 3 × R300 = R900
│   ├── Growth potential: 10+ CPEs
│   └── Target Year 2: R3,000
│
├── HEALTHCARE OPERATIONS (R450) - 6% of revenue
│   ├── Unjani subsidy: R450
│   └── Guaranteed monthly
│
├── BUSINESS SERVICES (R300) - 4% of revenue
│   ├── Premium packages: 2 × R150
│   └── Growth to 5 × R300 = R1,500
│
├── ADVERTISING (R500) - 6% of revenue
│   └── Portal advertising: R500
│
└── PLATFORM FEES (R300) - 4% of revenue
    └── ThinkWiFi or other: R300

REVENUE GROWTH PROJECTION:
├── Year 1: R7,825/month (R93,900/year)
├── Year 2: R10,500/month (R126,000/year)
└── Year 3: R12,800/month (R153,600/year)
```

### 1.4 Profitability Analysis

```
MONTHLY P&L:
Revenue:                    R7,825
Less: Operating Costs      (R2,970)
EBITDA:                     R4,855
Margin:                     62%

ANNUAL METRICS:
Annual Revenue:             R93,900
Annual OPEX:               (R35,640)
Annual EBITDA:              R58,260
Depreciation (5 years):    (R11,645)
EBIT:                       R46,615
Tax (28%):                 (R13,052)
Net Profit:                 R33,563

Key Ratios:
├── Gross Margin: 75%
├── EBITDA Margin: 62%
├── Net Margin: 36%
└── ROI: 100% (R58,260 EBITDA / R58,226 investment)
```

### 1.5 Cash Flow Timeline

```
MONTH-BY-MONTH CASH FLOW:
Month 0: (R58,226) - Initial investment
Month 1: (R2,970) - Operational, building awareness
Month 2: R1,030 - 20 vouchers/day achieved
Month 3: R3,030 - 35 vouchers/day
Month 4: R4,855 - 50 vouchers/day target
Month 5-12: R4,855/month

CUMULATIVE CASH POSITION:
Month 3: (R56,166) - Still recovering investment
Month 6: (R41,601)
Month 9: (R27,036)
Month 12: (R12,471)
Month 13: R2,384 - CASH POSITIVE
Month 15: R12,094 - FULL PAYBACK

Working Capital Requirement: R10,000 (months 1-3)
```

---

## 2. TECHNICAL SPECIFICATIONS PER SITE

### 2.1 Network Architecture

```
NETWORK TOPOLOGY:
│
├── BACKHAUL LAYER
│   └── MTN Tarana G1 CPE
│       ├── Frequency: 28 GHz
│       ├── Capacity: 200 Mbps symmetrical
│       ├── Latency: <5ms to core
│       ├── Monthly data: 60TB
│       └── Mounting: 5.5m on pole
│
├── DISTRIBUTION LAYER
│   └── MikroTik CCR1009 Router
│       ├── CPU: 8-core ARM
│       ├── RAM: 2GB
│       ├── Throughput: 1 Gbps
│       ├── Concurrent users: 1000+
│       └── Features: Hotspot, QoS, RADIUS
│
├── ACCESS LAYER
│   ├── Zone 1 (0-200m): High Density
│   │   └── 2× TP-Link EAP245
│   │       ├── Standard: 802.11ac Wave 2
│   │       ├── Speed: 1.75 Gbps
│   │       ├── Users: 100+ each
│   │       └── Coverage: 150m radius
│   │
│   └── Zone 2 (200-500m): Extended
│       └── 2× Reyee RAP2200
│           ├── Standard: 802.11ac
│           ├── Power: 500mW
│           ├── Users: 80+ each
│           └── Coverage: 200m radius
│
└── OPTIONAL EXTENSION (1-5km)
    └── PTMP CPE Network
        ├── Base: LigoWave DLB PRO
        └── CPEs: 10-50 units deployed
```

### 2.2 Coverage Map & Capacity

```
COVERAGE ZONES:
                         [CLINIC POLE]
                              |
        Zone 1 (0-200m)       |       Zone 2 (200-500m)
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    │  ┌──────────┐          │          ┌──────────┐  │
    │  │  AP1     │          │          │  AP3     │  │
    │  │  North   │          │          │  East    │  │
    │  └──────────┘          │          └──────────┘  │
    │       •150m            │            •200m       │
    │                         │                         │
    │  ┌──────────┐          │          ┌──────────┐  │
    │  │  AP2     │          │          │  AP4     │  │
    │  │  South   │          │          │  West    │  │
    │  └──────────┘          │          └──────────┘  │
    │       •150m            │            •200m       │
    │                         │                         │
    └─────────────────────────┴─────────────────────────┘

CAPACITY PER ZONE:
├── Zone 1 (Strong Signal)
│   ├── Households: 200
│   ├── Concurrent users: 200
│   ├── Speed per user: 15-25 Mbps
│   └── Total throughput: 100 Mbps
│
└── Zone 2 (Good Signal)
    ├── Households: 300
    ├── Concurrent users: 200
    ├── Speed per user: 5-15 Mbps
    └── Total throughput: 100 Mbps

TOTAL SITE CAPACITY:
├── Households covered: 500
├── Maximum concurrent: 400
├── Average speed: 10-20 Mbps
└── Peak throughput: 200 Mbps
```

### 2.3 Equipment Configuration

```
ROUTER CONFIGURATION:
/interface wireless
├── SSID: "SkyFibre Township"
├── Security: WPA2-PSK + Captive Portal
├── Band: 2.4 GHz + 5 GHz
└── Channel width: 20/40/80 MHz auto

/ip hotspot
├── Login method: Voucher code
├── Session timeout: 24 hours
├── Idle timeout: 30 minutes
├── Rate limiting: 20 Mbps per user
└── Concurrent sessions: 1 per voucher

/queue tree
├── Total bandwidth: 200 Mbps
├── Voucher users: 150 Mbps (75%)
├── Subscription users: 40 Mbps (20%)
└── Business users: 10 Mbps (5%)

ACCESS POINT SETTINGS:
├── Transmit power: 20 dBm (100mW)
├── Channel selection: Auto DFS
├── Airtime fairness: Enabled
├── Band steering: 5GHz preferred
├── Client isolation: Enabled
└── Fast roaming: 802.11r enabled
```

### 2.4 Installation Timeline

```
DAY 1: SITE PREPARATION (8 hours)
├── 08:00 - Site survey & marking
├── 09:00 - Excavation for foundation
├── 11:00 - Reinforcement installation
├── 13:00 - Concrete pour
├── 15:00 - Initial curing
└── 16:00 - Site cleanup

DAY 2: POLE INSTALLATION (6 hours)
├── 08:00 - Foundation inspection
├── 09:00 - Pole assembly
├── 10:00 - Pole erection
├── 12:00 - Alignment & securing
├── 14:00 - Grounding installation
└── 15:00 - Safety inspection

DAY 3: EQUIPMENT MOUNTING (8 hours)
├── 08:00 - Cabinet installation
├── 10:00 - Network equipment mounting
├── 12:00 - Access point installation
├── 14:00 - Cable routing
├── 15:00 - Power connections
└── 16:00 - Weatherproofing

DAY 4: CONFIGURATION (6 hours)
├── 08:00 - MTN Tarana alignment
├── 10:00 - Router configuration
├── 12:00 - WiFi optimization
├── 14:00 - Portal setup
└── 15:00 - Initial testing

DAY 5: COMMISSIONING (4 hours)
├── 08:00 - Full system test
├── 09:00 - Coverage verification
├── 10:00 - Documentation
├── 11:00 - Staff training
└── 12:00 - Go-live
```

---

## 3. PERFORMANCE METRICS PER SITE

### 3.1 Technical KPIs

```
NETWORK PERFORMANCE TARGETS:
├── Availability
│   ├── Uptime: >99.5% (43 minutes downtime/month max)
│   ├── MTN SLA: 99.5%
│   └── Power backup: 8 hours via clinic UPS
│
├── Quality
│   ├── Latency: <10ms local, <30ms national
│   ├── Jitter: <5ms
│   ├── Packet loss: <0.1%
│   └── DNS resolution: <50ms
│
├── Capacity
│   ├── Concurrent users: 400+
│   ├── Daily unique users: 500-1000
│   ├── Peak hour loading: <70%
│   └── Oversubscription: 10:1
│
└── User Experience
    ├── Connection time: <5 seconds
    ├── Portal load: <3 seconds
    ├── Video streaming: 720p minimum
    └── VoIP quality: MOS >4.0
```

### 3.2 Commercial KPIs

```
BUSINESS PERFORMANCE TARGETS:
├── Revenue Metrics
│   ├── Daily voucher sales: 50 target
│   ├── ARPU: R45/user/month
│   ├── Revenue/household: R15/month
│   └── Conversion rate: 20% of foot traffic
│
├── Cost Metrics
│   ├── CAC: <R20 per user
│   ├── OPEX ratio: <38%
│   ├── Maintenance: <5% of revenue
│   └── Bad debt: <2%
│
├── Growth Metrics
│   ├── User growth: 20% month-on-month (first 6 months)
│   ├── Churn rate: <5% monthly
│   ├── Subscription growth: 2 new CPEs/month
│   └── Business accounts: 1 new/month
│
└── Operational Metrics
    ├── Ticket resolution: <4 hours
    ├── Voucher availability: 99%
    ├── Commission payment: Same day
    └── User satisfaction: >80%
```

---

## 4. RISK ANALYSIS PER SITE

### 4.1 Financial Risks

```
RISK ASSESSMENT & MITIGATION:

Low Adoption Risk:
├── Scenario: Only 20 vouchers/day
├── Impact: Revenue R3,150/month
├── Break-even: Still achieved
├── Mitigation: Marketing, free trials
└── Probability: 20%

Competition Risk:
├── Scenario: MNO offers competing service
├── Impact: 30% revenue loss
├── Mitigation: First-mover advantage, pricing
└── Probability: 30%

Technical Failure:
├── Scenario: Equipment failure
├── Impact: 2-day outage = R500 loss
├── Mitigation: Spare equipment on hand
└── Probability: 5%

Power Issues:
├── Scenario: Extended loadshedding
├── Impact: 4 hours/day offline
├── Mitigation: Solar backup option (R25,000)
└── Probability: 40%
```

### 4.2 Scenario Analysis

```
FINANCIAL SCENARIOS:

PESSIMISTIC (25% probability):
├── Vouchers/day: 25
├── Revenue/month: R4,537
├── Costs/month: R2,970
├── Profit/month: R1,567
├── Annual ROI: 32%
└── Payback: 37 months

BASE CASE (50% probability):
├── Vouchers/day: 50
├── Revenue/month: R7,825
├── Costs/month: R2,970
├── Profit/month: R4,855
├── Annual ROI: 100%
└── Payback: 12 months

OPTIMISTIC (25% probability):
├── Vouchers/day: 75
├── Revenue/month: R10,375
├── Costs/month: R2,970
├── Profit/month: R7,405
├── Annual ROI: 153%
└── Payback: 8 months

WEIGHTED AVERAGE ROI: 84%
```

---

## 5. SCALING OPTIONS FROM SINGLE SITE

### 5.1 Expansion Paths

```
GROWTH STRATEGY FROM ONE SITE:

OPTION 1: Geographic Expansion
├── Add mesh nodes (R1,200 each)
├── Extend coverage by 150m per node
├── 10 nodes = 1.5km additional coverage
├── Investment: R12,000
├── Additional revenue: R3,000/month
└── ROI on expansion: 300%

OPTION 2: Capacity Upgrade
├── Add 100 Mbps bandwidth: R350/month
├── Support 200 more users
├── Additional revenue: R2,000/month
├── Net profit increase: R1,650/month
└── No CAPEX required

OPTION 3: PTMP Extension
├── Add sector antenna: R15,000
├── Deploy 20 CPEs: R36,000
├── Total investment: R51,000
├── Additional revenue: R6,000/month
└── ROI: 141%

OPTION 4: Premium Services
├── Business fiber: R5,000 setup
├── Dedicated bandwidth packages
├── VPN services
├── Hosting services
└── Additional revenue: R5,000/month
```

### 5.2 Replication Model

```
TEMPLATE FOR NEW SITES:
├── Site Selection Criteria
│   ├── 200+ daily foot traffic
│   ├── 500+ households in 500m
│   ├── Limited existing WiFi
│   └── Clinic cooperation secured
│
├── Standard Equipment Pack
│   ├── Pre-configured routers
│   ├── Tested AP configurations
│   ├── Standard pole kit
│   └── Installation toolkit
│
├── Deployment Team
│   ├── 2 technicians
│   ├── 1 supervisor
│   ├── 5-day installation
│   └── Cost: R15,000
│
└── Operational Template
    ├── Voucher distribution setup
    ├── Spaza shop agreements
    ├── Marketing materials
    └── Launch event plan
```

---

## 6. VALUE PROPOSITION PER SITE

### 6.1 Community Impact

```
SOCIAL VALUE METRICS:
├── Digital Inclusion
│   ├── Households connected: 500
│   ├── People impacted: 2,500
│   ├── Students enabled: 300
│   └── Businesses supported: 20
│
├── Economic Impact
│   ├── Direct employment: 3 people
│   ├── Spaza commission: R6,750/month
│   ├── Data cost savings: R20/day/user
│   └── Economic activity: R50,000/month
│
├── Healthcare Enhancement
│   ├── Telemedicine enabled
│   ├── Health information access
│   ├── Appointment systems
│   └── Emergency communication
│
└── Educational Value
    ├── e-Learning access
    ├── Research capability
    ├── Online courses
    └── Digital literacy
```

### 6.2 Competitive Advantages

```
PER-SITE DIFFERENTIATION:

vs Mobile Data:
├── Cost: R5/day vs R29/day
├── Speed: Consistent vs Variable
├── Coverage: 500m radius vs Patchy
├── Sharing: Family-wide vs Single device
└── Winner: SkyFibre by 80%

vs Fiber ISPs:
├── Installation: R0 vs R2,000+
├── Monthly cost: R5/day vs R600/month
├── Flexibility: Daily vs Contract
├── Coverage: Community-wide vs Individual
└── Winner: SkyFibre for masses

vs Other WiFi:
├── Investment: R58k vs R150k
├── Deployment: 5 days vs 3 weeks
├── Community tie: Clinic-based vs Commercial
├── Revenue model: Multiple vs Single
└── Winner: SkyFibre efficiency
```

---

## 7. DECISION FRAMEWORK PER SITE

### 7.1 Site Viability Checklist

```
MINIMUM REQUIREMENTS FOR GO DECISION:
□ Population density: >1000 households/km²
□ Clinic cooperation: Agreement signed
□ Power availability: Confirmed stable
□ MTN Tarana coverage: Signal >-70dBm
□ Spaza network: 5+ shops identified
□ Competition: No existing affordable WiFi
□ Security: Acceptable risk level
□ ROI projection: >50% minimum

SCORING (must achieve 7/10):
□ High foot traffic (200+ daily): 2 points
□ Central location: 1 point
□ Youth population >30%: 1 point
□ Business activity present: 1 point
□ Community leader support: 2 points
□ Limited mobile coverage: 1 point
□ Growing area: 1 point
□ Strategic value: 1 point
```

### 7.2 Investment Decision

```
PER-SITE INVESTMENT DECISION:

GO CRITERIA:
✓ Investment: R58,226 manageable
✓ Payback: 12 months acceptable
✓ ROI: 100% excellent
✓ Risk: Mitigated through model
✓ Scale: Replicable template

EXPECTED OUTCOMES:
├── Year 1: R33,563 net profit
├── Year 2: R75,000 net profit
├── Year 3: R95,000 net profit
├── 5-year NPV: R210,000
└── Social impact: 500 households

RECOMMENDATION: PROCEED
├── Strong unit economics
├── Proven demand at R5/day
├── Community protection model
├── Platform for expansion
└── Clear path to profitability
```

---

## CONCLUSION - PER SITE ANALYSIS

### Single Site Investment Case

**Financial Performance:**
- **Investment:** R58,226 fully deployed
- **Monthly Profit:** R4,855 (62% margin)
- **Annual ROI:** 100%
- **Payback:** 12 months
- **5-Year Value:** R210,000 NPV

**Technical Capabilities:**
- **Coverage:** 500m radius (500 households)
- **Capacity:** 400 concurrent users
- **Speed:** 10-20 Mbps per user
- **Reliability:** 99.5% uptime
- **Scalability:** Easy expansion options

**Risk Profile:**
- **Break-even:** Only 18 vouchers/day needed
- **Downside protection:** Profitable even at 50% projection
- **Multiple revenue streams:** Not dependent on single source
- **Community protection:** Local ownership reduces risks

**Strategic Value:**
- **Replicable model:** Template for 94 sites
- **Platform creation:** Foundation for digital services
- **Social impact:** Meaningful community benefit
- **First-mover advantage:** Establish before competition

### **Per-Site Verdict: HIGHLY VIABLE**

Each SkyFibre Township site represents a **standalone profitable business** that:
- Generates **R58,260 annual EBITDA** on **R58,226 investment**
- Serves **500-2,000 households** affordably
- Creates **sustainable community infrastructure**
- Provides **platform for future growth**

The model works at the unit level, making network expansion a matter of replication rather than experimentation.

---

**Document Status:** Per-Site Analysis
**Version:** 1.0
**Date:** August 2025
**Purpose:** Individual Site Business Case
**Decision:** Single sites are independently viable

*"Each clinic site is a profitable micro-business serving its community while building a national network."*
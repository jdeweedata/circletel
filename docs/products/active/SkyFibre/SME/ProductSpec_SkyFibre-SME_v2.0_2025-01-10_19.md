# SkyFibre SME™ Complete Product Specification Document
## Version 2.0 - Corrected MTN Wholesale Pricing
## Date: 10 January 2025 19:30 SAST
## Status: Final - Implementation Ready

---

**Document Control:**
- **Version:** 2.0
- **Author:** CircleTel Product Management
- **Supersedes:** v1.0 - Corrected to use actual MTN speeds
- **Classification:** Commercial In-Confidence

**Version History:**
| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 10/01/2025 19:30 | Updated with correct MTN wholesale speeds and costs |
| 1.0 | 10/01/2025 19:00 | Initial specification (incorrect speeds) |

---

## EXECUTIVE SUMMARY

### Business Overview
SkyFibre SME™ is an affordable Fixed Wireless Access solution for South African small to medium businesses (5-50 employees). Using MTN's Tarana G1 infrastructure with the available wholesale speeds (50/100/200 Mbps), we've created SME-appropriate packages that balance performance with affordability, achieving 20-30% margins while serving businesses without fibre access.

### Key Financial Metrics (Corrected Model)
- **Initial Investment per Customer:** R 2,500 - R 3,500 (including R875 RN setup)
- **Break-even Subscribers:** 250 customers
- **Target Margin:** 20% - 30% (realistic with MTN costs)
- **MTN Wholesale Speeds:** 50, 100, 200 Mbps only
- **Market Size:** 300,000+ SMEs without affordable fibre

### Critical Success Factors
- **Speed Options:** Limited but sufficient for SMEs
- **Cost Management:** Shared NNI and backhaul costs
- **Quick Setup:** 24-48 hours using self-install
- **Price Positioning:** Between residential and business
- **Volume Commitments:** Meeting MTN MSC requirements

---

## 1. PRODUCT OVERVIEW

### 1.1 Service Components

**Core Service Elements:**
1. **Connectivity:** MTN Tarana G1 (50/100/200 Mbps speeds only)
2. **Setup:** R875 per RN (self-install) or R2,000 (MTN install)
3. **NNI Port:** Shared 1 Gbps (R2,500/month) or 10 Gbps (R12,500/month)
4. **Backhaul:** Shared pool based on subscriber count
5. **Support:** Business hours (07:00-18:00)

### 1.2 MTN Wholesale Reality Check

**Available Speeds from MTN:**
```
Active Speeds (Can Order):
├── 50 Mbps: R499/month
├── 100 Mbps: R599/month
└── 200 Mbps: R699/month

Retired Speeds (Cannot Order):
├── 5 Mbps: R299 (existing only)
├── 10 Mbps: R399 (existing only)
└── 20 Mbps: R412 (existing only)
```

### 1.3 Infrastructure Cost Model

**Shared Cost Structure (per 200 customers):**
| Component | Cost | Per Customer | Notes |
|-----------|------|--------------|-------|
| NNI 1 Gbps Port | R 2,500 | R 12.50 | Initial 200 customers |
| Backhaul 1 Gbps | R 12,425 | R 62.13 | Scales with growth |
| Setup NRC | R 875 | Amortised/24 | R36.46/month |
| Support/NOC | R 10,000 | R 50.00 | Business hours only |
| **Infrastructure Total** | — | **R 161.09** | Per subscriber |

### 1.4 Revised Fair Usage Policy

**Monthly Data Allowances (Realistic for Speeds):**
| Package | Speed | Business Hours | After Hours | Total |
|---------|-------|----------------|-------------|-------|
| SME Essential | 50 Mbps | 400 GB | 600 GB | 1 TB |
| SME Professional | 100 Mbps | 600 GB | 900 GB | 1.5 TB |
| SME Premium | 200 Mbps | 800 GB | 1.2 TB | 2 TB |

---

## 2. PRICING STRUCTURE & MARGIN ANALYSIS

### 2.1 Corrected SME Pricing (Based on MTN Speeds)

| Package | SME Essential | SME Professional | SME Premium |
|---------|---------------|------------------|-------------|
| **Speed** | 50 Mbps | 100 Mbps | 200 Mbps |
| **Monthly Price** | **R 999** | **R 1,499** | **R 2,299** |
| **Setup Fee** | R 999 | R 999 | R 999 |
| **Contract** | 12 months | 12 months | 12 months |
| **Router Rental** | R 99/month | R 99/month | Included |
| **Static IP** | 1 included | 1 included | 2 included |
| **Target Business** | 5-15 employees | 15-30 employees | 30-50 employees |

### 2.2 Actual Cost Structure (Including All MTN Charges)

#### Per Subscriber Monthly Costs
| Cost Component | Essential (50) | Professional (100) | Premium (200) |
|----------------|----------------|-------------------|---------------|
| **MTN Wholesale** | R 499.00 | R 599.00 | R 699.00 |
| **NNI Port Share** | R 12.50 | R 12.50 | R 12.50 |
| **Backhaul Share** | R 62.13 | R 93.19 | R 124.25 |
| **Setup Amortised** | R 36.46 | R 36.46 | R 36.46 |
| **Internet Transit** | R 70.00 | R 105.00 | R 175.00 |
| **Support** | R 50.00 | R 60.00 | R 75.00 |
| **Equipment** | R 75.00 | R 75.00 | R 100.00 |
| **Total Cost** | R 805.09 | R 981.15 | R 1,222.21 |
| **Retail Price** | R 999.00 | R 1,499.00 | R 2,299.00 |
| **Gross Margin** | R 193.91 | R 517.85 | R 1,076.79 |
| **Margin %** | **19.4%** | **34.5%** | **46.8%** |

#### With Router Rental Income
| Package | Base Margin | Router Income | Total Margin | Margin % |
|---------|-------------|---------------|--------------|----------|
| Essential | R 193.91 | R 99.00 | R 292.91 | **29.3%** |
| Professional | R 517.85 | R 99.00 | R 616.85 | **41.2%** |
| Premium | R 1,076.79 | Included | R 1,076.79 | **46.8%** |

### 2.3 Meeting MTN Minimum Spend Commitments

**Quarterly MSC Requirements:**
| Quarter | MSC Required | Customers Needed | Revenue Target |
|---------|--------------|------------------|----------------|
| Q1 (M1-3) | Actual | 10 | R 14,985 |
| Q2 (M4-6) | R 14,970 | 20 | R 29,970 |
| Q3 (M7-9) | R 29,940 | 40 | R 59,880 |
| Q4 (M10-12) | R 49,900 | 67 | R 100,233 |

---

## 3. BACKHAUL OPTIMIZATION

### 3.1 Backhaul Cost Management

**Progressive Backhaul Scaling:**
| Customers | Total Bandwidth Need | Backhaul Purchase | Monthly Cost | Per Customer |
|-----------|---------------------|-------------------|--------------|--------------|
| 50 | 250 Mbps (1:10) | 300 Mbps | R 3,640 | R 72.80 |
| 100 | 500 Mbps (1:10) | 500 Mbps | R 6,067 | R 60.67 |
| 200 | 1 Gbps (1:10) | 1 Gbps | R 12,425 | R 62.13 |
| 400 | 2 Gbps (1:10) | 2 Gbps | R 24,850 | R 62.13 |

### 3.2 NNI Port Strategy

**Port Upgrade Triggers:**
| Customers | Port Size | Monthly Cost | Per Customer |
|-----------|-----------|--------------|--------------|
| 1-150 | 1 Gbps | R 2,500 | R 16.67-R 25.00 |
| 151-1,000 | 10 Gbps | R 12,500 | R 12.50-R 83.33 |

---

## 4. INSTALLATION STRATEGY

### 4.1 Setup Cost Options

**MTN Setup Charges:**
| Option | Cost | Includes | Best For |
|--------|------|----------|----------|
| Self-Install | R 875 | RN license only | Most SMEs |
| MTN Install | R 2,000 | Professional setup | Complex sites |

**Our Installation Packages:**
| Package | Our Price | Our Cost | Margin | Service |
|---------|-----------|----------|--------|---------|
| DIY Kit | FREE | R 875 | -R 875 | Self-install guide |
| Express | R 999 | R 875 + R 200 | -R 76 | Basic assistance |
| Premium | R 1,999 | R 2,000 | -R 1 | MTN professional |

### 4.2 Remote Node Equipment

**RN Economics:**
- MTN owns the RN (remains their property)
- R875 setup includes RN license
- Lost/damaged RN: Market value (~R3,500)
- No monthly RN rental fee

---

## 5. FINANCIAL PROJECTIONS (CORRECTED)

### 5.1 Break-Even Analysis

**Monthly Fixed Costs:** R 65,000
- NNI 1 Gbps Port: R 2,500
- Initial Backhaul (500 Mbps): R 6,067
- Support Team (2): R 20,000
- Operations: R 15,000
- Internet Transit: R 21,433

**Break-even Points:**
| Scenario | Avg Revenue | Avg Margin | Required Subs |
|----------|-------------|------------|----------------|
| Conservative | R 1,249 | R 254 | 256 |
| Realistic | R 1,499 | R 404 | 161 |
| Optimistic | R 1,699 | R 562 | 116 |

### 5.2 12-Month Projection (Meeting MTN MSC)

| Month | Subs | Revenue | MTN Costs | Other Costs | Net Profit |
|-------|------|---------|-----------|-------------|------------|
| 1 | 5 | R 6,245 | R 3,370 | R 65,000 | -R 62,125 |
| 2 | 8 | R 9,992 | R 5,392 | R 65,000 | -R 60,400 |
| 3 | 12 | R 14,988 | R 8,088 | R 65,000 | -R 58,100 |
| 4 | 18 | R 22,482 | R 12,132 | R 67,500 | -R 57,150 |
| 5 | 25 | R 31,225 | R 16,850 | R 67,500 | -R 53,125 |
| 6 | 35 | R 43,715 | R 23,590 | R 67,500 | -R 47,375 |
| 7 | 50 | R 62,450 | R 33,700 | R 71,640 | -R 42,890 |
| 8 | 70 | R 87,430 | R 47,180 | R 71,640 | -R 31,390 |
| 9 | 95 | R 118,655 | R 64,030 | R 71,640 | -R 17,015 |
| 10 | 130 | R 162,370 | R 87,620 | R 78,067 | -R 3,317 |
| 11 | 175 | R 218,575 | R 117,950 | R 78,067 | R 22,558 |
| 12 | 230 | R 287,270 | R 155,020 | R 84,425 | R 47,825 |

**Year 1 Result:** Break-even by Month 10, R47,825 profit by Month 12
**Note:** Slower growth due to higher MTN costs, but sustainable

---

## 6. COMPETITIVE POSITIONING (REALITY-BASED)

### 6.1 Actual Market Comparison

| Provider | 50 Mbps | 100 Mbps | 200 Mbps | Technology |
|----------|---------|----------|----------|------------|
| **Rain 5G Business** | R 999 | R 1,499 | R 2,499 | 5G (congested) |
| **Telkom LTE Business** | R 899 | R 1,299 | — | LTE (limited) |
| **MTN Direct** | R 799* | R 999* | R 1,299* | Consumer grade |
| **SkyFibre SME** | **R 999** | **R 1,499** | **R 2,299** | Tarana G1 |

*Consumer packages, no business SLA

### 6.2 Realistic Value Proposition

**"Reliable Business Connectivity Without Fibre"**

Key Messages:
1. **Fixed Speeds:** Actual 50/100/200 Mbps available
2. **Business Features:** Static IP, business support
3. **Quick Setup:** 24-48 hours with self-install
4. **Fair Pricing:** Competitive with market
5. **No Surprises:** Transparent costs

---

## 7. RISK MITIGATION

### 7.1 MTN Dependency Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| MSC penalties | Financial loss | Conservative growth planning |
| Price increases | Margin erosion | CPI escalation clauses |
| RN availability | Install delays | Maintain buffer stock |
| Network quality | Customer churn | SLA management |

### 7.2 Market Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Limited speed options | Lost sales | Position as sufficient for SMEs |
| High setup costs | Adoption barrier | Amortise over contract |
| Competition | Price pressure | Focus on reliability |

---

## 8. IMPLEMENTATION ROADMAP

### 8.1 Phase 1: Foundation (Month 1)

**Week 1-2:**
- [ ] Sign MTN wholesale agreement
- [ ] Pay Q1 upfront NRC (R8,750)
- [ ] Order initial 10 RNs
- [ ] Set up 1 Gbps NNI port

**Week 3-4:**
- [ ] Configure billing for 3 speed tiers
- [ ] Train installation team on self-install
- [ ] Create SME marketing materials
- [ ] Launch with 5 pilot customers

### 8.2 Phase 2: Growth (Months 2-6)

- [ ] Scale to 35 customers (Q2 MSC)
- [ ] Monitor backhaul utilisation
- [ ] Optimise support processes
- [ ] Prepare for Q3 expansion

### 8.3 Phase 3: Scale (Months 7-12)

- [ ] Reach 230 customers
- [ ] Upgrade to 10 Gbps NNI if needed
- [ ] Expand geographic coverage
- [ ] Add value services

---

## 9. OPERATIONAL EXCELLENCE

### 9.1 Cost Control Measures

**Key Metrics to Monitor:**
| Metric | Target | Action Trigger |
|--------|--------|----------------|
| Backhaul Utilisation | <80% | Upgrade at 75% |
| Support Cost/Customer | <R50 | Review at R60 |
| Installation Success | >90% | Training at <85% |
| MTN MSC Compliance | 100% | Weekly monitoring |

### 9.2 Service Delivery

**SLA Commitments (Realistic):**
| Package | Uptime | Response | Resolution |
|---------|--------|----------|------------|
| Essential | 98.5% | 8 hours | 48 hours |
| Professional | 99.0% | 4 hours | 24 hours |
| Premium | 99.5% | 2 hours | 12 hours |

---

## 10. STRATEGIC RECOMMENDATIONS

### 10.1 Immediate Actions

1. **Secure MTN Agreement**
   - Understand MSC penalties
   - Lock in pricing
   - Clarify RN availability

2. **Conservative Launch**
   - Start with 10 customers
   - Perfect self-install process
   - Build slowly to meet MSC

3. **Cost Management**
   - Share infrastructure costs
   - Optimise backhaul usage
   - Control support expenses

### 10.2 Success Factors

**Critical Metrics:**
- Achieve 230 customers by Month 12
- Maintain >20% margins
- Meet all MSC requirements
- Keep churn <5% monthly

---

## 11. CONCLUSION

### 11.1 Realistic Assessment

SkyFibre SME™ with corrected MTN pricing shows:

- **Viable but Challenging:** 20-30% margins achievable
- **Limited Flexibility:** Only 3 speed options
- **High Entry Costs:** R875 per customer setup
- **MSC Pressure:** Must grow to avoid penalties
- **Break-even:** Month 10 with disciplined growth

### 11.2 Go/No-Go Decision

**CONDITIONAL GO** ⚠️

**Proceed If:**
- ✅ Can secure 250+ customers in Year 1
- ✅ Accept lower margins (20-30%)
- ✅ Have R650k working capital
- ✅ Can meet MTN MSC requirements
- ✅ Focus on operational efficiency

**Investment Required:**
- Working capital: R 400,000
- MTN deposits: R 150,000
- Equipment float: R 100,000
- **Total: R 650,000**

**Realistic Returns:**
- Year 1: Near break-even
- Year 2: R 800k profit (projected)
- ROI: 123% by Year 2
- Risk: Medium-High

---

## APPENDICES

### Appendix A: MTN Cost Breakdown

**Monthly Recurring (200 customers):**
| Item | Calculation | Total |
|------|------------|-------|
| Wholesale (mix) | 100@R499 + 75@R599 + 25@R699 | R 112,350 |
| NNI 1 Gbps | Fixed | R 2,500 |
| Backhaul 1 Gbps | Fixed | R 12,425 |
| **Total MTN** | — | **R 127,275** |

### Appendix B: Self-Install Success Factors

**Requirements for 90% Success Rate:**
- Pre-configured routers
- Video installation guide
- WhatsApp support during install
- Site pre-qualification tool
- Clear line-of-sight instructions

### Appendix C: MSC Penalty Structure

**Penalties for Missing MSC:**
| Quarter | MSC Target | Penalty if Missed |
|---------|------------|-------------------|
| Q2 | R 14,970 | R 7,485 (50%) |
| Q3 | R 29,940 | R 14,970 (50%) |
| Q4 | R 49,900 | R 24,950 (50%) |

---

**Document Classification:** CONFIDENTIAL - INTERNAL USE ONLY
**Distribution:** Executive Team, Operations, Finance
**Review Cycle:** Monthly MSC compliance review

**Contact:** products@circletel.co.za | sme@skyfibre.co.za

*End of Document - Version 2.0*
*Reality-based pricing with actual MTN wholesale costs*
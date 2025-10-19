# SkyFibre Business™ Complete Product Specification Document
## Version 2.0 - Enterprise FWA with Correct MTN Pricing
## Date: 10 January 2025 19:45 SAST
## Status: Final - Implementation Ready

---

**Document Control:**
- **Version:** 2.0
- **Author:** CircleTel Product Management
- **Supersedes:** v1.0 - Corrected MTN wholesale costs
- **Classification:** Commercial In-Confidence

**Version History:**
| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 10/01/2025 19:45 | Updated with actual MTN speeds, NNI, and backhaul costs |
| 1.0 | 10/01/2025 18:00 | Initial specification (incorrect pricing) |

---

## EXECUTIVE SUMMARY

### Business Overview
SkyFibre Business™ is a premium Fixed Wireless Access business connectivity solution leveraging MTN's Tarana G1 infrastructure. Using the three available wholesale speeds (50/100/200 Mbps), we deliver enterprise-grade connectivity with multiple package options through speed bundling and QoS management, achieving 25-35% margins while serving businesses requiring true business-grade wireless connectivity.

### Key Financial Metrics (Corrected Model)
- **Initial Investment per Customer:** R 3,700 - R 5,500
- **Break-even Subscribers:** 185 customers  
- **Target Margin:** 25% - 35% (with actual MTN costs)
- **Available MTN Speeds:** 50, 100, 200 Mbps only
- **MSC Commitment:** R179,640/month by Month 24

### Critical Success Factors
- **Service Differentiation:** Bundle multiple lines for higher speeds
- **Infrastructure Efficiency:** 10 Gbps NNI for scale
- **Professional Installation:** MTN professional setup standard
- **Business SLAs:** 99.5% uptime with penalties
- **Volume Achievement:** Meet aggressive MSC targets

---

## 1. PRODUCT OVERVIEW

### 1.1 Service Components

**Core Service Elements:**
1. **Connectivity:** MTN Tarana G1 (50/100/200 Mbps base speeds)
2. **Speed Bundling:** Combine multiple lines for higher speeds
3. **Setup:** R2,000 per RN (professional installation standard)
4. **NNI Port:** 10 Gbps (R12,500/month) for scale
5. **Backhaul:** Dedicated business-grade allocation
6. **Support:** 24/7 with 4-hour SLA

### 1.2 Speed Architecture Strategy

**Creating Business Packages from Available Speeds:**
```
Package Design Using MTN Speeds:
├── Business 50: 1 x 50 Mbps line = 50 Mbps
├── Business 100: 1 x 100 Mbps line = 100 Mbps  
├── Business 200: 1 x 200 Mbps line = 200 Mbps
├── Business 300: 1 x 100 + 1 x 200 Mbps = 300 Mbps (bonded)
└── Business 400: 2 x 200 Mbps lines = 400 Mbps (bonded)
```

### 1.3 Infrastructure Investment Model

**Business-Grade Infrastructure (500 customers):**
| Component | Cost | Per Customer | Notes |
|-----------|------|--------------|-------|
| NNI 10 Gbps Port | R 12,500 | R 25.00 | High capacity |
| Backhaul 2 Gbps | R 24,850 | R 49.70 | 1:5 contention |
| Setup NRC (Pro) | R 2,000 | R 83.33 | Amortised/24 |
| 24/7 NOC | R 30,000 | R 60.00 | Premium support |
| **Infrastructure** | — | **R 218.03** | Per subscriber |

### 1.4 Business-Grade Service Levels

**Committed Performance Metrics:**
| Package | Contention | Uptime SLA | Response | Resolution |
|---------|------------|------------|----------|------------|
| Business 50 | 1:8 | 99.0% | 4 hours | 24 hours |
| Business 100 | 1:6 | 99.5% | 2 hours | 12 hours |
| Business 200 | 1:5 | 99.5% | 2 hours | 8 hours |
| Business 300 | 1:4 | 99.7% | 1 hour | 6 hours |
| Business 400 | 1:3 | 99.9% | 1 hour | 4 hours |

---

## 2. PRICING STRUCTURE & MARGIN ANALYSIS

### 2.1 Business Package Pricing

| Package | Business 50 | Business 100 | Business 200 | Business 300 | Business 400 |
|---------|-------------|--------------|--------------|--------------|--------------|
| **Actual Speed** | 50 Mbps | 100 Mbps | 200 Mbps | 300 Mbps | 400 Mbps |
| **MTN Lines Used** | 1x50 | 1x100 | 1x200 | 1x100+1x200 | 2x200 |
| **Monthly Price** | **R 1,999** | **R 2,999** | **R 4,499** | **R 5,999** | **R 7,999** |
| **Installation** | R 2,500 | R 2,500 | R 1,500 | FREE | FREE |
| **Contract** | 24 months | 24 months | 24 months | 24 months | 24 months |
| **Static IPs** | 1 | 2 | 4 | 8 | 16 |
| **Router** | Included | Included | Included | Included | Included |

### 2.2 Actual Cost Structure (All MTN Charges Included)

#### Per Package Monthly Costs
| Cost Component | Biz 50 | Biz 100 | Biz 200 | Biz 300 | Biz 400 |
|----------------|--------|---------|---------|---------|---------|
| **MTN Wholesale** | R 499 | R 599 | R 699 | R 1,298 | R 1,398 |
| **NNI Share (10G)** | R 25 | R 25 | R 25 | R 25 | R 25 |
| **Backhaul Share** | R 50 | R 75 | R 125 | R 187 | R 250 |
| **Setup Amortised** | R 83 | R 83 | R 83 | R 166 | R 166 |
| **Internet Premium** | R 200 | R 300 | R 500 | R 750 | R 1,000 |
| **24/7 Support** | R 150 | R 175 | R 200 | R 250 | R 300 |
| **Router/Equipment** | R 125 | R 175 | R 200 | R 250 | R 354 |
| **Total Cost** | R 1,132 | R 1,432 | R 1,832 | R 2,926 | R 3,493 |
| **Retail Price** | R 1,999 | R 2,999 | R 4,499 | R 5,999 | R 7,999 |
| **Gross Margin** | R 867 | R 1,567 | R 2,667 | R 3,073 | R 4,506 |
| **Margin %** | **43.4%** | **52.3%** | **59.3%** | **51.2%** | **56.3%** |

*Note: Business 300/400 require multiple RN installations, hence higher setup costs

### 2.3 Value-Added Services

**Enterprise Add-Ons:**
| Service | Monthly Fee | Margin | Description |
|---------|-------------|--------|-------------|
| **Managed SD-WAN** | R 1,499 | 60% | Multi-site connectivity |
| **DDoS Protection** | R 999 | 70% | Advanced threat mitigation |
| **SLA Premium** | R 799 | 85% | 99.9% uptime guarantee |
| **Dedicated Support** | R 1,999 | 75% | Named account manager |
| **Backup Line** | R 999 | 40% | Secondary 50 Mbps line |
| **Cloud Direct** | R 1,299 | 65% | Azure/AWS express route |

---

## 3. MEETING MTN REQUIREMENTS

### 3.1 Minimum Spend Commitment Strategy

**Quarterly MSC Achievement Plan:**
| Quarter | MSC Target | RNs Needed | Customers | Revenue Required |
|---------|------------|------------|-----------|------------------|
| Q1 | Actual | 10 | 10 | R 29,990 |
| Q2 | R 14,970 | 20 | 15 | R 44,985 |
| Q3 | R 29,940 | 30 | 25 | R 74,975 |
| Q4 | R 49,900 | 40 | 40 | R 119,960 |
| Q5 | R 74,850 | 50 | 60 | R 179,940 |
| Q6 | R 104,790 | 60 | 85 | R 254,915 |
| Q7 | R 139,720 | 70 | 115 | R 344,885 |
| Q8 | R 179,640 | 80 | 150 | R 449,850 |

### 3.2 Backhaul Scaling Plan

**Progressive Capacity Management:**
| Customers | Bandwidth Need | Backhaul Size | Monthly Cost | Per Customer |
|-----------|---------------|---------------|--------------|--------------|
| 50 | 500 Mbps | 600 Mbps | R 7,280 | R 145.60 |
| 100 | 1 Gbps | 1 Gbps | R 12,425 | R 124.25 |
| 200 | 2 Gbps | 2 Gbps | R 24,850 | R 124.25 |
| 400 | 4 Gbps | 4 Gbps | R 49,700 | R 124.25 |
| 600 | 6 Gbps | 6 Gbps | R 74,550 | R 124.25 |

---

## 4. INSTALLATION & EQUIPMENT

### 4.1 Professional Installation Strategy

**Installation Packages:**
| Type | Our Price | MTN Cost | Our Cost | Margin |
|------|-----------|----------|----------|--------|
| Standard Single | R 2,500 | R 2,000 | R 2,300 | R 200 |
| Dual RN (300/400) | R 3,500 | R 4,000 | R 4,500 | -R 1,000 |
| Complex Site | R 4,500 | R 2,000+ | R 3,000 | R 1,500 |

### 4.2 Business-Grade Equipment

**Router Specifications by Package:**
| Package | Router Model | Features | Cost |
|---------|-------------|----------|------|
| Business 50 | Mikrotik CCR1009 | 8-core, firewall | R 3,000 |
| Business 100 | Mikrotik CCR1036 | 36-core, QoS | R 6,000 |
| Business 200 | Fortinet 60F | UTM, HA ready | R 8,500 |
| Business 300 | Fortinet 80F | Dual WAN, UTM | R 15,000 |
| Business 400 | Fortinet 100F | SD-WAN, full UTM | R 25,000 |

---

## 5. FINANCIAL PROJECTIONS (REALISTIC)

### 5.1 Break-Even Analysis

**Monthly Fixed Costs:** R 95,000
- NNI 10 Gbps: R 12,500
- Initial Backhaul 1 Gbps: R 12,425
- 24/7 Support Team: R 40,000
- Operations/NOC: R 20,000
- Internet Transit: R 10,075

**Break-even Scenarios:**
| Scenario | Avg Revenue | Avg Margin | Required Subs |
|----------|-------------|------------|----------------|
| Conservative | R 2,499 | R 1,217 | 78 |
| Realistic | R 3,499 | R 1,917 | 50 |
| Optimistic | R 4,499 | R 2,667 | 36 |

### 5.2 24-Month Projection (Meeting MSC)

| Quarter | Customers | Revenue/Month | MTN Costs | Other Costs | Profit/Month |
|---------|-----------|---------------|-----------|-------------|--------------|
| Q1 | 10 | R 29,990 | R 18,425 | R 95,000 | -R 83,435 |
| Q2 | 15 | R 44,985 | R 23,210 | R 95,000 | -R 73,225 |
| Q3 | 25 | R 74,975 | R 33,580 | R 95,000 | -R 53,605 |
| Q4 | 40 | R 119,960 | R 49,020 | R 95,000 | -R 24,060 |
| Q5 | 60 | R 179,940 | R 69,530 | R 107,425 | R 2,985 |
| Q6 | 85 | R 254,915 | R 95,110 | R 107,425 | R 52,380 |
| Q7 | 115 | R 344,885 | R 125,760 | R 119,850 | R 99,275 |
| Q8 | 150 | R 449,850 | R 161,480 | R 119,850 | R 168,520 |

**Break-even:** Month 13 (Q5)
**Profit by Month 24:** R 168,520/month

---

## 6. COMPETITIVE ANALYSIS

### 6.1 Market Reality Check

| Provider | 50 Mbps | 100 Mbps | 200 Mbps | 300+ Mbps | SLA |
|----------|---------|----------|----------|-----------|-----|
| **Telkom Business Fibre** | R 2,899 | R 4,299 | R 6,999 | R 9,999+ | 99.5% |
| **Vodacom Business** | R 2,799 | R 4,199 | R 7,199 | — | 99.0% |
| **MTN Business 5G** | R 1,999 | R 2,999 | R 4,999 | — | Best effort |
| **SkyFibre Business** | **R 1,999** | **R 2,999** | **R 4,499** | **R 5,999** | **99.5%** |

### 6.2 Competitive Advantages

1. **No Fibre Dependency:** Deploy where fibre can't reach
2. **Speed Flexibility:** Bundle lines for higher speeds
3. **Quick Deployment:** 48-72 hours vs weeks for fibre
4. **True Business SLA:** Not best-effort like 5G
5. **Dedicated Support:** 24/7 NOC with real SLAs

---

## 7. RISK ASSESSMENT

### 7.1 MTN Dependency Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| MSC Penalties | High | Medium | Aggressive sales focus |
| RN Availability | Medium | Low | Maintain buffer stock |
| Price Increases | High | Medium | Long-term contracts |
| Network Issues | High | Low | SLA penalties to MTN |

### 7.2 Market Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Limited speeds | Customer loss | Bundle for higher speeds |
| Fibre expansion | Market shrink | Focus on underserved areas |
| 5G competition | Price pressure | Emphasise reliability |

---

## 8. IMPLEMENTATION ROADMAP

### 8.1 Phase 1: Foundation (Months 1-3)

**Month 1:**
- [ ] Sign MTN agreement with 24-month commitment
- [ ] Pay Q1 NRC (R35,000 for 40 RNs)
- [ ] Set up 10 Gbps NNI port
- [ ] Hire 24/7 support team

**Month 2-3:**
- [ ] Install first 10 business customers
- [ ] Configure QoS and traffic management
- [ ] Establish NOC procedures
- [ ] Meet Q1 actual spend

### 8.2 Phase 2: Growth (Months 4-12)

- [ ] Scale to 40 customers (Q4)
- [ ] Implement bonded line configurations
- [ ] Launch value-added services
- [ ] Expand coverage areas

### 8.3 Phase 3: Maturity (Months 13-24)

- [ ] Reach 150 customers
- [ ] Achieve profitability
- [ ] Consider second NNI port
- [ ] Plan national expansion

---

## 9. OPERATIONAL EXCELLENCE

### 9.1 24/7 Network Operations Center

**NOC Capabilities:**
- Real-time monitoring all RNs
- Proactive issue detection
- Automated failover management
- Performance optimisation
- SLA tracking and reporting

**Staffing Model:**
| Shift | Staff | Cost/Month | Coverage |
|-------|-------|------------|----------|
| Day (08:00-16:00) | 2 | R 30,000 | Peak business |
| Evening (16:00-00:00) | 1 | R 18,000 | Extended hours |
| Night (00:00-08:00) | 1 | R 12,000 | Emergency only |
| **Total** | **4** | **R 60,000** | **24/7** |

### 9.2 Service Level Management

**SLA Penalties (Customer Credits):**
| Uptime Achievement | Credit |
|-------------------|--------|
| 99.5% - 99.9% | 0% |
| 99.0% - 99.4% | 5% |
| 98.5% - 98.9% | 10% |
| 98.0% - 98.4% | 25% |
| <98.0% | 50% |

---

## 10. STRATEGIC RECOMMENDATIONS

### 10.1 Critical Success Factors

1. **MSC Management**
   - Aggressive Q1-Q4 customer acquisition
   - Consider bundled deals to boost revenue
   - Track weekly against targets

2. **Margin Protection**
   - Focus on 100 Mbps+ packages
   - Push value-added services
   - Control support costs

3. **Service Quality**
   - Maintain <1:5 contention
   - Proactive capacity management
   - Strong SLA compliance

### 10.2 Growth Strategy

**Year 1:** Foundation (150 customers)
- Meet all MSC commitments
- Achieve break-even by Q5
- Build reputation for reliability

**Year 2:** Expansion (400 customers)
- R 1.2M monthly revenue
- 35% average margins
- Geographic expansion

**Year 3:** Dominance (800 customers)
- Market leader in FWA business
- R 2.4M monthly revenue
- Consider infrastructure ownership

---

## 11. CONCLUSION

### 11.1 Investment Thesis

SkyFibre Business™ with correct MTN pricing presents:

- **Viable Business Model:** 25-56% margins achievable
- **Clear Market Need:** Business FWA underserved
- **Manageable Risk:** With proper MSC planning
- **Growth Potential:** 150 customers = profitability
- **Competitive Position:** Price/performance leader

### 11.2 Financial Summary

**Investment Required:**
- Working capital: R 600,000
- MTN deposits: R 200,000
- Equipment float: R 200,000
- **Total: R 1,000,000**

**Expected Returns:**
- Break-even: Month 13
- Year 2 profit: R 2,022,240
- ROI: 202% by Year 2
- Risk: Medium

### 11.3 Go/No-Go Decision

**GO - WITH CONDITIONS** ✅

**Proceed If:**
- ✅ Can commit R 1M capital
- ✅ Confident in 150 customers/24 months
- ✅ Accept MSC commitment risk
- ✅ Have strong sales team
- ✅ Can deliver 24/7 support

**Success Metrics:**
- 10 customers by Month 3
- 40 customers by Month 12
- 150 customers by Month 24
- MSC compliance 100%
- Margin >30% average

---

## APPENDICES

### Appendix A: MSC Compliance Tracker

**Quarterly Requirements:**
| Quarter | Cumulative RNs | New RNs | MSC | Cost/RN |
|---------|---------------|---------|------|---------|
| Q1 | 10 | 10 | Actual | R 875 |
| Q2 | 20 | 10 | R 14,970 | R 1,497 |
| Q3 | 30 | 10 | R 29,940 | R 2,994 |
| Q4 | 40 | 10 | R 49,900 | R 4,990 |
| Q5 | 50 | 10 | R 74,850 | R 7,485 |
| Q6 | 60 | 10 | R 104,790 | R 10,479 |
| Q7 | 70 | 10 | R 139,720 | R 13,972 |
| Q8 | 80 | 10 | R 179,640 | R 17,964 |

### Appendix B: Bonded Line Configuration

**Creating Higher Speeds:**
| Target Speed | Configuration | MTN Cost | Complexity |
|--------------|---------------|----------|------------|
| 300 Mbps | 100 + 200 | R 1,298 | Medium |
| 400 Mbps | 2 x 200 | R 1,398 | Medium |
| 500 Mbps | 100 + 2x200 | R 1,997 | High |
| 600 Mbps | 3 x 200 | R 2,097 | High |

### Appendix C: Coverage Priority Areas

**High-Value Business Zones:**
| Area | Businesses | Fibre Status | Opportunity |
|------|------------|--------------|-------------|
| Midrand (Waterfall) | 500+ | Limited | High |
| Centurion (Highveld) | 400+ | Expensive | High |
| Sandton (Overflow) | 600+ | Congested | Medium |
| Durban (Umhlanga) | 350+ | Partial | High |
| Cape Town (Century City) | 450+ | Expensive | Medium |

---

**Document Classification:** CONFIDENTIAL - INTERNAL USE ONLY
**Distribution:** Executive Team, Operations, Finance, Sales
**Review Cycle:** Weekly MSC tracking, Monthly P&L review

**Contact:** products@circletel.co.za | enterprise@skyfibre.co.za

*End of Document - Version 2.0*
*Realistic business FWA with actual MTN costs*
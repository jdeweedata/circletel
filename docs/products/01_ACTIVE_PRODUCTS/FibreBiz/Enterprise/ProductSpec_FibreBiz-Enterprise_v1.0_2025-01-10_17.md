# FibreBiz Enterprise™ Complete Product Specification Document
## Version 1.0 - SME-Optimised Fibre Solution
## Date: 10 January 2025 17:45 SAST
## Status: Final - Implementation Ready

---

**Document Control:**
- **Version:** 2.0
- **Author:** CircleTel Product Management
- **Supersedes:** v1.0 (10 January 2025)
- **Classification:** Commercial In-Confidence

**Version History:**
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 10/01/2025 17:45 | Initial FibreBiz Enterprise product specification created |

---

## EXECUTIVE SUMMARY

### Business Overview
FibreBiz Enterprise™ is a premium business fibre ISP service specifically designed for South African SMEs. This solution leverages wholesale fibre networks, content caching, and intelligent traffic management to achieve sustainable 25-35% margins while maintaining competitive SME pricing.

### Key Financial Metrics (Optimised Model)
- **Initial Investment per Customer:** R 2,500 - R 4,500
- **Break-even Subscribers:** 125 (reduced from 200)
- **Target Margin:** 25% - 35% (all packages profitable)
- **Internet Cost Optimisation:** 45% through intelligent routing
- **Local Content Caching:** 40% of traffic served locally
- **Contention Ratio:** 1:10 for business traffic

### Critical Success Factors
- **Business-Grade SLAs:** 99.9% uptime guarantee with penalties
- **Local Support Excellence:** 24/7 SA-based technical support
- **Flexible Scalability:** Seamless upgrades as business grows
- **Competitive Positioning:** 20-30% below enterprise pricing

---

## 1. PRODUCT OVERVIEW

### 1.1 Service Components

**Core Service Elements:**
1. **Connectivity:** Premium wholesale fibre access (Openserve/Vumatel/Octotel)
2. **Internet Architecture:** Business-optimised routing with QoS
3. **Router:** Enterprise-grade managed CPE (Fortinet/Mikrotik)
4. **Installation:** Professional setup with network optimisation
5. **Support:** 24/7 business support with 4-hour SLA

### 1.2 Business Internet Architecture

**Traffic Distribution Model:**
```
Total Business Traffic (100%)
├── Local Content & Cache (40%)
│   ├── Microsoft 365 Cache (15%)
│   ├── Google Workspace (10%)
│   ├── Cloud Services (10%)
│   └── Local Banking/Gov (5%)
├── Local Peering (25%)
│   ├── NAPAfrica IX (15%)
│   ├── JINX Business (10%)
└── Premium Transit (35%)
    ├── Tier 1 Transit (25%)
    └── Cloud Direct Connect (10%)
```

### 1.3 Network Capacity Planning

**Optimised Capacity Model (200 business customers):**
| Traffic Type | Volume | Solution | Monthly Cost |
|-------------|--------|----------|--------------|
| Local Content | 40% | Cache servers | R 5,000 |
| Local Peering | 25% | IX Connections | R 12,000 |
| Premium Transit | 35% | Business Grade | R 28,000 |
| **Total Internet Cost** | **100%** | **Hybrid** | **R 45,000** |
| **Per Customer** | — | — | **R 225** |

### 1.4 Business Fair Usage Policy

**Business Data Allowances:**
| Package | Business Hours | After Hours | Total | Priority |
|---------|---------------|-------------|-------|----------|
| Starter | Unlimited* | Unlimited* | Unlimited* | Standard |
| Professional | Unlimited* | Unlimited* | Unlimited* | Enhanced |
| Premium | Unlimited* | Unlimited* | Unlimited* | Priority |
| Enterprise | Unlimited* | Unlimited* | Unlimited* | Dedicated |

*Subject to Acceptable Use Policy - no residential streaming/torrenting

---

## 2. PRICING STRUCTURE & MARGIN ANALYSIS

### 2.1 Optimised Package Pricing

| Package | Starter | Professional | Premium | Enterprise |
|---------|---------|--------------|---------|------------|
| **Speed** | 50/50 Mbps | 100/100 Mbps | 200/200 Mbps | 500/500 Mbps |
| **24-Month Contract** | **R 1,999** | **R 3,499** | **R 5,999** | **R 9,999** |
| **12-Month Contract** | R 2,199 | R 3,799 | R 6,499 | R 10,999 |
| **Month-to-Month** | R 2,499 | R 4,299 | R 7,299 | R 12,499 |
| **Router Rental** | Included | Included | Included | Included |
| **Installation** | R 1,500 | R 1,500 | FREE | FREE |
| **Static IPs** | 1 included | 2 included | 4 included | 8 included |

### 2.2 Cost Structure Analysis (per subscriber/month)

#### After Installation Recovery (Month 7+)
| Cost Component | Starter | Professional | Premium | Enterprise |
|----------------|---------|--------------|---------|------------|
| **Wholesale Fibre** | R 850 | R 1,250 | R 1,850 | R 3,200 |
| **Internet Transit** | R 112 | R 225 | R 450 | R 1,125 |
| **Router Amortised** | R 125 | R 175 | R 200 | R 250 |
| **Support & NOC** | R 150 | R 200 | R 300 | R 500 |
| **Peering & IX** | R 60 | R 60 | R 60 | R 60 |
| **Total Cost** | R 1,297 | R 1,910 | R 2,860 | R 5,135 |
| **Retail Price** | R 1,999 | R 3,499 | R 5,999 | R 9,999 |
| **Gross Margin** | R 702 | R 1,589 | R 3,139 | R 4,864 |
| **Margin %** | **35.1%** | **45.4%** | **52.3%** | **48.6%** |

### 2.3 Revenue Enhancement Options

**Business Add-Ons (Optional):**
| Service | Monthly Fee | Margin | Description |
|---------|-------------|--------|-------------|
| **Cloud Backup** | R 299 | 60% | 100GB automated backup |
| **Advanced Security** | R 499 | 70% | IPS, anti-malware, reporting |
| **Failover LTE** | R 799 | 40% | Automatic 4G/5G backup |
| **SD-WAN** | R 999 | 65% | Multi-site connectivity |
| **Managed WiFi** | R 399 | 75% | Guest networks, analytics |
| **Voice Bundle** | R 599 | 80% | VoIP with 1000 minutes |

---

## 3. BUSINESS CONNECTIVITY IMPLEMENTATION

### 3.1 Wholesale Provider Strategy

**Fibre Network Coverage:**
| Provider | Coverage | Speed Tiers | Business SLA | Monthly Cost |
|----------|----------|-------------|--------------|--------------|
| **Openserve** | 70% metros | 50-1000 Mbps | Yes | R 850-6,400 |
| **Vumatel** | 60% metros | 50-1000 Mbps | Limited | R 750-5,500 |
| **Octotel** | Cape Town | 50-1000 Mbps | Yes | R 800-5,800 |
| **MetroFibre** | Johannesburg | 100-1000 Mbps | Yes | R 950-6,200 |

### 3.2 Business Internet Architecture

**Enterprise Routing Configuration:**
```
Business Customer Traffic
├── Critical Business Apps (30%)
│   ├── Microsoft 365: Direct peering
│   ├── Google Workspace: Cache
│   ├── Zoom/Teams: Priority QoS
│   └── Banking: Secure route
├── General Business (40%)
│   ├── Web browsing: Standard
│   ├── Email: Enhanced priority
│   └── Cloud storage: Optimised
└── Background Traffic (30%)
    ├── Updates: Off-peak scheduled
    └── Backups: Rate limited
```

### 3.3 Quality of Service (Business-Optimised)

**Business Traffic Priority Matrix:**
| Priority | Traffic Type | Guarantee | Latency | Example |
|----------|-------------|-----------|---------|---------|
| 1 | Voice/Video | 30% min | <20ms | Teams, Zoom |
| 2 | Business Critical | 25% min | <30ms | ERP, CRM |
| 3 | Interactive | 20% min | <50ms | Email, web |
| 4 | Standard | Best effort | <100ms | File transfer |
| 5 | Background | Limited | Any | Updates |

---

## 4. ROUTER & INSTALLATION STRATEGY

### 4.1 Business Router Specifications

**Managed CPE Options:**
| Package | Router Model | Features | Value |
|---------|-------------|----------|-------|
| Starter | Mikrotik hEX S | Gigabit, firewall, VPN | R 1,500 |
| Professional | Fortinet 40F | UTM, 10 VPN users | R 4,200 |
| Premium | Fortinet 60F | UTM, 30 VPN, HA ready | R 8,500 |
| Enterprise | Fortinet 80F | UTM, 100 VPN, HA | R 15,000 |

### 4.2 Professional Installation Service

**Business Installation Package:** R 1,500 - R 3,500
- Site survey and network assessment
- Professional mounting and cabling
- Router configuration and optimisation
- WiFi coverage planning
- Network security hardening
- Staff training session
- Documentation package

---

## 5. FINANCIAL PROJECTIONS

### 5.1 Break-Even Analysis

**Monthly Fixed Costs:** R 85,000
- Internet & Peering: R 45,000
- Support Staff (3 FTE): R 30,000
- Infrastructure: R 10,000

**Break-even Points:**
| Scenario | Avg Revenue | Avg Margin | Required Subs |
|----------|-------------|------------|----------------|
| Conservative | R 3,124 | R 1,093 | 78 |
| Realistic | R 4,374 | R 1,968 | 43 |
| Optimistic | R 5,249 | R 2,624 | 32 |

### 5.2 12-Month Projection (Realistic Scenario)

| Month | Subs | Revenue | Total Costs | Net Profit | Cumulative |
|-------|------|---------|-------------|------------|------------|
| 1 | 10 | R 43,740 | R 97,190 | -R 53,450 | -R 53,450 |
| 2 | 25 | R 109,350 | R 114,225 | -R 4,875 | -R 58,325 |
| 3 | 45 | R 196,830 | R 136,395 | R 60,435 | -R 2,110 |
| 4 | 70 | R 306,180 | R 163,700 | R 142,480 | R 140,370 |
| 5 | 100 | R 437,400 | R 196,100 | R 241,300 | R 381,670 |
| 6 | 135 | R 590,490 | R 233,635 | R 356,855 | R 738,525 |
| 7 | 175 | R 765,450 | R 276,275 | R 489,175 | R 1,227,700 |
| 8 | 220 | R 962,280 | R 324,020 | R 638,260 | R 1,865,960 |
| 9 | 270 | R 1,180,980 | R 376,870 | R 804,110 | R 2,670,070 |
| 10 | 325 | R 1,421,550 | R 434,825 | R 986,725 | R 3,656,795 |
| 11 | 385 | R 1,683,990 | R 497,885 | R 1,186,105 | R 4,842,900 |
| 12 | 450 | R 1,968,300 | R 566,050 | R 1,402,250 | R 6,245,150 |

**Year 1 Profit:** R 6,245,150
**ROI:** 735% on initial investment

---

## 6. COMPETITIVE ANALYSIS

### 6.1 Market Positioning

| Provider | 50 Mbps | 100 Mbps | 200 Mbps | 500 Mbps | Our Advantage |
|----------|---------|----------|----------|----------|---------------|
| **Telkom Business** | R 2,899 | R 4,299 | R 6,999 | R 12,999 | 31% cheaper |
| **Vodacom Business** | R 2,799 | R 4,199 | R 7,199 | R 13,499 | Better SLAs |
| **MTN Business** | R 2,699 | R 3,999 | R 6,799 | R 11,999 | Local support |
| **Afrihost Business** | R 2,199 | R 3,799 | R 6,299 | — | Better reliability |
| **FibreBiz Enterprise** | **R 1,999** | **R 3,499** | **R 5,999** | **R 9,999** | **Best value** |

### 6.2 Unique Selling Points

1. **True Business SLAs:** 99.9% uptime with financial penalties
2. **Local Support:** SA-based 24/7 technical team
3. **No Hidden Costs:** Router and static IPs included
4. **Flexible Contracts:** Easy upgrades/downgrades
5. **Business Focus:** No residential traffic congestion

---

## 7. RISK MITIGATION

### 7.1 Technical Risks

| Risk | Impact | Mitigation | Cost |
|------|--------|------------|------|
| Wholesale outage | Service disruption | Multi-provider strategy | R 10,000/month |
| DDoS attacks | Customer impact | CloudFlare protection | R 5,000/month |
| Router failures | Downtime | Hot-swap inventory | R 50,000 stock |

### 7.2 Commercial Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Price competition | Margin pressure | Value-added services focus |
| Customer churn | Revenue loss | Contract incentives, superior service |
| Wholesale price increases | Cost inflation | Volume agreements, price escalation clauses |

---

## 8. IMPLEMENTATION ROADMAP

### 8.1 Phase 1: Infrastructure (Weeks 1-2)

**Week 1:**
- [ ] Establish wholesale agreements with Openserve, Vumatel
- [ ] Configure business internet architecture
- [ ] Set up NAPAfrica and JINX peering
- [ ] Deploy Microsoft/Google cache servers

**Week 2:**
- [ ] Configure business QoS policies
- [ ] Implement monitoring systems
- [ ] Test failover mechanisms
- [ ] Prepare router configurations

### 8.2 Phase 2: Systems (Weeks 3-4)

- [ ] CRM integration for business customers
- [ ] Billing system configuration
- [ ] Support ticketing system
- [ ] Customer portal development

### 8.3 Phase 3: Launch (Month 2)

- [ ] Soft launch to 25 beta customers
- [ ] Sales team training
- [ ] Marketing campaign launch
- [ ] Partner channel activation

---

## 9. OPERATIONAL EXCELLENCE

### 9.1 Business Operations Center (BOC)

**24/7 Business Monitoring:**
- Real-time service availability
- Proactive issue detection
- Performance metrics tracking
- Customer experience monitoring

**Service Level Management:**
- 4-hour response time for critical issues
- 99.9% uptime guarantee
- Monthly service reports
- Quarterly business reviews

### 9.2 Customer Success Metrics

**Key Performance Indicators:**
| Metric | Target | Measurement |
|--------|--------|-------------|
| Service Uptime | >99.9% | Real-time |
| First Call Resolution | >80% | Daily |
| Customer Satisfaction | >90% | Monthly |
| Churn Rate | <2% | Monthly |
| Support Response | <4 hours | Per ticket |

---

## 10. STRATEGIC RECOMMENDATIONS

### 10.1 Immediate Actions

1. **Secure Wholesale Agreements**
   - Negotiate volume discounts
   - Lock in pricing for 24 months
   - Establish SLA terms

2. **Build Support Team**
   - Hire 3 senior technicians
   - Establish NOC procedures
   - Create knowledge base

3. **Market Preparation**
   - Develop sales materials
   - Train sales team
   - Launch beta program

### 10.2 Growth Strategy

**Phase 1 (Months 1-6):** Foundation
- 200 customers acquired
- 35% average margin achieved
- R 800k monthly revenue

**Phase 2 (Months 7-12):** Scale
- 450 customers total
- 40% average margin
- R 2M monthly revenue

**Phase 3 (Year 2):** Expansion
- 1,000 customers
- 45% average margin
- Geographic expansion
- R 5M monthly revenue

### 10.3 Success Metrics

**Financial Targets:**
- Break-even: Month 3 (45 customers)
- R 100k profit: Month 4
- R 1M monthly profit: Month 8
- R 10M annual profit: Year 2

---

## 11. CONCLUSION

### 11.1 Investment Thesis

FibreBiz Enterprise™ represents a **highly profitable** B2B ISP opportunity:

- **Superior Margins:** 35-52% across all packages
- **Competitive Pricing:** 20-31% below major competitors
- **Quick Break-even:** Month 3 with only 45 customers
- **Scalable Model:** Margins improve with volume
- **Protected Market:** Business customers are sticky

### 11.2 Competitive Advantages

1. **Cost Leadership:** Optimised wholesale and peering costs
2. **Service Excellence:** True business-grade support
3. **Technical Superiority:** Better SLAs than competitors
4. **Market Positioning:** SME-focused vs enterprise
5. **Growth Potential:** Untapped SME market

### 11.3 Go/No-Go Decision

**GO - STRONG RECOMMENDATION** ✅

**Achieved Objectives:**
- ✅ Exceptional margins (35-52%) on all packages
- ✅ Competitive pricing maintained
- ✅ Low customer acquisition (45 for break-even)
- ✅ Scalable business model
- ✅ Clear differentiation

**Investment Required:**
- Working capital: R 500,000
- Infrastructure: R 150,000
- **Total: R 650,000**

**Returns:**
- Year 1 profit: R 6,245,150
- ROI: 961%
- Payback period: 3 months

---

## APPENDICES

### Appendix A: SME Market Analysis

**Target Market Sizing:**
| Business Size | Companies | Penetration | Addressable |
|--------------|-----------|-------------|-------------|
| 10-25 employees | 150,000 | 15% | 22,500 |
| 26-50 employees | 75,000 | 25% | 18,750 |
| 51-100 employees | 35,000 | 35% | 12,250 |
| 101-200 employees | 15,000 | 45% | 6,750 |
| **Total TAM** | **275,000** | **22%** | **60,250** |

### Appendix B: Wholesale Cost Analysis

**Fibre Access Pricing Matrix:**
| Provider | 50 Mbps | 100 Mbps | 200 Mbps | 500 Mbps |
|----------|---------|----------|----------|----------|
| Openserve Business | R 850 | R 1,250 | R 1,850 | R 3,200 |
| Vumatel Business | R 750 | R 1,150 | R 1,750 | R 3,000 |
| Octotel Business | R 800 | R 1,200 | R 1,800 | R 3,100 |
| **Average** | **R 800** | **R 1,200** | **R 1,800** | **R 3,100** |

### Appendix C: Router Investment Analysis

**CPE Economics:**
| Model | Cost | Rental Income | Payback | 3-Year ROI |
|-------|------|---------------|---------|------------|
| Mikrotik hEX S | R 1,500 | Included | N/A | N/A |
| Fortinet 40F | R 4,200 | Included | N/A | N/A |
| Fortinet 60F | R 8,500 | Included | N/A | N/A |
| Fortinet 80F | R 15,000 | Included | N/A | N/A |

### Appendix D: Support Cost Model

**Support Team Structure:**
| Level | Staff | Cost/Month | Customers/Agent | Total Cost |
|-------|-------|------------|-----------------|------------|
| L1 Support | 2 | R 15,000 | 150 | R 30,000 |
| L2 Engineer | 1 | R 25,000 | 300 | R 25,000 |
| NOC Manager | 1 | R 35,000 | All | R 35,000 |
| **Total** | **4** | — | — | **R 90,000** |

### Appendix E: Service Level Agreements

**SLA Commitment Matrix:**
| Package | Uptime | Response | Resolution | Credits |
|---------|--------|----------|------------|---------|
| Starter | 99.5% | 8 hours | 24 hours | 5% |
| Professional | 99.7% | 4 hours | 12 hours | 10% |
| Premium | 99.9% | 2 hours | 8 hours | 25% |
| Enterprise | 99.95% | 1 hour | 4 hours | 50% |

---

**Document Classification:** CONFIDENTIAL - INTERNAL USE ONLY
**Distribution:** Executive Team, Operations, Finance, Sales
**Review Cycle:** Monthly KPI review, Quarterly strategy adjustment

**Contact:** products@circletel.co.za | enterprise@fibrebiz.co.za

*End of Document - Version 1.0*
*Empowering South African SMEs with enterprise-grade connectivity*
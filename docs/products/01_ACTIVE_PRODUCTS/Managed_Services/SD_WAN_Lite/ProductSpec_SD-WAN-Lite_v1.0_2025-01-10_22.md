# SD-WAN Lite™ Complete Product Specification Document
## Cost-Effective Dual-SIM SD-WAN for SMEs Without Fibre
## Version: 1.0 | Date: 10 January 2025 22:00 SAST
## Status: Initial Release - Market Ready

---

**Document Control:**
- **Version:** 1.0
- **Author:** CircleTel Product Management
- **Classification:** Commercial In-Confidence
- **Product Type:** Managed SD-WAN over LTE Service

**Version History:**
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 10/01/2025 22:00 | Initial SD-WAN Lite specification |

---

## EXECUTIVE SUMMARY

### Business Overview
SD-WAN Lite™ is CircleTel's revolutionary cost-effective software-defined WAN solution designed specifically for South African SMEs without fibre access. Leveraging dual-SIM LTE connectivity through the Adapt IT APN platform, SD-WAN Lite delivers enterprise-grade network performance, automatic failover, and application optimization at a fraction of traditional SD-WAN costs. Perfect for businesses in areas with poor or no fibre coverage.

### Key Value Proposition
- **No Fibre Required:** Full SD-WAN benefits using LTE only
- **Dual-SIM Redundancy:** Automatic failover between networks
- **50% Cost Savings:** vs traditional SD-WAN solutions
- **Rapid Deployment:** Operational in 48 hours
- **Application Optimization:** Prioritize business-critical apps

### Financial Metrics
- **Target Margin:** 45-55% on all packages
- **Break-even:** 150 customers
- **Market Size:** 200,000+ SMEs without fibre
- **Average Revenue:** R1,999-3,999/month
- **Setup Revenue:** R2,500 per installation

---

## 1. PRODUCT OVERVIEW

### 1.1 Core Service Components

**The SD-WAN Lite Stack:**
```
SD-WAN Lite Architecture
├── Connectivity Layer (Dual LTE)
│   ├── Primary SIM (MTN/Vodacom)
│   ├── Secondary SIM (Telkom/Rain)
│   ├── Automatic failover (<3 seconds)
│   └── Load balancing (active/active)
├── SD-WAN Features
│   ├── Application-aware routing
│   ├── QoS & traffic shaping
│   ├── Dynamic path selection
│   └── WAN optimization
├── Security Layer
│   ├── Stateful firewall
│   ├── VPN connectivity
│   ├── Content filtering
│   └── Threat protection
└── Management
    ├── Cloud orchestration
    ├── Zero-touch provisioning
    ├── Real-time monitoring
    └── Remote configuration
```

### 1.2 Target Market

**Primary Segments:**
| Segment | Profile | Pain Points | Size |
|---------|---------|-------------|------|
| **Retail Stores** | 5-20 employees, no fibre | Unreliable connectivity, POS downtime | 50,000 |
| **Branch Offices** | Remote locations | Poor ADSL, no fibre planned | 30,000 |
| **Construction Sites** | Temporary offices | Need immediate connectivity | 15,000 |
| **Agricultural** | Farms, packhouses | Rural, no infrastructure | 20,000 |
| **Healthcare** | Clinics, practices | Critical uptime needs | 10,000 |
| **Townships** | SME businesses | Limited infrastructure | 75,000 |

### 1.3 Unique Differentiators

**Why SD-WAN Lite Wins:**
1. **Fibre-Free:** No dependency on fixed infrastructure
2. **Dual-Network:** True redundancy with different carriers
3. **Affordable:** 50% cheaper than traditional SD-WAN
4. **Quick Deploy:** From order to operational in 48 hours
5. **Managed Service:** No IT expertise required

---

## 2. PRICING STRUCTURE

### 2.1 Package Tiers

| Package | Lite Starter | Lite Business | Lite Premium | Lite Enterprise |
|---------|-------------|---------------|--------------|-----------------|
| **Data Bundle** | 50GB | 100GB | 200GB | 500GB |
| **Speed** | Up to 50Mbps | Up to 100Mbps | Up to 150Mbps | Up to 200Mbps |
| **Monthly Price** | **R1,999** | **R2,999** | **R3,999** | **R5,999** |
| **Setup Fee** | R2,500 | R2,500 | R1,500 | FREE |
| **Contract** | 24 months | 24 months | 24 months | 24 months |
| **SIMs Included** | 2 | 2 | 2 | 2 |
| **Networks** | Any 2 | Any 2 | Premium pairs | Premium pairs |
| **Failover** | Automatic | Automatic | <3 seconds | <1 second |
| **Support** | Business hours | Extended | 24/7 | Dedicated |

### 2.2 Additional Services

**Value-Added Options:**
| Service | Monthly Fee | Description |
|---------|------------|-------------|
| **Extra Data** | R100/10GB | Additional data blocks |
| **Static IP** | R299 | Fixed public IP address |
| **Advanced Security** | R499 | IPS, anti-malware, DLP |
| **Cloud Backup** | R399 | 100GB backup storage |
| **Voice Bundle** | R599 | VoIP with 1000 minutes |
| **Multi-Site VPN** | R799 | Connect multiple branches |

### 2.3 Cost Structure Analysis

**Per Customer Economics (100GB package):**
| Component | Cost | Notes |
|-----------|------|-------|
| **Data (100GB @ R80/GB)** | R80.00 | 1-2TB tier pricing |
| **2x SIM Rental** | R3.00 | R1.50 x 2 |
| **Platform Share** | R18.00 | R1,800÷100 customers |
| **Firewall VDOM** | R25.00 | R2,500÷100 customers |
| **SD-WAN License** | R350.00 | Software licensing |
| **Router Amortized** | R125.00 | R3,000÷24 months |
| **Support & NOC** | R200.00 | Managed service |
| **Total Cost** | R801.00 | |
| **Retail Price** | R2,999.00 | Business package |
| **Gross Profit** | R2,198.00 | |
| **Margin %** | **73.3%** | Before data overage |

*Note: Margin reduces to 45-55% after accounting for data overages and support costs*

---

## 3. TECHNICAL ARCHITECTURE

### 3.1 Dual-SIM Configuration

**Network Redundancy Design:**
```
                Internet
                    ↑
        ┌──────────┴──────────┐
        │                      │
    MTN/Vodacom           Telkom/Rain
    (Primary SIM)        (Secondary SIM)
        │                      │
        └──────────┬──────────┘
                   │
            SD-WAN Router
            (Dual-SIM slots)
                   │
        ┌──────────┴──────────┐
        │                      │
      LAN                    WiFi
   (Wired devices)      (Wireless devices)
```

### 3.2 SD-WAN Features

**Application Intelligence:**
| Application Type | Priority | Bandwidth | Path Selection |
|-----------------|----------|-----------|----------------|
| **VoIP/Video** | Critical | Guaranteed 30% | Best latency |
| **Cloud Apps** | High | Guaranteed 25% | Best throughput |
| **Email/Web** | Normal | Best effort | Load balanced |
| **Updates** | Low | Limited 10% | Off-peak only |
| **Social Media** | Restricted | Limited 5% | When available |

### 3.3 Router Specifications

**Recommended Hardware:**
| Package | Router Model | Features | Cost |
|---------|-------------|----------|------|
| Lite Starter | TP-Link ER605 | Dual-WAN, VPN, basic SD-WAN | R1,800 |
| Lite Business | Peplink Balance 20X | True SD-WAN, SpeedFusion | R4,500 |
| Lite Premium | Peplink Balance Two | Advanced SD-WAN, HA ready | R8,000 |
| Lite Enterprise | Peplink Balance 310X | 5G ready, enterprise features | R15,000 |

---

## 4. DEPLOYMENT PROCESS

### 4.1 Zero-Touch Provisioning

**48-Hour Deployment Timeline:**

**Day 1: Order Processing**
- Customer signs up online/phone
- Credit check and verification
- SIM allocation from inventory
- Router configuration prepared

**Day 2: Delivery & Activation**
- Courier delivers pre-configured kit
- Customer plugs in router
- Automatic cloud provisioning
- Both SIMs auto-activate
- SD-WAN policies apply

**Day 2 (Evening): Operational**
- Full service activated
- Monitoring enabled
- Support available

### 4.2 Installation Kit Contents

**What Customers Receive:**
1. Pre-configured SD-WAN router
2. Two activated SIM cards (different networks)
3. Quick start guide (visual, 1-page)
4. Ethernet cable
5. Power adapter
6. WiFi credentials card
7. Support contact card

---

## 5. MANAGED SERVICE FEATURES

### 5.1 Proactive Management

**What We Manage:**
| Service | Description | Benefit |
|---------|-------------|---------|
| **Network Monitoring** | 24/7 NOC oversight | Prevent downtime |
| **Performance Optimization** | Continuous tuning | Best speeds |
| **Security Updates** | Automatic patches | Stay protected |
| **Configuration Changes** | Remote updates | No site visits |
| **Troubleshooting** | Proactive resolution | Minimal disruption |
| **Reporting** | Monthly insights | Usage visibility |

### 5.2 Service Level Agreements

**Performance Guarantees:**
| Metric | Starter | Business | Premium | Enterprise |
|--------|---------|----------|---------|------------|
| **Uptime** | 99% | 99.5% | 99.9% | 99.95% |
| **Failover Time** | <30 sec | <10 sec | <3 sec | <1 sec |
| **Support Response** | 8 hours | 4 hours | 1 hour | 15 min |
| **Resolution Time** | 48 hours | 24 hours | 8 hours | 4 hours |
| **Credits** | 5% | 10% | 25% | 50% |

---

## 6. COMPETITIVE ANALYSIS

### 6.1 Market Positioning

| Provider | Solution | Monthly Cost | Setup | Our Advantage |
|----------|----------|--------------|-------|---------------|
| **Telkom SD-WAN** | Fibre-based | R5,000-10,000 | R15,000 | No fibre needed, 60% cheaper |
| **Vodacom SD-WAN** | Single LTE | R3,500-6,000 | R10,000 | Dual-network redundancy |
| **Liquid Intelligent** | Enterprise | R8,000-15,000 | R25,000 | SME-focused, affordable |
| **DIY Dual-SIM** | Unmanaged | R1,500-2,500 | R5,000 | Fully managed, optimized |
| **SD-WAN Lite** | **Managed dual** | **R1,999-5,999** | **R2,500** | **Best value, fully managed** |

### 6.2 Unique Selling Points

**"Enterprise Performance, SME Price"**

1. **Only dual-carrier SD-WAN under R2,000**
2. **No fibre dependency** - works anywhere with LTE
3. **True SD-WAN** - not just failover
4. **Fully managed** - no IT skills needed
5. **48-hour deployment** - fastest in market

---

## 7. FINANCIAL PROJECTIONS

### 7.1 Revenue Model (Year 1)

| Month | Customers | MRR | Setup Fees | Total Revenue | Costs | Net Profit |
|-------|-----------|-----|------------|---------------|-------|------------|
| 1 | 10 | R29,990 | R25,000 | R54,990 | R35,000 | R19,990 |
| 3 | 50 | R149,950 | R125,000 | R274,950 | R125,000 | R149,950 |
| 6 | 150 | R449,850 | R150,000 | R599,850 | R300,000 | R299,850 |
| 9 | 300 | R899,700 | R200,000 | R1,099,700 | R550,000 | R549,700 |
| 12 | 500 | R1,499,500 | R250,000 | R1,749,500 | R850,000 | R899,500 |

**Year 1 Summary:**
- Total Revenue: R8,997,000
- Total Costs: R4,498,500
- Gross Profit: R4,498,500
- Margin: 50%

### 7.2 Cost Breakdown at Scale (500 customers)

| Cost Category | Monthly | Per Customer | % of Revenue |
|---------------|---------|--------------|--------------|
| **Data (50TB @ R70/GB)** | R350,000 | R700 | 35% |
| **SIM Rentals (1,000)** | R1,500 | R3 | 0.15% |
| **Platform Fees** | R9,000 | R18 | 0.9% |
| **SD-WAN Licenses** | R175,000 | R350 | 17.5% |
| **Support Team** | R100,000 | R200 | 10% |
| **Infrastructure** | R50,000 | R100 | 5% |
| **Router Amortization** | R62,500 | R125 | 6.25% |
| **Total Costs** | R748,000 | R1,496 | 74.8% |

---

## 8. IMPLEMENTATION ROADMAP

### 8.1 Launch Strategy

**Phase 1: Pilot (Month 1)**
- [ ] 10 pilot customers
- [ ] Test dual-SIM failover
- [ ] Validate SD-WAN policies
- [ ] Refine support processes

**Phase 2: Soft Launch (Months 2-3)**
- [ ] 50 customers
- [ ] Focus on retail sector
- [ ] Gather testimonials
- [ ] Optimize operations

**Phase 3: Scale (Months 4-6)**
- [ ] 150 customers
- [ ] Multi-sector expansion
- [ ] Partner channel activation
- [ ] Marketing campaign

**Phase 4: Growth (Months 7-12)**
- [ ] 500 customers
- [ ] Geographic expansion
- [ ] Advanced features
- [ ] White-label opportunities

### 8.2 Technical Milestones

| Milestone | Timeline | Impact |
|-----------|----------|--------|
| Adapt IT integration | Week 1 | Platform ready |
| Dual-SIM testing | Week 2 | Redundancy validated |
| SD-WAN optimization | Month 1 | Performance tuned |
| Portal launch | Month 2 | Self-service enabled |
| API automation | Month 3 | Scaling capability |

---

## 9. MARKETING STRATEGY

### 9.1 Go-to-Market Approach

**Target Messaging:**
- **Primary:** "Your Business Doesn't Need Fibre to Get Fibre-Like Performance"
- **Supporting:** "Two Networks, Zero Downtime, Half the Price"

**Channel Strategy:**
1. **Direct Sales:** Focus on high-value segments
2. **Digital Marketing:** Google Ads for "no fibre solutions"
3. **Partnerships:** IT resellers, business consultants
4. **Referral Program:** R500 credit per successful referral

### 9.2 Positioning by Segment

| Segment | Pain Point | Our Solution | Message |
|---------|------------|--------------|---------|
| **Retail** | POS downtime | Always-on connectivity | "Never lose a sale" |
| **Healthcare** | Patient care disruption | 99.9% uptime | "Reliable as your service" |
| **Construction** | Temporary sites | Quick deployment | "Connected in 48 hours" |
| **Agriculture** | Rural isolation | Dual-network coverage | "Connectivity everywhere" |
| **Townships** | Infrastructure gaps | Affordable solution | "Enterprise quality, SME price" |

---

## 10. RISK MANAGEMENT

### 10.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Network congestion | Medium | High | Dual-carrier diversity |
| LTE coverage gaps | Low | High | Network selection tool |
| Router failure | Low | Medium | Hot-swap program |
| Data overage | High | Low | Real-time monitoring |

### 10.2 Commercial Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Price competition | High | Medium | Value-added services |
| 5G disruption | Medium | Low | 5G-ready routers |
| Customer churn | Medium | Medium | 24-month contracts |
| Support costs | Medium | Low | Self-service portal |

---

## 11. OPERATIONAL EXCELLENCE

### 11.1 Support Model

**Three-Tier Structure:**
| Level | Team | Responsibilities | Volume |
|-------|------|------------------|--------|
| **L1** | Service Desk | Basic queries, resets | 70% |
| **L2** | NOC Engineers | Technical issues | 25% |
| **L3** | SD-WAN Specialists | Complex problems | 5% |

### 11.2 Success Metrics

**Key Performance Indicators:**
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Network Uptime** | >99.5% | Real-time |
| **Failover Success** | >99.9% | Automated testing |
| **Customer Satisfaction** | >90% | Monthly NPS |
| **First Call Resolution** | >80% | Ticket system |
| **Churn Rate** | <3% | Monthly |

---

## 12. STRATEGIC RECOMMENDATIONS

### 12.1 Immediate Actions

1. **Secure Network Agreements**
   - MTN/Vodacom primary SIMs
   - Telkom/Rain secondary SIMs
   - Volume commitments for best rates

2. **Build Technical Capability**
   - Train SD-WAN specialists
   - Establish NOC procedures
   - Create knowledge base

3. **Launch Pilot Program**
   - 10 diverse customers
   - Different use cases
   - 30-day trial

### 12.2 Growth Strategy

**Year 1:** Foundation
- 500 customers
- R1.5M MRR
- Proven model

**Year 2:** Expansion
- 2,000 customers
- R6M MRR
- National coverage
- Advanced features (5G, SASE)

**Year 3:** Leadership
- 5,000 customers
- R15M MRR
- Market leader in LTE SD-WAN
- International expansion

---

## CONCLUSION

### Investment Thesis

SD-WAN Lite™ represents a **massive market opportunity**:

✅ **Underserved Market:** 200,000+ SMEs without fibre
✅ **Clear Value Proposition:** Only dual-carrier SD-WAN under R2,000
✅ **Strong Margins:** 45-55% with room for improvement
✅ **Quick Deployment:** 48 hours vs weeks for traditional
✅ **Scalable Model:** Leverages Adapt IT platform

### Financial Summary

**Investment Required:** R1,500,000
- Router inventory: R500,000
- Marketing: R400,000
- Team building: R400,000
- Working capital: R200,000

**Expected Returns:**
- Year 1 revenue: R9M
- Year 1 profit: R4.5M
- ROI: 300%
- Payback: 4 months

### Go/No-Go Decision

**GO - STRONG RECOMMENDATION** ✅

**Rationale:**
- Solves real problem for 200,000+ businesses
- Unique dual-SIM SD-WAN positioning
- Leverages existing Adapt IT relationship
- High margins with managed service model
- Fast time to market with proven technology

---

## APPENDICES

### Appendix A: Technical Specifications

**SD-WAN Capabilities:**
- Application-aware routing (Layer 7)
- Dynamic path selection
- Forward error correction
- WAN optimization (compression, deduplication)
- QoS with 8 traffic classes
- Sub-second failover
- Packet duplication for critical apps
- Cloud orchestration

### Appendix B: Network Coverage Map

**Dual-Network Coverage Strategy:**
| Primary Network | Secondary Network | Coverage |
|-----------------|------------------|----------|
| MTN | Telkom | 98% population |
| Vodacom | Rain | 95% population |
| MTN | Rain | 93% population |
| Vodacom | Telkom | 97% population |

### Appendix C: ROI Calculator

**Customer Savings Example:**
```
Current Solution (ADSL + Backup):
- ADSL line: R1,500/month
- LTE backup: R1,000/month
- Router: R200/month
- Downtime cost: R500/month
Total: R3,200/month

SD-WAN Lite Business:
- All-inclusive: R2,999/month
- Savings: R201/month (6%)
- Plus: Better performance, true redundancy
```

### Appendix D: Competition Analysis

**Feature Comparison:**
| Feature | SD-WAN Lite | Telkom | Vodacom | DIY |
|---------|------------|--------|---------|-----|
| Dual-carrier | ✅ | ❌ | ❌ | ✅ |
| Managed service | ✅ | ✅ | ✅ | ❌ |
| Under R3,000 | ✅ | ❌ | ❌ | ✅ |
| 48-hour deploy | ✅ | ❌ | ❌ | ❌ |
| True SD-WAN | ✅ | ✅ | ✅ | ❌ |
| No fibre needed | ✅ | ❌ | ✅ | ✅ |

---

**Document Classification:** Commercial In-Confidence
**Review Date:** Quarterly
**Next Review:** April 2025
**Product Owner:** products@circletel.co.za
**Technical Contact:** sdwan@circletel.co.za

*End of Document - Version 1.0*
*SD-WAN Lite™ - Enterprise Performance Without Fibre*
# SmartBranch LTE Backup Kit™ Complete Product Specification Document
## Plug-and-Play Failover Solution for Business Continuity
## Version: 1.0 | Date: 10 January 2025 23:00 SAST
## Status: Initial Release - Market Ready

---

**Document Control:**
- **Version:** 1.0
- **Author:** CircleTel Product Management
- **Classification:** Commercial In-Confidence
- **Product Type:** Managed LTE Backup Service

**Version History:**
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 10/01/2025 23:00 | Initial SmartBranch LTE Backup specification |

---

## EXECUTIVE SUMMARY

### Business Overview
SmartBranch LTE Backup Kit™ is CircleTel's intelligent failover solution designed to ensure business continuity for retail stores and field offices. Leveraging the Adapt IT APN platform's unique capability to maintain the same private address space as primary fibre connections, SmartBranch ensures IP phones, POS terminals, and critical applications continue operating seamlessly during outages. At just R299/month with plug-and-play deployment, it's the most affordable insurance policy against connectivity disasters.

### Key Value Proposition
- **Zero IP Disruption:** Same private address space as primary fibre
- **Instant Failover:** <30 seconds automatic switchover
- **Plug-and-Play:** Pre-configured, no technical expertise needed
- **Affordable Insurance:** R299/month protects against revenue loss
- **Perfect Bundle:** Complements all CircleTel fibre products

### Financial Metrics
- **Target Margin:** 55-65% on service, 40% on hardware
- **Break-even:** 200 customers
- **Market Size:** Every fibre customer (50,000+ potential)
- **Average Revenue:** R299/month + R150 overage
- **Hardware Revenue:** R2,999 once-off (40% margin)

---

## 1. PRODUCT OVERVIEW

### 1.1 Core Service Components

**The SmartBranch Solution:**
```
SmartBranch Architecture
├── Hardware Layer
│   ├── Pre-configured LTE router
│   ├── Auto-failover capability
│   ├── Battery backup (4 hours)
│   └── Industrial-grade design
├── Connectivity Layer
│   ├── Private APN (same as fibre)
│   ├── Static IP addressing
│   ├── Pooled data model
│   └── Multi-network SIM
├── Intelligence Layer
│   ├── Health monitoring
│   ├── Automatic switchover
│   ├── Priority routing
│   └── Session persistence
└── Management Layer
    ├── Cloud monitoring
    ├── Proactive alerts
    ├── Usage tracking
    └── Remote support
```

### 1.2 Target Market

**Primary Segments:**
| Segment | Profile | Critical Need | Opportunity |
|---------|---------|---------------|-------------|
| **Retail Stores** | POS dependent | Can't process sales during outage | 25,000 stores |
| **Bank Branches** | ATMs, tellers | Financial transactions must continue | 5,000 branches |
| **Medical Practices** | Patient records | Life-critical systems | 10,000 practices |
| **Restaurants** | Online orders | Delivery platforms need connectivity | 15,000 venues |
| **Call Centers** | VoIP systems | Phones must stay online | 2,000 centers |
| **Field Offices** | Remote locations | Single point of failure | 8,000 offices |

### 1.3 Unique Technical Advantage

**Same Private Address Space Innovation:**
```
Normal Failover (Competitors):
Fibre IP: 192.168.1.50 → LTE IP: 10.0.0.100
Result: ❌ Devices lose connection, need reconfiguration

SmartBranch Failover (CircleTel):
Fibre IP: 192.168.1.50 → LTE IP: 192.168.1.50
Result: ✅ Devices continue working, no disruption
```

This is possible through Adapt IT's private APN with integrated IP pool management, maintaining addressing consistency across both connections.

---

## 2. PRICING STRUCTURE

### 2.1 Service Packages

| Component | Standard Kit | Premium Kit | Enterprise Kit |
|-----------|-------------|-------------|----------------|
| **Monthly Service** | **R299** | **R499** | **R799** |
| **Data Included** | 10GB pooled | 25GB pooled | 50GB pooled |
| **Excess Data Rate** | R90/GB (<1TB) | R80/GB (1-2TB) | R70/GB (>3TB) |
| **Failover Speed** | <30 seconds | <10 seconds | <5 seconds |
| **Battery Backup** | 4 hours | 8 hours | 12 hours |
| **Support** | Business hours | Extended | 24/7 |
| **Contract** | 24 months | 24 months | 24 months |

### 2.2 Hardware Options

**Router Packages (Once-off):**
| Model | RRP | Our Price | Margin | Features |
|-------|-----|-----------|--------|----------|
| **Basic Kit** | R2,499 | R1,499 | 40% | LTE Cat 4, 150Mbps |
| **Standard Kit** | R4,999 | R2,999 | 40% | LTE Cat 6, 300Mbps, WiFi |
| **Premium Kit** | R7,999 | R4,799 | 40% | LTE Cat 12, 600Mbps, dual-SIM |
| **Enterprise Kit** | R12,999 | R7,799 | 40% | 5G ready, 2Gbps, HA |

### 2.3 Bundle Incentives

**When Bundled with CircleTel Fibre:**
| Fibre Package | Backup Discount | Effective Price | Total Saving |
|---------------|-----------------|-----------------|--------------|
| FibreBiz Pro | 20% off | R239/month | R60/month |
| FibreBiz Enterprise | 30% off | R209/month | R90/month |
| Any 100Mbps+ | 25% off | R224/month | R75/month |

### 2.4 Cost Structure Analysis

**Per Customer Economics (Standard Kit):**
| Component | Cost | Notes |
|-----------|------|-------|
| **Data (10GB @ R90/GB)** | R90.00 | <1TB tier |
| **SIM Rental** | R1.50 | Physical SIM |
| **Platform Share** | R9.00 | R1,800÷200 customers |
| **IP Pool Management** | R7.50 | R1,500÷200 customers |
| **Support & Monitoring** | R25.00 | Minimal (backup only) |
| **Total Monthly Cost** | R133.00 | |
| **Retail Price** | R299.00 | |
| **Gross Profit** | R166.00 | |
| **Margin %** | **55.5%** | Service only |

**Hardware Margins:**
- Cost: R1,800 (basic router with battery)
- Selling Price: R2,999
- Gross Profit: R1,199
- Margin: 40%

---

## 3. TECHNICAL ARCHITECTURE

### 3.1 Seamless Failover Design

**Network Architecture:**
```
                  Internet
                      │
        ┌────────────┴────────────┐
        │                          │
    Fibre Connection          LTE Backup
    (Primary - Active)      (Secondary - Standby)
    192.168.1.0/24          192.168.1.0/24
        │                          │
        └────────────┬────────────┘
                     │
            SmartBranch Router
            (Dual-WAN, Auto-failover)
                     │
        ┌────────────┴────────────┐
        │            │             │
    POS System   IP Phones   Workstations
    192.168.1.10  192.168.1.20  192.168.1.30-50
```

### 3.2 Private APN Configuration

**Adapt IT APN Settings:**
```
APN Name: circletel.business
IP Pool: Customer-specific (/24 subnet)
NAT: Disabled (true private addressing)
Firewall: VDOM per customer
Routing: Static routes to customer LAN
Security: IPSec tunnel (optional)
```

### 3.3 Failover Intelligence

**Smart Detection & Switching:**
| Check Type | Frequency | Threshold | Action |
|------------|-----------|-----------|--------|
| **Link State** | Continuous | Link down | Instant failover |
| **Ping Test** | Every 5 sec | 3 failures | Initiate failover |
| **DNS Resolution** | Every 10 sec | 2 failures | Initiate failover |
| **HTTP Check** | Every 30 sec | 1 failure | Alert + failover |
| **Bandwidth** | Real-time | <10% expected | Alert only |

**Failback Behavior:**
- Wait 5 minutes after primary restoration
- Verify stability with 100 successful pings
- Schedule failback during low-traffic period
- Maintain session persistence during switch

---

## 4. DEPLOYMENT PROCESS

### 4.1 Zero-Configuration Setup

**Customer Experience (10 minutes):**

**Step 1: Unbox (2 minutes)**
- Open SmartBranch kit
- Find router, cables, SIM card
- Locate quick start guide

**Step 2: Connect (3 minutes)**
- Plug LTE router into power
- Insert pre-activated SIM
- Connect WAN port to existing router/switch
- Power on device

**Step 3: Auto-Configure (5 minutes)**
- Router downloads configuration
- Establishes VPN to private APN
- Receives IP addressing
- Tests failover capability
- Green light = Ready

**No Technical Knowledge Required!**

### 4.2 Pre-Deployment Configuration

**What We Do Before Shipping:**
1. **Network Planning**
   - Obtain customer's IP scheme
   - Configure matching subnet
   - Set up routing rules
   - Create firewall policies

2. **Device Preparation**
   - Flash latest firmware
   - Load customer configuration
   - Test failover logic
   - Verify battery backup

3. **APN Setup**
   - Create customer VDOM
   - Assign IP pool
   - Configure static routes
   - Enable monitoring

---

## 5. USE CASES & SCENARIOS

### 5.1 Retail Store Example

**The Coffee Shop Crisis:**
```
Scenario: Saturday morning, fibre cut by construction
Without Backup:
- No card payments (lost R15,000 in sales)
- No online orders (lost R5,000 delivery sales)
- Customers leave for competitors
- Total loss: R20,000 + reputation damage

With SmartBranch:
- Automatic failover in 20 seconds
- Card payments continue
- Online orders keep flowing
- Customers don't notice
- Cost: R299 saved R20,000
```

**ROI: 67x in one incident**

### 5.2 Medical Practice Example

**Doctor's Office Continuity:**
```
Critical Systems Protected:
- Electronic Health Records (cloud-based)
- Appointment scheduling system
- Medical aid authorizations
- Prescription system
- VoIP phones

During Fibre Outage:
- All systems remain online
- Patients treated without delay
- No manual workarounds needed
- Compliance maintained
```

### 5.3 Bank Branch Example

**Financial Services Protection:**
| System | Impact Without Backup | With SmartBranch |
|--------|----------------------|------------------|
| ATMs | Out of service | Continues operating |
| Teller systems | Cannot serve customers | Normal service |
| Loan applications | Processing stops | Continues online |
| Security systems | Compromised | Fully functional |

---

## 6. COMPETITIVE ANALYSIS

### 6.1 Market Comparison

| Provider | Solution | Monthly Cost | Setup | IP Continuity | Our Advantage |
|----------|----------|--------------|-------|---------------|---------------|
| **Vodacom Backup** | Basic failover | R599 | R2,500 | ❌ New IPs | 50% cheaper, IP persistence |
| **MTN Redundancy** | LTE backup | R799 | R3,500 | ❌ Different subnet | 63% cheaper, same subnet |
| **Telkom Failover** | Dual connection | R1,299 | R5,000 | ❌ Separate network | 77% cheaper, integrated |
| **DIY Solution** | Manual switch | R400 | R1,500 | ❌ Manual config | Automatic, managed |
| **SmartBranch** | **Intelligent** | **R299** | **R2,999** | **✅ Same IPs** | **Only solution with IP continuity** |

### 6.2 Unique Selling Points

**"The Only Backup That Doesn't Break Anything"**

1. **IP Address Continuity** - Exclusive to CircleTel
2. **Under R300/month** - Most affordable managed solution
3. **Plug-and-Play** - No configuration required
4. **Pooled Data** - Unused data shared across sites
5. **Bundle Benefits** - Discounts with fibre packages

---

## 7. FINANCIAL PROJECTIONS

### 7.1 Revenue Model (Year 1)

| Month | Customers | MRR | Hardware Sales | Total Revenue | Costs | Net Profit |
|-------|-----------|-----|----------------|---------------|-------|------------|
| 1 | 50 | R14,950 | R149,950 | R164,900 | R75,000 | R89,900 |
| 3 | 200 | R59,800 | R299,900 | R359,700 | R150,000 | R209,700 |
| 6 | 500 | R149,500 | R449,850 | R599,350 | R250,000 | R349,350 |
| 9 | 1,000 | R299,000 | R599,800 | R898,800 | R400,000 | R498,800 |
| 12 | 2,000 | R598,000 | R899,700 | R1,497,700 | R650,000 | R847,700 |

**Year 1 Summary:**
- Service Revenue: R3,588,000
- Hardware Revenue: R3,598,500
- Total Revenue: R7,186,500
- Total Costs: R3,233,925
- Gross Profit: R3,952,575
- Margin: 55%

### 7.2 Attach Rate Projections

**Bundle Opportunity:**
| Fibre Product | Customers | Attach Rate | Backup Customers | Monthly Revenue |
|---------------|-----------|-------------|------------------|-----------------|
| FibreBiz Pro | 1,000 | 40% | 400 | R119,600 |
| FibreBiz Enterprise | 500 | 60% | 300 | R89,700 |
| FibreHomePlus Business | 2,000 | 25% | 500 | R149,500 |
| **Total** | **3,500** | **35%** | **1,200** | **R358,800** |

---

## 8. MARKETING STRATEGY

### 8.1 Positioning

**Primary Message:**
"Your Business Can't Afford Downtime. You Can Afford SmartBranch."

**Supporting Messages:**
- "R299 Protects Against R20,000 Losses"
- "The Only Backup That Keeps Your IPs"
- "Deployed in 10 Minutes, Protected Forever"
- "When Fibre Fails, SmartBranch Prevails"

### 8.2 Go-to-Market Strategy

**Phase 1: Existing Customers**
- Email campaign to all fibre customers
- Special launch offer: First month free
- Bundle discount for immediate sign-up
- Target: 500 customers in 3 months

**Phase 2: New Sales**
- Mandatory add-on for business fibre quotes
- Sales team incentive (R100 per attachment)
- Include in all proposals as standard
- Target: 50% attach rate on new sales

**Phase 3: Channel Partners**
- IT resellers bundle offering
- Referral commission structure
- White-label option for large partners
- Target: 200 customers via channel

### 8.3 Sales Enablement

**ROI Calculator:**
```
Average Business Downtime Cost:
- Lost sales: R5,000/hour
- Lost productivity: R2,000/hour
- Recovery costs: R3,000/incident
- Total per 4-hour outage: R40,000

SmartBranch Annual Cost: R3,588
ROI from preventing ONE outage: 1,115%
```

---

## 9. OPERATIONAL EXCELLENCE

### 9.1 Support Model

**Tiered Support Structure:**
| Scenario | Response | Resolution | Method |
|----------|----------|------------|--------|
| **Failover Event** | Automatic | Instant | System handles |
| **No Failover** | 15 minutes | 1 hour | Remote fix |
| **Hardware Issue** | 4 hours | Next day | Replacement |
| **Config Change** | 24 hours | 48 hours | Remote update |

### 9.2 Monitoring & Alerts

**Proactive Management:**
| Alert Type | Trigger | Customer Notification | Action |
|------------|---------|----------------------|--------|
| **Failover Activated** | LTE active | SMS + Email | Monitor |
| **High Usage** | >80% of bundle | Email warning | Upsell |
| **Primary Restored** | Fibre back | Email update | Schedule failback |
| **Low Battery** | <20% charge | SMS alert | Check power |
| **Device Offline** | No heartbeat | Call customer | Troubleshoot |

### 9.3 Success Metrics

**KPIs and Targets:**
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Failover Success Rate** | >99.9% | Automated testing |
| **Mean Switch Time** | <30 seconds | Monitoring system |
| **Customer Uptime** | >99.99% | Combined primary+backup |
| **Attach Rate** | >40% | CRM tracking |
| **Churn Rate** | <2% monthly | Billing system |

---

## 10. IMPLEMENTATION ROADMAP

### 10.1 Launch Timeline

**Week 1-2: Technical Setup**
- [ ] Configure Adapt IT private APN pools
- [ ] Set up IP pool management
- [ ] Create monitoring dashboards
- [ ] Test failover scenarios

**Week 3-4: Operations Ready**
- [ ] Train support team
- [ ] Create knowledge base
- [ ] Set up fulfillment process
- [ ] Prepare inventory (100 units)

**Month 2: Soft Launch**
- [ ] 20 pilot customers
- [ ] Different business types
- [ ] Monitor performance
- [ ] Gather feedback

**Month 3: Full Launch**
- [ ] Marketing campaign
- [ ] Sales team training
- [ ] Partner enablement
- [ ] Scale operations

### 10.2 Scaling Plan

| Phase | Timeline | Target | Focus |
|-------|----------|--------|-------|
| **Pilot** | Month 1 | 20 customers | Testing & refinement |
| **Launch** | Month 2-3 | 200 customers | Existing base |
| **Growth** | Month 4-6 | 500 customers | New sales |
| **Scale** | Month 7-12 | 2,000 customers | Market penetration |
| **Expand** | Year 2 | 5,000 customers | Geographic expansion |

---

## 11. RISK MANAGEMENT

### 11.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| IP conflict | Low | High | Pre-deployment validation |
| Slow failover | Low | Medium | Multiple detection methods |
| LTE congestion | Medium | Medium | Multi-network SIM option |
| Battery failure | Low | Low | Proactive replacement program |

### 11.2 Commercial Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low attach rate | Medium | High | Bundle incentives |
| Price pressure | Medium | Medium | Focus on IP continuity USP |
| Data overage disputes | Low | Low | Clear notifications |
| Competitor response | High | Medium | First-mover advantage |

---

## 12. STRATEGIC RECOMMENDATIONS

### 12.1 Immediate Actions

1. **Secure IP Pool Allocation**
   - Reserve IP ranges with Adapt IT
   - Plan for 5,000 customers
   - Document allocation schema

2. **Inventory Investment**
   - Order 500 routers (volume discount)
   - Negotiate payment terms
   - Set up fulfillment center

3. **Launch Campaign**
   - Target high-value fibre customers
   - Create compelling case studies
   - Develop ROI calculator tool

### 12.2 Long-term Strategy

**Year 1: Establish**
- 2,000 customers
- R600k MRR
- Prove model

**Year 2: Expand**
- 5,000 customers
- R1.5M MRR
- Add 5G backup option
- White-label for enterprises

**Year 3: Dominate**
- 10,000 customers
- R3M MRR
- Market leader in backup
- International expansion

---

## CONCLUSION

### Investment Thesis

SmartBranch LTE Backup Kit™ represents a **compelling opportunity**:

✅ **Perfect Bundle:** Natural add-on to all fibre products
✅ **Unique Technology:** Only solution with IP continuity
✅ **High Margins:** 55% on service, 40% on hardware
✅ **Low Support:** Mostly automated operation
✅ **Massive Market:** Every business needs backup

### Financial Summary

**Investment Required:** R1,000,000
- Router inventory: R500,000
- Marketing: R200,000
- Platform setup: R100,000
- Working capital: R200,000

**Expected Returns:**
- Year 1 revenue: R7.2M
- Year 1 profit: R4.0M
- ROI: 400%
- Payback: 3 months

### Go/No-Go Decision

**GO - HIGHEST PRIORITY** ✅

**Rationale:**
- Solves critical business problem
- Unique technical advantage (IP continuity)
- Perfect complement to existing products
- High margins with low complexity
- Defensive play against competitors

---

## APPENDICES

### Appendix A: Technical Specifications

**Router Requirements:**
- Dual-WAN support (Ethernet + LTE)
- Automatic failover capability
- VLAN support
- QoS/Traffic shaping
- Remote management
- Battery backup included

**Recommended Models:**
- TP-Link ER605 + UPS
- DrayTek Vigor 2926L
- Peplink Balance 20X
- MikroTik LtAP LTE kit

### Appendix B: IP Continuity Explanation

**Technical Deep Dive:**
```
Traditional Backup (Competitor):
1. Primary: Fibre with public IP (NAT)
2. Backup: LTE with different public IP
3. Result: All sessions break, devices reconnect

SmartBranch (CircleTel):
1. Primary: Fibre with private subnet
2. Backup: LTE with SAME private subnet
3. Result: Sessions continue, transparent to devices

How It Works:
- Adapt IT APN maintains customer routing table
- Both connections terminate in same VDOM
- Static routes updated on failover
- Devices see no change in gateway/subnet
```

### Appendix C: ROI Examples

**Real Customer Scenarios:**
| Business Type | Monthly Loss Risk | SmartBranch Cost | ROI |
|---------------|------------------|------------------|-----|
| Restaurant | R30,000 (Saturday) | R299 | 10,033% |
| Medical Practice | R50,000 (vaccines) | R299 | 16,722% |
| Retail Store | R25,000 (month-end) | R299 | 8,361% |
| Bank Branch | R100,000 (reputation) | R299 | 33,445% |

### Appendix D: Bundle Pricing Matrix

**Discount Structure:**
| Primary Service | Monthly Value | Backup Discount | Bundle Price | Total Saving |
|-----------------|---------------|-----------------|--------------|--------------|
| 50 Mbps Fibre | R1,999 | 20% | R2,238 | R60 |
| 100 Mbps Fibre | R2,999 | 25% | R3,223 | R75 |
| 200 Mbps Fibre | R3,999 | 30% | R4,208 | R90 |
| 500 Mbps Fibre | R5,999 | 35% | R6,193 | R105 |

---

**Document Classification:** Commercial In-Confidence
**Review Date:** Monthly
**Next Review:** February 2025
**Product Owner:** products@circletel.co.za
**Technical Contact:** backup@circletel.co.za

*End of Document - Version 1.0*
*SmartBranch™ - Because Downtime Costs More Than Backup*
# Unjani Clinics Hybrid Connectivity Solution
## CircleTel Implementation with MTN Infrastructure & ThinkWiFi Platform
### Version 4.0 - September 2025

---

## Executive Summary

CircleTel presents a comprehensive connectivity solution for Unjani Clinics' 252 locations, incorporating MTN's Tarana G1 Fixed Wireless Broadband (FWB), 5G, and LTE infrastructure with ThinkWiFi's monetisation platform. This hybrid approach delivers premium connectivity while maintaining positive cash flow through the capped service fee model and advertising revenue sharing.

### Key Value Proposition
- **Fixed monthly service fee:** R450 ex VAT per clinic
- **Minimal capital investment:** R932,400 for hardware across 252 sites
- **Net positive revenue:** Through ThinkWiFi ad platform
- **Premium connectivity:** Tarana G1 for urban areas (50Mbps symmetrical)
- **Complete managed service:** 24/7 NOC support

### Strategic Benefits
- Professional healthcare connectivity at fixed cost
- Enable telemedicine with high-quality connections
- Generate additional revenue through advertising
- Bridge the digital divide with sustainable model

---

## 1. Solution Architecture

### 1.1 Hybrid Infrastructure Model with Tarana G1

Based on MTN's current packages and optimal technology deployment:

| Coverage Zone | Sites | Primary Technology | MTN Package | Speed | Wholesale Cost |
|---------------|-------|-------------------|-------------|-------|----------------|
| **Urban Tarana G1** | 50 | FWB Tarana | MTN Wholesale | 50Mbps | R499 |
| **5G Metro Areas** | 20 | 5G Fixed Wireless | 202501EBU2012 | 60Mbps | R649 |
| **Urban LTE** | 50 | LTE Fixed Wireless | 202503EBU2807 | 20Mbps | R599 |
| **Rural LTE** | 132 | LTE Fixed Wireless | 202503EBU2806 | 10Mbps | R399 |
| **Total Network** | 252 | Hybrid Tarana/5G/LTE | Mixed | 10-60Mbps | Avg R461 |

### 1.2 Network Topology Per Site

```
Internet → MTN Equipment → MikroTik hEX S → Reyee WiFi 6 AP → Patient Devices
           (Tarana RN/                          ↓
            5G CPE/                      ThinkWiFi Portal
            LTE Router)                         ↓
                                        Ad Monetisation Platform
```

### 1.3 Equipment Requirements Per Clinic

| Component | Model | Quantity | Unit Cost | Total |
|-----------|-------|----------|-----------|-------|
| **MTN Equipment** | Tarana RN/5G CPE/LTE Router | 1 | Included/Supplied | R0 |
| **MikroTik Router** | hEX S (RB760iGS) | 1 | R1,200 | R1,200 |
| **WiFi 6 AP** | Reyee RG-RAP2200(F) | 1 | R850 | R850 |
| **PoE Injector** | 802.3af/at | 1 | R350 | R350 |
| **Cabling** | CAT6 (50m average) | 1 | R300 | R300 |
| **Installation** | Professional setup | 1 | R1,000 | R1,000 |
| **Total Hardware Cost** | | | | **R3,700** |

---

## 2. MTN Wholesale Tarana G1 Implementation

### 2.1 Minimum Spend Commitment (MSC) Structure

For the 50 Tarana G1 sites, CircleTel must meet the following MSC requirements:

| Quarter | Period | NRC (Once-off) | Monthly MSC | Actual Monthly (50 sites) |
|---------|--------|----------------|-------------|---------------------------|
| Q1 | Months 1-3 | R8,750 | Actual spend | R24,950 |
| Q2 | Months 4-6 | R17,500 | R14,970 | R24,950 |
| Q3 | Months 7-9 | R26,250 | R29,940 | R29,940* |
| Q4 | Months 10-12 | R35,000 | R49,900 | R49,900* |
| Q5 | Months 13-15 | R43,750 | R74,850 | R74,850* |
| Q6 | Months 16-18 | R52,500 | R104,790 | R104,790* |
| Q7 | Months 19-21 | R61,250 | R139,720 | R139,720* |
| Q8 | Months 22-24 | R70,000 | R179,640 | R179,640* |

*MSC applies as it exceeds actual billing of R24,950 (50 sites × R499)

### 2.2 Tarana Infrastructure Costs

**Initial Setup (Once-off):**
```
Training (10 pax):           R10,000
1G NNI Port:                 R7,000
VPDN Setup:                  R999
Quarterly NRCs:              R315,000 (over 24 months)
Total Setup:                 R332,999
```

**Monthly Recurring:**
```
50 Tarana sites @ R499:     R24,950
1G NNI Port:                 R2,500
Total Monthly (Q1-2):        R27,450
Total Monthly (Q3-8):        As per MSC schedule
```

---

## 3. Package Selection Strategy

### 3.1 Immediate Deployment (150 Sites)

Based on coverage assessment and technology availability:

| Technology | Deal Code/Type | Sites | Wholesale Cost/Site | Total Monthly |
|------------|---------------|-------|-------------------|---------------|
| **Tarana G1 FWB** | MTN Wholesale | 30 | R499 | R14,970 |
| **5G 60Mbps** | 202501EBU2012 | 10 | R649 | R6,490 |
| **LTE 20Mbps** | 202503EBU2807 | 40 | R599 | R23,960 |
| **LTE 10Mbps** | 202503EBU2806 | 70 | R399 | R27,930 |
| **Total Phase 1** | | 150 | | **R73,350** |

### 3.2 Phase 2 Expansion (102 Sites)

| Technology | Sites | Wholesale Cost/Site | Total Monthly |
|------------|-------|-------------------|---------------|
| **Tarana G1 FWB** | 20 | R499 | R9,980 |
| **5G 60Mbps** | 10 | R649 | R6,490 |
| **LTE 20Mbps** | 10 | R599 | R5,990 |
| **LTE 10Mbps** | 62 | R399 | R24,738 |
| **Total Phase 2** | 102 | | **R47,198** |

### 3.3 Complete Network (252 Sites)

| Deployment Phase | Sites | Monthly Wholesale Cost | Client Fee (R450 × Sites) | Net Position |
|-----------------|-------|----------------------|---------------------------|--------------|
| **Phase 1** | 150 | R73,350 | R67,500 | -R5,850* |
| **Phase 2** | 102 | R47,198 | R45,900 | -R1,298* |
| **Total Network** | 252 | R120,548 | R113,400 | -R7,148* |

*Before ThinkWiFi revenue share

---

## 4. ThinkWiFi Revenue Share Model

### 4.1 Revenue Distribution Structure

As per the agreed model with Unjani paying R450 ex VAT per site:

**Two-Tier Revenue Distribution:**

**Tier 1 - Cost Recovery (Priority to CircleTel):**
- FWA/Tarana Sites: First R450 to CircleTel
- LTE/5G Sites: First R150 to CircleTel

**Tier 2 - Revenue Share:**
- All net revenue exceeding Recovery Amounts: 50% CircleTel / 50% ThinkWiFi
- Net Revenue = Gross Revenue - Sales Commissions - 15% Platform Fees

### 4.2 Revenue Projections by Site Type

**Conservative Model (R1,495 average ad revenue):**

| Site Type | Gross Ad Revenue | Platform Fees (15%) | Net Revenue | CircleTel Recovery | Remaining | CircleTel 50% | ThinkWiFi 50% | Total CircleTel |
|-----------|-----------------|---------------------|-------------|-------------------|-----------|---------------|---------------|-----------------|
| **Tarana G1** | R1,495 | R224 | R1,271 | R450 | R821 | R410.50 | R410.50 | **R860.50** |
| **5G Site** | R1,495 | R224 | R1,271 | R150 | R1,121 | R560.50 | R560.50 | **R710.50** |
| **LTE 20Mbps** | R1,495 | R224 | R1,271 | R150 | R1,121 | R560.50 | R560.50 | **R710.50** |
| **LTE 10Mbps** | R1,495 | R224 | R1,271 | R150 | R1,121 | R560.50 | R560.50 | **R710.50** |

**Barcelona Performance (R2,964 ad revenue):**

| Site Type | Gross Ad Revenue | Platform Fees (15%) | Net Revenue | CircleTel Recovery | Remaining | CircleTel 50% | ThinkWiFi 50% | Total CircleTel |
|-----------|-----------------|---------------------|-------------|-------------------|-----------|---------------|---------------|-----------------|
| **Tarana G1** | R2,964 | R445 | R2,519 | R450 | R2,069 | R1,034.50 | R1,034.50 | **R1,484.50** |
| **5G/LTE** | R2,964 | R445 | R2,519 | R150 | R2,369 | R1,184.50 | R1,184.50 | **R1,334.50** |

### 4.3 Payment Terms

- ThinkWiFi collects all advertising revenues
- **Premium Advertising Revenue:** Payment within 45 days from month-end
- **Automated/Programmatic Revenue:** Payment within 30 days from month-end
- Recovery Amounts guaranteed regardless of performance
- **First Month:** Extended payment cycle for setup
- **Blended Schedule:** Automated portion within 30 days, Premium within 45 days

---

## 5. Financial Analysis

### 5.1 Complete Network Economics (252 Sites)

**Revenue Streams:**
```
Service Fees (252 × R450):          R113,400/month
Conservative Ad Revenue:             R213,354/month (CircleTel share)
Total CircleTel Revenue:            R326,754/month
```

**Cost Structure:**
```
MTN Wholesale Costs:                R120,548/month
NOC Operations:                     R25,000/month
Field Support:                      R15,000/month
Total Operating Costs:              R160,548/month
```

**Net Position (Conservative):**
```
Total Revenue:                      R326,754/month
Total Costs:                       -R160,548/month
Net Profit:                        R166,206/month
Annual Profit:                     R1,994,472
```

**Net Position (Barcelona Performance):**
```
Service Fees:                       R113,400/month
Ad Revenue (CircleTel):             R357,084/month
Total Revenue:                      R470,484/month
Total Costs:                       -R160,548/month
Net Profit:                        R309,936/month
Annual Profit:                     R3,719,232
```

### 5.2 Clinic Benefits

**Conservative Scenario:**
- Clinic pays: R450/month (fixed)
- Clinic receives (from ThinkWiFi): R410-560/month
- Net benefit: R0-110/month plus connectivity

**Barcelona Performance:**
- Clinic pays: R450/month (fixed)
- Clinic receives: R1,034-1,184/month
- Net benefit: R584-734/month plus connectivity

---

## 6. Service Level Agreements

### 6.1 Performance Guarantees by Technology

| Metric | Tarana G1 | 5G | LTE |
|--------|-----------|-----|-----|
| **Uptime** | 99.5% | 99% | 99% |
| **Latency** | <5ms | 15-25ms | 20-30ms |
| **Symmetrical Speed** | Yes | No | No |
| **Weather Resilient** | Yes | Moderate | Moderate |
| **Jitter** | <2ms | <5ms | <10ms |

### 6.2 Support Structure

**Three-Tier Support Model:**

1. **Level 1 - NOC (24/7)**
   - Remote monitoring all sites
   - Automated alerts for Tarana RNs
   - Basic troubleshooting
   - Router management via static IPs

2. **Level 2 - Technical Team**
   - Tarana G1 optimisation
   - ThinkWiFi platform support
   - Performance tuning
   - Firmware management

3. **Level 3 - Field Support**
   - On-site within 48 hours
   - Hardware replacement
   - Tarana RN alignment
   - Training reinforcement

---

## 7. Implementation Timeline

### 7.1 Phase 1: Priority Sites with Tarana Focus (150 Clinics)

**Month 1 - Infrastructure Setup**
- MSC agreement with MTN
- Tarana coverage validation (30 sites)
- NNI port installation
- NOC preparation

**Month 2 - Pilot Deployment**
- 5 Tarana G1 sites
- 5 mixed technology sites
- ThinkWiFi integration testing
- Performance validation

**Month 3 - Mass Rollout**
- 25 Tarana sites
- 115 LTE/5G sites
- Regional installation teams
- Revenue generation begins

### 7.2 Phase 2: Network Completion (102 Clinics)

**Months 4-6**
- Additional 20 Tarana sites
- 82 LTE/5G sites
- Full network coverage
- Platform optimisation

### 7.3 Success Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| **Tarana Sites** | 50 operational | Network dashboard |
| **Average Uptime** | >99% | NOC monitoring |
| **Ad Revenue** | >R1,495/site | ThinkWiFi reports |
| **Clinic Satisfaction** | >90% | Surveys |
| **MSC Compliance** | 100% | Financial tracking |

---

## 8. Risk Mitigation

### 8.1 Technical Risks

| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| **Tarana coverage** | High | Pre-deployment surveys | CircleTel |
| **MSC shortfall** | High | Gradual rollout plan | Finance |
| **Equipment failure** | Medium | 5% spare pool | Operations |
| **Ad platform issues** | Low | Guaranteed minimums | Contract |

### 8.2 Commercial Risks

| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| **Low ad revenue** | Medium | R450 service fee covers base | Both |
| **MSC penalties** | High | Careful capacity planning | CircleTel |
| **Technology migration** | Low | Flexible deployment | Technical |

---

## 9. Competitive Advantages

### 9.1 Technology Comparison

| Feature | Tarana G1 | 5G | LTE | Fiber |
|---------|-----------|-----|-----|-------|
| **Speed** | 50Mbps symmetrical | 60Mbps down/10 up | 10-20Mbps | 50-1000Mbps |
| **Latency** | <5ms | 15-25ms | 20-30ms | <2ms |
| **Weather Impact** | Minimal | Moderate | Moderate | None |
| **Installation** | 3-5 days | 1-2 days | 1-2 days | 15-45 days |
| **Coverage** | Expanding | Limited | Excellent | Very limited |

### 9.2 Value Proposition

**For Unjani Clinics:**
- Fixed, predictable costs (R450/month)
- Premium connectivity in urban areas (Tarana)
- Revenue generation potential
- Complete management included

**For CircleTel:**
- Sustainable business model
- MSC commitment satisfied through scale
- Multiple revenue streams
- Long-term partnership potential

---

## 10. Next Steps

### 10.1 Immediate Actions (Week 1)

1. **Finalise Tarana coverage** for 50 target sites
2. **Sign MSC agreement** with MTN
3. **Submit Phase 1 order** (150 sites)
4. **Initiate NNI setup** for wholesale connection
5. **Procure MikroTik/Reyee** equipment

### 10.2 Week 2-4 Timeline

| Week | Activity | Deliverable |
|------|----------|-------------|
| 2 | Site surveys | Coverage confirmation |
| 2 | Equipment order | 150 sets procured |
| 3 | Pilot selection | 10 sites identified |
| 3 | Training completion | Team certified |
| 4 | Pilot installation | First sites live |

### 10.3 90-Day Targets

✓ 30 Tarana G1 sites operational
✓ 120 LTE/5G sites deployed
✓ ThinkWiFi platform fully integrated
✓ First revenue payments received
✓ MSC Quarter 2 requirements met

---

## Contact Information

### CircleTel Project Team
**Jeffrey De Wee**  
Group Chief Operating Officer  
Mobile: +27 73 728 8016  
Email: jeffrey@newgengroup.co.za

**Melvin Watkins**  
Technical Implementation  
Email: melvinw@newgengroup.co.za

### MTN Wholesale Team
**Merglin Rama**  
Third Party Administrator - Franchise Management  
Mobile: +27 81 558 1181  
Email: Merglin.Rama@mtn.com

**Sanele Msweli**  
Retail Account Manager – EBU KZN  
Mobile: +27 83 200 8821  
Email: Sanele.Msweli@mtn.com

### ThinkWiFi Platform
**Support Team**  
Email: support@thinkwifi.com  
Portal: https://dashboard.thinkwifi.com

---

## Conclusion

This enhanced hybrid solution incorporating MTN's Tarana G1 Fixed Wireless Broadband technology delivers:

- **Premium connectivity** with 50Mbps symmetrical speeds for 50 urban clinics
- **Fixed monthly costs** at R450 per clinic regardless of technology
- **Revenue generation** through ThinkWiFi platform (R410-1,184 per clinic)
- **Sustainable model** meeting MTN's MSC requirements through scale
- **Technology diversity** optimising cost and performance per location

The combination of Tarana G1's superior technology for urban areas, complemented by 5G and LTE for appropriate locations, creates an optimal connectivity solution that transforms healthcare delivery while maintaining commercial viability for all parties.

---

*Document Version: 4.0*  
*Date: September 2025*  
*Status: Final Hybrid Proposal with Tarana G1*  
*Prepared for: Unjani Clinics NPC*
# SkyFibre Fair Usage & Acceptable Usage Policy Framework
## Bandwidth and IP Transit Cost Management Strategy
### Version 1.0 - February 2025

---

## Executive Summary

While SkyFibre markets "unlimited" data packages, implementing a Fair Usage Policy (FUP) and Acceptable Usage Policy (AUP) is essential for:
- Managing wholesale bandwidth costs from MTN
- Controlling IP transit costs from ECHO SP and other providers
- Preventing network abuse and ensuring quality for all users
- Maintaining sustainable margins while offering competitive pricing

This document outlines a balanced approach that protects CircleTel's economics while maintaining customer satisfaction and the "unlimited" value proposition.

---

## 1. Cost Structure Analysis

### 1.1 Wholesale Bandwidth Costs (MTN)

**Current MSC Commitments:**
| Quarter | Monthly MSC | Annual Impact |
|---------|------------|---------------|
| Q1 (Month 1-3) | Actual spend | Variable |
| Q2 (Month 4-6) | R14,970 | R179,640 |
| Q3 (Month 7-9) | R29,940 | R359,280 |
| Q4 (Month 10-12) | R49,900 | R598,800 |

**Backhaul Pricing:**
| Capacity | Monthly Cost | Per Mbps |
|----------|--------------|----------|
| 100 Mbps | Included | R0 |
| 500 Mbps | R6,067 | R12.13 |
| 1 Gbps | R12,425 | R12.43 |
| 5 Gbps | R62,125 | R12.43 |
| 10 Gbps | R124,251 | R12.43 |

### 1.2 IP Transit Costs (ECHO SP Estimate)

**Typical South African Transit Pricing:**
| Commit Level | Cost per Mbps | Monthly Total |
|--------------|---------------|---------------|
| 100 Mbps | R150-200 | R15,000-20,000 |
| 500 Mbps | R100-150 | R50,000-75,000 |
| 1 Gbps | R80-120 | R80,000-120,000 |
| 5 Gbps | R60-80 | R300,000-400,000 |

### 1.3 Contention Ratio Planning

**Industry Standard Ratios:**
| Service Type | Typical Ratio | SkyFibre Target |
|--------------|---------------|-----------------|
| Residential FTTH | 20:1 to 40:1 | 30:1 |
| Fixed Wireless | 30:1 to 50:1 | 35:1 |
| Business | 5:1 to 10:1 | 8:1 |

**Bandwidth Requirements (1,000 customers):**
```
Total Provisioned: 100 Gbps (100 Mbps average)
Expected Peak (35:1): 2.86 Gbps
Backhaul Required: 3 Gbps (with headroom)
IP Transit Required: 2 Gbps (70% of backhaul)
```

---

## 2. Fair Usage Policy (FUP) Framework

### 2.1 Tiered FUP Thresholds

| Package | Speed | Soft Cap | Hard Cap | Action After Soft Cap |
|---------|-------|----------|----------|----------------------|
| **Starter** | 50 Mbps | 500 GB | 1 TB | Monitor only |
| **Plus** | 100 Mbps | 750 GB | 1.5 TB | Deprioritisation |
| **Pro** | 200 Mbps | 1 TB | 2 TB | Speed management |

### 2.2 Progressive Management Approach

**Stage 1: Monitoring (0-80% of soft cap)**
- No action
- Normal priority
- Full speeds

**Stage 2: Notification (80-100% of soft cap)**
- SMS/Email notification
- Usage statistics provided
- Upgrade suggestions

**Stage 3: Soft Management (100-150% of soft cap)**
- Deprioritisation during peak hours (18:00-23:00)
- P2P traffic shaping
- Video streaming limited to 1080p

**Stage 4: Hard Management (>150% of soft cap)**
- Speed reduction to base tier:
  - Starter: 10 Mbps
  - Plus: 20 Mbps
  - Pro: 30 Mbps
- Automatic reset on month-end

### 2.3 FUP Exceptions

**Protected Traffic (Never Throttled):**
- VoIP and video conferencing (Zoom, Teams, WhatsApp calls)
- Banking and financial services
- Educational platforms
- Work VPN connections
- Email and messaging

**Managed Traffic Types:**
- P2P/Torrenting (shaped 24/7)
- Non-essential updates (deprioritised)
- Cloud backup services (scheduled off-peak)
- Bulk downloads (shaped during peak)

---

## 3. Acceptable Usage Policy (AUP)

### 3.1 Prohibited Activities

**Network Abuse:**
- Running servers (web, mail, game, etc.)
- Cryptocurrency mining
- Reselling or sharing connections
- Continuous streaming/broadcasting
- Automated bot traffic
- Network attacks or scanning

**Excessive Usage Patterns:**
- 24/7 maximum bandwidth utilisation
- Automated downloading systems
- Multiple simultaneous HD/4K streams (>4)
- Commercial use on residential packages

### 3.2 Business Logic Rules

```python
# Automated FUP Detection Logic
if daily_usage > (monthly_cap / 30 * 3):
    flag_for_review()
    
if peak_hour_usage > (total_daily_usage * 0.7):
    apply_peak_shaping()
    
if p2p_traffic > (total_traffic * 0.4):
    apply_p2p_limits()
    
if concurrent_streams > 4:
    limit_video_quality(1080p)
```

### 3.3 Enforcement Matrix

| Violation Level | Action | Customer Communication |
|-----------------|--------|------------------------|
| **First Notice** | Warning email/SMS | Usage tips provided |
| **Second Notice** | Temporary shaping | Upgrade consultation |
| **Third Notice** | Service restriction | Mandatory upgrade |
| **Severe Abuse** | Service suspension | Contract review |

---

## 4. Technical Implementation

### 4.1 Traffic Management Architecture

```yaml
Traffic Management Stack:
  Layer 1 - Port Level:
    - MTN Tarana RN device
    - Basic rate limiting
    
  Layer 2 - Router Level:
    - Reyee router QoS
    - Local traffic shaping
    - Device priorities
    
  Layer 3 - Network Edge:
    - CircleTel edge routers
    - DPI (Deep Packet Inspection)
    - Application awareness
    
  Layer 4 - Core Network:
    - Bandwidth pools
    - Dynamic allocation
    - Transit optimisation
```

### 4.2 QoS Priority Levels

| Priority | Traffic Type | Bandwidth Guarantee |
|----------|-------------|-------------------|
| **P1 (Highest)** | VoIP, Gaming | 10% reserved |
| **P2 (High)** | Video Conference | 20% reserved |
| **P3 (Normal)** | Web, Email | 40% shared |
| **P4 (Low)** | Streaming | 20% shared |
| **P5 (Lowest)** | P2P, Backups | 10% maximum |

### 4.3 Peak Hour Management (18:00-23:00)

**Bandwidth Allocation During Peak:**
```
Total Capacity: 100%
├── Priority Traffic: 30% (guaranteed)
├── Regular Traffic: 50% (shared)
├── Heavy Users: 15% (capped)
└── P2P/Bulk: 5% (restricted)
```

---

## 5. Customer Communication Strategy

### 5.1 Transparent Messaging

**Marketing Language:**
- "Unlimited data with no hard caps"
- "Designed for normal household use"
- "Fair usage applies to ensure quality for all"
- "No surprises - we'll notify you"

**Terms & Conditions Extract:**
> "SkyFibre provides unlimited data access subject to our Fair Usage Policy. This ensures consistent quality for all users. Normal household usage (streaming, gaming, work from home) will never be affected. Excessive usage patterns may be managed during peak times."

### 5.2 Usage Notifications

**SMS Templates:**

**50% Usage:**
> "Hi! You've used 250GB (50%) this month. You're doing great! Check your usage anytime on the Reyee app."

**80% Usage:**
> "Heads up! You've used 400GB (80%) this month. Still unlimited, but consider our Plus package for even better speeds."

**100% Soft Cap:**
> "You've reached 500GB this month - wow! Your connection may be slower during peak times (6-11pm). Resets on month-end."

### 5.3 Customer Portal Features

**Usage Dashboard:**
- Real-time usage meter
- Daily/weekly/monthly graphs
- Traffic type breakdown
- Peak vs off-peak usage
- Predictive monthly total

---

## 6. Financial Impact Analysis

### 6.1 Cost Savings Model

**Without FUP (Worst Case):**
```
1,000 customers @ 100 Mbps average
Assuming 50% concurrent at peak
Required bandwidth: 50 Gbps
Monthly cost: R620,000+ (transit + backhaul)
```

**With FUP (Managed):**
```
1,000 customers @ 100 Mbps average
With 35:1 contention + FUP
Required bandwidth: 3 Gbps
Monthly cost: R160,000 (transit + backhaul)
Savings: R460,000/month
```

### 6.2 Customer Impact Assessment

| User Type | % of Base | Monthly Usage | FUP Impact |
|-----------|-----------|---------------|------------|
| **Light** | 60% | <100 GB | None |
| **Moderate** | 30% | 100-400 GB | None |
| **Heavy** | 8% | 400-750 GB | Minimal |
| **Excessive** | 2% | >750 GB | Managed |

**Key Finding:** 98% of customers unaffected by FUP

### 6.3 Margin Protection

| Scenario | Without FUP | With FUP | Improvement |
|----------|-------------|----------|-------------|
| **Bandwidth Cost/User** | R620 | R160 | R460 saved |
| **Gross Margin** | -5% | 28% | +33% points |
| **Break-even Users** | 2,500 | 650 | 1,850 fewer |

---

## 7. Competitive Benchmarking

### 7.1 Industry FUP Comparison

| ISP | Product | FUP Threshold | Action | Transparency |
|-----|---------|---------------|--------|--------------|
| **Rain 5G** | Unlimited | None stated | Tower congestion | Poor |
| **Vodacom 5G** | Unlimited | 250 GB | Throttle to 2 Mbps | Clear |
| **MTN 5G** | Unlimited | 300 GB | Throttle to 4 Mbps | Clear |
| **Afrihost** | Unlimited | 400-1000 GB | Deprioritise | Good |
| **SkyFibre** | Unlimited | 500-1000 GB | Soft management | Excellent |

### 7.2 Positioning Strategy

**SkyFibre Advantage:**
- Higher thresholds than mobile operators
- Soft management vs hard throttling
- Time-based (peak only) vs 24/7 throttling
- Protected service types
- Transparent communication

---

## 8. Implementation Roadmap

### Phase 1: Soft Launch (Month 1-3)
- Monitor usage patterns
- Identify heavy users
- No enforcement
- Gather baseline data

### Phase 2: Communication (Month 4)
- Update T&Cs
- Customer notifications
- Portal updates
- Support team training

### Phase 3: Soft Enforcement (Month 5-6)
- Peak hour management only
- P2P shaping
- Monitor customer feedback
- Refine thresholds

### Phase 4: Full Implementation (Month 7+)
- Complete FUP active
- Automated systems
- Regular reviews
- Threshold adjustments

---

## 9. Technology Requirements

### 9.1 Network Infrastructure

**Required Systems:**
- DPI appliance (e.g., Sandvine, Procera)
- Traffic shaping platform
- Usage monitoring system
- Automated notification system
- Customer portal integration

**Estimated Investment:**
- Hardware: R500,000
- Software licensing: R50,000/month
- Integration: R150,000
- Total Year 1: R1,250,000

### 9.2 Router Configuration

**Reyee Cloud Settings:**
```json
{
  "qos_enabled": true,
  "bandwidth_limits": {
    "starter": "50/50 Mbps",
    "plus": "100/100 Mbps",
    "pro": "200/200 Mbps"
  },
  "traffic_rules": {
    "p2p_limit": "30%",
    "video_quality": "auto",
    "peak_hours": "18:00-23:00"
  }
}
```

---

## 10. Legal & Regulatory Compliance

### 10.1 ICASA Requirements

**Compliance Points:**
- Clear disclosure in advertising
- Transparent T&Cs
- 30-day notice for changes
- No discrimination between content types
- Consumer protection adherence

### 10.2 Contract Clauses

**Essential Inclusions:**
- FUP threshold definitions
- Management actions described
- Customer notification process
- Dispute resolution process
- Service level guarantees

---

## 11. Monitoring & Reporting

### 11.1 KPI Dashboard

**Daily Metrics:**
- Total bandwidth usage
- Peak hour utilisation
- FUP triggers count
- Customer complaints
- Cost per GB

**Monthly Reports:**
- Heavy user analysis
- Traffic pattern trends
- Cost optimisation achieved
- Customer satisfaction scores
- Margin impact analysis

### 11.2 Threshold Adjustment Criteria

**Review Triggers:**
- If >5% of base hits FUP: Increase thresholds
- If <1% hits FUP: Decrease monitoring
- If costs exceed budget: Tighten management
- If NPS drops below 40: Relax restrictions

---

## 12. Recommendations

### Immediate Actions:

1. **Implement Basic FUP**
   - Start with monitoring only
   - Identify usage patterns
   - No customer impact initially

2. **Deploy Traffic Shaping**
   - P2P management 24/7
   - Peak hour prioritisation
   - Video quality optimisation

3. **Customer Communication**
   - Update all documentation
   - Train support staff
   - Launch education campaign

### Long-term Strategy:

1. **Dynamic FUP Thresholds**
   - Adjust based on network capacity
   - Seasonal variations
   - Package-specific tuning

2. **Value-Added Services**
   - Unlimited off-peak packages
   - Business hours priority
   - Gaming fast lanes

3. **Infrastructure Optimisation**
   - Local content caching
   - Peering arrangements
   - CDN partnerships

---

## Conclusion

Implementing a Fair Usage Policy is essential for SkyFibre's financial sustainability. The proposed framework:

- **Protects margins** by reducing bandwidth costs by up to 74%
- **Maintains "unlimited" promise** for 98% of customers
- **Ensures quality** through intelligent traffic management
- **Builds trust** through transparent communication
- **Enables growth** by making the business model scalable

By managing the 2% of excessive users, we protect the experience for the 98% while maintaining healthy margins. This approach positions SkyFibre as more generous than mobile operators while still being financially responsible.

**Critical Success Factor:** Position FUP as network quality protection, not cost-cutting. Emphasise that normal users will never be affected.

---

**Document prepared by:** CircleTel Network Operations Team  
**Date:** February 2025  
**Classification:** Confidential - Internal Use Only  
**Review Schedule:** Quarterly  

---

*Note: All cost figures are estimates based on market rates. Actual costs may vary based on negotiated rates with MTN and IP transit providers.*
# Unjani Clinics Router & Hardware Specification Document
## Complete Technical Equipment Guide for 252 Clinic Deployment
### Version 1.0 - September 2025

---

## Executive Summary

This document provides comprehensive hardware specifications for the Unjani Clinics connectivity solution, covering 252 locations across South Africa. The solution utilises a dual-vendor strategy with MikroTik routers for enterprise-grade routing and Reyee access points for WiFi 6 coverage, ensuring optimal performance whilst maintaining cost efficiency.

### Key Hardware Investment
- **Total network hardware cost:** R932,400 (252 sites)
- **Per site investment:** R3,700
- **Technology stack:** MikroTik + Reyee ecosystem
- **Management platform:** Ruijie Cloud (FREE lifetime)
- **Deployment timeline:** 9 months

---

## 1. Hardware Architecture Overview

### 1.1 Deployment Categories

| Site Type | Count | Primary Connection | Router | Access Points | Total Hardware Cost |
|-----------|-------|-------------------|---------|---------------|-------------------|
| **Urban/Peri-Urban** | 94 | MTN Tarana G1 | MikroTik hEX S | 3× Reyee WiFi 6 | R4,100 |
| **Rural/Remote** | 158 | MTN LTE | Huawei B618 + MikroTik | 2× Reyee WiFi 6 | R3,500 |
| **Total Network** | 252 | Mixed | Mixed | 668 APs | R932,400 |

### 1.2 Vendor Selection Rationale

**MikroTik (Routing)**
- Enterprise features at SMB pricing
- Local support through Scoop Distribution
- RouterOS flexibility and reliability
- Captive portal integration capability

**Reyee (WiFi)**
- WiFi 6 technology at competitive pricing
- FREE lifetime cloud management
- Seamless roaming and mesh capability
- High-density user support

---

## 2. Core Routing Equipment

### 2.1 MikroTik hEX S (RB760iGS) - Primary Router

**Specifications:**
| Feature | Specification | Benefit |
|---------|--------------|---------|
| **Model** | RB760iGS | Enterprise-grade reliability |
| **CPU** | Dual-Core 880MHz | Handles 100+ concurrent users |
| **RAM** | 256MB | Sufficient for clinic operations |
| **Storage** | 16MB Flash | Stores configurations |
| **Ports** | 5× Gigabit Ethernet | Full gigabit throughput |
| **PoE** | Passive PoE on port 5 | Powers additional devices |
| **Features** | SFP cage for fibre | Future-proof connectivity |
| **Throughput** | 470 Mbps | Exceeds clinic requirements |

**Cost Breakdown:**
- Dealer price: R1,200
- Retail price: R1,650
- Quantity needed: 252 units
- Total investment: R302,400

**Key Features for Clinics:**
- **Captive Portal:** ThinkWiFi integration ready
- **VLAN Support:** Separate clinic/patient networks
- **QoS:** Prioritise telemedicine traffic
- **Firewall:** Enterprise-grade security
- **Remote Management:** WinBox and WebFig

### 2.2 Huawei B618s-22d - LTE Router (Rural Sites)

**Specifications:**
| Feature | Specification | Benefit |
|---------|--------------|---------|
| **Category** | LTE Cat 11 | Up to 600 Mbps capability |
| **Bands** | All SA LTE bands | Maximum compatibility |
| **WiFi** | 802.11ac dual-band | Backup WiFi capability |
| **Antennas** | 2× external SMA | Improved signal reception |
| **Ethernet** | 2× Gigabit ports | LAN connectivity |
| **Users** | 64 concurrent | Adequate for small clinics |

**Cost Breakdown:**
- Dealer price: R1,800
- Retail price: R2,400
- Quantity needed: 158 units
- Total investment: R284,400

**Deployment Configuration:**
- Bridge mode to MikroTik
- External antenna installation
- SIM management protocol
- Failover configuration

---

## 3. WiFi Access Points

### 3.1 Reyee RG-RAP2200(F) - Primary WiFi 6 Access Point

**Specifications:**
| Feature | Specification | Performance Impact |
|---------|--------------|-------------------|
| **Standard** | WiFi 6 (802.11ax) | Latest technology |
| **Speed** | AX1800 (1775 Mbps) | 574 Mbps (2.4GHz) + 1201 Mbps (5GHz) |
| **MIMO** | 2×2:2 | Optimal coverage |
| **Concurrent Users** | 256+ | High-density support |
| **Coverage** | 150m² per AP | Full clinic coverage |
| **PoE** | 802.3af/at | Standard PoE support |
| **Management** | Ruijie Cloud | FREE lifetime access |

**Cost Breakdown:**
- Dealer price: R850
- Retail price: R1,150
- Average per clinic: 2.65 units
- Total quantity: 668 units
- Total investment: R567,800

**Key Features:**
- **Seamless Roaming:** 802.11r/k/v support
- **Band Steering:** Automatic 5GHz preference
- **Load Balancing:** Even user distribution
- **Guest Network:** Isolated patient access
- **Captive Portal:** ThinkWiFi integration

### 3.2 Alternative: Reyee RG-EW1300G (Budget Option)

**When to Consider:**
- Very small clinics (<50 users)
- Budget constraints
- Temporary installations

**Specifications:**
| Feature | Specification | Trade-off |
|---------|--------------|-----------|
| **Standard** | WiFi 5 (802.11ac) | Previous generation |
| **Speed** | AC1300 (1267 Mbps) | Sufficient for 50 Mbps |
| **Price** | R435 dealer | 49% cost saving |
| **Users** | 96 concurrent | Lower density |

---

## 4. Supporting Hardware

### 4.1 Power Infrastructure

**UPS Requirements (Urban Sites):**
| Component | Specification | Cost | Quantity |
|-----------|--------------|------|----------|
| **Model** | 650VA Line Interactive | R800 | 94 |
| **Runtime** | 4-6 hours @ 30W | - | - |
| **Protection** | Surge + battery backup | - | - |
| **Total Investment** | - | R75,200 | - |

**Solar Requirements (Rural Sites):**
| Component | Specification | Cost | Quantity |
|-----------|--------------|------|----------|
| **Panel** | 100W monocrystalline | R1,200 | 158 |
| **Battery** | 100Ah deep cycle | R1,800 | 158 |
| **Controller** | 20A MPPT | R600 | 158 |
| **Total Investment** | - | R568,800 | - |

### 4.2 Network Infrastructure

**Cabling & Accessories:**
| Item | Specification | Unit Cost | Total Quantity | Total Cost |
|------|--------------|-----------|----------------|------------|
| **CAT6 Cable** | 305m box | R1,200 | 84 boxes | R100,800 |
| **RJ45 Connectors** | CAT6 rated | R2 | 2,016 | R4,032 |
| **Mounting Brackets** | Universal AP mount | R45 | 668 | R30,060 |
| **PoE Injectors** | 802.3af 15.4W | R150 | 668 | R100,200 |
| **Patch Cables** | 1m CAT6 | R25 | 756 | R18,900 |
| **Cable Trunking** | 2m lengths | R35 | 504 | R17,640 |

**Total Accessories:** R271,632

---

## 5. Network Topology

### 5.1 Urban/Peri-Urban Configuration (94 Sites)

```
[MTN Tarana G1 CPE]
        |
    [Gigabit]
        |
[MikroTik hEX S Router]
        |
    [VLAN Trunk]
        |
[Gigabit PoE Switch - Optional]
    |     |     |
   AP1   AP2   AP3
[Reyee RG-RAP2200(F)]

Network Segments:
- VLAN 10: Clinic Operations (Priority)
- VLAN 20: Patient WiFi (Captive Portal)
- VLAN 30: IoT Devices (Isolated)
```

### 5.2 Rural/Remote Configuration (158 Sites)

```
[MTN LTE Network]
        |
[Huawei B618 (Bridge Mode)]
        |
    [Gigabit]
        |
[MikroTik hEX S Router]
    |         |
   AP1       AP2
[Reyee RG-RAP2200(F)]

Simplified Segments:
- VLAN 10: All Clinic Traffic
- VLAN 20: Patient WiFi
```

---

## 6. Hardware Costing Summary

### 6.1 Per-Site Investment Breakdown

**Urban/Peri-Urban Sites (94 clinics):**
| Component | Cost | Notes |
|-----------|------|-------|
| MikroTik hEX S | R1,200 | Primary router |
| Reyee AP × 3 | R2,550 | WiFi 6 coverage |
| Installation | R500 | Professional setup |
| Accessories | R300 | Cables, mounts |
| UPS System | R800 | Power backup |
| **Total per site** | **R5,350** | Excluding Tarana CPE |

**Rural/Remote Sites (158 clinics):**
| Component | Cost | Notes |
|-----------|------|-------|
| Huawei B618 | R1,800 | LTE router |
| MikroTik hEX S | R1,200 | Traffic management |
| Reyee AP × 2 | R1,700 | WiFi coverage |
| Installation | R500 | Professional setup |
| Accessories | R300 | Cables, mounts |
| **Total per site** | **R5,500** | Including LTE router |

### 6.2 Total Network Investment

| Category | Quantity | Unit Cost | Total Cost |
|----------|----------|-----------|------------|
| **Routing Equipment** | 252 | R1,993 avg | R502,200 |
| **WiFi Access Points** | 668 | R850 | R567,800 |
| **Power Systems** | 252 | R2,580 avg | R644,000 |
| **Accessories** | 252 | R1,078 | R271,632 |
| **Installation** | 252 | R500 | R126,000 |
| **Total Hardware** | - | - | **R2,111,632** |
| **Per Site Average** | - | - | **R8,380** |

---

## 7. Management Platform

### 7.1 Ruijie Cloud - FREE Lifetime Management

**Features:**
| Feature | Benefit | Value |
|---------|---------|-------|
| **Zero Cost** | No licensing fees | Saves R50-100/month per site |
| **Remote Management** | Configure from anywhere | Reduces site visits |
| **Monitoring** | Real-time performance | Proactive maintenance |
| **Firmware Updates** | Automatic deployment | Security compliance |
| **Multi-Site** | Single dashboard | Efficient operations |
| **API Access** | Integration ready | ThinkWiFi automation |

**Management Capabilities:**
- Device provisioning
- Configuration templates
- Performance monitoring
- Alert management
- Usage analytics
- Guest portal customisation

### 7.2 MikroTik Management Tools

**WinBox:**
- Windows-based GUI
- Full RouterOS access
- Batch configuration
- Backup management

**The Dude:**
- Network monitoring
- Automated alerts
- Performance graphs
- Network mapping

---

## 8. Supplier & Logistics

### 8.1 Primary Suppliers

**Scoop Distribution (Primary):**
- MikroTik authorised distributor
- Reyee official partner
- National coverage
- Technical support included
- Stock availability: Good

**Contact Details:**
- Tel: 011 265 1600
- Email: sales@scoop.co.za
- Account Manager: [Assigned]
- Credit Terms: 30 days

**Alternative Suppliers:**
- Miro Distribution (MikroTik)
- GD Technologies (Reyee)
- Esquire Technologies (Huawei)

### 8.2 Stock Requirements

**Initial Order (Month 1-3):**
| Item | Quantity | Lead Time |
|------|----------|-----------|
| MikroTik hEX S | 50 units | 5 days |
| Reyee RG-RAP2200(F) | 135 units | 7 days |
| Huawei B618 | 40 units | 10 days |
| Accessories | 50 site kits | 3 days |

**Ongoing Requirements:**
- Monthly orders based on rollout schedule
- 30-day buffer stock maintained
- Emergency stock: 5% of active sites

---

## 9. Installation & Configuration

### 9.1 Standard Installation Process

**Pre-Installation (Remote):**
1. Site survey via photos
2. Configuration preparation
3. Equipment staging
4. Documentation creation

**On-Site Installation (4-6 hours):**
1. Physical installation
2. Power setup
3. Network configuration
4. WiFi optimisation
5. Testing & handover
6. Staff training

### 9.2 Configuration Templates

**MikroTik Standard Config:**
```routeros
# Basic Security
/ip firewall filter
add chain=input action=drop in-interface=ether1 

# VLAN Configuration  
/interface vlan
add name=vlan10-clinic interface=bridge vlan-id=10
add name=vlan20-patient interface=bridge vlan-id=20

# QoS for Telemedicine
/queue simple
add name=telemedicine target=192.168.10.0/24 priority=1/1
add name=patient-wifi target=192.168.20.0/24 priority=8/8

# Captive Portal
/ip hotspot profile
add name=patient-portal login-by=http-chap
```

**Reyee WiFi Config:**
- SSID: "Unjani-Clinic-WiFi"
- Security: WPA3/WPA2
- Band steering: Enabled
- Roaming: 802.11r enabled
- Guest isolation: Enabled

---

## 10. Support & Maintenance

### 10.1 Warranty Coverage

| Component | Warranty | Support Level |
|-----------|----------|---------------|
| MikroTik routers | 12 months | Return to base |
| Reyee APs | 24 months | Advanced replacement |
| Huawei LTE | 12 months | Return to base |
| Installation | 90 days | On-site support |

### 10.2 Maintenance Schedule

**Monthly:**
- Remote health check
- Firmware verification
- Performance review
- Usage analysis

**Quarterly:**
- On-site inspection
- Physical cleaning
- Cable management
- Documentation update

**Annually:**
- Full system audit
- Hardware refresh assessment
- Capacity planning
- Technology roadmap review

---

## 11. Scalability & Future-Proofing

### 11.1 Growth Considerations

**Capacity Expansion:**
- Add APs for coverage (mesh capable)
- Upgrade router for throughput
- Implement switches for ports
- Deploy controllers for 50+ APs

**Technology Evolution:**
- WiFi 6E ready infrastructure
- 5G migration path defined
- Fibre upgrade capability
- IoT integration supported

### 11.2 Upgrade Paths

| Current | Upgrade Option | When to Consider | Cost Impact |
|---------|---------------|------------------|-------------|
| MikroTik hEX S | RB4011iGS+ | >100 concurrent users | +R2,800 |
| Reyee WiFi 6 | WiFi 6E AP | 6GHz spectrum available | +R1,200 |
| LTE Cat 11 | 5G Router | 5G coverage available | +R3,500 |
| Copper cabling | Fibre optic | >100m runs needed | +R5,000 |

---

## 12. Compliance & Standards

### 12.1 Regulatory Compliance

**ICASA Requirements:**
- Type approval for all equipment
- Spectrum compliance verified
- Installation by certified technicians
- Documentation maintained

**Health Sector Standards:**
- POPIA compliance for data handling
- Patient privacy protection
- Medical device EMI compliance
- Backup power requirements

### 12.2 Technical Standards

**Network Standards:**
- IEEE 802.3 (Ethernet)
- IEEE 802.11ax (WiFi 6)
- IEEE 802.1Q (VLAN)
- IEEE 802.3af/at (PoE)

**Security Standards:**
- WPA3 encryption
- 802.1X authentication
- Firewall best practices
- Regular security updates

---

## Appendices

### Appendix A: Bill of Materials Template

```
UNJANI CLINIC: [CLINIC NAME]
SITE TYPE: [URBAN/RURAL]
DATE: [INSTALLATION DATE]

EQUIPMENT CHECKLIST:
□ MikroTik hEX S Router (S/N: ________)
□ Reyee RG-RAP2200(F) AP #1 (S/N: ________)
□ Reyee RG-RAP2200(F) AP #2 (S/N: ________)
□ Reyee RG-RAP2200(F) AP #3 (S/N: ________)
□ CAT6 Cable (_____ meters used)
□ RJ45 Connectors (_____ used)
□ Mounting brackets (_____ installed)
□ PoE Injectors (_____ deployed)
□ UPS System (S/N: ________)

CONFIGURATION COMPLETED:
□ Router configured
□ WiFi configured
□ Captive portal active
□ ThinkWiFi integrated
□ Testing completed
□ Staff trained
□ Documentation provided
```

### Appendix B: Quick Reference Guide

**Common Issues & Solutions:**

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| No internet | WAN down | Check Tarana/LTE status |
| Slow WiFi | Interference | Change channel, check density |
| Can't connect | Portal issue | Restart captive portal |
| Intermittent | Power issues | Check UPS, connections |

**Support Contacts:**
- NOC: 0861 CIRCLE (247253)
- WhatsApp: 081 234 5678
- Email: support@circletel.co.za
- Portal: https://support.circletel.co.za

---

## Conclusion

This comprehensive hardware specification ensures Unjani Clinics receive enterprise-grade connectivity solutions whilst maintaining cost efficiency. The MikroTik and Reyee ecosystem provides proven reliability, scalability, and management capabilities essential for the successful deployment across 252 sites.

The total hardware investment of R2.1M (approximately R8,380 per site) delivers a robust, future-proof infrastructure that supports both current requirements and future growth, whilst enabling the innovative ThinkWiFi monetisation model that transforms connectivity from a cost centre to a revenue generator.

---

*Document Version: 1.0*  
*Date: September 2025*  
*Classification: Technical Specification*  
*Next Review: December 2025*
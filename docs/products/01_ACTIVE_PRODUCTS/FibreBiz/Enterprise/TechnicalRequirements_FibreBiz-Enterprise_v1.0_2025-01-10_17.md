# FibreBiz Enterprise™ - Technical Requirements Document
## Version 1.0 - Network Architecture & Implementation Specifications
## Date: 10 January 2025 15:00 SAST
## Status: Draft - Technical Review

---

**Document Control:**
- **Version:** 1.0
- **Author:** CircleTel Network Engineering
- **Classification:** Technical - Internal Use Only
- **Review Cycle:** Bi-annual

---

## EXECUTIVE SUMMARY

This document defines the comprehensive technical requirements for FibreBiz Enterprise™, detailing network architecture, equipment specifications, integration requirements, and operational procedures. The solution leverages wholesale fibre infrastructure with value-added service layers to deliver enterprise-grade connectivity to SME customers.

### Key Technical Objectives
- Deliver 99.9%+ network availability
- Support symmetrical speeds from 50 Mbps to 1 Gbps
- Enable sub-5ms latency to local content
- Provide end-to-end service management
- Ensure scalability to 10,000+ customers

---

## 1. NETWORK ARCHITECTURE

### 1.1 High-Level Architecture

```
[Customer Premises]
       |
    [CPE/Router]
       |
    [ONT Device]
       |
   [Fibre Access]
       |
[Last Mile Provider Network]
       |
   [Aggregation]
       |
[Metro/Core Network]
       |
  [CircleTel PoP]
       |
   [Internet/Cloud]
```

### 1.2 Network Layers

**Layer 1: Physical Infrastructure**
- Single-mode fibre (SMF-28e)
- Wavelength: 1310nm/1490nm/1550nm
- Connector types: SC/APC, LC/UPC
- Power budget: -28dBm to +2dBm

**Layer 2: Data Link**
- GPON (ITU-T G.984) for residential areas
- Active Ethernet for business parks
- VLAN segregation per customer
- QinQ for service separation

**Layer 3: Network**
- IPv4 primary (IPv6 ready)
- Static IP allocation
- BGP peering for redundancy
- OSPF internal routing

### 1.3 Points of Presence (PoPs)

**Primary PoPs:**
1. **Johannesburg:** Teraco JB1 & JB2
2. **Cape Town:** Teraco CT1 & CT2  
3. **Durban:** DFA Durban PoP
4. **Pretoria:** Internet Solutions Centurion

**PoP Requirements:**
- Minimum 2x 10Gbps uplinks
- N+1 power redundancy
- 48-hour battery backup
- Environmental monitoring
- 24/7 physical security

---

## 2. CONNECTIVITY REQUIREMENTS

### 2.1 Last Mile Access

**Supported Access Technologies:**

| Technology | Provider | Coverage | Typical Latency | Max Speed |
|------------|----------|----------|-----------------|-----------|
| GPON | Vumatel/Octotel | Residential | 2-5ms | 1 Gbps |
| Active Ethernet | MetroFibre | Business Parks | 1-3ms | 10 Gbps |
| P2P Fibre | DFA | Metro Areas | <1ms | 100 Gbps |
| XGS-PON | OpenServe | National | 2-4ms | 10 Gbps |

**Integration Requirements:**
- API integration for feasibility checks
- Automated provisioning capability
- Real-time service activation
- Bulk service migration support

### 2.2 Bandwidth Specifications

**Service Tiers:**

| Package | Download | Upload | Committed | Burst | Contention |
|---------|----------|---------|-----------|-------|------------|
| Starter | 50 Mbps | 50 Mbps | 100% | N/A | 1:1 |
| Professional | 100 Mbps | 100 Mbps | 100% | N/A | 1:1 |
| Premium | 200 Mbps | 200 Mbps | 100% | N/A | 1:1 |
| Enterprise | 500 Mbps | 500 Mbps | 100% | N/A | 1:1 |

**Quality of Service (QoS):**
- Voice traffic: EF (Priority)
- Business applications: AF31
- Web traffic: AF21
- Bulk data: BE (Best Effort)

### 2.3 IP Addressing

**Allocation Scheme:**
- IPv4 public addresses per package
- /29 subnet minimum (5 usable)
- IPv6 /48 prefix per customer [FUTURE]
- DHCP reservation or static assignment

**IP Management:**
- IPAM system for tracking
- Automated allocation
- Geolocation tagging
- Abuse monitoring

---

## 3. EQUIPMENT SPECIFICATIONS

### 3.1 Customer Premises Equipment (CPE)

**Business Router Requirements:**

| Feature | Starter/Prof | Premium | Enterprise |
|---------|--------------|---------|------------|
| Model | MikroTik RB2011 | MikroTik CCR1009 | MikroTik CCR1036 |
| Throughput | 1 Gbps | 2 Gbps | 8 Gbps |
| Firewall | Stateful | Stateful + IPS | Full UTM |
| VPN Support | 10 tunnels | 50 tunnels | 100 tunnels |
| Management | Remote | Remote | Remote + API |
| Cost | R2,500 | R5,500 | R12,000 |

**Optical Network Terminal (ONT):**
- GPON: Huawei EchoLife EG8145V5
- Active Ethernet: Generic SFP module
- Power: 12V DC with battery backup option
- Management: TR-069 compliant

### 3.2 Network Infrastructure

**Core Routers:**
- Juniper MX204 or equivalent
- 400 Gbps forwarding capacity
- Full BGP table support
- MPLS capability
- Redundant power supplies

**Aggregation Switches:**
- Cisco Nexus 9300 series
- 10/40/100 GbE interfaces
- VXLAN support
- Low latency (<2�s)
- Stacking capability

**Monitoring Equipment:**
- Network TAPs for visibility
- Flow collectors (NetFlow/sFlow)
- Packet capture appliances
- DDoS detection sensors

---

## 4. SERVICE MANAGEMENT PLATFORM

### 4.1 OSS/BSS Integration

**Required Systems:**

| System | Function | Integration Method | Priority |
|--------|----------|-------------------|----------|
| CRM | Customer management | REST API | Critical |
| Billing | Invoice & payments | Database sync | Critical |
| Provisioning | Service activation | SOAP/REST | Critical |
| Inventory | Asset tracking | CSV import | High |
| Monitoring | Service assurance | SNMP/API | Critical |
| Ticketing | Fault management | Email/API | High |

### 4.2 Automation Requirements

**Provisioning Automation:**
```
1. Order Received (CRM)
   �
2. Feasibility Check (API)
   �
3. VLAN Assignment (IPAM)
   �
4. Router Config (Ansible)
   �
5. Service Activation (Provider API)
   �
6. Testing & Validation (Scripts)
   �
7. Customer Notification (Email/SMS)
```

**Key Automation Metrics:**
- Provisioning time: <30 minutes
- Zero-touch rate: >80%
- Rollback capability: Required
- Audit trail: Complete

### 4.3 Monitoring & Management

**Monitoring Stack:**
- **Infrastructure:** Zabbix 6.0
- **Performance:** PRTG Network Monitor
- **Applications:** AppDynamics
- **Logs:** ELK Stack
- **Dashboards:** Grafana

**Monitoring Requirements:**
- 1-minute polling interval
- 12-month data retention
- Real-time alerting
- Customer portal visibility
- SLA tracking

---

## 5. SECURITY REQUIREMENTS

### 5.1 Network Security

**Perimeter Security:**
- Stateful firewalls at all PoPs
- DDoS mitigation (>100 Gbps capacity)
- IPS/IDS on all customer connections
- Geographic IP blocking capability

**Security Features by Tier:**

| Feature | Starter | Professional | Premium | Enterprise |
|---------|---------|--------------|---------|------------|
| Firewall | Basic | Stateful | Advanced | Next-Gen |
| DDoS Protection | 1 Gbps | 5 Gbps | 10 Gbps | 20 Gbps |
| Web Filtering | - | Basic | Advanced | Custom |
| Threat Intelligence | - | - | Daily | Real-time |
| Security Reports | - | Monthly | Weekly | Daily |

### 5.2 Data Security

**Encryption Requirements:**
- Management traffic: SSH/HTTPS only
- Customer data: AES-256 at rest
- Backups: Encrypted and offsite
- API communications: TLS 1.3
- VPN: IPSec or OpenVPN

**Compliance:**
- POPIA compliance mandatory
- PCI DSS for payment data
- ISO 27001 alignment
- Regular security audits
- Penetration testing annually

### 5.3 Access Control

**Authentication:**
- Multi-factor authentication (MFA)
- RADIUS/TACACS+ for network devices
- Role-based access control (RBAC)
- Session timeout policies
- Password complexity requirements

**Audit Requirements:**
- All configuration changes logged
- User activity tracking
- Automated compliance reports
- 90-day log retention minimum
- SIEM integration

---

## 6. REDUNDANCY & RESILIENCE

### 6.1 Network Redundancy

**Design Principles:**
- No single point of failure
- N+1 redundancy minimum
- Active-active where possible
- Automatic failover <30 seconds
- Geographic diversity

**Redundancy Matrix:**

| Component | Primary | Backup | Failover Time | RPO/RTO |
|-----------|---------|--------|---------------|---------|
| Internet Transit | Provider A | Provider B | <3 seconds | 0/30s |
| Core Routers | Active | Standby | <1 second | 0/10s |
| Power Systems | Utility | UPS + Generator | 0 seconds | 0/0 |
| Fibre Paths | Primary | Diverse | <30 seconds | 0/60s |

### 6.2 Disaster Recovery

**DR Strategy:**
- Secondary PoP in different city
- Database replication (real-time)
- Configuration backups (hourly)
- DR drills (quarterly)
- 4-hour recovery objective

**Backup Requirements:**
- Daily incremental backups
- Weekly full backups
- 30-day onsite retention
- 1-year offsite retention
- Tested restore procedures

### 6.3 Service Continuity

**Business Continuity Measures:**
- LTE/5G backup option
- Diverse fibre paths
- Multiple upstream providers
- Distributed DNS
- CDN integration

---

## 7. PERFORMANCE REQUIREMENTS

### 7.1 Service Level Targets

| Metric | Starter | Professional | Premium | Enterprise |
|--------|---------|--------------|---------|------------|
| Availability | 99.5% | 99.7% | 99.9% | 99.95% |
| Latency (local) | <10ms | <7ms | <5ms | <3ms |
| Packet Loss | <0.5% | <0.3% | <0.1% | <0.05% |
| Jitter | <5ms | <3ms | <2ms | <1ms |
| MTTR | 8 hours | 4 hours | 2 hours | 1 hour |

### 7.2 Capacity Planning

**Scaling Requirements:**
- Support 1,000 customers Year 1
- Scale to 10,000 customers Year 3
- Maintain 40% headroom
- Upgrade lead time <30 days
- Modular expansion capability

**Bandwidth Planning:**
- 95th percentile billing model
- 60% average utilisation target
- Peak traffic 18:00-22:00
- Commit ratios per wholesale agreement
- Quarterly capacity reviews

### 7.3 Performance Monitoring

**Key Metrics:**
- Bandwidth utilisation (5-min average)
- Latency (per destination)
- Packet loss (per link)
- Error rates (per interface)
- CPU/Memory utilisation

**Reporting Requirements:**
- Real-time dashboard
- Daily summary reports
- Monthly SLA reports
- Quarterly trend analysis
- Annual capacity planning

---

## 8. INTEGRATION REQUIREMENTS

### 8.1 Wholesale Provider Integration

**API Integrations Required:**

| Provider | System | Function | Method | Priority |
|----------|--------|----------|---------|----------|
| Vumatel | Coverage API | Feasibility | REST | Critical |
| OpenServe | Assure Portal | Provisioning | SOAP | Critical |
| DFA | Partner Portal | Ordering | Web/API | High |
| MetroFibre | Connect Platform | Activation | REST | High |

### 8.2 Internal System Integration

**Data Flows:**
```
CRM � Provisioning � Network Config
 �         �              �
Billing � Monitoring � Service Status
```

**Integration Points:**
- Customer onboarding
- Service provisioning
- Fault management
- Performance reporting
- Billing reconciliation

### 8.3 Third-Party Services

**Required Integrations:**
- Payment gateways (PayGate/PayFast)
- SMS gateway (Clickatell/BulkSMS)
- Email service (SendGrid/Mailgun)
- IP geolocation (MaxMind)
- Threat intelligence feeds

---

## 9. OPERATIONAL PROCEDURES

### 9.1 Installation Process

**Standard Installation Workflow:**

| Step | Task | Owner | SLA | Tools |
|------|------|-------|-----|-------|
| 1 | Feasibility check | System | Instant | API |
| 2 | Site survey | Field Tech | 48 hours | Mobile app |
| 3 | Fibre installation | Contractor | 5 days | N/A |
| 4 | CPE installation | Field Tech | 2 hours | Kit |
| 5 | Configuration | NOC | 30 mins | Ansible |
| 6 | Testing | NOC | 15 mins | Scripts |
| 7 | Handover | Field Tech | 30 mins | Checklist |

### 9.2 Fault Management

**Fault Resolution Process:**
1. Detection (monitoring/customer)
2. Ticket creation (automatic/manual)
3. Initial diagnosis (Tier 1)
4. Escalation if required (Tier 2/3)
5. Resolution implementation
6. Testing and validation
7. Customer notification
8. Ticket closure

**Escalation Matrix:**

| Severity | Description | Response | Resolution | Escalation |
|----------|-------------|----------|------------|------------|
| Critical | Service down | 15 mins | 1 hour | Immediate |
| High | Degraded service | 1 hour | 4 hours | 2 hours |
| Medium | Minor issue | 4 hours | 24 hours | 8 hours |
| Low | Request | 24 hours | 72 hours | 48 hours |

### 9.3 Change Management

**Change Control Process:**
- RFC submission (min 48 hours)
- Impact assessment
- CAB approval
- Maintenance window scheduling
- Customer notification
- Implementation
- Validation
- Post-implementation review

**Maintenance Windows:**
- Standard: Tuesday 00:00-06:00
- Emergency: As required
- Notification: 7 days (standard), 4 hours (emergency)

---

## 10. TESTING & VALIDATION

### 10.1 Service Acceptance Testing

**Installation Tests:**
- Link verification (light levels)
- Speed test (both directions)
- Latency test (multiple destinations)
- DNS resolution
- Static IP verification
- Firewall rules validation
- VPN connectivity (if applicable)

**Test Acceptance Criteria:**
- Speed: >95% of subscribed rate
- Latency: Within SLA parameters
- Packet loss: <0.1%
- DNS: <50ms resolution
- All features functional

### 10.2 Ongoing Service Validation

**Automated Testing:**
- Synthetic transactions (5-min intervals)
- Speed tests (hourly)
- Path monitoring (continuous)
- Service availability (1-min checks)
- SLA compliance (real-time)

**Manual Testing:**
- Monthly service audits
- Quarterly DR tests
- Annual security assessment
- Customer experience testing

### 10.3 Performance Benchmarking

**Benchmark Metrics:**
- vs Competitor services
- vs International standards
- vs Previous period
- vs SLA commitments

**Benchmark Reporting:**
- Monthly internal review
- Quarterly customer reports
- Annual strategic review

---

## 11. TECHNICAL SUPPORT STRUCTURE

### 11.1 Support Tiers

**Tier 1: Helpdesk**
- First contact resolution
- Basic troubleshooting
- Password resets
- Service information
- Ticket creation

**Tier 2: NOC**
- Advanced troubleshooting
- Configuration changes
- Network diagnostics
- Escalation decisions
- Vendor coordination

**Tier 3: Engineering**
- Complex problems
- Design changes
- Capacity planning
- Vendor escalation
- Root cause analysis

### 11.2 Support Tools

**Required Toolset:**
- Ticketing system (Freshdesk)
- Remote access (TeamViewer/AnyDesk)
- Network tools (ping, traceroute, etc.)
- Monitoring access (read-only)
- Knowledge base
- Customer portal

### 11.3 Training Requirements

**Technical Certification:**
- CCNA minimum for Tier 2
- CCNP preferred for Tier 3
- Vendor specific training
- ITIL Foundation
- Security awareness

**Ongoing Training:**
- Monthly technical updates
- Quarterly vendor training
- Annual certification renewal
- Customer service training

---

## 12. COMPLIANCE & STANDARDS

### 12.1 Regulatory Compliance

**ICASA Requirements:**
- ECS/ECNS license compliance
- Quality of service standards
- Consumer protection
- Number portability support
- Interconnection obligations

**POPIA Compliance:**
- Data minimisation
- Purpose limitation
- Retention policies
- Subject rights
- Breach notification

### 12.2 Industry Standards

**Technical Standards:**
- ITU-T G.984 (GPON)
- IEEE 802.3 (Ethernet)
- RFC 2544 (Benchmarking)
- ITU-T Y.1564 (Service activation)
- MEF standards (Carrier Ethernet)

**Management Standards:**
- ITIL v4 framework
- ISO 27001 (Security)
- ISO 9001 (Quality)
- TM Forum standards

### 12.3 Vendor Requirements

**Wholesale SLAs:**
- Provisioning: 5-10 business days
- Fault resolution: 4-8 hours
- Availability: 99.5% minimum
- Support: Business hours minimum
- Escalation: Defined process

---

## APPENDICES

### Appendix A: Network Diagram

```
                    [Internet]
                        |
                 [Transit Providers]
                    /        \
                [JHB PoP]  [CPT PoP]
                  /    \    /    \
           [Aggregation Switches]
                /      |      \
        [Vumatel] [OpenServe] [DFA]
              /        |        \
        [Customer] [Customer] [Customer]
```

### Appendix B: IP Addressing Plan

**Public IP Allocation:**
- Customer ranges: 41.x.x.x/22 [RESEARCH NEEDED]
- Management: 10.0.0.0/8
- Monitoring: 172.16.0.0/12
- Transit: As per provider

### Appendix C: Equipment BOQ

| Item | Quantity | Unit Cost | Total Cost |
|------|----------|-----------|------------|
| Core Router | 2 | R500,000 | R1,000,000 |
| Aggregation Switch | 4 | R150,000 | R600,000 |
| Firewall | 2 | R200,000 | R400,000 |
| Monitoring Server | 2 | R50,000 | R100,000 |
| CPE Routers | 100 | R3,500 | R350,000 |
| **Total Year 1** | | | **R2,450,000** |

### Appendix D: Vendor Contact Matrix

| Function | Primary Vendor | Contact | Escalation |
|----------|---------------|---------|------------|
| Transit | Internet Solutions | 0860 xxx xxx | NOC |
| Fibre | Vumatel | 087 xxx xxxx | Partner portal |
| Fibre | OpenServe | 0800 xxx xxx | Assure portal |
| Equipment | MikroTik | support@... | Distributor |
| Monitoring | Zabbix | Community | Forums |

---

## DOCUMENT APPROVAL

**Technical Sign-off:**
- Network Architecture: __________
- Security: __________
- Operations: __________
- Integration: __________

**Management Approval:**
- CTO: __________ Date: __________
- COO: __________ Date: __________

---

*End of Technical Requirements - Version 1.0*
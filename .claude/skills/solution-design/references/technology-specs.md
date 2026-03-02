# Technology Specifications

Technical specifications for all CircleTel access technologies. Reference when selecting technology for solutions.

---

## Network Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CIRCLETEL NETWORK ARCHITECTURE                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LAST MILE (Access Technologies)                                │
│  ├── MTN Tarana G1 FWA (Licensed spectrum, <5ms latency)       │
│  ├── DFA Business Broadband (FTTB, symmetrical, SLA-backed)    │
│  ├── MTN FTTH Wholesale (GPON, residential)                    │
│  ├── Reyee 5GHz FWA (Self-managed, AirLink product line)       │
│  ├── Peraso DUNE 60GHz mmWave (ParkConnect, short-range LoS)   │
│  └── MTN LTE/5G (CircleConnect Wireless, nationwide coverage)  │
│                                                                 │
│  CORE NETWORK                                                   │
│  ├── BNG: MTN Huawei NE8000M14 (JHB) / S9312 (CPT)           │
│  ├── Switching: Echo SP Arista (Layer 2 only)                  │
│  ├── RADIUS Proxy: Echo SP Managed BNG Service                  │
│  ├── AAA/RADIUS: Interstellio (circletel.co.za realm)          │
│  └── IP Transit: Echo SP / DFA Magellan                         │
│                                                                 │
│  DATA CENTRES                                                   │
│  ├── Teraco JB1 (Johannesburg) — Primary                       │
│  └── Teraco CT1 (Cape Town) — Secondary                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## MTN Tarana G1 FWA

**Product Line:** SkyFibre SMB
**Status:** ACTIVE — Core Technology

### Specifications

| Attribute | Value |
|-----------|-------|
| **Spectrum** | Licensed (MTN allocation) |
| **Max Throughput** | Up to 1 Gbps |
| **Latency** | <5ms |
| **Contention** | 4:1 (download to upload ratio) |
| **Range** | 15-20 km typical |
| **NLOS** | Limited NLOS capability |
| **Interference** | Resistant (licensed spectrum) |

### Technical Characteristics
- **Modulation:** Adaptive, high-efficiency
- **Frequency:** Licensed sub-6GHz
- **MIMO:** Advanced beamforming
- **nLoS:** Some non-line-of-sight capability

### CircleTel Advantage
- 10× better latency than legacy FWA (WiruLink RUSH)
- Consistent performance (licensed spectrum)
- MTN infrastructure reliability

### Deployment Requirements
- Site survey for coverage confirmation
- CPE installation (outdoor unit)
- Typical install time: 2-5 days

### Ideal Use Cases
- SME connectivity (2-50 staff)
- Video conferencing-heavy businesses
- Cloud-dependent operations
- Business-critical connectivity

### Limitations
- Coverage dependent on MTN Tarana rollout
- 4:1 asymmetry limits upload-heavy use cases
- Not suitable for server hosting (upload needs)

---

## DFA Business Broadband (FTTB)

**Product Line:** BizFibreConnect
**Status:** ACTIVE
**Source:** DFA_Complete_Product_Portfolio_v1_0.md, BizFibreConnect_DFA_Product_Overview_v2_0.md

### Specifications

| Attribute | Value |
|-----------|-------|
| **Technology** | Fibre-to-the-Business (FTTB) |
| **Max Throughput** | Up to 200 Mbps (current offering) |
| **Latency** | <5ms metro, <15ms national |
| **Contention** | 1:10 (low congestion) |
| **Symmetry** | True symmetrical speeds |
| **SLA** | 99.5% uptime with credits |
| **Packet Loss** | <0.1% |
| **Jitter** | <2ms |
| **MTU** | 1500 bytes |

### DFA Wholesale Pricing

| Speed | Installation (NRC) | Monthly (MRC) |
|-------|-------------------|---------------|
| 10 Mbps | R1,650 | R999 |
| 25 Mbps | R1,650 | R999 |
| 50 Mbps | R1,650 | R1,422 |
| 100 Mbps | R1,650 | R1,731 |
| 200 Mbps | R1,650 | R2,875 |

### Infrastructure Requirements

| Component | NRC | MRC | Notes |
|-----------|-----|-----|-------|
| GNNI Port (1Gbps) | R6,050 | R898 | Required |
| GNNI Port (10Gbps) | R6,050 | R3,300 | For scale |

### Technical Characteristics
- **Physical:** Fibre optic to premises
- **Protocol:** Ethernet handoff, /30 subnet standard
- **CPE:** Enterprise router included
- **Monitoring:** Proactive network monitoring

### CircleTel Advantage
- True symmetrical speeds (critical for cloud)
- 10-15% below competitors (Vox, Afrihost, RSAWeb)
- 5-10 day installation (vs 15-20 industry)
- 1:10 contention vs typical 1:20+

### Deployment Requirements
- DFA coverage check
- Site survey (R15,000 for complex)
- NTU installation
- Typical install time: 5-10 business days

### Ideal Use Cases
- Businesses with significant upload needs
- VoIP/UC deployments
- On-premises server hosting
- Enterprise SLA requirements
- Multi-site WAN connectivity

### Limitations
- Limited coverage (DFA footprint only)
- Not available in all areas
- Higher cost than FWA for same download speed
- Fibre build may extend timeline

---

## Peraso DUNE 60GHz mmWave

**Product Line:** ParkConnect DUNE
**Status:** Q2 2026 Launch

### Specifications

| Attribute | Value |
|-----------|-------|
| **Spectrum** | 60GHz (V-band, unlicensed) |
| **Max Throughput** | Up to 2 Gbps |
| **Latency** | <1ms |
| **Range** | <500m optimal |
| **LoS** | Line-of-sight REQUIRED |
| **Mesh** | Mesh-capable |

### Technical Characteristics
- **Beamwidth:** Narrow (high gain)
- **Weather:** Rain fade at extreme distances
- **Interference:** Minimal (oxygen absorption limits range)
- **Power:** Low power consumption

### CircleTel Advantage
- Highest margins in portfolio (54-75%)
- Ultra-low latency (<1ms)
- Shared backhaul economics
- Premium positioning

### Deployment Requirements
- Office park or business park setting
- Line-of-sight between all nodes
- Central backhaul (fibre or FWA)
- Base station installation
- Per-tenant CPE installation

### Ideal Use Cases
- Office parks
- Business parks
- Industrial parks
- Campus environments
- Multi-tenant buildings

### Limitations
- **Line-of-sight mandatory** — no exceptions
- <500m optimal range
- Weather can impact long links
- Requires park/campus setting

---

## MTN LTE/5G

**Product Line:** CircleConnect Wireless
**Status:** ACTIVE

### Specifications

| Attribute | Value |
|-----------|-------|
| **Technology** | LTE / 5G NR |
| **Throughput (LTE)** | 10-150 Mbps typical |
| **Throughput (5G)** | 50-500 Mbps typical |
| **Latency (LTE)** | 20-50ms |
| **Latency (5G)** | 10-30ms |
| **Coverage** | Nationwide |

### Technical Characteristics
- **Spectrum:** Multiple bands (MTN allocation)
- **Contention:** Shared with consumer traffic
- **Upload:** 10-30% of download speed
- **Mobility:** Full mobility support

### CircleTel Advantage
- Same-day activation possible
- Nationwide coverage
- No infrastructure dependency
- Ideal for backup/failover

### Deployment Requirements
- Coverage check (signal strength)
- Router/MiFi device
- SIM provisioning
- Typical install: Same day to 2 days

### Ideal Use Cases
- Rapid deployment needs
- Backup connectivity
- Mobile workers
- Temporary sites
- Pop-up locations

### Limitations
- Variable performance (network congestion)
- Best-effort service (no SLA)
- Upload speeds limited
- Shared infrastructure

---

## Reyee 5GHz FWA

**Product Line:** AirLink FWA
**Status:** ACTIVE

### Specifications

| Attribute | Value |
|-----------|-------|
| **Spectrum** | 5GHz (unlicensed) |
| **Max Throughput** | Up to 500 Mbps |
| **Latency** | 5-15ms |
| **Range** | Variable (site-dependent) |
| **LoS** | Preferred but some NLOS |
| **Contention** | Shared sector capacity |

### Technical Characteristics
- **Self-managed:** CircleTel owns infrastructure
- **Flexibility:** Deploy where needed
- **Interference:** Possible in unlicensed band
- **Scalability:** Add APs as needed

### CircleTel Advantage
- Control own infrastructure
- Deploy in areas without MTN Tarana
- Best margins in entry-level segment (58-81%)
- Flexible coverage expansion

### Deployment Requirements
- Site survey
- Tower/site access (owned or leased)
- Access point installation
- CPE installation at customer
- Typical install: 3-7 days

### Ideal Use Cases
- Areas without MTN Tarana coverage
- Price-sensitive SMEs
- Secondary/branch locations
- Starter connectivity

### Limitations
- Unlicensed spectrum (potential interference)
- Variable performance
- Infrastructure investment required
- Not suitable for enterprise SLA needs

---

## MTN FTTH Wholesale

**Product Line:** HomeFibreConnect (SUNSET)
**Status:** SUNSET — No new sales

### Specifications

| Attribute | Value |
|-----------|-------|
| **Technology** | GPON |
| **Max Throughput** | Up to 1 Gbps |
| **Latency** | <5ms |
| **Market** | Residential |

### Why Sunset
- Low margins (4-26%)
- Commodity market
- Strategic focus on business segment
- High competition

---

## Technology Comparison Matrix

| Technology | Speed | Latency | Symmetry | Coverage | Margin | Best For |
|------------|-------|---------|----------|----------|--------|----------|
| **Tarana G1** | Up to 1G | <5ms | 4:1 | MTN footprint | 41-52% | SME business |
| **DFA FTTB** | Up to 1G | <3ms | Yes | DFA footprint | 31-41% | Enterprise |
| **DUNE 60G** | Up to 2G | <1ms | Yes | LoS <500m | 54-75% | Office parks |
| **LTE** | 10-150M | 20-50ms | No | Nationwide | 33-37% | Backup/rapid |
| **5G** | 50-500M | 10-30ms | No | Metro | 33-37% | High-speed mobile |
| **Reyee 5G** | Up to 500M | 5-15ms | Variable | Self-deployed | 58-81% | Budget entry |

---

## Technical Constraints

### PPPoE & Routing
- PPPoE termination on MTN Huawei BNG (not Echo SP)
- BGP sessions terminate on MTN BNG
- Echo SP Arista = Layer 2 only (cannot PPPoE)

### RADIUS Flow
```
Customer CPE → MTN BNG → Echo SP Proxy → Interstellio
                                        (circletel.co.za realm)
```

### NNI Design
- Single physical interconnect
- Carries AAA VLAN + IP Transit (WWW) VLAN

### Technology-Specific
- **Tarana:** 4:1 ratio set by MTN (not CircleTel)
- **DFA:** Genuinely symmetrical
- **LTE/5G:** Upload variable (10-30% of download)
- **DUNE:** Line-of-sight required, <500m optimal, mesh-capable

---

## Deployment Timeline Matrix

| Technology | Typical Timeline | Dependencies |
|------------|------------------|--------------|
| Tarana G1 | 2-5 days | Coverage, site survey |
| DFA FTTB | 2-4 weeks | Fibre availability |
| DUNE 60GHz | 1-2 weeks | Park setting, LoS |
| LTE/5G | Same day - 2 days | Coverage, device |
| Reyee 5GHz | 3-7 days | Site access, infrastructure |

---

**Version:** 1.0.0
**Last Updated:** 2026-03-01
**Source:** products/solution-design.md Section 3

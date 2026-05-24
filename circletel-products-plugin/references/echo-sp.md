# Echo SP

Infrastructure and managed services provider - core network partner at Teraco.

---

## Quick Reference

| Field | Value |
|-------|-------|
| **Legal Entity** | Echo SP SA (Pty) Ltd |
| **Registration** | 2018/103951/07 |
| **VAT Number** | 4920285139 |
| **Relationship Type** | Infrastructure & Managed BNG Provider |
| **Location** | Teraco Data Environments (JHB, CPT) |
| **Service Schedule** | SS Q27988 (06 August 2025) |
| **Contract Term** | 12-month initial, auto-renews |
| **Source Doc** | `products/wholesale/echo-sp/Echo_SP_Service_Portfolio_Breakdown_v1_0.md` |

---

## Service Catalogue

### Service 1: Managed BNG (Core Service)

| Parameter | Value |
|-----------|-------|
| **Description** | RADIUS proxy, realm routing, session management |
| **Realm** | `circletel.co.za` -> Interstellio |
| **Setup Fee** | R0 (waived) |
| **Pricing Model** | Tiered per-user |
| **CircleTel Products** | ALL broadband products |

#### Pricing Tiers

| User Count | Price/User/Month |
|------------|------------------|
| 0-500 | R25.40 |
| 501-750 | R22.80 |
| 751-1,000 | R20.20 |

### Service 2: IP Transit

| Parameter | Value |
|-----------|-------|
| **Description** | Blended internet breakout via Tier 1 carriers |
| **Setup Fee** | R0 |
| **Pricing** | R7/Mbps committed |
| **Minimum** | 100 Mbps (R700/month) |

#### Scaling

| Commit | Monthly Cost | Typical Subs |
|--------|--------------|--------------|
| 100 Mbps | R700 | 25-50 |
| 500 Mbps | R3,500 | 100-300 |
| 1 Gbps | R7,000 | 300-750 |
| 5 Gbps | R35,000 | 750-2,000+ |

### Service 3: CGNAT

| Parameter | Value |
|-----------|-------|
| **Description** | Carrier-Grade NAT for IPv4 conservation |
| **Pricing** | Included with BNG |

### Service 4: Static IP Addresses

| Parameter | Value |
|-----------|-------|
| **Description** | Public IPv4 for business customers |
| **Pricing** | Per-IP allocation |

---

## Contract Terms

| Term | Value |
|------|-------|
| Initial Period | 12 months |
| Auto-Renewal | 12-month periods |
| Fixed-term Cancellation | 90 days notice before expiry |
| Month-to-month Cancellation | 30 days notice |
| Early Cancellation Penalty | Balance of remaining MRCs/NRCs |

---

## Cost Elements (for margin calculation)

| Cost Type | Amount | Frequency | Notes |
|-----------|--------|-----------|-------|
| BNG (0-500 users) | R25.40 | Per user/month | Tiered |
| BNG (501-750) | R22.80 | Per user/month | 10% saving |
| BNG (751-1000) | R20.20 | Per user/month | 20% saving |
| IP Transit | R7 | Per Mbps/month | Committed |

---

## Integration Points

| Component | Detail |
|-----------|--------|
| RADIUS Proxy 1 | radius1.sys.echosp.link (13.247.40.35) |
| RADIUS Proxy 2 | radius2.sys.echosp.link (13.244.49.198) |
| AAA Platform | Interstellio (realm: circletel.co.za) |
| Location | Teraco JB1, CT1 |

---

## Key Contacts

| Name | Role | Contact |
|------|------|---------|
| Aubrey Simmonds | Solutions | aubrey@echosp.co.za / +27 83 660 7579 |
| Herman Bronner | Technical | herman@echosp.co.za |
| Neil Dragt | RADIUS | neild@echosp.co.za |
| NetOps Team | Operations | netops@echosp.co.za |

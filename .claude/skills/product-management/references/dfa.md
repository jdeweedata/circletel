# DFA (Dark Fibre Africa)

Wholesale fibre infrastructure and managed connectivity services.

---

## Quick Reference

| Field | Value |
|-------|-------|
| **Legal Entity** | Dark Fibre Africa (Pty) Ltd |
| **Relationship Type** | Wholesale Fibre Infrastructure |
| **Coverage** | National metro and long-haul |
| **Contract Terms** | 1 to 15 years |
| **Pricing** | NRC + MRC (per metre or per port) |
| **Escalation** | CPI + 2% annually |
| **Source Doc** | `products/wholesale/dfa/DFA_Complete_Product_Portfolio_v1_0.md` |

---

## Service Catalogue

### Dark Fibre Products

#### Peregrine Metro (Intra-City)

| Parameter | Value |
|-----------|-------|
| **Description** | Dark fibre for metro backhaul |
| **Features** | Unlimited bandwidth, no throughput limits |
| **Max Float** | 150m from DFA infrastructure |
| **Pricing** | Per metre, term-based discounts |
| **Use Case** | ISP metro backbone, DC interconnect |

#### Peregrine Long Haul (Inter-City)

| Parameter | Value |
|-----------|-------|
| **Description** | Dark fibre for national backbone |
| **Use Case** | JHB-CPT, JHB-DBN routes |

#### Helios / Lumic / Titan

Additional dark fibre products for specific use cases. See source doc for details.

### Managed Connectivity

#### Calypte Metro

| Parameter | Value |
|-----------|-------|
| **Description** | Managed metro Ethernet |
| **Speeds** | 10 Mbps to 10 Gbps |
| **Use Case** | Branch connectivity |

#### Magellan E-Line / E-Access

| Parameter | Value |
|-----------|-------|
| **Description** | Point-to-point Ethernet |
| **Use Case** | Enterprise WAN |

### Colocation

#### Tachyon

| Parameter | Value |
|-----------|-------|
| **Description** | Colocation at DFA facilities |
| **Use Case** | Edge PoPs, aggregation nodes |

---

## Pricing Structure

### Peregrine Metro (per metre/month, excl. VAT)

| Distance | 1 Year | 3 Year | 5 Year | 10 Year | 15 Year |
|----------|--------|--------|--------|---------|---------|
| 0-500 km | R18.37 | R7.29 | R5.20 | R3.83 | R3.01 |
| 500-1000 km | R15.80 | R6.27 | R4.47 | R3.45 | R2.71 |
| >1000 km | R13.04 | R5.18 | R3.69 | R2.79 | R2.54 |

### Non-Recurring Charges (typical)

| Service | Cost |
|---------|------|
| Site survey | R15,000/endpoint |
| Installation | R25,000/endpoint |
| Testing & commissioning | R10,000/link |

---

## Contract Terms

| Term | Value |
|------|-------|
| Available Terms | 1, 2, 3, 4, 5, 10, 15 years |
| Early Termination | Full remaining contract value |
| Subleasing | Not permitted |
| Escalation | CPI + 2% annually |
| Renewal | Combines with initial term for better pricing |

---

## Cost Elements (for margin calculation)

| Cost Type | Amount | Frequency | Notes |
|-----------|--------|-----------|-------|
| Dark fibre (5yr) | R5.20/m | Monthly | Peregrine Metro |
| Dark fibre (10yr) | R3.83/m | Monthly | 26% saving vs 5yr |
| Site survey | R15,000 | Once | Per endpoint |
| Installation | R25,000 | Once | Per endpoint |
| Testing | R10,000 | Once | Per link |

### Example Costs

**ISP Metro Backbone (25 km, 5-year term):**
- MRC: 25,000m x R5.20 = R130,000/month
- Annual: R1,560,000

**DC Interconnect (8 km, 10-year term):**
- MRC: 8,000m x R3.83 = R30,640/month
- 79% saving vs 1-year term

---

## Integration Points

| Component | Detail |
|-----------|--------|
| Primary Use | BizFibreConnect backhaul |
| Feasibility | DFA feasibility portal |
| Provisioning | Manual via DFA sales |
| Lead Time | Subject to feasibility assessment |

---

## Use Cases for CircleTel

1. **Metro Backbone**: Connect PoPs across metros
2. **Data Centre Interconnect**: Primary/DR site links
3. **Enterprise WAN**: Managed Ethernet for corporate customers
4. **Edge Colocation**: Tachyon for aggregation nodes

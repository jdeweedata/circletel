Rule: product-economics
Loaded by: CLAUDE.md
Scope: Unit economics by channel, wholesale costs, commission tiers, COS floor, LTV/CAC

---

## Three Supply Channels

| Dimension | Tarana FWB (MTN Wholesale) | Arlan MTN (Reseller) | DFA (Dark Fibre Africa) |
|-----------|---------------------------|----------------------|------------------------|
| **CAPEX** | R20K+ NNI setup + R2,550/install | Zero | R6,150 GNNI NRC |
| **Wholesale** | R499-R699/customer/mo | R0 (commission model) | R1,003-R3,560/mo |
| **Retail** | R1,299-R1,899/mo | R1,100 avg (MTN price + markup) | R2,999-R7,999/mo |
| **Margin** | 37-46% | Commission + Markup (~R136/deal/mo) | 53-56% |
| **MSC** | R29,940-R179,640/mo (escalating) | None | None |
| **Revenue model** | Subscription (billed by CT) | Commission (paid by Arlan) + Markup | Subscription (billed by CT) |
| **Scaling** | Limited by MSC + infrastructure | Unlimited (national LTE/5G) | Limited by GNNI ports + buildings |
| **Effective from** | September 2025 | October 2025 | April 2026 |

## Tarana FWB Unit Economics

| Speed | Wholesale MRC | Retail Price | All-in Cost | Margin | Margin % |
|-------|-------------|-------------|-------------|--------|----------|
| 50/12.5 Mbps | R499 | R1,299 | R817 | R482 | 37.1% |
| 100/25 Mbps | R599 | R1,499 | R917 | R582 | 38.8% |
| 200/50 Mbps | R699 | R1,899 | R1,017 | R882 | 46.4% |

**All-in cost includes**: Wholesale + Static IP (R50) + BNG (R30) + Backhaul (R28) + BSS (R11) + Support (R10) + Install amortization (R213/12mo)

**Post-12-month**: Margin improves to ~54% when installation fully amortized.

## Arlan Commission Structure

| Monthly Subscription | MTN Rate | CircleTel (30%) | Per Deal/Month | 24-mo Contract Commission |
|---------------------|----------|-----------------|----------------|--------------------------|
| R0-R99 | 4.75% | 1.425% | ~R1 | ~R34 |
| R100-R199 | 5.75% | 1.725% | ~R3 | ~R62 |
| R200-R299 | 7.25% | 2.175% | ~R5 | ~R130 |
| R300-R499 | 8.75% | 2.625% | ~R10 | ~R252 |
| R500-R999 | 9.75% | 2.925% | ~R22 | ~R527 |
| R1,000-R1,999 | 11.75% | 3.525% | ~R53 | ~R1,269 |
| R2,000+ | 13.75% | 4.125% | ~R90 | ~R2,475 |

**Markup revenue (100% to CircleTel)**: Applied on top of MTN price, not shared with Arlan.

| Use Case | Markup % | Avg Revenue/Deal/Month |
|----------|----------|----------------------|
| IoT/M2M | 20% | ~R170 |
| Fleet Management | 18% | ~R155 |
| Data Connectivity | 15% | ~R140 |
| Backup Connectivity | 15% | ~R140 |
| Mobile Workforce | 15% | ~R140 |
| Voice Comms | 10% | ~R115 |
| Device Upgrade | 8% | ~R130 |
| Venue WiFi | 20% | ~R170 |

**Lifetime value**: Commissions continue indefinitely on renewals and upgrades.

## DFA Unit Economics (Effective April 2026)

| Speed | Wholesale (5yr) | Retail | Margin | Margin % |
|-------|----------------|--------|--------|----------|
| 25/25 Mbps | R650 | R1,899 | R1,249 | 65.8% |
| 50/50 Mbps | R750 | R2,499 | R1,749 | 70.0% |
| 100/100 Mbps | R950 | R2,999 | R2,049 | 68.3% |
| 200/200 Mbps | R1,200 | R4,499 | R3,299 | 73.3% |

**GNNI Port**: R950/mo MRC + R6,150 NRC (1Gbps). Amortize across customer base.

## Infrastructure Fixed Costs

| Component | Vendor | Monthly Cost | Notes |
|-----------|--------|-------------|-------|
| NNI CrossConnect (×2) | MTN/Teraco | R5,000 | 1Gbps each |
| BNG Service (Tier 1) | Echo SP | R30.30/subscriber | Drops to R20.20 at 1,000+ |
| IP Transit | Echo SP | R7/Mbps | Min 100 Mbps = R700 |
| CGNAT | Echo SP | R1,250 | 1 Gbps capacity |
| Static IP | Echo SP | R50/IP | Per address |
| BSS Platform | AgilityGIS | R10.96/subscriber | Billing + provisioning |

## Cost of Sale Floor (Per Subscriber)

| Scale | BNG | Transit | Backhaul | Support | BSS | **Total COS** |
|-------|-----|---------|----------|---------|-----|--------------|
| 100 users | R30.30 | R28 | R86 | R30 | R11 | **R185** |
| 300 users | R26.93 | R28 | R86 | R30 | R11 | **R182** |
| 1,000 users | R23.57 | R28 | R86 | R30 | R11 | **R179** |
| 1,500+ users | R20.20 | R28 | R86 | R30 | R11 | **R175** |

**Note**: Excludes access costs (Tarana/DFA wholesale) — add those per product.

## LTV/CAC Benchmarks

| Product | CAC | LTV (24mo) | LTV:CAC | Payback |
|---------|-----|-----------|---------|---------|
| SkyFibre SMB 100 | R2,550 | R35,976 | 14.1x | 3-4 months |
| SkyFibre SMB Full Bundle | R2,550 | R60,576 | 23.7x | 3-4 months |
| BizFibreConnect 100 | R2,500 | R71,976 | 28.8x | 2-3 months |
| Managed IT Professional | R3,500 | R143,976 | 41.1x | 2 months |
| ParkConnect DUNE | R8,167 | R45,576 | 5.6x | 5-6 months |
| Arlan MTN Deal (avg) | R0 | R3,264 | ∞ | Immediate |

## Add-on Module Margins

| Module | Monthly Fee | Cost | Margin % |
|--------|------------|------|----------|
| Managed Router | R149 | R75-R108 | 28-50% |
| Enhanced SLA (99.5%) | R249 | R150 | 40% |
| Premium SLA (99.9%) | R499 | R300 | 40% |
| 5G/LTE Failover | R399 | R220 | 45% |
| Email Hosting | R79-R129 | R40-R70 | 46-49% |
| Cloud Backup | R49-R179 | R20-R80 | 55-59% |
| Business VPN | R49-R89 | R20-R40 | 55-59% |
| Security Suite | R129 | R50 | 61% |

## Database References

- Wholesale costs: `product_wholesale_costs` table
- Commission tiers: `MTN_COMMISSION_TIERS` constant in `lib/types/mtn-dealer-products.ts`
- Markup rules: `MARKUP_RULES` constant in `lib/types/mtn-dealer-products.ts`
- Curated deals: `v_mtn_curated_deals` view (2,018 recommended deals)

# Wholesale Providers Overview

Quick reference for CircleTel's upstream connectivity and infrastructure partners.

Last updated: 2026-03-08

---

## Provider Summary

| Provider | Type | Key Services | Relationship |
|----------|------|--------------|--------------|
| **MTN Wholesale** | Access Network | FWB (Tarana G1), FTTH | NNI at Teraco JB1/CT1 |
| **Echo SP** | Infrastructure | Managed BNG, IP Transit, CGNAT | Core network partner |
| **DFA** | Fibre Infrastructure | Dark fibre, Metro Ethernet, Colo | Wholesale fibre |
| **Arlan** | Reseller | MTN LTE, 5G, Voice, IoT | Commission-based |

---

## Provider Type Taxonomy

### Access Network Providers
Provide last-mile connectivity to end customers.
- **MTN Wholesale**: FWB (6M homes), FTTH sites

### Infrastructure Providers
Provide core network services (BNG, transit, switching).
- **Echo SP**: Managed BNG, CGNAT, IP Transit at Teraco

### Fibre Infrastructure
Provide dark fibre and managed Ethernet services.
- **DFA**: Peregrine (dark fibre), Calypte (managed), Magellan (E-Line)

### Reseller Channels
Provide products via commission/markup model.
- **Arlan**: MTN Business products (LTE, 5G, voice, IoT)

---

## Quick Links

| Provider | Reference File | Source Docs |
|----------|---------------|-------------|
| MTN Wholesale | `mtn-wholesale.md` | `products/wholesale/mtn/` |
| Echo SP | `echo-sp.md` | `products/wholesale/echo-sp/` |
| DFA | `dfa.md` | `products/wholesale/dfa/` |
| Arlan | `arlan.md` | `products/wholesale/arlan/` |

---

## Cost Structure Comparison

| Provider | Pricing Model | Commitment | Billing |
|----------|--------------|------------|---------|
| MTN Wholesale | MSC + per-subscriber MRC | 24-month MSC | Monthly |
| Echo SP | Tiered per-user + capacity | 12-month initial | Monthly |
| DFA | NRC + MRC per metre/port | 1-15 year terms | Monthly |
| Arlan | Commission (30% of MTN) | Per-deal | By 25th monthly |

---

## CircleTel Products by Provider

| Product Line | MTN | Echo SP | DFA | Arlan |
|--------------|-----|---------|-----|-------|
| SkyFibre SMB | FWB | BNG | - | - |
| HomeFibreConnect | FTTH | BNG | - | - |
| BizFibreConnect | - | BNG | Dark Fibre | - |
| WorkConnect SOHO | FWB/FTTH | BNG | - | LTE/5G backup |
| CloudWiFi WaaS | - | BNG | - | - |
| Mobile/IoT | - | - | - | LTE, 5G, IoT SIMs |

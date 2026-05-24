# MTN Wholesale Direct

Wholesale connectivity services procured directly from MTN via NNI interconnect.

---

## Quick Reference

| Field | Value |
|-------|-------|
| **Legal Entity** | MTN South Africa (Wholesale Division) |
| **Relationship Type** | NNI Interconnect (Direct Wholesale) |
| **Interconnect Location** | Teraco JB1 (Johannesburg), CT1 (Cape Town) |
| **Core Partner** | Echo SP (Managed BNG) |
| **AAA Platform** | Interstellio (via Echo SP RADIUS proxy) |
| **Contract Term** | FWB: 24-month MSC / FTTH: per-site ongoing |
| **Source Doc** | `products/wholesale/mtn/MTN_Wholesale_Direct_Services_Spec_v1_0.md` |

---

## Service Catalogue

### Service 1: Fixed Wireless Broadband (FWB) - Tarana G1

| Parameter | Value |
|-----------|-------|
| **Technology** | Tarana G1 beamforming, licensed spectrum |
| **Coverage** | ~6 million homes nationally |
| **Pricing Model** | MSC + per-subscriber MRC |
| **Contract Term** | 24-month MSC schedule |
| **CircleTel Products** | SkyFibre SMB, AirLink, UmojaLink |

#### Active Speed Profiles (effective 1 July 2025)

| Speed | MRC (excl. VAT) | Status |
|-------|-----------------|--------|
| 50 Mbps | R499 | Active |
| 100 Mbps | R599 | Active |
| 200 Mbps | R699 | Active |

*Note: 5/10/20 Mbps retired from new sales 1 July 2025*

#### Setup & Equipment Costs

| Item | NRC | MRC |
|------|-----|-----|
| Setup + Licence (self-install) | R875 | - |
| MTN Installation (optional) | R2,000 | - |
| RN Device (CPE) | Included | - |
| Training (min 10 pax) | R10,000 | - |
| 1G NNI Port | R7,000 | R2,500 |

#### Backhaul Tiers

| Capacity | Monthly Cost |
|----------|--------------|
| 100 Mbps | Included |
| 1 Gbps | R12,425 |
| 5 Gbps | R62,125 |
| 10 Gbps | R124,251 |

### Service 2: FTTH Wholesale

| Parameter | Value |
|-----------|-------|
| **Technology** | Pure fibre, GPON |
| **Pricing Model** | Per-subscriber MRC |
| **Contract Term** | Per-site, ongoing |
| **CircleTel Products** | HomeFibreConnect |

---

## Contract Terms

### Minimum Spend Commitment (MSC) - FWB Only

24-month escalating commitment:

| Quarter | Period | NRC (start of Q) | Monthly MSC |
|---------|--------|------------------|-------------|
| Q1 | Months 1-3 | R8,750 | Actual spend |
| Q2 | Months 4-6 | R17,500 | R14,970 |
| Q3 | Months 7-9 | R26,250 | R29,940 |
| Q4 | Months 10-12 | R35,000 | R49,900 |
| Q5 | Months 13-15 | R43,750 | R74,850 |
| Q6 | Months 16-18 | R52,500 | R104,790 |
| Q7 | Months 19-21 | R61,250 | R139,720 |
| Q8 | Months 22-24 | R70,000 | R179,640 |

**Total 24-month commitment:** R2,111,400

---

## Cost Elements (for margin calculation)

| Cost Type | Amount | Frequency | Notes |
|-----------|--------|-----------|-------|
| FWB 50 Mbps | R499 | Per subscriber/month | Wholesale MRC |
| FWB 100 Mbps | R599 | Per subscriber/month | Wholesale MRC |
| FWB 200 Mbps | R699 | Per subscriber/month | Wholesale MRC |
| RN Setup | R875 | Per subscriber (once) | Self-install |
| NNI Port | R2,500 | Monthly | Fixed infrastructure |
| Backhaul 1 Gbps | R12,425 | Monthly | Above 100 Mbps included |

---

## Integration Points

| Component | Detail |
|-----------|--------|
| NNI Interconnect | Teraco JB1 (JHB), CT1 (CPT) |
| BNG Provider | Echo SP (Managed BNG) |
| AAA/RADIUS | Interstellio -> Echo SP proxy |
| Provisioning | Subscriber activation via Interstellio |

---

## Key Contacts

See `products/wholesale/mtn/MTN_Wholesale_Direct_Services_Spec_v1_0.md` Section 10 for contacts.

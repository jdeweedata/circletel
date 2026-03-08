# Wholesale Providers in Product Skills — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add MTN, Echo SP, DFA, and Arlan as wholesale providers in the product management skills system.

**Architecture:** Create reference files for each provider extracted from existing `products/wholesale/` docs. Update skill files to support `type: hardware | wholesale` filtering. No database changes — markdown only.

**Tech Stack:** Markdown files in `.claude/skills/product-management/references/`

**Design Doc:** `docs/plans/2026-03-08-wholesale-providers-in-product-skills-design.md`

---

## Task 1: Create Wholesale Providers Overview

**Files:**
- Create: `.claude/skills/product-management/references/wholesale-providers.md`

**Step 1: Create the overview file**

```markdown
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
| SkyFibre SMB | FWB | BNG | — | — |
| HomeFibreConnect | FTTH | BNG | — | — |
| BizFibreConnect | — | BNG | Dark Fibre | — |
| WorkConnect SOHO | FWB/FTTH | BNG | — | LTE/5G backup |
| CloudWiFi WaaS | — | BNG | — | — |
| Mobile/IoT | — | — | — | LTE, 5G, IoT SIMs |
```

**Step 2: Verify file created**

Run: `ls -la .claude/skills/product-management/references/wholesale-providers.md`
Expected: File exists with correct permissions

**Step 3: Commit**

```bash
git add .claude/skills/product-management/references/wholesale-providers.md
git commit -m "feat(skills): add wholesale providers overview reference"
```

---

## Task 2: Create MTN Wholesale Reference

**Files:**
- Create: `.claude/skills/product-management/references/mtn-wholesale.md`
- Source: `products/wholesale/mtn/MTN_Wholesale_Direct_Services_Spec_v1_0.md`

**Step 1: Create the MTN reference file**

```markdown
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

### Service 1: Fixed Wireless Broadband (FWB) — Tarana G1

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
| Setup + Licence (self-install) | R875 | — |
| MTN Installation (optional) | R2,000 | — |
| RN Device (CPE) | Included | — |
| Training (min 10 pax) | R10,000 | — |
| 1G NNI Port | R7,000 | R2,500 |

### Service 2: FTTH Wholesale

| Parameter | Value |
|-----------|-------|
| **Technology** | Pure fibre, GPON |
| **Pricing Model** | Per-subscriber MRC |
| **Contract Term** | Per-site, ongoing |
| **CircleTel Products** | HomeFibreConnect |

---

## Contract Terms

### Minimum Spend Commitment (MSC) — FWB Only

24-month escalating commitment:

| Quarter | Period | NRC (start of Q) | Monthly MSC |
|---------|--------|------------------|-------------|
| Q1 | Months 1–3 | R8,750 | Actual spend |
| Q2 | Months 4–6 | R17,500 | R14,970 |
| Q3 | Months 7–9 | R26,250 | R29,940 |
| Q4 | Months 10–12 | R35,000 | R49,900 |
| Q5 | Months 13–15 | R43,750 | R74,850 |
| Q6 | Months 16–18 | R52,500 | R104,790 |
| Q7 | Months 19–21 | R61,250 | R139,720 |
| Q8 | Months 22–24 | R70,000 | R179,640 |

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
| AAA/RADIUS | Interstellio → Echo SP proxy |
| Provisioning | Subscriber activation via Interstellio |

---

## Key Contacts

See `products/wholesale/mtn/MTN_Wholesale_Direct_Services_Spec_v1_0.md` Section 10 for contacts.
```

**Step 2: Verify file created**

Run: `ls -la .claude/skills/product-management/references/mtn-wholesale.md`
Expected: File exists

**Step 3: Commit**

```bash
git add .claude/skills/product-management/references/mtn-wholesale.md
git commit -m "feat(skills): add MTN wholesale reference"
```

---

## Task 3: Create Echo SP Reference

**Files:**
- Create: `.claude/skills/product-management/references/echo-sp.md`
- Source: `products/wholesale/echo-sp/Echo_SP_Service_Portfolio_Breakdown_v1_0.md`

**Step 1: Create the Echo SP reference file**

```markdown
# Echo SP

Infrastructure and managed services provider — core network partner at Teraco.

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
| **Realm** | `circletel.co.za` → Interstellio |
| **Setup Fee** | R0 (waived) |
| **Pricing Model** | Tiered per-user |
| **CircleTel Products** | ALL broadband products |

#### Pricing Tiers

| User Count | Price/User/Month |
|------------|------------------|
| 0–500 | R25.40 |
| 501–750 | R22.80 |
| 751–1,000 | R20.20 |

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
| 100 Mbps | R700 | 25–50 |
| 500 Mbps | R3,500 | 100–300 |
| 1 Gbps | R7,000 | 300–750 |
| 5 Gbps | R35,000 | 750–2,000+ |

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
| BNG (0–500 users) | R25.40 | Per user/month | Tiered |
| BNG (501–750) | R22.80 | Per user/month | 10% saving |
| BNG (751–1000) | R20.20 | Per user/month | 20% saving |
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
```

**Step 2: Verify file created**

Run: `ls -la .claude/skills/product-management/references/echo-sp.md`
Expected: File exists

**Step 3: Commit**

```bash
git add .claude/skills/product-management/references/echo-sp.md
git commit -m "feat(skills): add Echo SP reference"
```

---

## Task 4: Create DFA Reference

**Files:**
- Create: `.claude/skills/product-management/references/dfa.md`
- Source: `products/wholesale/dfa/DFA_Complete_Product_Portfolio_v1_0.md`

**Step 1: Create the DFA reference file**

```markdown
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
| **Source Doc** | `products/wholesale/dfa/DFA_Complete_Product_Portfolio_v1_0.md` |

---

## Service Catalogue

### Dark Fibre Products

#### Peregrine Metro (Intra-City)

| Parameter | Value |
|-----------|-------|
| **Description** | Dark fibre for metro backhaul |
| **Features** | Unlimited bandwidth, no throughput limits |
| **Pricing** | Per metre, term-based discounts |
| **Use Case** | ISP metro backbone, DC interconnect |

**MRC per metre (5-year term):** R5.20

#### Peregrine Long Haul (Inter-City)

| Parameter | Value |
|-----------|-------|
| **Description** | Dark fibre for national backbone |
| **Use Case** | JHB-CPT, JHB-DBN routes |

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

### Peregrine Metro (per metre/month)

| Distance | 1 Year | 3 Year | 5 Year | 10 Year |
|----------|--------|--------|--------|---------|
| 0–500 km | R18.37 | R7.29 | R5.20 | R3.83 |
| 500–1000 km | R15.80 | R6.27 | R4.47 | R3.45 |
| >1000 km | R13.04 | R5.18 | R3.69 | R2.79 |

### NRC (typical)

| Service | Cost |
|---------|------|
| Site survey | R15,000/endpoint |
| Installation | R25,000/endpoint |
| Testing | R10,000/link |

---

## Contract Terms

| Term | Value |
|------|-------|
| Available Terms | 1, 2, 3, 4, 5, 10, 15 years |
| Early Termination | Full remaining contract value |
| Subleasing | Not permitted |
| Escalation | CPI + 2% annually |

---

## Cost Elements (for margin calculation)

| Cost Type | Amount | Frequency | Notes |
|-----------|--------|-----------|-------|
| Dark fibre (5yr) | R5.20/m | Monthly | Peregrine Metro |
| Dark fibre (10yr) | R3.83/m | Monthly | 26% saving vs 5yr |
| Site survey | R15,000 | Once | Per endpoint |
| Installation | R25,000 | Once | Per endpoint |

---

## Integration Points

| Component | Detail |
|-----------|--------|
| Primary Use | BizFibreConnect backhaul |
| Feasibility | DFA feasibility portal |
| Provisioning | Manual via DFA sales |
```

**Step 2: Verify file created**

Run: `ls -la .claude/skills/product-management/references/dfa.md`
Expected: File exists

**Step 3: Commit**

```bash
git add .claude/skills/product-management/references/dfa.md
git commit -m "feat(skills): add DFA reference"
```

---

## Task 5: Create Arlan Reference

**Files:**
- Create: `.claude/skills/product-management/references/arlan.md`
- Source: `products/wholesale/arlan/Arlan_Commission_Analysis_v1.0.md`

**Step 1: Create the Arlan reference file**

```markdown
# Arlan Communications

MTN reseller partnership for mobile/IoT products.

---

## Quick Reference

| Field | Value |
|-------|-------|
| **Legal Entity** | Arlan Communications (PTY) LTD T/A MTN Ballito |
| **Relationship Type** | Reseller/Agent |
| **Agreement Date** | 29 September 2025 |
| **Commission Share** | 30% of MTN commissions |
| **Contract Term** | 24 months (per deal) |
| **Payment** | By 25th of each month |
| **Source Doc** | `products/wholesale/arlan/Arlan_Commission_Analysis_v1.0.md` |

---

## Service Catalogue

### Business Voice Contracts

| Product | Monthly Range | Commission |
|---------|---------------|------------|
| Business Voice Starter | R299–R499 | 8.75% |
| Business Voice Standard | R500–R799 | 9.75% |
| Business Voice Premium | R800–R999 | 9.75% |
| Enterprise Voice | R1,000–R1,999 | 11.75% |

### Business Data Solutions

| Product | Monthly Range | Commission |
|---------|---------------|------------|
| Data SIM Only | R149–R399 | 5.75%–8.75% |
| LTE Router Bundle | R499–R799 | 8.75%–9.75% |
| 5G Business Router | R899–R1,499 | 9.75%–11.75% |

### Mobile Devices

| Product | Monthly Range | Commission |
|---------|---------------|------------|
| Samsung A-Series | R299–R549 | 7.25%–9.75% |
| Samsung S-Series | R899–R1,899 | 9.75%–11.75% |
| iPhone Standard | R799–R1,299 | 9.75%–11.75% |
| iPhone Pro/Max | R1,299–R2,499 | 11.75%–13.75% |

### IoT & M2M

| Product | Monthly Range | Commission |
|---------|---------------|------------|
| IoT SIM Basic | R49–R99 | 4.75% |
| IoT SIM Standard | R100–R199 | 5.75% |
| M2M Fleet SIM | R149–R299 | 5.75%–7.25% |
| Industrial IoT | R200–R399 | 7.25%–8.75% |

---

## Commission Structure

### MTN Tiers (CircleTel receives 30%)

| Monthly Subscription | MTN Rate | CircleTel Share |
|---------------------|----------|-----------------|
| R0–R99.99 | 4.75% | 1.425% |
| R100–R199.99 | 5.75% | 1.725% |
| R200–R299.99 | 7.25% | 2.175% |
| R300–R499.99 | 8.75% | 2.625% |
| R500–R999.99 | 9.75% | 2.925% |
| R1,000–R1,999.99 | 11.75% | 3.525% |
| R2,000+ | 13.75% | 4.125% |

### Markup Opportunity

- CircleTel can sell above Arlan base price
- Markup revenue is 100% CircleTel's
- No maximum markup specified
- Commission calculated on retail price charged

---

## Contract Terms

| Term | Value |
|------|-------|
| Standard Contract | 24 months |
| Commission Basis | Net subscription (excl. devices, VAT) |
| Lifetime Value | Commissions continue on renewals |
| Payment Schedule | By 25th monthly |

---

## Cost Elements (for margin calculation)

| Cost Type | Calculation | Notes |
|-----------|-------------|-------|
| Product Cost | Arlan base price | Pass-through |
| CircleTel Commission | 30% × MTN rate × contract value | Recurring |
| Markup Revenue | Retail - Base | 100% retained |

---

## Integration Points

| Component | Detail |
|-----------|--------|
| Ordering | Via Arlan sales team |
| Provisioning | MTN network |
| Billing | Arlan invoices CircleTel |
| Target Market | SMB mobile, IoT, fleet management |
```

**Step 2: Verify file created**

Run: `ls -la .claude/skills/product-management/references/arlan.md`
Expected: File exists

**Step 3: Commit**

```bash
git add .claude/skills/product-management/references/arlan.md
git commit -m "feat(skills): add Arlan reference"
```

---

## Task 6: Update Main Product Management Skill

**Files:**
- Modify: `.claude/skills/product-management/SKILL.md`

**Step 1: Read current file**

Run: `cat .claude/skills/product-management/SKILL.md`

**Step 2: Add wholesale providers section**

Add after the "Available Sub-Skills" table (around line 30):

```markdown
## Supplier Types

| Type | Suppliers | Focus |
|------|-----------|-------|
| **Hardware** | Scoop, MiRO, Nology | CPE, routers, APs, networking equipment |
| **Wholesale** | MTN, Echo SP, DFA, Arlan | Connectivity, infrastructure, services |

## Wholesale Providers

| Provider | Services | Reference |
|----------|----------|-----------|
| **MTN Wholesale** | FWB (Tarana), FTTH | `references/mtn-wholesale.md` |
| **Echo SP** | Managed BNG, IP Transit | `references/echo-sp.md` |
| **DFA** | Dark Fibre, Metro Ethernet | `references/dfa.md` |
| **Arlan** | MTN LTE, 5G, IoT (reseller) | `references/arlan.md` |

**Quick Command:** `/product-wholesale` — Browse wholesale provider services
```

**Step 3: Update Quick Start Menu**

Add to the Quick Start Menu section:

```markdown
/product-wholesale    → Browse wholesale provider services and contracts
```

**Step 4: Commit**

```bash
git add .claude/skills/product-management/SKILL.md
git commit -m "feat(skills): add wholesale providers to main product skill"
```

---

## Task 7: Update Browse Suppliers Skill

**Files:**
- Modify: `.claude/skills/product-management/browse-suppliers/SKILL.md`

**Step 1: Read current file**

Run: `cat .claude/skills/product-management/browse-suppliers/SKILL.md`

**Step 2: Add type filter to Available Suppliers section**

Update the "Available Suppliers" section (around line 22) to:

```markdown
## Supplier Types

| Type | Description |
|------|-------------|
| `hardware` | Physical products with SKUs (Scoop, MiRO, Nology) |
| `wholesale` | Connectivity services (MTN, Echo SP, DFA, Arlan) |
| `all` | Both types (default) |

## Hardware Suppliers

| Supplier | Focus | Sync Service | Data |
|----------|-------|--------------|------|
| **Scoop Distribution** | Networking, security | `lib/suppliers/scoop-sync.ts` | Database |
| **MiRO Distribution** | Hardware, CPE, DUNE | `lib/suppliers/miro/` | Database |
| **Nology** | Enterprise hardware | `lib/suppliers/nology/` | Database |

## Wholesale Providers

| Provider | Focus | Reference |
|----------|-------|-----------|
| **MTN Wholesale** | FWB, FTTH | `references/mtn-wholesale.md` |
| **Echo SP** | BNG, IP Transit | `references/echo-sp.md` |
| **DFA** | Dark Fibre | `references/dfa.md` |
| **Arlan** | MTN Reseller | `references/arlan.md` |
```

**Step 3: Add type filter to workflow**

Add to Step 1 (Define Search Criteria):

```markdown
- `type` — `hardware`, `wholesale`, or `all` (default: all)
```

**Step 4: Add example queries for wholesale**

Add to Example Queries:

```markdown
"Browse wholesale providers"
→ type=wholesale

"What services does Echo SP provide?"
→ type=wholesale, search=echo sp
```

**Step 5: Commit**

```bash
git add .claude/skills/product-management/browse-suppliers/SKILL.md
git commit -m "feat(skills): add wholesale type filter to browse-suppliers"
```

---

## Task 8: Final Verification

**Step 1: Verify all files exist**

```bash
ls -la .claude/skills/product-management/references/
```

Expected output should show:
- `competitor-benchmarks.md` (existing)
- `wholesale-providers.md` (new)
- `mtn-wholesale.md` (new)
- `echo-sp.md` (new)
- `dfa.md` (new)
- `arlan.md` (new)

**Step 2: Verify git status**

```bash
git log --oneline -7
```

Expected: 7 new commits for this feature

**Step 3: Test skill invocation**

Ask Claude: "What wholesale providers does CircleTel use?"

Expected: Claude reads `references/wholesale-providers.md` and presents the summary.

**Step 4: Create summary commit (optional)**

If you want to squash into single commit:

```bash
git log --oneline -7  # Note the commits
# Keep as separate commits for clarity
```

---

## Success Criteria Checklist

- [ ] `wholesale-providers.md` created with overview
- [ ] `mtn-wholesale.md` created with services and MSC
- [ ] `echo-sp.md` created with BNG pricing tiers
- [ ] `dfa.md` created with fibre products
- [ ] `arlan.md` created with commission structure
- [ ] Main `SKILL.md` updated with wholesale section
- [ ] `browse-suppliers/SKILL.md` updated with type filter
- [ ] All files committed to git

---

## Estimated Time

| Task | Time |
|------|------|
| Task 1: Wholesale Overview | 5 min |
| Task 2: MTN Reference | 5 min |
| Task 3: Echo SP Reference | 5 min |
| Task 4: DFA Reference | 5 min |
| Task 5: Arlan Reference | 5 min |
| Task 6: Update Main Skill | 3 min |
| Task 7: Update Browse Skill | 3 min |
| Task 8: Verification | 2 min |
| **Total** | **~33 min** |

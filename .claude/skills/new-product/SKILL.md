---
name: new-product
description: Generate complete CircleTel product documentation (CPS, BRD, FSD, One-Pager) through interactive Q&A. Triggers when creating a new product, adding to the product catalogue, generating product specs, or running /new-product.
version: 1.0.0
dependencies: solution-design, brand-design
---

# New Product Documentation Generator

Generate a complete CircleTel product documentation set through guided Q&A — producing all four document types (Commercial Product Spec, Business Rules Document, Functional Specification, and Sales One-Pager) ready to commit to the product catalogue.

## When This Skill Activates

Invoke when:
- Creating documentation for a new product or service
- Adding a new product to the CircleTel catalogue
- Running `/new-product` command
- Generating a Commercial Product Spec (CPS), BRD, FSD, or One-Pager
- The user says "new product docs", "product documentation", "generate product spec", "create product spec"

**Keywords**: new product, product docs, product spec, CPS, BRD, FSD, one-pager, product catalogue, add product

---

## Quick Start

```bash
/new-product
```

Or simply say: **"create documentation for [product name]"**

---

## The Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. Q&A  →  2. VALIDATE  →  3. GENERATE  →  4. PLACE FILES  →  5. INDEX   │
│  5 phases    Margins &       CPS → BRD →     products/ dir     README.md   │
│              compliance      FSD → One-Pager                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Product Identity

Ask all questions in this phase in a single message. Do NOT proceed until all are answered.

| # | Question | Variable | Validation |
|---|----------|----------|------------|
| 1 | Product name | `PRODUCT_NAME` | e.g., "FleetConnect", "SkyFibre Enterprise" |
| 2 | Short product code (UPPERCASE, no spaces) | `PRODUCT_CODE` | e.g., FLEETCONN, SKYFIBRE-ENT. Used in document references. |
| 3 | Category | `CATEGORY` | One of: `connectivity`, `bundles`, `managed-it`, `cloud-hosting` |
| 4 | Subcategory (if connectivity) | `SUBCATEGORY` | e.g., `fixed-wireless`, `fibre`, `soho`, `wifi-as-a-service`, `residential`. Leave blank for other categories. |
| 5 | One-line tagline | `TAGLINE` | e.g., "Enterprise connectivity for growing businesses" |
| 6 | Target market | `TARGET_MARKET` | e.g., "SME 5-50 staff", "Fleet operators", "Residential" |
| 7 | Primary target verticals (3-5) | `VERTICALS` | e.g., "Professional services, Healthcare, Retail" |

---

## Phase 2: Architecture & Technology

Ask all questions in a single message.

| # | Question | Variable |
|---|----------|----------|
| 1 | What is the underlying technology/network? | `TECHNOLOGY` — e.g., MTN Tarana G1 FWB, DFA FTTB, hybrid FWB+5G, cloud VPS |
| 2 | What are the bundle components? (if bundle product) | `COMPONENTS` — list each component with its provider and role |
| 3 | Key technical specs (speeds, latency, contention, data caps) | `TECH_SPECS` |
| 4 | Hardware/CPE details (model names, dealer cost, customer-owned or CircleTel property?) | `CPE_DETAILS` — **Tip**: If you don't know which CPE/hardware to use, run `/product-search {device type}` to search Scoop, MiRO, Nology, and Rectron before answering. |
| 5 | Which external systems will this product integrate with? | `INTEGRATIONS` — e.g., MTN Wholesale Portal, Echo SP BNG, Interstellio RADIUS, Ruijie Cloud, AgilityGIS BSS |

---

## Phase 3: Pricing & Economics

Ask all questions in a single message. **This is the most important phase** — accuracy here drives all margin calculations.

| # | Question | Variable |
|---|----------|----------|
| 1 | How many pricing tiers? Name and describe each tier (speed/spec + retail price excl. VAT) | `TIERS` |
| 2 | For each tier, what are the wholesale/infrastructure cost components? | `WHOLESALE_COSTS` — list: access/wholesale cost, any BNG/CGNAT/IP costs, BSS fee, support allocation, hardware amortisation |
| 3 | Once-off charges (installation, setup, SIM activation) | `NRC_ITEMS` |
| 4 | Add-on modules available (name, description, retail price, cost) | `ADDONS` |
| 5 | Contract terms offered (MTM, 12-month, 24-month) and any discounts | `CONTRACT_TERMS` |
| 6 | Partner commission structure | `COMMISSIONS` — if applicable; otherwise "standard CircleTel partner tiers" |

---

## Phase 4: SLA & Operations

Ask all questions in a single message.

| # | Question | Variable |
|---|----------|----------|
| 1 | SLA levels per tier (uptime %, support hours, fault response, service credits) | `SLA_LEVELS` |
| 2 | Fair usage policy — uncapped or capped? FUP thresholds? | `FUP` |
| 3 | Installation steps and timeline | `INSTALLATION` — list each step with duration and total time |
| 4 | Support channels per tier (WhatsApp hours, phone, email response time, on-site response) | `SUPPORT` |

---

## Phase 5: Positioning & Sales

Ask all questions in a single message.

| # | Question | Variable |
|---|----------|----------|
| 1 | 3-5 key differentiators (vs competitors) | `DIFFERENTIATORS` |
| 2 | 2-3 competitor comparisons (competitor name, their price/feature vs CircleTel) | `COMPETITORS` |
| 3 | Customer problem statement (for one-pager) — quantify if possible | `PROBLEM` |
| 4 | Elevator pitch (2-3 sentences) | `PITCH` |
| 5 | 4-5 common objections and responses | `OBJECTIONS` |
| 6 | Risk register items (risk, likelihood: Low/Medium/High, impact, mitigation) | `RISKS` |

---

## Pre-Generation: Margin Validation

Before generating any documents, calculate and validate margins for every tier:

```
gross_margin_r   = retail_price - total_direct_cost
gross_margin_pct = (gross_margin_r / retail_price) × 100
```

**Margin guardrails** (from `.claude/rules/margin-guardrails.md`):
- ≥ 35%: Healthy — auto-approved
- 25-34%: Marginal — proceed with note
- < 25%: **WARN** — flag to user before proceeding. Advise that CFO approval is required.
- < 20%: **STOP** — do not generate documents. Pricing must be revised.

Also auto-calculate:
- VAT-inclusive prices: `ROUND(retail_price × 1.15)` — whole rands
- LTV: `gross_margin_r × avg_lifetime_months`
- LTV:CAC: `LTV / CAC`
- Payback period: `CAC / gross_margin_r` months

---

## Document Generation

Once Q&A is complete and margins validated, generate documents in this order:

### Generation Rules (apply to all documents)

1. **Read the gold standard before generating each doc type** — use the exact formatting, table structure, and section numbering style from the reference files listed below.
2. **Document reference format**: `CT-[TYPE]-[PRODUCT_CODE]-[YEAR]-001` where:
   - TYPE: CPS, BRD, or FSD
   - PRODUCT_CODE: as provided in Phase 1
   - YEAR: current year (e.g., 2026)
3. **Date format**: `DD Month YYYY` (e.g., "03 April 2026")
4. **Cross-references**: Each document's metadata must list its companion documents with correct reference codes.
5. **Footer** (all documents): `*CircleTel (Pty) Ltd — "Connecting Today, Creating Tomorrow"*`
6. **No placeholder text** in final output — every `{{VARIABLE}}` must be filled with actual data.

### Step 1: Generate CPS

**Template**: `.claude/templates/products/CPS_TEMPLATE.md`
**Gold standard**: `products/bundles/BusinessComplete_Commercial_Product_Spec_v1_0.md`
**File name**: `{ProductName}_Commercial_Product_Spec_v1_0.md`
**Output path**: `products/[CATEGORY]/[SUBCATEGORY]/`

Read the gold standard CPS, then generate the full CPS by filling in all template sections with Q&A data. Include all 18 sections. Do not abbreviate or skip sections.

### Step 2: Generate BRD

**Template**: `.claude/templates/products/BRD_TEMPLATE.md`
**Gold standard**: `products/connectivity/fixed-wireless/SkyFibre_SMB_Business_Rules_Document_v1_0.md`
**File name**: `{ProductName}_Business_Rules_Document_v1_0.md`
**Output path**: Same directory as CPS

Read the gold standard BRD, then generate the full BRD. Use the rule-ID table convention throughout:
- Customer Eligibility: CE-xxx
- Technical/Coverage: TC-xxx (connectivity) or SA-xxx (service availability)
- Product Selection: PS-xxx
- Module Dependency: MD-xxx
- Pricing Rules: PR-xxx
- Billing Rules: BR-xxx
- Contract: CC-xxx
- Provisioning: PV-xxx
- SLA: SL-xxx
- Fair Usage: FU-xxx
- Upgrade/Downgrade: UD-xxx
- Churn: CH-xxx
- Partner: PA-xxx
- Regulatory: RC-xxx

### Step 3: Generate FSD

**Template**: `.claude/templates/products/FSD_TEMPLATE.md`
**Gold standard**: `products/connectivity/fixed-wireless/SkyFibre_SMB_Functional_Specification_v1_0.md`
**File name**: `{ProductName}_Functional_Specification_v1_0.md`
**Output path**: Same directory as CPS

Read the gold standard FSD, then generate the full FSD. Include:
- SQL `CREATE TABLE` statements for all product-specific tables
- ASCII architecture diagrams for the integration map
- State machine diagram for the order lifecycle
- TypeScript interfaces for all API contracts
- Real SQL queries for reporting and margin monitoring

For sections that require product-specific engineering detail not available from Q&A data, generate the section following the existing patterns from the gold standard, and add a note: `<!-- TODO: Engineering review required for [specific detail] -->`

### Step 4: Generate One-Pager

**Template**: `.claude/templates/products/ONE_PAGER_TEMPLATE.md`
**Gold standard**: `products/bundles/sales-collateral/BusinessComplete_OnePager.md`
**File name**: `{ProductName}_OnePager.md`
**Output path**: `products/[CATEGORY]/[SUBCATEGORY]/sales-collateral/`

Keep it to one tight page. Lead with the problem, solve it with the product, make the comparison vivid, and end with a compelling pitch. Use the contact constants: WhatsApp 082 487 3900, sales@circletel.co.za.

---

## File Placement

```
products/
└── [CATEGORY]/
    └── [SUBCATEGORY]/          ← create if it doesn't exist
        ├── {ProductName}_Commercial_Product_Spec_v1_0.md
        ├── {ProductName}_Business_Rules_Document_v1_0.md
        ├── {ProductName}_Functional_Specification_v1_0.md
        └── sales-collateral/   ← create if it doesn't exist
            └── {ProductName}_OnePager.md
```

**Category → path mapping:**
| Category | Path |
|----------|------|
| connectivity + fixed-wireless | `products/connectivity/fixed-wireless/` |
| connectivity + fibre | `products/connectivity/fibre/` |
| connectivity + soho | `products/connectivity/soho/` |
| connectivity + wifi-as-a-service | `products/connectivity/wifi-as-a-service/` |
| connectivity + residential | `products/connectivity/residential/` |
| bundles | `products/bundles/` |
| managed-it | `products/managed-it/` |
| cloud-hosting | `products/cloud-hosting/` |

---

## README Update

After writing all 4 files, update `products/README.md`:

1. Find the correct category section (e.g., `### Fixed Wireless (SkyFibre SMB, DUNE 60GHz)`)
2. Add table rows for each document:

```markdown
| [Product Name Doc Type](relative/path/to/file.md) | Brief description |
```

3. For bundles, use the expanded table format:
```markdown
| **Product Name** | Target market | [CPS v1.0](path/to/file.md) | ACTIVE |
```

4. Update `**Last Updated:** YYYY-MM-DD` at the bottom of README.md.

---

## Validation Checklist

Run this checklist before declaring the task complete:

- [ ] All 4 files written to correct paths
- [ ] Document references are consistent across all 4 docs (CT-CPS, CT-BRD, CT-FSD all reference each other correctly)
- [ ] All margin calculations verified (retail - cost = margin shown, margin % = margin/retail × 100)
- [ ] All VAT-inclusive prices = retail × 1.15 (rounded to whole rands)
- [ ] No `{{VARIABLE}}` placeholders remain in any generated file
- [ ] No `<!-- TODO -->` comments in CPS or BRD (only acceptable in FSD for complex engineering sections)
- [ ] Footer present on all 4 documents
- [ ] README.md updated with correct relative links (verify links resolve to actual file paths)
- [ ] If any tier margin < 25%: user has been warned

---

## Gold Standard Reference Files

Always read these before generating each document type:

| Doc Type | Gold Standard |
|----------|--------------|
| CPS | `products/bundles/BusinessComplete_Commercial_Product_Spec_v1_0.md` |
| BRD | `products/connectivity/fixed-wireless/SkyFibre_SMB_Business_Rules_Document_v1_0.md` |
| FSD | `products/connectivity/fixed-wireless/SkyFibre_SMB_Functional_Specification_v1_0.md` |
| One-Pager | `products/bundles/sales-collateral/BusinessComplete_OnePager.md` |

For non-connectivity products, also read the appropriate category example:
- Managed IT: `products/managed-it/CircleTel_Managed_IT_Services_Commercial_Product_Spec_v2_0.md`
- Cloud Hosting: `products/cloud-hosting/CircleCloud_Hosting_Commercial_Product_Spec_v1_0.md`

---

## Templates Location

All templates at: `.claude/templates/products/`

```
.claude/templates/products/
├── CPS_TEMPLATE.md         # 18-section Commercial Product Spec
├── BRD_TEMPLATE.md         # 19-section Business Rules Document
├── FSD_TEMPLATE.md         # 20-section Functional Specification
└── ONE_PAGER_TEMPLATE.md   # 9-section Sales One-Pager
```

---

## Example Output

For a product named "FleetConnect" with code "FLEETCONN" in bundles category:

```
products/bundles/FleetConnect_Commercial_Product_Spec_v1_0.md
products/bundles/FleetConnect_Business_Rules_Document_v1_0.md
products/bundles/FleetConnect_Functional_Specification_v1_0.md
products/bundles/sales-collateral/FleetConnect_OnePager.md
```

Document references:
- CPS: `CT-CPS-FLEETCONN-2026-001`
- BRD: `CT-BRD-FLEETCONN-2026-001`
- FSD: `CT-FSD-FLEETCONN-2026-001`

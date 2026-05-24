---
name: Doc Generation
description: Generate complete product documentation suite - Commercial Spec (CPS), Business Rules (BRD), Functional Spec (FSD)
version: 1.0.0
dependencies: none
---

# Documentation Generation

Skill for generating complete product documentation following CircleTel's established patterns. Creates CPS, BRD, and FSD documents.

## When This Skill Activates

This skill automatically activates when you:
- Need to create product documentation
- Want to generate a Commercial Product Spec
- Need Business Rules or Functional Specs
- Say `/product-docs` with a product name

**Keywords**: product docs, generate documentation, commercial spec, business rules, functional spec, CPS, BRD, FSD

## Document Types

| Document | Code | Purpose | Template |
|----------|------|---------|----------|
| Commercial Product Spec | CPS | Complete commercial definition | `templates/commercial-spec.md` |
| Business Rules Document | BRD | Eligibility, workflows, policies | `templates/business-rules.md` |
| Functional Specification | FSD | System behaviour, data logic | `templates/functional-spec.md` |
| Pricing Matrix | — | Quick pricing reference | `templates/pricing-matrix.md` |

## Workflow

### Step 1: Gather Required Information

**Structured Interview:**

```markdown
## Product Information Checklist

### Basic Details
- [ ] Product name (official)
- [ ] Product line (SkyFibre, CloudWiFi, etc.)
- [ ] Target market segment
- [ ] Technology/delivery method

### Pricing
- [ ] Tier structure (if multiple tiers)
- [ ] Base pricing (per tier)
- [ ] Wholesale/cost pricing (per tier)
- [ ] Add-on modules and pricing
- [ ] Setup/installation fees

### Technical
- [ ] Service specifications (speed, capacity, etc.)
- [ ] Hardware requirements
- [ ] Network integration points
- [ ] SLA levels available

### Business Rules
- [ ] Customer eligibility criteria
- [ ] Coverage requirements
- [ ] Credit vetting rules
- [ ] Contract terms available

### Operations
- [ ] Installation process
- [ ] Support hours/channels
- [ ] Billing cycle
- [ ] Cancellation policy
```

### Step 2: Select Documents to Generate

| Scenario | Documents |
|----------|-----------|
| New product launch | CPS + BRD + FSD |
| Product update/refresh | CPS (new version) |
| Process change | BRD update |
| System integration | FSD update |
| Quick reference | Pricing Matrix |

### Step 3: Generate Documents

Use templates from `templates/` directory. Follow naming convention:

```
[ProductName]_[DocType]_v[Major]_[Minor].md

Examples:
CloudWiFi_WaaS_Commercial_Product_Spec_v1_0.md
CloudWiFi_WaaS_Business_Rules_Document_v1_0.md
CloudWiFi_WaaS_Functional_Specification_v1_0.md
```

### Step 4: Output Location

**Product Documentation Directory:**

| Category | Path |
|----------|------|
| Fixed Wireless | `products/connectivity/fixed-wireless/` |
| Fibre | `products/connectivity/fibre/` |
| WiFi/WaaS | `products/wifi/` |
| Managed Services | `products/managed-services/` |
| IoT | `products/iot/` |
| Wholesale | `products/wholesale/` |

### Step 5: Update Product Index

After generating docs, update `products/README.md`:

```markdown
## [Product Category]

| Product | CPS | BRD | FSD | Version | Date |
|---------|-----|-----|-----|---------|------|
| [Name] | [Link] | [Link] | [Link] | vX.Y | YYYY-MM-DD |
```

## Reference Documents

### Existing Patterns

| Product | Documents | Location |
|---------|-----------|----------|
| SkyFibre SMB | CPS v2.0, BRD v1.0, FSD v1.0 | `products/connectivity/fixed-wireless/` |
| CloudWiFi WaaS | CPS v1.0 | `products/wifi/` |
| BizFibreConnect | Overview v2.0 | `products/connectivity/fibre/` |
| ParkConnect DUNE | Portfolio v1.1 | `products/connectivity/60ghz/` |

### Template Reference

See `references/doc-templates.md` for:
- Header block format
- Version control table structure
- Standard section outlines
- Rule ID prefixes for BRD
- State machine format for FSD

## Admin Products Integration

After documentation is complete:

1. **Create Product in Admin**:
   - Go to `/admin/products/new`
   - Enter product details
   - Set status to `draft`
   - Link to documentation

2. **Lifecycle Progression**:
   ```
   Draft (documentation complete)
      ↓
   Active (launch approved)
      ↓
   [Normal operations]
      ↓
   Inactive/Archived (sunset)
   ```

3. **Portfolio Dashboard**:
   - View at `/admin/products` → Portfolio tab
   - Check margin health
   - Monitor lifecycle status

## Document Versioning

### Version Number Format
- **Major.Minor** (e.g., v2.0, v2.1)
- **Major**: Breaking changes, new pricing model, restructure
- **Minor**: Clarifications, additions, corrections

### Version Control Block
```markdown
## Version Control & Change Log

| Version | Date | Author | Change Description | Status |
|---------|------|--------|--------------------|--------|
| 1.0 | [Date] | [Author] | Initial release | Superseded |
| 2.0 | [Date] | [Author] | [Change summary] | **CURRENT** |
```

## Quality Checklist

Before finalizing documentation:

### CPS (Commercial Product Spec)
- [ ] All pricing is current and verified
- [ ] Margin analysis is accurate
- [ ] Competitive positioning reflects market
- [ ] Target verticals are identified
- [ ] Partner commissions are documented

### BRD (Business Rules Document)
- [ ] All eligibility rules have Rule IDs
- [ ] Decision trees are complete
- [ ] Exception escalation paths defined
- [ ] Regulatory compliance addressed
- [ ] Companion CPS/FSD referenced

### FSD (Functional Specification)
- [ ] All state machines are complete
- [ ] API endpoints documented
- [ ] Database fields mapped
- [ ] Integration points identified
- [ ] Error codes defined

## Output Templates

### Quick Start: New Product Documentation

```markdown
I need to create documentation for: [Product Name]

**Product Line**: [SkyFibre/CloudWiFi/BizFibreConnect/etc.]
**Target Market**: [Consumer/SOHO/SMB/Enterprise]
**Technology**: [FWB/FTTH/WaaS/5G/LTE/60GHz]

**Tiers**:
| Tier | Speed | Price | Cost |
|------|-------|-------|------|
| [Tier 1] | [X] Mbps | R[Y] | R[Z] |
| [Tier 2] | ... | ... | ... |

**Modules** (if applicable):
| Module | Price | Description |
|--------|-------|-------------|
| [Module 1] | R[X] | [Description] |

**Key Business Rules**:
- Entity type: [Business/Consumer/Both]
- Credit requirement: [Score threshold]
- Coverage: [Technology coverage requirements]
- Contract terms: [MTM/12mo/24mo]

**Generate**: [CPS / BRD / FSD / All]
```

## Related Skills

- `/product-browse` — Find product candidates from suppliers
- `/product-analyze` — Market-fit analysis before documenting
- `/product-lifecycle` — Track document versions and product status

---

**Version**: 1.0.0
**Last Updated**: 2026-03-08
**Maintained By**: CircleTel Product Strategy

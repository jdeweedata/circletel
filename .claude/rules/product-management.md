Rule: product-management
Loaded by: CLAUDE.md
Scope: Product management skill triggers, wholesale providers, supplier browsing

---

## Product Management Skills

These skills activate when working with products, pricing, suppliers, or wholesale providers.

| Skill | Command | Trigger |
|-------|---------|---------|
| **Product Management** | `/product` | Overview menu, product strategy questions |
| **Browse Suppliers** | `/product-browse` | Finding hardware from Scoop, MiRO, Nology |
| **Wholesale Providers** | `/product-wholesale` | MTN, Echo SP, DFA, Arlan pricing/services |
| **Market-Fit Analysis** | `/product-analyze` | Evaluating product viability, margin calc |
| **Doc Generation** | `/product-docs` | Creating CPS, BRD, FSD documentation |
| **Product Lifecycle** | `/product-lifecycle` | Tracking IDEA → DRAFT → ACTIVE → ARCHIVED |

---

## Mandatory Triggers

### MUST invoke `/product-browse` when:
- User asks about hardware suppliers (Scoop, MiRO, Nology)
- Searching for routers, APs, CPE, networking equipment
- Comparing supplier pricing for products
- Keywords: "supplier", "catalogue", "miro", "scoop", "nology", "hardware"

### MUST invoke `/product-wholesale` when:
- User asks about wholesale providers (MTN, Echo SP, DFA, Arlan)
- Discussing wholesale costs, MSC commitments, or contracts
- Designing bundles with wholesale components
- Keywords: "MTN wholesale", "Echo SP", "DFA", "Arlan", "wholesale cost"

### MUST invoke `/product-analyze` when:
- Evaluating a new product for the portfolio
- Calculating margins or unit economics
- Comparing to competitor pricing
- Making GO/NO-GO decisions
- Keywords: "margin", "viable", "competitor", "market fit", "should we sell"

### MUST invoke `/product-docs` when:
- Creating new product documentation
- Generating Commercial Spec, Business Rules, or Functional Spec
- Launching a new product or tier
- Keywords: "product spec", "BRD", "CPS", "FSD", "documentation"

### MUST invoke `/product-lifecycle` when:
- Checking product status (draft, active, inactive, archived)
- Planning product sunset or retirement
- Moving products between lifecycle stages
- Keywords: "product status", "sunset", "retire", "archive", "activate"

---

## Wholesale Provider Quick Reference

| Provider | Services | Use For |
|----------|----------|---------|
| **MTN Wholesale** | FWB (Tarana), FTTH | SkyFibre, WorkConnect connectivity |
| **Echo SP** | Managed BNG, IP Transit, CGNAT | Core infrastructure |
| **DFA** | Dark Fibre, Metro Ethernet | BizFibreConnect, enterprise |
| **Arlan** | MTN LTE, 5G, IoT (reseller) | Mobile bundles, backup, fleet |

Reference files: `.claude/skills/product-management/references/`

---

## Hardware Supplier Quick Reference

| Supplier | Focus | Example Products |
|----------|-------|------------------|
| **MiRO** | CPE, wireless, DUNE 60GHz | Peraso, Reyee APs, MikroTik |
| **Scoop** | Networking, security | Enterprise switches, firewalls |
| **Nology** | Enterprise hardware | Servers, storage, UPS |

Query via: `/api/admin/suppliers/products`

---

## Bundle Design Triggers

When designing product bundles (combining CircleTel + Arlan products):

1. **MUST** invoke `/product-wholesale` to get current wholesale costs
2. **MUST** invoke `/product-analyze` to validate margins
3. **MUST** invoke `/product-docs` to create documentation
4. **SHOULD** invoke `/product-lifecycle` to track through stages

---

## Integration with Superpowers Pipeline

Product skills complement but don't replace the Superpowers Pipeline:

```
Superpowers Pipeline              Product Skills
────────────────────              ──────────────
brainstorming        ──────────▶  /product (discovery)
                                  /product-browse (hardware)
                                  /product-wholesale (services)

writing-plans        ──────────▶  /product-analyze (validation)

test-driven-development ───────▶  /product-docs (documentation)

verification-before-completion ─▶ /product-lifecycle (status)
```

**Rule**: Use product skills for WHAT to build. Use Superpowers skills for HOW to build.

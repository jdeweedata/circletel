---
name: Product Management
description: Agentic product management system for CircleTel - browse suppliers, analyze market fit, generate documentation, and track lifecycle
version: 1.0.0
dependencies: none
---

# Product Management

Master router for CircleTel's product management skills system. Provides access to supplier catalogues, market analysis, documentation generation, and lifecycle tracking.

## When This Skill Activates

This skill automatically activates when you:
- Ask about product management workflows
- Want to browse supplier catalogues (Scoop, MiRO, Nology)
- Want to view wholesale provider services (MTN, Echo SP, DFA, Arlan)
- Need to analyze product-market fit
- Want to generate product documentation
- Need to track product lifecycle stages
- Say `/product` to see the menu

**Keywords**: product, product management, supplier, catalogue, wholesale, MTN, Echo SP, DFA, Arlan, market fit, product docs, product lifecycle

## Supplier Types

| Type | Suppliers | Focus |
|------|-----------|-------|
| **Hardware** | Scoop, MiRO, Nology | CPE, routers, APs, networking equipment |
| **Wholesale** | MTN, Echo SP, DFA, Arlan | Connectivity, infrastructure, services |

## Available Sub-Skills

| Skill | Command | Purpose |
|-------|---------|---------|
| **Browse Suppliers** | `/product-browse` | Filter supplier catalogues, identify product candidates |
| **Wholesale Providers** | `/product-wholesale` | View wholesale provider services and contracts |
| **Market-Fit Analysis** | `/product-analyze` | Competitor comparison, margin calc, go/no-go recommendation |
| **Doc Generation** | `/product-docs` | Generate commercial spec, business rules, functional spec |
| **Product Lifecycle** | `/product-lifecycle` | Track IDEA → DEVELOPMENT → ACTIVE → SUNSET stages |

## Wholesale Providers

| Provider | Services | Reference |
|----------|----------|-----------|
| **MTN Wholesale** | FWB (Tarana), FTTH | `references/mtn-wholesale.md` |
| **Echo SP** | Managed BNG, IP Transit | `references/echo-sp.md` |
| **DFA** | Dark Fibre, Metro Ethernet | `references/dfa.md` |
| **Arlan** | MTN LTE, 5G, IoT (reseller) | `references/arlan.md` |

## Quick Start Menu

```
/product              → This menu (product management overview)
/product-browse       → Browse supplier catalogues with filters
/product-wholesale    → Browse wholesale provider services and contracts
/product-analyze      → Analyze product-market fit
/product-docs         → Generate product documentation
/product-lifecycle    → View/update product lifecycle status
```

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   Product Management Workflow                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DISCOVER           2. ANALYZE           3. DOCUMENT          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │ Browse       │ ──▶ │ Market-Fit   │ ──▶ │ Generate     │     │
│  │ Suppliers    │     │ Analysis     │     │ Docs         │     │
│  └──────────────┘     └──────────────┘     └──────────────┘     │
│        ▲                    │                    │               │
│        │                    ▼                    ▼               │
│        │              ┌──────────────┐     ┌──────────────┐     │
│        │              │ GO/NO-GO     │     │ Commercial   │     │
│        │              │ Decision     │     │ Spec + BRD   │     │
│        │              └──────────────┘     │ + FSD        │     │
│        │                                   └──────────────┘     │
│        │                                          │              │
│        │                    4. TRACK              ▼              │
│        │              ┌──────────────┐     ┌──────────────┐     │
│        └───────────── │ Lifecycle    │ ◀── │ Launch       │     │
│                       │ Management   │     │ Product      │     │
│                       └──────────────┘     └──────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Sources

### Supplier Catalogues
- **Scoop Distribution**: Networking, security, infrastructure
- **MiRO Distribution**: Hardware, CPE, wireless equipment
- **Nology**: Enterprise hardware, servers, storage

### Infrastructure
- `lib/suppliers/` - Supplier sync services and parsers
- `lib/suppliers/ai-enrichment.ts` - Gemini AI for product specs
- `/api/admin/suppliers/products/` - Product query API

### References
- `references/competitor-benchmarks.md` - SA ISP pricing benchmarks
- `references/doc-templates.md` - Documentation structure patterns
- `references/wholesale-providers.md` - Wholesale provider overview
- `references/mtn-wholesale.md` - MTN FWB and FTTH services
- `references/echo-sp.md` - Echo SP managed services
- `references/dfa.md` - DFA fibre infrastructure
- `references/arlan.md` - Arlan MTN reseller services

### Product Documentation
- `products/` - Existing product specs (30+ documents)
- `products/research/` - Competitive analysis

## Typical Use Cases

### 1. New Product Discovery
```
User: "What routers does MiRO have for under R5,000?"
→ Use /product-browse with filters: supplier=miro, category=router, max_price=5000
```

### 2. Product Viability Check
```
User: "Is there margin in reselling the Reyee RG-EG105GW?"
→ Use /product-analyze with product SKU
→ Returns competitor comparison, margin calc, go/no-go
```

### 3. Launch New Product
```
User: "Create documentation for our new CloudWiFi tier"
→ Use /product-docs to generate:
  - Commercial Product Spec (CPS)
  - Business Rules Document (BRD)
  - Functional Specification (FSD)
```

### 4. Track Product Status
```
User: "What products are in development?"
→ Use /product-lifecycle to view dashboard
→ Shows IDEA → DEVELOPMENT → ACTIVE → SUNSET pipeline
```

## Integration Points

### Database Tables
- `supplier_products` - Synced supplier catalogue
- `product_enrichment` - AI-generated specs and features
- `products` (future) - CircleTel product registry

### AI Services
- Google Gemini for product enrichment
- Structured output for specs extraction

### External APIs
- Supplier catalogue APIs (Scoop, MiRO, Nology)
- Coverage APIs for technology availability

## Best Practices

1. **Always check supplier stock** before product analysis
2. **Run margin calculations** with current wholesale costs
3. **Include competitor benchmarks** in market-fit analysis
4. **Use templates** for consistent documentation
5. **Track lifecycle stage** for all active products

## Related Resources

| Resource | Location |
|----------|----------|
| Competitor Analysis | `products/research/SA_ISP_Competitive_Landscape_Analysis_2025.md` |
| Product Portfolio | Memory: `product-portfolio.md` |
| Supplier Types | `lib/suppliers/types.ts` |
| AI Enrichment | `lib/suppliers/ai-enrichment.ts` |
| SkyFibre Specs | `products/connectivity/fixed-wireless/` |

---

**Version**: 1.0.0
**Last Updated**: 2026-03-08
**Maintained By**: CircleTel Product Strategy

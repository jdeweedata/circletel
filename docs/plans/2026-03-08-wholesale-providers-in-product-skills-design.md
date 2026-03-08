# Design: Add Wholesale Providers to Product Management Skills

**Date**: 2026-03-08
**Status**: Approved
**Author**: Claude Code + CircleTel Product Team

---

## Problem Statement

The product management skills system currently only tracks hardware suppliers (Scoop, MiRO, Nology). CircleTel also works with wholesale connectivity providers (MTN, Echo SP, DFA, Arlan) that supply network services. These providers need to be visible in the product management workflow for:

- Understanding available upstream services
- Tracking contract terms and commitments
- Informing product pricing decisions
- Future: Calculating sales contribution margin per product

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Supplier model** | Unified with type distinction | Single concept for browsing, filter by `hardware` or `wholesale` |
| **Data scope** | Service catalogue + contracts | Product management needs visibility, not operational metrics |
| **Providers** | MTN, Echo SP, DFA, Arlan | All active wholesale relationships |
| **Storage** | Skills reference files (markdown) | Fast to implement, data changes infrequently, database migration planned for margin calculations |

---

## Architecture

### File Structure

```
.claude/skills/product-management/
├── SKILL.md                              # UPDATE
├── browse-suppliers/
│   └── SKILL.md                          # UPDATE
├── references/
│   ├── competitor-benchmarks.md          # EXISTS
│   ├── wholesale-providers.md            # NEW - Overview & quick reference
│   ├── mtn-wholesale.md                  # NEW - MTN Wholesale Direct + services
│   ├── echo-sp.md                        # NEW - Echo SP managed services
│   ├── dfa.md                            # NEW - Dark Fibre Africa products
│   └── arlan.md                          # NEW - Arlan/MTN reseller channel
```

### Data Model (Reference Files)

Each wholesale provider reference file follows this structure:

```markdown
# [Provider Name]

## Quick Reference
| Field | Value |
|-------|-------|
| Legal Entity | ... |
| Relationship Type | ... |
| Contract Reference | ... |
| Primary Contact | ... |

## Service Catalogue

### [Service Name]
| Parameter | Value |
|-----------|-------|
| Technology | ... |
| Pricing Model | ... |
| MRC Range | ... |
| Contract Term | ... |
| CircleTel Products | ... |

## Contract Terms
- MSC commitments
- Renewal dates
- Key obligations

## Cost Elements (for margin calculation)
| Cost Type | Amount | Frequency | Notes |
|-----------|--------|-----------|-------|

## Integration Points
- NNI/interconnect locations
- Technical contacts
- Account numbers
```

### Supplier Type Taxonomy

```
suppliers/
├── hardware/           # Physical products with SKUs
│   ├── scoop          # Networking, security
│   ├── miro           # CPE, wireless, DUNE
│   └── nology         # Enterprise hardware
│
└── wholesale/          # Connectivity services
    ├── mtn-wholesale  # FWB (Tarana), FTTH
    ├── echo-sp        # Managed BNG, IP transit
    ├── dfa            # Dark fibre, metro Ethernet
    └── arlan          # MTN reseller (LTE/5G/voice)
```

---

## User Interface (Skill Commands)

### Updated Commands

| Command | Behavior |
|---------|----------|
| `/product` | Show menu with Hardware Suppliers AND Wholesale Providers sections |
| `/product-browse` | Add `type` filter: `hardware`, `wholesale`, or `all` (default) |
| `/product-browse wholesale` | Show only wholesale providers |
| `/product-wholesale` | NEW: Quick access to wholesale provider reference |
| `/product-wholesale mtn` | NEW: Show MTN-specific services and contracts |

### Example Interactions

```
User: "What wholesale services does MTN provide?"
→ Read references/mtn-wholesale.md, present service catalogue

User: "Browse wholesale providers"
→ Read references/wholesale-providers.md, list all providers with key services

User: "What's our MSC commitment with MTN?"
→ Read references/mtn-wholesale.md, extract contract terms section
```

---

## Provider Details

### MTN Wholesale Direct
- **Services**: FWB (Tarana G1), FTTH Wholesale
- **Relationship**: NNI interconnect at Teraco JB1/CT1
- **Pricing**: MSC + per-subscriber MRC
- **Source**: `products/wholesale/mtn/MTN_Wholesale_Direct_Services_Spec_v1_0.md`

### Echo SP
- **Services**: Managed BNG, IP Transit, CGNAT, Static IPs
- **Relationship**: Infrastructure partner at Teraco
- **Pricing**: Monthly service fees
- **Source**: `products/wholesale/echo-sp/Echo_SP_Service_Portfolio_Breakdown_v1_0.md`

### DFA (Dark Fibre Africa)
- **Services**: Peregrine (dark fibre), Calypte (managed), Magellan (E-Line), Tachyon (colo)
- **Relationship**: Wholesale fibre infrastructure
- **Pricing**: NRC + MRC per metre/port
- **Source**: `products/wholesale/dfa/DFA_Complete_Product_Portfolio_v1_0.md`

### Arlan Communications
- **Services**: MTN LTE, 5G, mobile voice/data, IoT (reseller)
- **Relationship**: MTN reseller/agent
- **Pricing**: Commission-based
- **Source**: `products/wholesale/arlan/Arlan_Commission_Analysis_v1.0.md`

---

## Future: Database Migration

When ready to calculate sales contribution margin per product:

### New Tables

```sql
-- Wholesale providers (parallels suppliers table)
CREATE TABLE wholesale_providers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,  -- 'mtn', 'echo-sp', 'dfa', 'arlan'
  provider_type TEXT,         -- 'access_network', 'infrastructure', 'reseller'
  legal_entity TEXT,
  contract_reference TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  msc_amount DECIMAL(12,2),
  msc_period TEXT,            -- 'monthly', 'quarterly', 'annual'
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Wholesale services (parallels supplier_products)
CREATE TABLE wholesale_services (
  id UUID PRIMARY KEY,
  provider_id UUID REFERENCES wholesale_providers(id),
  service_code TEXT NOT NULL,
  service_name TEXT NOT NULL,
  technology TEXT,            -- 'fwb', 'ftth', 'bng', 'dark_fibre', 'lte', '5g'
  pricing_model TEXT,         -- 'per_subscriber', 'capacity', 'fixed', 'commission'
  mrc_min DECIMAL(10,2),
  mrc_max DECIMAL(10,2),
  nrc DECIMAL(10,2),
  contract_term_months INTEGER,
  circletel_products TEXT[],  -- Products using this service
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Margin Calculation Integration

Link `wholesale_services` to `service_packages` to calculate:
- Upstream cost per product
- Contribution margin per sale
- MSC progress tracking

---

## Success Criteria

1. All four wholesale providers documented in skills references
2. `/product-browse wholesale` returns provider list
3. `/product-wholesale [provider]` returns service details
4. Main product management skill menu shows both supplier types
5. Data extracted from existing `products/wholesale/` documentation

---

## Out of Scope

- Real-time MSC tracking (future database work)
- Operational metrics (subscriber counts, usage)
- Billing integration
- Automated sync from provider systems

---

## Related Documents

- `products/wholesale/mtn/MTN_Wholesale_Direct_Services_Spec_v1_0.md`
- `products/wholesale/echo-sp/Echo_SP_Service_Portfolio_Breakdown_v1_0.md`
- `products/wholesale/dfa/DFA_Complete_Product_Portfolio_v1_0.md`
- `products/wholesale/arlan/Arlan_Commission_Analysis_v1.0.md`
- `.claude/skills/product-management/SKILL.md`

---
name: Browse Suppliers
description: Filter and browse supplier catalogues (Scoop, Miro, Nology) to identify product candidates for CircleTel portfolio
version: 1.0.0
dependencies: none
---

# Browse Suppliers

Skill for browsing supplier catalogues, filtering products, and identifying candidates for the CircleTel product portfolio.

## When This Skill Activates

This skill automatically activates when you:
- Want to browse supplier product catalogues
- Need to find products from Scoop, MiRO, or Nology
- Search for hardware, networking equipment, or CPE
- Say `/product-browse` or ask about supplier products

**Keywords**: browse suppliers, supplier catalogue, miro products, scoop products, nology products, find hardware, search equipment

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
| **MiRO Distribution** | Hardware, CPE, DUNE 60GHz | `lib/suppliers/miro/` | Database |
| **Nology** | Enterprise hardware | `lib/suppliers/nology/` | Database |

## Wholesale Providers

| Provider | Focus | Reference |
|----------|-------|-----------|
| **MTN Wholesale** | FWB (Tarana), FTTH | `references/mtn-wholesale.md` |
| **Echo SP** | Managed BNG, IP Transit | `references/echo-sp.md` |
| **DFA** | Dark Fibre, Metro Ethernet | `references/dfa.md` |
| **Arlan** | MTN LTE/5G Reseller | `references/arlan.md` |

## Workflow

### Step 1: Define Search Criteria

**Available Filters:**
- `type` — `hardware`, `wholesale`, or `all` (default: all)
- `supplier` — miro, scoop, nology (hardware) or mtn, echo-sp, dfa, arlan (wholesale)
- `category` — networking, wireless, routers, switches, access-points, etc.
- `manufacturer` — Ubiquiti, MikroTik, Reyee, Ruijie, etc.
- `min_price` / `max_price` — ZAR range
- `in_stock` — true/false
- `search` — text search across name, SKU, description

**Example Queries (Hardware):**
```
"Show me MiRO routers under R5,000"
→ type=hardware, supplier=miro, category=routers, max_price=5000

"Find Reyee access points in stock"
→ type=hardware, manufacturer=Reyee, category=access-points, in_stock=true

"Search for 'Peraso 60GHz' products"
→ type=hardware, search=Peraso 60GHz
```

**Example Queries (Wholesale):**
```
"Browse wholesale providers"
→ type=wholesale

"What services does Echo SP provide?"
→ type=wholesale, supplier=echo-sp

"Show MTN wholesale pricing"
→ type=wholesale, supplier=mtn

"What's our MSC commitment?"
→ type=wholesale, supplier=mtn (check Contract Terms section)
```

### Step 2: Query Products

**Via API:**
```bash
GET /api/admin/suppliers/products?supplier=miro&category=routers&max_price=5000
```

**Via Supabase:**
```sql
SELECT * FROM supplier_products
WHERE supplier = 'miro'
  AND category = 'routers'
  AND price_zar <= 5000
  AND is_active = true
ORDER BY price_zar ASC;
```

### Step 3: Review Results

For each product, evaluate:

| Criteria | Question | Data Source |
|----------|----------|-------------|
| **Margin Potential** | Can we mark up 30%+ and stay competitive? | `competitor-benchmarks.md` |
| **Fit** | Does it serve a CircleTel product line? | Product portfolio |
| **Availability** | In stock or reliable supply? | Supplier catalogue |
| **Support** | Can we support this product? | Team capability |

### Step 4: AI Enrichment (Optional)

For promising candidates, trigger AI enrichment:

```typescript
import { enrichProduct } from '@/lib/suppliers/ai-enrichment';

const result = await enrichProduct(product);
// Returns: specifications, features, category, subcategory, enhanced_description
```

**Cost**: ~$0.0001 per product (Gemini 1.5 Flash)

### Step 5: Recommend Actions

For selected products:
1. **GO** → Run `/product-analyze` for full market-fit analysis
2. **MAYBE** → Add to watchlist, request samples
3. **NO-GO** → Document reasons for rejection

## Data Model

### supplier_products Table

```sql
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY,
  supplier TEXT NOT NULL,           -- 'miro', 'scoop', 'nology'
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  manufacturer TEXT,
  category TEXT,
  subcategory TEXT,
  description TEXT,
  price_zar DECIMAL(10,2),
  cost_price_zar DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  in_stock BOOLEAN,
  stock_quantity INTEGER,
  specifications JSONB,             -- AI-enriched or scraped
  features TEXT[],                  -- AI-enriched
  image_url TEXT,
  product_url TEXT,
  last_synced_at TIMESTAMPTZ,
  enrichment_status TEXT,           -- 'pending', 'scraped', 'enriched', 'failed'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Output Templates

### Product Candidate Card

```markdown
## [Product Name]

| Field | Value |
|-------|-------|
| **SKU** | [SKU] |
| **Supplier** | [Supplier] |
| **Price** | R[X] |
| **Category** | [Category] |
| **Manufacturer** | [Manufacturer] |
| **Stock** | [In Stock / Out of Stock] |

**Description**: [Brief description]

**Fit Assessment**:
- [ ] Serves existing product line
- [ ] Margin potential ≥30%
- [ ] Reliable availability
- [ ] Supportable by team

**Recommendation**: [GO / MAYBE / NO-GO]

**Next Action**: [Run market-fit analysis / Add to watchlist / Reject]
```

### Bulk Search Results

```markdown
## Supplier Product Search Results

**Query**: [Search parameters]
**Results**: [X] products found

| SKU | Name | Supplier | Price | Category | Stock |
|-----|------|----------|-------|----------|-------|
| ... | ...  | ...      | R...  | ...      | ✓/✗   |

**Summary**:
- Total products: [X]
- In stock: [Y]
- Average price: R[Z]
- Price range: R[min] - R[max]

**Top Candidates** (by margin potential):
1. [Product 1] - Est. margin: XX%
2. [Product 2] - Est. margin: XX%
3. [Product 3] - Est. margin: XX%
```

## Integration Points

### Admin Products Page
- `/admin/products` — View and manage existing products
- `/admin/products/new` — Add new product to catalogue
- Products API: `/api/admin/products`

### Supplier Sync
- `lib/suppliers/miro/miro-sync.ts` — MiRO catalogue sync
- `lib/suppliers/nology/nology-sync.ts` — Nology catalogue sync
- `lib/suppliers/scoop-sync.ts` — Scoop catalogue sync

### AI Enrichment
- `lib/suppliers/ai-enrichment.ts` — Gemini-powered enrichment
- `lib/suppliers/product-scraper.ts` — Web scraping for details

## Best Practices

1. **Start narrow, then broaden** — Search specific categories first
2. **Check stock before recommending** — Out-of-stock products cause issues
3. **Compare to existing portfolio** — Don't duplicate products we already sell
4. **Verify pricing freshness** — Supplier prices change frequently
5. **Document rejections** — Future reference for why products were skipped

## Related Skills

- `/product-analyze` — Run market-fit analysis on candidates
- `/product-docs` — Generate documentation for selected products
- `/product-lifecycle` — Track product through lifecycle stages

---

**Version**: 1.0.0
**Last Updated**: 2026-03-08
**Maintained By**: CircleTel Product Strategy

---
name: Search Suppliers
description: Live search supplier websites (Scoop, MiRO, Nology, Rectron, and any other) for hardware products using Firecrawl MCP tools. Extracts specs, pricing, datasheets, availability. Compares across suppliers. Saves research results for product design. Use when looking for CPE, routers, APs, UPS, servers, or any hardware product.
version: 1.0.0
dependencies: product-management
---

# Search Suppliers

Live search SA hardware supplier websites using Firecrawl MCP tools — find products, extract specs and pricing, compare across suppliers, and save research for product design decisions.

**This skill complements `/product-browse`**: Browse queries the Supabase DB (synced catalogue). Search queries live supplier websites in real time.

## When This Skill Activates

Invoke when:
- Searching for hardware not yet in the DB, or needing live pricing
- Comparing the same product across multiple suppliers
- Researching CPE/hardware for a new product design
- Searching Rectron or any supplier not yet DB-integrated
- Running `/product-search`

**Keywords**: search suppliers, find hardware, supplier search, rectron, cross-supplier compare, firecrawl search, hardware research, product specs, datasheet, CPE search

---

## Quick Start

```
/product-search {query}                          → Search all suppliers
/product-search --supplier rectron {query}       → One supplier only
/product-search --compare {exact product name}   → Cross-supplier price comparison
/product-search --map rectron                    → Discover site structure (first time)
/product-search --save {query}                   → Search + save research file
```

---

## Files Used by This Skill

| File | Purpose |
|------|---------|
| `supplier-registry.md` | Supplier domains, search patterns, notes |
| `extraction-schemas.md` | JSON schemas for `firecrawl_extract` |
| `templates/research-result.md` | Output template for saved research |
| `products/research/hardware/` | Where research files are saved |

---

## Firecrawl MCP Tool Selection

Always choose the cheapest tool that gets the job done:

| Scenario | Tool | Credits | When to Use |
|----------|------|---------|-------------|
| Find product pages on a site | `firecrawl_search` with `site:` | ~1 | First step for every search |
| Read a specific product page | `firecrawl_scrape` | ~1 | When you have a URL and markdown is enough |
| Get structured data from a page | `firecrawl_extract` + schema | ~15 | When scrape markdown is too messy to parse |
| Discover URL structure of a site | `firecrawl_map` | ~1 | First-time Rectron setup or unknown site |
| Navigate search forms or pagination | `firecrawl_interact` | ~2 | When site requires form submission or JS |
| Deep multi-source research | `firecrawl_agent` (async) | varies | Complex queries across many pages |

**Golden rule**: `firecrawl_search` → `firecrawl_scrape` (2 credits) before escalating to `firecrawl_extract` (15 credits). Only use `extract` when the scraped markdown is genuinely too unstructured to parse.

---

## Core Workflow

### Step 1: Parse Intent

Before searching, determine:

| Question | Answer |
|----------|--------|
| What product/category are we looking for? | {search terms, model numbers, specs needed} |
| Which suppliers? | Default: all 4. Use `--supplier` flag to narrow |
| What mode? | discovery / comparison / enrichment / site mapping |
| Should results be saved? | Yes if `--save` flag or if user asks to save |

---

### Step 2: Search Phase

**For each target supplier**, execute a search using the patterns from `supplier-registry.md`:

#### For DB-integrated suppliers (Scoop, MiRO, Nology)

```
1. Check DB first:
   GET /api/admin/suppliers/products?supplier={code}&search={query}
   
   or via Supabase:
   SELECT * FROM supplier_products
   WHERE supplier = '{code}' AND name ILIKE '%{query}%'
   ORDER BY cost_price_zar ASC LIMIT 10;

2. If DB has results → show DB data (synced price + stock)
3. Then optionally enrich with live Firecrawl data (specs, datasheets)
4. If NOT in DB → proceed to Firecrawl live search
```

**Important for Scoop**: Never use Firecrawl for Scoop pricing — dealer cost prices require login. Use DB for all Scoop pricing data.

#### For Rectron (Firecrawl-only)

```
1. First time? Run firecrawl_map to discover site structure:
   firecrawl_map: { url: "https://www.rectronzone.co.za", search: "{query}" }
   → Saves discovered URL patterns to supplier-registry.md

2. Then search:
   firecrawl_search: { query: "site:rectronzone.co.za {query}" }
   → Returns product page URLs
```

#### Search execution per supplier

```
firecrawl_search:
  query: "site:{supplier_domain} {search_terms}"
  limit: 5
  scrapeOptions:
    formats: ["markdown"]
    onlyMainContent: true
```

Parse the returned markdown snippets to identify product URLs. If snippets contain enough pricing/spec data, you may not need to scrape individual pages.

---

### Step 3: Extract Phase

For each product URL found, choose based on content quality:

**If markdown snippet from search is sufficient:**
- Parse directly — no additional Firecrawl call needed

**If you need full page content:**
```
firecrawl_scrape:
  url: "{product_url}"
  formats: ["markdown"]
  onlyMainContent: true
```
Parse the markdown for: product name, SKU, price (excl/incl VAT), stock status, key specs, datasheet links.

**If page is too complex for manual parsing (JavaScript-heavy, spec tables, nested tabs):**
```
firecrawl_extract:
  urls: ["{product_url}"]
  prompt: "Extract product name, SKU, pricing (excl and incl VAT), stock status, all specifications, and any datasheet PDF links"
  schema: <Hardware Product Schema from extraction-schemas.md>
```

**For cross-supplier comparison of the same product:**
```
firecrawl_extract:
  urls: ["{scoop_url}", "{miro_url}", "{nology_url}", "{rectron_url}"]
  prompt: "Extract pricing, stock status and warranty for this product from each supplier"
  schema: <Cross-Supplier Comparison Schema from extraction-schemas.md>
```

---

### Step 4: Compare and Present

Format all results into a clear comparison. Always show:

1. **Cross-supplier comparison table** (if multiple suppliers searched)
2. **Best value recommendation** with reasoning
3. **Margin potential** — rough estimate based on standard CircleTel markup vs competitor retail

#### Margin estimate formula:
```
estimated_retail  = supplier_cost × 1.35  (35% target margin)
estimated_margin  = estimated_retail - supplier_cost
margin_pct        = estimated_margin / estimated_retail × 100
```

Flag if estimated retail would be uncompetitive vs SA ISP market benchmarks from `references/competitor-benchmarks.md`.

#### Datasheet handling:
- If a datasheet URL is found, display it prominently
- Note: `products/research/hardware/datasheets/` is where PDFs should be saved for offline reference
- If the user says "download the datasheet", use `firecrawl_scrape` with `parsers: ["pdf"]` on the datasheet URL

---

### Step 5: Store Results

**Always store** if:
- User used `--save` flag
- User explicitly asks to save
- Research took significant effort (multiple suppliers, 5+ products)

**Store to**: `products/research/hardware/{YYYY-MM-DD}-{slugified-query}.md`

Use the template at `templates/research-result.md`. Fill in all sections:
- Header: date, query, suppliers searched, credits used
- Cross-supplier comparison table
- Best candidate + rationale
- Per-product detail blocks
- Datasheets & document links
- Supplier notes (update registry if new patterns found)
- Recommended next actions

---

## Search Modes (Detailed)

### Mode 1: Quick Search
```
/product-search MikroTik hAP ax3
/product-search PoE switch 24 port gigabit
/product-search "access point" outdoor 5GHz
```
Searches all 4 suppliers. Returns comparison table. Does not auto-save unless `--save` is added.

### Mode 2: Single Supplier
```
/product-search --supplier miro Reyee RG-RAP2260
/product-search --supplier rectron UPS 3000VA tower
/product-search --supplier nology "dell server" rack 1U
```
Targets one supplier only. Faster and cheaper (fewer Firecrawl calls).

### Mode 3: Cross-Compare
```
/product-search --compare "MikroTik hAP ax3"
/product-search --compare "Ubiquiti UniFi AP U6 Pro"
```
Finds the exact product on all suppliers and extracts structured data from each for a side-by-side comparison. Uses `firecrawl_extract` with the Cross-Supplier Comparison Schema.

### Mode 4: Site Discovery (First-Time Setup)
```
/product-search --map rectron
/product-search --map {new-supplier-domain}
```
Uses `firecrawl_map` to discover the site structure and URL patterns. After running, update `supplier-registry.md` with the discovered patterns so future searches are more precise.

### Mode 5: Category Browse
```
/product-search --category "wireless access points" --supplier miro
/product-search --category routers --max-price 3000
```
Browses a category rather than searching for a specific product. Uses category URLs from the supplier registry.

### Mode 6: Datasheet Hunt
```
/product-search --datasheet "Peraso PRS4000"
/product-search --datasheet "Tarana G1 Remote Node"
```
Specifically searches for product datasheets/spec sheets. Uses `firecrawl_search` targeting PDF documents: `site:{domain} filetype:pdf {product_name}` or searches product pages for linked PDFs.

---

## DB vs Live Search Decision Tree

```
User asks for product search
         │
         ▼
Product in our DB (Scoop/MiRO/Nology synced)?
    │ YES                         │ NO (or Rectron/other)
    ▼                             ▼
Show DB results first         Use Firecrawl live search
    │                             │
    ▼                             ▼
User wants live pricing?      Find on supplier site(s)
    │ YES (not Scoop)             │
    ▼                             ▼
Firecrawl scrape for          Extract structured data
live price check              and present results
    │
    ▼
User wants datasheet?
    │ YES
    ▼
Search for PDF on product page
or use firecrawl_search with filetype:pdf
```

---

## Supplier-Specific Tips

### Scoop (scoop.co.za)
- **Pricing**: Use DB only (login wall). Firecrawl for specs/datasheets only.
- **Search**: `site:scoop.co.za {query}` works well
- **Datasheets**: Often linked directly on product pages as PDFs
- **Tip**: Scoop carries a lot of Ubiquiti and MikroTik — strong for infrastructure builds

### MiRO (miro.co.za)
- **Pricing**: Public pricing available — Firecrawl is reliable
- **Search**: Good results from `site:miro.co.za {query}`
- **Specialty**: Best for ISP/FWB hardware (Tarana CPE, DUNE 60GHz Peraso units)
- **Tip**: Check their "ISP Hardware" and "Fixed Wireless" categories specifically for CircleTel-relevant CPE

### Nology (nology.co.za)
- **Pricing**: Public pricing, VirtueMart CMS
- **Search**: Use `firecrawl_extract` with schema — VirtueMart pages can be messy as markdown
- **Specialty**: Enterprise IT, UPS, servers
- **Tip**: Good source for Managed IT Services hardware components (workstations, NAS, rack servers)

### Rectron (rectronzone.co.za)
- **Pricing**: Public pricing available
- **Search**: Run `--map rectron` first to discover URL structure
- **Specialty**: Broadest range — networking, compute, peripherals, consumer electronics
- **Tip**: Check Rectron when MiRO/Scoop/Nology don't have a product — they cover many more brands

---

## Integration with Other Skills

### → /product-analyze
After finding a product candidate, pass the extracted data to `/product-analyze` for a full market-fit analysis including margin calculation, competitive positioning, and GO/NO-GO recommendation.

```
After /product-search finds a candidate:
"Run /product-analyze on the {product name} at R{cost_price}"
```

### → /new-product
When designing a new product in `/new-product` Phase 2 (Architecture & Technology), use search results to fill in:
- CPE/hardware details (question 4)
- Installation cost (from supplier price × install hours)
- Hardware amortisation (supplier price ÷ 12 or 24 months)

### → /product-browse
`/product-browse` queries the Supabase DB. `/product-search` queries live websites. Run browse first for known products; search for discovery or when DB data is stale.

---

## Research Storage Structure

```
products/research/hardware/
├── datasheets/                          ← PDFs downloaded from supplier sites
│   └── {manufacturer}-{model}-datasheet.pdf
├── {YYYY-MM-DD}-{slug}.md               ← Research result files
└── .gitkeep
```

File naming examples:
- `2026-04-03-mikrotik-hap-ax3-comparison.md`
- `2026-04-03-outdoor-access-point-5ghz.md`
- `2026-04-10-rectron-ups-3000va.md`

---

## Updating the Supplier Registry

When you discover new URL patterns, site behaviours, or pricing quirks during a search, update `supplier-registry.md`:

1. Open `supplier-registry.md`
2. Find the supplier block
3. Add/update URL patterns, notes, or pricing observations
4. Save — this knowledge persists for all future searches

This is especially important for Rectron since it starts with no URL patterns.

---

**Version**: 1.0.0
**Last Updated**: 2026-04-03
**Maintained By**: CircleTel Product Strategy

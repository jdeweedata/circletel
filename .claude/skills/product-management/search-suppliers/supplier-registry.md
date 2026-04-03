# Supplier Registry

Known supplier domains, search patterns, and site-specific notes for Firecrawl-powered product search.

---

## Scoop Distribution

| Field | Value |
|-------|-------|
| **Domain** | scoop.co.za |
| **Website** | https://scoop.co.za |
| **DB Integrated** | Yes — code: `SCOOP`, feed type: XML |
| **Sync Service** | `lib/suppliers/scoop-sync.ts` |
| **Search Pattern** | `site:scoop.co.za {query}` |
| **Categories** | Networking, security, infrastructure, cabling, power |
| **Manufacturers** | Ubiquiti, MikroTik, TP-Link, Draytek, APC, Eaton |

**Important**: Scoop requires dealer login for cost pricing. The XML feed (synced to DB) contains actual dealer pricing. Use **Firecrawl only for specs and datasheets** — never for pricing on Scoop.

**URL Patterns**:
- Product search: `https://scoop.co.za/search?term={query}`
- Product page: `https://scoop.co.za/product/{slug}`
- Category: `https://scoop.co.za/category/{slug}`

**Firecrawl Use Cases**:
- Find datasheet PDFs not in the DB record
- Enrich specs for products already in DB but missing specifications
- Discover new products not yet synced via XML feed

---

## MiRO Distribution

| Field | Value |
|-------|-------|
| **Domain** | miro.co.za |
| **Website** | https://www.miro.co.za |
| **DB Integrated** | Yes — code: `MIRO`, feed type: HTML scraping |
| **Sync Service** | `lib/suppliers/miro/miro-sync.ts` |
| **Search Pattern** | `site:miro.co.za {query}` |
| **Categories** | CPE, wireless, fixed wireless, 60GHz mmWave, LTE, routers, switches |
| **Manufacturers** | Peraso, Reyee, Ruijie, MikroTik, Cambium, Ubiquiti, Netgear |

**Notes**: Public pricing available on the website. Good for cross-referencing DB data with live pricing and for discovering products added since last sync. Specialises in ISP-grade equipment — particularly strong for Tarana/FWB CPE and DUNE 60GHz (Peraso chipset).

**URL Patterns**:
- Product listing: `https://www.miro.co.za/products`
- Category: `https://www.miro.co.za/category/{category}`
- Product page: `https://www.miro.co.za/products/{category}/{slug}`
- Search: `https://www.miro.co.za/products?search={query}`

**Firecrawl Use Cases**:
- Live pricing check (supplement DB sync)
- Find new products added between syncs
- Discover compatibility notes and bundle recommendations
- Download datasheets linked from product pages

---

## Nology

| Field | Value |
|-------|-------|
| **Domain** | nology.co.za |
| **Website** | https://www.nology.co.za |
| **DB Integrated** | Yes — code: `NOLOGY`, feed type: HTML scraping |
| **Sync Service** | `lib/suppliers/nology/nology-sync.ts` |
| **Search Pattern** | `site:nology.co.za {query}` |
| **Categories** | Enterprise hardware, servers, storage, UPS, networking, workstations |
| **Manufacturers** | HP, Dell, Lenovo, APC, Eaton, Cisco, Fortinet |
| **CMS** | VirtueMart (Joomla-based e-commerce) |

**Notes**: Enterprise-focused. Best for managed IT services hardware sourcing (servers, workstations, UPS). May have volume pricing tiers not shown on public pages. The VirtueMart CMS can be slow to parse — prefer `firecrawl_extract` with schema over raw markdown scraping.

**URL Patterns**:
- Home: `https://www.nology.co.za/`
- Search: `https://www.nology.co.za/?search={query}` or via VirtueMart search
- Product page: URL structure varies — use `firecrawl_map` or `firecrawl_search` to discover

**Firecrawl Use Cases**:
- Discover new enterprise hardware not yet synced
- Find UPS and power equipment for managed IT bundles
- Check server/storage pricing for CloudCircle hosting products

---

## Rectron

| Field | Value |
|-------|-------|
| **Domain** | rectronzone.co.za |
| **Website** | https://www.rectronzone.co.za |
| **DB Integrated** | **No** — Firecrawl only (potential future integration) |
| **Sync Service** | None — use Firecrawl MCP tools |
| **Search Pattern** | `site:rectronzone.co.za {query}` |
| **Categories** | Broad: networking, compute, storage, printing, peripherals, consumer electronics |
| **Manufacturers** | HP, Lenovo, Dell, TP-Link, Draytek, Epson, Logitech, and many others |

**First-time setup**: Before searching Rectron for the first time, run `/product-search --map rectron` to discover the site structure. Use `firecrawl_map` on `https://www.rectronzone.co.za` to find product category URLs, then document the patterns discovered here in the URL Patterns section below.

**URL Patterns** *(to be populated after first firecrawl_map run)*:
- TBD — run `firecrawl_map` to discover

**Firecrawl Use Cases**:
- Broadest product range of all SA distributors — good for product discovery
- Compare pricing on common products vs MiRO/Scoop/Nology
- Find brands not stocked by the other three suppliers
- Source hardware for new product lines (e.g., managed IT, cloud hosting)

**Notes**: Rectron is a large volume distributor. Pricing may be ex-VAT or incl-VAT — verify on each page. Some pricing requires login; public prices may be retail not dealer. Document pricing tier behaviour here after first use.

---

## Adding a New Supplier

To add a new supplier, copy this template and add a new section:

```markdown
## {Supplier Name}

| Field | Value |
|-------|-------|
| **Domain** | {domain.co.za} |
| **Website** | {https://...} |
| **DB Integrated** | Yes / No |
| **Search Pattern** | `site:{domain} {query}` |
| **Categories** | {list} |
| **Manufacturers** | {list} |

**Notes**: {anything unusual about this supplier's site, auth, pricing}

**URL Patterns**:
- Search: {URL pattern}
- Product page: {URL pattern}

**Firecrawl Use Cases**:
- {Use case 1}
- {Use case 2}
```

To request DB integration for a new supplier, note it in the research file and raise with the development team. See `lib/suppliers/types.ts` for the `SupplierProduct` interface.

---

## SA Distributor Landscape (Quick Reference)

| Distributor | Strength | Best For |
|-------------|----------|----------|
| MiRO | ISP/wireless CPE | FWB equipment, DUNE 60GHz, LTE routers |
| Scoop | Security & networking | Ubiquiti, MikroTik, structured cabling |
| Nology | Enterprise IT | Servers, storage, UPS, workstations |
| Rectron | Broadest range | Everything else, consumer/SME hardware |
| Duxbury Networking | Enterprise networking | Cisco, Fortinet, F5, Juniper |
| Drive Control Corp (DCC) | Consumer electronics | Logitech, gaming, peripherals |
| Pinnacle Micro | Apple, computing | Apple devices, accessories |
| WD Distributors | Western Digital | Storage-focused |

*Note: Duxbury, DCC, Pinnacle, and WD are not yet in the skill but can be added using the template above.*

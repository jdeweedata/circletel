# Competitor Analysis Module - Technical Architecture

## System Overview

The Competitor Analysis Module is a market intelligence system that scrapes competitor pricing data from South African telecom providers, stores historical trends, and provides actionable insights for pricing strategy.

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    DATA FLOW                                             │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────────────────────────┐
                    │                      EXTERNAL SOURCES                           │
                    │                                                                 │
                    │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
                    │   │  MTN    │  │ Vodacom │  │  Rain   │  │Afrihost │   ...     │
                    │   │ Website │  │ Website │  │ Website │  │ Website │           │
                    │   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘           │
                    │        │            │            │            │                 │
                    └────────┼────────────┼────────────┼────────────┼─────────────────┘
                             │            │            │            │
                             └────────────┴─────┬──────┴────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FIRECRAWL.DEV                                          │
│                                                                                          │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                     │
│   │  JavaScript     │    │  Structured     │    │  Rate Limiting  │                     │
│   │  Rendering      │───▶│  Extraction     │───▶│  & Caching      │                     │
│   │  (Headless)     │    │  (Schema-based) │    │                 │                     │
│   └─────────────────┘    └─────────────────┘    └────────┬────────┘                     │
│                                                          │                               │
└──────────────────────────────────────────────────────────┼───────────────────────────────┘
                                                           │
                                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              CIRCLETEL BACKEND                                           │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         lib/competitor-analysis/                                 │   │
│   │                                                                                  │   │
│   │   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐          │   │
│   │   │ firecrawl-client │    │   providers/     │    │  price-matcher   │          │   │
│   │   │                  │    │                  │    │                  │          │   │
│   │   │ • scrapeUrl()    │───▶│ • BaseProvider   │───▶│ • autoMatch()    │          │   │
│   │   │ • extractData()  │    │ • MTNProvider    │    │ • confidence()   │          │   │
│   │   │ • mapSite()      │    │ • VodacomProv.   │    │                  │          │   │
│   │   │                  │    │ • RainProvider   │    │                  │          │   │
│   │   └──────────────────┘    └──────────────────┘    └──────────────────┘          │   │
│   │                                     │                       │                    │   │
│   │                                     ▼                       ▼                    │   │
│   │                          ┌──────────────────────────────────────────┐            │   │
│   │                          │          analysis-engine.ts              │            │   │
│   │                          │                                          │            │   │
│   │                          │ • compareProducts()                      │            │   │
│   │                          │ • calculatePosition()                    │            │   │
│   │                          │ • findOpportunities()                    │            │   │
│   │                          │ • findRisks()                            │            │   │
│   │                          └────────────────┬─────────────────────────┘            │   │
│   │                                           │                                      │   │
│   └───────────────────────────────────────────┼──────────────────────────────────────┘   │
│                                               │                                          │
│   ┌───────────────────────────────────────────┼──────────────────────────────────────┐   │
│   │                     app/api/admin/competitor-analysis/                           │   │
│   │                                           │                                      │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌────┴────────┐  ┌─────────────┐            │   │
│   │   │  /providers │  │   /scrape   │  │  /compare   │  │  /matches   │            │   │
│   │   │             │  │             │  │             │  │             │            │   │
│   │   │ GET/POST    │  │ POST trigger│  │ GET data    │  │ GET/POST    │            │   │
│   │   │ PUT/DELETE  │  │ GET status  │  │             │  │ DELETE      │            │   │
│   │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │   │
│   │                                                                                  │   │
│   └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                               │                                          │
└───────────────────────────────────────────────┼──────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  SUPABASE DATABASE                                       │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                              Core Tables                                         │   │
│   │                                                                                  │   │
│   │   ┌─────────────────────┐         ┌─────────────────────┐                       │   │
│   │   │ competitor_providers │◄───────│  competitor_products │                       │   │
│   │   │                     │   1:N   │                     │                       │   │
│   │   │ • id                │         │ • id                │                       │   │
│   │   │ • name, slug        │         │ • provider_id (FK)  │                       │   │
│   │   │ • scrape_urls       │         │ • product_name      │                       │   │
│   │   │ • is_active         │         │ • monthly_price     │                       │   │
│   │   │ • last_scraped_at   │         │ • is_current        │                       │   │
│   │   └─────────────────────┘         └──────────┬──────────┘                       │   │
│   │                                              │                                   │   │
│   │           ┌──────────────────────────────────┼──────────────────────────┐       │   │
│   │           │                                  │                          │       │   │
│   │           ▼                                  ▼                          ▼       │   │
│   │   ┌─────────────────────┐         ┌─────────────────────┐  ┌─────────────────┐  │   │
│   │   │competitor_price_    │         │product_competitor_  │  │competitor_scrape│  │   │
│   │   │      history        │         │     matches         │  │     _logs       │  │   │
│   │   │                     │         │                     │  │                 │  │   │
│   │   │ • monthly_price     │         │ • product_type      │  │ • status        │  │   │
│   │   │ • recorded_at       │         │ • product_id        │  │ • products_found│  │   │
│   │   │                     │         │ • match_confidence  │  │ • error_message │  │   │
│   │   └─────────────────────┘         └─────────────────────┘  └─────────────────┘  │   │
│   │                                                                                  │   │
│   └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                 Views                                            │   │
│   │                                                                                  │   │
│   │   ┌─────────────────────────────┐    ┌─────────────────────────────┐            │   │
│   │   │ v_competitor_price_comparison│    │ v_competitor_provider_stats │            │   │
│   │   │                             │    │                             │            │   │
│   │   │ Joins matches + products    │    │ Aggregate stats per provider│            │   │
│   │   │ for comparison queries      │    │ (count, avg, min, max)      │            │   │
│   │   └─────────────────────────────┘    └─────────────────────────────┘            │   │
│   │                                                                                  │   │
│   └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                                │
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ADMIN UI                                              │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                     app/admin/competitor-analysis/                               │   │
│   │                                                                                  │   │
│   │   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐               │   │
│   │   │   Dashboard     │   │   Providers     │   │    Matches      │               │   │
│   │   │                 │   │                 │   │                 │               │   │
│   │   │ • Stats cards   │   │ • Provider list │   │ • Match table   │               │   │
│   │   │ • Alerts        │   │ • Add/edit      │   │ • Auto-match    │               │   │
│   │   │ • Quick actions │   │ • Scrape trigger│   │ • Manual link   │               │   │
│   │   │ • Charts        │   │                 │   │                 │               │   │
│   │   └─────────────────┘   └─────────────────┘   └─────────────────┘               │   │
│   │                                                                                  │   │
│   └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                     components/admin/competitor-analysis/                        │   │
│   │                                                                                  │   │
│   │   • CompetitorDashboard.tsx    • PriceHistoryChart.tsx                          │   │
│   │   • PriceComparisonTable.tsx   • MarketPositionChart.tsx                        │   │
│   │   • ProviderCard.tsx           • MatchingInterface.tsx                          │   │
│   │                                                                                  │   │
│   └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              COMPONENT HIERARCHY                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

app/admin/competitor-analysis/
│
├── page.tsx (Dashboard)
│   │
│   ├── <CompetitorDashboard />
│   │   ├── <StatsCard /> x 4 (Providers, Products, Last Scrape, Alerts)
│   │   ├── <AlertList />
│   │   └── <QuickActions />
│   │
│   ├── <PriceComparisonTable />
│   │   ├── <TableHeader /> (sortable columns)
│   │   ├── <TableRow /> x N
│   │   │   ├── Your product cell
│   │   │   ├── Competitor price cells x N
│   │   │   └── Position badge (competitive/above/below)
│   │   └── <TablePagination />
│   │
│   └── <MarketPositionChart />
│       └── <Recharts.BarChart /> or <Recharts.RadarChart />
│
├── providers/
│   └── page.tsx (Provider Management)
│       │
│       ├── <ProviderGrid />
│       │   └── <ProviderCard /> x N
│       │       ├── Logo + Name + Type badge
│       │       ├── Stats (products, last scrape)
│       │       ├── Status indicator (active/inactive)
│       │       └── Action dropdown (edit, scrape, delete)
│       │
│       └── <AddProviderModal />
│           ├── Name, website, type inputs
│           ├── URL list editor
│           └── Scrape frequency selector
│
├── matches/
│   └── page.tsx (Product Matching)
│       │
│       └── <MatchingInterface />
│           ├── <UnmatchedProducts /> (left panel)
│           │   └── <ProductCard /> x N (CircleTel products)
│           │
│           ├── <CompetitorSearch /> (right panel)
│           │   ├── Search input
│           │   └── <CompetitorProductCard /> x N
│           │
│           └── <MatchConfirmModal />
│               ├── Product comparison
│               ├── Confidence score input
│               └── Notes textarea
│
└── [provider]/
    └── page.tsx (Provider Detail)
        │
        ├── <ProviderHeader />
        │   ├── Logo + Name + Status
        │   ├── Last scraped timestamp
        │   └── Scrape button
        │
        ├── <ProductsTable />
        │   ├── Product name, type, price columns
        │   ├── Match status column
        │   └── Source URL link
        │
        ├── <ScrapeHistoryLog />
        │   └── Log entries with status, counts, timestamps
        │
        └── <PriceHistoryChart />
            └── <Recharts.LineChart />
```

---

## Scrape Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SCRAPE WORKFLOW                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

   ┌────────────────┐
   │ Admin triggers │
   │ scrape (manual │
   │  or scheduled) │
   └───────┬────────┘
           │
           ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │                        POST /api/admin/competitor-analysis/scrape         │
   │                                                                           │
   │   1. Validate request (providerId or all=true)                           │
   │   2. Get provider(s) with scrape_urls                                    │
   │   3. Create scrape_log entry (status: 'running')                         │
   │   4. Return { jobId, status: 'started' }                                 │
   │                                                                           │
   └───────────────────────────────┬───────────────────────────────────────────┘
                                   │
                                   ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │                         FOR EACH PROVIDER                                 │
   │                                                                           │
   │   ┌─────────────────────────────────────────────────────────────────┐    │
   │   │                     FOR EACH scrape_url                          │    │
   │   │                                                                  │    │
   │   │   1. Call Firecrawl with extraction schema                      │    │
   │   │      firecrawl.extract({                                        │    │
   │   │        urls: [url],                                             │    │
   │   │        schema: provider.getExtractionSchema()                   │    │
   │   │      })                                                         │    │
   │   │                                                                  │    │
   │   │   2. Parse response data                                        │    │
   │   │      products = provider.parseProducts(response)                │    │
   │   │                                                                  │    │
   │   │   3. Normalize prices                                           │    │
   │   │      products.forEach(p => provider.normalizePrice(p))          │    │
   │   │                                                                  │    │
   │   └──────────────────────────────┬───────────────────────────────────┘    │
   │                                  │                                        │
   │                                  ▼                                        │
   │   ┌─────────────────────────────────────────────────────────────────┐    │
   │   │                    DATABASE OPERATIONS                           │    │
   │   │                                                                  │    │
   │   │   FOR EACH scraped product:                                     │    │
   │   │                                                                  │    │
   │   │   1. Check if product exists (by external_id)                   │    │
   │   │      ├─ EXISTS: Compare prices                                  │    │
   │   │      │  ├─ SAME: Update scraped_at only                        │    │
   │   │      │  └─ DIFFERENT:                                           │    │
   │   │      │     • Mark old as is_current=false                       │    │
   │   │      │     • Insert new with is_current=true                    │    │
   │   │      │     • Insert into price_history                          │    │
   │   │      │                                                          │    │
   │   │      └─ NOT EXISTS:                                             │    │
   │   │         • Insert new product (is_current=true)                  │    │
   │   │         • Insert into price_history                             │    │
   │   │                                                                  │    │
   │   │   2. Track counts (found, updated, new)                         │    │
   │   │                                                                  │    │
   │   └──────────────────────────────────────────────────────────────────┘    │
   │                                                                           │
   │   Update provider.last_scraped_at                                        │
   │                                                                           │
   └───────────────────────────────┬───────────────────────────────────────────┘
                                   │
                                   ▼
   ┌───────────────────────────────────────────────────────────────────────────┐
   │                         COMPLETE SCRAPE JOB                               │
   │                                                                           │
   │   1. Update scrape_log:                                                  │
   │      • status: 'completed' (or 'failed')                                 │
   │      • products_found, products_updated, products_new                    │
   │      • completed_at: NOW()                                               │
   │      • error_message: (if failed)                                        │
   │                                                                           │
   │   2. Detect significant price changes (>10%)                             │
   │      • Queue alerts if needed                                            │
   │                                                                           │
   │   3. Run auto-match for new products                                     │
   │      • Match against CircleTel products                                  │
   │      • Store matches with confidence scores                              │
   │                                                                           │
   └───────────────────────────────────────────────────────────────────────────┘
```

---

## Provider Abstraction

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PROVIDER CLASS HIERARCHY                                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                           ┌─────────────────────────────┐
                           │      <<abstract>>           │
                           │       BaseProvider          │
                           │                             │
                           │ + name: string              │
                           │ + slug: string              │
                           │ + providerType: ProviderType│
                           │ + scrapeUrls: string[]      │
                           │                             │
                           │ + scrape(): Promise<...>    │
                           │ + getExtractionSchema(): {} │
                           │ # parseProducts(raw): []    │
                           │ # normalizePrice(p): void   │
                           │ # extractPrice(str): number │
                           │ # parseDataBundle(str): GB  │
                           └──────────────┬──────────────┘
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            │                             │                             │
            ▼                             ▼                             ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│     MTNProvider       │   │   VodacomProvider     │   │    RainProvider       │
│                       │   │                       │   │                       │
│ # parseProducts()     │   │ # parseProducts()     │   │ # parseProducts()     │
│   - Parse MTN deal    │   │   - Parse Vodacom     │   │   - Parse Rain 5G     │
│     structure         │   │     structure         │   │     plans             │
│                       │   │                       │   │                       │
│ # normalizePrice()    │   │ # normalizePrice()    │   │ # normalizePrice()    │
│   - MTN VAT handling  │   │   - Vodacom VAT       │   │   - Rain VAT          │
│                       │   │                       │   │                       │
│ + getExtractionSchema │   │ + getExtractionSchema │   │ + getExtractionSchema │
│   - MTN-specific      │   │   - Vodacom-specific  │   │   - Rain-specific     │
│     selectors         │   │     selectors         │   │     selectors         │
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘
            │
            │
            ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                              MTN EXTRACTION SCHEMA                                     │
│                                                                                        │
│   {                                                                                   │
│     "products": {                                                                     │
│       "type": "array",                                                                │
│       "items": {                                                                      │
│         "type": "object",                                                             │
│         "properties": {                                                               │
│           "deviceName": { "type": "string" },                                         │
│           "monthlyPrice": { "type": "string" },                                       │
│           "onceOffPrice": { "type": "string" },                                       │
│           "contractTerm": { "type": "string" },                                       │
│           "dataBundle": { "type": "string" },                                         │
│           "productUrl": { "type": "string" }                                          │
│         }                                                                             │
│       }                                                                               │
│     }                                                                                 │
│   }                                                                                   │
│                                                                                        │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Matching Algorithm

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCT MATCHING ALGORITHM                                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                 ┌───────────────────────────────────────┐
                 │        CircleTel Product              │
                 │                                       │
                 │   • product_type: "mtn_dealer"        │
                 │   • monthly_price: R499               │
                 │   • data_bundle: "50GB"               │
                 │   • contract_term: 24                 │
                 │   • technology: "LTE"                 │
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     │
                                     ▼
   ┌─────────────────────────────────────────────────────────────────────────────────┐
   │                            MATCHING CRITERIA                                     │
   │                                                                                  │
   │   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐           │
   │   │  Data Bundle (40%)│  │   Price Range     │  │  Technology (20%) │           │
   │   │                   │  │      (25%)        │  │                   │           │
   │   │  Exact: 1.0       │  │  ±10%: 1.0        │  │  Exact: 1.0       │           │
   │   │  ±5GB: 0.8        │  │  ±20%: 0.7        │  │  LTE≈4G: 0.8      │           │
   │   │  ±10GB: 0.6       │  │  ±30%: 0.4        │  │  5G≈4G: 0.6       │           │
   │   │  >10GB diff: 0.3  │  │  >30%: 0.1        │  │  Mismatch: 0.3    │           │
   │   └───────────────────┘  └───────────────────┘  └───────────────────┘           │
   │                                                                                  │
   │   ┌───────────────────┐                                                          │
   │   │  Contract Term    │                                                          │
   │   │      (15%)        │                                                          │
   │   │                   │                                                          │
   │   │  Exact: 1.0       │                                                          │
   │   │  ±6mo: 0.7        │                                                          │
   │   │  >6mo diff: 0.4   │                                                          │
   │   └───────────────────┘                                                          │
   │                                                                                  │
   └─────────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
   ┌─────────────────────────────────────────────────────────────────────────────────┐
   │                          CONFIDENCE CALCULATION                                  │
   │                                                                                  │
   │   confidence = (dataScore * 0.40) +                                             │
   │                (priceScore * 0.25) +                                            │
   │                (techScore * 0.20) +                                             │
   │                (termScore * 0.15)                                               │
   │                                                                                  │
   │   Example:                                                                       │
   │     dataScore = 0.8 (±5GB)                                                      │
   │     priceScore = 1.0 (within 10%)                                               │
   │     techScore = 1.0 (exact match)                                               │
   │     termScore = 1.0 (exact match)                                               │
   │                                                                                  │
   │     confidence = (0.8 * 0.40) + (1.0 * 0.25) + (1.0 * 0.20) + (1.0 * 0.15)      │
   │                = 0.32 + 0.25 + 0.20 + 0.15                                      │
   │                = 0.92 (92% confidence)                                          │
   │                                                                                  │
   └─────────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
   ┌─────────────────────────────────────────────────────────────────────────────────┐
   │                           AUTO-MATCH THRESHOLDS                                  │
   │                                                                                  │
   │   confidence >= 0.85  →  Auto-create match (method: "auto")                     │
   │   confidence >= 0.60  →  Suggest for review (show in UI)                        │
   │   confidence < 0.60   →  Ignore (not a match)                                   │
   │                                                                                  │
   └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### Firecrawl.dev

```typescript
// Firecrawl SDK integration
import Firecrawl from '@mendable/firecrawl-js';

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY!
});

// Extract structured data
const response = await firecrawl.extract({
  urls: ['https://www.mtn.co.za/shop/deals/devices/phones'],
  schema: {
    products: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          deviceName: { type: 'string' },
          monthlyPrice: { type: 'string' },
          dataBundle: { type: 'string' }
        }
      }
    }
  }
});
```

### Supabase (Service Role)

```typescript
// All competitor analysis tables use service role (RLS: admin-only)
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient(); // Uses service role

  // Direct database access bypasses RLS
  const { data } = await supabase
    .from('competitor_products')
    .insert(products);
}
```

### CircleTel Product Tables

The matching system connects to existing product tables:
- `mtn_dealer_products` - MTN dealer products
- `service_packages` - Fibre/LTE packages
- `product_catalog` - General products

---

## Security Considerations

1. **RLS Policies**: All tables admin-only via service role
2. **API Authentication**: Admin routes require authenticated admin user
3. **Firecrawl API Key**: Stored in environment variable, never exposed to client
4. **Rate Limiting**: Respect target site limits, use delays between requests
5. **Data Validation**: Validate scraped data before database insertion
6. **Audit Trail**: All scrape operations logged with timestamps

---

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried columns indexed
2. **Views**: Pre-computed aggregations for dashboard stats
3. **Caching**: Consider Redis for comparison query results (future)
4. **Pagination**: All list endpoints support limit/offset
5. **Timeouts**: Scrape jobs have 5-minute timeout in Vercel
6. **Background Processing**: Long scrapes run async, poll for status
